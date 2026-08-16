import { Payment, CustomerLoyaltyCard, MerchantReputationStats } from '../types';
import { getReputationConfig, ReputationTierConfig } from '../config/reputation';

/**
 * IRISME MERCHANT REPUTATION SERVICE
 *
 * Tracks non-custodial merchant reputation metrics and tier progression.
 * Reputation points (+1 per verified transaction) are ONLY awarded upon verified completion.
 */
export class ReputationService {
  /**
   * Calculates comprehensive merchant reputation stats and tier status
   */
  public static calculateReputationStats(
    payments: Payment[],
    customerLoyaltyCards: CustomerLoyaltyCard[] = []
  ): MerchantReputationStats {
    const config = getReputationConfig();

    // 1. Filter ONLY verified/completed payments (Do not award for pending/submitted)
    const verifiedPayments = payments.filter(
      (p) => p.status === 'completed' || p.status === 'confirmed'
    );

    const totalSuccessfulTransactions = verifiedPayments.length;
    const totalReputationPoints = totalSuccessfulTransactions * (config.pointsPerVerifiedPayment || 1);
    const totalPaymentVolumeUSD = verifiedPayments.reduce((sum, p) => sum + (p.amountUSD || 0), 0);
    const totalVerseRewardsGenerated = verifiedPayments.reduce((sum, p) => sum + (p.verseEarned || 0), 0);

    // Calculate returning customer count
    const customerVisitsMap: Record<string, number> = {};
    verifiedPayments.forEach((p) => {
      if (p.customerWallet && p.customerWallet !== '0x0000000000000000000000000000000000000000') {
        customerVisitsMap[p.customerWallet] = (customerVisitsMap[p.customerWallet] || 0) + 1;
      }
    });

    // Count wallets with more than 1 completed payment, merged with loyalty cards
    const multiVisitFromPayments = Object.values(customerVisitsMap).filter((count) => count > 1).length;
    const multiVisitFromCards = customerLoyaltyCards.filter((c) => c.visitsCount > 1).length;
    const returningCustomersCount = Math.max(multiVisitFromPayments, multiVisitFromCards);

    // 2. Resolve Active Tier
    const tiers = config.tiers;
    let currentTierIndex = 0;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      if (
        totalSuccessfulTransactions >= tier.minPayments &&
        (tier.maxPayments === Infinity || totalSuccessfulTransactions <= tier.maxPayments)
      ) {
        currentTierIndex = i;
        break;
      }
    }

    const currentTier = tiers[currentTierIndex] || tiers[0];
    const nextTier: ReputationTierConfig | null =
      currentTierIndex + 1 < tiers.length ? tiers[currentTierIndex + 1] : null;

    // 3. Compute Progress to Next Tier
    let progressPercent = 100;
    let transactionsNeededForNextTier = 0;

    if (nextTier) {
      const target = nextTier.minPayments;
      transactionsNeededForNextTier = Math.max(0, target - totalSuccessfulTransactions);
      const minForCurrent = currentTier.minPayments;
      const span = target - minForCurrent;
      if (span > 0) {
        const achieved = totalSuccessfulTransactions - minForCurrent;
        progressPercent = Math.min(100, Math.max(0, Math.round((achieved / span) * 100)));
      } else {
        progressPercent = 0;
      }
    }

    return {
      totalSuccessfulTransactions,
      totalPaymentVolumeUSD: Number(totalPaymentVolumeUSD.toFixed(2)),
      totalReputationPoints,
      totalVerseRewardsGenerated,
      returningCustomersCount,
      currentTier,
      nextTier: nextTier
        ? {
            id: nextTier.id,
            name: nextTier.name,
            minPayments: nextTier.minPayments,
            maxPayments: nextTier.maxPayments,
            badge: nextTier.badge,
            color: nextTier.color,
          }
        : null,
      progressPercent,
      transactionsNeededForNextTier,
    };
  }
}
