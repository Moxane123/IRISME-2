import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { IrisLogo } from '../ui/IrisLogo';
import { TokenLogo } from '../ui/TokenLogo';
import { QRScannerModal } from '../ui/QRScannerModal';
import {
  QrCode,
  Store,
  Smartphone,
  CreditCard,
  Coins,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Camera,
  Link as LinkIcon,
  HelpCircle,
  Award,
  Wallet,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Flame,
} from 'lucide-react';

interface QuickTutorialSectionProps {
  onOpenFullTutorial?: (tab: 'customer' | 'merchant') => void;
}

export const QuickTutorialSection: React.FC<QuickTutorialSectionProps> = ({
  onOpenFullTutorial,
}) => {
  const { navigate } = useRouter();
  const { createPayment, switchRole, openTutorial, startGuidedTour } = useApp();

  const [activeTab, setActiveTab] = useState<'customer' | 'merchant'>('customer');
  const [quickInputLink, setQuickInputLink] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  // Merchant Quick Demo Channel State
  const [quickBizName, setQuickBizName] = useState('My Local Business');
  const [quickAmountUSD, setQuickAmountUSD] = useState(15.0);
  const [quickAsset, setQuickAsset] = useState('VERSE');
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(null);

  const handleLaunchCustomerLink = () => {
    if (quickInputLink.trim()) {
      let target = quickInputLink.trim();
      const match = target.match(/\/pay\/([^/?#]+)/);
      if (match && match[1]) target = match[1];
      navigate(`/pay/${target}`);
    } else {
      // Create quick sample payment
      const p = createPayment({
        amountUSD: 8.5,
        selectedToken: 'VERSE',
        chainId: 137,
        description: 'Sample Coffee & Pastry',
        orderRef: `SAMPLE-${Math.floor(1000 + Math.random() * 9000)}`,
        expirationMinutes: 30,
        cashbackPercent: 3.0,
      });
      navigate(`/pay/${p.id}`);
    }
  };

  const handleGenerateQuickMerchantChannel = () => {
    const p = createPayment({
      amountUSD: quickAmountUSD,
      selectedToken: quickAsset as any,
      chainId: 137,
      description: `${quickBizName} - Checkout`,
      orderRef: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      expirationMinutes: 45,
      cashbackPercent: 3.0,
    });
    setGeneratedInvoiceId(p.id);
  };

  return (
    <section className="relative max-w-6xl mx-auto px-4 py-8">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-cyan-500/5 to-pink-500/5 rounded-3xl -z-10 blur-xl pointer-events-none" />

      <div className="bg-white rounded-3xl border border-purple-200/90 shadow-xl overflow-hidden">
        {/* Section Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-50 via-white to-cyan-50 border-b border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-cyan-100 text-purple-900 text-xs font-bold font-mono">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>INTERACTIVE QUICK TUTORIAL & DEMO</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              How IRISME Works for Customers & Merchants
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Zero registration for shoppers. Non-custodial payouts & automated VERSE loyalty rewards for businesses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="iris"
              size="sm"
              onClick={() => startGuidedTour(activeTab)}
              className="text-xs font-bold shadow-md cursor-pointer"
              leftIcon={<Sparkles className="w-3.5 h-3.5 animate-pulse" />}
            >
              Start Live Guided Tour 👉
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (openTutorial) openTutorial(activeTab);
                else if (onOpenFullTutorial) onOpenFullTutorial(activeTab);
              }}
              className="text-xs font-bold border-purple-300 text-purple-800 hover:bg-purple-50 cursor-pointer"
              leftIcon={<HelpCircle className="w-3.5 h-3.5 text-purple-600" />}
            >
              Step-by-Step Overview
            </Button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50/90 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('customer')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'customer'
                ? 'border-purple-600 text-purple-900 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-purple-600" />
            <span>Customer Tutorial (How to Pay)</span>
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
            <span>Merchant Tutorial (Create Channel & Display Online)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* ======================================================== */}
          {/* CUSTOMER TUTORIAL CONTENT */}
          {/* ======================================================== */}
          {activeTab === 'customer' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Step cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-purple-50/30 border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      STEP 1
                    </span>
                    <Camera className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Scan QR or Input Link</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Point your camera at the merchant countertop QR code, scan from your Web3 wallet, or open a shared checkout link (<code className="text-purple-700">/pay/INV-ID</code>).
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-cyan-50/30 border border-cyan-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">
                      STEP 2
                    </span>
                    <Coins className="w-4 h-4 text-cyan-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Choose Payable Token</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Select <strong>VERSE</strong>, USDT, USDC, ETH, BTC, or BNB. Live DEX conversion ensures real-time price accuracy.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-pink-50/30 border border-pink-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded">
                      STEP 3
                    </span>
                    <Sparkles className="w-4 h-4 text-pink-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Connect & Earn VERSE</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Connect any self-custodial wallet (MetaMask, Verse Wallet, Coinbase). Authorize payment and receive instant VERSE rewards in your wallet!
                  </p>
                </div>
              </div>

              {/* Interactive Customer Quick Tester */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-600" />
                  <span>Try It Now: Input Link or Scan QR Code</span>
                </h4>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={quickInputLink}
                      onChange={(e) => setQuickInputLink(e.target.value)}
                      placeholder="Paste checkout link (e.g. /pay/sample-id) or leave blank to test sample order"
                      className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>

                  <Button
                    variant="iris"
                    size="md"
                    onClick={handleLaunchCustomerLink}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="font-bold shadow-md cursor-pointer flex-shrink-0"
                  >
                    Open Customer Checkout Demo
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setIsScannerOpen(true)}
                    leftIcon={<Camera className="w-4 h-4 text-[#00D2FE]" />}
                    className="font-bold border-slate-300 hover:bg-slate-100 cursor-pointer flex-shrink-0"
                  >
                    Scan QR
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MERCHANT TUTORIAL CONTENT */}
          {/* ======================================================== */}
          {activeTab === 'merchant' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Step cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-cyan-50/30 border border-cyan-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">
                      STEP 1
                    </span>
                    <Store className="w-4 h-4 text-cyan-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Sign Up & Display Online</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Create a merchant account on <code className="text-cyan-700">/merchant/register</code>. Set business name, category, website, and support email to showcase your verified store.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-purple-50/30 border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      STEP 2
                    </span>
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Set Settlement Address</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter your EVM/Polygon wallet address. 100% of customer payments settle non-custodially to your wallet with sub-cent gas fees and 0 chargebacks.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      STEP 3
                    </span>
                    <QrCode className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Create Payment Channels</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Generate instant point-of-sale barcodes, printable countertop stands, or dynamic links. Configure custom VERSE rewards to boost customer retention.
                  </p>
                </div>
              </div>

              {/* Interactive Merchant Channel Generator */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Quick Demo: Create a Business Payment Channel</span>
                  </h4>
                  <span className="text-xs text-slate-500">Takes 5 Seconds</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Business Name:
                    </label>
                    <input
                      type="text"
                      value={quickBizName}
                      onChange={(e) => setQuickBizName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Item Amount ($ USD):
                    </label>
                    <input
                      type="number"
                      value={quickAmountUSD}
                      onChange={(e) => setQuickAmountUSD(parseFloat(e.target.value) || 0)}
                      step="0.5"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Settlement Asset:
                    </label>
                    <select
                      value={quickAsset}
                      onChange={(e) => setQuickAsset(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-purple-900"
                    >
                      <option value="VERSE">VERSE (Bitcoin.com DEX)</option>
                      <option value="USDT">USDT (Polygon / Multi-Chain)</option>
                      <option value="USDC">USDC (Polygon / Multi-Chain)</option>
                      <option value="ETH">ETH (Ethereum / Base / Polygon)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
                  <span className="text-xs text-slate-500">
                    Calculated VERSE Reward: <strong className="text-purple-700">3.0% Cashback</strong> automatically enabled.
                  </span>

                  <Button
                    variant="iris"
                    size="md"
                    onClick={handleGenerateQuickMerchantChannel}
                    leftIcon={<QrCode className="w-4 h-4" />}
                    className="font-bold shadow-md cursor-pointer"
                  >
                    Generate Payment Channel & QR Code
                  </Button>
                </div>

                {generatedInvoiceId && (
                  <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Channel Ready: {quickBizName} (${quickAmountUSD.toFixed(2)})</span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-500">
                        https://irisme.io/pay/{generatedInvoiceId}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://irisme.io/pay/${generatedInvoiceId}`);
                          setCopiedInvoice(true);
                          setTimeout(() => setCopiedInvoice(false), 2000);
                        }}
                        className="text-xs font-bold"
                      >
                        {copiedInvoice ? 'Copied' : 'Copy URL'}
                      </Button>

                      <Button
                        variant="iris"
                        size="sm"
                        onClick={() => navigate(`/pay/${generatedInvoiceId}`)}
                        className="text-xs font-bold"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Launch Customer View
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </section>
  );
};
