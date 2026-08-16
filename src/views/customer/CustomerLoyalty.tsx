import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { IrisLogo } from '../../components/ui/IrisLogo';
import {
  Award,
  ShieldCheck,
  Sparkles,
  QrCode,
  Check,
  Star,
  ExternalLink,
  Store,
  Zap,
  Gift,
  Target,
  CheckCircle2,
} from 'lucide-react';

export const CustomerLoyalty: React.FC = () => {
  const { customerLoyaltyCards, wallet, loyaltyGoal, claimLoyaltyMilestone } = useApp();
  const [selectedCardId, setSelectedCardId] = useState<string>(
    customerLoyaltyCards.length > 0 ? customerLoyaltyCards[0].merchantId : ''
  );
  const [claimingMerchantId, setClaimingMerchantId] = useState<string | null>(null);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const selectedCard =
    customerLoyaltyCards.find((c) => c.merchantId === selectedCardId) ||
    (customerLoyaltyCards.length > 0 ? customerLoyaltyCards[0] : null);

  const handleClaim = async (merchantId: string) => {
    setClaimingMerchantId(merchantId);
    try {
      const res = await claimLoyaltyMilestone(merchantId);
      if (res.success) {
        setClaimMessage(res.message || `Claimed ${res.rewardVerse} VERSE milestone reward!`);
        setTimeout(() => setClaimMessage(null), 4000);
      }
    } finally {
      setClaimingMerchantId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Wallet-Based Merchant Passes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Zero logins or app installs required. Your self-custodial wallet automatically tracks purchase count, milestones, and reward unlocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-2xl bg-white border border-purple-200 text-purple-700 text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs">
            <IrisLogo size={16} />
            {customerLoyaltyCards.length} Active Passes
          </span>
        </div>
      </div>

      {claimMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{claimMessage}</span>
        </div>
      )}

      {customerLoyaltyCards.length === 0 ? (
        <Card variant="default" className="p-16 text-center space-y-4 bg-white">
          <Award className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No merchant passes issued yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Whenever you pay at any merchant, a digital loyalty stamp pass is tied directly to your wallet address.
            </p>
          </div>
        </Card>
      ) : (
        /* Main Punch Passes Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {customerLoyaltyCards.map((card) => {
            const isSelected = selectedCard?.merchantId === card.merchantId;
            const targetPurchases = card.targetPurchases || loyaltyGoal?.targetPurchases || 5;
            const purchases = card.purchaseCount || card.visitsCount || 0;
            const currentProgress = purchases % targetPurchases;
            const progressPercentage = Math.min(100, Math.round((currentProgress / targetPurchases) * 100));
            const isRewardAvailable =
              card.rewardAvailable ||
              (card.unclaimedRewardsCount && card.unclaimedRewardsCount > 0) ||
              Math.floor(purchases / targetPurchases) > (card.claimedMilestones || 0);

            const remaining = targetPurchases - currentProgress;
            const rewardValue = card.rewardValue || loyaltyGoal?.rewardValue || 250;
            const rewardType = card.rewardType || loyaltyGoal?.rewardType || 'fixed_verse';

            return (
              <Card
                key={card.merchantId}
                onClick={() => setSelectedCardId(card.merchantId)}
                className={`p-6 flex flex-col justify-between transition-all cursor-pointer rounded-3xl border bg-white ${
                  isRewardAvailable
                    ? 'border-purple-400 ring-2 ring-purple-500/20 shadow-md shadow-purple-500/10'
                    : isSelected
                    ? 'border-purple-300 shadow-md shadow-purple-500/5'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="space-y-5">
                  {/* Header: Merchant & Tier */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-purple-700 font-bold">
                        {card.merchantCategory || 'Retail & Dining'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{card.merchantName}</h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Wallet: {card.customerWallet.slice(0, 6)}...{card.customerWallet.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl">{card.currentTier.badge}</span>
                      <span className="text-[10px] block font-mono text-purple-700 font-bold">
                        {card.currentTier.name}
                      </span>
                    </div>
                  </div>

                  {/* Purchase Count & Total Spend */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Purchase Count</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">{purchases} purchases</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Total Spending</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">${(card.totalSpentUSD || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Progress to Goal */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-bold">Loyalty Progress:</span>
                      <span className="text-purple-700 font-mono font-bold">
                        {currentProgress} / {targetPurchases} Purchases ({progressPercentage}%)
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Reward Available Claim Section */}
                  {isRewardAvailable ? (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                        <span className="flex items-center gap-1.5">
                          <Gift className="w-4 h-4 text-purple-600" />
                          <span>Milestone Reward Available!</span>
                        </span>
                        <span className="font-mono text-purple-700">+{rewardValue} {rewardType === 'discount_percent' ? '%' : 'VERSE'}</span>
                      </div>
                      <Button
                        variant="iris"
                        size="sm"
                        className="w-full cursor-pointer text-xs font-bold shadow-xs"
                        isLoading={claimingMerchantId === card.merchantId}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaim(card.merchantId);
                        }}
                      >
                        Claim Reward to Wallet
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium">
                        <Target className="w-3.5 h-3.5 text-purple-600" />
                        <span>Goal: {targetPurchases} purchases</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">In Progress</span>
                    </div>
                  )}

                  {/* Punch Card Stamps */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Punch Card Stamps:</span>
                      <span className="text-purple-700 font-mono font-bold">
                        {currentProgress}/{targetPurchases} Stamps
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {Array.from({ length: targetPurchases }).map((_, idx) => {
                        const isStamped = idx < currentProgress;
                        const isBonus = idx === targetPurchases - 1;

                        return (
                          <div
                            key={idx}
                            className={`h-10 rounded-xl border flex flex-col items-center justify-center transition-all ${
                              isStamped
                                ? 'bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] border-transparent text-white font-black shadow-xs'
                                : isBonus
                                ? 'border-purple-300 bg-purple-50 text-purple-700'
                                : 'border-slate-200 bg-slate-50 text-slate-400'
                            }`}
                          >
                            <span className="text-xs">{isStamped ? '✓' : isBonus ? '🎁' : idx + 1}</span>
                            <span className="text-[7px] uppercase font-mono font-bold">
                              {isStamped ? 'DONE' : isBonus ? 'GOAL' : 'STEP'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Next milestone */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 text-[11px]">Next Milestone:</span>
                  <span className="text-purple-700 font-semibold text-[11px] text-right truncate pl-2">
                    {isRewardAvailable
                      ? 'Ready to claim!'
                      : `${remaining} more purchase${remaining === 1 ? '' : 's'} until reward`}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
