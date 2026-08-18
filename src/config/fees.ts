/**
 * IRISME PROTOCOL PLATFORM FEE CONFIGURATION (MVP)
 *
 * One clear, central platform fee model for the MVP.
 * Example:
 *   Payment: $100.00
 *   iRisme fee (1%): $1.00
 *   Merchant receives: $99.00
 *
 * The fee is configurable from this single central configuration value.
 * Stored at the time of transaction creation on each payment record.
 */

import { PlatformFeeDetails, MerchantNetSettlement } from '../types';

/**
 * Single central configuration value for the iRisme platform fee percentage.
 * Default: 1.0% ($1.00 fee on a $100.00 payment -> $99.00 net settlement).
 */
export const DEFAULT_PLATFORM_FEE_PERCENT = 1.0;

export interface PlatformFeeConfiguration {
  /**
   * Central platform fee percentage (e.g. 1.0 for 1.0%)
   */
  platformFeePercent: number;

  /**
   * Description of the fee model
   */
  description: string;
}

export const CENTRAL_FEE_CONFIG: PlatformFeeConfiguration = {
  platformFeePercent: DEFAULT_PLATFORM_FEE_PERCENT,
  description: 'Fixed 1.0% iRisme facilitation fee. Merchant receives 99% net settlement directly to wallet.',
};

let activeFeePercent = DEFAULT_PLATFORM_FEE_PERCENT;

/**
 * Returns the currently active central platform fee percentage
 */
export const getPlatformFeePercent = (): number => {
  return activeFeePercent;
};

/**
 * Alias for backward compatibility
 */
export const getFeeConfig = () => ({
  platformFeePercent: activeFeePercent,
  feeRecipientAddress: '0x0000000000000000000000000000000000000000',
  treasuryEnabled: false,
});

/**
 * Updates the protocol platform fee percentage centrally
 */
export const updatePlatformFeePercent = (percent: number): number => {
  if (typeof percent === 'number' && !isNaN(percent)) {
    activeFeePercent = Math.max(0, Math.min(10, Number(percent.toFixed(2))));
  }
  return activeFeePercent;
};

/**
 * Updates fee config dynamically (alias)
 */
export const updateFeeConfig = (updates: { platformFeePercent?: number }) => {
  if (updates.platformFeePercent !== undefined) {
    updatePlatformFeePercent(updates.platformFeePercent);
  }
  return getFeeConfig();
};

/**
 * Computes platform fee and merchant net settlement with safe financial decimal precision.
 * Guarantees that: amountUSD = platformFeeUSD + netSettlementUSD (exact cents).
 *
 * Example:
 *   amountUSD: $100.00, feePercent: 1.0%
 *   platformFeeUSD: $1.00
 *   netSettlementUSD: $99.00
 */
export function calculatePlatformFee(params: {
  amountUSD: number;
  tokenAmount?: number;
  settlementAddress?: string;
  platformFeePercent?: number;
}): { platformFee: PlatformFeeDetails; merchantSettlement: MerchantNetSettlement } {
  const feePercent =
    typeof params.platformFeePercent === 'number' && !isNaN(params.platformFeePercent)
      ? params.platformFeePercent
      : getPlatformFeePercent();

  const safeAmountUSD = Math.max(0, Number(params.amountUSD) || 0);
  const safeTokenAmount = Math.max(0, Number(params.tokenAmount) || safeAmountUSD);
  const rate = feePercent / 100;

  // Safe 2-decimal rounding for USD currency
  const feeCents = Math.round(safeAmountUSD * rate * 100);
  const platformFeeUSD = Number((feeCents / 100).toFixed(2));
  const netUSD = Number((Math.max(0, Math.round(safeAmountUSD * 100) - feeCents) / 100).toFixed(2));

  // Safe 6-decimal rounding for crypto token amounts
  const platformFeeTokenAmount = Number((safeTokenAmount * rate).toFixed(6));
  const netTokenAmount = Number((Math.max(0, safeTokenAmount - platformFeeTokenAmount)).toFixed(6));

  return {
    platformFee: {
      platformFeePercent: feePercent,
      platformFeeUSD,
      platformFeeTokenAmount,
    },
    merchantSettlement: {
      netUSD,
      netTokenAmount,
      settlementAddress: params.settlementAddress || '',
    },
  };
}
