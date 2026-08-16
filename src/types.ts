export type PaymentStatus =
  | 'created'
  | 'awaiting_payment'
  | 'transaction_detected'
  | 'verifying'
  | 'processing'
  | 'submitted'
  | 'confirming'
  | 'confirmed'
  | 'paid'
  | 'expired'
  | 'failed'
  | 'pending'
  | 'completed';

export type MerchantCategoryType = 'irisme_merchant' | 'external_merchant';

/**
 * 11 Explicit Payment Engine States
 */
export type PaymentEngineState =
  | 'Ready'
  | 'Insufficient balance'
  | 'Insufficient gas'
  | 'Wrong network'
  | 'Preparing transaction'
  | 'Awaiting wallet confirmation'
  | 'Transaction submitted'
  | 'Confirming'
  | 'Confirmed'
  | 'Failed'
  | 'Rejected';

export type SupportedToken =
  | 'USDT'
  | 'USDC'
  | 'DAI'
  | 'VERSE'
  | 'ETH'
  | 'WBTC'
  | 'MATIC'
  | 'POL'
  | 'BNB'
  | 'AVAX'
  | 'SOL'
  | 'BTC'
  | 'TRX';

export type SupportedNetworkName =
  | 'Polygon'
  | 'Ethereum'
  | 'BNB Chain'
  | 'Avalanche'
  | 'Solana'
  | 'TRON'
  | 'Bitcoin';

export interface TransferTransaction {
  id: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  token: SupportedToken;
  network: SupportedNetworkName | string;
  chainId?: number;
  amountCrypto: number;
  amountUSD: number;
  feeCrypto: number;
  feeToken: string;
  feeUSD: number;
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  timestamp: string;
  explorerUrl?: string;
  memo?: string;
  isRealOnChain?: boolean;
}

export type FiatCurrency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

export type NetworkSupportStatus = 'SUPPORTED' | 'COMING_SOON' | 'NOT_CONFIGURED';

/**
 * Gas Estimation Service Result Abstraction
 */
export interface GasEstimationResult {
  estimatedGasUnits: number;
  gasPriceGwei: number;
  nativeGasToken: string; // 'POL' | 'ETH' | 'BNB' | 'AVAX'
  estimatedNativeGasCost: number;
  estimatedUSDCost: number | null;
  timestamp: number;
  network: string;
  isAvailable: boolean;
  formattedGas: string; // e.g. "~0.00228 POL ($0.001)" or "Gas estimate unavailable"
  errorReason?: string;
}

/**
 * Multi-chain Payment Validation Result
 */
export interface PaymentValidationResult {
  isValid: boolean;
  state: PaymentEngineState;
  isWalletConnected: boolean;
  isCorrectNetwork: boolean;
  currentChainId?: number;
  currentNetworkName?: string;
  targetChainId: number;
  targetNetworkName: string;
  hasTokenBalance: boolean;
  userTokenBalance: number;
  requiredTokenAmount: number;
  tokenSymbol: SupportedToken;
  hasGasBalance: boolean;
  userGasBalance: number;
  estimatedGasCost: number;
  nativeGasToken: string;
  isValidMerchantAddress: boolean;
  isValidAmount: boolean;
  statusMessage: string;
  detailedExplanation?: string;
}

/**
 * 1. BLOCKCHAIN NETWORK FEES (Gas)
 * Dynamic on-chain gas estimation paid to blockchain miners / validators in native gas token (POL, ETH, BNB, AVAX).
 * Never conflated with platform fees or VERSE rewards.
 */
export interface GasEstimate {
  chainId: number;
  networkName: string;
  nativeGasToken: string; // 'POL' | 'ETH' | 'BNB' | 'AVAX'
  nativeGasTokenPriceUSD: number;
  gasUnits: number; // e.g. 21,000 for native transfer, 65,000 for ERC20 transfer
  gasPriceGwei: number; // e.g. 35 Gwei
  gasCostNative: number; // (gasUnits * gasPriceGwei) / 1e9
  gasCostUSD: number; // gasCostNative * nativeGasTokenPriceUSD
  formattedGas: string; // e.g. "~0.00228 POL ($0.001)"
}

