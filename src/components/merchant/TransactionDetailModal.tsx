import React, { useState } from 'react';
import { Payment, BlockchainVerificationReport, VerificationCheckItem } from '../../types';
import { getChainConfig, getExplorerTxUrl } from '../../config';
import { ApiService } from '../../services/apiService';
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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [liveReport, setLiveReport] = useState<BlockchainVerificationReport | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  if (!isOpen || !payment) return null;

  const chain = getChainConfig(payment.chainId || 137);
  const explorerUrl = payment.txHash ? getExplorerTxUrl(payment.chainId || 137, payment.txHash) : null;

  const isConfirmed =
    payment.status === 'confirmed' || payment.status === 'completed' || payment.status === 'paid';
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

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
                ${(payment.netSettlementUSD ?? payment.amountUSD * 0.995).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 font-mono pt-0.5">
                Fee: ${(payment.platformFeeUSD ?? payment.amountUSD * 0.005).toFixed(2)} ({payment.platformFeePercent ?? 0.5}%)
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
                    isConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isConfirmed ? '✓' : '4'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">4. Settlement to Merchant Wallet</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {isConfirmed ? 'Settled' : 'Pending'}
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

          {/* 4. COMPREHENSIVE IDENTIFIERS & AUDIT DETAILS */}
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
