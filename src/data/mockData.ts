import {
  TokenOption,
  Payment,
  LoyaltyTier,
  CustomerLoyaltyCard,
  RewardCampaign,
  VerseRewardRecord,
  MerchantProfile,
  CustomerProfile,
  MerchantLoyaltyGoal,
} from '../types';

export const DEFAULT_MERCHANT_LOYALTY_GOAL: MerchantLoyaltyGoal = {
  enabled: true,
  targetPurchases: 5,
  rewardType: 'fixed_verse',
  rewardValue: 250,
  rewardDescription: 'Make 5 purchases and receive bonus VERSE rewards on Verse DEX.',
};

/**
 * Verified tokens accepted for merchant payments:
 * - VERSE (Bitcoin.com Ecosystem Token on Polygon & Ethereum)
 * - USDT on Polygon, Ethereum, Base, Arbitrum, BSC, Avalanche
 * - USDC on Polygon, Ethereum, Base, Arbitrum, BSC, Avalanche
 * - BTC / WBTC
 * - ETH on Ethereum, Base, Arbitrum, Polygon, BSC
 * - SOL on Solana
 * - BNB on BNB Chain
 * - POL on Polygon
 * - AVAX on Avalanche
 * - DAI on Polygon, Ethereum, Base, Arbitrum, BSC
 * - TRX on TRON
 */
export const SUPPORTED_TOKENS: TokenOption[] = [
  {
    symbol: 'VERSE',
    name: 'Verse (Bitcoin.com Ecosystem)',
    decimals: 18,
    rateToUSD: 0.0000176,
    icon: '⚡',
    color: '#00D2FE',
    network: 'Polygon PoS (0xc708...8fec) / Ethereum (0x249c...0a18)',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD (USDT)',
    decimals: 6,
    rateToUSD: 1.0,
    icon: '₮',
    color: '#26A17B',
    network: 'Polygon / Ethereum / Base / Arbitrum / BSC / Avalanche',
    isStablecoin: true,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin (USDC)',
    decimals: 6,
    rateToUSD: 1.0,
    icon: '$',
    color: '#2775CA',
    network: 'Polygon / Ethereum / Base / Arbitrum / BSC / Avalanche',
    isStablecoin: true,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum (ETH)',
    decimals: 18,
    rateToUSD: 2850.0,
    icon: 'Ξ',
    color: '#627EEA',
    network: 'Ethereum / Base / Arbitrum / Polygon / BSC',
  },
  {
    symbol: 'POL',
    name: 'Polygon Token (POL)',
    decimals: 18,
    rateToUSD: 0.44,
    icon: '🟣',
    color: '#8247E5',
    network: 'Polygon Mainnet (Verse Primary Hub)',
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin (BTC)',
    decimals: 8,
    rateToUSD: 96450.0,
    icon: '₿',
    color: '#F7931A',
    network: 'Bitcoin L1 / WBTC Multi-Chain',
  },
  {
    symbol: 'SOL',
    name: 'Solana (SOL)',
    decimals: 9,
    rateToUSD: 184.2,
    icon: '🟣',
    color: '#14F195',
    network: 'Solana Mainnet-Beta',
  },
  {
    symbol: 'BNB',
    name: 'BNB (BNB Smart Chain)',
    decimals: 18,
    rateToUSD: 645.0,
    icon: '🟡',
    color: '#F0B90B',
    network: 'BNB Smart Chain (BSC)',
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin (WBTC)',
    decimals: 8,
    rateToUSD: 96450.0,
    icon: '₿',
    color: '#F7931A',
    network: 'Polygon / Ethereum / Arbitrum / Base / BSC',
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche (AVAX)',
    decimals: 18,
    rateToUSD: 27.5,
    icon: '🔺',
    color: '#E84142',
    network: 'Avalanche C-Chain',
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin (DAI)',
    decimals: 18,
    rateToUSD: 1.0,
    icon: '◈',
    color: '#F5AC37',
    network: 'Polygon / Ethereum / Base / Arbitrum / BSC',
    isStablecoin: true,
  },
  {
    symbol: 'TRX',
    name: 'TRON (TRX)',
    decimals: 6,
    rateToUSD: 0.245,
    icon: '🔴',
    color: '#FF060A',
    network: 'TRON Mainnet',
  },
];

export const FIAT_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AUD)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)' },
];

export const DEFAULT_LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: 'tier-bronze',
    name: 'Bronze Member',
    tierLevel: 1,
    minVisits: 0,
    minSpendUSD: 0,
    bonusVersePercent: 0,
    perkDescription: 'Standard 3% VERSE rewards on every purchase',
    color: '#CD7F32',
    badge: '🥉',
  },
  {
    id: 'tier-silver',
    name: 'Silver VIP',
    tierLevel: 2,
    minVisits: 3,
    minSpendUSD: 150,
    bonusVersePercent: 25,
    perkDescription: '1.25x VERSE rewards multiplier, priority settlement',
    color: '#C0C0C0',
    badge: '🥈',
  },
  {
    id: 'tier-gold',
    name: 'Gold Elite',
    tierLevel: 3,
    minVisits: 8,
    minSpendUSD: 500,
    bonusVersePercent: 50,
    perkDescription: '1.5x VERSE rewards multiplier, VIP merchant promotions',
    color: '#FFD700',
    badge: '🥇',
  },
  {
    id: 'tier-platinum',
    name: 'Platinum Legend',
    tierLevel: 4,
    minVisits: 20,
    minSpendUSD: 1500,
    bonusVersePercent: 100,
    perkDescription: '2x Double VERSE rewards, direct Verse DEX staking access',
    color: '#E5E4E2',
    badge: '👑',
  },
];

// Clean fresh initial merchant state (no fake dummy business or transactions)
export const INITIAL_MERCHANT_PROFILE: MerchantProfile = {
  id: '',
  name: '',
  tagline: '',
  category: 'Retail',
  description: '',
  website: '',
  supportEmail: '',
  phone: '',
  businessAddress: '',
  taxId: '',
  settlementAddress: '',
  defaultPaymentAsset: 'VERSE',
  defaultFiatCurrency: 'USD',
  baseRewardPercent: 3.0,
  merchantType: 'irisme_merchant',
  status: 'pending_verification',
  apiKey: '',
  apiWebhookUrl: '',
  createdAt: new Date().toISOString(),
  verseRewardPoolBalance: 0,
  autoReplenishPool: false,
  replenishThreshold: 0,
  loyaltyProgramEnabled: true,
  loyaltyGoal: DEFAULT_MERCHANT_LOYALTY_GOAL,
  isOnboarded: false,
};

// Clean fresh initial payments list (empty)
export const INITIAL_PAYMENTS: Payment[] = [];

// Clean fresh initial campaigns list (empty)
export const INITIAL_CAMPAIGNS: RewardCampaign[] = [];

// Clean fresh customer state
export const INITIAL_CUSTOMER_PROFILE: CustomerProfile = {
  id: '',
  walletAddress: '',
  displayName: '',
  avatarIcon: '👤',
  favoriteCategories: [],
  autoStakeVerse: false,
  notifyOnCashback: true,
  welcomeBonusClaimed: false,
  isOnboarded: false,
  tierRank: 'tier-bronze',
  joinedAt: new Date().toISOString(),
};

export const INITIAL_CUSTOMER_LOYALTY_CARDS: CustomerLoyaltyCard[] = [];
export const INITIAL_CUSTOMER_REWARDS: VerseRewardRecord[] = [];
