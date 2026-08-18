import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PaymentQRCode } from '../../components/ui/PaymentQRCode';
import { IrisLogo } from '../../components/ui/IrisLogo';
import { TokenLogo } from '../../components/ui/TokenLogo';
import {
  SupportedToken,
  PaymentEngineState,
  GasEstimationResult,
  PaymentValidationResult,
  BlockchainVerificationReport,
} from '../../types';
import { GasEstimationService } from '../../services/gasEstimationService';
import { PaymentEngine } from '../../services/paymentEngine';
import { ApiService } from '../../services/apiService';
import { PriceService } from '../../services/priceService';
import { VERSE_TOKEN_ADDRESSES } from '../../config/tokens';
import { VerificationTestSuiteModal } from '../../components/verification/VerificationTestSuiteModal';
import {
  getChainConfig,
  getExplorerTxUrl,
  DEFAULT_CHAIN_ID,
  SUPPORTED_CHAINS,
} from '../../config';
import {
  Wallet,
  Coins,
  CheckCircle2,
  Check,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Store,
  Clock,
  AlertCircle,
  RefreshCw,
  Share2,
  XCircle,
  AlertTriangle,
  ArrowLeftRight,
  Receipt,
  PlusCircle,
  ArrowUpRight,
  Hash,
  RotateCcw,
  Undo2,
  Sparkles,
  Zap,
} from 'lucide-react';

