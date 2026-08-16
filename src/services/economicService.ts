import {
  GasEstimate,
  PlatformFeeDetails,
  MerchantNetSettlement,
  SupportedToken,
  Payment,
  MerchantProfile,
  MerchantCategoryType,
} from '../types';
import { SUPPORTED_CHAINS, getChainConfig, DEFAULT_CHAIN_ID, getNativeGasAsset } from '../config/chains';
import { TOKEN_CONFIGS } from '../config/tokens';
import { getFeeConfig, FeeConfiguration } from '../config/fees';
import { getRewardConfig, getRewardRateForMerchantType } from '../config/rewards';
import { PriceService } from './priceService';
import { RewardEngine, CashbackCalculation, DEFAULT_VERSE_RATE_USD } from './rewardService';

export const DEFAULT_PLATFORM_FEE_PERCENT = 0.25; // IrisMe initial configurable 0.25% protocol fee

export interface CompletePaymentEconomics {
  // 1. BLOCKCHAIN NETWORK FEE (Gas paid to miners/validators - separate network cost)
  gasEstimate: GasEstimate;
  // 2. IRISME PLATFORM FEE & NET SETTLEMENT (Configurable protocol fee, default 0.25%)
  platformFee: PlatformFeeDetails;
  merchantSettlement: MerchantNetSettlement;
  // 3. VERSE CUSTOMER REWARDS (Merchant-funded loyalty cashback in VERSE)
  customerReward: CashbackCalculation;
}

/**
 * =========================================================================
 * IRISME ECONOMIC ARCHITECTURE SERVICE
 * =========================================================================
 * Enforces strict, unambiguous separation of three distinct economic concepts:
 *
 * 1. BLOCKCHAIN NETWORK FEES:
 *    Paid to blockchain miners / validators for transaction inclusion.
 *    Denominated and settled ONLY in native gas assets (ETH, POL, BNB, AVAX).
 *    Dynamically estimated from network gas price, transfer units, and live native token USD price.
 *    VERSE is NOT assumed to be the gas token.
 *    Gas is NOT subtracted from the merchant settlement; it remains a separate network cost.
 *
 * 2. IRISME PLATFORM FEES:
 *    Configurable protocol facilitation fee (initial default: 0.25%).
 *    Example: Payment = $100 -> IrisMe Fee (0.25%) = $0.25 -> Merchant Net Settlement = $99.75.
 *
 * 3. VERSE CUSTOMER REWARDS:
 *    Customer loyalty rewards denominated in VERSE tokens (e.g. 2% cashback),
 *    funded from the merchant's dedicated loyalty pool or promotional campaign.
 * =========================================================================
 */
export class EconomicService {
  /**
   * Returns the currently active platform fee percentage
   */
  public static getActivePlatformFeePercent(): number {
    return getFeeConfig().platformFeePercent || DEFAULT_PLATFORM_FEE_PERCENT;
  }

  /**
   * 1. BLOCKCHAIN NETWORK FEE ESTIMATION
   * Dynamically estimates gas cost based on chain, native gas token, gas price, transfer units, and live asset USD price.
   */
  public static estimateGasFee(params: {
    chainId: number;
    tokenSymbol: SupportedToken;
    customGasPriceGwei?: number;
    customGasUnits?: number;
  }): GasEstimate {
    const chainId = params.chainId || DEFAULT_CHAIN_ID;
    const chainConfig = getChainConfig(chainId) || SUPPORTED_CHAINS[137];

    // Determine if payment asset is the native gas asset on this chain
    const isNative =
      (params.tokenSymbol === 'MATIC' && (chainId === 137 || chainId === 80002)) ||
      (params.tokenSymbol === 'POL' && (chainId === 137 || chainId === 80002)) ||
      (params.tokenSymbol === 'ETH' && (chainId === 1 || chainId === 11155111)) ||
      (params.tokenSymbol === 'BNB' && chainId === 56) ||
      (params.tokenSymbol === 'AVAX' && chainId === 43114);

    const defaultGasUnits = isNative
      ? chainConfig.gasUnits.nativeTransfer
      : chainConfig.gasUnits.erc20Transfer;

    const gasUnits = params.customGasUnits && params.customGasUnits > 0
      ? params.customGasUnits
      : defaultGasUnits;

    const gasPriceGwei = params.customGasPriceGwei && params.customGasPriceGwei > 0
      ? params.customGasPriceGwei
      : chainConfig.typicalGasPriceGwei;

    const nativeGasToken = chainConfig.nativeCurrency.symbol;

    // Real-time dynamic native token USD price lookup
    const livePriceUSD = PriceService.getPrice(nativeGasToken);
    const nativeGasTokenPriceUSD = livePriceUSD > 0
      ? livePriceUSD
      : (nativeGasToken === 'ETH' ? 2850 : nativeGasToken === 'BNB' ? 580 : nativeGasToken === 'AVAX' ? 26 : 0.42);

    // Gas Cost in Native Token: (gasUnits * gasPriceGwei) / 10^9
    const gasCostNative = Number(((gasUnits * gasPriceGwei) / 1e9).toFixed(6));
    const gasCostUSD = Number((gasCostNative * nativeGasTokenPriceUSD).toFixed(4));

    const formattedGas = `~${gasCostNative.toFixed(
      gasCostNative < 0.0001 ? 6 : 4
    )} ${nativeGasToken} ($${gasCostUSD < 0.01 ? '<0.01' : gasCostUSD.toFixed(3)})`;

    return {
      chainId,
      networkName: chainConfig.shortName,
      nativeGasToken,
      nativeGasTokenPriceUSD,
      gasUnits,
      gasPriceGwei,
      gasCostNative,
      gasCostUSD,
      formattedGas,
    };
  }

