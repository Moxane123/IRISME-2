import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { IrisLogo } from '../../components/ui/IrisLogo';
import { PriceService } from '../../services/priceService';
import {
  User,
  Wallet,
  Coins,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  QrCode,
  Check,
  Award,
  Bell,
  TrendingUp,
  Tag,
  Store,
} from 'lucide-react';

const SHOPPING_CATEGORIES = [
  { id: 'cafes', label: 'Cafes & Coffee', icon: '☕' },
  { id: 'dining', label: 'Restaurants & Dining', icon: '🍽️' },
  { id: 'tech', label: 'Tech & Electronics', icon: '💻' },
  { id: 'fashion', label: 'Fashion & Apparel', icon: '👗' },
  { id: 'travel', label: 'Travel & Hospitality', icon: '✈️' },
  { id: 'gaming', label: 'Gaming & Metaverse', icon: '🎮' },
  { id: 'wellness', label: 'Fitness & Wellness', icon: '🧘' },
  { id: 'groceries', label: 'Groceries & Markets', icon: '🛒' },
];

const AVATARS = ['💳', '🚀', '⚡', '💎', '🦊', '🦁', '🌟', '👾'];

export const CustomerOnboarding: React.FC = () => {
  const { navigate } = useRouter();
  const { customerProfile, completeCustomerOnboarding, wallet, switchRole, setIsWalletModalOpen } = useApp();
  const { isConnected, address, connectInjected } = useWeb3();

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [displayName, setDisplayName] = useState(customerProfile.displayName || 'Crypto Shopper');
  const [avatarIcon, setAvatarIcon] = useState(customerProfile.avatarIcon || '💳');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    customerProfile.favoriteCategories && customerProfile.favoriteCategories.length > 0
      ? customerProfile.favoriteCategories
      : ['Cafes & Coffee', 'Tech & Electronics']
  );
  const [autoStakeVerse, setAutoStakeVerse] = useState(customerProfile.autoStakeVerse || false);
  const [notifyOnCashback, setNotifyOnCashback] = useState(
    customerProfile.notifyOnCashback !== undefined ? customerProfile.notifyOnCashback : true
  );
  const [isActivating, setIsActivating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check connection state
  useEffect(() => {
    if (isConnected && address) {
      if (step === 0) setStep(1);
    } else {
      setStep(0);
    }
  }, [isConnected, address]);

  const toggleCategory = (categoryLabel: string) => {
    if (selectedCategories.includes(categoryLabel)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== categoryLabel));
    } else {
      setSelectedCategories([...selectedCategories, categoryLabel]);
    }
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      setIsWalletModalOpen(true);
      return;
    }

    setIsActivating(true);

    setTimeout(() => {
      completeCustomerOnboarding({
        displayName: displayName.trim() || 'Crypto Shopper',
        avatarIcon,
        favoriteCategories: selectedCategories,
        autoStakeVerse,
        notifyOnCashback,
      });

      setIsActivating(false);
      setIsSuccess(true);

      setTimeout(() => {
        navigate('/customer');
      }, 1200);
    }, 800);
  };

  const versePrice = PriceService.getPrice('VERSE');
  const starterBonusUSD = Number((50 * versePrice).toFixed(4));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white border border-pink-200 text-xs font-semibold shadow-xs">
          <IrisLogo size={18} />
          <span className="bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#FF0080] bg-clip-text text-transparent font-bold">
            Customer Pass Verification & Registration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Activate Your Web3 Loyalty Pass
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Wallet connection is required to issue your non-custodial loyalty pass and unlock instant VERSE cashback rewards.
        </p>
      </div>

      {/* Progress Steps Indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 sm:gap-4 bg-white p-2 sm:px-6 sm:py-2.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= 1
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#FF0080] text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
            </div>
            <span
              className={`text-xs font-semibold ${
                step === 1 ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              Identity
            </span>
          </div>

          <div className="w-6 sm:w-10 h-0.5 bg-slate-200" />

          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= 2
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#FF0080] text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
            </div>
            <span
              className={`text-xs font-semibold ${
                step === 2 ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              Preferences
            </span>
          </div>

          <div className="w-6 sm:w-10 h-0.5 bg-slate-200" />

          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= 3
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#FF0080] text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              3
            </div>
            <span
              className={`text-xs font-semibold ${
                step === 3 ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              Activate Pass
            </span>
          </div>
        </div>
      </div>

      {/* Main Card Form */}
      <Card variant="default" className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
        {/* STEP 0: Wallet Gate */}
        {step === 0 && (
          <div className="space-y-6 text-center py-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#7C3AED]/20 to-[#FF0080]/20 border border-pink-200 flex items-center justify-center mx-auto text-2xl shadow-sm">
              <Wallet className="w-8 h-8 text-[#7C3AED]" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-black text-slate-900">
                Connect Wallet to Register Pass
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect your Web3 wallet to verify customer ownership. Your rewards and loyalty points will be minted directly to your connected address.
              </p>
            </div>

            <div className="pt-2 max-w-sm mx-auto">
              <Button
                variant="iris"
                size="lg"
                onClick={() => setIsWalletModalOpen(true)}
                leftIcon={<Wallet className="w-4 h-4" />}
                className="w-full justify-center text-sm font-bold shadow-lg shadow-purple-500/10 cursor-pointer"
              >
                Connect Wallet to Begin
              </Button>
            </div>
          </div>
        )}

        {/* STEP 1: Shopper Identity & Verified Wallet */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-[#7C3AED]" />
                <span>Shopper Identity & Public Handle</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Your identity is linked directly to your self-custodial wallet address. No email or password needed.
              </p>
            </div>

            {/* Connected Wallet Display */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Verified Connected Web3 Address
              </label>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="font-mono text-xs text-slate-800 font-bold truncate">
                    {address}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex-shrink-0">
                  Verified Signer
                </span>
              </div>
            </div>

            {/* Shopper Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Shopper Alias or Web3 Handle <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex.verse or SatoshiShopper"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              <p className="text-[11px] text-slate-500 font-normal">
                This alias identifies your loyalty cards on merchant point-of-sale systems.
              </p>
            </div>

            {/* Avatar Icon Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Choose Pass Badge Avatar
              </label>
              <div className="flex flex-wrap gap-2.5">
                {AVATARS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setAvatarIcon(icon)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                      avatarIcon === icon
                        ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500 shadow-sm scale-105'
                        : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 flex items-start gap-2.5 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-slate-900 font-semibold">True Ownership:</strong> Your points, cashback, and stamps stay cryptographically linked to your wallet. If you change browsers or devices, you keep all rewards.
              </p>
            </div>

            {/* Step Navigation */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="iris"
                size="md"
                onClick={() => setStep(2)}
                disabled={!displayName.trim()}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Preferences
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Shopping & Cashback Preferences */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#FF0080]" />
                <span>Rewards & Shopping Categories</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize how you receive VERSE cashback drops and choose your favorite merchant categories.
              </p>
            </div>

            {/* Category Multi-select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Select Favorite Shopping Categories
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SHOPPING_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.label);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.label)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-300 text-slate-900 shadow-2xs font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-xs font-medium leading-tight">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reward Preferences Toggles */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700 block">
                Cashback Handling & Alerts
              </label>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Bell className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Instant Cashback Notification</p>
                    <p className="text-[11px] text-slate-500">Show instant on-screen confirmation and token drop animation upon payment settlement.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnCashback}
                  onChange={(e) => setNotifyOnCashback(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <TrendingUp className="w-4 h-4 text-[#00D2FE] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Auto-Stake VERSE Rewards (Optional)</p>
                    <p className="text-[11px] text-slate-500">Route earned VERSE cashback into the Verse Staking Farm for compounding yield.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoStakeVerse}
                  onChange={(e) => setAutoStakeVerse(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Step Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setStep(1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="iris"
                size="md"
                onClick={() => setStep(3)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Preview Loyalty Pass
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview & Pass Activation */}
        {step === 3 && (
          <form onSubmit={handleFinish} className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#EC4899]" />
                <span>Review & Activate Loyalty Pass</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Confirm your details below. You will receive an instant 50 VERSE starter bonus upon activation.
              </p>
            </div>

            {/* Interactive Pass Card Mockup */}
            <div className="max-w-md mx-auto p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white relative overflow-hidden shadow-xl border border-purple-500/30">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-pink-500/30 via-cyan-500/20 to-transparent rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-5">
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IrisLogo size={24} />
                    <span className="font-mono text-xs font-bold tracking-widest text-cyan-300 uppercase">
                      VERSE PASS
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 border border-white/20 text-white flex items-center gap-1">
                    <span>🥉</span> Bronze Starter
                  </span>
                </div>

                {/* Pass Holder Info */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-inner">
                    {avatarIcon}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">{displayName}</h4>
                    <p className="text-xs text-purple-200 font-mono">
                      {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : 'Connecting...'}
                    </p>
                  </div>
                </div>

                {/* Perks Summary */}
                <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-purple-200 block font-medium">Starter Cashback:</span>
                    <span className="font-bold text-cyan-300 font-mono">3.0% Standard</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-purple-200 block font-medium">Welcome Gift:</span>
                    <span className="font-bold text-pink-300 font-mono">+50 VERSE (~${starterBonusUSD})</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1">
                  <span>Verified Non-Custodial Pass</span>
                  <span className="font-mono text-cyan-300 font-bold">Polygon / Verse L2</span>
                </div>
              </div>
            </div>

            {/* Bonus Drop Callout */}
            <div className="p-4 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  🎁
                </div>
                <div>
                  <p className="font-bold text-slate-900">50 VERSE Welcome Bonus Ready</p>
                  <p className="text-[11px] text-slate-600">Will be credited to your verified customer address upon activation.</p>
                </div>
              </div>
              <span className="font-mono font-bold text-pink-700 text-xs px-2 py-1 bg-white rounded-lg border border-pink-200">
                FREE DROP
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setStep(2)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="iris"
                size="lg"
                isLoading={isActivating}
                disabled={isActivating || isSuccess}
                className="px-8 shadow-xl shadow-purple-500/25 cursor-pointer"
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                {isSuccess ? 'Pass Activated!' : 'Activate Customer Pass'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Switch to Merchant Option */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-500">
          Are you a store owner or business looking to accept crypto?{' '}
          <button
            onClick={() => {
              switchRole('merchant');
              navigate('/merchant/onboarding');
            }}
            className="text-purple-600 hover:text-purple-800 font-bold underline cursor-pointer"
          >
            Switch to Merchant Onboarding →
          </button>
        </p>
      </div>
    </div>
  );
};
