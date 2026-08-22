import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PaymentQRCode } from '../../components/ui/PaymentQRCode';
import { TokenLogo } from '../../components/ui/TokenLogo';
import { ReceivingAddressesModal } from '../../components/merchant/ReceivingAddressesModal';
import { MerchantRegistrationRequired } from '../../components/merchant/MerchantRegistrationRequired';
import {
  SUPPORTED_PAYMENT_ASSETS,
  AllowedPaymentAsset,
  TokenNetworkConfig,
  getNetworksForAsset,
  findTokenNetworkConfig,
  validateAddressForNetwork,
  generateMultiChainPaymentUri,
  createCanonicalPaymentRequestJson,
} from '../../config/multiChainTokens';
import { PriceService } from '../../services/priceService';
import { EconomicService } from '../../services/economicService';
import { DEFAULT_PLATFORM_FEE_PERCENT } from '../../config/fees';
import { Payment, FiatCurrency, SupportedToken } from '../../types';
import { FIAT_CURRENCIES } from '../../data/mockData';
import {
  Layers,
  Sparkles,
  Receipt,
  Check,
  Copy,
  ExternalLink,
  Clock,
  FileText,
  Hash,
  AlertCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  Wallet,
  Globe,
  Info,
  CheckCircle2,
  Settings,
  Save,
} from 'lucide-react';

const EXPIRATION_OPTIONS = [
  { label: '15 Minutes', minutes: 15 },
  { label: '30 Minutes', minutes: 30 },
  { label: '45 Minutes', minutes: 45 },
  { label: '1 Hour', minutes: 60 },
  { label: '2 Hours', minutes: 120 },
  { label: '24 Hours', minutes: 1440 },
];

