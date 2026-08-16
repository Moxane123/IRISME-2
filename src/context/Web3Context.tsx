import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import {
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN_ID,
  ChainConfig,
  getChainConfig,
  isChainSupported,
} from '../config';
import {
  BlockchainService,
  parseWeb3Error,
} from '../services/blockchainService';
import { SupportedToken, PaymentStatus } from '../types';
import {
  TxLifecycleStatus,
  Web3Error,
  PreparedTransaction,
  SubmittedTransactionReceipt,
  WalletBalances,
} from '../types/web3';

interface Web3ContextType {
  // Connection state
  isAvailable: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  address: string;
  chainId: number;
  currentChain?: ChainConfig;
  targetChainId: number;
  isWrongNetwork: boolean;
  walletMode: 'injected' | 'custom' | 'demo';
  balances: WalletBalances;
  error: Web3Error | null;
  clearError: () => void;

  // Actions
  connectInjected: () => Promise<boolean>;
  connectDemo: (customAddress?: string) => void;
  disconnect: () => void;
  switchTargetNetwork: (targetChainId: number) => Promise<boolean>;
  refreshBalances: () => Promise<void>;
  getNativeGasBalance: (chainId: number) => number;

  // Transaction execution
  executePaymentOnChain: (params: {
    merchantAddress: string;
    token: SupportedToken;
    tokenAmount: number;
    paymentId: string;
    chainId?: number;
    onStatusUpdate?: (status: TxLifecycleStatus, txHash?: string) => void;
  }) => Promise<{
    success: boolean;
    txHash: string;
    receipt?: SubmittedTransactionReceipt;
    isRealOnChain: boolean;
  }>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

const WEB3_STORAGE_KEY = 'irisme_web3_state_v3';

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [targetChainId, setTargetChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [walletMode, setWalletMode] = useState<'injected' | 'custom' | 'demo'>('demo');
  const [error, setError] = useState<Web3Error | null>(null);

  const [balances, setBalances] = useState<WalletBalances>({
    VERSE: 25000,
    USDT: 500.0,
    USDC: 500.0,
    DAI: 200.0,
    ETH: 0.85,
    WBTC: 0.025,
    MATIC: 150.0,
    BNB: 1.5,
    AVAX: 8.0,
    SOL: 2.4,
    BTC: 0.025,
    TRX: 450.0,
  });

  const getNativeGasBalance = useCallback((queryChainId: number): number => {
    if (queryChainId === 137 || queryChainId === 80002) {
      return balances.MATIC ?? 0;
    } else if (queryChainId === 56) {
      return balances.BNB ?? 0;
    } else if (queryChainId === 43114) {
      return balances.AVAX ?? 0;
    } else {
      return balances.ETH ?? 0;
    }
  }, [balances]);

  const clearError = () => setError(null);

  // Check if window.ethereum is present on mount
  useEffect(() => {
    const available = BlockchainService.isEthereumAvailable();
    setIsAvailable(available);

    // Restore previous connection session if any
    const saved = localStorage.getItem(WEB3_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.address && parsed.isConnected) {
          setAddress(parsed.address);
          setIsConnected(true);
          setWalletMode(parsed.walletMode || 'injected');
          if (parsed.chainId) setChainId(parsed.chainId);
        }
      } catch {}
    }
  }, []);

  // Current chain config
  const currentChain = getChainConfig(chainId);
  // Wrong network detection: if connected to injected wallet and chain is not in supported chains or differs from target
  const isWrongNetwork = isConnected && walletMode === 'injected' && (!isChainSupported(chainId) || chainId !== targetChainId);

  // Refresh balances whenever address or chainId changes
  const refreshBalances = useCallback(async () => {
    if (!address) return;
    try {
      if (walletMode === 'injected' || (walletMode === 'custom' && ethers.isAddress(address))) {
        const liveBalances = await BlockchainService.fetchBalances(address, chainId);
        setBalances((prev) => ({
          ...prev,
          ...liveBalances,
        }));
      }
    } catch (e) {
      console.warn('Could not refresh on-chain balances:', e);
    }
  }, [address, chainId, walletMode]);

  useEffect(() => {
    if (isConnected && address) {
      refreshBalances();
    }
  }, [isConnected, address, chainId, refreshBalances]);

  // Listen to window.ethereum EIP-1193 events (accountsChanged, chainChanged, disconnect)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        // User disconnected wallet in extension
        setIsConnected(false);
        setAddress('');
        localStorage.removeItem(WEB3_STORAGE_KEY);
      } else {
        const newAddress = ethers.getAddress(accounts[0]);
        setAddress(newAddress);
        setIsConnected(true);
        setWalletMode('injected');
        localStorage.setItem(
          WEB3_STORAGE_KEY,
          JSON.stringify({ address: newAddress, chainId, walletMode: 'injected', isConnected: true })
        );
      }
    };

    const handleChainChanged = (hexChainId: string) => {
      const newChainId = parseInt(hexChainId, 16);
      setChainId(newChainId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setAddress('');
      localStorage.removeItem(WEB3_STORAGE_KEY);
    };

    try {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    } catch (err) {
      console.warn('Failed to attach Ethereum event listeners:', err);
    }

    return () => {
      if (window.ethereum?.removeListener) {
        try {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
          window.ethereum.removeListener('disconnect', handleDisconnect);
        } catch {}
      }
    };
  }, [chainId]);

  // Connect Injected EVM Wallet (MetaMask, Rabby, Coinbase, etc.)
  const connectInjected = async (): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await BlockchainService.connectWallet();
      setAddress(result.address);
      setChainId(result.chainId);
      setIsConnected(true);
      setWalletMode('injected');

      localStorage.setItem(
        WEB3_STORAGE_KEY,
        JSON.stringify({
          address: result.address,
          chainId: result.chainId,
          walletMode: 'injected',
          isConnected: true,
        })
      );

      setIsConnecting(false);
      return true;
    } catch (err: any) {
      const parsed = parseWeb3Error(err);
      setError(parsed);
      setIsConnecting(false);
      return false;
    }
  };

  // Connect Demo or Custom Address
  const connectDemo = (customAddress?: string) => {
    let finalAddress: string;
    if (customAddress && ethers.isAddress(customAddress)) {
      finalAddress = ethers.getAddress(customAddress);
    } else {
      // Generate clean random session address for demo testing
      finalAddress = ethers.Wallet.createRandom().address;
    }

    const mode = customAddress && ethers.isAddress(customAddress) ? 'custom' : 'demo';
    setAddress(finalAddress);
    setChainId(DEFAULT_CHAIN_ID);
    setTargetChainId(DEFAULT_CHAIN_ID);
    setIsConnected(true);
    setWalletMode(mode);
    setError(null);

    localStorage.setItem(
      WEB3_STORAGE_KEY,
      JSON.stringify({
        address: finalAddress,
        chainId: DEFAULT_CHAIN_ID,
        walletMode: mode,
        isConnected: true,
      })
    );
  };

  // Disconnect
  const disconnect = () => {
    setIsConnected(false);
    setAddress('');
    setError(null);
    localStorage.removeItem(WEB3_STORAGE_KEY);
  };

  // Switch network
  const switchTargetNetwork = async (targetId: number): Promise<boolean> => {
    setTargetChainId(targetId);
    setError(null);

    if (walletMode === 'injected' && isAvailable) {
      try {
        await BlockchainService.switchNetwork(targetId);
        setChainId(targetId);
        return true;
      } catch (err: any) {
        const parsed = parseWeb3Error(err);
        setError(parsed);
        return false;
      }
    } else {
      // In demo mode simply switch the state
      setChainId(targetId);
      return true;
    }
  };

  // Execute payment transaction with strict lifecycle verification
  const executePaymentOnChain = async (params: {
    merchantAddress: string;
    token: SupportedToken;
    tokenAmount: number;
    paymentId: string;
    onStatusUpdate?: (status: TxLifecycleStatus, txHash?: string) => void;
  }): Promise<{
    success: boolean;
    txHash: string;
    receipt?: SubmittedTransactionReceipt;
    isRealOnChain: boolean;
  }> => {
    const { merchantAddress, token, tokenAmount, onStatusUpdate } = params;
    setError(null);

    if (!isConnected || !address) {
      throw new Error('Please connect your Web3 wallet first.');
    }

    // If connected via real injected wallet, execute real on-chain transaction
    if (walletMode === 'injected' && isAvailable) {
      try {
        onStatusUpdate?.('preparing');

        // Prepare transaction (gas estimation & balance check)
        const prepared: PreparedTransaction = await BlockchainService.preparePayment({
          fromAddress: address,
          merchantSettlementAddress: merchantAddress,
          token,
          tokenAmount,
          chainId,
        });

        if (!prepared.hasSufficientBalance) {
          throw new Error(
            `Insufficient ${token} balance (${prepared.userBalance} ${token} available, ${tokenAmount} required).`
          );
        }

        // Submit transaction via injected signer
        const receipt = await BlockchainService.submitPayment(prepared, onStatusUpdate);

        // Refresh balances after confirmed block
        refreshBalances();

        return {
          success: true,
          txHash: receipt.txHash,
          receipt,
          isRealOnChain: true,
        };
      } catch (err: any) {
        const parsed = parseWeb3Error(err);
        setError(parsed);
        onStatusUpdate?.('failed');
        throw parsed;
      }
    } else {
      // Demo / Simulator Mode (clearly distinguished)
      onStatusUpdate?.('preparing');
      await new Promise((r) => setTimeout(r, 600));

      onStatusUpdate?.('awaiting_signature');
      await new Promise((r) => setTimeout(r, 800));

      const mockTxHash =
        '0x' +
        Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      onStatusUpdate?.('submitted', mockTxHash);
      await new Promise((r) => setTimeout(r, 900));

      onStatusUpdate?.('confirming', mockTxHash);
      await new Promise((r) => setTimeout(r, 1200));

      onStatusUpdate?.('confirmed', mockTxHash);

      return {
        success: true,
        txHash: mockTxHash,
        isRealOnChain: false,
      };
    }
  };

  return (
    <Web3Context.Provider
      value={{
        isAvailable,
        isConnected,
        isConnecting,
        address,
        chainId,
        currentChain,
        targetChainId,
        isWrongNetwork,
        walletMode,
        balances,
        error,
        clearError,
        connectInjected,
        connectDemo,
        disconnect,
        switchTargetNetwork,
        refreshBalances,
        getNativeGasBalance,
        executePaymentOnChain,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
