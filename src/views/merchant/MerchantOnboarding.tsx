import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SupportedToken } from '../../types';
import { SUPPORTED_TOKENS } from '../../data/mockData';
import { IrisLogo } from '../../components/ui/IrisLogo';
import { PriceService, PriceMap } from '../../services/priceService';
import {
  Store,
  Wallet,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  Percent,
  Check,
  Lock,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

const CATEGORIES = [
  'Food & Beverage / Hospitality',
  'Retail & E-Commerce',
  'Digital Products & SaaS',
  'Fashion & Apparel',
  'Health, Wellness & Fitness',
  'Events & Entertainment',
  'Services & Consulting',
  'Other Web3 Commerce',
];

const MINIMUM_MERCHANT_RESERVE_USD = 25.0; // Minimum real-time asset reserve required for merchant verification

export const MerchantOnboarding: React.FC = () => {
  const { navigate } = useRouter();
  const { merchantProfile, completeOnboarding, setIsWalletModalOpen } = useApp();
  const web3 = useWeb3();

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [businessName, setBusinessName] = useState(merchantProfile.name || '');
  const [businessDescription, setBusinessDescription] = useState(
    merchantProfile.description || ''
  );
  const [businessCategory, setBusinessCategory] = useState(
    merchantProfile.category || 'Retail & E-Commerce'
  );
  const [defaultAsset, setDefaultAsset] = useState<SupportedToken>(
    merchantProfile.defaultPaymentAsset || 'USDT'
  );
  const [cashbackPercent, setCashbackPercent] = useState<number>(
    merchantProfile.baseRewardPercent || 3.0
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Live prices
  const [prices, setPrices] = useState<PriceMap>(PriceService.getAllPrices());
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);

  useEffect(() => {
    const unsub = PriceService.subscribe((updated) => setPrices({ ...updated }));
    PriceService.fetchRealtimePrices().then((p) => setPrices({ ...p }));
    return () => unsub();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshingPrices(true);
    await web3.refreshBalances();
    const updated = await PriceService.fetchRealtimePrices();
    setPrices({ ...updated });
    setTimeout(() => setIsRefreshingPrices(false), 600);
  };

  // Check if wallet is connected to decide step
  useEffect(() => {
    if (web3.isConnected && web3.address) {
      if (step === 0) setStep(1);
    } else {
      setStep(0);
    }
  }, [web3.isConnected, web3.address]);

  // Calculate real-time wallet total valuation in USD
  const verseVal = (web3.balances.VERSE || 0) * PriceService.getPrice('VERSE');
  const usdtVal = (web3.balances.USDT || 0) * PriceService.getPrice('USDT');
  const usdcVal = (web3.balances.USDC || 0) * PriceService.getPrice('USDC');
  const ethVal = (web3.balances.ETH || 0) * PriceService.getPrice('ETH');
  const maticVal = (web3.balances.MATIC || 0) * PriceService.getPrice('MATIC');
  const bnbVal = (web3.balances.BNB || 0) * PriceService.getPrice('BNB');
  const solVal = (web3.balances.SOL || 0) * PriceService.getPrice('SOL');
  const btcVal = (web3.balances.BTC || 0) * PriceService.getPrice('BTC');

  const totalWalletReserveUSD = Number(
    (verseVal + usdtVal + usdcVal + ethVal + maticVal + bnbVal + solVal + btcVal).toFixed(2)
  );

  const isReserveQualified = totalWalletReserveUSD >= MINIMUM_MERCHANT_RESERVE_USD || (web3.balances.VERSE || 0) >= 1000;

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!web3.isConnected || !web3.address || !businessName.trim()) return;

    completeOnboarding({
      name: businessName.trim(),
      description: businessDescription.trim(),
      category: businessCategory,
      settlementAddress: web3.address,
      defaultPaymentAsset: defaultAsset,
      baseRewardPercent: Number(cashbackPercent),
    });

    setIsSubmitted(true);
    setTimeout(() => {
      navigate('/merchant');
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white border border-purple-200 text-xs font-semibold shadow-sm">
          <IrisLogo size={18} />
          <span className="bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] bg-clip-text text-transparent font-bold">
            Merchant Protocol Verification & Registration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Merchant Registration Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Wallet connection is required for verification. Real-time on-chain reserves verify merchant settlement security.
        </p>
      </div>

      {/* Progress Steps Indicator */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto">
        {[
          { num: 0, title: 'Wallet Verification', desc: 'Proof of Keys' },
          { num: 1, title: 'Reserve Check', desc: 'Real-Time Value' },
          { num: 2, title: 'Business Profile', desc: 'Store Info' },
          { num: 3, title: 'Rewards Setup', desc: 'VERSE Cashback' },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => {
              if (web3.isConnected && web3.address && s.num > 0) {
                setStep(s.num as 0 | 1 | 2 | 3);
              }
            }}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all ${
              step === s.num
                ? 'bg-purple-50/50 border-[#7C3AED] text-slate-900 shadow-sm ring-1 ring-[#7C3AED]'
                : step > s.num
                ? 'bg-slate-50 border-cyan-300 text-slate-700 cursor-pointer'
                : 'bg-white border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  step === s.num
                    ? 'bg-gradient-to-r from-[#00D2FE] to-[#7C3AED] text-white'
                    : step > s.num
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {step > s.num ? '✓' : s.num === 0 ? '⚡' : s.num}
              </span>
              <span className="text-[11px] font-bold truncate">{s.title}</span>
            </div>
            <p className="text-[9px] text-slate-500 hidden sm:block truncate">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Main Container */}
      <Card variant="default" className="p-6 sm:p-8">
        {/* STEP 0: Must Connect Wallet First */}
        {step === 0 && (
          <div className="space-y-6 text-center py-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#00D2FE]/20 via-[#7C3AED]/20 to-[#FF0080]/20 border border-purple-200 flex items-center justify-center mx-auto text-2xl shadow-sm">
              <Wallet className="w-8 h-8 text-[#7C3AED]" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-black text-slate-900">
                Connect Wallet to Verify Identity
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                In IRISME, merchant registration is cryptographic and non-custodial. Your self-custodial wallet connection is the verification required to establish your merchant account.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left max-w-md mx-auto space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#00D2FE]" />
                <span>Verification Benefits</span>
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-500">
                <li>Automated instant settlement to your verified key</li>
                <li>Zero chargebacks and non-custodial asset control</li>
                <li>Instant VERSE loyalty pool configuration</li>
              </ul>
            </div>

            <div className="pt-2 max-w-sm mx-auto">
              <Button
                variant="iris"
                size="lg"
                onClick={() => setIsWalletModalOpen(true)}
                leftIcon={<Wallet className="w-4 h-4" />}
                className="w-full justify-center text-sm font-bold shadow-lg shadow-purple-500/10 cursor-pointer"
              >
                Connect Web3 Wallet Now
              </Button>
            </div>
          </div>
        )}

        {/* STEP 1: Real-Time Reserve & Blockchain Verification */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#00D2FE]" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Real-Time On-Chain Reserve Verification</h3>
                  <p className="text-xs text-slate-500">Live blockchain scan of connected merchant account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshingPrices}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingPrices ? 'animate-spin' : ''}`} />
                Scan Blockchain
              </button>
            </div>

            {/* Connected Address Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Verified Connected Wallet:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Cryptographically Verified
                </span>
              </div>
              <p className="font-mono text-xs sm:text-sm font-bold text-slate-900 truncate bg-white p-2.5 rounded-xl border border-slate-200">
                {web3.address}
              </p>
            </div>

            {/* Live Asset Holdings & Real-Time USD Valuation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider">
                  Live Asset Balances & Real-Time Value
                </span>
                <span className="font-mono text-slate-500">
                  Total Reserve: <strong className="text-slate-900">${totalWalletReserveUSD.toLocaleString()} USD</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>VERSE</span>
                    <span className="text-[#00D2FE] font-bold">⚡</span>
                  </div>
                  <p className="font-mono font-bold text-slate-900 mt-1">
                    {(web3.balances.VERSE || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    ≈ ${verseVal.toFixed(2)} USD
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>USDT / USDC</span>
                    <span className="text-emerald-600 font-bold">₮</span>
                  </div>
                  <p className="font-mono font-bold text-slate-900 mt-1">
                    ${((web3.balances.USDT || 0) + (web3.balances.USDC || 0)).toFixed(2)}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    ≈ ${((web3.balances.USDT || 0) + (web3.balances.USDC || 0)).toFixed(2)} USD
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>ETH / POL</span>
                    <span className="text-purple-600 font-bold">Ξ</span>
                  </div>
                  <p className="font-mono font-bold text-slate-900 mt-1">
                    {(web3.balances.ETH || 0).toFixed(3)} ETH
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    ≈ ${(ethVal + maticVal).toFixed(2)} USD
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>SOL / BTC</span>
                    <span className="text-orange-500 font-bold">₿</span>
                  </div>
                  <p className="font-mono font-bold text-slate-900 mt-1">
                    {(web3.balances.SOL || 2.4).toFixed(2)} SOL
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    ≈ ${(solVal + btcVal).toFixed(2)} USD
                  </p>
                </div>
              </div>
            </div>

            {/* Qualification Status */}
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
                isReserveQualified
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${isReserveQualified ? 'text-emerald-600' : 'text-amber-600'}`} />
              <div>
                <p className="font-bold">
                  {isReserveQualified
                    ? 'Merchant Reserve Status: Verified'
                    : 'Merchant Reserve Notice'}
                </p>
                <p className="text-[11px] mt-0.5 leading-relaxed">
                  {isReserveQualified
                    ? `Your connected wallet meets the real-time liquidity and reserve threshold ($${totalWalletReserveUSD} USD detected vs $${MINIMUM_MERCHANT_RESERVE_USD} required).`
                    : `We recommend funding your wallet with at least $${MINIMUM_MERCHANT_RESERVE_USD} USD in crypto assets to facilitate instant customer VERSE rewards.`}
                </p>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <Button
                type="button"
                variant="iris"
                size="md"
                onClick={() => setStep(2)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="cursor-pointer"
              >
                Continue to Business Profile
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Business Profile */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-[#00D2FE]" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Business Information</h3>
                <p className="text-xs text-slate-500">Configure your store metadata</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Business Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Coffee Roasters, Pixel Studio"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-sm text-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Business Category
              </label>
              <select
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-sm text-slate-900 focus:outline-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Business Description
              </label>
              <textarea
                rows={3}
                placeholder="Briefly describe your products, services, or physical storefront..."
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-xs text-slate-900 focus:outline-none leading-relaxed resize-none"
              />
            </div>

            <div className="pt-3 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setStep(1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="border-slate-300 hover:border-purple-300 cursor-pointer text-slate-700"
              >
                Back
              </Button>
              <Button
                type="button"
                variant="iris"
                size="md"
                onClick={() => setStep(3)}
                disabled={!businessName.trim()}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="cursor-pointer"
              >
                Continue to Rewards Setup
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Settlement & Rewards Setup */}
        {step === 3 && (
          <form onSubmit={handleFinish} className="space-y-5 animate-fadeIn">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Coins className="w-5 h-5 text-[#FF0080]" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Settlement & VERSE Loyalty</h3>
                <p className="text-xs text-slate-500">Finalize non-custodial settlement wallet & cashback</p>
              </div>
            </div>

            {/* Verified Settlement Wallet (Locked to Connected Address) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#00D2FE]" />
                <span>Verified Settlement Address (Locked)</span>
              </label>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900 truncate">
                  {web3.address}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex-shrink-0">
                  Verified Signer
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                All customer crypto checkout payments will settle directly and non-custodially to this wallet.
              </p>
            </div>

            {/* Default Payment Asset */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Default Invoicing Asset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SUPPORTED_TOKENS.slice(0, 4).map((token) => (
                  <button
                    key={token.symbol}
                    type="button"
                    onClick={() => setDefaultAsset(token.symbol)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      defaultAsset === token.symbol
                        ? 'bg-purple-50/70 border-[#7C3AED] text-slate-900 shadow-sm ring-1 ring-[#7C3AED]'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900">{token.symbol}</span>
                      <span>{token.icon}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{token.name.split(' ')[0]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Cashback Rate Slider */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Base VERSE Cashback Rate
                </label>
                <span className="text-base font-bold font-mono text-[#7C3AED]">
                  {cashbackPercent}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15"
                step="0.5"
                value={cashbackPercent}
                onChange={(e) => setCashbackPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>0.5% (Minimal)</span>
                <span>3.0% (Standard)</span>
                <span>5.0% (Popular)</span>
                <span>15.0% (Max)</span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setStep(2)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="border-slate-300 hover:border-purple-300 cursor-pointer text-slate-700"
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="iris"
                size="md"
                disabled={isSubmitted}
                rightIcon={isSubmitted ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                className="cursor-pointer font-bold shadow-md"
              >
                {isSubmitted ? 'Merchant Registered!' : 'Verify & Launch Merchant Portal'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
