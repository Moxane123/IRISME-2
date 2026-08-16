import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { IrisLogo } from '../../components/ui/IrisLogo';
import { TokenLogo } from '../../components/ui/TokenLogo';
import { RewardStatus, VerseRewardRecord } from '../../types';
import { RewardEngine } from '../../services/rewardService';
import { getExplorerTxUrl } from '../../config/explorers';
import { DEFAULT_CHAIN_ID } from '../../config';
import {
  Coins,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Zap,
  Clock,
  ArrowUpRight,
  Info,
  Layers,
  AlertCircle,
} from 'lucide-react';

export const CustomerRewards: React.FC = () => {
  const { customerRewards, wallet, claimCustomerRewards, distributeReward } = useApp();
  const web3 = useWeb3();

  const [statusFilter, setStatusFilter] = useState<'all' | RewardStatus>('all');
  const [isClaiming, setIsClaiming] = useState(false);
  const [distributingId, setDistributingId] = useState<string | null>(null);
  const [claimSuccessTx, setClaimSuccessTx] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const customerAddress = web3.address || wallet.address;
  const stats = RewardEngine.getCustomerStats(customerRewards, customerAddress);

  // Grouped counts & totals
  const pendingRewards = customerRewards.filter((r) => r.status === 'pending' || r.status === 'calculated');
  const claimableRewards = customerRewards.filter((r) => r.status === 'claimable');
  const distributedRewards = customerRewards.filter((r) => r.status === 'distributed' || r.status === 'claimed');

  const claimableTotal = claimableRewards.reduce((sum, r) => sum + r.amountVerse, 0);

  const filteredRewards = customerRewards.filter((r) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'distributed') return r.status === 'distributed' || r.status === 'claimed';
    return r.status === statusFilter;
  });

  const handleClaimAll = async () => {
    if (claimableTotal <= 0) return;
    setIsClaiming(true);
    setErrorMsg(null);
    try {
      const res = await claimCustomerRewards();
      if (res.success) {
        setClaimSuccessTx(res.txHash);
        setTimeout(() => setClaimSuccessTx(null), 6000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to claim rewards');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleDistributeSingle = async (reward: VerseRewardRecord) => {
    setDistributingId(reward.id);
    setErrorMsg(null);
    try {
      const res = await distributeReward(reward.id);
      if (res.success && res.txHash) {
        setClaimSuccessTx(res.txHash);
        setTimeout(() => setClaimSuccessTx(null), 6000);
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Distribution failed');
    } finally {
      setDistributingId(null);
    }
  };

  const getExplorerLink = (txHash?: string) => {
    if (!txHash) return '#';
    return getExplorerTxUrl(web3.chainId || DEFAULT_CHAIN_ID, txHash);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-pink-50 text-pink-700 border border-pink-200 flex items-center gap-1.5 shadow-xs">
              <IrisLogo size={14} />
              VERSE Rewards Engine
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {customerAddress ? `${customerAddress.slice(0, 6)}...${customerAddress.slice(-4)}` : 'Self-Custodial'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Customer Rewards Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track calculated, pending, and distributed VERSE token rewards across all merchant checkouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="iris"
            size="md"
            leftIcon={<Coins className="w-4 h-4" />}
            disabled={claimableTotal === 0 || isClaiming}
            isLoading={isClaiming}
            onClick={handleClaimAll}
            className="cursor-pointer shadow-lg shadow-purple-500/20"
          >
            Claim All ({claimableTotal.toLocaleString()} VERSE)
          </Button>
        </div>
      </div>

      {/* Verification / Success Notification */}
      {claimSuccessTx && (
        <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">VERSE Reward Distributed on Blockchain!</p>
              <p className="text-xs text-slate-600 font-mono">
                Distribution Tx: {claimSuccessTx.slice(0, 12)}...{claimSuccessTx.slice(-10)}
              </p>
            </div>
          </div>
          <a
            href={getExplorerLink(claimSuccessTx)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-600 hover:text-purple-700 underline flex items-center gap-1 font-mono font-bold"
          >
            <span>View on Explorer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Blockchain Transparency Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">
            Transparent Reward Lifecycle: <span className="text-cyan-700 font-mono font-bold">Calculated</span> → <span className="text-purple-700 font-mono font-bold">Claimable/Pending</span> → <span className="text-emerald-700 font-mono font-bold">Distributed</span>
          </p>
          <p className="leading-relaxed">
            Rewards are initially <strong>Calculated</strong> when an order is created. Once payment is confirmed, rewards become <strong>Claimable</strong> and are moved to <strong>Distributed</strong> only after a verified on-chain blockchain transaction has settled.
          </p>
        </div>
      </div>

      {/* KPI Metrics Cards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total VERSE Earned */}
        <StatCard
          label="Total VERSE Earned"
          value={`${stats.totalEarned.toLocaleString()} VERSE`}
          subvalue={`≈ ${stats.totalEarnedUSD.toFixed(2)} USD value across all orders`}
          accentIris={true}
          icon={<Coins className="w-5 h-5" />}
        />

        {/* 2. Pending Rewards */}
        <StatCard
          label="Pending Rewards"
          value={`${stats.totalPending.toLocaleString()} VERSE`}
          subvalue={`${pendingRewards.length} reward${pendingRewards.length === 1 ? '' : 's'} calculated / awaiting distribution`}
          icon={<Clock className="w-5 h-5" />}
        />

        {/* 3. Distributed Rewards */}
        <StatCard
          label="Distributed Rewards"
          value={`${stats.totalDistributed.toLocaleString()} VERSE`}
          subvalue={`${distributedRewards.length} on-chain distributed transactions`}
          change={stats.totalDistributed > 0 ? 'On-Chain Confirmed' : '0 Distributed'}
          icon={<ShieldCheck className="w-5 h-5" />}
        />

        {/* 4. Wallet VERSE Balance */}
        <StatCard
          label="Wallet VERSE Balance"
          value={`${(wallet.balances.VERSE || 0).toLocaleString()} VERSE`}
          subvalue="Available in your connected self-custodial wallet"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Reward History Filter & Management Section */}
      <Card variant="default">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Reward History & Blockchain Proofs</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-medium">
                {filteredRewards.length} records
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified reward records with payment and distribution transaction hashes
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'all', label: 'All Rewards' },
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
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-2xs'
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
                {statusFilter === 'all'
                  ? 'Complete crypto purchases at any IRISME merchant to automatically earn VERSE cashback.'
                  : `No rewards currently in "${statusFilter}" state.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Merchant & Invoice</th>
                    <th className="py-3 px-4">Cashback Rate</th>
                    <th className="py-3 px-4">VERSE Reward</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Transaction Hashes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRewards.map((rew) => {
                    const isRowDistributing = distributingId === rew.id;
                    const canDistribute = rew.status === 'claimable' || rew.status === 'pending';

                    return (
                      <tr key={rew.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Merchant & Invoice */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900 text-sm">{rew.merchantName}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {rew.paymentInvoiceNumber ? `Invoice: ${rew.paymentInvoiceNumber}` : rew.source}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(rew.timestamp).toLocaleString()}
                          </div>
                        </td>

                        {/* Cashback Rate */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-700">
                          <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-purple-700 font-bold">
                            {rew.rewardPercentage || 2.0}%
                          </span>
                        </td>

                        {/* VERSE Reward */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <TokenLogo symbol="VERSE" size="sm" variant="gif" animated={true} />
                            <div>
                              <span className="font-mono font-black text-purple-700 text-sm block">
                                +{rew.amountVerse.toLocaleString()} VERSE
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                ≈ ${rew.usdValue.toFixed(2)} USD
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <StatusBadge status={rew.status} size="sm" />
                        </td>

                        {/* Transaction Hashes */}
                        <td className="py-4 px-4 space-y-1">
                          {/* Payment Tx */}
                          {rew.paymentTxHash ? (
                            <div className="flex items-center gap-1.5 text-[11px] font-mono">
                              <span className="text-slate-400">Pay:</span>
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
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">—</span>
                          )}

                          {/* Distribution Tx */}
                          {(rew.distributionTxHash || rew.claimTxHash) ? (
                            <div className="flex items-center gap-1.5 text-[11px] font-mono">
                              <span className="text-emerald-600 font-semibold">Drop:</span>
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
                          ) : rew.status === 'pending' || rew.status === 'claimable' ? (
                            <span className="text-[10px] text-amber-600 font-mono font-medium">Queued for On-Chain Distribution</span>
                          ) : null}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4 text-right">
                          {canDistribute ? (
                            <Button
                              variant="iris"
                              size="sm"
                              isLoading={isRowDistributing}
                              disabled={isRowDistributing}
                              onClick={() => handleDistributeSingle(rew)}
                              className="cursor-pointer"
                            >
                              Claim VERSE
                            </Button>
                          ) : rew.status === 'distributed' || rew.status === 'claimed' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
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
