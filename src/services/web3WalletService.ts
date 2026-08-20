/**
 * Web3 Wallet Connector Service for IRISME
 * Production-ready multi-provider support:
 * - Injected EIP-1193 / EIP-6963 (MetaMask, Rabby, Brave, Trust, Coinbase, OKX)
 * - Coinbase Wallet Extension & Mobile SDK
 * - Trust Wallet Extension & Deep-link
 * - WalletConnect v2 / Reown AppKit Universal Provider
 */

import { ethers } from 'ethers';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN_ID, getChainConfig } from '../config';


export type WalletType = 'metamask' | 'trust' | 'coinbase' | 'walletconnect' | 'injected';

export interface WalletOption {
  id: WalletType;
  name: string;
  icon: string;
  description: string;
  badge?: string;
  downloadUrl?: string;
  deepLink?: (url: string) => string;
}

export interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: any;
}

export interface WalletConnectionResult {
  address: string;
  chainId: number;
  walletType: WalletType;
  provider: any;
}

// Default Reown / WalletConnect Project ID (fallback if env var not configured)
const DEFAULT_PROJECT_ID = 'c4f79cc821944d9680842e34466bfbd';

export class Web3WalletService {
  private static wcProvider: any = null;
  private static discoveredEIP6963Providers: Map<string, EIP6963ProviderDetail> = new Map();
  private static isEIP6963Listening = false;

  private static eip6963Listeners: Set<(providers: EIP6963ProviderDetail[]) => void> = new Set();

  /**
   * Listen for EIP-6963 wallet announcements
   */
  public static initEIP6963(onUpdate?: () => void) {
    this.initEIP6963Listener(onUpdate);
  }

  public static subscribeEIP6963(callback: (providers: EIP6963ProviderDetail[]) => void): () => void {
    this.eip6963Listeners.add(callback);
    this.initEIP6963Listener();
    callback(this.getDiscoveredProviders());
    return () => {
      this.eip6963Listeners.delete(callback);
    };
  }

  public static initEIP6963Listener(onUpdate?: () => void) {
    if (typeof window === 'undefined' || this.isEIP6963Listening) return;

    this.isEIP6963Listening = true;

    window.addEventListener('eip6963:announceProvider', (event: any) => {
      if (event.detail && event.detail.info) {
        this.discoveredEIP6963Providers.set(event.detail.info.rdns || event.detail.info.uuid, event.detail);
        const providers = this.getDiscoveredProviders();
        this.eip6963Listeners.forEach((cb) => cb(providers));
        if (onUpdate) onUpdate();
      }
    });

    // Dispatch request for providers
    window.dispatchEvent(new Event('eip6963:requestProvider'));
  }

  public static getDiscoveredProviders(): EIP6963ProviderDetail[] {
    return Array.from(this.discoveredEIP6963Providers.values());
  }

  public static async switchNetwork(provider: any, targetChainId: number): Promise<void> {
    return this.switchChain(provider, targetChainId);
  }

  /**
   * Checks if a specific wallet extension or provider is available in browser
   */
  public static isWalletAvailable(type: WalletType): boolean {
    if (typeof window === 'undefined') return false;

    switch (type) {
      case 'metamask':
        return Boolean(
          (window as any).ethereum?.isMetaMask ||
          (window as any).ethereum?.providers?.some((p: any) => p.isMetaMask)
        );
      case 'coinbase':
        return Boolean(
          (window as any).coinbaseWalletExtension ||
          (window as any).ethereum?.isCoinbaseWallet
        );
      case 'trust':
        return Boolean(
          (window as any).trustwallet ||
          (window as any).ethereum?.isTrust ||
          (window as any).ethereum?.isTrustWallet
        );
      case 'injected':
        return Boolean((window as any).ethereum);
      case 'walletconnect':
        return true; // WalletConnect is always available via QR / Reown
      default:
        return Boolean((window as any).ethereum);
    }
  }

  /**
   * Returns specific injected provider for a given wallet type
   */
  private static getInjectedProvider(type: WalletType): any {
    if (typeof window === 'undefined') return null;

    const win = window as any;

    if (type === 'metamask') {
      if (win.ethereum?.providers?.length) {
        const mm = win.ethereum.providers.find((p: any) => p.isMetaMask && !p.isBraveWallet);
        if (mm) return mm;
      }
      if (win.ethereum?.isMetaMask) return win.ethereum;
    }

    if (type === 'coinbase') {
      if (win.coinbaseWalletExtension) return win.coinbaseWalletExtension;
      if (win.ethereum?.providers?.length) {
        const cb = win.ethereum.providers.find((p: any) => p.isCoinbaseWallet);
        if (cb) return cb;
      }
      if (win.ethereum?.isCoinbaseWallet) return win.ethereum;
    }

    if (type === 'trust') {
      if (win.trustwallet) return win.trustwallet;
      if (win.ethereum?.providers?.length) {
        const tw = win.ethereum.providers.find((p: any) => p.isTrust || p.isTrustWallet);
        if (tw) return tw;
      }
      if (win.ethereum?.isTrust || win.ethereum?.isTrustWallet) return win.ethereum;
    }

    // Default injected
    return win.ethereum || null;
  }

  /**
   * Gets Reown / WalletConnect Project ID from environment
   */
  public static getProjectId(): string {
    const envId = (import.meta as any).env?.VITE_REOWN_PROJECT_ID || (import.meta as any).env?.VITE_WALLETCONNECT_PROJECT_ID;
    if (envId && envId !== 'YOUR_REOWN_PROJECT_ID' && envId.trim() !== '') {
      return envId.trim();
    }
    return DEFAULT_PROJECT_ID;
  }

