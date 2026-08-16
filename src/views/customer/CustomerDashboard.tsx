import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { IrisLogo } from '../../components/ui/IrisLogo';
import { TokenLogo } from '../../components/ui/TokenLogo';
import { RewardEngine } from '../../services/rewardService';
import { getExplorerTxUrl } from '../../config/explorers';
import { DEFAULT_CHAIN_ID } from '../../config';
import {
  Coins,
  Award,
  Wallet,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Store,
  QrCode,
  Zap,
  Target,
  Gift,
  Check,
  TrendingUp,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { navigate } = useRouter();
  const {
    wallet,
    customerProfile,
    customerRewards,
    customerLoyaltyCards,
    claimCustomerRewards,
    claimLoyaltyMilestone,
    loyaltyGoal,
  } = useApp();
  const web3 = useWeb3();

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimingMerchantId, setClaimingMerchantId] = useState<string | null>(null);
  const [milestoneSuccessMessage, setMilestoneSuccessMessage] = useState<string | null>(null);

  const customerAddress = web3.address || wallet.address;
  const stats = RewardEngine.getCustomerStats(customerRewards, customerAddress);

  const pendingRewards = customerRewards.filter((r) => r.status === 'pending' || r.status === 'calculated');
  const claimableRewards = customerRewards.filter((r) => r.status === 'claimable');
  const distributedRewards = customerRewards.filter((r) => r.status === 'distributed' || r.status === 'claimed');

  const claimableVerseTotal = claimableRewards.reduce((sum, r) => sum + r.amountVerse, 0);

  const handleClaimCashback = async () => {
    if (claimableVerseTotal <= 0) return;
    setIsClaiming(true);
    try {
      await claimCustomerRewards();
      setClaimSuccess(true);
      setTimeout(() => setClaimSuccess(false), 3000);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClaimMilestone = async (merchantId: string) => {
    setClaimingMerchantId(merchantId);
    try {
      const res = await claimLoyaltyMilestone(merchantId);
      if (res.success) {
        setMilestoneSuccessMessage(res.message || `Claimed ${res.rewardVerse} VERSE!`);
        setTimeout(() => setMilestoneSuccessMessage(null), 4000);
      }
    } finally {
      setClaimingMerchantId(null);
    }
  };

  const totalSpentAcrossMerchants = customerLoyaltyCards.reduce((acc, c) => acc + (c.totalSpentUSD || 0), 0);
  const totalPurchasesAcrossMerchants = customerLoyaltyCards.reduce(
    (acc, c) => acc + (c.purchaseCount || c.visitsCount || 0),
    0
  );

  const getExplorerLink = (txHash?: string) => {
    if (!txHash) return '#';
    return getExplorerTxUrl(web3.chainId || DEFAULT_CHAIN_ID, txHash);
  };

  return (
    <div className="space-y-8">
      {/* Onboarding Welcome Drop if not claimed */}
      {!customerProfile.isOnboarded && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent border border-pink-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#FF0080] text-white flex items-center justify-center text-xl shadow-md">
              🎁
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Activate Your Customer Loyalty Pass</h3>
              <p className="text-xs text-slate-600">
                Set your alias, favorite categories, and claim a 50 VERSE starter drop.
              </p>
            </div>
          </div>
          <Button
            variant="iris"
            size="sm"
            className="cursor-pointer whitespace-nowrap"
            onClick={() => navigate('/customer/onboarding')}
          >
            Start Setup (1 min) →
          </Button>
        </div>
      )}

      {/* Success Notification for Milestone Claim */}
      {milestoneSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{milestoneSuccessMessage}</span>
        </div>
      )}

      {/* Customer Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-pink-500/10 via-purple-500/10 to-cyan-500/10 pointer-events-none rounded-full blur-3xl" />

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-pink-50 text-pink-700 border border-pink-200 flex items-center gap-1.5 shadow-2xs">
              <IrisLogo size={14} />
              Wallet Loyalty Dashboard
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Connected Wallet'}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{customerProfile.avatarIcon || '💳'}</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {customerProfile.displayName || 'Customer Loyalty & Rewards'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Track your purchases, merchant milestones, and collect VERSE tokens seamlessly from your wallet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-shrink-0 z-10">
          <Button
            variant="iris"
            size="md"
            leftIcon={<Coins className="w-4 h-4" />}
            disabled={claimableVerseTotal === 0 || isClaiming}
            isLoading={isClaiming}
            onClick={handleClaimCashback}
            className="cursor-pointer shadow-lg shadow-purple-500/20"
          >
            {claimSuccess
              ? 'Claimed to Wallet!'
              : `Claim ${claimableVerseTotal.toLocaleString()} VERSE`}
          </Button>
          <Button
            variant="secondary"
            size="md"
            className="border-slate-200 hover:border-slate-300 text-slate-700 cursor-pointer shadow-xs"
            onClick={() => navigate('/customer/onboarding')}
          >
            Pass Settings
          </Button>
        </div>
      </div>

      {/* KPI Stats - Explicit Reward States */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total VERSE Earned */}
        <StatCard
          label="Total VERSE Earned"
          value={`${stats.totalEarned.toLocaleString()} VERSE`}
          subvalue={`≈ $${stats.totalEarnedUSD.toFixed(2)} USD lifetime value`}
          accentIris={true}
          icon={<Coins className="w-5 h-5" />}
        />

        {/* 2. Pending Rewards */}
        <StatCard
          label="Pending Rewards"
          value={`${stats.totalPending.toLocaleString()} VERSE`}
          subvalue={`${pendingRewards.length} calculated / awaiting confirmation`}
          icon={<Clock className="w-5 h-5" />}
        />

        {/* 3. Claimable Rewards */}
        <StatCard
          label="Claimable Rewards"
          value={`${stats.totalClaimable.toLocaleString()} VERSE`}
          subvalue={`${claimableRewards.length} ready to claim / distribute`}
          change={stats.totalClaimable > 0 ? 'Ready to Claim' : '0 Claimable'}
          isPositive={stats.totalClaimable > 0}
          icon={<Zap className="w-5 h-5" />}
        />

        {/* 4. Distributed Rewards */}
        <StatCard
          label="Distributed Rewards"
          value={`${stats.totalDistributed.toLocaleString()} VERSE`}
          subvalue={`${distributedRewards.length} on-chain verified payouts`}
          change={stats.totalDistributed > 0 ? 'On-Chain Verified' : '0 Distributed'}
          icon={<ShieldCheck className="w-5 h-5" />}
        />
      </div>

      {/* Merchant Loyalty & Milestone Progress Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Merchant Loyalty & Milestones</h3>
            <p className="text-xs text-slate-500">
              Live purchase count, goal progress, and unlocked rewards per merchant
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            onClick={() => navigate('/customer/loyalty')}
          >
            View Full Passes →
          </Button>
        </div>

        {customerLoyaltyCards.length === 0 ? (
          <Card variant="default" className="p-12 text-center space-y-3 bg-white">
            <Award className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No merchant loyalty cards found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When you pay at any merchant using your connected wallet, your progress towards rewards is tracked automatically.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customerLoyaltyCards.map((card) => {
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
                  className={`p-6 bg-white transition-all space-y-5 rounded-3xl border shadow-xs ${
                    isRewardAvailable
                      ? 'border-purple-300 ring-2 ring-purple-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Merchant & Tier Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-purple-700 font-bold block">
                        {card.merchantCategory || 'Merchant Store'}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">{card.merchantName}</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold font-mono">
                      {card.currentTier.name}
                    </span>
                  </div>

                  {/* 1. Purchase count & Total Spent */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Purchase Count</span>
                      <p className="text-sm font-black text-slate-900 font-mono">{purchases} purchases</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Total Spent</span>
                      <p className="text-sm font-black text-slate-900 font-mono">${(card.totalSpentUSD || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* 2. Loyalty Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 font-bold">Milestone Progress:</span>
                      <span className="font-mono text-purple-700 font-bold">
                        {currentProgress} / {targetPurchases} Purchases ({progressPercentage}%)
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 via-purple-600 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* 3. Reward Available Status */}
                  <div className="p-3.5 rounded-2xl border space-y-2 text-xs transition-colors">
                    {isRewardAvailable ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-emerald-700 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Gift className="w-4 h-4 text-emerald-600 animate-bounce" />
                            <span>Milestone Reward Unlocked!</span>
                          </span>
                          <span className="font-mono">+{rewardValue} {rewardType === 'discount_percent' ? '%' : 'VERSE'}</span>
                        </div>
                        <Button
                          variant="iris"
                          size="sm"
                          className="w-full cursor-pointer shadow-sm text-xs font-bold"
                          isLoading={claimingMerchantId === card.merchantId}
                          onClick={() => handleClaimMilestone(card.merchantId)}
                        >
                          🎁 Claim {rewardValue} {rewardType === 'discount_percent' ? '%' : 'VERSE'} Reward Now
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium">
                          <Target className="w-3.5 h-3.5 text-purple-600" />
                          <span>Goal: {targetPurchases} purchases</span>
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">Reward in progress</span>
                      </div>
                    )}
                  </div>

                  {/* 4. Next Milestone Guidance */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium text-slate-400">Next Milestone:</span>
                    <span className="text-purple-700 font-semibold font-mono text-right truncate pl-2">
                      {isRewardAvailable
                        ? 'Reward ready to claim!'
                        : `${remaining} more purchase${remaining === 1 ? '' : 's'} until ${rewardValue} ${rewardType === 'discount_percent' ? '%' : 'VERSE'}`}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Rewards History Table */}
      <Card variant="default">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-purple-600" />
              <span>VERSE Rewards History</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-medium">
                {customerRewards.length} records
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified accounting records with merchant classification, rate, and blockchain proof
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-purple-600 hover:text-purple-800 cursor-pointer"
            onClick={() => navigate('/customer/rewards')}
          >
            Open Full Rewards Hub →
          </Button>
        </div>
        <CardContent className="p-0">
          {customerRewards.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Coins className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No reward records yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Complete a purchase at an IrisMe or External merchant to receive instant VERSE rewards.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Payment ID / Merchant</th>
                    <th className="py-3 px-4">Customer Wallet</th>
                    <th className="py-3 px-4">Reward Rate</th>
                    <th className="py-3 px-4">Reward Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Distribution Tx</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerRewards.map((rew) => {
                    const isIrisMerchant = rew.merchantType === 'irisme_merchant' || !rew.merchantType;
                    return (
                      <tr key={rew.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Payment ID & Merchant */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{rew.merchantName}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                isIrisMerchant
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {isIrisMerchant ? 'IrisMe Merchant' : 'External Merchant'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            ID: {rew.paymentInvoiceNumber || rew.paymentId || rew.id.slice(0, 12)}
                          </div>
                        </td>

                        {/* Customer Wallet */}
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {rew.customerWallet ? (
                            <span>{rew.customerWallet.slice(0, 6)}...{rew.customerWallet.slice(-4)}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Reward Rate */}
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                            {rew.rewardPercentage.toFixed(2)}%
                          </span>
                        </td>

                        {/* Reward Amount */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <TokenLogo symbol="VERSE" size="sm" variant="gif" animated={true} />
                            <div>
                              <span className="font-mono font-black text-purple-700 block">
                                +{rew.amountVerse.toLocaleString()} VERSE
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ≈ ${rew.usdValue.toFixed(2)} USD
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={rew.status} size="sm" />
                        </td>

                        {/* Distribution Tx */}
                        <td className="py-3.5 px-4">
                          {rew.distributionTxHash || rew.claimTxHash ? (
                            <a
                              href={getExplorerLink(rew.distributionTxHash || rew.claimTxHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 font-mono text-[11px] hover:underline flex items-center gap-1 font-bold"
                            >
                              <span>{(rew.distributionTxHash || rew.claimTxHash || '').slice(0, 6)}...{(rew.distributionTxHash || rew.claimTxHash || '').slice(-4)}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : rew.status === 'distributed' ? (
                            <span className="text-emerald-600 font-mono text-[10px] font-semibold">Confirmed on-chain</span>
                          ) : rew.status === 'claimable' ? (
                            <span className="text-purple-600 font-mono text-[10px] font-medium">Ready to claim</span>
                          ) : rew.status === 'pending' ? (
                            <span className="text-amber-600 font-mono text-[10px]">Awaiting settlement</span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">Accounting record</span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                          {new Date(rew.timestamp).toLocaleString()}
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
