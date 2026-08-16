import { SupportedToken } from '../types';
import { getChainConfig } from './chains';

export interface SupportedAsset {
  id: string; // Unique identifier e.g. "USDC-137", "USDT-1"
  symbol: SupportedToken;
  name: string;
  network: string;
  chainId: number;
  contractAddress: string; // Verified contract address or empty placeholder if not verified
  decimals: number;
  nativeGasToken: string; // 'POL' | 'ETH' | 'BNB' | 'AVAX'
  enabled: boolean;
  isNative?: boolean;
  rateToUSD: number;
  icon: string;
  color: string;
  description?: string;
}

/**
 * IRISME Multi-Chain Supported Assets Registry.
 *
 * KEY PRINCIPLE: Assets are identified by BOTH Token + Blockchain.
 * USDC on Polygon is a distinct asset from USDC on Ethereum or Avalanche.
 * Contract addresses are verified canonical deployments or empty placeholders.
 */
export const SUPPORTED_ASSETS: SupportedAsset[] = [
  // ==========================================
  // POLYGON MAINNET (Chain ID: 137) - VERSE HUB
  // ==========================================
  {
    id: 'VERSE-137',
    symbol: 'VERSE',
    name: 'Verse (Polygon)',
    network: 'Polygon',
    chainId: 137,
    contractAddress: import.meta.env.VITE_VERSE_TOKEN_POLYGON || '0xc3503B83F41b44B4C025b39414Bf75B718D05eD8',
    decimals: 18,
    nativeGasToken: 'POL',
    enabled: true,
    rateToUSD: 0.00032,
    icon: '⚡',
    color: '#00D2FE',
    description: 'Verse DEX & Ecosystem Token on Polygon',
  },
  {
    id: 'USDC-137',
    symbol: 'USDC',
    name: 'USD Coin (Polygon)',
    network: 'Polygon',
    chainId: 137,
    contractAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Native Circle USDC
    decimals: 6,
    nativeGasToken: 'POL',
    enabled: true,
    rateToUSD: 1.0,
    icon: '$',
    color: '#3B82F6',
    description: 'Circle Native USDC on Polygon PoS',
  },
  {
    id: 'USDT-137',
    symbol: 'USDT',
    name: 'Tether USD (Polygon)',
    network: 'Polygon',
    chainId: 137,
    contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Official Tether deployment
    decimals: 6,
    nativeGasToken: 'POL',
    enabled: true,
    rateToUSD: 1.0,
    icon: '₮',
    color: '#10B981',
    description: 'Tether USD on Polygon PoS',
  },
  {
    id: 'DAI-137',
    symbol: 'DAI',
    name: 'Dai Stablecoin (Polygon)',
    network: 'Polygon',
    chainId: 137,
    contractAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    decimals: 18,
    nativeGasToken: 'POL',
    enabled: true,
    rateToUSD: 1.0,
    icon: '◈',
    color: '#F59E0B',
    description: 'MakerDAO Dai on Polygon',
  },
  {
    id: 'MATIC-137',
    symbol: 'MATIC',
    name: 'Polygon Ecosystem Token (POL)',
    network: 'Polygon',
    chainId: 137,
    contractAddress: '', // Native gas asset
    decimals: 18,
    nativeGasToken: 'POL',
    enabled: true,
    isNative: true,
    rateToUSD: 0.42,
    icon: '🟣',
    color: '#8247E5',
    description: 'Native gas & staking currency for Polygon PoS',
  },
  {
    id: 'ETH-137',
    symbol: 'ETH',
    name: 'Wrapped Ether (Polygon)',
    network: 'Polygon',
    chainId: 137,
    contractAddress: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    decimals: 18,
    nativeGasToken: 'POL',
    enabled: true,
    rateToUSD: 2850.0,
    icon: 'Ξ',
    color: '#8B5CF6',
    description: 'WETH bridged to Polygon PoS',
  },
  {
    id: 'WBTC-137',
    symbol: 'WBTC',
    name: 'Wrapped BTC (Polygon)',
    network: 'Polygon',
    chainId: 137,
    contractAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    decimals: 8,
    nativeGasToken: 'POL',
    enabled: true,
    rateToUSD: 64200.0,
    icon: '₿',
    color: '#F7931A',
    description: 'Wrapped BTC bridged to Polygon',
  },

  // ==========================================
  // ETHEREUM MAINNET (Chain ID: 1)
  // ==========================================
  {
    id: 'ETH-1',
    symbol: 'ETH',
    name: 'Ether (Ethereum)',
    network: 'Ethereum',
    chainId: 1,
    contractAddress: '', // Native gas asset
    decimals: 18,
    nativeGasToken: 'ETH',
    enabled: true,
    isNative: true,
    rateToUSD: 2850.0,
    icon: 'Ξ',
    color: '#8B5CF6',
    description: 'Native cryptocurrency of Ethereum',
  },
  {
    id: 'USDC-1',
    symbol: 'USDC',
    name: 'USD Coin (Ethereum)',
    network: 'Ethereum',
    chainId: 1,
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    nativeGasToken: 'ETH',
    enabled: true,
    rateToUSD: 1.0,
    icon: '$',
    color: '#3B82F6',
    description: 'Circle USDC on Ethereum Mainnet',
  },
  {
    id: 'USDT-1',
    symbol: 'USDT',
    name: 'Tether USD (Ethereum)',
    network: 'Ethereum',
    chainId: 1,
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    nativeGasToken: 'ETH',
    enabled: true,
    rateToUSD: 1.0,
    icon: '₮',
    color: '#10B981',
    description: 'Tether USD on Ethereum Mainnet',
  },
  {
    id: 'VERSE-1',
    symbol: 'VERSE',
    name: 'Verse (Ethereum)',
    network: 'Ethereum',
    chainId: 1,
    contractAddress: import.meta.env.VITE_VERSE_TOKEN_ETHEREUM || '0x249cA23B342a353a6052564239821a37a86Ba61E',
    decimals: 18,
    nativeGasToken: 'ETH',
    enabled: true,
    rateToUSD: 0.00032,
    icon: '⚡',
    color: '#00D2FE',
    description: 'Verse Token canonical deployment on Ethereum Mainnet',
  },
  {
    id: 'DAI-1',
    symbol: 'DAI',
    name: 'Dai Stablecoin (Ethereum)',
    network: 'Ethereum',
    chainId: 1,
    contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    decimals: 18,
    nativeGasToken: 'ETH',
    enabled: true,
    rateToUSD: 1.0,
    icon: '◈',
    color: '#F59E0B',
    description: 'MakerDAO Dai on Ethereum Mainnet',
  },
  {
    id: 'WBTC-1',
    symbol: 'WBTC',
    name: 'Wrapped BTC (Ethereum)',
    network: 'Ethereum',
    chainId: 1,
    contractAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    decimals: 8,
    nativeGasToken: 'ETH',
    enabled: true,
    rateToUSD: 64200.0,
    icon: '₿',
    color: '#F7931A',
    description: 'Wrapped BTC on Ethereum Mainnet',
  },

  // ==========================================
  // BNB SMART CHAIN (Chain ID: 56)
  // ==========================================
  {
    id: 'BNB-56',
    symbol: 'BNB',
    name: 'BNB (BNB Chain)',
    network: 'BNB Chain',
    chainId: 56,
    contractAddress: '', // Native gas asset
    decimals: 18,
    nativeGasToken: 'BNB',
    enabled: true,
    isNative: true,
    rateToUSD: 580.0,
    icon: '🟡',
    color: '#F0B90B',
    description: 'Native gas currency of BNB Smart Chain',
  },
  {
    id: 'USDC-56',
    symbol: 'USDC',
    name: 'USD Coin (BNB Chain)',
    network: 'BNB Chain',
    chainId: 56,
    contractAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    decimals: 18,
    nativeGasToken: 'BNB',
    enabled: true,
    rateToUSD: 1.0,
    icon: '$',
    color: '#3B82F6',
    description: 'Binance-Peg USD Coin',
  },
  {
    id: 'USDT-56',
    symbol: 'USDT',
    name: 'Tether USD (BNB Chain)',
    network: 'BNB Chain',
    chainId: 56,
    contractAddress: '0x55d398326f99059fF775485246999027B3197955',
    decimals: 18,
    nativeGasToken: 'BNB',
    enabled: true,
    rateToUSD: 1.0,
    icon: '₮',
    color: '#10B981',
    description: 'Binance-Peg BSC-USD',
  },
  {
    id: 'DAI-56',
    symbol: 'DAI',
    name: 'Dai Stablecoin (BNB Chain)',
    network: 'BNB Chain',
    chainId: 56,
    contractAddress: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
    decimals: 18,
    nativeGasToken: 'BNB',
    enabled: true,
    rateToUSD: 1.0,
    icon: '◈',
    color: '#F59E0B',
    description: 'Binance-Peg Dai Token',
  },
  {
    id: 'ETH-56',
    symbol: 'ETH',
    name: 'Ethereum Token (BNB Chain)',
    network: 'BNB Chain',
    chainId: 56,
    contractAddress: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    decimals: 18,
    nativeGasToken: 'BNB',
    enabled: true,
    rateToUSD: 2850.0,
    icon: 'Ξ',
    color: '#8B5CF6',
    description: 'Binance-Peg Ethereum Token',
  },
  {
    id: 'WBTC-56',
    symbol: 'WBTC',
    name: 'BTCB Token (BNB Chain)',
    network: 'BNB Chain',
    chainId: 56,
    contractAddress: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    decimals: 18,
    nativeGasToken: 'BNB',
    enabled: true,
    rateToUSD: 64200.0,
    icon: '₿',
    color: '#F7931A',
    description: 'Binance-Peg BTCB Token',
  },

  // ==========================================
  // AVALANCHE C-CHAIN (Chain ID: 43114)
  // ==========================================
  {
    id: 'AVAX-43114',
    symbol: 'AVAX',
    name: 'Avalanche (C-Chain)',
    network: 'Avalanche',
    chainId: 43114,
    contractAddress: '', // Native gas asset
    decimals: 18,
    nativeGasToken: 'AVAX',
    enabled: true,
    isNative: true,
    rateToUSD: 26.0,
    icon: '🔺',
    color: '#E84142',
    description: 'Native gas currency of Avalanche C-Chain',
  },
  {
    id: 'USDC-43114',
    symbol: 'USDC',
    name: 'USD Coin (Avalanche)',
    network: 'Avalanche',
    chainId: 43114,
    contractAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Native Circle USDC on Avalanche
    decimals: 6,
    nativeGasToken: 'AVAX',
    enabled: true,
    rateToUSD: 1.0,
    icon: '$',
    color: '#3B82F6',
    description: 'Circle Native USDC on Avalanche C-Chain',
  },
  {
    id: 'USDT-43114',
    symbol: 'USDT',
    name: 'Tether USD (Avalanche)',
    network: 'Avalanche',
    chainId: 43114,
    contractAddress: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // Official Tether on Avalanche
    decimals: 6,
    nativeGasToken: 'AVAX',
    enabled: true,
    rateToUSD: 1.0,
    icon: '₮',
    color: '#10B981',
    description: 'Tether USD on Avalanche C-Chain',
  },
  {
    id: 'DAI-43114',
    symbol: 'DAI',
    name: 'Dai.e (Avalanche)',
    network: 'Avalanche',
    chainId: 43114,
    contractAddress: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
    decimals: 18,
    nativeGasToken: 'AVAX',
    enabled: true,
    rateToUSD: 1.0,
    icon: '◈',
    color: '#F59E0B',
    description: 'MakerDAO Dai Bridge on Avalanche',
  },
  {
    id: 'ETH-43114',
    symbol: 'ETH',
    name: 'WETH.e (Avalanche)',
    network: 'Avalanche',
    chainId: 43114,
    contractAddress: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
    decimals: 18,
    nativeGasToken: 'AVAX',
    enabled: true,
    rateToUSD: 2850.0,
    icon: 'Ξ',
    color: '#8B5CF6',
    description: 'Wrapped Ether on Avalanche C-Chain',
  },
  {
    id: 'WBTC-43114',
    symbol: 'WBTC',
    name: 'WBTC.e (Avalanche)',
    network: 'Avalanche',
    chainId: 43114,
    contractAddress: '0x50b7545627a5162F82A992c33b87aDc75187B218',
    decimals: 8,
    nativeGasToken: 'AVAX',
    enabled: true,
    rateToUSD: 64200.0,
    icon: '₿',
    color: '#F7931A',
    description: 'Wrapped BTC on Avalanche C-Chain',
  },

  // ==========================================
  // TESTNETS
  // ==========================================
  {
    id: 'VERSE-80002',
    symbol: 'VERSE',
    name: 'Verse (Amoy Testnet)',
    network: 'Amoy',
    chainId: 80002,
    contractAddress: '0xc3503B83F41b44B4C025b39414Bf75B718D05eD8',
    decimals: 18,
    nativeGasToken: 'MATIC',
    enabled: true,
    rateToUSD: 0.00032,
    icon: '⚡',
    color: '#00D2FE',
    description: 'Verse Token on Polygon Amoy Testnet',
  },
  {
    id: 'VERSE-11155111',
    symbol: 'VERSE',
    name: 'Verse (Sepolia Testnet)',
    network: 'Sepolia',
    chainId: 11155111,
    contractAddress: '0x249cA23B342a353a6052564239821a37a86Ba61E',
    decimals: 18,
    nativeGasToken: 'ETH',
    enabled: true,
    rateToUSD: 0.00032,
    icon: '⚡',
    color: '#00D2FE',
    description: 'Verse Token on Sepolia Testnet',
  },
  // ==========================================
  // SOLANA, TRON, BNB & BITCOIN ASSETS
  // ==========================================
  {
    id: 'USDC-solana',
    symbol: 'USDC',
    name: 'USD Coin (Solana SPL)',
    network: 'Solana',
    chainId: 101,
    contractAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    nativeGasToken: 'SOL',
    enabled: true,
    rateToUSD: 1.0,
    icon: '$',
    color: '#3B82F6',
    description: 'Native USDC SPL Token on Solana Network',
  },
  {
    id: 'SOL-solana',
    symbol: 'SOL',
    name: 'Solana (Native)',
    network: 'Solana',
    chainId: 101,
    contractAddress: '',
    decimals: 9,
    nativeGasToken: 'SOL',
    enabled: true,
    rateToUSD: 184.2,
    icon: '🟣',
    color: '#14F195',
    description: 'Native Solana SOL Coin',
  },
  {
    id: 'USDC-tron',
    symbol: 'USDC',
    name: 'USD Coin (TRON TRC20)',
    network: 'TRON',
    chainId: 728126428,
    contractAddress: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
    decimals: 6,
    nativeGasToken: 'TRX',
    enabled: true,
    rateToUSD: 1.0,
    icon: '$',
    color: '#3B82F6',
    description: 'USDC TRC20 Token on TRON Network',
  },
  {
    id: 'TRX-tron',
    symbol: 'TRX',
    name: 'TRON (Native)',
    network: 'TRON',
    chainId: 728126428,
    contractAddress: '',
    decimals: 6,
    nativeGasToken: 'TRX',
    enabled: true,
    rateToUSD: 0.245,
    icon: '🔴',
    color: '#FF060A',
    description: 'Native TRON TRX Coin',
  },
  {
    id: 'BTC-bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin (Native Layer 1)',
    network: 'Bitcoin',
    chainId: 0,
    contractAddress: '',
    decimals: 8,
    nativeGasToken: 'BTC',
    enabled: true,
    rateToUSD: 96450.0,
    icon: '₿',
    color: '#F7931A',
    description: 'Native Bitcoin L1 Blockchain Network',
  },
];

/**
 * Returns a unique asset by symbol + chainId
 */
export const getSupportedAsset = (symbol: SupportedToken, chainId: number): SupportedAsset | undefined => {
  return SUPPORTED_ASSETS.find((a) => a.symbol === symbol && a.chainId === chainId && a.enabled);
};

/**
 * Returns a unique asset by its composite asset ID (e.g. "USDC-137")
 */
export const getSupportedAssetById = (assetId: string): SupportedAsset | undefined => {
  return SUPPORTED_ASSETS.find((a) => a.id === assetId && a.enabled);
};

/**
 * Returns all enabled assets on a given network/chainId
 */
export const getAssetsForChain = (chainId: number): SupportedAsset[] => {
  return SUPPORTED_ASSETS.filter((a) => a.chainId === chainId && a.enabled);
};

/**
 * Returns all enabled assets in the entire ecosystem
 */
export const getAllSupportedAssets = (): SupportedAsset[] => {
  return SUPPORTED_ASSETS.filter((a) => a.enabled);
};

/**
 * Helper to display asset label with both Token and Network: e.g. "USDC / Polygon"
 */
export const formatAssetLabel = (asset: SupportedAsset): string => {
  return `${asset.symbol} / ${asset.network}`;
};