  /**
   * Connect to wallet with standard real connection flow
   */
  public static async connect(walletType: WalletType, customProvider?: any): Promise<WalletConnectionResult> {
    if (walletType === 'walletconnect') {
      return this.connectWalletConnect();
    }

    const provider = customProvider || this.getInjectedProvider(walletType);

    if (!provider) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        this.openMobileWalletDeepLink(walletType);
        throw new Error(`Redirecting to ${walletType} mobile app. Please approve the connection request there.`);
      }
      throw new Error(
        `${walletType.toUpperCase()} is not installed in this browser. Please install the browser extension or use WalletConnect.`
      );
    }

    try {
      // Standard EIP-1102 / EIP-1193 eth_requestAccounts
      // This forces the wallet to open its native prompt and ask the user to approve connecting to IRISME.
      const accounts: string[] = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected in your wallet.');
      }

      const rawAddress = accounts[0];
      const address = ethers.getAddress(rawAddress);

      // Query chain ID
      let chainId = DEFAULT_CHAIN_ID;
      try {
        const hexChainId = await provider.request({ method: 'eth_chainId' });
        if (hexChainId) {
          chainId = typeof hexChainId === 'string' ? parseInt(hexChainId, 16) : Number(hexChainId);
        }
      } catch {
        // Fallback to default
        chainId = DEFAULT_CHAIN_ID;
      }

      return {
        address,
        chainId,
        walletType,
        provider,
      };
    } catch (err: any) {
      if (
        err.code === 4001 ||
        err.code === 'ACTION_REJECTED' ||
        err.message?.includes('User rejected') ||
        err.message?.includes('user rejected') ||
        err.message?.includes('User denied')
      ) {
        const rejectedError = new Error('Wallet connection rejected.');
        (rejectedError as any).code = 4001;
        (rejectedError as any).isUserRejection = true;
        throw rejectedError;
      }

      if (err.code === -32002 || err.message?.includes('already pending')) {
        const pendingError = new Error('A wallet connection request is already pending in your extension.');
        (pendingError as any).code = -32002;
        throw pendingError;
      }

      throw err;
    }
  }

  /**
   * Connect via official WalletConnect / Reown
   */
  public static async connectWalletConnect(): Promise<WalletConnectionResult> {
    const projectId = this.getProjectId();

    try {
      if (this.wcProvider) {
        try {
          await this.wcProvider.disconnect();
        } catch {}
      }

      const supportedChainIds = Object.keys(SUPPORTED_CHAINS).map(Number);

      const { EthereumProvider } = await import('@walletconnect/ethereum-provider');

      this.wcProvider = await EthereumProvider.init({
        projectId,
        chains: [DEFAULT_CHAIN_ID],
        optionalChains: supportedChainIds,
        showQrModal: true,
        metadata: {
          name: 'IRISME',
          description: 'Web3 Merchant Payments & Verse Rewards',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://irisme.io',
          icons: ['https://assets.coingecko.com/coins/images/28399/large/verse.png'],
        },
      });


      // Enable WalletConnect session - opens native Reown modal / QR code
      const accounts = await this.wcProvider.enable();

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected in WalletConnect.');
      }

      const address = ethers.getAddress(accounts[0]);
      const chainId = this.wcProvider.chainId ? Number(this.wcProvider.chainId) : DEFAULT_CHAIN_ID;

      return {
        address,
        chainId,
        walletType: 'walletconnect',
        provider: this.wcProvider,
      };
    } catch (err: any) {
      if (
        err.code === 4001 ||
        err.code === 5000 ||
        err.message?.includes('User rejected') ||
        err.message?.includes('user rejected') ||
        err.message?.includes('User denied') ||
        err.message?.includes('Modal closed') ||
        err.message?.includes('Connection request reset')
      ) {
        const rejectedError = new Error('Wallet connection rejected.');
        (rejectedError as any).code = 4001;
        (rejectedError as any).isUserRejection = true;
        throw rejectedError;
      }

      throw new Error(err?.message || 'WalletConnect connection failed.');
    }
  }

  /**
   * Disconnect any active WalletConnect session
   */
  public static async disconnect(): Promise<void> {
    if (this.wcProvider) {
      try {
        await this.wcProvider.disconnect();
      } catch {}
      this.wcProvider = null;
    }
  }

  /**
   * Switch chain on active provider
   */
  public static async switchChain(provider: any, targetChainId: number): Promise<void> {
    if (!provider) throw new Error('No active wallet provider');

    const chain = getChainConfig(targetChainId);
    if (!chain) throw new Error(`Unsupported network ID: ${targetChainId}`);

    const hexChainId = `0x${targetChainId.toString(16)}`;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      // If error code is 4902, the chain has not been added to MetaMask
      if (switchError.code === 4902 || switchError.message?.includes('wallet_addEthereumChain')) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexChainId,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: chain.rpcUrls,
              blockExplorerUrls: chain.blockExplorerUrls || [],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Mobile wallet deep-linking
   */
  public static openMobileWalletDeepLink(walletType: WalletType) {
    if (typeof window === 'undefined') return;

    const currentUrl = encodeURIComponent(window.location.href);

    switch (walletType) {
      case 'metamask':
        window.location.href = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
        break;
      case 'trust':
        window.location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=${currentUrl}`;
        break;
      case 'coinbase':
        window.location.href = `https://go.cb-w.com/dapp?cb_url=${currentUrl}`;
        break;
      default:
        break;
    }
  }
}