/**
 * 2. IRISME PLATFORM FEES & NET SETTLEMENT
 * IrisMe platform facilitation fee (0.5%) subtracted from payment amount to determine merchant net settlement.
 */
export interface PlatformFeeDetails {
  platformFeePercent: number; // e.g. 0.5%
  platformFeeUSD: number; // amountUSD * 0.005
  platformFeeTokenAmount: number; // tokenAmount * 0.005
}

export interface MerchantNetSettlement {
  netUSD: number; // amountUSD - platformFeeUSD
  netTokenAmount: number; // tokenAmount - platformFeeTokenAmount
  settlementAddress: string;
}

export type SettlementStatus = 'COMPLETED' | 'PROCESSING' | 'FAILED';

export interface SettlementRecord {
  id: string; // e.g. "stl_9824_4812"
  merchantId: string;
  amountUSD: number;
  tokenAmount: number;
  tokenSymbol: SupportedToken;
  destinationAddress: string;
  chainId: number;
  status: SettlementStatus;
  txHash?: string;
  createdAt: string;
  completedAt?: string;
  type: 'DIRECT_SETTLEMENT' | 'MANUAL_WITHDRAWAL';
  note?: string;
}

export interface MerchantBalanceSummary {
  availableBalanceUSD: number;
  pendingBalanceUSD: number;
  totalSettledUSD: number;
  settlementAddress: string;
  totalReceivedUSD: number;
}

export interface TokenOption {
  symbol: SupportedToken;
  name: string;
  decimals: number;
  rateToUSD: number; // 1 Token = $X USD
  icon: string;
  color: string;
  network: string;
  isStablecoin?: boolean;
}

/**
 * Multi-chain Payment with Strict Economic Concept Separation:
 * 1. Blockchain Network Fee (Gas in native token)
 * 2. IrisMe Platform Fee & Net Settlement
 * 3. VERSE Customer Rewards (Funded by merchant pool / campaign)
 */
export interface Payment {
  id: string;
  invoiceNumber: string;
  // Merchant details
  merchantId: string;
  merchantName: string;
  merchantType?: MerchantCategoryType;
  merchantAddress?: string; // settlement address
  // Payment amount & asset
  amountUSD: number;
  fiatCurrency?: FiatCurrency;
  selectedToken: SupportedToken;
  tokenAmount: number;
  tokenAddress?: string;
  // Blockchain / Network
  chainId: number;
  networkName?: string;
  // 1. Blockchain Network Fee (Gas)
  gasEstimate?: GasEstimate;
  estimatedGasUSD?: number;
  // 2. IrisMe Platform Fee & Net Settlement
  platformFeePercent: number; // e.g. 0.5%
  platformFeeUSD: number;
  platformFeeTokenAmount: number;
  netSettlementUSD: number;
  netSettlementTokenAmount: number;
  // 3. VERSE Customer Rewards
  cashbackPercent: number; // customer reward rate %
  verseEarned: number; // customer reward amount in VERSE
  verseUSDValue: number; // customer reward amount in USD
  rewardStatus: RewardStatus;
  campaignBonusVerse?: number;
  campaignId?: string;
  loyaltyPointsEarned?: number;
  // Customer & Transaction lifecycle
  customerWallet?: string;
  customerName?: string;
  orderRef?: string;
  description: string;
  status: PaymentStatus;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
  txHash?: string;
  blockNumber?: number;
  isRealOnChain?: boolean;
  receiptUrl?: string;
}

export interface MerchantLoyaltyGoal {
  enabled: boolean;
  targetPurchases: number; // e.g. 5 purchases
  rewardType: 'fixed_verse' | 'discount_percent' | 'custom_perk';
  rewardValue: number; // e.g. 250 (VERSE) or 10 (%)
  rewardDescription: string; // e.g. "250 VERSE Reward Bonus + Free Coffee"
}

