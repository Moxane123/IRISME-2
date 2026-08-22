import { SupportedToken } from '../types';
import { TokenStandard, BlockchainTransactionMechanism } from '../types/qrPayment';

export type AllowedPaymentAsset = 'USDC' | 'USDT' | 'VERSE' | 'BTC';

export type BlockchainAssetCategory =
  | 'A_NATIVE_BLOCKCHAIN_ASSET' // e.g. BTC on Bitcoin (UTXO)
  | 'B_EVM_SMART_CONTRACT_ASSET' // e.g. USDC on Polygon, USDT on BNB Smart Chain, VERSE on Polygon
  | 'C_INDEPENDENT_NON_EVM_NETWORK'; // e.g. USDC on Solana (SPL), USDT on Tron (TRC-20)

export interface TokenNetworkExplorer {
  name: string;
  baseUrl: string;
  txUrl: (txHash: string) => string;
  addressUrl: (address: string) => string;
}

export interface TokenNetworkConfig {
  id: string; // Unique configuration ID e.g. "USDC-Solana", "USDT-Tron", "BTC-Bitcoin"
  assetSymbol: AllowedPaymentAsset;
  assetName: string;
  network: string; // 'Solana' | 'Polygon' | 'Tron' | 'BNB Smart Chain' | 'Bitcoin'
  networkId: string; // Machine identifier: 'solana-mainnet' | 'polygon-pos' | 'tron-mainnet' | 'bnb-smart-chain' | 'bitcoin-mainnet'
  chainId?: number; // EVM chain ID when applicable (137, 56)
  networkType: 'EVM' | 'SOLANA' | 'TRON' | 'BITCOIN';
  category: BlockchainAssetCategory;
  tokenStandard: TokenStandard;
  transactionMechanism: BlockchainTransactionMechanism;
  contractAddress: string; // Verified token contract or mint address, empty for native BTC
  decimals: number;
  isNative?: boolean;
  addressFormat: string; // e.g. 'Base58 Solana (32-44 chars)', 'TRC-20 Base58Check (T... 34 chars)', 'EVM 0x (42 chars)', 'Bitcoin Base58/Bech32'
  addressFormatDescription: string;
  addressPlaceholder: string;
  sampleAddress: string;
  explorer: TokenNetworkExplorer;
  walletCompatibility: string[];
  enabled: boolean;
  icon: string;
  color: string;
  rateToUSD: number;
  uriScheme: string; // 'solana' | 'tron' | 'bitcoin' | 'ethereum' | 'polygon'
  description: string;
}

/**
 * =========================================================================
 * MULTI-CHAIN PAYMENT RAIL TOKEN CONFIGURATIONS (Protocol Version 1.0.0)
 * =========================================================================
 * Categorization Rule Enforcement:
 * 
 * Category A: Native Blockchain Assets
 *   - BTC on Bitcoin (Layer 1 UTXO - NATIVE_TRANSFER)
 * 
 * Category B: Tokenized Assets on Smart-Contract EVM Networks
 *   - USDC on Polygon (ERC-20 - EVM_CONTRACT_CALL)
 *   - USDT on BNB Smart Chain (BEP-20 - EVM_CONTRACT_CALL)
 *   - USDT on Polygon (ERC-20 - EVM_CONTRACT_CALL)
 *   - VERSE on Polygon (ERC-20 - EVM_CONTRACT_CALL)
 * 
 * Category C: Assets on Independent Non-EVM Networks
 *   - USDC on Solana (SPL Token Program - SOLANA_SPL_TRANSFER)
 *   - USDT on TRON (TRC-20 Smart Contract - TRON_TRIGGER_CONSTANT_CONTRACT)
 * =========================================================================
 */
