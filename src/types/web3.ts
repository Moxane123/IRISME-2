import { SupportedToken } from '../types';
import { ChainConfig } from '../config/chains';

export type TxLifecycleStatus =
  | 'idle'
  | 'wallet_connected'
  | 'preparing'
  | 'awaiting_signature'
  | 'submitted'
  | 'confirming'
  | 'confirmed'
  | 'failed';

export interface Web3Error {
  code?: string | number;
  message: string;
  isUserRejection: boolean;
  raw?: unknown;
}

export interface PreparedTransaction {
  token: SupportedToken;
  tokenAddress?: string;
  isNative: boolean;
  to: string;
  formattedAmount: string;
  rawAmount: bigint;
  decimals: number;
  estimatedGasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  userBalance: number;
  hasSufficientBalance: boolean;
}

export interface SubmittedTransactionReceipt {
  txHash: string;
  blockNumber: number;
  confirmations: number;
  from: string;
  to: string;
  gasUsed?: string;
  status: 'confirmed' | 'reverted';
  chainId: number;
  timestamp: string;
}

export interface WalletBalances {
  VERSE: number;
  USDT: number;
  USDC: number;
  DAI: number;
  ETH: number;
  WBTC: number;
  MATIC: number; // POL on Polygon
  BNB?: number;
  AVAX?: number;
  SOL?: number;
  BTC?: number;
  TRX?: number;
  [key: string]: number | undefined;
}

