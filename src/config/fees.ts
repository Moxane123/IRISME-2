/**
 * IRISME PROTOCOL FEE & TRANSACTION ECONOMICS CONFIGURATION
 *
 * Configurable platform fee settings allowing dynamic protocol fee adjustment
 * without requiring application refactoring or hardcoding.
 */

export interface FeeConfiguration {
  /**
   * IrisMe Platform Protocol Fee Percentage.
   * Default initial rate: 0.25% (e.g. $0.25 on a $100 invoice).
   */
  platformFeePercent: number;

  /**
   * Optional minimum fee cap in USD (if any)
   */
  minFeeUSD?: number;

  /**
   * Optional maximum fee cap in USD (if any)
   */
  maxFeeUSD?: number;

  /**
   * Non-custodial IrisMe Protocol fee treasury / collector address placeholder
   */
  feeRecipientAddress: string;

  /**
   * Whether automatic treasury routing is enabled (disabled in current phase)
   */
  treasuryEnabled: boolean;
}

export const DEFAULT_FEE_CONFIG: FeeConfiguration = {
  platformFeePercent: 0.25, // Initial IrisMe platform fee: 0.25% of payment amount
  minFeeUSD: 0.0,
  feeRecipientAddress: '0x0000000000000000000000000000000000000000',
  treasuryEnabled: false,
};

let currentFeeConfig: FeeConfiguration = { ...DEFAULT_FEE_CONFIG };

/**
 * Returns the currently active fee configuration
 */
export const getFeeConfig = (): FeeConfiguration => {
  return { ...currentFeeConfig };
};

/**
 * Updates the protocol fee configuration dynamically
 */
export const updateFeeConfig = (updates: Partial<FeeConfiguration>): FeeConfiguration => {
  currentFeeConfig = {
    ...currentFeeConfig,
    ...updates,
    platformFeePercent: updates.platformFeePercent !== undefined
      ? Math.max(0, Math.min(10, updates.platformFeePercent))
      : currentFeeConfig.platformFeePercent,
  };
  return { ...currentFeeConfig };
};