export const MULTI_CHAIN_TOKEN_CONFIGS: TokenNetworkConfig[] = [
  // ==========================================
  // Category C: USDC on Solana (SPL Token)
  // ==========================================
  {
    id: 'USDC-Solana',
    assetSymbol: 'USDC',
    assetName: 'USD Coin (Solana Mainnet)',
    network: 'Solana Mainnet',
    networkId: 'solana-mainnet',
    networkType: 'SOLANA',
    category: 'C_INDEPENDENT_NON_EVM_NETWORK',
    tokenStandard: 'SPL_TOKEN',
    transactionMechanism: 'SOLANA_SPL_TRANSFER',
    contractAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Verified Circle Native USDC SPL Mint
    decimals: 6,
    isNative: false,
    addressFormat: 'Solana Base58 (32-44 characters)',
    addressFormatDescription: 'Base58 encoded Solana public key (e.g. 7xKXtg...sAsU)',
    addressPlaceholder: 'e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    sampleAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    explorer: {
      name: 'Solscan',
      baseUrl: 'https://solscan.io',
      txUrl: (txHash) => `https://solscan.io/tx/${txHash}`,
      addressUrl: (address) => `https://solscan.io/account/${address}`,
    },
    walletCompatibility: ['Phantom', 'Solflare', 'Backpack', 'Solana Pay'],
    enabled: true,
    icon: '$',
    color: '#2775CA',
    rateToUSD: 1.0,
    uriScheme: 'solana',
    description: 'Circle Native USDC on high-speed Solana SPL Token Rail (~400ms finality)',
  },

  // ==========================================
  // Category B: USDC on Polygon (ERC-20)
  // ==========================================
  {
    id: 'USDC-Polygon',
    assetSymbol: 'USDC',
    assetName: 'USD Coin (Polygon)',
    network: 'Polygon',
    networkId: 'polygon-pos',
    chainId: 137,
    networkType: 'EVM',
    category: 'B_EVM_SMART_CONTRACT_ASSET',
    tokenStandard: 'ERC20',
    transactionMechanism: 'EVM_CONTRACT_CALL',
    contractAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Verified Circle Native USDC on Polygon PoS
    decimals: 6,
    isNative: false,
    addressFormat: 'EVM Hexadecimal (0x... 42 characters)',
    addressFormatDescription: 'Ethereum-compatible 20-byte hex address starting with 0x',
    addressPlaceholder: 'e.g. 0x...',
    sampleAddress: '',
    explorer: {
      name: 'PolygonScan',
      baseUrl: 'https://polygonscan.com',
      txUrl: (txHash) => `https://polygonscan.com/tx/${txHash}`,
      addressUrl: (address) => `https://polygonscan.com/address/${address}`,
    },
    walletCompatibility: ['MetaMask', 'Coinbase Wallet', 'Trust Wallet', 'Rainbow', 'WalletConnect'],
    enabled: true,
    icon: '$',
    color: '#3B82F6',
    rateToUSD: 1.0,
    uriScheme: 'ethereum',
    description: 'Circle Native USDC on Polygon PoS EVM Rail (Sub-cent gas)',
  },

  // ==========================================
  // Category B: USDC on Ethereum (ERC-20)
  // ==========================================
  {
    id: 'USDC-Ethereum',
    assetSymbol: 'USDC',
    assetName: 'USD Coin (Ethereum)',
    network: 'Ethereum',
    networkId: 'ethereum-mainnet',
    chainId: 1,
    networkType: 'EVM',
    category: 'B_EVM_SMART_CONTRACT_ASSET',
    tokenStandard: 'ERC20',
    transactionMechanism: 'EVM_CONTRACT_CALL',
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Official Circle USDC on Ethereum Mainnet
    decimals: 6,
    isNative: false,
    addressFormat: 'EVM Hexadecimal (0x... 42 characters)',
    addressFormatDescription: 'Ethereum 20-byte hex address starting with 0x',
    addressPlaceholder: 'e.g. 0x...',
    sampleAddress: '',
    explorer: {
      name: 'Etherscan',
      baseUrl: 'https://etherscan.io',
      txUrl: (txHash) => `https://etherscan.io/tx/${txHash}`,
      addressUrl: (address) => `https://etherscan.io/address/${address}`,
    },
    walletCompatibility: ['MetaMask', 'Coinbase Wallet', 'Trust Wallet', 'Rainbow', 'Ledger', 'WalletConnect'],
    enabled: true,
    icon: '$',
    color: '#2775CA',
    rateToUSD: 1.0,
    uriScheme: 'ethereum',
    description: 'Circle USDC on Ethereum Mainnet (ERC-20 Rail)',
  },

  // ==========================================
  // Category C: USDT on TRON (TRC-20)
  // ==========================================
  {
    id: 'USDT-Tron',
    assetSymbol: 'USDT',
    assetName: 'Tether USD (TRON TRC-20)',
    network: 'Tron',
    networkId: 'tron-mainnet',
    networkType: 'TRON',
    category: 'C_INDEPENDENT_NON_EVM_NETWORK',
    tokenStandard: 'TRC20',
    transactionMechanism: 'TRON_TRIGGER_CONSTANT_CONTRACT',
    contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // Official Tether USDT TRC-20 Contract
    decimals: 6,
    isNative: false,
    addressFormat: 'TRON Base58Check (T... 34 characters)',
    addressFormatDescription: 'TRC-20 Base58Check address starting with uppercase T',
    addressPlaceholder: 'e.g. TYDzsYUE29774Ks7nv2gGLHG1GLFusyZre',
    sampleAddress: 'TYDzsYUE29774Ks7nv2gGLHG1GLFusyZre',
    explorer: {
      name: 'TronScan',
      baseUrl: 'https://tronscan.org',
      txUrl: (txHash) => `https://tronscan.org/#/transaction/${txHash}`,
      addressUrl: (address) => `https://tronscan.org/#/address/${address}`,
    },
    walletCompatibility: ['TronLink', 'Trust Wallet', 'TokenPocket', 'BitKeep', 'Ledger'],
    enabled: true,
    icon: '₮',
    color: '#26A17B',
    rateToUSD: 1.0,
    uriScheme: 'tron',
    description: 'Official Tether USDT on TRON TRC-20 Global High-Volume Settlement Rail',
  },

  // ==========================================
  // Category B: USDT on BNB Smart Chain (BEP-20)
  // ==========================================
  {
    id: 'USDT-BNB Smart Chain',
    assetSymbol: 'USDT',
    assetName: 'Tether USD (BNB Smart Chain)',
    network: 'BNB Smart Chain',
    networkId: 'bnb-smart-chain',
    chainId: 56,
    networkType: 'EVM',
    category: 'B_EVM_SMART_CONTRACT_ASSET',
    tokenStandard: 'BEP20',
    transactionMechanism: 'EVM_CONTRACT_CALL',
    contractAddress: '0x55d398326f99059fF775485246999027B3197955', // Official Binance-Peg BSC-USD USDT Contract
    decimals: 18,
    isNative: false,
    addressFormat: 'EVM Hexadecimal (0x... 42 characters)',
    addressFormatDescription: 'BNB Chain EVM 20-byte hex address starting with 0x',
    addressPlaceholder: 'e.g. 0x...',
    sampleAddress: '',
    explorer: {
      name: 'BscScan',
      baseUrl: 'https://bscscan.com',
      txUrl: (txHash) => `https://bscscan.com/tx/${txHash}`,
      addressUrl: (address) => `https://bscscan.com/address/${address}`,
    },
    walletCompatibility: ['MetaMask', 'Trust Wallet', 'Binance Web3 Wallet', 'Coinbase Wallet', 'WalletConnect'],
    enabled: true,
    icon: '₮',
    color: '#F0B90B',
    rateToUSD: 1.0,
    uriScheme: 'ethereum',
    description: 'Tether USDT on BNB Smart Chain (BEP-20) EVM Rail',
  },

  // ==========================================
  // Category B: USDT on Polygon (ERC-20)
  // ==========================================
  {
    id: 'USDT-Polygon',
    assetSymbol: 'USDT',
    assetName: 'Tether USD (Polygon)',
    network: 'Polygon',
    networkId: 'polygon-pos',
    chainId: 137,
    networkType: 'EVM',
    category: 'B_EVM_SMART_CONTRACT_ASSET',
    tokenStandard: 'ERC20',
    transactionMechanism: 'EVM_CONTRACT_CALL',
    contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Official Tether USDT on Polygon PoS
    decimals: 6,
    isNative: false,
    addressFormat: 'EVM Hexadecimal (0x... 42 characters)',
    addressFormatDescription: 'Polygon PoS 20-byte hex address starting with 0x',
    addressPlaceholder: 'e.g. 0x...',
    sampleAddress: '',
    explorer: {
      name: 'PolygonScan',
      baseUrl: 'https://polygonscan.com',
      txUrl: (txHash) => `https://polygonscan.com/tx/${txHash}`,
      addressUrl: (address) => `https://polygonscan.com/address/${address}`,
    },
    walletCompatibility: ['MetaMask', 'Coinbase Wallet', 'Trust Wallet', 'Rainbow', 'WalletConnect'],
    enabled: true,
    icon: '₮',
    color: '#10B981',
    rateToUSD: 1.0,
    uriScheme: 'ethereum',
    description: 'Tether USDT on Polygon PoS EVM Rail',
  },

  // ==========================================
  // Category B: USDT on Ethereum (ERC-20)
  // ==========================================
  {
    id: 'USDT-Ethereum',
    assetSymbol: 'USDT',
    assetName: 'Tether USD (Ethereum)',
    network: 'Ethereum',
    networkId: 'ethereum-mainnet',
    chainId: 1,
    networkType: 'EVM',
    category: 'B_EVM_SMART_CONTRACT_ASSET',
    tokenStandard: 'ERC20',
    transactionMechanism: 'EVM_CONTRACT_CALL',
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Official Tether USDT on Ethereum Mainnet
    decimals: 6,
    isNative: false,
    addressFormat: 'EVM Hexadecimal (0x... 42 characters)',
    addressFormatDescription: 'Ethereum 20-byte hex address starting with 0x',
    addressPlaceholder: 'e.g. 0x...',
    sampleAddress: '',
    explorer: {
      name: 'Etherscan',
      baseUrl: 'https://etherscan.io',
      txUrl: (txHash) => `https://etherscan.io/tx/${txHash}`,
      addressUrl: (address) => `https://etherscan.io/address/${address}`,
    },
    walletCompatibility: ['MetaMask', 'Coinbase Wallet', 'Trust Wallet', 'Rainbow', 'Ledger', 'WalletConnect'],
    enabled: true,
    icon: '₮',
    color: '#26A17B',
    rateToUSD: 1.0,
    uriScheme: 'ethereum',
    description: 'Tether USDT on Ethereum Mainnet (ERC-20 Rail)',
  },

  // ==========================================
  // Category B: VERSE on Polygon (ERC-20)
  // ==========================================
  {
    id: 'VERSE-Polygon',
    assetSymbol: 'VERSE',
    assetName: 'Verse (Polygon)',
    network: 'Polygon',
    networkId: 'polygon-pos',
    chainId: 137,
    networkType: 'EVM',
    category: 'B_EVM_SMART_CONTRACT_ASSET',
    tokenStandard: 'ERC20',
    transactionMechanism: 'EVM_CONTRACT_CALL',
    contractAddress:
      import.meta.env.VITE_VERSE_TOKEN_CONTRACT ||
      import.meta.env.VITE_VERSE_TOKEN_POLYGON ||
      '0xc708d6f2153933daa50b2d0758955be0a93a8fec', // Official Verse Token on Polygon PoS
    decimals: 18,
    isNative: false,
    addressFormat: 'EVM Hexadecimal (0x... 42 characters)',
    addressFormatDescription: 'Polygon PoS 20-byte hex address starting with 0x',
    addressPlaceholder: 'e.g. 0x...',
    sampleAddress: '',
    explorer: {
      name: 'PolygonScan',
      baseUrl: 'https://polygonscan.com',
      txUrl: (txHash) => `https://polygonscan.com/tx/${txHash}`,
      addressUrl: (address) => `https://polygonscan.com/address/${address}`,
    },
    walletCompatibility: ['MetaMask', 'Bitcoin.com Wallet', 'Trust Wallet', 'Coinbase Wallet', 'WalletConnect'],
    enabled: true,
    icon: '⚡',
    color: '#00D2FE',
    rateToUSD: 0.0000176,
    uriScheme: 'ethereum',
    description: 'Bitcoin.com Verse Ecosystem & Merchant Loyalty Rewards on Polygon PoS',
  },

  // ==========================================
  // Category A: BTC on Bitcoin (Layer 1 Native UTXO)
  // ==========================================
  {
    id: 'BTC-Bitcoin',
    assetSymbol: 'BTC',
    assetName: 'Bitcoin (Layer 1)',
    network: 'Bitcoin',
    networkId: 'bitcoin-mainnet',
    networkType: 'BITCOIN',
    category: 'A_NATIVE_BLOCKCHAIN_ASSET',
    tokenStandard: 'NATIVE_UTXO',
    transactionMechanism: 'NATIVE_TRANSFER',
    contractAddress: '', // Native Layer 1 UTXO Currency, no smart contract
    decimals: 8,
    isNative: true,
    addressFormat: 'Bitcoin Bech32 / Base58 (1..., 3..., bc1...)',
    addressFormatDescription: 'Native Bitcoin Layer 1 Address (Bech32 bc1q/bc1p or Legacy 1/3)',
    addressPlaceholder: 'e.g. bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    sampleAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    explorer: {
      name: 'Mempool.space',
      baseUrl: 'https://mempool.space',
      txUrl: (txHash) => `https://mempool.space/tx/${txHash}`,
      addressUrl: (address) => `https://mempool.space/address/${address}`,
    },
    walletCompatibility: ['Bitcoin.com Wallet', 'Sparrow', 'Electrum', 'UniSat', 'Xverse', 'Ledger', 'Trezor'],
    enabled: true,
    icon: '₿',
    color: '#F7931A',
    rateToUSD: 96450.0,
    uriScheme: 'bitcoin',
    description: 'Native Bitcoin Layer 1 UTXO Decentralized Payment Rail (1 BTC = 100M Satoshis)',
  },
];

