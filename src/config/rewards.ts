/**
 * IRISME VERSE CUSTOMER REWARD CONFIGURATION
 *
 * Centralized, configurable reward configuration for IrisMe customer loyalty incentives.
 * Distinguishes between IRISME MERCHANTS (1.00% base) and EXTERNAL MERCHANTS (0.25% base).
 */

export type MerchantCategoryType = 'irisme_merchant' | 'external_merchant';

export interface RewardConfiguration {
  /**
   * Reward percentage for IrisMe Native Merchants (default: 1.00%)
   * Example: $100 purchase -> $1.00 worth of VERSE
   */
  irismeMerchantRewardPercent: number;

  /**
   * Reward percentage for External Merchants (default: 0.25%)
   * Example: $100 purchase -> $0.25 worth of VERSE
   */
  externalMerchantRewardPercent: number;

  /**
   * Default price of VERSE in USD used for accounting estimation
   */
  defaultVersePriceUSD: number;

  /**
   * Minimum payment amount in USD to qualify for rewards
   */
  minPaymentAmountUSD: number;

  /**
   * Batch distribution threshold (VERSE tokens needed before automated on-chain disbursement)
   */
  batchThresholdVerse: number;
}

export const DEFAULT_REWARD_CONFIG: RewardConfiguration = {
  irismeMerchantRewardPercent: 1.00, // 1.00% reward for IrisMe Merchants ($1.00 per $100)
  externalMerchantRewardPercent: 0.25, // 0.25% reward for External Merchants ($0.25 per $100)
  defaultVersePriceUSD: 0.00035, // 1 VERSE = $0.00035 USD (~2,857 VERSE per $1.00)
  minPaymentAmountUSD: 0.10,
  batchThresholdVerse: 1000,
};

let currentRewardConfig: RewardConfiguration = { ...DEFAULT_REWARD_CONFIG };

/**
 * Returns the active centralized reward configuration
 */
export const getRewardConfig = (): RewardConfiguration => {
  return {
    ...currentRewardConfig,
  };
};

/**
 * Dynamically updates the centralized reward configuration
 */
export const updateRewardConfig = (updates: Partial<RewardConfiguration>): RewardConfiguration => {
  currentRewardConfig = {
    ...currentRewardConfig,
    ...updates,
    irismeMerchantRewardPercent: updates.irismeMerchantRewardPercent !== undefined
      ? Math.max(0, Math.min(100, updates.irismeMerchantRewardPercent))
      : currentRewardConfig.irismeMerchantRewardPercent,
    externalMerchantRewardPercent: updates.externalMerchantRewardPercent !== undefined
      ? Math.max(0, Math.min(100, updates.externalMerchantRewardPercent))
      : currentRewardConfig.externalMerchantRewardPercent,
  };
  return { ...currentRewardConfig };
};

/**
 * Helper to obtain the configured reward rate for a given merchant type
 */
export const getRewardRateForMerchantType = (merchantType: MerchantCategoryType = 'irisme_merchant'): number => {
  const config = getRewardConfig();
  return merchantType === 'irisme_merchant'
    ? config.irismeMerchantRewardPercent
    : config.externalMerchantRewardPercent;
};
