import { SupportedToken } from '../types';

export interface TokenAddressConfig {
  symbol: SupportedToken;
  name: string;
  decimals: number;
  addresses: Partial<Record<number, string>>; // chainId -> address
  isNative?: boolean;
  rateToUSD: number;
  icon: string;
  color: string;
}

// Canonical ERC-20 Minimal ABI for Transfers, Balances, and Approvals
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// Token configurations across supported networks (Polygon 137, Ethereum 1, BNB 56, Avalanche 43114, Amoy 80002, Sepolia 11155111)
export const TOKEN_CONFIGS: Record<SupportedToken, TokenAddressConfig> = {
  VERSE: {
    symbol: 'VERSE',
    name: 'Verse',
    decimals: 18,
    rateToUSD: 0.00032,
    icon: '⚡',
    color: '#00D2FE',
    addresses: {
      // Official Canonical VERSE Token Contracts
      137: import.meta.env.VITE_VERSE_TOKEN_POLYGON || '0xc3503B83F41b44B4C025b39414Bf75B718D05eD8',
      1: import.meta.env.VITE_VERSE_TOKEN_ETHEREUM || '0x249cA23B342a353a6052564239821a37a86Ba61E',
      80002: '0xc3503B83F41b44B4C025b39414Bf75B718D05eD8',
      11155111: '0x249cA23B342a353a6052564239821a37a86Ba61E',
    },
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    rateToUSD: 1.0,
    icon: '₮',
    color: '#10B981',
    addresses: {
      137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      56: '0x55d398326f99059fF775485246999027B3197955',
      43114: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    },
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    rateToUSD: 1.0,
    icon: '$',
    color: '#3B82F6',
    addresses: {
      137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Native USDC on Polygon
      1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    },
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    rateToUSD: 1.0,
    icon: '◈',
    color: '#F59E0B',
    addresses: {
      137: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      1: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      56: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
      43114: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
    },
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    rateToUSD: 2850.0,
    icon: 'Ξ',
    color: '#8B5CF6',
    isNative: true,
    addresses: {
      137: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
      1: '', // Native ETH
      56: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // Binance-Peg ETH
      43114: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', // WETH.e on Avalanche
    },
  },
  MATIC: {
    symbol: 'MATIC',
    name: 'Polygon Token (POL)',
    decimals: 18,
    rateToUSD: 0.42,
    icon: '🟣',
    color: '#8247E5',
    isNative: true,
    addresses: {
      137: '', // Native POL/MATIC
      1: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    },
  },
  POL: {
    symbol: 'POL',
    name: 'Polygon Ecosystem Token (POL)',
    decimals: 18,
    rateToUSD: 0.42,
    icon: '🟣',
    color: '#8247E5',
    isNative: true,
    addresses: {
      137: '', // Native POL
      80002: '', // Amoy Testnet
      1: '0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3e6',
    },
  },
  BNB: {
    symbol: 'BNB',
    name: 'BNB',
    decimals: 18,
    rateToUSD: 580.0,
    icon: '🟡',
    color: '#F0B90B',
    isNative: true,
    addresses: {
      56: '', // Native BNB on BSC
      1: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
    },
  },
  AVAX: {
    symbol: 'AVAX',
    name: 'Avalanche',
    decimals: 18,
    rateToUSD: 26.0,
    icon: '🔺',
    color: '#E84142',
    isNative: true,
    addresses: {
      43114: '', // Native AVAX on Avalanche
    },
  },
  WBTC: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    rateToUSD: 96450.0,
    icon: '₿',
    color: '#F7931A',
    addresses: {
      137: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
      1: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      56: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
      43114: '0x50b7545627a5162F82A992c33b87aDc75187B218',
    },
  },
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin (Native Layer 1)',
    decimals: 8,
    rateToUSD: 96450.0,
    icon: '₿',
    color: '#F7931A',
    isNative: true,
    addresses: {},
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana (Native Layer 1)',
    decimals: 9,
    rateToUSD: 184.2,
    icon: '🟣',
    color: '#14F195',
    isNative: true,
    addresses: {},
  },
  TRX: {
    symbol: 'TRX',
    name: 'TRON (Native Layer 1)',
    decimals: 6,
    rateToUSD: 0.245,
    icon: '🔴',
    color: '#FF060A',
    isNative: true,
    addresses: {},
  },
};

export const getTokenAddress = (symbol: SupportedToken, chainId: number): string | undefined => {
  return TOKEN_CONFIGS[symbol]?.addresses[chainId];
};

export const getTokenDecimals = (symbol: SupportedToken): number => {
  return TOKEN_CONFIGS[symbol]?.decimals || 18;
};

export const isTokenConfiguredOnChain = (symbol: SupportedToken, chainId: number): boolean => {
  const config = TOKEN_CONFIGS[symbol];
  if (!config) return false;
  
  // Native tokens on their native chain are always configured
  if (config.isNative) {
    if ((symbol === 'MATIC' || symbol === 'POL') && (chainId === 137 || chainId === 80002)) return true;
    if (symbol === 'ETH' && (chainId === 1 || chainId === 11155111)) return true;
    if (symbol === 'BNB' && chainId === 56) return true;
    if (symbol === 'AVAX' && chainId === 43114) return true;
  }
  
  const addr = config.addresses[chainId];
  return addr !== undefined && addr !== '';
};

