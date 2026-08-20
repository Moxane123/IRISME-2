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
import {
  VersePaymentService,
  VersePaymentExecutionParams,
  VersePaymentExecutionResult,
  VersePaymentStepUpdate,
} from '../services/versePaymentService';
import {
  Web3WalletService,
  WalletType,
  EIP6963ProviderDetail,
} from '../services/web3WalletService';
import { SupportedToken } from '../types';
import {
  TxLifecycleStatus,
  Web3Error,
  SubmittedTransactionReceipt,
  WalletBalances,
} from '../types/web3';

interface Web3ContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectingWalletType: WalletType | null;
  isLoadingBalances: boolean;
  address: string;
  chainId: number;
  currentChain?: ChainConfig;
  targetChainId: number;
  isWrongNetwork: boolean;
  walletType: WalletType | null;
  discoveredProviders: EIP6963ProviderDetail[];
  balances: WalletBalances;
  error: Web3Error | null;
  clearError: () => void;

  // Actions
  connectWithWallet: (type: WalletType, customProvider?: any) => Promise<boolean>;
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
    verseResult?: VersePaymentExecutionResult;
  }>;

  // Dedicated VERSE payment flow on Polygon
  executeVersePayment: (params: {
    merchantAddress: string;
    verseAmount: number | string;
    onStepUpdate?: (update: VersePaymentStepUpdate) => void;
  }) => Promise<VersePaymentExecutionResult>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

const WEB3_STORAGE_KEY = 'irisme_web3_session_v4';

