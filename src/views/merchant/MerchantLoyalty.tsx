import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { IrisLogo } from '../../components/ui/IrisLogo';
import {
  Award,
  Users,
  CheckCircle2,
  Sparkles,
  Sliders,
  Target,
  Gift,
  Coins,
  ArrowRight,
  TrendingUp,
  Save,
  Check,
} from 'lucide-react';
import { MerchantLoyaltyGoal } from '../../types';
import { MerchantRegistrationRequired } from '../../components/merchant/MerchantRegistrationRequired';

export const MerchantLoyalty: React.FC = () => {
  const { loyaltyTiers, customerLoyaltyCards, merchantProfile, loyaltyGoal, updateLoyaltyGoal } = useApp();

  const isRegistered = Boolean(
    merchantProfile.id &&
    merchantProfile.name &&
    merchantProfile.settlementAddress
  );

  if (!isRegistered) {
    return <MerchantRegistrationRequired title="Register Business to Configure Loyalty Tiers" />;
  }

  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [goalForm, setGoalForm] = useState<MerchantLoyaltyGoal>(() => ({
    enabled: loyaltyGoal?.enabled ?? true,
    targetPurchases: loyaltyGoal?.targetPurchases ?? 5,
    rewardType: loyaltyGoal?.rewardType ?? 'fixed_verse',
    rewardValue: loyaltyGoal?.rewardValue ?? 250,
    rewardDescription:
      loyaltyGoal?.rewardDescription ?? 'Make 5 purchases and receive 250 bonus VERSE cashback reward.',
  }));
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const totalSpent = customerLoyaltyCards.reduce((acc, c) => acc + (c.totalSpentUSD || 0), 0);
  const totalVerseEarned = customerLoyaltyCards.reduce((acc, c) => acc + (c.verseEarned || 0), 0);
  const totalPurchases = customerLoyaltyCards.reduce((acc, c) => acc + (c.purchaseCount || c.visitsCount || 0), 0);

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateLoyaltyGoal(goalForm);
    setSaveSuccess(true);
    setIsEditingGoal(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleQuickPreset = (presetPurchases: number, presetVerse: number) => {
    setGoalForm({
      enabled: true,
      targetPurchases: presetPurchases,
      rewardType: 'fixed_verse',
      rewardValue: presetVerse,
      rewardDescription: `Make ${presetPurchases} purchases and receive ${presetVerse} bonus VERSE reward.`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Wallet-Based Merchant Loyalty
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure automated milestone goals and reward customer wallets for repeat checkouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-2xl bg-white border border-purple-200 text-purple-700 text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs">
            <IrisLogo size={16} />
            Wallet Identity Tracking
          </span>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Tracked Customer Wallets"
          value={customerLoyaltyCards.length}
          subvalue="Self-custodial shopper IDs"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Total Purchases Logged"
          value={totalPurchases}
          subvalue="Wallet checkout volume"
          accentIris={true}
          icon={<Award className="w-5 h-5" />}
        />
        <StatCard
          label="Cumulative Customer Spend"
          value={`$${totalSpent.toFixed(2)}`}
          subvalue="Gross settled volume"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          label="VERSE Rewards Distributed"
          value={`${Math.round(totalVerseEarned).toLocaleString()} VERSE`}
          subvalue="Customer loyalty cashback"
          icon={<Coins className="w-5 h-5" />}
        />
      </div>

      {/* Merchant Loyalty Goal Configuration Box */}
      <div className="bg-gradient-to-br from-purple-50/70 via-white to-slate-50 border border-purple-200/80 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Configured Loyalty Goal</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active Goal
                </span>
                {saveSuccess && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 animate-pulse">
                    <Check className="w-3 h-3" /> Saved to Server
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target rule: <span className="font-semibold text-slate-800">"Make {loyaltyGoal?.targetPurchases || 5} purchases and receive {loyaltyGoal?.rewardValue || 250} {loyaltyGoal?.rewardType === 'discount_percent' ? '%' : 'VERSE'}"</span>
              </p>
            </div>
          </div>

          <Button
            variant={isEditingGoal ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => setIsEditingGoal(!isEditingGoal)}
            className="self-start md:self-auto"
          >
            <Sliders className="w-4 h-4 mr-1.5" />
            {isEditingGoal ? 'Close Configurator' : 'Edit Loyalty Goal'}
          </Button>
        </div>

        {/* Edit Form */}
        {isEditingGoal && (
          <form onSubmit={handleSaveGoal} className="bg-white rounded-xl border border-purple-100 p-5 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Configure Milestone Rule</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Set the purchase count target and reward delivered to the customer wallet when reached.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Quick Goal Presets
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickPreset(5, 250)}
                  className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-purple-700 text-xs font-medium transition-colors"
                >
                  🎯 5 Purchases → 250 VERSE
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(3, 100)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                >
                  ⚡ 3 Purchases → 100 VERSE (Fast Starter)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(10, 1000)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                >
                  👑 10 Purchases → 1,000 VERSE (VIP Target)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Target Purchases</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={goalForm.targetPurchases}
                  onChange={(e) =>
                    setGoalForm({
                      ...goalForm,
                      targetPurchases: Math.max(1, parseInt(e.target.value) || 1),
                      rewardDescription: `Make ${e.target.value} purchases and receive ${goalForm.rewardValue} ${goalForm.rewardType === 'discount_percent' ? '%' : 'VERSE'} reward.`,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 font-mono font-bold"
                />
                <p className="text-[11px] text-slate-400">Number of settled orders to trigger reward</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Reward Type</label>
                <select
                  value={goalForm.rewardType}
                  onChange={(e) =>
                    setGoalForm({
                      ...goalForm,
                      rewardType: e.target.value as any,
                      rewardDescription: `Make ${goalForm.targetPurchases} purchases and receive ${goalForm.rewardValue} ${e.target.value === 'discount_percent' ? '%' : 'VERSE'} reward.`,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 font-medium"
                >
                  <option value="fixed_verse">Fixed VERSE Cashback Token</option>
                  <option value="discount_percent">Checkout Discount %</option>
                </select>
                <p className="text-[11px] text-slate-400">Reward payout asset or deduction</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Reward Value</label>
                <input
                  type="number"
                  min="1"
                  value={goalForm.rewardValue}
                  onChange={(e) =>
                    setGoalForm({
                      ...goalForm,
                      rewardValue: Math.max(1, parseInt(e.target.value) || 1),
                      rewardDescription: `Make ${goalForm.targetPurchases} purchases and receive ${e.target.value} ${goalForm.rewardType === 'discount_percent' ? '%' : 'VERSE'} reward.`,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 font-mono font-bold"
                />
                <p className="text-[11px] text-slate-400">
                  {goalForm.rewardType === 'fixed_verse' ? 'Tokens credited to customer wallet' : '% off next checkout'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Customer Display Headline</label>
              <input
                type="text"
                value={goalForm.rewardDescription}
                onChange={(e) => setGoalForm({ ...goalForm, rewardDescription: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 font-medium text-slate-800"
                placeholder="e.g. Make 5 purchases and receive a 250 VERSE reward"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditingGoal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                <Save className="w-4 h-4 mr-1.5" />
                Save Loyalty Goal
              </Button>
            </div>
          </form>
        )}

        {/* Live Customer Preview Pill */}
        <div className="bg-white/80 rounded-xl border border-purple-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
              🎁
            </div>
            <div>
              <span className="font-bold text-slate-900">Customer Pass Banner:</span>
              <p className="text-slate-600 text-[11px] mt-0.5">{loyaltyGoal?.rewardDescription || 'Make 5 purchases and receive 250 VERSE reward.'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-purple-700 font-bold bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 self-start sm:self-auto">
            <span>Milestone Interval:</span>
            <span>Every {loyaltyGoal?.targetPurchases || 5} Orders</span>
          </div>
        </div>
      </div>

      {/* Customer Wallet Loyalty Directory */}
      <Card variant="default">
        <CardHeader
          title="Customer Wallet Loyalty Directory"
          subtitle="Real-time purchase count, lifetime spend, and milestone rewards tracked by wallet address"
        />
        <CardContent className="p-0">
          {customerLoyaltyCards.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No customer wallets tracked yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When customers connect their wallets and pay invoices, their purchase counts, spending, and milestone rewards update automatically here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Customer Wallet</th>
                    <th className="py-3.5 px-4">Purchase Count</th>
                    <th className="py-3.5 px-4">Total Spending</th>
                    <th className="py-3.5 px-4">VERSE Earned</th>
                    <th className="py-3.5 px-4">Goal Progress</th>
                    <th className="py-3.5 px-4">Reward Status</th>
                    <th className="py-3.5 px-4">Next Milestone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerLoyaltyCards.map((card) => {
                    const target = loyaltyGoal?.targetPurchases || card.targetPurchases || 5;
                    const purchases = card.purchaseCount || card.visitsCount || 0;
                    const progress = purchases % target;
                    const progressPercent = Math.min(100, Math.round((progress / target) * 100));
                    const isRewardAvailable = card.rewardAvailable || Math.floor(purchases / target) > (card.claimedMilestones || 0);

                    return (
                      <tr key={card.customerWallet} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                            {card.customerWallet.slice(0, 6)}...{card.customerWallet.slice(-4)}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-slate-800 text-sm">
                          {purchases} orders
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-900 font-bold">
                          ${(card.totalSpentUSD || 0).toFixed(2)}
                        </td>
                        <td className="py-4 px-4 font-mono text-purple-700 font-bold">
                          {Math.round(card.verseEarned || 0).toLocaleString()} VERSE
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1 w-28">
                            <div className="flex justify-between text-[10px] font-mono text-slate-500">
                              <span>{progress} / {target}</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-600 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {isRewardAvailable ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              🎁 Reward Unlocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                              In Progress
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-medium text-[11px] max-w-xs truncate">
                          {card.nextMilestone || `${target - progress} more purchase${target - progress === 1 ? '' : 's'} to reward`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
