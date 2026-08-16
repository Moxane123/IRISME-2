/**
 * IRISME MERCHANT REPUTATION CONFIGURATION
 *
 * Centralized, configurable reputation tiers and point rules for IrisMe merchants.
 * Points are earned ONLY upon verified payment confirmation.
 */

export interface ReputationTierConfig {
  id: 'bronze' | 'silver' | 'gold' | string;
  name: string;
  minPayments: number;
  maxPayments: number; // Use Infinity for the top tier
  badge: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export interface ReputationConfiguration {
  /**
   * Points awarded per verified payment (Default: 1 point)
   */
  pointsPerVerifiedPayment: number;

  /**
   * Configurable reputation tiers
   */
  tiers: ReputationTierConfig[];
}

export const DEFAULT_REPUTATION_CONFIG: ReputationConfiguration = {
  pointsPerVerifiedPayment: 1, // +1 point per verified transaction
  tiers: [
    {
      id: 'bronze',
      name: 'Bronze',
      minPayments: 0,
      maxPayments: 99,
      badge: '🥉',
      color: '#CD7F32',
      textColor: 'text-amber-800',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
      description: 'Founding merchant tier (0–99 verified payments)',
    },
    {
      id: 'silver',
      name: 'Silver',
      minPayments: 100,
      maxPayments: 999,
      badge: '🥈',
      color: '#94A3B8',
      textColor: 'text-slate-800',
      bgColor: 'bg-slate-100',
      borderColor: 'border-slate-300',
      description: 'Established merchant tier (100–999 verified payments)',
    },
    {
      id: 'gold',
      name: 'Gold',
      minPayments: 1000,
      maxPayments: Infinity,
      badge: '🥇',
      color: '#EAB308',
      textColor: 'text-yellow-800',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      description: 'High-volume premier tier (1,000+ verified payments)',
    },
  ],
};

let currentReputationConfig: ReputationConfiguration = {
  pointsPerVerifiedPayment: DEFAULT_REPUTATION_CONFIG.pointsPerVerifiedPayment,
  tiers: [...DEFAULT_REPUTATION_CONFIG.tiers],
};

/**
 * Returns current active reputation configuration
 */
export const getReputationConfig = (): ReputationConfiguration => {
  return {
    ...currentReputationConfig,
    tiers: [...currentReputationConfig.tiers],
  };
};

/**
 * Dynamically updates the reputation configuration
 */
export const updateReputationConfig = (
  updates: Partial<ReputationConfiguration>
): ReputationConfiguration => {
  currentReputationConfig = {
    ...currentReputationConfig,
    ...updates,
    tiers: updates.tiers ? [...updates.tiers] : currentReputationConfig.tiers,
  };
  return getReputationConfig();
};
