import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { IrisLogo } from '../components/ui/IrisLogo';
import { QRScannerModal } from '../components/ui/QRScannerModal';
import { QuickTutorialSection } from '../components/tutorial/QuickTutorialSection';
import {
  Store,
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
  KeyRound,
  Camera,
  Smartphone,
  Wallet,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { navigate } = useRouter();
  const { switchRole, openTutorial } = useApp();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  const loopSteps = [
    {
      step: 1,
      title: 'CREATE INVOICE',
      tagline: 'Instant QR & Barcode Generation',
      desc: 'Merchants enter the amount, select asset (VERSE, USDT, USDC, ETH, WBTC), and generate an instant payment barcode and checkout link with zero setup delays.',
      badge: 'Merchant Tool',
      icon: <QrCode className="w-6 h-6 text-[#00D2FE]" />,
      stats: 'Generated in < 3 seconds',
      gradient: 'from-[#00D2FE]/15 via-[#0072FF]/5 to-transparent',
      accent: '#00D2FE',
    },
    {
      step: 2,
      title: 'SCAN & CONNECT',
      tagline: 'Zero Customer Sign-Up Required',
      desc: 'Customers scan the counter barcode with any phone camera or Web3 wallet. They connect their wallet with 1 tap—no registration, email, or passwords required.',
      badge: 'Frictionless',
      icon: <Smartphone className="w-6 h-6 text-[#8B5CF6]" />,
      stats: 'Zero account friction',
      gradient: 'from-[#6366F1]/15 via-[#8B5CF6]/5 to-transparent',
      accent: '#8B5CF6',
    },
    {
      step: 3,
      title: 'AUTHORIZE & SETTLE',
      tagline: 'Non-Custodial Direct Settlement',
      desc: 'Customers authorize the exact amount in their Web3 wallet. Funds settle directly to the merchant’s verified wallet address on Polygon / Verse L2 with sub-cent fees.',
      badge: 'Non-Custodial',
      icon: <CreditCard className="w-6 h-6 text-[#EC4899]" />,
      stats: 'Direct to merchant wallet',
      gradient: 'from-[#8B5CF6]/15 via-[#EC4899]/5 to-transparent',
      accent: '#EC4899',
    },
    {
      step: 4,
      title: 'AUTO VERSE REWARDS',
      tagline: 'Algorithmic Retention Flywheel',
      desc: 'Every verified transaction automatically drops VERSE cashback into the customer’s wallet, incentivizing repeat visits without physical punch-cards.',
      badge: 'Automatic Drop',
      icon: <Coins className="w-6 h-6 text-[#FF0080]" />,
      stats: '+42% repeat retention rate',
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
            Merchant Crypto Checkout & Loyalty Protocol
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
          IRISME enables non-custodial crypto payments for businesses, drops automated{' '}
          <span className="text-purple-600 font-bold">VERSE</span> cashback to shoppers, and powers wallet-based loyalty with <strong className="text-slate-900">zero customer sign-up friction</strong>.
        </p>

        {/* Action CTAs for Merchants & QR Scan Demo */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            data-tour="merchant-signup-btn"
            variant="iris"
            size="lg"
            className="w-full sm:w-auto px-8 py-3.5 text-base shadow-xl shadow-purple-500/25 cursor-pointer font-bold"
            onClick={() => {
              switchRole('merchant');
              navigate('/merchant/register');
            }}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign Up as Merchant
          </Button>

          <Button
            data-tour="customer-input-link"
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto px-8 py-3.5 text-base border-slate-300 hover:border-purple-300 hover:bg-purple-50/40 cursor-pointer font-bold text-slate-800"
            onClick={() => openTutorial('customer')}
            leftIcon={<Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />}
          >
            Quick Tutorial & Demo
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto px-6 py-3.5 text-base border-slate-300 hover:border-cyan-300 hover:bg-cyan-50/30 cursor-pointer font-bold text-slate-700"
            onClick={() => setIsScannerOpen(true)}
            leftIcon={<Camera className="w-4 h-4 text-[#00D2FE]" />}
          >
            Scan to Pay
          </Button>
        </div>

        {/* Secondary Quick Jump */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span>New here?</span>
          <button
            onClick={() => openTutorial('merchant')}
            className="text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Merchant Setup Guide</span>
          </button>
          <span>•</span>
          <button
            onClick={() => openTutorial('customer')}
            className="text-cyan-700 hover:text-cyan-900 font-bold underline cursor-pointer flex items-center gap-1"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Customer Pay Guide</span>
          </button>
          <span>•</span>
          <button
            onClick={() => {
              switchRole('merchant');
              navigate('/merchant/login');
            }}
            className="text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
          >
            Sign In
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
            <span>Automated VERSE Rewards Drop</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#FF0080]" />
            <span>Zero Customer Sign-Up Required</span>
          </div>
        </div>
      </section>

      {/* Interactive Quick Tutorial Section on Landing Page */}
      <QuickTutorialSection onOpenFullTutorial={(tab) => openTutorial(tab)} />

      {/* Visual Core Product Loop Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-3 mb-12">
          <p className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-[#00D2FE] to-[#FF0080] bg-clip-text text-transparent">
            How It Works
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Seamless Non-Custodial Workflow
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Merchants create barcodes in seconds; customers scan, connect wallet, authorize payment, and earn instant VERSE cashback.
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
                  ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-xl'
                  : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-slate-100`}
              >
                {s.icon}
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-400 block mb-1">
                STEP 0{s.step}
              </span>
              <h3 className="text-base font-bold text-slate-900 mb-1">{s.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-purple-700">{s.badge}</span>
                <span className="text-slate-400 font-mono">{s.stats}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Merchant Platform Spotlight Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Merchant Features */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold font-mono">
              <Store className="w-3.5 h-3.5" />
              <span>BUILT FOR BUSINESS OWNERS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              A Complete Web3 Payment Suite with Built-in Customer Loyalty
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              IRISME eliminates the friction of traditional card processors and complicated crypto checkouts. Set up in minutes, accept multi-chain stablecoins and native tokens, and watch customer retention grow through algorithmic cashback.
            </p>

            <ul className="space-y-3.5 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-bold">Multi-Chain & Multi-Token:</strong> Accept VERSE, USDT, USDC, ETH, and WBTC settled directly to your wallet.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-bold">Non-Custodial & Secure:</strong> Private keys never leave your possession. IRISME never holds merchant funds.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-bold">Zero Customer Barrier:</strong> Shoppers do not create accounts. Any Web3 wallet (MetaMask, Verse Wallet, Coinbase) works instantly.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 font-bold">Automated Cashback Protocol:</strong> Reward repeat customers with automated VERSE cashback funded from your campaign pool.</span>
              </li>
            </ul>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                variant="iris"
                size="md"
                className="font-bold shadow-md cursor-pointer"
                onClick={() => {
                  switchRole('merchant');
                  navigate('/merchant/register');
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Register Your Store
              </Button>
              <Button
                variant="outline"
                size="md"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer font-semibold"
                onClick={() => {
                  switchRole('merchant');
                  navigate('/merchant');
                }}
              >
                Explore Merchant Portal
              </Button>
            </div>
          </div>

          {/* Live Barcode / Scan Interactive Card */}
          <div className="p-7 rounded-3xl bg-slate-900 text-white shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#00D2FE]/20 via-[#7C3AED]/20 to-[#FF0080]/20 pointer-events-none rounded-full blur-3xl" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#00D2FE]">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Live Barcode Checkout</h3>
                  <p className="text-xs text-slate-400">Scan with any phone camera or wallet</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
                Live Engine
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Merchant:</span>
                <span className="text-white font-sans font-bold">IrisMe Flagship Store</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Item:</span>
                <span className="text-white font-sans font-medium">Artisan Coffee & Pastry</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Amount Due:</span>
                <span className="text-white font-bold">$25.00 (25.00 USDT)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Customer Cashback:</span>
                <span className="text-purple-400 font-bold">+650 VERSE</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Customer Flow:</span>
                <span className="text-emerald-400 font-sans font-semibold">Scan → Connect → Pay</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="iris"
                size="md"
                className="w-full font-bold shadow-lg cursor-pointer"
                onClick={() => setIsScannerOpen(true)}
                leftIcon={<Camera className="w-4 h-4" />}
              >
                Test Scan with Scanner
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white font-semibold cursor-pointer"
                onClick={() => navigate('/pay/pay-1')}
              >
                Open Demo Checkout
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
              Generate a custom crypto checkout link and barcode in 10 seconds. Customers scan, connect wallet, and authorize payment on Verse with instant settlement.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="iris"
              size="md"
              className="px-6 cursor-pointer font-bold shadow-md"
              onClick={() => navigate('/merchant/create-payment')}
            >
              Create New Invoice
            </Button>
            <Button
              variant="outline"
              size="md"
              className="px-6 border-slate-300 text-slate-700 cursor-pointer font-semibold"
              onClick={() => navigate('/merchant/onboarding')}
            >
              Merchant Profile Setup
            </Button>
          </div>
        </div>
      </section>

      {/* QR Code Scanner Modal */}
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </div>
  );
};