/**
 * First version ONLY supports: USDC, USDT, VERSE, BTC
 */
export const SUPPORTED_PAYMENT_ASSETS: AllowedPaymentAsset[] = ['USDC', 'USDT', 'VERSE', 'BTC'];

/**
 * Helper to get all enabled multi-chain configurations
 */
export const getAllMultiChainConfigs = (): TokenNetworkConfig[] => {
  return MULTI_CHAIN_TOKEN_CONFIGS.filter((c) => c.enabled);
};

/**
 * Get all supported networks for a selected asset symbol
 */
export const getNetworksForAsset = (symbol: string): TokenNetworkConfig[] => {
  const normSym = symbol.toUpperCase().trim() as AllowedPaymentAsset;
  return MULTI_CHAIN_TOKEN_CONFIGS.filter((c) => c.assetSymbol === normSym && c.enabled);
};

/**
 * Find exact token network configuration matching asset symbol and network / chainId
 */
export const findTokenNetworkConfig = (
  symbol: string,
  networkOrChainId?: string | number
): TokenNetworkConfig | undefined => {
  const normSym = symbol.toUpperCase().trim();
  const configs = MULTI_CHAIN_TOKEN_CONFIGS.filter((c) => c.assetSymbol === normSym && c.enabled);
  if (configs.length === 0) return undefined;

  if (!networkOrChainId) return configs[0];

  // Try matching by chainId
  if (typeof networkOrChainId === 'number') {
    const matched = configs.find((c) => c.chainId === networkOrChainId);
    if (matched) return matched;
  }

  // Try matching by network name or networkId
  const searchStr = networkOrChainId.toString().toLowerCase().trim();
  const matched = configs.find(
    (c) =>
      c.network.toLowerCase() === searchStr ||
      c.networkId.toLowerCase() === searchStr ||
      (c.chainId && c.chainId.toString() === searchStr) ||
      (searchStr.includes('sol') && c.network === 'Solana') ||
      (searchStr.includes('tron') && c.network === 'Tron') ||
      (searchStr.includes('btc') && c.network === 'Bitcoin') ||
      (searchStr.includes('poly') && c.network === 'Polygon') ||
      (searchStr.includes('bnb') && c.network === 'BNB Smart Chain') ||
      (searchStr.includes('bsc') && c.network === 'BNB Smart Chain')
  );

  return matched || configs[0];
};

