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
    symbol: string; // 'POL' | 'ETH' | 'BNB' | 'AVAX'
    decimals: number;
  };
  // Dynamic Gas Estimation Parameters
  typicalGasPriceGwei: number; // Baseline gas price in Gwei
  gasUnits: {
    nativeTransfer: number; // e.g. 21,000 units
    erc20Transfer: number; // e.g. 65,000 units
    contractInteraction: number; // e.g. 110,000 units
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
 * CANONICAL SUPPORTED BLOCKCHAIN NETWORKS (Phase 1 Integration Support)
 * =========================================================================
 * Native Gas Tokens:
 * - Polygon: POL (formerly MATIC)
 * - Ethereum: ETH
 * - BNB Smart Chain: BNB
 * - Avalanche C-Chain: AVAX
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
    typicalGasPriceGwei: 20,
    gasUnits: {
      nativeTransfer: 21000,
      erc20Transfer: 65000,
      contractInteraction: 120000,
    },
    rpcUrls: [
      import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
      'https://ethereum.publicnode.com',
    ],
    blockExplorerUrls: ['https://etherscan.io'],
    icon: '🔷',
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
    typicalGasPriceGwei: 25,
    gasUnits: {
      nativeTransfer: 21000,
      erc20Transfer: 65000,
      contractInteraction: 110000,
    },
    rpcUrls: [
      'https://api.avax.network/ext/bc/C/rpc',
      'https://rpc.ankr.com/avalanche',
    ],
    blockExplorerUrls: ['https://snowtrace.io'],
    icon: '🔺',
  },
  80002: {
    id: 80002,
    hexId: '0x13882',
    name: 'Polygon Amoy Testnet',
    shortName: 'Amoy',
    status: 'SUPPORTED',
    verseEcosystemPrimary: true,
    isTestnet: true,
    nativeCurrency: {
      name: 'POL Testnet',
      symbol: 'POL',
      decimals: 18,
    },
    typicalGasPriceGwei: 30,
    gasUnits: {
      nativeTransfer: 21000,
      erc20Transfer: 65000,
      contractInteraction: 110000,
    },
    rpcUrls: [
      import.meta.env.VITE_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
    ],
    blockExplorerUrls: ['https://amoy.polygonscan.com'],
    icon: '🧪',
  },
  11155111: {
    id: 11155111,
    hexId: '0xaa36a7',
    name: 'Sepolia Testnet',
    shortName: 'Sepolia',
    status: 'SUPPORTED',
    verseEcosystemPrimary: false,
    isTestnet: true,
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    typicalGasPriceGwei: 15,
    gasUnits: {
      nativeTransfer: 21000,
      erc20Transfer: 65000,
      contractInteraction: 110000,
    },
    rpcUrls: [
      import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
    ],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    icon: '🧪',
  },
};

/**
 * =========================================================================
 * COMING SOON NETWORKS (Future / Pending Phase Integrations)
 * =========================================================================
 * Explicitly marked as coming soon — not claiming real execution yet.
 */