export const CreatePayment: React.FC = () => {
  const { navigate } = useRouter();
  const { createPayment, merchantProfile, updateMerchantProfile, getPaymentById } = useApp();

  // Multi-Chain Step 1: Asset Selection (ONLY: USDC, USDT, VERSE, BTC)
  const [selectedAsset, setSelectedAsset] = useState<AllowedPaymentAsset>('USDC');

  // Multi-Chain Step 2: Network Selection for Chosen Asset
  const availableNetworks = getNetworksForAsset(selectedAsset);
  const [selectedNetworkConfigId, setSelectedNetworkConfigId] = useState<string>(
    availableNetworks[0]?.id || 'USDC-Solana'
  );

  // Address Management Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);
  const [savedAddressToast, setSavedAddressToast] = useState<boolean>(false);

  // When asset changes, automatically select the first valid network configuration for that asset
  useEffect(() => {
    const validConfigs = getNetworksForAsset(selectedAsset);
    if (validConfigs.length > 0) {
      // If current selected config is not in valid list, default to first valid config
      const stillValid = validConfigs.find((c) => c.id === selectedNetworkConfigId);
      if (!stillValid) {
        setSelectedNetworkConfigId(validConfigs[0].id);
      }
    }
  }, [selectedAsset]);

  const activeNetworkConfig: TokenNetworkConfig =
    availableNetworks.find((c) => c.id === selectedNetworkConfigId) ||
    availableNetworks[0] ||
    findTokenNetworkConfig('USDC', 'Solana')!;

  // Amount & Options
  const [amount, setAmount] = useState<string>('50.00');
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>(
    merchantProfile.defaultFiatCurrency || 'USD'
  );
  const [customSettlementAddress, setCustomSettlementAddress] = useState<string>('');
  const [description, setDescription] = useState<string>('Order checkout');
  const [orderRef, setOrderRef] = useState<string>('');
  const [expirationMinutes, setExpirationMinutes] = useState<number>(45);

  const [createdPayment, setCreatedPayment] = useState<Payment | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Live prices
  const [liveVersePrice, setLiveVersePrice] = useState<number>(() => PriceService.getPrice('VERSE') || 0.0000176);
  const [liveBtcPrice, setLiveBtcPrice] = useState<number>(() => PriceService.getPrice('BTC') || 96450.0);

  useEffect(() => {
    const fetchPrices = async () => {
      const v = await PriceService.getVersePrice();
      if (v > 0) setLiveVersePrice(v);
      const b = PriceService.getPrice('BTC');
      if (b && b > 0) setLiveBtcPrice(b);
    };
    fetchPrices();
  }, []);

  const numAmount = parseFloat(amount) || 0;

  // Exact token amount calculation for the selected asset
  const calculatedTokenAmount = (() => {
    if (numAmount <= 0) return 0;
    if (selectedAsset === 'USDC' || selectedAsset === 'USDT') {
      return Number(numAmount.toFixed(2));
    }
    if (selectedAsset === 'VERSE') {
      return Math.round(numAmount / (liveVersePrice || 0.0000176));
    }
    if (selectedAsset === 'BTC') {
      return Number((numAmount / (liveBtcPrice || 96450.0)).toFixed(8));
    }
    return Number(numAmount.toFixed(2));
  })();

  // Merchant Settlement Wallet Address for selected network
  // Store & read network-specific receiving addresses from merchant profile
  const storedNetworkAddress =
    merchantProfile.merchantReceivingAddresses?.[activeNetworkConfig.network] ||
    (activeNetworkConfig.networkType === 'EVM' && merchantProfile.settlementAddress?.startsWith('0x')
      ? merchantProfile.settlementAddress
      : '');

  const effectiveRecipientAddress =
    customSettlementAddress.trim() ||
    storedNetworkAddress ||
    '';

  const isRegistered = Boolean(
    merchantProfile.id &&
    merchantProfile.name &&
    merchantProfile.settlementAddress
  );

  // Live Address Validation
  const addressValidation = validateAddressForNetwork(
    effectiveRecipientAddress,
    activeNetworkConfig.network
  );

  // Save current address as default for the selected network
  const handleSaveAddressForNetwork = async () => {
    if (!addressValidation.isValid) return;
    const currentAddrs = merchantProfile.merchantReceivingAddresses || {};
    const updated = {
      ...currentAddrs,
      [activeNetworkConfig.network]: effectiveRecipientAddress,
    };
    await updateMerchantProfile({
      merchantReceivingAddresses: updated,
      ...(activeNetworkConfig.networkType === 'EVM' ? { settlementAddress: effectiveRecipientAddress } : {}),
    });
    setSavedAddressToast(true);
    setTimeout(() => setSavedAddressToast(false), 2500);
  };

  // Economic Breakdown
  const liveEconomics = EconomicService.getPaymentEconomics({
    amountUSD: numAmount,
    tokenAmount: calculatedTokenAmount,
    tokenSymbol: selectedAsset,
    chainId: activeNetworkConfig.chainId || 137,
    settlementAddress: effectiveRecipientAddress,
    merchantType: merchantProfile.merchantType || 'irisme_merchant',
    cashbackPercent: merchantProfile.baseRewardPercent || 1.0,
    versePriceUSD: liveVersePrice,
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

    if (!addressValidation.isValid) {
      alert(`Invalid settlement address: ${addressValidation.error}`);
      return;
    }

    const newPayment = createPayment({
      amountUSD: numAmount,
      tokenAmount: calculatedTokenAmount,
      fiatCurrency,
      selectedToken: selectedAsset as SupportedToken,
      chainId: activeNetworkConfig.chainId || (activeNetworkConfig.networkType === 'EVM' ? 137 : undefined),
      network: activeNetworkConfig.network,
      networkId: activeNetworkConfig.networkId,
      merchantAddress: effectiveRecipientAddress,
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

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  if (!isRegistered) {
    return <MerchantRegistrationRequired title="Register Business to Create Payment Requests" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Create Payment Request</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-purple-200 text-purple-700 font-extrabold">
              Multi-Chain Rail
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Configure asset, choose supported network, generate verifiable multi-chain payment invoice & QR code.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 hover:border-purple-300 text-xs text-slate-700 cursor-pointer shadow-xs font-semibold"
            onClick={() => setIsAddressModalOpen(true)}
            leftIcon={<Wallet className="w-3.5 h-3.5 text-purple-600" />}
          >
            Receiving Wallets
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 hover:border-purple-300 text-xs text-slate-700 cursor-pointer shadow-xs font-semibold"
            onClick={() => navigate('/merchant/payments')}
          >
            View Payments & Invoices
          </Button>
        </div>
      </div>

      {/* When Payment Has Been Generated: Display Full Multi-Chain Invoice & QR Code */}
      {createdPayment ? (
        <div data-tour="generated-qr-channel" className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Multi-Chain Invoice Ready</h3>
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

            {/* Direct Multi-Chain Rail Guarantee Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-cyan-50 to-emerald-50 border border-purple-200/80 shadow-xs">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-900">
                    Direct Multi-Chain Rail Execution (No Conversion)
                  </p>
                  <p className="text-slate-600">
                    Merchant requested <span className="font-bold text-slate-900">{createdPayment.tokenAmount} {createdPayment.selectedToken}</span> on{' '}
                    <span className="font-bold text-purple-700">{createdPayment.networkName}</span>. Customer pays {createdPayment.tokenAmount} {createdPayment.selectedToken} on {createdPayment.networkName}, and merchant receives the exact same asset directly on {createdPayment.networkName}.
                  </p>
                </div>
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

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Requested Asset:</span>
                  <span className="text-slate-900 font-bold font-sans flex items-center gap-1.5">
                    <TokenLogo symbol={createdPayment.selectedToken} size="xs" />
                    <span>{createdPayment.selectedToken}</span>
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Settlement Network:</span>
                  <span className="text-purple-700 font-bold font-sans px-2 py-0.5 rounded-md bg-purple-100 text-[11px]">
                    {createdPayment.networkName || 'Polygon'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Amount Due:</span>
                  <span className="text-slate-900 font-bold">
                    ${createdPayment.amountUSD.toFixed(2)} ({createdPayment.tokenAmount} {createdPayment.selectedToken})
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Recipient Address:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-800 font-mono text-[11px] truncate max-w-[170px]" title={createdPayment.merchantAddress}>
                      {createdPayment.merchantAddress}
                    </span>
                    <button onClick={() => handleCopyAddress(createdPayment.merchantAddress || '')} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                      {copiedAddress ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">iRisme Platform Fee ({createdPayment.platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT}%):</span>
                  <span className="text-slate-600 font-bold font-mono">
                    -${(createdPayment.platformFeeUSD ?? (createdPayment.amountUSD * ((createdPayment.platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT) / 100))).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-200 bg-emerald-50/80 -mx-2 px-3 rounded-xl">
                  <span className="text-emerald-900 font-sans font-bold">Merchant Receives (Net):</span>
                  <span className="text-emerald-700 font-extrabold text-sm font-mono">
                    {(createdPayment.netSettlementTokenAmount ?? createdPayment.tokenAmount).toFixed(selectedAsset === 'BTC' ? 6 : 2)} {createdPayment.selectedToken} (${(createdPayment.netSettlementUSD ?? createdPayment.amountUSD).toFixed(2)})
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
                  canonicalJson={createCanonicalPaymentRequestJson({
                    paymentId: createdPayment.id,
                    merchantName: createdPayment.merchantName || merchantProfile.name || 'IRISME Merchant',
                    merchantReceivingAddress: createdPayment.merchantAddress || effectiveRecipientAddress,
                    asset: createdPayment.selectedToken as AllowedPaymentAsset,
                    network: createdPayment.networkName || 'Polygon',
                    amount: createdPayment.tokenAmount,
                    decimals: activeNetworkConfig.decimals,
                    expiry: createdPayment.expiresAt,
                    orderRef: createdPayment.orderRef,
                    description: createdPayment.description,
                    metadata: {
                      fiatAmount: createdPayment.amountUSD,
                      fiatCurrency: createdPayment.fiatCurrency,
                      verseCashbackEarned: createdPayment.verseEarned,
                      platformFeePercent: createdPayment.platformFeePercent,
                    },
                  })}
                  paymentUri={generateMultiChainPaymentUri({
                    assetSymbol: createdPayment.selectedToken as AllowedPaymentAsset,
                    network: createdPayment.networkName || 'Polygon',
                    chainId: createdPayment.chainId,
                    recipientAddress: createdPayment.merchantAddress || '',
                    tokenAmount: createdPayment.tokenAmount,
                    paymentId: createdPayment.id,
                    merchantName: createdPayment.merchantName,
                  })}
                  amountUSD={createdPayment.amountUSD}
                  tokenAmount={createdPayment.tokenAmount}
                  tokenSymbol={createdPayment.selectedToken}
                  merchantAddress={createdPayment.merchantAddress || ''}
                  merchantName={createdPayment.merchantName}
                  itemDescription={createdPayment.description}
                  networkName={createdPayment.networkName || 'Polygon'}
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
                title="Multi-Chain Payment Configuration"
                subtitle="Select crypto asset, choose supported network, and enter payment amount."
              />
              <CardContent className="p-6 sm:p-7 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* ASSET Dropdown & Selector */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                        <span>Asset</span>
                        <span className="text-purple-600">*</span>
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Supported: USDC, USDT, VERSE, BTC
                      </span>
                    </div>

                    {/* Asset Select Dropdown */}
                    <div className="relative">
                      <select
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value as AllowedPaymentAsset)}
                        className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-400/20 text-sm font-extrabold text-slate-900 focus:outline-none cursor-pointer shadow-xs"
                      >
                        {SUPPORTED_PAYMENT_ASSETS.map((symbol) => (
                          <option key={symbol} value={symbol}>
                            {symbol} — {symbol === 'USDC' ? 'USD Coin' : symbol === 'USDT' ? 'Tether USD' : symbol === 'VERSE' ? 'Verse Token' : 'Bitcoin'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quick Asset Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {SUPPORTED_PAYMENT_ASSETS.map((symbol) => {
                        const isSelected = selectedAsset === symbol;
                        const assetConfigs = getNetworksForAsset(symbol);
                        return (
                          <button
                            key={symbol}
                            type="button"
                            onClick={() => setSelectedAsset(symbol)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group relative overflow-hidden ${
                              isSelected
                                ? 'bg-gradient-to-br from-cyan-50 via-purple-50 to-pink-50 border-purple-500 shadow-md shadow-purple-500/10 ring-2 ring-purple-400/30'
                                : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50/80 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <TokenLogo
                                symbol={symbol}
                                size="sm"
                                variant={isSelected ? 'gif' : 'icon'}
                                animated={isSelected}
                              />
                              <span className="font-extrabold text-xs text-slate-900">{symbol}</span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-700 truncate">
                              {symbol === 'USDC' ? 'USD Coin' : symbol === 'USDT' ? 'Tether USD' : symbol === 'VERSE' ? 'Verse Token' : 'Bitcoin'}
                            </p>
                            <p className="text-[10px] text-purple-600 font-semibold mt-0.5">
                              {assetConfigs.length} {assetConfigs.length === 1 ? 'Network' : 'Networks'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* NETWORK Dropdown & Selector (Dynamically Filtered Based On Asset) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                        <span>Network</span>
                        <span className="text-purple-600">*</span>
                      </label>
                      <span className="text-[11px] text-purple-700 font-semibold">
                        {availableNetworks.length} Available for {selectedAsset}
                      </span>
                    </div>

                    {/* Network Dropdown Select */}
                    <div className="relative">
                      <select
                        value={selectedNetworkConfigId}
                        onChange={(e) => setSelectedNetworkConfigId(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-400/20 text-sm font-bold text-slate-900 focus:outline-none cursor-pointer shadow-xs font-sans"
                      >
                        {availableNetworks.map((netConfig) => (
                          <option key={netConfig.id} value={netConfig.id}>
                            {netConfig.network} ({netConfig.networkType === 'BITCOIN' ? 'Native Layer 1 UTXO' : netConfig.addressFormat.split(' ')[0]})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Network Quick Selection Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      {availableNetworks.map((netConfig) => {
                        const isNetSelected = selectedNetworkConfigId === netConfig.id;
                        return (
                          <button
                            key={netConfig.id}
                            type="button"
                            onClick={() => setSelectedNetworkConfigId(netConfig.id)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                              isNetSelected
                                ? 'bg-purple-50/90 border-purple-500 shadow-md ring-2 ring-purple-400/30'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                                  <Globe className="w-3.5 h-3.5 text-purple-600" />
                                  <span>{netConfig.network}</span>
                                </span>
                                {isNetSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono truncate">
                                {netConfig.isNative ? 'Native Layer 1 UTXO' : `Contract: ${netConfig.contractAddress.slice(0, 6)}...${netConfig.contractAddress.slice(-4)}`}
                              </p>
                              <p className="text-[10px] text-slate-600 mt-1">
                                <span className="font-semibold text-slate-700">Format:</span> {netConfig.addressFormat.split(' ')[0]} | <span className="font-semibold text-slate-700">Decimals:</span> {netConfig.decimals}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* AMOUNT */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                      <span>Amount</span>
                      <span className="text-purple-600">*</span>
                    </label>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base font-bold">
                          $
                        </span>
                        <input
                          type="number"
                          step={selectedAsset === 'BTC' ? '0.01' : '0.01'}
                          min="0.10"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          required
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

                    {/* Real-Time Crypto Conversion Display */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Requested Crypto Amount:</span>
                      <span className="font-extrabold text-slate-900 font-mono text-sm flex items-center gap-1.5">
                        <TokenLogo symbol={selectedAsset} size="xs" />
                        <span>{calculatedTokenAmount} {selectedAsset}</span>
                      </span>
                    </div>
                  </div>

                  {/* RECEIVING ADDRESS (Automatically Displayed For Selected Network) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
                        <span>Receiving Address</span>
                        <span className="text-purple-600">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddressModalOpen(true)}
                          className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Settings className="w-3 h-3" />
                          <span>Manage All Addresses</span>
                        </button>
                      </div>
                    </div>

                    {/* Auto Detected Network Badge */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50/70 border border-purple-100 text-xs">
                      <span className="text-purple-900 font-medium flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-purple-600" />
                        <span>Network Rail: <strong className="text-purple-950">{activeNetworkConfig.network}</strong></span>
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-800 font-bold">
                        {activeNetworkConfig.addressFormat}
                      </span>
                    </div>

                    <div className="relative">
                      <Wallet className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={customSettlementAddress || effectiveRecipientAddress}
                        onChange={(e) => setCustomSettlementAddress(e.target.value)}
                        placeholder={activeNetworkConfig.addressPlaceholder}
                        required
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border font-mono text-xs focus:outline-none transition-colors shadow-xs ${
                          addressValidation.isValid
                            ? 'border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-400/20 text-slate-900'
                            : 'border-red-400 focus:border-red-500 text-red-900 bg-red-50/30'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        {customSettlementAddress.trim() && customSettlementAddress.trim() !== storedNetworkAddress && (
                          <button
                            type="button"
                            onClick={handleSaveAddressForNetwork}
                            disabled={!addressValidation.isValid}
                            className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer bg-purple-100 px-2 py-0.5 rounded-lg"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save as default for {activeNetworkConfig.network}</span>
                          </button>
                        )}
                        {savedAddressToast && (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Saved!
                          </span>
                        )}
                      </div>
                      {!addressValidation.isValid && (
                        <span className="text-red-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {addressValidation.error}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* REFERENCE [optional] */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Reference <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orderRef}
                        onChange={(e) => setOrderRef(e.target.value)}
                        placeholder="e.g. ORD-9842, Table 4"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-300 focus:border-purple-500 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none shadow-xs"
                      />
                    </div>
                  </div>

                  {/* DESCRIPTION [optional] */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Premium Coffee & Pastry, Invoice #1042"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-400/20 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors shadow-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Expiration Time */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Expiration Time <span className="text-purple-600">*</span>
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

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="iris"
                    size="lg"
                    className="w-full py-4 text-sm font-extrabold shadow-lg shadow-purple-500/25 cursor-pointer"
                    leftIcon={<Zap className="w-4 h-4" />}
                  >
                    Generate Multi-Chain Payment Request & QR Code
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Summary Sidebar (1 Col) */}
          <div className="space-y-6">
            {/* Live Multi-Chain Rail Route Preview */}
            <Card variant="default">
              <CardHeader
                title="Multi-Chain Payment Rail"
                subtitle="Verifiable cross-network payment specifications"
              />
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-purple-100">
                    <span className="text-slate-500">Asset & Network:</span>
                    <span className="font-extrabold text-purple-900 font-sans">
                      {selectedAsset} on {activeNetworkConfig.network}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-purple-100">
                    <span className="text-slate-500">Merchant Request:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      ${numAmount.toFixed(2)} ({calculatedTokenAmount} {selectedAsset})
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-purple-100">
                    <span className="text-slate-500">Customer Pays:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {calculatedTokenAmount} {selectedAsset} on {activeNetworkConfig.network}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-purple-100">
                    <span className="text-slate-500">Merchant Receives:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {calculatedTokenAmount} {selectedAsset} on {activeNetworkConfig.network}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-purple-100">
                    <span className="text-slate-500">iRisme Platform Fee ({DEFAULT_PLATFORM_FEE_PERCENT}%):</span>
                    <span className="font-bold text-slate-600 font-mono">
                      -${liveEconomics.platformFee.platformFeeUSD.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-purple-100">
                    <span className="text-slate-500">Customer VERSE Cashback:</span>
                    <span className="font-bold text-purple-600 font-mono">
                      +{liveEconomics.customerReward.rewardAmountVerse} VERSE
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-purple-100">
                    <span className="text-slate-500">Compatible Wallets:</span>
                    <span className="font-semibold text-slate-700 text-right truncate max-w-[150px]">
                      {activeNetworkConfig.walletCompatibility.slice(0, 3).join(', ')}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Block Explorer:</span>
                    <a
                      href={activeNetworkConfig.explorer.baseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    >
                      <span>{activeNetworkConfig.explorer.name}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200 text-[11px] text-purple-900 leading-relaxed">
                  <span className="font-bold">Pure Multi-Chain Rule:</span> The merchant receives the exact token requested ({selectedAsset}) on the specified network ({activeNetworkConfig.network}) with zero forced conversions.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Manage Multi-Chain Receiving Addresses Modal */}
      <ReceivingAddressesModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        highlightNetwork={activeNetworkConfig.network}
      />
    </div>
  );
};