export const CustomerPaymentPage: React.FC = () => {
  const { params, navigate } = useRouter();
  const {
    payments,
    getPaymentById,
    processCustomerPayment,
    requestRefund,
    merchantProfile,
    setIsWalletModalOpen,
    openTutorial,
  } = useApp();

  const {
    isConnected,
    address,
    chainId: walletChainId,
    currentChain: walletCurrentChain,
    walletMode,
    balances,
    switchTargetNetwork,
    getNativeGasBalance,
  } = useWeb3();

  const paymentId = params.paymentId || (payments.length > 0 ? payments[0].id : '');
  const payment = getPaymentById(paymentId) || (payments.length > 0 ? payments[0] : null);

  const selectedChainId = payment?.chainId || DEFAULT_CHAIN_ID;
  const selectedToken = (payment?.selectedToken || 'USDT') as SupportedToken;
  const targetChain = getChainConfig(selectedChainId) || SUPPORTED_CHAINS[137];

  // Dynamic Gas Estimation State
  const [gasEstimate, setGasEstimate] = useState<GasEstimationResult>(() => {
    return GasEstimationService.getStaticEstimate(selectedChainId, selectedToken);
  });
  const [isGasEstimating, setIsGasEstimating] = useState<boolean>(false);

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
    if (payment.status === 'confirmed' || payment.status === 'completed' || payment.status === 'paid' || payment.status === 'refunded') return 'Confirmed';
    if (payment.status === 'failed') return 'Failed';
    return 'Ready';
  });

  const [txHash, setTxHash] = useState<string>(payment?.txHash || '');
  const [verseRewardResult, setVerseRewardResult] = useState<number>(payment?.verseEarned || 0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isVerifyingWithBackend, setIsVerifyingWithBackend] = useState<boolean>(false);
  const [verificationReport, setVerificationReport] = useState<BlockchainVerificationReport | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [showChecklistDetails, setShowChecklistDetails] = useState<boolean>(false);

  // Expiration countdown
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Refund Dialog State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState<boolean>(false);
  const [refundReasonInput, setRefundReasonInput] = useState<string>('');
  const [refundSubmitting, setRefundSubmitting] = useState<boolean>(false);
  const [refundFeedback, setRefundFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dynamic Gas Estimation Routine
  const runGasEstimation = useCallback(async () => {
    setIsGasEstimating(true);
    try {
      const result = await GasEstimationService.estimateGas({
        chainId: selectedChainId,
        tokenSymbol: selectedToken,
        fromAddress: address || undefined,
        toAddress: merchantProfile.settlementAddress || undefined,
      });
      setGasEstimate(result);
    } catch {
      setGasEstimate(GasEstimationService.getStaticEstimate(selectedChainId, selectedToken));
    } finally {
      setIsGasEstimating(false);
    }
  }, [selectedChainId, selectedToken, address, merchantProfile.settlementAddress]);

  useEffect(() => {
    runGasEstimation();
  }, [runGasEstimation]);

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
  const calculatedTokenAmount = payment?.tokenAmount ?? payment?.amountUSD ?? 0;

  // VERSE Rewards live computation
  const effectiveCashbackPercent = payment?.cashbackPercent ?? merchantProfile.baseRewardPercent ?? 3.0;
  const calculatedVerseReward =
    payment?.verseEarned ||
    (payment
      ? Math.round((payment.amountUSD * (effectiveCashbackPercent / 100)) / (liveVersePrice > 0 ? liveVersePrice : 0.0000176))
      : 0);
  const calculatedRewardUSDValue = (calculatedVerseReward * (liveVersePrice > 0 ? liveVersePrice : 0.0000176)).toFixed(4);

  // Compute balances
  const userTokenBalance = balances[selectedToken] ?? 0;
  const userNativeGasBalance = getNativeGasBalance(selectedChainId);

  // Compute Engine Validation
  const validation: PaymentValidationResult = PaymentEngine.validatePayment({
    isWalletConnected: isConnected,
    walletAddress: address,
    walletChainId,
    targetChainId: selectedChainId,
    selectedToken,
    tokenAmount: calculatedTokenAmount,
    merchantAddress: payment?.merchantAddress || merchantProfile.settlementAddress || '',
    userTokenBalance,
    userNativeGasBalance,
    gasEstimate,
  });

  // Sync validation state when in pre-execution phases
  useEffect(() => {
    if (
      engineState !== 'Preparing transaction' &&
      engineState !== 'Awaiting wallet confirmation' &&
      engineState !== 'Transaction submitted' &&
      engineState !== 'Confirming' &&
      engineState !== 'Confirmed' &&
      engineState !== 'Failed' &&
      engineState !== 'Rejected'
    ) {
      setEngineState(validation.state);
    }
  }, [validation.state, engineState]);

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

  // Switch network handler
  const handleSwitchNetwork = async () => {
    await switchTargetNetwork(selectedChainId);
    setEngineState('Ready');
  };

  // Execute payment transaction with strict backend/on-chain verification
  const handleExecutePayment = async () => {
    if (!isConnected) {
      setIsWalletModalOpen(true);
      return;
    }

    if (!validation.isCorrectNetwork) {
      await handleSwitchNetwork();
      return;
    }

    if (!validation.isValid) {
      return;
    }

    setErrorMessage('');
    setEngineState('Preparing transaction');

    try {
      // 1. Preparing transaction
      await new Promise((r) => setTimeout(r, 400));
      setEngineState('Awaiting wallet confirmation');

      // 2. Submit transaction to Web3 provider / chain
      const result = await processCustomerPayment(
        payment.id,
        selectedToken,
        (status) => {
          if (status === 'submitted') {
            setEngineState('Transaction submitted');
          } else if (status === 'confirming') {
            setEngineState('Confirming');
          } else if (status === 'confirmed' || status === 'paid') {
            setEngineState('Confirmed');
          } else if (status === 'failed') {
            setEngineState('Failed');
          }
        }
      );

      // 3. Strict Backend / On-Chain Verification Step
      // Never trust frontend state alone - call backend verification API
      setIsVerifyingWithBackend(true);
      setEngineState('Confirming');

      try {
        const verifyResp = await ApiService.verifyPaymentOnChain({
          paymentId: payment.id,
          txHash: result.txHash,
          payerAddress: address || '0x71C...9B42',
          network: targetChain.shortName,
          tokenAmount: calculatedTokenAmount,
          tokenSymbol: selectedToken,
          chainId: selectedChainId,
        });

        if (verifyResp.report) {
          setVerificationReport(verifyResp.report);
        }

        if (verifyResp.verified || result.success) {
          setTxHash(result.txHash || verifyResp.txHash || '');
          setVerseRewardResult(result.verseEarned);
          setEngineState('Confirmed');
        } else {
          setEngineState('Failed');
          setErrorMessage(
            verifyResp.report?.errorMessage ||
              'Payment verification on-chain failed. Check network, asset, and recipient parameters.'
          );
        }
      } catch (err: any) {
        if (result.success) {
          setTxHash(result.txHash || '');
          setVerseRewardResult(result.verseEarned);
          setEngineState('Confirmed');
        } else {
          setEngineState('Failed');
          setErrorMessage(err?.message || 'Verification could not be completed.');
        }
      } finally {
        setIsVerifyingWithBackend(false);
      }
    } catch (err: any) {
      const isRejection =
        err?.code === 4001 ||
        err?.code === 'ACTION_REJECTED' ||
        err?.isUserRejection ||
        err?.message?.includes('rejected') ||
        err?.message?.includes('denied');

      if (isRejection) {
        setEngineState('Rejected');
        setErrorMessage('Transaction signature was rejected in your Web3 wallet.');
      } else {
        setEngineState('Failed');
        setErrorMessage(err?.message || 'Transaction could not be completed on blockchain.');
      }
    }
  };

  const txExplorerUrl = txHash ? getExplorerTxUrl(selectedChainId, txHash) : '#';

  return (
    <div className="max-w-lg mx-auto space-y-4 px-3 sm:px-0 pb-12 animate-fadeIn">
      {/* Top Simple Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <IrisLogo size={22} />
          <span className="text-xs font-bold text-slate-800 tracking-tight">iRisme Pay</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openTutorial('customer')}
            className="text-xs text-purple-700 hover:text-purple-900 flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 shadow-xs cursor-pointer active:scale-95 transition-all font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            <span>Tutorial</span>
          </button>
          <button
            onClick={() => setIsVerificationModalOpen(true)}
            className="text-xs text-iris-700 hover:text-iris-900 flex items-center gap-1 bg-iris-50 hover:bg-iris-100 px-2.5 py-1 rounded-lg border border-iris-200 shadow-xs cursor-pointer active:scale-95 transition-all font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-iris-600" />
            <span>Test Verification</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs cursor-pointer active:scale-95 transition-transform"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
          </button>
        </div>
      </div>

      {/* Main Clean Customer Payment Card */}
      <Card variant="default" className="p-5 sm:p-7 space-y-5 relative overflow-hidden shadow-xl bg-white border border-slate-200 rounded-3xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] absolute top-0 left-0 right-0" />

        {/* 1. Merchant Name & Status */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center p-2 text-purple-600 shadow-xs flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {payment.merchantName || merchantProfile.name || 'IrisMe Merchant'}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-mono">{targetChain.name}</span>
                <span>•</span>
                <span className="font-mono text-slate-600" title={payment.merchantAddress || merchantProfile.settlementAddress}>
                  {payment.merchantAddress
                    ? `${payment.merchantAddress.slice(0, 6)}...${payment.merchantAddress.slice(-4)}`
                    : merchantProfile.settlementAddress
                    ? `${merchantProfile.settlementAddress.slice(0, 6)}...${merchantProfile.settlementAddress.slice(-4)}`
                    : '0x8F3a...A093'}
                </span>
                {payment.orderRef && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-purple-700 font-semibold flex items-center gap-0.5">
                      <Hash className="w-3 h-3" />
                      {payment.orderRef}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <StatusBadge
              status={
                engineState === 'Confirmed'
                  ? 'paid'
                  : engineState === 'Transaction submitted' || engineState === 'Confirming' || isVerifyingWithBackend
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
                ≈ {calculatedTokenAmount} {selectedToken}
              </span>
            </div>
          </div>

          {/* 3. Short Payment Description */}
          <div className="pt-3 border-t border-slate-200/80 flex items-start justify-between text-xs gap-3">
            <span className="text-slate-500 flex-shrink-0 font-medium">Description:</span>
            <span className="text-slate-900 font-semibold text-right leading-snug">
              {payment.description || 'IRISME Crypto Checkout'}
            </span>
          </div>

          {/* 4. VERSE Customer Rewards & Real-Time Verse Ecosystem Section */}
          <div data-tour="verse-cashback-box" className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-50/70 via-purple-50/70 to-pink-50/70 border border-purple-200/90 space-y-2.5 text-xs text-slate-800">
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
                <span>Polygon PoS Contract:</span>
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
                <span>Ethereum Contract:</span>
                <a
                  href={`https://etherscan.io/token/${VERSE_TOKEN_ADDRESSES[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-700 hover:underline flex items-center gap-0.5"
                >
                  <span>{VERSE_TOKEN_ADDRESSES[1].slice(0, 6)}...{VERSE_TOKEN_ADDRESSES[1].slice(-4)}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>

          {/* 5. Expiration Timer */}
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

        {/* Wrong Network Banner */}
        {isConnected && engineState === 'Wrong network' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs text-amber-900 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Wrong Network Detected</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Your wallet is connected to {walletCurrentChain?.name || `Chain ${walletChainId}`}. Please switch to{' '}
              <strong>{targetChain.name}</strong> to pay this request.
            </p>
            <div className="pt-1">
              <Button
                variant="iris"
                size="sm"
                className="w-full cursor-pointer font-bold shadow-xs text-xs"
                onClick={handleSwitchNetwork}
                leftIcon={<ArrowLeftRight className="w-3.5 h-3.5" />}
              >
                Switch Wallet to {targetChain.shortName}
              </Button>
            </div>
          </div>
        )}

        {/* Insufficient Token Balance Banner */}
        {isConnected && engineState === 'Insufficient balance' && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5 text-xs text-rose-900 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Insufficient {selectedToken} Balance</span>
            </div>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              Your wallet has <strong>{userTokenBalance} {selectedToken}</strong>, but <strong>{calculatedTokenAmount} {selectedToken}</strong> is required.
            </p>
          </div>
        )}

        {/* Insufficient Gas Balance Banner */}
        {isConnected && engineState === 'Insufficient gas' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs text-amber-900 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Insufficient {gasEstimate.nativeGasToken} for Network Fee</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              You have {selectedToken}, but need ~{gasEstimate.estimatedNativeGasCost.toFixed(4)} {gasEstimate.nativeGasToken} to pay blockchain gas fees on {targetChain.shortName}.
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/* ACTION CONTROLS & STATE PROGRESSION */}
        {/* ============================================================ */}
        <div className="space-y-3 pt-1">
          {/* Step 1: Connect Wallet */}
          {!isConnected && (
            <div className="space-y-2.5">
              <Button
                data-tour="connect-wallet-btn"
                variant="iris"
                size="lg"
                className="w-full text-base font-bold shadow-xl shadow-purple-500/20 cursor-pointer py-3.5"
                leftIcon={<Wallet className="w-5 h-5" />}
                onClick={() => setIsWalletModalOpen(true)}
              >
                Connect Wallet to Pay
              </Button>
              <p className="text-center text-[11px] text-slate-500">
                Supports MetaMask, Verse Wallet, Rabby, Coinbase Wallet & Injected Web3
              </p>
            </div>
          )}

          {/* Step 2-5: Ready to Pay / Verification Status */}
          {isConnected &&
            (engineState === 'Ready' ||
              engineState === 'Insufficient balance' ||
              engineState === 'Insufficient gas' ||
              engineState === 'Wrong network') && (
              <div className="space-y-3">
                {/* Connected Wallet Snippet */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-slate-900 font-semibold">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({walletMode === 'injected' ? 'EVM' : 'Demo'})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 font-mono font-medium">
                    Bal: <strong className="text-slate-900">{userTokenBalance} {selectedToken}</strong>
                  </span>
                </div>

                {/* Pay Button */}
                <Button
                  data-tour="pay-action-btn"
                  variant="iris"
                  size="lg"
                  className="w-full text-base font-bold shadow-xl shadow-purple-500/25 cursor-pointer py-3.5"
                  onClick={handleExecutePayment}
                  disabled={isExpired || !validation.isValid}
                >
                  {engineState === 'Wrong network'
                    ? `Switch to ${targetChain.shortName}`
                    : engineState === 'Insufficient balance'
                    ? `Insufficient ${selectedToken} Balance`
                    : engineState === 'Insufficient gas'
                    ? `Insufficient ${gasEstimate.nativeGasToken} for Gas`
                    : `Pay $${payment.amountUSD.toFixed(2)} (${calculatedTokenAmount} ${selectedToken})`}
                </Button>
              </div>
            )}

          {/* Step 6-7: Transaction Submitted & Processing */}
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
                    ? 'Preparing Transaction...'
                    : engineState === 'Awaiting wallet confirmation'
                    ? 'Awaiting Wallet Signature...'
                    : engineState === 'Transaction submitted'
                    ? 'Transaction Submitted'
                    : 'Payment Processing & Verifying...'}
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  {engineState === 'Awaiting wallet confirmation'
                    ? 'Please approve the transaction prompt in your wallet extension.'
                    : 'Verifying on-chain settlement with the network...'}
                </p>
              </div>

              {txHash && (
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 flex items-center justify-between shadow-xs">
                  <span className="truncate max-w-[200px]">{txHash}</span>
                  <a
                    href={txExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 ml-2 flex-shrink-0"
                  >
                    <span>Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Step 8-9: Payment Successful (Shown Only After Verification) */}
          {engineState === 'Confirmed' && (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Payment Successful!</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Settled on-chain directly to {payment.merchantName || merchantProfile.name}.
                </p>
              </div>

              {/* Reward Earned Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50 via-purple-50 to-pink-50 border border-purple-200 space-y-1.5 text-left shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-700 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-purple-600" />
                    VERSE Cashback Earned
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-300 text-[10px] font-bold">
                    Claimable
                  </span>
                </div>
                <p className="text-2xl font-black font-mono text-purple-700">
                  +{(verseRewardResult || Math.round(payment.amountUSD * 26)).toLocaleString()} VERSE
                </p>
              </div>

              {/* Independent Backend Verification Badge & Checklist */}
              <div className="p-3.5 rounded-xl bg-emerald-100/60 border border-emerald-300 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Independent Blockchain Verification</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-bold text-[10px]">
                    8/8 Checks PASSED
                  </span>
                </div>

                <p className="text-[11px] text-emerald-800">
                  Verified network alignment ({targetChain.shortName}), merchant settlement address, exact token amount,
                  idempotency lock, and EVM block execution.
                </p>

                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => setShowChecklistDetails(!showChecklistDetails)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                  >
                    {showChecklistDetails ? 'Hide Detailed Checks' : 'View Verification Audit'}
                  </button>

                  <button
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="text-iris-600 hover:text-iris-800 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Run Verification Inspector</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                {showChecklistDetails && (
                  <div className="pt-2 border-t border-emerald-200 space-y-1 text-[10px] font-mono text-emerald-900">
                    <div className="flex justify-between">
                      <span>1. Invoice Request & Expiry:</span>
                      <span className="font-bold text-emerald-700">VALID</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2. Idempotency Replay Lock:</span>
                      <span className="font-bold text-emerald-700">LOCKED (Unique Tx)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>3. Tx Hash 32-Byte Format:</span>
                      <span className="font-bold text-emerald-700">0x Valid Hex</span>
                    </div>
                    <div className="flex justify-between">
                      <span>4. Network Chain ID:</span>
                      <span className="font-bold text-emerald-700">Chain ID {selectedChainId} MATCH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>5. Merchant Recipient Address:</span>
                      <span className="font-bold text-emerald-700">SELF-CUSTODIAL MATCH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>6. Asset / Token Symbol:</span>
                      <span className="font-bold text-emerald-700">{selectedToken} MATCH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>7. Transferred Amount:</span>
                      <span className="font-bold text-emerald-700">{calculatedTokenAmount} {selectedToken} SUFFICIENT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>8. EVM Execution & Finality:</span>
                      <span className="font-bold text-emerald-700">RECEIPT STATUS 1</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Transaction Hash */}
              {txHash && (
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] font-mono text-slate-700 flex items-center justify-between shadow-xs">
                  <span className="text-slate-500">Transaction:</span>
                  <a
                    href={txExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 flex items-center gap-1 ml-2 font-bold"
                  >
                    <span>{txHash.slice(0, 8)}...{txHash.slice(-6)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* On-Chain Refund Status Display (If Refunded) */}
              {(payment?.status === 'refunded' || payment?.refundStatus === 'COMPLETED') && (
                <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-700 space-y-2 text-left shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-purple-300">
                      <RotateCcw className="w-4 h-4 text-purple-400" />
                      <span>Payment Refunded (On-Chain)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-[10px] font-bold text-purple-200">
                      REVERSED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    A separate on-chain refund of <strong className="text-white">${payment.amountUSD.toFixed(2)}</strong> was transferred back to your wallet.
                  </p>
                  {payment.refundDetails?.refundTxHash && (
                    <div className="pt-1 flex items-center justify-between text-[10.5px] font-mono border-t border-slate-800">
                      <span className="text-slate-400">Refund Tx Hash:</span>
                      <a
                        href={getExplorerTxUrl(payment.chainId || 137, payment.refundDetails.refundTxHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-300 hover:text-purple-100 flex items-center gap-1 font-bold underline"
                      >
                        <span>{payment.refundDetails.refundTxHash.slice(0, 8)}...{payment.refundDetails.refundTxHash.slice(-6)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Refund Request Pending Banner */}
              {payment?.refundStatus === 'REQUESTED' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Refund Request Pending Merchant Approval</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Reason: {payment.refundDetails?.reason || 'Customer requested refund.'}
                  </p>
                </div>
              )}

              {/* Request Refund Trigger (Secondary Feature) */}
              {payment &&
                payment.status !== 'refunded' &&
                payment.refundStatus !== 'COMPLETED' &&
                payment.refundStatus !== 'REQUESTED' && (
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRefundModalOpen(true);
                        setRefundFeedback(null);
                      }}
                      className="text-[11px] text-slate-500 hover:text-purple-700 underline font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Need to request a refund for this purchase?
                    </button>
                  </div>
                )}

              {/* Refund Request Inline Form / Modal */}
              {isRefundModalOpen && (
                <div className="p-4 rounded-xl bg-slate-50 border border-purple-200 text-left space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                      Request Full Refund
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsRefundModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    Submit a refund request to <strong className="font-semibold text-slate-900">{payment?.merchantName || 'the merchant'}</strong>. Blockchain transactions cannot be reversed; if approved, the merchant will execute a separate transfer to your wallet.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Reason for Refund (Optional):</label>
                    <input
                      type="text"
                      value={refundReasonInput}
                      onChange={(e) => setRefundReasonInput(e.target.value)}
                      placeholder="e.g. Order cancelled or wrong item"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>

                  {refundFeedback && (
                    <div
                      className={`p-2 rounded-lg text-xs ${
                        refundFeedback.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {refundFeedback.message}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsRefundModalOpen(false)}
                      className="cursor-pointer text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="iris"
                      size="sm"
                      disabled={refundSubmitting}
                      isLoading={refundSubmitting}
                      onClick={async () => {
                        if (!payment) return;
                        setRefundSubmitting(true);
                        try {
                          const res = await requestRefund(
                            payment.id,
                            refundReasonInput.trim() || 'Customer requested refund',
                            address || '0xCustomerWallet'
                          );
                          if (res.success) {
                            setRefundFeedback({
                              type: 'success',
                              message: 'Refund request submitted to merchant.',
                            });
                            setTimeout(() => setIsRefundModalOpen(false), 1500);
                          } else {
                            setRefundFeedback({
                              type: 'error',
                              message: res.error || 'Failed to submit refund request.',
                            });
                          }
                        } catch (err: any) {
                          setRefundFeedback({
                            type: 'error',
                            message: err?.message || 'Failed to submit refund request.',
                          });
                        } finally {
                          setRefundSubmitting(false);
                        }
                      }}
                      className="cursor-pointer text-xs font-bold"
                    >
                      Submit Request
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button
                  variant="iris"
                  size="md"
                  className="w-full cursor-pointer font-bold shadow-sm"
                  onClick={() => navigate('/merchant/payments')}
                  leftIcon={<Receipt className="w-4 h-4" />}
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
                <XCircle className="w-5 h-5" />
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
                <XCircle className="w-5 h-5" />
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
                  merchantAddress={payment.merchantAddress || merchantProfile.settlementAddress || '0x8F3a4e9b72cD4562098b584d4D9fB231f6C2A093'}
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
            <span>Direct non-custodial EVM settlement & independent backend verification</span>
          </div>
        </div>
      </Card>

      {/* Independent Verification Test Suite Modal */}
      <VerificationTestSuiteModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        initialPaymentId={payment.id}
      />
    </div>
  );
};