export interface LoyaltyTier {
  id: string;
  name: string;
  tierLevel: number;
  minVisits: number;
  minSpendUSD: number;
  bonusVersePercent: number;
  perkDescription: string;
  color: string;
  badge: string;
}

export interface CustomerLoyaltyCard {
  merchantId: string;
  merchantName: string;
  merchantCategory: string;
  customerWallet: string;
  // Core wallet loyalty tracking metrics
  purchaseCount: number; // number of completed purchases
  visitsCount: number; // alias for purchaseCount
  totalSpentUSD: number; // total amount spent in USD
  verseEarned: number; // total VERSE cashback earned at this merchant
  loyaltyProgress: number; // progress count towards current goal (e.g. 3 of 5)
  targetPurchases: number; // merchant's loyalty target (e.g. 5)
  rewardAvailable: boolean; // whether milestone reward is unlocked & claimable
  rewardDescription: string;
  rewardType: 'fixed_verse' | 'discount_percent' | 'custom_perk';
  rewardValue: number;
  nextMilestone: string; // e.g. "2 more purchases until 250 VERSE reward"
  unclaimedRewardsCount: number;
  claimedMilestones?: number;
  currentTier: LoyaltyTier;
  stampsCount: number;
  punchCardStamps?: number;
  maxStampsPerCard: number;
  punchCardMax?: number;
  lastVisitAt: string;
  lastVisit?: string;
  joinedAt: string;
  availableDiscountPercent?: number;
}

export interface RewardCampaign {
  id: string;
  merchantId?: string;
  name: string; // e.g. "Weekend VERSE Cashback" or "First 100 Customers"
  title: string; // alias for name
  description: string;
  tagline: string; // alias for description
  rewardType: 'percentage' | 'fixed_verse' | 'multiplier' | 'fixed_bonus' | 'tier_boost';
  rewardValue: number; // e.g. 5 for 5% cashback or 500 for 500 VERSE reward
  type?: 'multiplier' | 'fixed_bonus' | 'tier_boost'; // backward compatibility
  verseMultiplier?: number;
  fixedBonusVerse?: number;
  minSpendUSD: number; // minimum payment required to qualify (e.g. $10)
  maxParticipants: number; // max participants allowed (e.g. 100)
  currentParticipants: number;
  participatingCustomers?: number; // alias
  participantWallets?: string[];
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'ended' | 'paused';
  budgetVerse?: number;
  spentVerse?: number;
}

export type RewardStatus =
  | 'calculated'
  | 'pending'
  | 'claimable'
  | 'distributed'
  | 'failed'
  | 'claimed'; // backward-compatibility alias for distributed

export interface VerseRewardRecord {
  id: string;
  paymentId: string;
  paymentInvoiceNumber?: string;
  merchantId?: string;
  merchantName: string;
  merchantType?: MerchantCategoryType;
  customerWallet: string;
  rewardPercentage: number;
  amountVerse: number;
  usdValue: number;
  status: RewardStatus;
  paymentTxHash?: string;
  distributionTxHash?: string;
  claimTxHash?: string;
  blockNumber?: number;
  chainId?: number;
  isRealOnChain?: boolean;
  timestamp: string;
  distributedAt?: string;
  failedReason?: string;
  source: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string;
  network: string;
  chainId: number;
  role: 'merchant' | 'customer';
  walletMode?: 'injected' | 'custom' | 'demo';
  isWrongNetwork?: boolean;
  balances: {
    VERSE: number;
    USDT: number;
    USDC: number;
    DAI: number;
    ETH: number;
    WBTC: number;
    MATIC: number;
    BNB?: number;
    AVAX?: number;
    SOL?: number;
    BTC?: number;
    TRX?: number;
    [key: string]: number | undefined;
  };
}

export type MerchantStatus = 'active' | 'pending_verification' | 'suspended';