  /**
   * 2. IRISME PLATFORM FEE & MERCHANT NET SETTLEMENT
   * Initial 0.25% configurable platform fee calculation and net settlement derivation.
   * Example: $100 invoice -> $0.25 IrisMe fee -> $99.75 Net Settlement
   * Note: Blockchain gas is NOT subtracted from merchant settlement.
   */
  public static calculatePlatformFee(params: {
    amountUSD: number;
    tokenAmount: number;
    settlementAddress: string;
    platformFeePercent?: number;
  }): { platformFee: PlatformFeeDetails; merchantSettlement: MerchantNetSettlement } {
    const feePercent = params.platformFeePercent ?? this.getActivePlatformFeePercent();
    const rate = feePercent / 100;

    const safeAmountUSD = Math.max(0, params.amountUSD || 0);
    const safeTokenAmount = Math.max(0, params.tokenAmount || 0);

    const platformFeeUSD = Number((safeAmountUSD * rate).toFixed(4));
    const platformFeeTokenAmount = Number((safeTokenAmount * rate).toFixed(6));

    // Net settlement is gross amount minus the platform fee (gas is paid separately by transaction sender)
    const netUSD = Number((safeAmountUSD - platformFeeUSD).toFixed(4));
    const netTokenAmount = Number((safeTokenAmount - platformFeeTokenAmount).toFixed(6));

    return {
      platformFee: {
        platformFeePercent: feePercent,
        platformFeeUSD,
        platformFeeTokenAmount,
      },
      merchantSettlement: {
        netUSD,
        netTokenAmount,
        settlementAddress: params.settlementAddress,
      },
    };
  }

  /**
   * 3. VERSE CUSTOMER REWARDS
   * Calculates customer loyalty rewards in VERSE tokens based on merchant type (IrisMe: 1.00%, External: 0.25%)
   */
  public static calculateCustomerReward(params: {
    amountUSD: number;
    merchantType?: MerchantCategoryType;
    cashbackPercent?: number;
    versePriceUSD?: number;
    campaignMultiplier?: number;
    fixedBonusVerse?: number;
  }): CashbackCalculation {
    const merchantType = params.merchantType || 'irisme_merchant';
    const defaultRate = getRewardRateForMerchantType(merchantType);
    const percent = params.cashbackPercent !== undefined && params.cashbackPercent > 0 ? params.cashbackPercent : defaultRate;
    const liveVersePrice = params.versePriceUSD || PriceService.getPrice('VERSE') || getRewardConfig().defaultVersePriceUSD || DEFAULT_VERSE_RATE_USD;

    return RewardEngine.calculateCashback(params.amountUSD, percent, {
      merchantType,
      versePriceUSD: liveVersePrice,
      campaignMultiplier: params.campaignMultiplier,
      fixedBonusVerse: params.fixedBonusVerse,
    });
  }

  /**
   * Evaluates the complete, separated 3-concept economics for any payment
   */
  public static getPaymentEconomics(params: {
    amountUSD: number;
    tokenAmount: number;
    tokenSymbol: SupportedToken;
    chainId: number;
    settlementAddress: string;
    merchantType?: MerchantCategoryType;
    cashbackPercent?: number;
    platformFeePercent?: number;
    versePriceUSD?: number;
    customGasPriceGwei?: number;
    customGasUnits?: number;
    campaignMultiplier?: number;
    fixedBonusVerse?: number;
  }): CompletePaymentEconomics {
    const gasEstimate = this.estimateGasFee({
      chainId: params.chainId,
      tokenSymbol: params.tokenSymbol,
      customGasPriceGwei: params.customGasPriceGwei,
      customGasUnits: params.customGasUnits,
    });

    const { platformFee, merchantSettlement } = this.calculatePlatformFee({
      amountUSD: params.amountUSD,
      tokenAmount: params.tokenAmount,
      settlementAddress: params.settlementAddress,
      platformFeePercent: params.platformFeePercent,
    });

    const customerReward = this.calculateCustomerReward({
      amountUSD: params.amountUSD,
      merchantType: params.merchantType,
      cashbackPercent: params.cashbackPercent,
      versePriceUSD: params.versePriceUSD,
      campaignMultiplier: params.campaignMultiplier,
      fixedBonusVerse: params.fixedBonusVerse,
    });

    return {
      gasEstimate,
      platformFee,
      merchantSettlement,
      customerReward,
    };
  }
}


