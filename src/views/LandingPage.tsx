import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { IrisLogo } from '../components/ui/IrisLogo';
import {
  Store,
  User,
  ArrowRight,
  ShieldCheck,
  Zap,
  Coins,
  Award,
  Repeat,
  QrCode,
  CheckCircle2,
  Lock,
  Sparkles,
  TrendingUp,
  CreditCard,
  Layers,
  Flame,
  ArrowUpRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { navigate } = useRouter();
  const { switchRole } = useApp();
  const [activeStep, setActiveStep] = useState<number>(0);

  const loopSteps = [
    {
      step: 1,
      title: 'PAY',
      tagline: 'Instant On-Chain Crypto Settlement',
      desc: 'Merchants create payment requests in seconds. Customers scan and settle directly from self-custodial wallets (VERSE, USDT, USDC, ETH, WBTC).',
      badge: 'Non-Custodial',
      icon: <CreditCard className="w-6 h-6 text-[#00D2FE]" />,
      stats: 'Sub-second confirmation on Verse L2',
      gradient: 'from-[#00D2FE]/15 via-[#0072FF]/5 to-transparent',
      accent: '#00D2FE',
    },
    {
      step: 2,
      title: 'EARN VERSE',
      tagline: 'Instant Algorithmic Cashback',
      desc: 'Every verified transaction automatically drops VERSE rewards straight to the customer wallet, turning day-to-day shopping into tokenized savings.',
      badge: 'Automated Drop',
      icon: <Coins className="w-6 h-6 text-[#8B5CF6]" />,
      stats: 'Custom cashback rates + multipliers',
      gradient: 'from-[#6366F1]/15 via-[#8B5CF6]/5 to-transparent',
      accent: '#8B5CF6',
    },
    {
      step: 3,
      title: 'BUILD LOYALTY',
      tagline: 'Wallet-Based Merchant Membership',
      desc: 'No accounts, apps, or physical punch-cards required. The customer’s public address levels up into Bronze, Silver, Gold, or VIP status.',
      badge: 'Wallet Identity',
      icon: <Award className="w-6 h-6 text-[#EC4899]" />,
      stats: 'Tiered perks & merchant discounts',
      gradient: 'from-[#8B5CF6]/15 via-[#EC4899]/5 to-transparent',
      accent: '#EC4899',
    },
    {
      step: 4,
      title: 'COME BACK',
      tagline: 'Sustainable Repeat Retention',
      desc: 'Customers return to redeem perks, spend accumulated VERSE, and unlock higher tier reward boosts at their favorite stores.',
      badge: 'Repeat Traffic',
      icon: <Repeat className="w-6 h-6 text-[#FF0080]" />,
      stats: '+42% higher retention rate',
      gradient: 'from-[#EC4899]/15 via-[#FF0080]/5 to-transparent',
      accent: '#FF0080',
    },
  ];

  return (
    <div className="space-y-20 pb-24">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 sm:pt-20 sm:pb-16 text-center max-w-4xl mx-auto px-4">
        {/* Iridescent Glow Backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#00D2FE]/20 via-[#7C3AED]/20 to-[#FF0080]/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulseGlow" />

        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white border border-purple-200 text-xs text-slate-700 mb-8 shadow-md shadow-purple-500/10">
          <IrisLogo size={20} />
          <span className="font-bold text-slate-900 tracking-wide">IRISME</span>
          <span className="text-slate-300">|</span>
          <span className="bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] bg-clip-text text-transparent font-bold">
            Verse Pay & Loyalty Protocol
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.08] mb-6">
          Crypto checkout that brings <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] bg-clip-text text-transparent">
            customers back.
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10 font-normal">
          IRISME enables non-custodial crypto payments, rewards customers with{' '}
          <span className="text-purple-600 font-bold">VERSE</span> cashback, and drives repeat business with on-chain loyalty cards.
        </p>

        {/* Action CTAs: Distinct Sign-up / Entry for Merchant vs Customer */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="iris"
            size="lg"
            className="w-full sm:w-auto px-8 py-3.5 text-base shadow-xl shadow-purple-500/25 cursor-pointer"
            onClick={() => {
              switchRole('merchant');
              navigate('/merchant/onboarding');
            }}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign Up as Merchant
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto px-8 py-3.5 text-base border-slate-200 hover:border-pink-300 hover:bg-pink-50/40 cursor-pointer"
            onClick={() => {
              switchRole('customer');
              navigate('/customer/onboarding');
            }}
            leftIcon={<User className="w-4 h-4 text-[#FF0080]" />}
          >
            Sign Up as Customer
          </Button>
        </div>

        {/* Secondary Quick Jump */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span>Already registered?</span>
          <button
            onClick={() => {
              switchRole('merchant');
              navigate('/merchant');
            }}
            className="text-cyan-600 hover:text-cyan-800 font-bold underline cursor-pointer"
          >
            Merchant Portal
          </button>
          <span>•</span>
          <button
            onClick={() => {
              switchRole('customer');
              navigate('/customer');
            }}
            className="text-pink-600 hover:text-pink-800 font-bold underline cursor-pointer"
          >
            Customer Pass
          </button>
        </div>

        {/* Trust Highlights */}
        <div className="mt-14 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00D2FE]" />
            <span>Non-Custodial Direct Settlement</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#7C3AED]" />
            <span>Automated VERSE Drops</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#FF0080]" />
            <span>Zero App Downloads Required</span>
          </div>
        </div>
      </section>

      {/* Visual Core Product Loop Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-3 mb-12">
          <p className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-[#00D2FE] to-[#FF0080] bg-clip-text text-transparent">
            The Retention Protocol
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How IRISME Closes The Web3 Commerce Loop
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            A frictionless flywheel bridging non-custodial crypto checkout with tokenized loyalty.
          </p>
        </div>

        {/* Loop Interactive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loopSteps.map((s, idx) => (
            <div
              key={s.step}
              onClick={() => setActiveStep(idx)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden bg-white ${
                activeStep === idx
                  ? 'border-purple-400 shadow-xl shadow-purple-500/10 -translate-y-1 ring-2 ring-purple-400/20'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${s.gradient} pointer-events-none rounded-full blur-2xl`}
              />

              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-xs">
                  {s.icon}
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                  STEP 0{s.step}
                </span>
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 inline-block mb-2">
                {s.badge}
              </span>

              <h3 className="text-base font-bold text-slate-900 mb-1">{s.title}</h3>
              <p className="text-xs font-semibold text-purple-600 mb-2">{s.tagline}</p>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">{s.desc}</p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Outcome:</span>
                <span className="text-slate-700 font-mono font-bold">{s.stats}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two-Sided Platform Comparison: Merchant vs Customer */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Merchant Card */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00D2FE] to-[#7C3AED]" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-[#00D2FE]">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">For Web3 Merchants</h3>
                  <p className="text-xs text-slate-500">Zero chargebacks & automated loyalty drops</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-50 border border-cyan-200 text-cyan-800">
                Merchant App
              </span>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-semibold">Direct Non-Custodial Settlement:</strong> Funds arrive in your settlement wallet with 0 intermediary custody.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-semibold">Custom VERSE Rewards Pool:</strong> Fund a pool to automatically drop rewards to paying customers.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-semibold">Zero-Fee QR Invoicing:</strong> Generate payment requests in fiat or crypto with dynamic currency conversion.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-semibold">Targeted Multiplier Campaigns:</strong> Launch 2x or 3x VERSE weekends to boost slow sales periods.</span>
              </li>
            </ul>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <Button
                variant="iris"
                size="md"
                className="w-full cursor-pointer"
                onClick={() => {
                  switchRole('merchant');
                  navigate('/merchant/onboarding');
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign Up as Merchant
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                onClick={() => {
                  switchRole('merchant');
                  navigate('/merchant');
                }}
              >
                Open Dashboard
              </Button>
            </div>
          </div>

          {/* Customer Card */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7C3AED] to-[#FF0080]" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-[#FF0080]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">For Crypto Shoppers</h3>
                  <p className="text-xs text-slate-500">Self-custodial checkout & on-chain perks</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-pink-50 border border-pink-200 text-pink-800">
                Customer Pass
              </span>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-pink-600 flex-shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-semibold">Pay from Any Web3 Wallet:</strong> Use Verse Wallet, MetaMask, Coinbase, or WalletConnect.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-pink-600 flex-shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-semibold">Instant VERSE Cashback:</strong> Accumulate VERSE tokens with every cup of coffee or purchase.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-pink-600 flex-shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-semibold">Zero Account Creation:</strong> Your public wallet address is your lifelong VIP stamp card.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-pink-600 flex-shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-semibold">Tier Upgrades & Perks:</strong> Unlock Silver, Gold, and VIP discounts based on repeat visits.</span>
              </li>
            </ul>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <Button
                variant="iris"
                size="md"
                className="w-full cursor-pointer bg-gradient-to-r from-[#7C3AED] to-[#FF0080]"
                onClick={() => {
                  switchRole('customer');
                  navigate('/customer/onboarding');
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign Up as Customer
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                onClick={() => {
                  switchRole('customer');
                  navigate('/customer');
                }}
              >
                Open Pass
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Instant Demo Checkout Launcher */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-50/50 to-white border border-purple-200 text-center space-y-6 relative overflow-hidden shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-white border border-purple-200 mx-auto flex items-center justify-center p-2 shadow-sm">
            <IrisLogo size={32} />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className="text-2xl font-black text-slate-900">
              Ready to create your first crypto invoice?
            </h3>
            <p className="text-xs text-slate-600">
              Generate a custom crypto checkout link in 10 seconds. Customers pay, VERSE rewards drop automatically, and metrics update live.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="iris"
              size="md"
              className="px-6 cursor-pointer"
              onClick={() => navigate('/merchant/create-payment')}
            >
              Create New Invoice
            </Button>
            <Button
              variant="outline"
              size="md"
              className="px-6 border-slate-300 text-slate-700 cursor-pointer"
              onClick={() => navigate('/merchant/onboarding')}
            >
              Merchant Profile Setup
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