export interface MerchantProfile {
  id: string; // Unique Merchant ID e.g. m_iris_948271
  email?: string;
  name: string; // Business Name
  description: string;
  category: string; // Business Category
  merchantType?: MerchantCategoryType;
  tagline: string;
  website?: string;
  supportEmail?: string;
  phone?: string;
  businessAddress?: string;
  taxId?: string; // EIN / VAT / Registration Number
  settlementAddress: string; // Receiving crypto payment wallet address
  defaultPaymentAsset: SupportedToken;
  defaultFiatCurrency: FiatCurrency;
  status: MerchantStatus;
  verseRewardPoolBalance: number;
  baseRewardPercent: number;
  autoReplenishPool: boolean;
  replenishThreshold: number;
  loyaltyProgramEnabled: boolean;
  loyaltyGoal?: MerchantLoyaltyGoal;
  isOnboarded: boolean;
  apiKey?: string;
  apiWebhookUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MerchantAuthResponse {
  success: boolean;
  token?: string;
  merchant?: MerchantProfile;
  error?: string;
}

export interface CustomerProfile {
  id: string;
  walletAddress: string;
  displayName: string;
  avatarIcon: string;
  favoriteCategories: string[];
  autoStakeVerse: boolean;
  notifyOnCashback: boolean;
  welcomeBonusClaimed: boolean;
  isOnboarded: boolean;
  tierRank: string;
  joinedAt: string;
}

export interface MerchantReputationStats {
  totalSuccessfulTransactions: number;
  totalPaymentVolumeUSD: number;
  totalReputationPoints: number;
  totalVerseRewardsGenerated: number;
  returningCustomersCount: number;
  currentTier: {
    id: string;
    name: string;
    minPayments: number;
    maxPayments: number;
    badge: string;
    color: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
    description: string;
  };
  nextTier: {
    id: string;
    name: string;
    minPayments: number;
    maxPayments: number;
    badge: string;
    color: string;
  } | null;
  progressPercent: number;
  transactionsNeededForNextTier: number;
}

export type VerificationCheckStatus = 'PASSED' | 'FAILED' | 'PENDING' | 'SKIPPED';

export interface VerificationCheckItem {
  id: string;
  name: string;
  description: string;
  status: VerificationCheckStatus;
  details?: string;
  expected?: any;
  actual?: any;
  error?: string;
}

export interface VerificationChecks {
  invoiceCheck: VerificationCheckItem;
  networkCheck: VerificationCheckItem;
  recipientCheck: VerificationCheckItem;
  assetCheck: VerificationCheckItem;
  amountCheck: VerificationCheckItem;
  txValidityCheck: VerificationCheckItem;
  executionSuccessCheck: VerificationCheckItem;
  confirmationFinalityCheck: VerificationCheckItem;
  idempotencyCheck: VerificationCheckItem;
}

export interface BlockchainVerificationReport {
  paymentId: string;
  txHash: string;
  verified: boolean;
  status: 'AWAITING_PAYMENT' | 'TRANSACTION_DETECTED' | 'VERIFYING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED';
  errorCode?: string;
  errorMessage?: string;
  checks: VerificationChecks;
  idempotencyKey?: string;
  verifiedAt?: string;
  blockNumber?: number;
  confirmations?: number;
  network: string;
  chainId: number;
  tokenSymbol: string;
  amountExpected: number;
  amountReceived: number;
  merchantSettlementAddress: string;
  payerAddress?: string;
  isIdempotentReplay?: boolean;
}

export type VerificationTestScenario =
  | 'SUCCESSFUL_PAYMENT'
  | 'FAILED_REVERTED_TX'
  | 'DUPLICATE_TX_REPLAY'
  | 'INCORRECT_AMOUNT_UNDERPAYMENT'
  | 'INCORRECT_NETWORK_MISMATCH'
  | 'INCORRECT_TOKEN_MISMATCH'
  | 'INCORRECT_RECIPIENT_ADDRESS'
  | 'EXPIRED_PAYMENT_ATTEMPT';

export interface VerificationAuditLog {
  id: string;
  timestamp: string;
  paymentId: string;
  txHash: string;
  merchantId: string;
  network: string;
  tokenSymbol: string;
  tokenAmount: number;
  verified: boolean;
  status: string;
  checksSummary: string;
  failedCheckId?: string;
  reason?: string;
  ipAddress?: string;
}