/**
 * Validates whether an address matches the network's address format
 */
export const validateAddressForNetwork = (
  address: string,
  networkOrChainId: string | number
): { isValid: boolean; error?: string; networkType: 'EVM' | 'SOLANA' | 'TRON' | 'BITCOIN' | 'UNKNOWN' } => {
  if (!address || typeof address !== 'string' || !address.trim()) {
    return { isValid: false, error: 'Address is required.', networkType: 'UNKNOWN' };
  }

  const cleanAddr = address.trim();
  const searchStr = networkOrChainId.toString().toLowerCase().trim();

  // 1. Solana Check
  if (searchStr.includes('solana') || searchStr === 'solana-mainnet') {
    // Base58 Solana public key: 32-44 chars, alphanumeric excluding 0, O, I, l
    const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanAddr);
    return {
      isValid: isSolana,
      error: isSolana ? undefined : 'Invalid Solana address. Must be a 32-44 character Base58 public key.',
      networkType: 'SOLANA',
    };
  }

  // 2. TRON Check
  if (searchStr.includes('tron') || searchStr === 'tron-mainnet') {
    // Base58Check starting with 'T', exactly 34 chars
    const isTron = /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(cleanAddr);
    return {
      isValid: isTron,
      error: isTron ? undefined : 'Invalid TRON address. Must be 34 characters starting with "T".',
      networkType: 'TRON',
    };
  }

  // 3. Bitcoin Check
  if (searchStr.includes('bitcoin') || searchStr.includes('btc') || searchStr === 'bitcoin-mainnet') {
    // Bech32 (bc1q..., bc1p...) or Legacy/P2SH (1..., 3...)
    const isBtc = /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{25,62}|bc1p[a-zA-HJ-NP-Z0-9]{25,62})$/.test(
      cleanAddr
    );
    return {
      isValid: isBtc,
      error: isBtc ? undefined : 'Invalid Bitcoin address. Must be a valid Native SegWit (bc1...), Taproot (bc1p...), or Legacy (1/3...) address.',
      networkType: 'BITCOIN',
    };
  }

  // 4. EVM Check (Polygon, BNB Smart Chain, Ethereum)
  const isEvm = /^0x[a-fA-F0-9]{40}$/.test(cleanAddr);
  return {
    isValid: isEvm,
    error: isEvm ? undefined : 'Invalid EVM address. Must be a 42-character hex address starting with 0x.',
    networkType: 'EVM',
  };
};

