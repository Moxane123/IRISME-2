import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SupportedToken, FiatCurrency, Payment } from '../../types';
import { SUPPORTED_TOKENS, FIAT_CURRENCIES } from '../../data/mockData';
import { SUPPORTED_CHAINS, getChainConfig } from '../../config/chains';
import { DEFAULT_PLATFORM_FEE_PERCENT } from '../../config';
import { EconomicService } from '../../services/economicService';
import { PriceService } from '../../services/priceService';
import { PaymentQRCode } from '../../components/ui/PaymentQRCode';
import { TokenLogo } from '../../components/ui/TokenLogo';
import { TokenLogoModal } from '../../components/ui/TokenLogoModal';
import {
  PlusCircle,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Receipt,
  Sparkles,
  ShieldCheck,
  Zap,
  Tag,
  Hash,
  FileText,
  AlertCircle,
  ArrowRight,
  Store,
  Layers,
} from 'lucide-react';

const EXPIRATION_OPTIONS = [
  { label: '15 Minutes', minutes: 15 },
  { label: '30 Minutes', minutes: 30 },
  { label: '45 Minutes (Default)', minutes: 45 },
  { label: '1 Hour', minutes: 60 },
  { label: '2 Hours', minutes: 120 },
  { label: '24 Hours', minutes: 1440 },
];