export const COMING_SOON_NETWORKS: UpcomingNetworkConfig[] = [
  {
    id: 42161,
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    nativeCurrency: 'ETH',
    status: 'COMING_SOON',
    icon: '🔵',
    description: 'Ethereum Layer 2 rollup scaling for low gas fees',
    reasonDisabled: 'Awaiting Layer 2 settlement bridge integration in Phase 2',
  },
  {
    id: 8453,
    name: 'Base',
    shortName: 'Base',
    nativeCurrency: 'ETH',
    status: 'COMING_SOON',
    icon: '🔵',
    description: 'Coinbase EVM Layer 2 network',
    reasonDisabled: 'Awaiting Base smart contract deployment in Phase 2',
  },
  {
    id: 10,
    name: 'Optimism',
    shortName: 'Optimism',
    nativeCurrency: 'ETH',
    status: 'COMING_SOON',
    icon: '🔴',
    description: 'Optimistic EVM Rollup',
    reasonDisabled: 'Scheduled for Layer 2 multi-chain rollout',
  },
  {
    name: 'Solana',
    shortName: 'Solana',
    nativeCurrency: 'SOL',
    status: 'COMING_SOON',
    icon: '🟣',
    description: 'High-throughput non-EVM architecture',
    reasonDisabled: 'Non-EVM direct adapter currently in development pipeline',
  },
  {
    name: 'Bitcoin',
    shortName: 'Bitcoin',
    nativeCurrency: 'BTC',
    status: 'COMING_SOON',
    icon: '₿',
    description: 'Native Bitcoin L1 UTXO Network',
    reasonDisabled: 'Native UTXO script verification pending phase integration',
  },
  {
    name: 'TON Network',
    shortName: 'TON',
    nativeCurrency: 'TON',
    status: 'COMING_SOON',
    icon: '💎',
    description: 'Telegram Open Network payments',
    reasonDisabled: 'TON smart contract bridge scheduled for future release',
  },
  {
    name: 'TRON',
    shortName: 'TRON',
    nativeCurrency: 'TRX',
    status: 'COMING_SOON',
    icon: '🔴',
    description: 'TRC20 stablecoin settlement network',
    reasonDisabled: 'TRC20 protocol adapter in configuration queue',
  },
];

export const DEFAULT_CHAIN_ID = Number(import.meta.env.VITE_DEFAULT_CHAIN_ID || 137);

/**
 * Returns configuration for a supported chain ID
 */
export const getChainConfig = (chainId: number): ChainConfig | undefined => {
  return SUPPORTED_CHAINS[chainId];
};

/**
 * Checks if a network is currently in full SUPPORTED status
 */
export const isChainSupported = (chainId: number): boolean => {
  const chain = SUPPORTED_CHAINS[chainId];
  return Boolean(chain && chain.status === 'SUPPORTED');
};

/**
 * Returns hexadecimal chain ID string (e.g. "0x89" for Polygon)
 */
export const getChainHexId = (chainId: number): string => {
  const chain = SUPPORTED_CHAINS[chainId];
  return chain ? chain.hexId : `0x${chainId.toString(16)}`;
};

/**
 * Returns network status: SUPPORTED | COMING_SOON | NOT_CONFIGURED
 */
export const getNetworkStatus = (chainIdOrName: number | string): NetworkSupportStatus => {
  if (typeof chainIdOrName === 'number') {
    const chain = SUPPORTED_CHAINS[chainIdOrName];
    if (chain) return chain.status;
    const comingSoon = COMING_SOON_NETWORKS.find((n) => n.id === chainIdOrName);
    if (comingSoon) return 'COMING_SOON';
    return 'NOT_CONFIGURED';
  }

  const clean = chainIdOrName.toLowerCase();
  const supported = Object.values(SUPPORTED_CHAINS).find(
    (c) => c.shortName.toLowerCase() === clean || c.name.toLowerCase().includes(clean)
  );
  if (supported) return supported.status;

  const comingSoon = COMING_SOON_NETWORKS.find(
    (n) => n.shortName.toLowerCase() === clean || n.name.toLowerCase().includes(clean)
  );
  if (comingSoon) return 'COMING_SOON';

  return 'NOT_CONFIGURED';
};

/**
 * Returns the native gas currency symbol for a given chain (ETH, POL, BNB, AVAX)
 */
export const getNativeGasAsset = (chainId: number): string => {
  const chain = SUPPORTED_CHAINS[chainId];
  if (chain) return chain.nativeCurrency.symbol;
  if (chainId === 1 || chainId === 11155111 || chainId === 42161 || chainId === 8453 || chainId === 10) return 'ETH';
  if (chainId === 137 || chainId === 80002) return 'POL';
  if (chainId === 56) return 'BNB';
  if (chainId === 43114) return 'AVAX';
  return 'GAS';
};

/**
 * Returns all active supported chains as an array
 */
export const getSupportedChainsList = (): ChainConfig[] => {
  return Object.values(SUPPORTED_CHAINS);
};

/**
 * Returns all upcoming / coming soon networks as an array
 */
export const getComingSoonNetworksList = (): UpcomingNetworkConfig[] => {
  return COMING_SOON_NETWORKS;
};


