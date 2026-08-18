import { NetworkSupportStatus } from '../types';

export interface ChainConfig {
  id: number;
  hexId: string;
  name: string;
  shortName: string;
  status: NetworkSupportStatus; // 'SUPPORTED' | 'COMING_SOON' | 'NOT_CONFIGURED'
  verseEcosystemPrimary?: boolean;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string; // 'POL' | 'ETH' | 'BNB' | 'AVAX' | 'SOL' | 'BTC'
    decimals: number;
  };
  typicalGasPriceGwei: number;
  gasUnits: {
    nativeTransfer: number;
    erc20Transfer: number;
    contractInteraction: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  icon: string;
}

export interface UpcomingNetworkConfig {
  id?: number;
  name: string;
  shortName: string;
  nativeCurrency: string;
  status: 'COMING_SOON';
  icon: string;
  description: string;
  reasonDisabled?: string;
}

/**
 * =========================================================================
 * CANONICAL SUPPORTED BLOCKCHAIN NETWORKS (Merchant Payment Protocols)
 * =========================================================================
 * - Polygon Mainnet (137): Primary Verse Hub, low fee, sub-cent settlement
 * - Ethereum Mainnet (1): Highest institutional liquidity for USDT, USDC, ETH, WBTC
 * - Base Mainnet (8453): Coinbase Layer-2, low fees, native USDC hub
 * - Arbitrum One (42161): Leading EVM Layer-2 for DeFi & merchant payments
 * - BNB Smart Chain (56): High-throughput BSC network for BNB & BEP-20 USDT/USDC
 * - Avalanche C-Chain (43114): High-speed EVM settlement for AVAX & stablecoins
 * - Solana Mainnet: High-speed non-EVM settlement for SOL & SPL USDC/USDT
 * - Bitcoin Mainnet: Native Bitcoin Layer 1 settlement
 */
export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  137: {
    id: 137,
    hexId: '0x89',
    name: 'Polygon Mainnet (Verse Primary Hub)',
    shortName: 'Polygon',
    status: 'SUPPORTED',
    verseEcosystemPrimary: true,
    isTestnet: false,
    nativeCurrency: {
      name: 'Polygon Ecosystem Token (POL)',
      symbol: 'POL',
      decimals: 18,
    },
    typicalGasPriceGwei: 35,
    gasUnits: {
      nativeTransfer: 21000,
      erc20Transfer: 65000,
      contractInteraction: 110000,
    },
    rpcUrls: [
      import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon',
      'https://1rpc.io/matic',
      'https://polygon.llamarpc.com',
    ],
    blockExplorerUrls: ['https://polygonscan.com'],
    icon: '🟣',
  },
  1: {
    id: 1,
    hexId: '0x1',
    name: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    status: 'SUPPORTED',
    verseEcosystemPrimary: false,
    isTestnet: false,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    typicalGasPriceGwei: 18,
    gasUnits: {
      nativeTransfer: 21000,
      erc20Transfer: 65000,
      contractInteraction: 120000,
    },
    rpcUrls: [
      import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
      'https://ethereum.publicnode.com',
      'https://cloudflare-eth.com',
    ],
    blockExplorerUrls: ['https://etherscan.io'],
    icon: '🔷',
  },
  8453: {
    id: 8453,
    hexId: '0x2105',
    name: 'Base Mainnet',
    shortName: 'Base',
    status: 'SUPPORTED',
    verseEcosystemPrimary: false,
    isTestnet: false,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    typicalGasPriceGwei: 0.05,
    gasUnits: {
      nativeTransfer: 21000,
      erc20Transfer: 65000,
      contractInteraction: 95000,
    },
    rpcUrls: [
      'https://mainnet.base.org',
      'https://base.llamarpc.com',
      'https://rpc.ankr.com/base',
    ],
    blockExplorerUrls: ['https://basescan.org'],
    icon: '🔵',
  },
  42161: {
    id: 42161,
    hexId: '0xa4b1',
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    status: 'SUPPORTED',
    verseEcosystemPrimary: false,
    isTestnet: false,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    typicalGasPriceGwei: 0.1,
    gasUnits: {
      nativeTransfer: 21000,
      erc20Transfer: 65000,
      contractInteraction: 100000,
    },
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.llamarpc.com',
      'https://rpc.ankr.com/arbitrum',
    ],
    blockExplorerUrls: ['https://arbiscan.io'],
    icon: '🟦',
  },
  56: {
    id: 56,
    hexId: '0x38',
    name: 'BNB Smart Chain',
    shortName: 'BNB Chain',
    status: 'SUPPORTED',
    verseEcosystemPrimary: false,
    isTestnet: false,
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    typicalGasPriceGwei: 3,
    gasUnits: {
      nativeTransfer: 21000,
      erc20Transfer: 65000,
      contractInteraction: 110000,
    },
    rpcUrls: [
      'https://bsc-dataseed.binance.org',
      'https://rpc.ankr.com/bsc',
      'https://1rpc.io/bnb',
      'https://bsc.publicnode.com',
    ],
    blockExplorerUrls: ['https://bscscan.com'],
    icon: '🟡',
  },
  43114: {
    id: 43114,
    hexId: '0xa86a',
    name: 'Avalanche C-Chain',
    shortName: 'Avalanche',
    status: 'SUPPORTED',
    verseEcosystemPrimary: false,
    isTestnet: false,
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    typicalGasPriceGwei: 27,
    gasUnits: {
      nativeTransfer: 21000,
      erc20Transfer: 65000,
      contractInteraction: 110000,
    },
    rpcUrls: [
      'https://api.avax.network/ext/bc/C/rpc',
      'https://rpc.ankr.com/avalanche',
      'https://avalanche.publicnode.com',
    ],
    blockExplorerUrls: ['https://snowtrace.io'],
    icon: '🔺',
  },
};

export const DEFAULT_CHAIN_ID = 137;

export const getChainConfig = (chainId: number): ChainConfig | undefined => {
  return SUPPORTED_CHAINS[chainId];
};

export const isChainSupported = (chainId: number): boolean => {
  const chain = SUPPORTED_CHAINS[chainId];
  return chain !== undefined && chain.status === 'SUPPORTED';
};

export const getNativeGasToken = (chainId: number): string => {
  const chain = getChainConfig(chainId);
  return chain ? chain.nativeCurrency.symbol : 'POL';
};

export const getExplorerUrl = (chainId: number, txHash?: string, address?: string): string => {
  const chain = getChainConfig(chainId) || SUPPORTED_CHAINS[DEFAULT_CHAIN_ID];
  const baseUrl = chain.blockExplorerUrls[0] || 'https://polygonscan.com';
  if (txHash) return `${baseUrl}/tx/${txHash}`;
  if (address) return `${baseUrl}/address/${address}`;
  return baseUrl;
};
