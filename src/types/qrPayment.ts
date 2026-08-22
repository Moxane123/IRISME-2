import { SupportedToken } from '../types';

export type TokenStandard = 'NATIVE_UTXO' | 'ERC20' | 'BEP20' | 'SPL_TOKEN' | 'TRC20';
export type BlockchainTransactionMechanism =
  | 'NATIVE_TRANSFER'
  | 'EVM_CONTRACT_CALL'
  | 'SOLANA_SPL_TRANSFER'
  | 'TRON_TRIGGER_CONSTANT_CONTRACT';

export interface ParsedPaymentRequest {
  protocolVersion: string; // e.g. "irisme_v1" or "1.0.0"
  rawPayload: string;
  sourceFormat: 'irisme_url' | 'json_payload' | 'eip681_uri' | 'payment_id' | 'query_param' | 'solana_uri' | 'tron_uri' | 'bitcoin_uri';
  paymentId: string;
  invoiceNumber?: string;
  merchantName: string;
  merchantAddress: string; // Merchant receiving address on the specified network
  asset: SupportedToken; // Asset symbol: USDC, USDT, VERSE, BTC
  selectedToken: SupportedToken; // Alias for asset
  network: string; // Exact network: 'Solana', 'Polygon', 'Tron', 'BNB Smart Chain', 'Bitcoin'
  networkName: string; // Alias for network
  networkId: string; // Machine identifier: 'solana-mainnet', 'polygon-pos', 'tron-mainnet', 'bnb-smart-chain', 'bitcoin-mainnet'
  chainId?: number; // EVM chain ID (137, 56) when applicable
  networkType: 'EVM' | 'SOLANA' | 'TRON' | 'BITCOIN';
  tokenStandard: TokenStandard;
  transactionMechanism: BlockchainTransactionMechanism;
  contractAddress?: string; // Token contract or mint address where applicable, empty/undefined for native BTC
  amount: number; // Token amount
  tokenAmount: number; // Alias for amount
  amountUSD: number;
  decimals: number;
  expiry?: string; // ISO-8601 timestamp
  expiresAt?: string; // Alias for expiry
  isExpired: boolean;
  orderRef?: string;
  description: string;
  verseEarned?: number;
  cashbackPercent?: number;
  platformFeePercent?: number;
  metadata?: Record<string, unknown>;
  addressFormat?: string;
  walletCompatibility?: string[];
}

export interface QrParseResult {
  success: boolean;
  data?: ParsedPaymentRequest;
  error?: string;
  errorCode?:
    | 'EMPTY_PAYLOAD'
    | 'INVALID_FORMAT'
    | 'MISSING_EXACT_NETWORK'
    | 'INVALID_MERCHANT_ADDRESS'
    | 'INVALID_AMOUNT'
    | 'UNSUPPORTED_TOKEN'
    | 'UNSUPPORTED_CHAIN'
    | 'EXPIRED_REQUEST'
    | 'PAYMENT_NOT_FOUND';
}

export type ScannerStatus =
  | 'idle'
  | 'requesting_permission'
  | 'permission_denied'
  | 'camera_unavailable'
  | 'scanning'
  | 'processing_image'
  | 'qr_detected'
  | 'validating'
  | 'ready';

export type CustomerPaymentStep =
  | 'scan'
  | 'review'
  | 'approving_token'
  | 'awaiting_payment'
  | 'confirming_tx'
  | 'success'
  | 'failed';