export const CreatePayment: React.FC = () => {
  const { navigate } = useRouter();
  const { createPayment, merchantProfile, getPaymentById, openTutorial } = useApp();

  const [amount, setAmount] = useState<string>('25.00');
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>(
    merchantProfile.defaultFiatCurrency || 'USD'
  );
  const [selectedToken, setSelectedToken] = useState<SupportedToken>(
    merchantProfile.defaultPaymentAsset || 'USDT'
  );
  const [selectedChainId, setSelectedChainId] = useState<number>(137); // Polygon default
  const [description, setDescription] = useState<string>('Order checkout');
  const [orderRef, setOrderRef] = useState<string>('');
  const [expirationMinutes, setExpirationMinutes] = useState<number>(45);

  const [createdPayment, setCreatedPayment] = useState<Payment | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isLogoGalleryOpen, setIsLogoGalleryOpen] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const tokenInfo = SUPPORTED_TOKENS.find((t) => t.symbol === selectedToken) || SUPPORTED_TOKENS[0];
  const verseToken = SUPPORTED_TOKENS.find((t) => t.symbol === 'VERSE')!;
  const currentChain = getChainConfig(selectedChainId) || SUPPORTED_CHAINS[137];

  // Auto-adjust default chain when token requires specific chain (e.g. BNB on 56, POL on 137, AVAX on 43114)
  const handleSelectToken = (sym: SupportedToken) => {
    setSelectedToken(sym);
    if (sym === 'BNB') setSelectedChainId(56);
    else if (sym === 'POL' || sym === 'MATIC' || sym === 'VERSE') setSelectedChainId(137);
    else if (sym === 'AVAX') setSelectedChainId(43114);
    else if (sym === 'SOL' || sym === 'BTC') setSelectedChainId(137); // EVM settlement hub
  };

  // Live verse and token price
  const [liveVersePrice, setLiveVersePrice] = useState<number>(() => PriceService.getPrice('VERSE') || 0.0000176);

  useEffect(() => {
    const fetchPrices = async () => {
      const v = await PriceService.getVersePrice();
      if (v > 0) setLiveVersePrice(v);
    };
    fetchPrices();
  }, []);

  const activeVerseRate = liveVersePrice > 0 ? liveVersePrice : (verseToken.rateToUSD || 0.0000176);
  const activeTokenRate = selectedToken === 'VERSE' ? activeVerseRate : (PriceService.getPrice(selectedToken) || tokenInfo.rateToUSD);

  // Crypto conversion
  const calculatedCrypto =
    selectedToken === 'VERSE'
      ? Math.round(numAmount / activeVerseRate)
      : selectedToken === 'ETH' || selectedToken === 'WBTC' || selectedToken === 'BTC' || selectedToken === 'SOL'
      ? Number((numAmount / activeTokenRate).toFixed(6))
      : Number((numAmount / activeTokenRate).toFixed(2));

  // 3-Concept Economic Calculation
  const liveEconomics = EconomicService.getPaymentEconomics({
    amountUSD: numAmount,
    tokenAmount: calculatedCrypto,
    tokenSymbol: selectedToken,
    chainId: selectedChainId,
    settlementAddress: merchantProfile.settlementAddress || '',
    merchantType: merchantProfile.merchantType || 'irisme_merchant',
    cashbackPercent: merchantProfile.baseRewardPercent || 1.0,
    versePriceUSD: activeVerseRate,
    campaignMultiplier: 1.0,
  });

  useEffect(() => {
    if (createdPayment) {
      const live = getPaymentById(createdPayment.id);
      if (live) {
        setCreatedPayment(live);
      }
    }
  }, [getPaymentById, createdPayment?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    const newPayment = createPayment({
      amountUSD: numAmount,
      fiatCurrency,
      selectedToken,
      chainId: selectedChainId,
      description: description.trim() || 'IRISME Crypto Checkout',
      orderRef: orderRef.trim() || undefined,
      merchantType: merchantProfile.merchantType || 'irisme_merchant',
      cashbackPercent: merchantProfile.baseRewardPercent || 1.0,
      expirationMinutes,
    });

    setCreatedPayment(newPayment);
  };

  const handleCopyLink = () => {
    if (!createdPayment) return;
    const url = `${window.location.origin}/pay/${createdPayment.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    if (!createdPayment) return;
    navigator.clipboard.writeText(createdPayment.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Create Payment Request</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
              Multi-Chain
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Generate an on-chain invoice with real-time barcode, QR code, and instant customer checkout.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            className="border-purple-200 bg-purple-50 hover:bg-purple-100 text-xs text-purple-900 cursor-pointer shadow-xs font-bold"
            onClick={() => openTutorial('merchant')}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />}
          >
            Tutorial & Guide
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 hover:border-purple-300 text-xs text-slate-700 cursor-pointer shadow-xs font-medium"
            onClick={() => navigate('/merchant/payments')}
          >
            View Payments & Invoices
          </Button>
        </div>
      </div>

      {/* When Payment Has Been Generated: Display Full Invoice & QR Code */}
      {createdPayment ? (
        <div data-tour="generated-qr-channel" className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Payment Invoice Ready</h3>
                  <p className="text-xs text-slate-500 font-mono">Invoice ID: {createdPayment.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-slate-200 hover:border-purple-300 text-slate-700 cursor-pointer shadow-xs font-semibold"
                  onClick={handleCopyLink}
                  leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedLink ? 'Link Copied!' : 'Copy Payment Link'}
                </Button>
                <Button
                  variant="iris"
                  size="sm"
                  className="text-xs shadow-md shadow-purple-500/20 cursor-pointer font-bold"
                  onClick={() => navigate(`/pay/${createdPayment.id}`)}
                  leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  Open Checkout Page
                </Button>
              </div>
            </div>

            {/* Comprehensive Detail Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Payment Details */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs shadow-xs">
                <p className="text-slate-500 font-sans uppercase font-bold text-[11px] tracking-wider mb-2 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-purple-600" />
                  Payment Specifications
                </p>

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Payment ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-800 font-semibold">{createdPayment.id}</span>
                    <button onClick={handleCopyId} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                      {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {createdPayment.orderRef && (
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Order / Ref ID:</span>
                    <span className="text-slate-900 font-bold font-sans">{createdPayment.orderRef}</span>
                  </div>
                )}

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Description:</span>
                  <span className="text-slate-900 font-medium font-sans truncate max-w-[200px]">{createdPayment.description}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Amount Due:</span>
                  <span className="text-slate-900 font-bold">
                    ${createdPayment.amountUSD.toFixed(2)} ({createdPayment.tokenAmount} {createdPayment.selectedToken})
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Settlement Network:</span>
                  <span className="text-slate-900 font-bold font-sans">
                    {getChainConfig(createdPayment.chainId || 137)?.name || 'Polygon'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">iRisme Platform Fee ({createdPayment.platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT}%):</span>
                  <span className="text-slate-600 font-bold font-mono">
                    -${(createdPayment.platformFeeUSD ?? (createdPayment.amountUSD * ((createdPayment.platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT) / 100))).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-200 bg-emerald-50/80 -mx-2 px-3 rounded-xl">
                  <span className="text-emerald-900 font-sans font-bold">You Receive (Net Settlement):</span>
                  <span className="text-emerald-700 font-extrabold text-sm font-mono">
                    ${(createdPayment.netSettlementUSD ?? (createdPayment.amountUSD - (createdPayment.platformFeeUSD ?? (createdPayment.amountUSD * ((createdPayment.platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT) / 100))))).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">VERSE Cashback:</span>
                  <span className="text-purple-600 font-bold">+{createdPayment.verseEarned} VERSE</span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Expires At:</span>
                  <span className="text-amber-600 font-bold">{new Date(createdPayment.expiresAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* QR Code */}
              <div>
                <PaymentQRCode
                  url={`${window.location.origin}/pay/${createdPayment.id}`}
                  amountUSD={createdPayment.amountUSD}
                  tokenAmount={createdPayment.tokenAmount}
                  tokenSymbol={createdPayment.selectedToken}
                  merchantAddress={merchantProfile.settlementAddress || '0x8F3a4e9b72cD4562098b584d4D9fB231f6C2A093'}
                  merchantName={merchantProfile.name || 'IrisMe Merchant'}
                  itemDescription={createdPayment.description}
                  networkName={getChainConfig(createdPayment.chainId || 137)?.name || 'Polygon'}
                  verseEarned={createdPayment.verseEarned}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 hover:border-purple-300 text-xs text-slate-700 cursor-pointer font-medium"
                onClick={() => setCreatedPayment(null)}
              >
                ← Create Another Payment
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-purple-600 hover:text-purple-800 font-semibold cursor-pointer"
                onClick={() => navigate('/merchant/payments')}
              >
                View Payments & Invoices →
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Create Payment Form */
        <div data-tour="create-payment-form" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card variant="default">
              <CardHeader
                title="Payment Request Details"
                subtitle="Enter payment amount, crypto asset, target blockchain network, and memo"
              />
              <CardContent className="p-6 sm:p-7 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Field 1: Amount & Currency */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      1. Payment Amount & Currency <span className="text-purple-600">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base font-bold">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.10"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          required
                          autoFocus
                          className="w-full pl-8 pr-4 py-3 rounded-2xl bg-white border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-400/20 font-mono text-xl font-bold text-slate-900 focus:outline-none transition-all shadow-xs"
                        />
                      </div>

                      <div>
                        <select
                          value={fiatCurrency}
                          onChange={(e) => setFiatCurrency(e.target.value as FiatCurrency)}
                          className="w-full py-3 px-3 rounded-2xl bg-white border border-slate-300 focus:border-purple-500 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer h-full shadow-xs"
                        >
                          {FIAT_CURRENCIES.map((f) => (
                            <option key={f.code} value={f.code}>
                              {f.code} ({f.symbol})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Field 2: Supported Payment Asset */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        2. Crypto Payment Asset <span className="text-purple-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsLogoGalleryOpen(true)}
                        className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-500" />
                        <span>All {SUPPORTED_TOKENS.length} Assets</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {SUPPORTED_TOKENS.map((token) => (
                        <button
                          key={token.symbol}
                          type="button"
                          onClick={() => handleSelectToken(token.symbol)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group ${
                            selectedToken === token.symbol
                              ? 'bg-gradient-to-br from-cyan-50 via-purple-50 to-pink-50 border-purple-500 shadow-md shadow-purple-500/10 ring-2 ring-purple-400/20'
                              : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <TokenLogo
                              symbol={token.symbol}
                              size="md"
                              variant={selectedToken === token.symbol ? 'gif' : 'icon'}
                              animated={selectedToken === token.symbol}
                            />
                            <span className="font-bold text-xs text-slate-900">{token.symbol}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate font-medium">{token.name.split(' ')[0]}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field 3: Settlement Blockchain Network */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      <span>3. Settlement Blockchain Network</span> <span className="text-purple-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.values(SUPPORTED_CHAINS).map((chain) => (
                        <button
                          key={chain.id}
                          type="button"
                          onClick={() => setSelectedChainId(chain.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                            selectedChainId === chain.id
                              ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold ring-1 ring-purple-400'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-base">{chain.icon}</span>
                          <div className="truncate">
                            <span className="text-xs block font-bold truncate">{chain.shortName}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Gas: {chain.nativeCurrency.symbol}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field 4: Short Description */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      4. Description / Item to Buy <span className="text-purple-600">*</span>
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Coffee & Pastry, Invoice for Consulting"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-400/20 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors shadow-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Field 5 & 6: Optional Order/Reference ID & Expiration Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Field 5: Optional Order/Reference ID */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        5. Order / Reference ID <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={orderRef}
                          onChange={(e) => setOrderRef(e.target.value)}
                          placeholder="e.g. ORD-9842, Table 4"
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-400/20 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Field 6: Expiration Time */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        6. Expiration Time <span className="text-purple-600">*</span>
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={expirationMinutes}
                          onChange={(e) => setExpirationMinutes(Number(e.target.value))}
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-300 focus:border-purple-500 text-xs text-slate-900 focus:outline-none cursor-pointer shadow-xs font-medium"
                        >
                          {EXPIRATION_OPTIONS.map((opt) => (
                            <option key={opt.minutes} value={opt.minutes}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="iris"
                    size="lg"
                    className="w-full shadow-xl shadow-purple-500/20 cursor-pointer font-bold text-sm py-3.5"
                    disabled={numAmount <= 0}
                  >
                    Generate Payment Request (${numAmount.toFixed(2)})
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Summary Sidebar (1 Col): Live Calculation Preview */}
          <div className="space-y-6">
            <Card variant="default">
              <CardHeader
                title="Checkout Preview"
                subtitle="Instant summary for your customer"
              />
              <CardContent className="p-6 space-y-4">
                {/* 1. Merchant Gross & Net Settlement */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold font-sans">
                    <Receipt className="w-3.5 h-3.5 text-purple-600" />
                    <span>Payment Breakdown</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Invoice Amount:</span>
                    <span className="font-bold text-slate-900 font-mono">${numAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Selected Asset:</span>
                    <span className="font-bold text-purple-700 font-mono">
                      ≈ {calculatedCrypto} {selectedToken}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Target Network:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {currentChain.shortName}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>IrisMe Fee ({liveEconomics.platformFee.platformFeePercent}%):</span>
                    <span className="font-semibold text-slate-600 font-mono">-${liveEconomics.platformFee.platformFeeUSD.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-emerald-700 font-mono">
                    <span>Net Settled to Merchant:</span>
                    <span>${liveEconomics.merchantSettlement.netUSD.toFixed(2)}</span>
                  </div>
                </div>

                {/* 2. Customer Reward */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 via-cyan-50/70 to-pink-50/70 border border-purple-200 space-y-2 text-xs shadow-xs">
                  <div className="flex items-center gap-1.5 text-purple-900 font-bold font-sans">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Customer VERSE Reward</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cashback Rate:</span>
                    <span className="font-bold text-purple-700">{merchantProfile.baseRewardPercent || 1}% VERSE</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Bonus Earned:</span>
                    <span className="font-bold text-purple-700 font-mono">
                      +{liveEconomics.customerReward.rewardAmountVerse.toLocaleString()} VERSE
                    </span>
                  </div>
                </div>

                {/* Receiving Address Indicator */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Self-Custodial Settlement</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    Funds route to: {merchantProfile.settlementAddress || '0x8F3a4e9b72cD4562098b584d4D9fB231f6C2A093'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Currency & Token Logo Modal */}
      <TokenLogoModal
        isOpen={isLogoGalleryOpen}
        onClose={() => setIsLogoGalleryOpen(false)}
        onSelectToken={(sym) => {
          handleSelectToken(sym as SupportedToken);
          setIsLogoGalleryOpen(false);
        }}
      />
    </div>
  );
};