/**
 * Standardized Canonical IRISME Multi-Chain Payment Request Data Model (Protocol v1)
 */
export interface StandardPaymentRequestPayload {
  protocolVersion: 'irisme_v1';
  paymentId: string;
  merchantName: string;
  merchantAddress: string;
  asset: AllowedPaymentAsset;
  network: string;
  networkId: string;
  chainId?: number;
  tokenStandard: TokenStandard;
  transactionMechanism: BlockchainTransactionMechanism;
  contractAddress?: string;
  amount: number;
  amountUSD: number;
  decimals: number;
  expiry: string;
  orderRef?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates a complete, canonical JSON string for QR Code encoding that complies with
 * Section 4 (Payment Request Data Model).
 */
export const createCanonicalPaymentRequestJson = (params: {
  paymentId: string;
  merchantName: string;
  merchantAddress?: string;
  merchantReceivingAddress?: string;
  asset: AllowedPaymentAsset;
  network: string;
  amount: number;
  amountUSD?: number;
  decimals?: number;
  expiry?: string | Date;
  orderRef?: string;
  description: string;
  metadata?: Record<string, unknown>;
}): string => {
  const config = findTokenNetworkConfig(params.asset, params.network);
  const now = new Date();
  const expiryIso =
    params.expiry instanceof Date
      ? params.expiry.toISOString()
      : typeof params.expiry === 'string'
      ? params.expiry
      : new Date(now.getTime() + 45 * 60 * 1000).toISOString();

  const recipientAddr = params.merchantReceivingAddress || params.merchantAddress || '';

  const payload: StandardPaymentRequestPayload = {
    protocolVersion: 'irisme_v1',
    paymentId: params.paymentId,
    merchantName: params.merchantName || 'IRISME Merchant',
    merchantAddress: recipientAddr,
    asset: params.asset,
    network: config ? config.network : params.network,
    networkId: config ? config.networkId : params.network.toLowerCase().replace(/\s+/g, '-'),
    chainId: config?.chainId,
    tokenStandard: config ? config.tokenStandard : 'ERC20',
    transactionMechanism: config ? config.transactionMechanism : 'EVM_CONTRACT_CALL',
    contractAddress: config?.contractAddress || undefined,
    amount: params.amount,
    amountUSD: params.amountUSD ?? params.amount,
    decimals: params.decimals ?? (config ? config.decimals : 6),
    expiry: expiryIso,
    orderRef: params.orderRef,
    description: params.description,
    metadata: params.metadata || {},
  };

  return JSON.stringify(payload, null, 2);
};

/**
 * Generate native multi-chain payment URI for QR Code encoding
 */
export const generateMultiChainPaymentUri = (params: {
  assetSymbol: AllowedPaymentAsset;
  network: string;
  chainId?: number | string;
  recipientAddress: string;
  tokenAmount: number;
  paymentId: string;
  merchantName?: string;
}): string => {
  const { assetSymbol, network, recipientAddress, tokenAmount, paymentId, merchantName } = params;
  const config = findTokenNetworkConfig(assetSymbol, network);

  if (!config) {
    return `${window.location.origin}/pay/${paymentId}`;
  }

  const encodedMerchant = encodeURIComponent(merchantName || 'IRISME Merchant');

  if (config.networkType === 'SOLANA') {
    // Solana Pay standard: solana:<recipient>?amount=<amount>&spl-token=<mint>&reference=<id>&label=<name>
    return `solana:${recipientAddress}?amount=${tokenAmount}&spl-token=${config.contractAddress}&reference=${paymentId}&label=${encodedMerchant}`;
  }

  if (config.networkType === 'TRON') {
    // TRON URI standard: tron:<recipient>?amount=<amount>&token=USDT&ref=<id>
    return `tron:${recipientAddress}?amount=${tokenAmount}&token=${assetSymbol}&ref=${paymentId}&label=${encodedMerchant}`;
  }

  if (config.networkType === 'BITCOIN') {
    // Bitcoin BIP-21 standard: bitcoin:<address>?amount=<btcAmount>&label=<name>&message=<id>
    return `bitcoin:${recipientAddress}?amount=${tokenAmount}&label=${encodedMerchant}&message=${paymentId}`;
  }

  // EVM Standard EIP-681 / Transfer URI
  if (config.isNative) {
    return `ethereum:${recipientAddress}@${config.chainId || 137}?value=${tokenAmount}`;
  }

  return `ethereum:${config.contractAddress}@${config.chainId || 137}/transfer?address=${recipientAddress}&uint256=${Math.round(
    tokenAmount * Math.pow(10, config.decimals)
  )}`;
};