const INITIAL_BALANCES: WalletBalances = {
  VERSE: 0,
  USDT: 0,
  USDC: 0,
  DAI: 0,
  ETH: 0,
  WBTC: 0,
  MATIC: 0,
  POL: 0,
  BNB: 0,
  SOL: 0,
  BTC: 0,
  AVAX: 0,
  TRX: 0,
};

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectingWalletType, setConnectingWalletType] = useState<WalletType | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [targetChainId, setTargetChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [discoveredProviders, setDiscoveredProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [balances, setBalances] = useState<WalletBalances>(INITIAL_BALANCES);
  const [error, setError] = useState<Web3Error | null>(null);
  const activeProviderRef = React.useRef<any>(null);

  const clearError = useCallback(() => setError(null), []);

  const currentChain = getChainConfig(chainId);
  const isWrongNetwork = targetChainId !== chainId && !isChainSupported(chainId);

  /**
   * Fetch live balances from blockchain RPC
   */
  const refreshBalances = useCallback(async () => {
    if (!address || !ethers.isAddress(address)) return;

    setIsLoadingBalances(true);
    try {
      const liveBalances = await BlockchainService.fetchBalances(address, chainId || DEFAULT_CHAIN_ID);
      setBalances(liveBalances);
    } catch (err) {
      console.warn('Could not refresh on-chain balances:', err);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [address, chainId]);

  /**
   * Initialize EIP-6963 listeners on startup
   */
  useEffect(() => {
    Web3WalletService.initEIP6963();
    setDiscoveredProviders(Web3WalletService.getDiscoveredProviders());

    const unsubscribe = Web3WalletService.subscribeEIP6963((providers) => {
      setDiscoveredProviders(providers);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Listen for account and chain change events from provider
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        const newAddr = ethers.getAddress(accounts[0]);
        setAddress(newAddr);
        setIsConnected(true);
      } else {
        // Disconnected in wallet
        setAddress('');
        setIsConnected(false);
        setWalletType(null);
        setBalances(INITIAL_BALANCES);
        try {
          localStorage.removeItem(WEB3_STORAGE_KEY);
        } catch {}
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      try {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
      } catch {}
    };

    try {
      window.ethereum.on?.('accountsChanged', handleAccountsChanged);
      window.ethereum.on?.('chainChanged', handleChainChanged);
    } catch {}

    return () => {
      try {
        window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
      } catch {}
    };
  }, []);

  /**
   * Auto-refresh balances on address/chain changes
   */
  useEffect(() => {
    if (isConnected && address) {
      refreshBalances();
      const interval = setInterval(refreshBalances, 20000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address, chainId, refreshBalances]);

  /**
   * Connect with a specific wallet provider
   */
  const connectWithWallet = async (type: WalletType, customProvider?: any): Promise<boolean> => {
    setIsConnecting(true);
    setConnectingWalletType(type);
    clearError();

    try {
      const result = await Web3WalletService.connect(type, customProvider);
      activeProviderRef.current = result.provider || customProvider || (typeof window !== 'undefined' ? (window as any).ethereum : null);

      setAddress(result.address);
      setChainId(result.chainId);
      setWalletType(result.walletType);
      setIsConnected(true);

      try {
        localStorage.setItem(
          WEB3_STORAGE_KEY,
          JSON.stringify({
            walletType: result.walletType,
            address: result.address,
            connectedAt: Date.now(),
          })
        );
      } catch {}

      return true;
    } catch (err: any) {
      const parsed = parseWeb3Error(err);
      setError(parsed);
      return false;
    } finally {
      setIsConnecting(false);
      setConnectingWalletType(null);
    }
  };

  /**
   * Disconnect wallet session
   */
  const disconnect = () => {
    Web3WalletService.disconnect();
    setIsConnected(false);
    setAddress('');
    setWalletType(null);
    setBalances(INITIAL_BALANCES);
    clearError();

    try {
      localStorage.removeItem(WEB3_STORAGE_KEY);
    } catch {}
  };

  /**
   * Switch connected wallet network
   */
  const switchTargetNetwork = async (newChainId: number): Promise<boolean> => {
    setTargetChainId(newChainId);
    clearError();

    try {
      const p = activeProviderRef.current || (typeof window !== 'undefined' ? (window as any).ethereum : null);
      if (p) {
        await Web3WalletService.switchNetwork(p, newChainId);
        setChainId(newChainId);
        return true;
      }
      return false;
    } catch (err: any) {
      const parsed = parseWeb3Error(err);
      setError(parsed);
      return false;
    }
  };

  /**
   * Get native gas coin balance for a specific chain
   */
  const getNativeGasBalance = useCallback((queryChainId: number): number => {
    if (queryChainId === 137 || queryChainId === 80002) {
      return balances.POL ?? balances.MATIC ?? 0;
    } else if (queryChainId === 56) {
      return balances.BNB ?? 0;
    } else if (queryChainId === 43114) {
      return balances.AVAX ?? 0;
    } else {
      return balances.ETH ?? 0;
    }
  }, [balances]);

  /**
   * Dedicated VERSE payment on Polygon Mainnet (137)
   */
  const executeVersePayment = async (params: {
    merchantAddress: string;
    verseAmount: number | string;
    onStepUpdate?: (update: VersePaymentStepUpdate) => void;
  }): Promise<VersePaymentExecutionResult> => {
    if (!isConnected || !address) {
      throw new Error('Please connect your Web3 wallet first.');
    }
    return VersePaymentService.executePayment(params);
  };

  /**
   * Execute real on-chain transaction
   */
  const executePaymentOnChain = async (params: {
    merchantAddress: string;
    token: SupportedToken;
    tokenAmount: number;
    paymentId: string;
    chainId?: number;
    onStatusUpdate?: (status: TxLifecycleStatus, txHash?: string) => void;
  }): Promise<{
    success: boolean;
    txHash: string;
    receipt?: SubmittedTransactionReceipt;
    isRealOnChain: boolean;
    verseResult?: VersePaymentExecutionResult;
  }> => {
    if (!isConnected || !address) {
      throw new Error('Please connect your Web3 wallet first.');
    }

    const execChainId = params.chainId || chainId;

    // Route VERSE payments through the dedicated VersePaymentService on Polygon
    if (params.token === 'VERSE') {
      const verseRes = await VersePaymentService.executePayment({
        merchantAddress: params.merchantAddress,
        verseAmount: params.tokenAmount,
        onStepUpdate: (update) => {
          if (update.step === 'approving' || update.step === 'awaiting_payment') {
            params.onStatusUpdate?.('awaiting_signature', update.txHash);
          } else if (update.step === 'submitting') {
            params.onStatusUpdate?.('submitted', update.txHash);
          } else if (update.step === 'confirming') {
            params.onStatusUpdate?.('confirming', update.txHash);
          } else if (update.step === 'confirmed') {
            params.onStatusUpdate?.('confirmed', update.txHash);
          } else if (update.step === 'failed') {
            params.onStatusUpdate?.('failed');
          }
        },
      });

      return {
        success: true,
        txHash: verseRes.txHash,
        isRealOnChain: true,
        verseResult: verseRes,
      };
    }

    const receipt = await BlockchainService.executePayment({
      fromAddress: address,
      merchantSettlementAddress: params.merchantAddress,
      token: params.token,
      tokenAmount: params.tokenAmount,
      chainId: execChainId,
      onStatusChange: params.onStatusUpdate,
    });

    return {
      success: true,
      txHash: receipt.txHash,
      receipt,
      isRealOnChain: true,
    };
  };

  return (
    <Web3Context.Provider
      value={{
        isConnected,
        isConnecting,
        connectingWalletType,
        isLoadingBalances,
        address,
        chainId,
        currentChain,
        targetChainId,
        isWrongNetwork,
        walletType,
        discoveredProviders,
        balances,
        error,
        clearError,
        connectWithWallet,
        disconnect,
        switchTargetNetwork,
        refreshBalances,
        getNativeGasBalance,
        executePaymentOnChain,
        executeVersePayment,
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
