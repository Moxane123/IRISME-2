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
import { getExplorerTxUrl } from '../../config/explorers';
import { TOKEN_CONFIGS, VERSE_TOKEN_ADDRESSES } from '../../config/tokens';
import { getVerseTokenContractAddress, getPaymentRouterAddress } from '../../config/contracts';
import { GasEstimationService } from '../../services/gasEstimationService';
import { PriceService } from '../../services/priceService';
import { VersePaymentService, VersePaymentExecutionResult } from '../../services/versePaymentService';
import { ApiService } from '../../services/apiService';
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  QrCode,
  RotateCcw,
  Receipt,
  Copy,
  Check,
  ShieldCheck,
  Coins,
  Clock,
  Zap,
} from 'lucide-react';

export const CustomerPaymentPage: React.FC = () => {
  const { params, navigate } = useRouter();
  const {
    payments,
    getPaymentById,
    requestRefund,
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
    executeVersePayment,
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
  const [versePaymentDetails, setVersePaymentDetails] = useState<VersePaymentExecutionResult | null>(null);
  const [verseRewardResult, setVerseRewardResult] = useState<number>(payment?.verseEarned || 0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [copiedTx, setCopiedTx] = useState<boolean>(false);
  const [isVerifyingWithBackend, setIsVerifyingWithBackend] = useState<boolean>(false);
  const [verificationReport, setVerificationReport] = useState<BlockchainVerificationReport | null>(null);
  const [showChecklistDetails, setShowChecklistDetails] = useState<boolean>(false);

  // Dynamic Gas Estimation State
  const [gasEstimate, setGasEstimate] = useState<GasEstimationResult>(() => {
    return GasEstimationService.getStaticEstimate(selectedChainId, selectedToken);
  });

  // Expiration countdown
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Refund Dialog State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState<boolean>(false);
  const [refundReasonInput, setRefundReasonInput] = useState<string>('');
  const [refundSubmitting, setRefundSubmitting] = useState<boolean>(false);
  const [refundFeedback, setRefundFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  // Token amount calculation
  const calculatedTokenAmount = useMemo(() => {
    if (!payment) return 0;
    if (selectedToken === 'VERSE') {
      if (payment.selectedToken === 'VERSE' && payment.tokenAmount) {
        return payment.tokenAmount;
      }
      const p = liveVersePrice > 0 ? liveVersePrice : 0.0000176;
      return Math.round(payment.amountUSD / p);
    }
    return payment.tokenAmount ?? payment.amountUSD ?? 0;
  }, [payment, selectedToken, liveVersePrice]);

  // Merchant Settlement Address from existing config
  const merchantSettlementAddress = useMemo(() => {
    return (
      merchantProfile.settlementAddress ||
      payment?.merchantAddress ||
      '0x8F3a4e9b72cD4562098b584d4D9fB231f6C2A093'
    );
  }, [merchantProfile.settlementAddress, payment?.merchantAddress]);

  // VERSE Rewards live computation
  const effectiveCashbackPercent = payment?.cashbackPercent ?? merchantProfile.baseRewardPercent ?? 3.0;
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
  const isCorrectNetwork = selectedToken === 'VERSE' ? isPolygonNetwork : walletChainId === selectedChainId;

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

  if (!payment) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4 text-slate-700">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Payment Request Not Found</h2>
        <p className="text-xs text-slate-500">No payment request found matching this identifier.</p>
        <Button variant="iris" onClick={() => navigate('/merchant/create-payment')}>
          Create New Payment
        </Button>
      </div>
    );
  }

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

  /**
   * Switch network handler (explicit user action)
   */
  const handleSwitchNetwork = async () => {
    await switchTargetNetwork(137);
  };

  /**
   * VERSE Payment Handler implementing the exact 10-step flow
   */
  const handleExecutePayment = async () => {
    if (!isConnected) {
      setIsWalletModalOpen(true);
      return;
    }

    // 1. VERIFY NETWORK: Must be Polygon Mainnet (137)
    if (walletChainId !== 137) {
      // Prevent payment and display "Please switch to Polygon." Do not silently switch networks.
      setErrorMessage('Please switch to Polygon.');
      return;
    }

    setErrorMessage('');
    setEngineState('Preparing transaction');
    setPaymentStepMessage('Verifying payment parameters...');

    try {
      // Execute the real VERSE payment flow via VersePaymentService
      const result = await executeVersePayment({
        merchantAddress: merchantSettlementAddress,
        verseAmount: calculatedTokenAmount,
        onStepUpdate: (update) => {
          setPaymentStepMessage(update.message);
          if (update.step === 'approving' || update.step === 'awaiting_payment') {
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
          } else if (update.step === 'failed') {
            setEngineState('Failed');
          }
        },
      });

      // ONLY after the Polygon transaction receipt confirms success
      setTxHash(result.txHash);
      setVersePaymentDetails(result);
      setVerseRewardResult(calculatedVerseReward);
      setEngineState('Confirmed');

      // Update backend record asynchronously
      try {
        setIsVerifyingWithBackend(true);
        const verifyResp = await ApiService.verifyPaymentOnChain({
          paymentId: payment.id,
          txHash: result.txHash,
          payerAddress: address,
          network: 'Polygon',
          tokenAmount: calculatedTokenAmount,
          tokenSymbol: 'VERSE',
          chainId: 137,
        });
        if (verifyResp.report) {
          setVerificationReport(verifyResp.report);
        }
      } catch (e) {
        console.warn('Backend payment record sync:', e);
      } finally {
        setIsVerifyingWithBackend(false);
      }
    } catch (err: any) {
      if (VersePaymentService.isUserRejection(err)) {
        setEngineState('Rejected');
        setErrorMessage(err.message || 'Transaction was rejected in your Web3 wallet.');
      } else {
        setEngineState('Failed');
        setErrorMessage(err?.message || 'Payment transaction failed on Polygon.');
      }
    }
  };

  const polygonScanTxUrl = txHash ? `https://polygonscan.com/tx/${txHash}` : '#';

  return (
    <div className="max-w-lg mx-auto space-y-4 px-3 sm:px-0 pb-12 animate-fadeIn">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/merchant/dashboard')}
          className="text-xs cursor-pointer text-slate-700"
        >
          ← Merchant Portal
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyLink}
            className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copiedLink ? 'Link Copied' : 'Share Checkout'}
          </Button>
        </div>
      </div>

      {/* Main Payment Checkout Card */}
      <Card className="p-6 sm:p-7 space-y-5 border-purple-200/90 shadow-xl bg-white relative overflow-hidden">
        {/* Top Gradient Banner */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-purple-200/30 via-pink-200/20 to-cyan-200/30 rounded-full blur-2xl pointer-events-none" />

        {/* 1. Header: Merchant Info & Status Badge */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-md flex-shrink-0">
              {payment.merchantName ? payment.merchantName.slice(0, 2).toUpperCase() : 'IM'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base leading-tight">
                  {payment.merchantName || merchantProfile.name || 'IRISME Merchant'}
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">
                  Verified
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-0.5">
                <span>Settles to:</span>
                <span className="text-slate-800 font-medium">
                  {merchantSettlementAddress.slice(0, 6)}...{merchantSettlementAddress.slice(-4)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <StatusBadge
              status={
                engineState === 'Confirmed'
                  ? 'paid'
                  : engineState === 'Transaction submitted' ||
                    engineState === 'Confirming' ||
                    isVerifyingWithBackend
                  ? 'processing'
                  : engineState === 'Failed'
                  ? 'failed'
                  : isExpired
                  ? 'expired'
                  : 'awaiting_payment'
              }
              size="md"
              pulse={engineState === 'Confirming' || isVerifyingWithBackend}
            />
          </div>
        </div>

        {/* 2. Amount & Asset / Token Display */}
        <div data-tour="token-selector" className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          {/* Payment Method Selector Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Payment Method:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedToken('VERSE')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedToken === 'VERSE'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                VERSE (Polygon)
              </button>
              <button
                onClick={() => setSelectedToken('USDT')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedToken === 'USDT'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                USDT
              </button>
              <button
                onClick={() => setSelectedToken('USDC')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedToken === 'USDC'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                USDC
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TokenLogo
                symbol={selectedToken}
                size="lg"
                variant="gif"
                animated={true}
              />
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold block">
                  Amount Due
                </span>
                <span className="text-xs text-purple-700 font-bold font-mono">
                  {selectedToken} on {targetChain.shortName}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                ${payment.amountUSD.toFixed(2)}
              </span>
              <span className="text-xs text-slate-600 block font-mono font-semibold">
                ≈ {calculatedTokenAmount.toLocaleString()} {selectedToken}
              </span>
            </div>
          </div>

          {/* Short Payment Description */}
          <div className="pt-2 border-t border-slate-200/80 flex items-start justify-between text-xs gap-3">
            <span className="text-slate-500 flex-shrink-0 font-medium">Description:</span>
            <span className="text-slate-900 font-semibold text-right leading-snug">
              {payment.description || 'IRISME Crypto Checkout'}
            </span>
          </div>

          {/* VERSE Customer Rewards Section */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-50/70 via-purple-50/70 to-pink-50/70 border border-purple-200/90 space-y-2.5 text-xs text-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-purple-900">
                <Coins className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>Customer VERSE Cashback</span>
                <span className="px-1.5 py-0.2 rounded bg-purple-200/80 text-[10px] text-purple-800 font-bold">
                  {effectiveCashbackPercent}% Rate
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-purple-700 text-sm">
                  +{calculatedVerseReward.toLocaleString()} VERSE
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  ≈ ${calculatedRewardUSDValue} USD
                </span>
              </div>
            </div>

            {/* Live VERSE Price & Blockchain Specs */}
            <div className="pt-2 border-t border-purple-200/60 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono">
              <div className="flex items-center gap-1 text-slate-600">
                <Zap className="w-3 h-3 text-cyan-600" />
                <span>Live VERSE Price:</span>
                <strong className="text-slate-900 font-bold">${liveVersePrice.toFixed(7)}</strong>
              </div>
              <a
                href="https://dex.verse.bitcoin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-0.5 underline text-[10px]"
              >
                <span>Verse DEX</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div className="p-2 rounded-xl bg-white/80 border border-purple-100 space-y-1 text-[10px] font-mono text-slate-600">
              <div className="flex justify-between items-center">
                <span>VERSE Token (Polygon):</span>
                <a
                  href={`https://polygonscan.com/token/${VERSE_TOKEN_ADDRESSES[137]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-700 hover:underline flex items-center gap-0.5"
                >
                  <span>{VERSE_TOKEN_ADDRESSES[137].slice(0, 6)}...{VERSE_TOKEN_ADDRESSES[137].slice(-4)}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span>Payment Router:</span>
                <span className="text-slate-700 font-medium">
                  {getPaymentRouterAddress(137)
                    ? `${getPaymentRouterAddress(137)!.slice(0, 6)}...${getPaymentRouterAddress(137)!.slice(-4)}`
                    : 'Polygon Router Deployed'}
                </span>
              </div>
            </div>
          </div>

          {/* Expiration Timer */}
          <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              Expires in:
            </span>
            <span className={isExpired ? 'text-rose-600 font-bold' : 'text-amber-600 font-bold'}>
              {timeLeftStr || '45m 00s'}
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* NETWORK & BALANCE NOTIFICATIONS */}
        {/* ============================================================ */}

        {/* Wrong Network Banner: "Please switch to Polygon." */}
        {isConnected && !isPolygonNetwork && selectedToken === 'VERSE' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs text-amber-900 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Please switch to Polygon</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Your wallet is currently connected to {walletCurrentChain?.name || `Chain ${walletChainId}`}. VERSE payments must use <strong>Polygon Mainnet (Chain ID 137)</strong>.
            </p>
            <div className="pt-1">
              <Button
                variant="iris"
                size="sm"
                className="w-full cursor-pointer font-bold shadow-xs text-xs"
                onClick={handleSwitchNetwork}
              >
                Switch to Polygon
              </Button>
            </div>
          </div>
        )}

        {/* Insufficient VERSE Balance Banner */}
        {isConnected && isPolygonNetwork && !hasSufficientTokenBalance && selectedToken === 'VERSE' && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5 text-xs text-rose-900 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Insufficient VERSE Balance</span>
            </div>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              Your wallet has <strong>{(balances.VERSE || 0).toLocaleString()} VERSE</strong>, but <strong>{calculatedTokenAmount.toLocaleString()} VERSE</strong> is required for this checkout.
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/* ACTION CONTROLS & STATE PROGRESSION */}
        {/* ============================================================ */}
        <div className="space-y-3 pt-1">
          {/* Step 1: Connect Wallet */}
          {!isConnected && engineState !== 'Confirmed' && (
            <div className="space-y-2.5">
              <Button
                variant="iris"
                size="lg"
                className="w-full text-base font-bold shadow-xl shadow-purple-500/25 cursor-pointer py-3.5"
                onClick={() => setIsWalletModalOpen(true)}
                leftIcon={<Wallet className="w-5 h-5" />}
              >
                Connect Wallet to Pay
              </Button>
              <p className="text-[11px] text-center text-slate-500">
                Connect MetaMask, Trust Wallet, Coinbase Wallet, or any WalletConnect wallet.
              </p>
            </div>
          )}

          {/* Connected Wallet Ready State */}
          {isConnected &&
            engineState !== 'Preparing transaction' &&
            engineState !== 'Awaiting wallet confirmation' &&
            engineState !== 'Transaction submitted' &&
            engineState !== 'Confirming' &&
            engineState !== 'Confirmed' && (
              <div className="space-y-3">
                {/* Connected Wallet Bar */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-mono text-slate-900 font-semibold">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                    </span>
                    <span className="text-[10px] text-purple-700 font-mono font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      {targetChain.shortName}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 font-mono font-medium">
                    Bal: <strong className="text-slate-900">{(balances[selectedToken] || 0).toLocaleString()} {selectedToken}</strong>
                  </span>
                </div>

                {/* Primary Payment Button */}
                <Button
                  data-tour="pay-action-btn"
                  variant="iris"
                  size="lg"
                  className="w-full text-base font-bold shadow-xl shadow-purple-500/25 cursor-pointer py-3.5"
                  onClick={handleExecutePayment}
                  disabled={isExpired || (isConnected && !isPolygonNetwork)}
                >
                  {!isPolygonNetwork
                    ? 'Please switch to Polygon.'
                    : !hasSufficientTokenBalance
                    ? `Insufficient ${selectedToken} Balance`
                    : `Pay with ${selectedToken} (${calculatedTokenAmount.toLocaleString()} ${selectedToken})`}
                </Button>
              </div>
            )}

          {/* Step: Transaction Submitted & Processing */}
          {(engineState === 'Preparing transaction' ||
            engineState === 'Awaiting wallet confirmation' ||
            engineState === 'Transaction submitted' ||
            engineState === 'Confirming' ||
            isVerifyingWithBackend) && (
            <div className="p-6 rounded-2xl bg-purple-50 border border-purple-200 text-center space-y-3.5 animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-300 flex items-center justify-center mx-auto text-purple-600">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {engineState === 'Preparing transaction'
                    ? 'Preparing VERSE Payment...'
                    : engineState === 'Awaiting wallet confirmation'
                    ? 'Awaiting Wallet Confirmation...'
                    : engineState === 'Transaction submitted'
                    ? 'Transaction Submitted to Polygon'
                    : 'Confirming On-Chain Settlement...'}
                </h4>
                <p className="text-xs text-purple-800 font-medium mt-1">
                  {paymentStepMessage || 'Please approve the transaction prompt in your wallet.'}
                </p>
              </div>

              {txHash && (
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 flex items-center justify-between shadow-xs">
                  <span className="truncate max-w-[200px]">{txHash}</span>
                  <a
                    href={polygonScanTxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 ml-2 flex-shrink-0"
                  >
                    <span>PolygonScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Step: Payment Successful (Shown Only After Polygon Confirmation) */}
          {engineState === 'Confirmed' && (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">Payment Successful</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Confirmed on Polygon Mainnet (Chain ID 137).
                </p>
              </div>

              {/* Exact Payment Details Display */}
              <div className="p-4 rounded-xl bg-white border border-emerald-200 text-left space-y-2.5 shadow-xs text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Amount Paid:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {calculatedTokenAmount.toLocaleString()} VERSE (${payment.amountUSD.toFixed(2)})
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Asset:</span>
                  <span className="font-mono font-bold text-purple-700">VERSE (Polygon ERC-20)</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Merchant Address:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-slate-800">
                      {merchantSettlementAddress.slice(0, 8)}...{merchantSettlementAddress.slice(-6)}
                    </span>
                    <button
                      onClick={() => handleCopyAddress(merchantSettlementAddress)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      {copiedAddress ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {txHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Transaction Hash:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-800">
                        {txHash.slice(0, 8)}...{txHash.slice(-6)}
                      </span>
                      <button
                        onClick={() => handleCopyTx(txHash)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        {copiedTx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <a
                        href={polygonScanTxUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-800 flex items-center gap-0.5 font-bold ml-1"
                      >
                        <span>PolygonScan</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* VERSE Reward Earned Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-50 via-purple-50 to-pink-50 border border-purple-200 space-y-1 text-left shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-700 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-purple-600" />
                    VERSE Cashback Earned
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-300 text-[10px] font-bold">
                    Claimable
                  </span>
                </div>
                <p className="text-xl font-black font-mono text-purple-700">
                  +{calculatedVerseReward.toLocaleString()} VERSE
                </p>
              </div>

              {/* View PolygonScan Direct Link Button */}
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={polygonScanTxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>View on PolygonScan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <Button
                  variant="secondary"
                  size="md"
                  className="w-full cursor-pointer font-bold shadow-xs text-xs"
                  onClick={() => navigate('/merchant/payments')}
                  leftIcon={<Receipt className="w-4 h-4 text-purple-600" />}
                >
                  View Payment Invoices
                </Button>
              </div>
            </div>
          )}

          {/* Rejected Signature */}
          {engineState === 'Rejected' && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3 animate-fadeIn">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Wallet Signature Rejected</h4>
              <p className="text-xs text-amber-800">{errorMessage || 'You cancelled the transaction in your Web3 wallet.'}</p>
              <Button
                variant="iris"
                size="md"
                className="w-full cursor-pointer mt-2"
                onClick={() => setEngineState('Ready')}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Failed Transaction */}
          {engineState === 'Failed' && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3 animate-fadeIn">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center mx-auto text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Payment Failed</h4>
              <p className="text-xs text-rose-700">{errorMessage || 'The on-chain transaction could not be completed.'}</p>
              <Button
                variant="iris"
                size="md"
                className="w-full cursor-pointer mt-2"
                onClick={() => setEngineState('Ready')}
              >
                Retry Payment
              </Button>
            </div>
          )}

          {/* Mobile QR Code Toggle */}
          <div className="pt-2">
            <button
              onClick={() => setShowQrModal(!showQrModal)}
              className="w-full py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs active:scale-98"
            >
              <QrCode className="w-4 h-4 text-purple-600" />
              <span>{showQrModal ? 'Hide Mobile QR Code' : 'Show Mobile QR Code to Scan & Pay'}</span>
            </button>

            {showQrModal && (
              <div className="mt-3 animate-fadeIn">
                <PaymentQRCode
                  url={window.location.href}
                  amountUSD={payment.amountUSD}
                  tokenAmount={calculatedTokenAmount}
                  tokenSymbol={selectedToken}
                  merchantAddress={merchantSettlementAddress}
                  merchantName={payment.merchantName || merchantProfile.name || 'IrisMe Merchant'}
                  itemDescription={payment.description}
                  networkName={targetChain.name}
                  verseEarned={payment.verseEarned}
                />
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>Direct non-custodial EVM settlement on Polygon Mainnet</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
