import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { IrisLogo } from '../../components/ui/IrisLogo';
import { RewardEngine } from '../../services/rewardService';
import { getExplorerTxUrl } from '../../config/explorers';
import { DEFAULT_CHAIN_ID } from '../../config';
import { RewardStatus, VerseRewardRecord } from '../../types';
import { MerchantRegistrationRequired } from '../../components/merchant/MerchantRegistrationRequired';
import {
  Coins,
  PlusCircle,
  TrendingUp,
  Sliders,
  ShieldCheck,
  Check,
  Flame,
  ArrowUpRight,
  RefreshCw,
  Award,
  Sparkles,
  ExternalLink,
  Zap,
  Clock,
  Send,
  AlertCircle,
} from 'lucide-react';

export const MerchantRewards: React.FC = () => {
  const {
    merchantProfile,
    updateMerchantProfile,
    updateRewardPercentage,
    customerRewards,
    merchantRewards,
    distributeReward,
    batchDistributeRewards,
  } = useApp();
  const web3 = useWeb3();

  const [baseRate, setBaseRate] = useState<number>(merchantProfile.baseRewardPercent || 3.0);
  const [isSaved, setIsSaved] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('50000');
  const [isTopUpSuccess, setIsTopUpSuccess] = useState(false);
  const [isBatchDistributing, setIsBatchDistributing] = useState(false);
  const [batchResult, setBatchResult] = useState<{ success: boolean; count: number; txHash?: string } | null>(null);
  const [distributingId, setDistributingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | RewardStatus>('all');

  const isRegistered = Boolean(
    merchantProfile.id &&
    merchantProfile.name &&
    merchantProfile.settlementAddress
  );

  if (!isRegistered) {
    return <MerchantRegistrationRequired title="Register Business to Access VERSE Rewards Pool" />;
  }

  const allRewards = customerRewards || merchantRewards || [];
  const stats = RewardEngine.getMerchantStats(allRewards);

  const pendingDistributions = allRewards.filter(
    (r) => r.status === 'pending' || r.status === 'claimable' || r.status === 'calculated'
  );

  const handleSaveRate = () => {
    updateRewardPercentage(baseRate);
    updateMerchantProfile({ baseRewardPercent: baseRate });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleTopUp = () => {
    const amount = parseInt(topUpAmount) || 0;
    if (amount <= 0) return;

    updateMerchantProfile({
      verseRewardPoolBalance: (merchantProfile.verseRewardPoolBalance || 0) + amount,
    });

    setIsTopUpSuccess(true);
    setTimeout(() => setIsTopUpSuccess(false), 2500);
  };

  const handleBatchDistribute = async () => {
    if (pendingDistributions.length === 0) return;
    setIsBatchDistributing(true);
    setBatchResult(null);
    try {
      const res = await batchDistributeRewards();
      setBatchResult(res);
      setTimeout(() => setBatchResult(null), 6000);
    } finally {
      setIsBatchDistributing(false);
    }
  };

  const handleSingleDistribute = async (rewardId: string) => {
    setDistributingId(rewardId);
    try {
      const res = await distributeReward(rewardId);
      if (res.success && res.txHash) {
        setBatchResult({ success: true, count: 1, txHash: res.txHash });
        setTimeout(() => setBatchResult(null), 6000);
      }
    } finally {
      setDistributingId(null);
    }
  };

  const getExplorerLink = (txHash?: string) => {
    if (!txHash) return '#';
    return getExplorerTxUrl(web3.chainId || DEFAULT_CHAIN_ID, txHash);
  };

  const filteredRewards = allRewards.filter((r) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'distributed') return r.status === 'distributed' || r.status === 'claimed';
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-pink-50 text-pink-700 border border-pink-200 flex items-center gap-1.5 shadow-2xs">
              <IrisLogo size={14} />
              Merchant VERSE Treasury
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Polygon L2 / Verse Ecosystem
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            VERSE Reward Pool & Distribution
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure automated token cashback, manage rewards reserve, and execute on-chain reward distributions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingDistributions.length > 0 && (
            <Button
              variant="iris"
              size="md"
              leftIcon={<Send className="w-4 h-4" />}
              isLoading={isBatchDistributing}
              disabled={isBatchDistributing}
              onClick={handleBatchDistribute}
              className="cursor-pointer shadow-lg shadow-purple-500/20"
            >
              Distribute All ({pendingDistributions.length} Pending)
            </Button>
          )}
        </div>
      </div>

      {/* Batch Distribution Success Notification */}
      {batchResult && (
        <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700 flex-shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {batchResult.count} Reward{batchResult.count === 1 ? '' : 's'} Successfully Distributed On-Chain!
              </p>
              {batchResult.txHash && (
                <p className="text-xs text-slate-600 font-mono">
                  Tx: {batchResult.txHash.slice(0, 12)}...{batchResult.txHash.slice(-10)}
                </p>
              )}
            </div>
          </div>
          {batchResult.txHash && (
            <a
              href={getExplorerLink(batchResult.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-600 hover:text-purple-700 underline flex items-center gap-1 font-mono font-bold"
            >
              <span>View Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* KPI Cards (4 metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Pool Reserve */}
        <StatCard
          label="Reward Pool Reserve"
          value={`${(merchantProfile.verseRewardPoolBalance || 0).toLocaleString()} VERSE`}
          subvalue={`≈ ${((merchantProfile.verseRewardPoolBalance || 0) * 0.00035).toFixed(2)} USD ready for drops`}
          accentIris={true}
          icon={<Coins className="w-5 h-5" />}
        />

        {/* 2. Total VERSE Distributed */}
        <StatCard
          label="Total Distributed"
          value={`${stats.totalDistributed.toLocaleString()} VERSE`}
          subvalue={`${stats.distributedCount} on-chain verified transactions`}
          icon={<Award className="w-5 h-5" />}
        />

        {/* 3. Calculated & Pending */}
        <StatCard
          label="Pending Distribution"
          value={`${stats.totalPending.toLocaleString()} VERSE`}
          subvalue={`${stats.pendingCount} rewards calculated from payments`}
          icon={<Clock className="w-5 h-5" />}
        />

        {/* 4. Active Base Rate */}
        <StatCard
          label="Default Cashback Rate"
          value={`${merchantProfile.baseRewardPercent || 3.0}%`}
          subvalue="Applied automatically on crypto checkout"
          accentIris={true}
          icon={<Sliders className="w-5 h-5" />}
        />
      </div>

      {/* Reward Settings & Deposit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cashback Configuration (6 cols) */}
        <Card variant="default" className="lg:col-span-6 p-6 space-y-5 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cashback Rate Configuration</h3>
              <p className="text-xs text-slate-500">Set the default percentage given back to customers in VERSE</p>
            </div>
            <Coins className="w-5 h-5 text-purple-600" />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-800 font-bold uppercase tracking-wider">
                  Base Cashback Rate: {baseRate}%
                </span>
                <span className="text-purple-700 font-mono font-bold">
                  {(baseRate * 100).toFixed(0)} bps
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15.0"
                step="0.5"
                value={baseRate}
                onChange={(e) => setBaseRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
                <span>0.5% (Economy)</span>
                <span>3.0% (Standard)</span>
                <span>15.0% (High Incentive)</span>
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-2 pt-1">
              {[1.0, 2.0, 3.0, 5.0, 10.0].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setBaseRate(rate)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                    baseRate === rate
                      ? 'bg-purple-100 border-purple-400 text-purple-800 shadow-2xs font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>

            <Button
              variant="iris"
              size="md"
              className="w-full cursor-pointer shadow-xs"
              onClick={handleSaveRate}
              disabled={isSaved}
              leftIcon={isSaved ? <Check className="w-4 h-4 text-white" /> : undefined}
            >
              {isSaved ? 'Cashback Rate Saved' : 'Save Default Cashback Rate'}
            </Button>
          </div>
        </Card>

        {/* Top Up Pool (6 cols) */}
        <Card variant="default" className="lg:col-span-6 p-6 space-y-5 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Fund Merchant Reward Pool</h3>
              <p className="text-xs text-slate-500">Deposit VERSE tokens to maintain automated customer cashback</p>
            </div>
            <PlusCircle className="w-5 h-5 text-purple-600" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Deposit Amount (VERSE)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-purple-500 font-mono text-sm text-slate-900 focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-700">
                  VERSE
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {['25000', '100000', '500000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopUpAmount(amt)}
                  className="py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:border-purple-300 font-mono text-[11px] cursor-pointer shadow-2xs"
                >
                  +{parseInt(amt).toLocaleString()}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="md"
              className="w-full border-slate-200 hover:border-slate-300 text-slate-700 cursor-pointer shadow-xs"
              onClick={handleTopUp}
              disabled={isTopUpSuccess}
            >
              {isTopUpSuccess ? 'Pool Deposit Confirmed!' : `Deposit ${parseInt(topUpAmount || '0').toLocaleString()} VERSE`}
            </Button>
          </div>
        </Card>
      </div>

      {/* Rewards Distribution Table */}
      <Card variant="default">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Recent VERSE Cashback Drops</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-medium">
                {filteredRewards.length} records
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Per-payment reward logs, associated customer addresses, and distribution transaction hashes
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'all', label: 'All' },
              { key: 'calculated', label: 'Calculated' },
              { key: 'claimable', label: 'Claimable' },
              { key: 'distributed', label: 'Distributed' },
              { key: 'failed', label: 'Failed' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="p-0">
          {filteredRewards.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Coins className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No VERSE reward records found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Payments generated with VERSE cashback configured will appear here with automated calculation and distribution states.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice / Source</th>
                    <th className="py-3 px-4">Customer Wallet</th>
                    <th className="py-3 px-4">Reward % & Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Payment & Drop Tx Hashes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRewards.map((rew) => {
                    const isRowDistributing = distributingId === rew.id;
                    const canDistribute = rew.status === 'claimable' || rew.status === 'pending' || rew.status === 'calculated';

                    return (
                      <tr key={rew.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Invoice */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900 font-mono">{rew.paymentInvoiceNumber || rew.paymentId || 'Direct'}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(rew.timestamp).toLocaleString()}
                          </div>
                        </td>

                        {/* Customer Wallet */}
                        <td className="py-4 px-4 font-mono">
                          {rew.customerWallet && rew.customerWallet !== '0x0000000000000000000000000000000000000000' ? (
                            <span className="text-slate-800 font-semibold">
                              {rew.customerWallet.slice(0, 6)}...{rew.customerWallet.slice(-4)}
                            </span>
                          ) : (
                            <span className="text-slate-400">Self-Custodial</span>
                          )}
                        </td>

                        {/* Reward % & Amount */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-purple-700 text-sm">
                              +{rew.amountVerse.toLocaleString()} VERSE
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-purple-700 font-bold">
                              {rew.rewardPercentage || 2.0}%
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                            ≈ ${rew.usdValue.toFixed(2)} USD
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <StatusBadge status={rew.status} size="sm" />
                        </td>

                        {/* Tx Hashes */}
                        <td className="py-4 px-4 space-y-1">
                          {rew.paymentTxHash && (
                            <div className="flex items-center gap-1.5 text-[11px] font-mono">
                              <span className="text-slate-400">Payment:</span>
                              <a
                                href={getExplorerLink(rew.paymentTxHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-700 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <span>{rew.paymentTxHash.slice(0, 6)}...{rew.paymentTxHash.slice(-4)}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}

                          {(rew.distributionTxHash || rew.claimTxHash) ? (
                            <div className="flex items-center gap-1.5 text-[11px] font-mono">
                              <span className="text-emerald-600 font-semibold">Dist Drop:</span>
                              <a
                                href={getExplorerLink(rew.distributionTxHash || rew.claimTxHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:underline flex items-center gap-1 font-bold"
                              >
                                <span>{(rew.distributionTxHash || rew.claimTxHash || '').slice(0, 6)}...{(rew.distributionTxHash || rew.claimTxHash || '').slice(-4)}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          ) : rew.status === 'calculated' ? (
                            <span className="text-[10px] text-slate-400 font-mono">Calculated (Awaiting Settlement)</span>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-mono font-medium">Queued for Drop</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4 text-right">
                          {canDistribute ? (
                            <Button
                              variant="iris"
                              size="sm"
                              isLoading={isRowDistributing}
                              disabled={isRowDistributing}
                              onClick={() => handleSingleDistribute(rew.id)}
                              className="cursor-pointer"
                            >
                              Distribute
                            </Button>
                          ) : rew.status === 'distributed' || rew.status === 'claimed' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <Check className="w-3.5 h-3.5" />
                              Settled
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
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
