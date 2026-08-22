import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import {
  SupportedToken,
  PaymentEngineState,
  BlockchainVerificationReport,
  GasEstimationResult,
} from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TokenLogo } from '../../components/ui/TokenLogo';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PaymentQRCode } from '../../components/ui/PaymentQRCode';
import { getChainConfig, SUPPORTED_CHAINS, DEFAULT_CHAIN_ID } from '../../config/chains';
import { TOKEN_CONFIGS, VERSE_TOKEN_ADDRESSES } from '../../config/tokens';
import { SUPPORTED_TOKENS } from '../../data/mockData';
import { GasEstimationService } from '../../services/gasEstimationService';
import { PriceService } from '../../services/priceService';
import { VersePaymentService, VersePaymentExecutionResult } from '../../services/versePaymentService';
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  QrCode,
  Receipt,
  Copy,
  Check,
  ShieldCheck,
  Coins,
  Clock,
  Zap,
  ArrowRight,
  Sparkles,
  Layers,
  Fuel,
  Info,
} from 'lucide-react';

export const CustomerPaymentPage: React.FC = () => {
  const { params, navigate } = useRouter();
  const {
    payments,
    getPaymentById,
    merchantProfile,
    setIsWalletModalOpen,
  } = useApp();

  const {
    isConnected,
    address,
    chainId: walletChainId,
    currentChain: walletCurrentChain,
    balances,
    switchTargetNetwork,
  } = useWeb3();

  const paymentId = params.paymentId || (payments.length > 0 ? payments[0].id : '');
  const payment = getPaymentById(paymentId) || (payments.length > 0 ? payments[0] : null);

  // Selected token state: defaults to VERSE or payment token
  const [selectedToken, setSelectedToken] = useState<SupportedToken>(() => {
    return (payment?.selectedToken as SupportedToken) || 'VERSE';
  });

  // VERSE on Polygon Mainnet is chain 137
  const selectedChainId = selectedToken === 'VERSE' ? 137 : payment?.chainId || DEFAULT_CHAIN_ID;
  const targetChain = getChainConfig(selectedChainId) || SUPPORTED_CHAINS[137];

  // Live VERSE Market Price
  const [liveVersePrice, setLiveVersePrice] = useState<number>(() => PriceService.getPrice('VERSE') || 0.0000176);

  useEffect(() => {
    const fetchVerse = async () => {
      const p = await PriceService.getVersePrice();
      if (p > 0) setLiveVersePrice(p);
    };
    fetchVerse();
    const interval = setInterval(fetchVerse, 15000);
    return () => clearInterval(interval);
  }, []);

  // Engine Lifecycle State
  const [engineState, setEngineState] = useState<PaymentEngineState>(() => {
    if (!payment) return 'Ready';
    if (
      payment.status === 'confirmed' ||
      payment.status === 'completed' ||
      payment.status === 'paid' ||
      payment.status === 'refunded'
    ) {
      return 'Confirmed';
    }
    if (payment.status === 'failed') return 'Failed';
    return 'Ready';
  });

  const [paymentStepMessage, setPaymentStepMessage] = useState<string>('');
  const [txHash, setTxHash] = useState<string>(payment?.txHash || '');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [copiedTx, setCopiedTx] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'wallet'>('qr');

  // Dynamic Gas Estimation State
  const [gasEstimate, setGasEstimate] = useState<GasEstimationResult>(() => {
    return GasEstimationService.getStaticEstimate(selectedChainId, selectedToken);
  });

  // Expiration countdown
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Expiration timer
  useEffect(() => {
    if (!payment?.expiresAt) return;
    const updateTimer = () => {
      const diff = new Date(payment.expiresAt).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeftStr('Expired');
        setIsExpired(true);
      } else {
        const mins = Math.floor(diff / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeftStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [payment?.expiresAt]);

  // Mock preview balances when disconnected
  const MOCK_DISCONNECTED_BALANCES: Record<string, number> = {
    VERSE: 50000,
    USDT: 2450.0,
    USDC: 1850.0,
    ETH: 1.25,
    POL: 450.0,
    BTC: 0.085,
    SOL: 12.5,
    BNB: 3.2,
    WBTC: 0.085,
    AVAX: 24.0,
    DAI: 1200.0,
    MATIC: 450.0,
    TRX: 4200.0,
  };

  const [showAllCoinsModal, setShowAllCoinsModal] = useState<boolean>(false);

  // Helper to obtain token rate
  const getTokenRate = useCallback((token: SupportedToken): number => {
    if (token === 'VERSE') return liveVersePrice > 0 ? liveVersePrice : 0.0000176;
    const cfg = TOKEN_CONFIGS[token];
    if (cfg && cfg.rateToUSD > 0) return cfg.rateToUSD;
    const mockToken = SUPPORTED_TOKENS.find((t) => t.symbol === token);
    return mockToken?.rateToUSD || 1.0;
  }, [liveVersePrice]);

  // Token amount calculation for any selected crypto coin
  const calculatedTokenAmount = useMemo(() => {
    if (!payment) return 0;
    if (selectedToken === 'VERSE') {
      if (payment.selectedToken === 'VERSE' && payment.tokenAmount) {
        return payment.tokenAmount;
      }
      const p = liveVersePrice > 0 ? liveVersePrice : 0.0000176;
      return Math.round(payment.amountUSD / p);
    }
    const rate = getTokenRate(selectedToken);
    if (rate <= 0) return payment.amountUSD;
    const raw = payment.amountUSD / rate;
    if (raw >= 100) return Math.round(raw);
    if (raw >= 1) return Number(raw.toFixed(4));
    return Number(raw.toFixed(6));
  }, [payment, selectedToken, liveVersePrice, getTokenRate]);

  // Mock balance preview
  const previewBalance = isConnected
    ? balances[selectedToken] ?? 0
    : MOCK_DISCONNECTED_BALANCES[selectedToken] ?? 1000;

  // Merchant Settlement Address from existing config
  const merchantSettlementAddress = useMemo(() => {
    return (
      merchantProfile.settlementAddress ||
      payment?.merchantAddress ||
      '0x71C...89A'
    );
  }, [merchantProfile.settlementAddress, payment?.merchantAddress]);

  // VERSE Rewards live computation
  const effectiveCashbackPercent = payment?.cashbackPercent ?? merchantProfile.baseRewardPercent ?? 1.0;
  const calculatedVerseReward =
    payment?.verseEarned ||
    (payment
      ? Math.round(
          (payment.amountUSD * (effectiveCashbackPercent / 100)) /
            (liveVersePrice > 0 ? liveVersePrice : 0.0000176)
        )
      : 0);
  const calculatedRewardUSDValue = (
    calculatedVerseReward * (liveVersePrice > 0 ? liveVersePrice : 0.0000176)
  ).toFixed(4);

  // Network verification
  const isPolygonNetwork = walletChainId === 137;

  // Compute balances
  const userTokenBalance = balances[selectedToken] ?? 0;
  const hasSufficientTokenBalance = userTokenBalance >= calculatedTokenAmount;

  // Dynamic Gas Estimation Routine
  const runGasEstimation = useCallback(async () => {
    try {
      const result = await GasEstimationService.estimateGas({
        chainId: selectedChainId,
        tokenSymbol: selectedToken,
        fromAddress: address || undefined,
        toAddress: merchantSettlementAddress,
      });
      setGasEstimate(result);
    } catch {
      setGasEstimate(GasEstimationService.getStaticEstimate(selectedChainId, selectedToken));
    }
  }, [selectedChainId, selectedToken, address, merchantSettlementAddress]);

  useEffect(() => {
    runGasEstimation();
  }, [runGasEstimation]);

  // Copy helper
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyTx = (tx: string) => {
    navigator.clipboard.writeText(tx);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  // Switch network handler
  const handleSwitchNetwork = async () => {
    try {
      await switchTargetNetwork(137);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not switch network.');
    }
  };

  // Execute Non-Custodial VERSE Payment on Polygon
  const handleExecutePayment = async () => {
    if (!payment) return;
    setErrorMessage('');

    try {
      if (!isPolygonNetwork) {
        await switchTargetNetwork(137);
      }

      setEngineState('Preparing transaction');
      setPaymentStepMessage('Initiating VERSE payment on Polygon...');

      const result = await VersePaymentService.executePayment({
        merchantAddress: merchantSettlementAddress,
        verseAmount: calculatedTokenAmount,
        onStepUpdate: (update) => {
          setPaymentStepMessage(update.message);
          if (update.step === 'awaiting_payment') {
            setEngineState('Awaiting wallet confirmation');
          } else if (update.step === 'submitting') {
            setEngineState('Transaction submitted');
            if (update.txHash) setTxHash(update.txHash);
          } else if (update.step === 'confirming') {
            setEngineState('Confirming');
            if (update.txHash) setTxHash(update.txHash);
          } else if (update.step === 'confirmed') {
            setEngineState('Confirmed');
            if (update.txHash) setTxHash(update.txHash);
          }
        },
      });

      if (result.success) {
        setTxHash(result.txHash);
        setEngineState('Confirmed');
      }
    } catch (err: any) {
      if (VersePaymentService.isUserRejection(err)) {
        setEngineState('Rejected');
        setErrorMessage('You rejected the transaction in your wallet.');
      } else {
        setEngineState('Failed');
        setErrorMessage(err?.message || 'Payment execution failed.');
      }
    }
  };

  const polygonScanTxUrl = txHash ? `https://polygonscan.com/tx/${txHash}` : '';

  if (!payment) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4 text-center animate-fadeIn">
        <Card className="p-8 space-y-4 border-slate-200 shadow-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Payment Invoice Not Found</h2>
          <p className="text-sm text-slate-600">The requested payment invoice could not be located or has expired.</p>
          <Button variant="iris" onClick={() => navigate('/merchant/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6 pb-16 animate-fadeIn">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/merchant/dashboard')}
            className="text-xs cursor-pointer text-slate-700 bg-white border border-slate-200 shadow-xs hover:bg-slate-50"
          >
            ← Merchant Portal
          </Button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Invoice ID:</span>
            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
              {payment.id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Expiration Pill */}
          <div className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>Expires:</span>
            <strong className={isExpired ? 'text-rose-600 font-bold' : 'text-amber-700 font-bold'}>
              {timeLeftStr || '45m 00s'}
            </strong>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyLink}
            className="text-xs text-slate-700 bg-white border border-slate-200 shadow-xs hover:bg-slate-50 cursor-pointer"
            leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copiedLink ? 'Link Copied' : 'Share Invoice'}
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OPTION 1: SPLIT POS CHECKOUT LAYOUT (OPTION A VIBRANT IRIS GLASS THEME) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: SCAN STATION & QR MATRIX (5 COLS) */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 space-y-5 border-slate-200 shadow-lg bg-white/95 backdrop-blur-md relative overflow-hidden">
            {/* Top Iridescent Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#00D2FE] via-[#7928CA] to-[#FF0080] absolute top-0 left-0 right-0" />

            {/* Merchant Identity & Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00D2FE] via-[#7928CA] to-[#FF0080] text-white flex items-center justify-center font-black text-base shadow-md flex-shrink-0">
                  {payment.merchantName ? payment.merchantName.slice(0, 2).toUpperCase() : 'IM'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">
                      {payment.merchantName || merchantProfile.name || 'IRISME Store'}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    POS Terminal #01
                  </p>
                </div>
              </div>

              <StatusBadge
                status={
                  engineState === 'Confirmed'
                    ? 'paid'
                    : engineState === 'Transaction submitted' ||
                      engineState === 'Confirming'
                    ? 'processing'
                    : engineState === 'Failed'
                    ? 'failed'
                    : isExpired
                    ? 'expired'
                    : 'awaiting_payment'
                }
                size="sm"
                pulse={engineState === 'Confirming'}
              />
            </div>

            {/* Interactive QR Display Station */}
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#7928CA]" />
                  <span>Scan to Pay Station</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  Scan using Phantom, MetaMask, Coinbase Wallet, or any mobile Web3 wallet
                </p>
              </div>

              {/* QR Matrix Wrapper */}
              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-inner flex flex-col items-center justify-center relative">
                <PaymentQRCode
                  url={window.location.href}
                  amountUSD={payment.amountUSD}
                  tokenAmount={calculatedTokenAmount}
                  tokenSymbol={selectedToken}
                  merchantAddress={merchantSettlementAddress}
                  merchantName={payment.merchantName || merchantProfile.name || 'IRISME Merchant'}
                  itemDescription={payment.description}
                  networkName={selectedToken === 'SOL' ? 'Solana Mainnet' : targetChain.name}
                  verseEarned={calculatedVerseReward}
                />
              </div>

              {/* Merchant Settlement Address Copy Field */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                  <span>Merchant Settlement Destination:</span>
                  <span className="text-purple-700 font-bold">
                    {selectedToken === 'SOL' ? 'Solana Mainnet' : 'Polygon Mainnet (137)'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-slate-800 text-xs font-bold truncate">
                    {merchantSettlementAddress}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyAddress(merchantSettlementAddress)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer flex-shrink-0 flex items-center gap-1 text-[11px] font-medium shadow-2xs"
                  >
                    {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Instant Gas & Finality Specs */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-xl bg-cyan-50/60 border border-cyan-200/70 space-y-0.5">
                  <span className="text-cyan-800 text-[10px] font-bold block uppercase flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-cyan-600" />
                    Estimated Gas
                  </span>
                  <span className="font-bold text-slate-900">
                    {gasEstimate.formattedGas || '< $0.01'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-200/70 space-y-0.5">
                  <span className="text-purple-800 text-[10px] font-bold block uppercase flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#7928CA]" />
                    Finality Speed
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedToken === 'SOL' ? '~400ms' : '~2.1s (Polygon)'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Non-Custodial Assurance Badge */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">Direct Peer-to-Merchant Settlement</span>
              <p className="text-[11px] text-slate-500">
                Non-custodial transfer directly to merchant on-chain. No third-party intermediary.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: ORDER SUMMARY, TOKEN SELECTOR & ACTION (7 COLS) */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 sm:p-7 space-y-5 border-slate-200 shadow-lg bg-white/95 backdrop-blur-md relative overflow-hidden">
            {/* Top Right Subtle Ambient Glow */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-gradient-to-br from-[#00D2FE]/20 via-[#7928CA]/15 to-[#FF0080]/20 rounded-full blur-3xl pointer-events-none" />

            {/* Total Amount Due Banner */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 via-purple-50/40 to-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Checkout Amount
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-purple-700 shadow-2xs">
                  {selectedToken === 'SOL'
                    ? 'Solana Mainnet'
                    : selectedToken === 'VERSE'
                    ? 'Polygon Mainnet'
                    : targetChain.name}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="space-y-0.5">
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                    ${payment.amountUSD.toFixed(2)}
                    <span className="text-sm font-bold text-slate-500 ml-1.5">USD</span>
                  </div>
                  <div className="text-sm text-purple-700 font-mono font-bold flex items-center gap-1.5">
                    <span>≈ {calculatedTokenAmount.toLocaleString()} {selectedToken}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      (@ 1 {selectedToken} = ${getTokenRate(selectedToken).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })})
                    </span>
                  </div>
                </div>

                <TokenLogo
                  symbol={selectedToken}
                  size="lg"
                  variant="gif"
                  animated={true}
                />
              </div>

              {/* Short Payment Description */}
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Order Reference:</span>
                <span className="font-semibold text-slate-900">
                  {payment.description || 'IRISME Crypto Purchase'}
                </span>
              </div>
            </div>

            {/* Cryptocurrency Selector Chips Matrix */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#7928CA]" />
                  <span>Choose Payment Crypto Coin:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllCoinsModal(true)}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-xl border border-purple-200 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Coins ({SUPPORTED_TOKENS.length})</span>
                </button>
              </div>

              {/* Quick Select Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['VERSE', 'USDT', 'USDC', 'SOL', 'ETH', 'BTC', 'POL', 'BNB'] as SupportedToken[]).map((tok) => {
                  const isSel = selectedToken === tok;
                  const mockBal = previewBalance !== undefined && isSel ? previewBalance : (MOCK_DISCONNECTED_BALANCES[tok] ?? 0);
                  const displayLabel = tok === 'SOL' ? 'SOL (Solana)' : tok === 'VERSE' ? 'VERSE (Polygon)' : tok;

                  return (
                    <button
                      key={tok}
                      type="button"
                      onClick={() => setSelectedToken(tok)}
                      className={`p-2.5 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between gap-1 relative overflow-hidden ${
                        isSel
                          ? 'bg-gradient-to-br from-purple-50 via-white to-pink-50 border-purple-500 shadow-md ring-2 ring-purple-400/30'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <TokenLogo symbol={tok} size="sm" />
                        {isSel && (
                          <span className="w-2 h-2 rounded-full bg-[#FF0080]" />
                        )}
                      </div>
                      <div>
                        <span className={`text-xs font-bold block ${isSel ? 'text-purple-900' : 'text-slate-900'}`}>
                          {tok}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block truncate">
                          {isConnected ? 'Bal: ' : 'Sim: '}{mockBal.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* VERSE Loyalty & Cashback Incentive Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-50/80 via-purple-50/80 to-pink-50/80 border border-purple-200/90 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#00D2FE] to-[#FF0080] text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-purple-950 block">Customer VERSE Cashback</span>
                    <span className="text-[10px] text-slate-600">
                      Earn on every completed on-chain checkout
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black font-mono text-[#7928CA] block">
                    +{calculatedVerseReward.toLocaleString()} VERSE
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ≈ ${calculatedRewardUSDValue} USD ({effectiveCashbackPercent}% Rate)
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* ACTION CONTROLS & STATE ENGINE */}
            {/* ============================================================ */}
            <div className="space-y-3 pt-2">
              {/* Not Connected: Connect Wallet CTA */}
              {!isConnected && engineState !== 'Confirmed' && (
                <div className="space-y-2.5">
                  <Button
                    variant="iris"
                    size="lg"
                    className="w-full text-base font-bold shadow-xl shadow-purple-500/25 cursor-pointer py-4 rounded-2xl"
                    onClick={() => setIsWalletModalOpen(true)}
                    leftIcon={<Wallet className="w-5 h-5" />}
                  >
                    Connect Wallet to Settle (${payment.amountUSD.toFixed(2)})
                  </Button>
                  <p className="text-[11px] text-center text-slate-500">
                    Supports MetaMask, Trust Wallet, Coinbase Wallet, Phantom, and WalletConnect.
                  </p>
                </div>
              )}

              {/* Connected: Wrong Network Alert */}
              {isConnected && !isPolygonNetwork && selectedToken === 'VERSE' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs text-amber-900 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Please switch to Polygon</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Your wallet is connected to {walletCurrentChain?.name || `Chain ${walletChainId}`}. VERSE settlement requires <strong>Polygon Mainnet (Chain ID 137)</strong>.
                  </p>
                  <Button
                    variant="iris"
                    size="sm"
                    className="w-full cursor-pointer font-bold text-xs"
                    onClick={handleSwitchNetwork}
                  >
                    Switch Network to Polygon (137)
                  </Button>
                </div>
              )}

              {/* Connected: Insufficient Balance Alert */}
              {isConnected && isPolygonNetwork && !hasSufficientTokenBalance && selectedToken === 'VERSE' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1 text-xs text-rose-900 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>Insufficient {selectedToken} Balance</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Your balance is <strong>{(balances[selectedToken] || 0).toLocaleString()} {selectedToken}</strong>, but <strong>{calculatedTokenAmount.toLocaleString()} {selectedToken}</strong> is needed.
                  </p>
                </div>
              )}

              {/* Connected & Ready: Pay Button */}
              {isConnected &&
                engineState !== 'Preparing transaction' &&
                engineState !== 'Awaiting wallet confirmation' &&
                engineState !== 'Transaction submitted' &&
                engineState !== 'Confirming' &&
                engineState !== 'Confirmed' && (
                  <div className="space-y-3">
                    {/* Wallet Status Bar */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-slate-900 font-bold">
                          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                        </span>
                        <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-bold">
                          {targetChain.shortName}
                        </span>
                      </div>
                      <span className="text-slate-600">
                        Balance: <strong className="text-slate-900">{(balances[selectedToken] || 0).toLocaleString()} {selectedToken}</strong>
                      </span>
                    </div>

                    <Button
                      variant="iris"
                      size="lg"
                      className="w-full text-base font-bold shadow-xl shadow-purple-500/25 cursor-pointer py-4 rounded-2xl"
                      onClick={handleExecutePayment}
                      disabled={isExpired || (isConnected && !isPolygonNetwork)}
                    >
                      {!isPolygonNetwork
                        ? 'Please switch to Polygon'
                        : !hasSufficientTokenBalance
                        ? `Insufficient ${selectedToken} Balance`
                        : `Confirm & Pay ${calculatedTokenAmount.toLocaleString()} ${selectedToken}`}
                    </Button>
                  </div>
                )}

              {/* Processing / In-Flight State */}
              {(engineState === 'Preparing transaction' ||
                engineState === 'Awaiting wallet confirmation' ||
                engineState === 'Transaction submitted' ||
                engineState === 'Confirming') && (
                <div className="p-6 rounded-3xl bg-purple-50/80 border border-purple-200 text-center space-y-3.5 animate-fadeIn">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-300 flex items-center justify-center mx-auto text-purple-700">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {engineState === 'Preparing transaction'
                        ? 'Preparing Transaction...'
                        : engineState === 'Awaiting wallet confirmation'
                        ? 'Awaiting Wallet Approval...'
                        : engineState === 'Transaction submitted'
                        ? 'Transaction Submitted to Polygon'
                        : 'Confirming On-Chain Settlement...'}
                    </h4>
                    <p className="text-xs text-purple-800 mt-1 font-medium">
                      {paymentStepMessage || 'Please sign the transaction prompt in your connected wallet.'}
                    </p>
                  </div>
                  {txHash && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 flex items-center justify-between">
                      <span className="truncate max-w-[200px]">{txHash}</span>
                      <a
                        href={polygonScanTxUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 ml-2"
                      >
                        <span>PolygonScan</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Confirmed / Receipt State */}
              {engineState === 'Confirmed' && (
                <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-300 text-center space-y-4 animate-fadeIn">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Payment Verified & Settled</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      On-chain transaction confirmed on Polygon Mainnet (137).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-emerald-200 text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Amount Settled:</span>
                      <span className="font-mono font-black text-slate-900 text-sm">
                        ${payment.amountUSD.toFixed(2)} ({calculatedTokenAmount.toLocaleString()} {selectedToken})
                      </span>
                    </div>
                    {txHash && (
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-500">Transaction Receipt:</span>
                        <a
                          href={polygonScanTxUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1"
                        >
                          <span>{txHash.slice(0, 8)}...{txHash.slice(-6)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <a
                      href={polygonScanTxUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>View on PolygonScan</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <Button
                      variant="secondary"
                      size="md"
                      className="flex-1 font-bold text-xs rounded-2xl"
                      onClick={() => navigate('/merchant/payments')}
                      leftIcon={<Receipt className="w-4 h-4 text-purple-600" />}
                    >
                      View Invoices
                    </Button>
                  </div>
                </div>
              )}

              {/* Rejected / Error States */}
              {engineState === 'Rejected' && (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2 animate-fadeIn">
                  <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">Wallet Signature Cancelled</h4>
                  <p className="text-xs text-amber-800">{errorMessage || 'You cancelled the prompt in your Web3 wallet.'}</p>
                  <Button variant="iris" size="sm" onClick={() => setEngineState('Ready')}>
                    Try Again
                  </Button>
                </div>
              )}

              {engineState === 'Failed' && (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2 animate-fadeIn">
                  <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">Payment Failed</h4>
                  <p className="text-xs text-rose-700">{errorMessage || 'On-chain transaction execution could not complete.'}</p>
                  <Button variant="iris" size="sm" onClick={() => setEngineState('Ready')}>
                    Retry Payment
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* All Supported Cryptos Modal Drawer */}
      {showAllCoinsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#7928CA]" />
                  <span>All Accepted Crypto Coins</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select any cryptocurrency to view simulated balance and live conversion
                </p>
              </div>
              <button
                onClick={() => setShowAllCoinsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 divide-y divide-slate-100">
              {SUPPORTED_TOKENS.map((token) => {
                const isSel = selectedToken === token.symbol;
                const tokRate = getTokenRate(token.symbol);
                const mockBal = MOCK_DISCONNECTED_BALANCES[token.symbol] ?? 1000;
                const reqAmount = tokRate > 0 ? (payment.amountUSD / tokRate) : payment.amountUSD;
                const displayReq = reqAmount >= 100 ? Math.round(reqAmount).toLocaleString() : reqAmount >= 1 ? reqAmount.toFixed(4) : reqAmount.toFixed(6);

                return (
                  <button
                    key={token.symbol}
                    type="button"
                    onClick={() => {
                      setSelectedToken(token.symbol);
                      setShowAllCoinsModal(false);
                    }}
                    className={`w-full pt-2.5 pb-2 px-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSel ? 'bg-purple-50 border border-purple-300' : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <TokenLogo symbol={token.symbol} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{token.name}</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {token.symbol === 'SOL' ? 'Solana Mainnet' : token.symbol === 'BTC' ? 'Bitcoin Mainnet' : token.symbol === 'VERSE' ? 'Polygon Mainnet' : token.network.split('/')[0].trim()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          1 {token.symbol} = ${tokRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-purple-700 font-mono block">
                        Due: {displayReq} {token.symbol}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono block">
                        Sim: {mockBal.toLocaleString()} {token.symbol}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
              <Button
                variant="secondary"
                size="sm"
                className="w-full font-bold cursor-pointer text-xs rounded-xl"
                onClick={() => setShowAllCoinsModal(false)}
              >
                Close Coin Selector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
