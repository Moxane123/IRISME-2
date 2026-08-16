import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { RewardCampaign } from '../../types';
import { IrisLogo } from '../../components/ui/IrisLogo';
import {
  Flame,
  PlusCircle,
  Sparkles,
  Calendar,
  Coins,
  Users,
  Check,
  X,
  Play,
  Pause,
  Percent,
  Gift,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const MerchantCampaigns: React.FC = () => {
  const { campaigns, toggleCampaignStatus, createCampaign } = useApp();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states matching user specs
  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [rewardType, setRewardType] = useState<'percentage' | 'fixed_verse'>('percentage');
  const [rewardValue, setRewardValue] = useState<number>(5);
  const [minPaymentUSD, setMinPaymentUSD] = useState<number>(10);
  const [maxParticipants, setMaxParticipants] = useState<number>(500);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [budgetVerse, setBudgetVerse] = useState<number>(100000);

  const handleApplyPreset = (preset: 'weekend' | 'first100') => {
    if (preset === 'weekend') {
      setCampaignName('Weekend VERSE Cashback');
      setDescription('Earn 5% VERSE cashback on all checkout orders above $10 this weekend.');
      setRewardType('percentage');
      setRewardValue(5);
      setMinPaymentUSD(10);
      setMaxParticipants(500);
      setBudgetVerse(100000);
    } else {
      setCampaignName('First 100 Customers');
      setDescription('First 100 customers receive a 500 VERSE reward on orders over $15.');
      setRewardType('fixed_verse');
      setRewardValue(500);
      setMinPaymentUSD(15);
      setMaxParticipants(100);
      setBudgetVerse(50000);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) return;

    createCampaign({
      name: campaignName.trim(),
      title: campaignName.trim(),
      description: description.trim() || 'Promotional VERSE campaign boost.',
      tagline: description.trim() || 'Promotional VERSE campaign boost.',
      type: rewardType === 'percentage' ? 'multiplier' : 'fixed_bonus',
      rewardType,
      rewardValue,
      verseMultiplier: rewardType === 'percentage' ? 1 + rewardValue / 10 : 1.0,
      fixedBonusVerse: rewardType === 'fixed_verse' ? rewardValue : 0,
      minSpendUSD: minPaymentUSD,
      maxParticipants,
      currentParticipants: 0,
      participantWallets: [],
      budgetVerse,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      status: 'active',
    });

    setIsCreateModalOpen(false);
    setCampaignName('');
    setDescription('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Merchant Campaigns</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create and manage verified VERSE reward campaigns. Validated server-side during customer checkout.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-mono font-bold text-xs">
            <ShieldCheck className="w-3.5 h-3.5" /> Server-Side Validated
          </span>
          <Button
            variant="iris"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="cursor-pointer shadow-xs"
          >
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Preset Quick Actions Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-purple-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-200 text-[10px] font-mono font-bold uppercase tracking-wider">
              Popular Presets
            </span>
            <span className="text-xs text-purple-200">One-click campaign blueprints</span>
          </div>
          <h3 className="text-sm font-bold text-white">Need a quick campaign? Launch our verified templates</h3>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => {
              handleApplyPreset('weekend');
              setIsCreateModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <Percent className="w-4 h-4 text-purple-300" />
            <span>Weekend VERSE Cashback (5%)</span>
          </button>
          <button
            onClick={() => {
              handleApplyPreset('first100');
              setIsCreateModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <Gift className="w-4 h-4 text-amber-300" />
            <span>First 100 Customers (500 VERSE)</span>
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.length === 0 ? (
          <div className="col-span-full p-12 text-center space-y-3 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <Flame className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No active merchant campaigns</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create a custom cashback percentage or fixed VERSE reward campaign for your shoppers.
            </p>
            <Button
              variant="iris"
              size="sm"
              className="mt-2 cursor-pointer shadow-xs"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create First Campaign
            </Button>
          </div>
        ) : (
          campaigns.map((camp) => {
            const isPercentage = camp.rewardType === 'percentage' || camp.type === 'multiplier';
            const displayReward =
              camp.rewardType === 'percentage'
                ? `${camp.rewardValue}% VERSE Cashback`
                : camp.rewardType === 'fixed_verse'
                ? `${camp.rewardValue} VERSE Reward`
                : camp.type === 'fixed_bonus'
                ? `${camp.fixedBonusVerse} VERSE Reward`
                : `${camp.verseMultiplier}x VERSE Boost`;

            const participants = camp.currentParticipants ?? camp.participatingCustomers ?? 0;
            const maxPart = camp.maxParticipants ?? 500;
            const participantPercent = Math.min(100, Math.round((participants / maxPart) * 100));

            return (
              <Card
                key={camp.id}
                className={`p-6 flex flex-col justify-between transition-all border bg-white ${
                  camp.status === 'active'
                    ? 'border-purple-300 shadow-md shadow-purple-500/10'
                    : 'border-slate-200 opacity-75 shadow-xs'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 font-bold flex items-center gap-1.5">
                      {isPercentage ? (
                        <Percent className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <Gift className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      {displayReward}
                    </span>
                    <StatusBadge status={camp.status} size="sm" pulse={camp.status === 'active'} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{camp.name || camp.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{camp.description || camp.tagline}</p>
                  </div>

                  {/* Participants Capacity Progress */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-[11px] text-slate-600 font-mono">
                      <span>Participants Joined</span>
                      <span className="font-bold text-slate-800">
                        {participants} / {maxPart} wallets ({participantPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${participantPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Conditions & Criteria */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Min. Payment:</span>
                      <span className="font-bold text-slate-900">${camp.minSpendUSD} USD</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Server Verification:</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    </div>
                  </div>

                  {/* Start & End Dates */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>Starts: {new Date(camp.startDate).toLocaleDateString()}</span>
                    <span>Ends: {new Date(camp.endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Card Footer actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-purple-700 font-mono font-semibold">
                    Target: All Checkout Invoices
                  </span>
                  <button
                    onClick={() => toggleCampaignStatus(camp.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                  >
                    {camp.status === 'active' ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800">
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500" />
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IrisLogo size={22} />
                <h3 className="font-bold text-slate-900 text-base">Create Merchant Campaign</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Preset buttons */}
              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold uppercase tracking-wider block text-[10px]">
                  Fill from Preset
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('weekend')}
                    className="px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors"
                  >
                    Weekend 5% Cashback
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('first100')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                  >
                    First 100 Customers (500 VERSE)
                  </button>
                </div>
              </div>

              {/* Campaign Name */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold uppercase tracking-wider block text-[11px]">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend VERSE Cashback"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-900 focus:outline-none font-semibold text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold uppercase tracking-wider block text-[11px]">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5% VERSE cashback on all checkout orders above $10"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-900 focus:outline-none"
                />
              </div>

              {/* Reward Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider block text-[11px]">
                    Reward Type *
                  </label>
                  <select
                    value={rewardType}
                    onChange={(e) => {
                      const val = e.target.value as 'percentage' | 'fixed_verse';
                      setRewardType(val);
                      setRewardValue(val === 'percentage' ? 5 : 500);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-900 focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="percentage">Reward Percentage (e.g. 5% Cashback)</option>
                    <option value="fixed_verse">Fixed VERSE Reward (e.g. 500 VERSE)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider block text-[11px]">
                    {rewardType === 'percentage' ? 'Reward Percentage (%)' : 'Fixed VERSE Reward'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step={rewardType === 'percentage' ? '0.5' : '10'}
                    value={rewardValue}
                    onChange={(e) => setRewardValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-900 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Minimum payment & Max participants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider block text-[11px]">
                    Minimum Payment ($ USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minPaymentUSD}
                    onChange={(e) => setMinPaymentUSD(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-900 focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Order must meet this amount to qualify</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider block text-[11px]">
                    Maximum Participants
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-900 focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Cap of eligible customer wallets</p>
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider block text-[11px]">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-900 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider block text-[11px]">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Button
                  type="submit"
                  variant="iris"
                  size="md"
                  className="w-full cursor-pointer shadow-xs"
                >
                  Publish Campaign
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full cursor-pointer border-slate-200 text-slate-700"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
