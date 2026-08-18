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
  isLoadingBalances: boolean;
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

// Empty real balance baseline - Zero mock numbers
const INITIAL_EMPTY_BALANCES: WalletBalances = {
  VERSE: 0,
  USDT: 0,
  USDC: 0,
  DAI: 0,
  ETH: 0,
  WBTC: 0,
  MATIC: 0,
  POL: 0,
  BNB: 0,
  AVAX: 0,
  SOL: 0,
  BTC: 0,
  TRX: 0,
};

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [targetChainId, setTargetChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [walletMode, setWalletMode] = useState<'injected' | 'custom' | 'demo'>('injected');
  const [error, setError] = useState<Web3Error | null>(null);
  const [balances, setBalances] = useState<WalletBalances>(INITIAL_EMPTY_BALANCES);

  const getNativeGasBalance = useCallback((queryChainId: number): number => {
    if (queryChainId === 137) {
      return balances.POL || balances.MATIC || 0;
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
          if (parsed.chainId) {
            setChainId(parsed.chainId);
            setTargetChainId(parsed.chainId);
          }
        }
      } catch {}
    }
  }, []);

  // Current chain config
  const currentChain = getChainConfig(chainId);
  // Wrong network detection: if connected to injected wallet and chain differs from target
  const isWrongNetwork = isConnected && walletMode === 'injected' && (!isChainSupported(chainId) || chainId !== targetChainId);

  // Refresh real balances whenever address or chainId changes
  const refreshBalances = useCallback(async () => {
    if (!address) return;
    setIsLoadingBalances(true);
    try {
      if (ethers.isAddress(address)) {
        const liveBalances = await BlockchainService.fetchBalances(address, chainId);
        setBalances((prev) => ({
          ...prev,
          ...liveBalances,
        }));
      }
    } catch (e) {
      console.warn('Could not refresh real on-chain balances:', e);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [address, chainId]);

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
        setIsConnected(false);
        setAddress('');
        setBalances(INITIAL_EMPTY_BALANCES);
        localStorage.removeItem(WEB3_STORAGE_KEY);
      } else {
        const newAddress = ethers.getAddress(accounts[0]);
        setAddress(newAddress);
        setIsConnected(true);
        localStorage.setItem(
          WEB3_STORAGE_KEY,
          JSON.stringify({ address: newAddress, isConnected: true, chainId, walletMode: 'injected' })
        );
      }
    };

    const handleChainChanged = (hexChainId: string) => {
      const newChainId = parseInt(hexChainId, 16);
      setChainId(newChainId);
      setTargetChainId(newChainId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setAddress('');
      setBalances(INITIAL_EMPTY_BALANCES);
      localStorage.removeItem(WEB3_STORAGE_KEY);
    };

    try {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    } catch {}

    return () => {
      try {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
          window.ethereum.removeListener('disconnect', handleDisconnect);
        }
      } catch {}
    };
  }, [chainId]);

  // Connect via Injected Provider (MetaMask, Rabby, Coinbase Wallet, Verse)
  const connectInjected = async (): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await BlockchainService.connectWallet();
      setAddress(result.address);
      setChainId(result.chainId);
      setTargetChainId(result.chainId);
      setIsConnected(true);
      setWalletMode('injected');

      localStorage.setItem(
        WEB3_STORAGE_KEY,
        JSON.stringify({
          address: result.address,
          isConnected: true,
          chainId: result.chainId,
          walletMode: 'injected',
        })
      );

      // Fetch real balances immediately
      const realBalances = await BlockchainService.fetchBalances(result.address, result.chainId);
      setBalances(realBalances);

      return true;
    } catch (err: any) {
      const parsed = parseWeb3Error(err);
      setError(parsed);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect with custom address
  const connectDemo = (customAddress?: string) => {
    const addr = customAddress && ethers.isAddress(customAddress)
      ? ethers.getAddress(customAddress)
      : '0x71C8705a2B88e6082570084d5d996979d45e9B42';

    setAddress(addr);
    setIsConnected(true);
    setWalletMode('custom');
    setChainId(DEFAULT_CHAIN_ID);
    setTargetChainId(DEFAULT_CHAIN_ID);

    localStorage.setItem(
      WEB3_STORAGE_KEY,
      JSON.stringify({
        address: addr,
        isConnected: true,
        chainId: DEFAULT_CHAIN_ID,
        walletMode: 'custom',
      })
    );

    // Fetch real balances for custom address
    BlockchainService.fetchBalances(addr, DEFAULT_CHAIN_ID).then((b) => {
      setBalances(b);
    });
  };

  // Disconnect wallet
  const disconnect = () => {
    setIsConnected(false);
    setAddress('');
    setBalances(INITIAL_EMPTY_BALANCES);
    localStorage.removeItem(WEB3_STORAGE_KEY);
    setError(null);
  };

  // Switch target network
  const switchTargetNetwork = async (newTargetChainId: number): Promise<boolean> => {
    setError(null);
    setTargetChainId(newTargetChainId);

    if (walletMode === 'injected' && isConnected) {
      try {
        await BlockchainService.switchNetwork(newTargetChainId);
        setChainId(newTargetChainId);
        return true;
      } catch (err: any) {
        const parsed = parseWeb3Error(err);
        setError(parsed);
        return false;
      }
    } else {
      setChainId(newTargetChainId);
      return true;
    }
  };

  // Execute payment on chain
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
  }> => {
    const activeChainId = params.chainId || chainId || DEFAULT_CHAIN_ID;

    if (!isConnected || !address) {
      throw new Error('Please connect your Web3 wallet before executing payment.');
    }

    if (walletMode === 'injected') {
      // 1. Prepare transaction
      params.onStatusUpdate?.('preparing');
      const prepared = await BlockchainService.preparePayment({
        fromAddress: address,
        merchantSettlementAddress: params.merchantAddress,
        token: params.token,
        tokenAmount: params.tokenAmount,
        chainId: activeChainId,
      });

      // 2. Submit transaction to user's wallet
      const receipt = await BlockchainService.submitPayment(prepared, params.onStatusUpdate);

      // Refresh balances after successful transfer
      refreshBalances();

      return {
        success: true,
        txHash: receipt.txHash,
        receipt,
        isRealOnChain: true,
      };
    } else {
      // Fallback
      throw new Error('Please connect a live Web3 wallet to authorize transaction.');
    }
  };

  return (
    <Web3Context.Provider
      value={{
        isAvailable,
        isConnected,
        isConnecting,
        isLoadingBalances,
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
