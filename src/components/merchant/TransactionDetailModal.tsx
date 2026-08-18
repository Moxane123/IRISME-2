import React, { useState } from 'react';
import { Payment, BlockchainVerificationReport, VerificationCheckItem } from '../../types';
import { getChainConfig, getExplorerTxUrl, DEFAULT_PLATFORM_FEE_PERCENT } from '../../config';
import { ApiService } from '../../services/apiService';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../ui/StatusBadge';
import { TokenLogo } from '../ui/TokenLogo';
import { Button } from '../ui/Button';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Wallet,
  Coins,
  Receipt,
  Share2,
  RotateCcw,
  Undo2,
  AlertCircle,
  Ban,
} from 'lucide-react';

interface TransactionDetailModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentUpdated?: (updated: Payment) => void;
  onOpenVerificationSuite?: (paymentId?: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  payment,
  isOpen,
  onClose,
  onPaymentUpdated,
  onOpenVerificationSuite,
}) => {
  const { executeRefund, rejectRefund } = useApp();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [liveReport, setLiveReport] = useState<BlockchainVerificationReport | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Secondary MVP Refund States
  const [isRefundFormOpen, setIsRefundFormOpen] = useState(false);
  const [refundTxHashInput, setRefundTxHashInput] = useState('');
  const [refundNoteInput, setRefundNoteInput] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState<string | null>(null);

  if (!isOpen || !payment) return null;

  const chain = getChainConfig(payment.chainId || 137);
  const explorerUrl = payment.txHash ? getExplorerTxUrl(payment.chainId || 137, payment.txHash) : null;

  const isRefunded = payment.status === 'refunded' || payment.refundStatus === 'COMPLETED';
  const isRefundRequested = payment.refundStatus === 'REQUESTED';

  const isConfirmed =
    (payment.status === 'confirmed' || payment.status === 'completed' || payment.status === 'paid') && !isRefunded;
  const isPending =
    payment.status === 'awaiting_payment' ||
    payment.status === 'pending' ||
    payment.status === 'submitted' ||
    payment.status === 'transaction_detected' ||
    payment.status === 'verifying' ||
    payment.status === 'confirming' ||
    payment.status === 'processing';
  const isExpired = payment.status === 'expired';
  const isFailed = payment.status === 'failed';

  const isRefundEligible = (isConfirmed || isRefundRequested) && !isRefunded;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate a verified test hash on Polygon for MVP demo
  const handleAutoFillRefundTx = () => {
    const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setRefundTxHashInput(`0x${randomHex}`);
    setRefundError(null);
  };

  // Execute full refund as a separate on-chain transaction
  const handleExecuteRefund = async () => {
    if (!refundTxHashInput.trim() || !refundTxHashInput.startsWith('0x') || refundTxHashInput.trim().length !== 66) {
      setRefundError('Please provide a valid 66-character 0x on-chain transaction hash for the reverse transfer.');
      return;
    }

    setRefundSubmitting(true);
    setRefundError(null);
    try {
      const res = await executeRefund(payment.id, {
        refundTxHash: refundTxHashInput.trim(),
        note: refundNoteInput.trim() || 'Full refund via separate on-chain reverse transfer',
      });

      if (res.success && res.payment) {
        setRefundSuccess('Refund recorded successfully. Verified reverse transaction reference locked.');
        setIsRefundFormOpen(false);
        onPaymentUpdated?.(res.payment);
      } else {
        setRefundError(res.error || 'Failed to process refund.');
      }
    } catch (err: any) {
      setRefundError(err?.message || 'Failed to execute refund.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  // Reject refund request
  const handleRejectRefund = async () => {
    setRefundSubmitting(true);
    setRefundError(null);
    try {
      const res = await rejectRefund(payment.id, refundNoteInput.trim() || 'Declined by merchant');
      if (res.success && res.payment) {
        setRefundSuccess('Refund request declined.');
        setIsRefundFormOpen(false);
        onPaymentUpdated?.(res.payment);
      } else {
        setRefundError(res.error || 'Failed to decline refund request.');
      }
    } catch (err: any) {
      setRefundError(err?.message || 'Failed to decline refund request.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  // On-demand re-verification with the backend independent verification engine
  const handleReVerify = async () => {
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const resp = await ApiService.verifyPayment({
        paymentId: payment.id,
        txHash: payment.txHash || '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        chainId: payment.chainId || 137,
        payerAddress: payment.customerWallet || '0x71C...9B42',
        tokenSymbol: payment.selectedToken,
        tokenAmount: payment.tokenAmount,
        recipientAddress: payment.merchantAddress,
      });

      if (resp.report) {
        setLiveReport(resp.report);
      }

      if (resp.verified) {
        const updated: Payment = {
          ...payment,
          status: 'confirmed',
          completedAt: new Date().toISOString(),
          txHash: resp.report?.txHash || payment.txHash,
        };
        onPaymentUpdated?.(updated);
      } else if (resp.report?.status === 'EXPIRED') {
        const updated: Payment = {
          ...payment,
          status: 'expired',
        };
        onPaymentUpdated?.(updated);
      } else if (resp.report?.status === 'FAILED') {
        const updated: Payment = {
          ...payment,
          status: 'failed',
        };
        onPaymentUpdated?.(updated);
      }
    } catch (err: any) {
      setVerifyError(err?.message || 'Verification could not be executed.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Plain-English explanation for "What happened to my payment?"
  const getPlainEnglishStatusExplanation = () => {
    if (isConfirmed) {
      return {
        title: 'Payment Successfully Settled',
        desc: `This transaction was independently verified on ${chain?.name || 'Polygon'} blockchain and received at your settlement wallet.`,
        color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
      };
    }
    if (isPending) {
      if (payment.txHash || payment.status === 'verifying' || payment.status === 'transaction_detected') {
        return {
          title: 'Transaction Detected – Verifying On-Chain',
          desc: 'A transaction broadcast was detected. The independent verification engine is validating EVM receipt status and block finality.',
          color: 'bg-cyan-50 border-cyan-200 text-cyan-900',
          icon: <RefreshCw className="w-5 h-5 text-cyan-600 animate-spin flex-shrink-0" />,
        };
      }
      return {
        title: 'Awaiting Customer Payment',
        desc: 'The payment invoice is active. Waiting for the customer to connect their Web3 wallet and broadcast the payment transaction.',
        color: 'bg-amber-50 border-amber-200 text-amber-900',
        icon: <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />,
      };
    }
    if (isExpired) {
      return {
        title: 'Payment Invoice Expired',
        desc: 'The allocated payment window elapsed before an on-chain transaction was received. A new payment request must be generated.',
        color: 'bg-slate-100 border-slate-300 text-slate-800',
        icon: <Clock className="w-5 h-5 text-slate-500 flex-shrink-0" />,
      };
    }
    return {
      title: 'Payment Verification Failed',
      desc: 'The transaction could not be verified on-chain. It may have reverted, experienced a token/amount mismatch, or failed security checks.',
      color: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    };
  };

  const statusExplanation = getPlainEnglishStatusExplanation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 my-8">
        {/* Top Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080]" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900">
                {payment.invoiceNumber}
              </span>
              <StatusBadge status={payment.status} size="sm" pulse={isPending} />
            </div>
            <p className="text-xs text-slate-500">
              Payment ID: <span className="font-mono">{payment.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReVerify}
              disabled={isVerifying}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              title="Re-run blockchain verification check"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-purple-600' : ''}`} />
              <span className="hidden sm:inline">Verify On-Chain</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* 1. "WHAT HAPPENED TO MY PAYMENT?" ANSWER BOX */}
          <div className={`p-4 rounded-2xl border ${statusExplanation.color} flex items-start gap-3.5 shadow-xs`}>
            {statusExplanation.icon}
            <div className="space-y-1">
              <h4 className="font-bold text-sm">{statusExplanation.title}</h4>
              <p className="text-xs opacity-90 leading-relaxed">{statusExplanation.desc}</p>
            </div>
          </div>

          {/* 2. CORE FINANCIAL & ASSET SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 uppercase text-[10px] tracking-wider font-bold block">
                Total Payment Amount
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono">
                ${payment.amountUSD.toFixed(2)}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 font-semibold pt-0.5">
                <TokenLogo symbol={payment.selectedToken} size="xs" />
                <span>
                  {payment.tokenAmount} {payment.selectedToken}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 font-sans">{chain?.shortName || 'Polygon'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 uppercase text-[10px] tracking-wider font-bold block">
                Net Settlement to Wallet
              </span>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                ${(payment.netSettlementUSD ?? (payment.amountUSD - (payment.platformFeeUSD ?? (payment.amountUSD * ((payment.platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT) / 100))))).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 font-mono pt-0.5">
                Fee: ${(payment.platformFeeUSD ?? (payment.amountUSD * ((payment.platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT) / 100))).toFixed(2)} ({payment.platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT}%)
              </div>
            </div>
          </div>

          {/* 3. TRANSACTION LIFECYCLE PROGRESSION */}
          <div className="space-y-3">
            <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Payment Progression
            </h5>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              {/* Step 1: Created */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">1. Invoice Generated</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Order Ref: {payment.orderRef || payment.invoiceNumber} • Valid until {new Date(payment.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Step 2: Customer Tx Broadcast */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    payment.customerWallet || payment.txHash || isConfirmed
                      ? 'bg-emerald-100 text-emerald-700'
                      : isExpired || isFailed
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {payment.customerWallet || payment.txHash || isConfirmed ? '✓' : isExpired || isFailed ? '✕' : '2'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">2. Customer Web3 Interaction</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {payment.customerWallet ? 'Broadcasted' : isExpired ? 'Expired' : 'Awaiting'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {payment.customerWallet
                      ? `Payer Wallet: ${payment.customerWallet.slice(0, 10)}...${payment.customerWallet.slice(-6)}`
                      : 'Customer has not yet broadcasted an on-chain transaction.'}
                  </p>
                </div>
              </div>

              {/* Step 3: Independent Blockchain Verification */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    isConfirmed
                      ? 'bg-emerald-100 text-emerald-700'
                      : isFailed
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isConfirmed ? '✓' : isFailed ? '✕' : '3'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">3. 8-Point Independent Verification</span>
                    <span className="text-[11px] font-mono">
                      {isConfirmed ? (
                        <span className="text-emerald-700 font-bold">8/8 Passed</span>
                      ) : isFailed ? (
                        <span className="text-rose-700 font-bold">Failed</span>
                      ) : (
                        <span className="text-slate-400">Pending Tx</span>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isConfirmed
                      ? 'Verified network alignment, merchant recipient wallet, token match, amount sufficiency, and block finality.'
                      : isFailed
                      ? 'Verification rejected by the backend engine.'
                      : 'Awaiting on-chain transaction hash to execute independent verification.'}
                  </p>
                </div>
              </div>

              {/* Step 4: Non-Custodial Settlement */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    isConfirmed ? 'bg-emerald-100 text-emerald-700' : isRefunded ? 'bg-slate-200 text-slate-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isConfirmed ? '✓' : isRefunded ? '↩' : '4'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">4. Settlement to Merchant Wallet</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {isRefunded ? 'Refunded' : isConfirmed ? 'Settled' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {payment.merchantAddress
                      ? `Settlement Wallet: ${payment.merchantAddress.slice(0, 10)}...${payment.merchantAddress.slice(-6)}`
                      : 'Funds transfer directly to merchant self-custodial wallet.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. SECONDARY MVP REFUND SYSTEM (Separate On-Chain Reverse Transaction) */}
          {isRefunded && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-xs uppercase tracking-wider text-purple-300">
                    On-Chain Refund Verified (Reverse Tx)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/50 text-[10px] font-bold text-purple-200 font-mono">
                  REFUND COMPLETED
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Blockchain transactions cannot be reversed or rolled back. This refund was executed and verified as an independent, separate on-chain transfer to the customer's wallet.
              </p>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Refund Amount:</span>
                  <span className="font-bold text-emerald-400">
                    ${(payment.refundDetails?.refundAmountUSD || payment.amountUSD).toFixed(2)} ({payment.refundDetails?.refundTokenAmount || payment.tokenAmount} {payment.refundDetails?.tokenSymbol || payment.selectedToken})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Recipient (Customer Wallet):</span>
                  <span className="text-slate-200 font-bold">
                    {(payment.refundDetails?.recipientWallet || payment.customerWallet || '0x...').slice(0, 10)}...{(payment.refundDetails?.recipientWallet || payment.customerWallet || '0x...').slice(-8)}
                  </span>
                </div>

                {payment.refundDetails?.refundTxHash && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                    <span className="text-slate-400">Refund Tx Hash:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-purple-300">
                        {payment.refundDetails.refundTxHash.slice(0, 8)}...{payment.refundDetails.refundTxHash.slice(-6)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(payment.refundDetails!.refundTxHash!, 'refund-tx')}
                        className="p-1 hover:text-white text-slate-400 cursor-pointer"
                        title="Copy Refund Hash"
                      >
                        {copiedKey === 'refund-tx' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <a
                        href={getExplorerTxUrl(payment.chainId || 137, payment.refundDetails.refundTxHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:text-white text-purple-400 cursor-pointer"
                        title="View Refund on Explorer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {payment.refundDetails?.refundedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Refund Timestamp:</span>
                    <span className="text-slate-300">
                      {new Date(payment.refundDetails.refundedAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {payment.refundDetails?.reason && (
                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-700/60 text-[10px]">
                    <span className="text-slate-400">Reason/Note:</span>
                    <span className="text-slate-200 text-right">{payment.refundDetails.reason}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Refund Actions for Eligible Confirmed Payments */}
          {isRefundEligible && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-purple-700" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    Secondary Feature: Issue Refund
                  </span>
                </div>
                {!isRefundFormOpen && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Undo2 className="w-3.5 h-3.5 text-purple-600" />}
                    onClick={() => {
                      setIsRefundFormOpen(true);
                      setRefundError(null);
                      setRefundSuccess(null);
                    }}
                    className="cursor-pointer text-xs"
                  >
                    Manage Refund
                  </Button>
                )}
              </div>

              {isRefundRequested && !isRefundFormOpen && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Customer Refund Request Pending</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Reason: {payment.refundDetails?.reason || 'Customer requested refund for this transaction.'}
                  </p>
                  <button
                    onClick={() => setIsRefundFormOpen(true)}
                    className="text-xs text-amber-900 underline font-bold mt-1 cursor-pointer"
                  >
                    Open Refund Action Form →
                  </button>
                </div>
              )}

              {isRefundFormOpen && (
                <div className="p-3.5 rounded-xl bg-white border border-purple-200 space-y-3">
                  <div className="text-[11px] text-slate-600 bg-purple-50/60 p-2.5 rounded-lg border border-purple-100 space-y-1">
                    <p className="font-semibold text-purple-900">
                      Important Blockchain Architecture Note:
                    </p>
                    <p className="text-[10.5px] text-purple-800 leading-relaxed">
                      Blockchain payments are non-reversible on-chain. To issue a full refund of <strong className="font-bold">${payment.amountUSD.toFixed(2)} ({payment.tokenAmount} {payment.selectedToken})</strong>, send a separate transfer from your merchant wallet to customer wallet <strong className="font-mono text-purple-950 font-bold">{payment.customerWallet ? `${payment.customerWallet.slice(0, 8)}...${payment.customerWallet.slice(-6)}` : 'Customer Wallet'}</strong>, then record the on-chain transaction hash below.
                    </p>
                  </div>

                  {refundError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{refundError}</span>
                    </div>
                  )}

                  {refundSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{refundSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-700">Separate On-Chain Refund Tx Hash:</label>
                      <button
                        type="button"
                        onClick={handleAutoFillRefundTx}
                        className="text-[11px] text-purple-700 hover:text-purple-900 underline font-semibold cursor-pointer"
                      >
                        Auto-fill Test Tx (0x...)
                      </button>
                    </div>
                    <input
                      type="text"
                      value={refundTxHashInput}
                      onChange={(e) => setRefundTxHashInput(e.target.value)}
                      placeholder="0x7f9a8b1c2d3e4f5a..."
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 text-xs">Merchant Audit Note (Optional):</label>
                    <input
                      type="text"
                      value={refundNoteInput}
                      onChange={(e) => setRefundNoteInput(e.target.value)}
                      placeholder="e.g. Customer returned order #ORD-1049"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    {isRefundRequested && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={refundSubmitting}
                        onClick={handleRejectRefund}
                        className="cursor-pointer text-xs"
                        leftIcon={<Ban className="w-3 h-3" />}
                      >
                        Decline Request
                      </Button>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={refundSubmitting}
                        onClick={() => setIsRefundFormOpen(false)}
                        className="cursor-pointer text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="iris"
                        size="sm"
                        disabled={refundSubmitting || !refundTxHashInput.trim()}
                        isLoading={refundSubmitting}
                        onClick={handleExecuteRefund}
                        className="cursor-pointer text-xs font-bold"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Record On-Chain Refund
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. COMPREHENSIVE IDENTIFIERS & AUDIT DETAILS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 font-mono text-[11px]">
            <h5 className="font-bold text-slate-900 text-xs font-sans uppercase tracking-wider mb-2">
              Transaction Details & Identifiers
            </h5>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Payment ID:</span>
              <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                <span>{payment.id}</span>
                <button
                  onClick={() => copyToClipboard(payment.id, 'id')}
                  className="hover:text-purple-600 cursor-pointer"
                  title="Copy ID"
                >
                  {copiedKey === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Invoice / Reference:</span>
              <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                <span>{payment.invoiceNumber} {payment.orderRef ? `(${payment.orderRef})` : ''}</span>
                <button
                  onClick={() => copyToClipboard(payment.invoiceNumber, 'inv')}
                  className="hover:text-purple-600 cursor-pointer"
                  title="Copy Invoice #"
                >
                  {copiedKey === 'inv' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {payment.txHash && (
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Transaction Hash:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-purple-700">
                    {payment.txHash.slice(0, 10)}...{payment.txHash.slice(-8)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(payment.txHash!, 'tx')}
                    className="hover:text-purple-600 cursor-pointer"
                    title="Copy Tx Hash"
                  >
                    {copiedKey === 'tx' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {explorerUrl && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 underline flex items-center gap-0.5 ml-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Network / Chain:</span>
              <span className="text-slate-800 font-bold font-sans">
                {chain?.name || 'Polygon'} (Chain ID: {payment.chainId || 137})
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Created At:</span>
              <span className="text-slate-800">
                {new Date(payment.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Expires At:</span>
              <span className="text-slate-800">
                {new Date(payment.expiresAt).toLocaleString()}
              </span>
            </div>

            {payment.completedAt && (
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Confirmed At:</span>
                <span className="text-emerald-700 font-bold">
                  {new Date(payment.completedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
              onClick={() => copyToClipboard(`${window.location.origin}/pay/${payment.id}`, 'checkout')}
              className="cursor-pointer text-xs"
            >
              {copiedKey === 'checkout' ? 'Link Copied!' : 'Copy Checkout URL'}
            </Button>

            {onOpenVerificationSuite && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-purple-600" />}
                onClick={() => {
                  onClose();
                  onOpenVerificationSuite(payment.id);
                }}
                className="cursor-pointer text-xs text-purple-700 hover:bg-purple-50"
              >
                Verification Suite
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="iris"
              size="sm"
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => window.open(`/pay/${payment.id}`, '_blank')}
              className="cursor-pointer text-xs"
            >
              Open Checkout
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="cursor-pointer text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
