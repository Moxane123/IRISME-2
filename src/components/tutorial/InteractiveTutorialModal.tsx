import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import { PriceService } from '../../services/priceService';
import { VERSE_TOKEN_ADDRESSES } from '../../config/tokens';
import { Button } from '../ui/Button';
import { IrisLogo } from '../ui/IrisLogo';
import { TokenLogo } from '../ui/TokenLogo';
import {
  QrCode,
  Store,
  Smartphone,
  CreditCard,
  Coins,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  Copy,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronRight,
  Play,
  X,
  Camera,
  Link as LinkIcon,
  HelpCircle,
  Award,
  Wallet,
  Check,
  Flame,
  Search,
  BookOpen,
} from 'lucide-react';

interface InteractiveTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'customer' | 'merchant';
}

export const InteractiveTutorialModal: React.FC<InteractiveTutorialModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'customer',
}) => {
  const { navigate } = useRouter();
  const { createPayment, switchRole, merchantProfile, startGuidedTour } = useApp();
  const { isConnected, address } = useWeb3();

  const [activeTab, setActiveTab] = useState<'customer' | 'merchant'>(defaultTab);
  const [customerStep, setCustomerStep] = useState<number>(1);
  const [merchantStep, setMerchantStep] = useState<number>(1);

  // Live VERSE price
  const [versePrice, setVersePrice] = useState<number>(() => PriceService.getPrice('VERSE') || 0.0000176);

  // Customer Demo Sandbox States
  const [demoInputLink, setDemoInputLink] = useState<string>('https://irisme.io/pay/inv_demo_espresso_89');
  const [demoInputType, setDemoInputType] = useState<'link' | 'qr' | 'manual'>('link');
  const [demoAmountUSD, setDemoAmountUSD] = useState<number>(12.5);
  const [demoSelectedAsset, setDemoSelectedAsset] = useState<string>('VERSE');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Merchant Channel Generator Sandbox States
  const [merchantDemoName, setMerchantDemoName] = useState<string>('Apex Specialty Cafe & Roastery');
  const [merchantDemoCategory, setMerchantDemoCategory] = useState<string>('Food & Beverage / Retail');
  const [merchantDemoSettlement, setMerchantDemoSettlement] = useState<string>(
    address || '0x71C8705a2B88e6082570084d5d996979d45e9B42'
  );
  const [merchantDemoItem, setMerchantDemoItem] = useState<string>('Artisanal Pour-Over & Pastry');
  const [merchantDemoAmount, setMerchantDemoAmount] = useState<number>(15.0);
  const [merchantDemoAsset, setMerchantDemoAsset] = useState<string>('VERSE');
  const [merchantDemoRewardPct, setMerchantDemoRewardPct] = useState<number>(3.0);
  const [createdDemoInvoiceId, setCreatedDemoInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    const loadPrice = async () => {
      const p = await PriceService.getVersePrice();
      if (p > 0) setVersePrice(p);
    };
    loadPrice();
  }, []);

  if (!isOpen) return null;

  // Real-time calculation helpers
  const calculatedVerseReward = Math.round(
    (demoAmountUSD * (3.0 / 100)) / (versePrice > 0 ? versePrice : 0.0000176)
  );
  const calculatedRewardUSD = (calculatedVerseReward * (versePrice > 0 ? versePrice : 0.0000176)).toFixed(4);

  // Customer Launch Live Checkout Demo
  const handleLaunchCustomerDemo = () => {
    // Create live sandbox payment invoice
    const newInvoice = createPayment({
      amountUSD: demoAmountUSD,
      selectedToken: demoSelectedAsset as any,
      chainId: 137, // Polygon Verse Hub
      description: 'Tutorial Demo Order - Coffee & Croissant',
      orderRef: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
      expirationMinutes: 45,
      cashbackPercent: 3.0,
    });

    onClose();
    navigate(`/pay/${newInvoice.id}`);
  };

  // Merchant Launch Channel Demo
  const handleGenerateMerchantChannelDemo = () => {
    const newInvoice = createPayment({
      amountUSD: merchantDemoAmount,
      selectedToken: merchantDemoAsset as any,
      chainId: 137,
      description: merchantDemoItem,
      orderRef: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      expirationMinutes: 60,
      cashbackPercent: merchantDemoRewardPct,
    });

    setCreatedDemoInvoiceId(newInvoice.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scaleUp">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-cyan-50 via-purple-50 to-pink-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00D2FE] via-[#7C3AED] to-[#FF0080] flex items-center justify-center text-white shadow-lg shadow-purple-500/25 flex-shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  IRISME Quick Tutorial & Interactive Demo
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold">
                  <Zap className="w-3 h-3 text-purple-600" />
                  Verse L2 Hub
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Learn how customers pay & earn VERSE rewards, and how merchants set up business channels in seconds.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer flex-shrink-0 shadow-xs"
            title="Close Tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dual Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-5 pt-3 gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab('customer')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'customer'
                ? 'border-purple-600 text-purple-900 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-purple-600" />
            <span>Customer Tutorial & Pay Demo</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">
              0 Sign-Up
            </span>
          </button>

          <button
            onClick={() => setActiveTab('merchant')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'merchant'
                ? 'border-[#00D2FE] text-slate-900 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4 text-[#00D2FE]" />
            <span>Merchant Business Setup & Channel Demo</span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px] font-bold">
              Non-Custodial
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ======================================================== */}
          {/* TAB 1: CUSTOMER TUTORIAL & INTERACTIVE DEMO */}
          {/* ======================================================== */}
          {activeTab === 'customer' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Highlight Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-pink-500/10 border border-purple-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Zero Friction: Scan, Link, Connect & Pay
                    </h3>
                    <p className="text-xs text-slate-600">
                      Customers do <strong className="text-purple-700">NOT</strong> need to create an account, enter emails, or submit passwords.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-xl border border-purple-200 text-purple-900 shadow-xs">
                    <Zap className="w-3.5 h-3.5 text-cyan-500" />
                    <span>VERSE:</span>
                    <strong>${versePrice.toFixed(7)}</strong>
                  </div>

                  <Button
                    variant="iris"
                    size="sm"
                    onClick={() => {
                      onClose();
                      startGuidedTour('customer');
                    }}
                    leftIcon={<Sparkles className="w-3.5 h-3.5 animate-pulse" />}
                    className="text-xs font-bold shadow-md cursor-pointer whitespace-nowrap"
                  >
                    Start Guided Tour 👉
                  </Button>
                </div>
              </div>

              {/* 4 Interactive Customer Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Step 1 */}
                <div
                  onClick={() => setCustomerStep(1)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    customerStep === 1
                      ? 'border-purple-500 bg-purple-50/40 ring-2 ring-purple-500/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                      STEP 1
                    </span>
                    <Camera className="w-4 h-4 text-purple-500" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Scan QR or Input Link</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Scan the counter QR barcode or click a checkout invoice link (<code className="text-purple-700">/pay/id</code>).
                  </p>
                </div>

                {/* Step 2 */}
                <div
                  onClick={() => setCustomerStep(2)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    customerStep === 2
                      ? 'border-purple-500 bg-purple-50/40 ring-2 ring-purple-500/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                      STEP 2
                    </span>
                    <Coins className="w-4 h-4 text-cyan-500" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Select Payable Token</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Choose <strong>VERSE</strong>, USDT, USDC, ETH, BTC, or BNB with live automatic rate conversion.
                  </p>
                </div>

                {/* Step 3 */}
                <div
                  onClick={() => setCustomerStep(3)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    customerStep === 3
                      ? 'border-purple-500 bg-purple-50/40 ring-2 ring-purple-500/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                      STEP 3
                    </span>
                    <Wallet className="w-4 h-4 text-pink-500" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Connect Web3 Wallet</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    1-tap connect via MetaMask, Verse Wallet, Coinbase, or Rabby. Direct non-custodial authorization.
                  </p>
                </div>

                {/* Step 4 */}
                <div
                  onClick={() => setCustomerStep(4)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    customerStep === 4
                      ? 'border-purple-500 bg-purple-50/40 ring-2 ring-purple-500/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                      STEP 4
                    </span>
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Earn VERSE Cashback</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Transaction confirms on-chain in seconds & automated VERSE cashback drops into your wallet!
                  </p>
                </div>
              </div>

              {/* Step Deep-Dive & Interactive Sandbox */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-mono text-xs font-bold">
                      Interactive Sandbox Demo
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Test Customer Link Input & Payment Flow
                    </h3>
                  </div>

                  <span className="text-xs text-slate-500">Live Simulation</span>
                </div>

                {/* Input link / QR simulator */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  <div className="lg:col-span-8 space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      1. How to input a payment link or invoice ID:
                    </label>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={demoInputLink}
                          onChange={(e) => setDemoInputLink(e.target.value)}
                          placeholder="Paste https://.../pay/invoice-id or invoice number"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(demoInputLink);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Quick Sample Presets */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-slate-500">Try sample presets:</span>
                      <button
                        onClick={() => {
                          setDemoInputLink('https://irisme.io/pay/inv_demo_espresso_89');
                          setDemoAmountUSD(4.5);
                          setDemoSelectedAsset('VERSE');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-purple-300 text-[11px] text-slate-700 font-medium cursor-pointer"
                      >
                        ☕ Espresso ($4.50)
                      </button>
                      <button
                        onClick={() => {
                          setDemoInputLink('https://irisme.io/pay/inv_demo_retail_120');
                          setDemoAmountUSD(120.0);
                          setDemoSelectedAsset('USDT');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-purple-300 text-[11px] text-slate-700 font-medium cursor-pointer"
                      >
                        🛍️ Retail Order ($120.00)
                      </button>
                      <button
                        onClick={() => {
                          setDemoInputLink('https://irisme.io/pay/inv_demo_verse_drop');
                          setDemoAmountUSD(25.0);
                          setDemoSelectedAsset('VERSE');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-100/70 border border-purple-200 hover:border-purple-400 text-[11px] text-purple-900 font-bold cursor-pointer"
                      >
                        ⚡ 2x VERSE Drop ($25.00)
                      </button>
                    </div>
                  </div>

                  {/* Sandbox Calculation Card */}
                  <div className="lg:col-span-4 p-4 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Order Amount:</span>
                      <strong className="text-slate-900 font-mono text-sm">${demoAmountUSD.toFixed(2)} USD</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Payable Asset:</span>
                      <span className="font-bold text-purple-700 flex items-center gap-1">
                        <TokenLogo symbol={demoSelectedAsset as any} size="xs" />
                        {demoSelectedAsset}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-purple-900 font-bold flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-purple-600" />
                        VERSE Cashback:
                      </span>
                      <span className="font-mono font-black text-purple-700 text-sm">
                        +{calculatedVerseReward.toLocaleString()} VERSE
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 text-right font-mono">
                      ≈ ${calculatedRewardUSD} USD back
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Non-custodial execution • Funds go directly to merchant wallet</span>
                  </div>

                  <Button
                    variant="iris"
                    size="md"
                    className="w-full sm:w-auto font-bold shadow-md shadow-purple-500/20 cursor-pointer"
                    onClick={handleLaunchCustomerDemo}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Launch Live Customer Checkout Demo
                  </Button>
                </div>
              </div>

              {/* Verified Verse Contracts Reference */}
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <IrisLogo size={20} />
                  <span className="font-bold text-slate-900">Verse Smart Contracts:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                  <span>Polygon: <code className="text-purple-700 font-bold">{VERSE_TOKEN_ADDRESSES[137].slice(0, 8)}...{VERSE_TOKEN_ADDRESSES[137].slice(-6)}</code></span>
                  <span>•</span>
                  <span>Ethereum: <code className="text-purple-700 font-bold">{VERSE_TOKEN_ADDRESSES[1].slice(0, 8)}...{VERSE_TOKEN_ADDRESSES[1].slice(-6)}</code></span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: MERCHANT TUTORIAL & BUSINESS SETUP DEMO */}
          {/* ======================================================== */}
          {activeTab === 'merchant' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Highlight Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-emerald-500/10 border border-cyan-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Merchant Setup & Payment Channel Creation
                    </h3>
                    <p className="text-xs text-slate-600">
                      Display your business online, create point-of-sale barcodes, and accept multi-chain crypto with 0 chargebacks.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="iris"
                    size="sm"
                    onClick={() => {
                      onClose();
                      startGuidedTour('merchant');
                    }}
                    leftIcon={<Sparkles className="w-3.5 h-3.5 animate-pulse" />}
                    className="text-xs font-bold shadow-md cursor-pointer whitespace-nowrap"
                  >
                    Start Guided Tour 👉
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      switchRole('merchant');
                      onClose();
                      navigate('/merchant/register');
                    }}
                    className="text-xs font-bold border-cyan-300 text-cyan-800 hover:bg-cyan-50 cursor-pointer"
                  >
                    Create Merchant Account
                  </Button>
                </div>
              </div>

              {/* 5 Step Merchant Walkthrough */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Step 1 */}
                <div
                  onClick={() => setMerchantStep(1)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    merchantStep === 1
                      ? 'border-cyan-500 bg-cyan-50/40 ring-2 ring-cyan-500/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded block w-fit mb-1.5">
                    STEP 1
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Create Account</h4>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Register email & business name on <code className="text-cyan-700">/merchant/register</code>.
                  </p>
                </div>

                {/* Step 2 */}
                <div
                  onClick={() => setMerchantStep(2)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    merchantStep === 2
                      ? 'border-cyan-500 bg-cyan-50/40 ring-2 ring-cyan-500/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded block w-fit mb-1.5">
                    STEP 2
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Display Online</h4>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Configure store logo, category, support contacts, and tagline.
                  </p>
                </div>

                {/* Step 3 */}
                <div
                  onClick={() => setMerchantStep(3)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    merchantStep === 3
                      ? 'border-cyan-500 bg-cyan-50/40 ring-2 ring-cyan-500/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded block w-fit mb-1.5">
                    STEP 3
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Settlement Wallet</h4>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Set your self-custodial EVM wallet address to receive 100% direct payouts.
                  </p>
                </div>

                {/* Step 4 */}
                <div
                  onClick={() => setMerchantStep(4)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    merchantStep === 4
                      ? 'border-cyan-500 bg-cyan-50/40 ring-2 ring-cyan-500/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded block w-fit mb-1.5">
                    STEP 4
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">VERSE Rewards</h4>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Set cashback reward % and milestone loyalty goals on Verse DEX.
                  </p>
                </div>

                {/* Step 5 */}
                <div
                  onClick={() => setMerchantStep(5)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    merchantStep === 5
                      ? 'border-cyan-500 bg-cyan-50/40 ring-2 ring-cyan-500/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded block w-fit mb-1.5">
                    STEP 5
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Create QR Channel</h4>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Generate instant point-of-sale barcodes or eCommerce API invoices.
                  </p>
                </div>
              </div>

              {/* Merchant Channel Creator Sandbox */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-600 text-white font-mono text-xs font-bold">
                      Merchant Channel Generator
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Live Payment Channel & Invoice Simulation
                    </h3>
                  </div>

                  <span className="text-xs text-slate-500">Zero Code Required</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Field 1: Business Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Business Name:
                    </label>
                    <input
                      type="text"
                      value={merchantDemoName}
                      onChange={(e) => setMerchantDemoName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Field 2: Item / Description */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Item / Purchase Description:
                    </label>
                    <input
                      type="text"
                      value={merchantDemoItem}
                      onChange={(e) => setMerchantDemoItem(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Field 3: Amount in USD */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Invoice Amount ($ USD):
                    </label>
                    <input
                      type="number"
                      value={merchantDemoAmount}
                      onChange={(e) => setMerchantDemoAmount(parseFloat(e.target.value) || 0)}
                      step="0.5"
                      min="0.5"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono font-bold focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Field 4: Target Settlement Asset */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Settlement Asset:
                    </label>
                    <select
                      value={merchantDemoAsset}
                      onChange={(e) => setMerchantDemoAsset(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-purple-900 focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="VERSE">VERSE (Bitcoin.com DEX)</option>
                      <option value="USDT">USDT (Polygon / Multi-Chain)</option>
                      <option value="USDC">USDC (Polygon / Multi-Chain)</option>
                      <option value="ETH">ETH (Ethereum / Base / Arbitrum)</option>
                      <option value="POL">POL (Polygon Mainnet)</option>
                    </select>
                  </div>

                  {/* Field 5: VERSE Customer Cashback % */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      VERSE Reward Cashback %:
                    </label>
                    <select
                      value={merchantDemoRewardPct}
                      onChange={(e) => setMerchantDemoRewardPct(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value={1.0}>1.0% VERSE Cashback</option>
                      <option value={3.0}>3.0% VERSE Cashback (Recommended)</option>
                      <option value={5.0}>5.0% VERSE Cashback (VIP)</option>
                      <option value={10.0}>10.0% VERSE Promotional Boost</option>
                    </select>
                  </div>

                  {/* Field 6: Merchant Settlement Address */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Merchant Receiving Wallet:
                    </label>
                    <input
                      type="text"
                      value={merchantDemoSettlement}
                      onChange={(e) => setMerchantDemoSettlement(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono text-[11px] text-slate-700 focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Generator Action & Result Preview */}
                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    Net Settlement: <strong className="text-emerald-600 font-mono">${(merchantDemoAmount * 0.995).toFixed(2)} USD</strong> (0.5% protocol fee)
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="iris"
                      size="md"
                      className="w-full sm:w-auto font-bold shadow-md cursor-pointer"
                      onClick={handleGenerateMerchantChannelDemo}
                      leftIcon={<QrCode className="w-4 h-4" />}
                    >
                      Generate Payment Channel & QR Demo
                    </Button>
                  </div>
                </div>

                {/* Output Created Invoice Preview */}
                {createdDemoInvoiceId && (
                  <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-md space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Payment Channel Active & Live on Blockchain</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">ID: {createdDemoInvoiceId}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="font-mono text-xs text-slate-800 break-all">
                        https://irisme.io/pay/{createdDemoInvoiceId}
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(`https://irisme.io/pay/${createdDemoInvoiceId}`);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          className="text-xs font-bold"
                        >
                          {copiedLink ? 'Copied' : 'Copy Channel URL'}
                        </Button>

                        <Button
                          variant="iris"
                          size="sm"
                          onClick={() => {
                            onClose();
                            navigate(`/pay/${createdDemoInvoiceId}`);
                          }}
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          className="text-xs font-bold"
                        >
                          Open Checkout View
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Jump to Full Merchant Dashboard */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900">Ready to go live with your store?</h4>
                  <p className="text-xs text-slate-500">
                    Sign up, customize your online brand, and start taking multi-chain crypto today.
                  </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      switchRole('merchant');
                      onClose();
                      navigate('/merchant/create-payment');
                    }}
                    className="w-full sm:w-auto text-xs font-bold"
                  >
                    Merchant Create Payment
                  </Button>

                  <Button
                    variant="iris"
                    size="sm"
                    onClick={() => {
                      switchRole('merchant');
                      onClose();
                      navigate('/merchant');
                    }}
                    className="w-full sm:w-auto text-xs font-bold"
                  >
                    Go to Merchant Dashboard
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <IrisLogo size={18} />
            <span>IRISME Protocol • Powered by Verse & Multi-Chain Settlement</span>
          </div>

          <button
            onClick={onClose}
            className="text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
          >
            Close Tutorial
          </button>
        </div>
      </div>
    </div>
  );
};
