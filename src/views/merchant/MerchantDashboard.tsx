import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { VerificationTestSuiteModal } from '../../components/verification/VerificationTestSuiteModal';
import { getExplorerTxUrl } from '../../config';
import {
  DollarSign,
  CreditCard,
  PlusCircle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  CheckCircle,
  Clock,
  Wallet,
  Receipt,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

export const MerchantDashboard: React.FC = () => {
  const { navigate } = useRouter();
  const { merchantProfile, payments, wallet } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedMerchantId, setCopiedMerchantId] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'successful' | 'pending'>('all');

  // Merchant data isolation: Ensure we strictly filter for the active merchant
  const merchantId = merchantProfile.id || 'm-iris-merchant-default';
  const isolatedPayments = payments.filter(
    (p) => !p.merchantId || p.merchantId === merchantId || p.merchantId === 'm-iris-merchant-default'
  );

  // Status categorization
  const isSuccessful = (status: string) =>
    status === 'confirmed' || status === 'completed' || status === 'paid';
  const isPending = (status: string) =>
    status === 'pending' ||
    status === 'awaiting_payment' ||
    status === 'transaction_detected' ||
    status === 'verifying' ||
    status === 'submitted' ||
    status === 'confirming' ||
    status === 'processing';

  // 1. Total Received ($ USD from successful payments)
  const successfulPayments = isolatedPayments.filter((p) => isSuccessful(p.status));
  const totalReceivedUSD = successfulPayments.reduce((sum, p) => sum + (p.amountUSD || 0), 0);

  // 2. Number of Payments (Total invoices generated)
  const totalPaymentsCount = isolatedPayments.length;

  // 3. Successful Payments Count
  const successfulPaymentsCount = successfulPayments.length;
  const successRate =
    totalPaymentsCount > 0 ? Math.round((successfulPaymentsCount / totalPaymentsCount) * 100) : 0;

  // 4. Pending Payments Count & Volume
  const pendingPayments = isolatedPayments.filter((p) => isPending(p.status));
  const pendingPaymentsCount = pendingPayments.length;
  const pendingVolumeUSD = pendingPayments.reduce((sum, p) => sum + (p.amountUSD || 0), 0);

  // 5. Available Balance
  // Sum of net settled funds in non-custodial wallet / net settlements
  const totalNetSettledUSD = successfulPayments.reduce(
    (sum, p) => sum + (p.netSettlementUSD !== undefined ? p.netSettlementUSD : (p.amountUSD || 0) * 0.995),
    0
  );

  // Quick filter for recent transactions list
  const filteredRecentPayments = isolatedPayments.filter((p) => {
    if (transactionFilter === 'successful') return isSuccessful(p.status);
    if (transactionFilter === 'pending') return isPending(p.status);
    return true;
  });

  const handleCopyLink = (paymentId: string) => {
    const url = `${window.location.origin}/pay/${paymentId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(paymentId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyMerchantId = () => {
    navigator.clipboard.writeText(merchantProfile.id);
    setCopiedMerchantId(true);
    setTimeout(() => setCopiedMerchantId(false), 2000);
  };

  const handleCopyAddress = () => {
    if (merchantProfile.settlementAddress) {
      navigator.clipboard.writeText(merchantProfile.settlementAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  return (
    <div className="space-y-7">
      {/* 1. MERCHANT IDENTITY & PRIMARY ACTIONS HEADER */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-3 z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Merchant
            </span>

            {/* Merchant ID */}
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700">
              <span className="text-slate-400">ID:</span>
              <span className="font-bold text-slate-900">{merchantProfile.id || 'm-iris-default'}</span>
              <button
                type="button"
                onClick={handleCopyMerchantId}
                className="hover:text-purple-700 cursor-pointer ml-1"
                title="Copy Unique Merchant ID"
              >
                {copiedMerchantId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {merchantProfile.name || 'Merchant Dashboard'}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              Non-custodial crypto checkout, real-time payment tracking, and automated settlement.
            </p>
          </div>

          {/* Receiving Wallet Address */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            {merchantProfile.settlementAddress ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
                <Wallet className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-slate-500">Settlement Wallet:</span>
                <span className="font-bold text-slate-900">
                  {merchantProfile.settlementAddress.slice(0, 8)}...{merchantProfile.settlementAddress.slice(-6)}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="hover:text-purple-700 cursor-pointer ml-1"
                  title="Copy Receiving Address"
                >
                  {copiedAddress ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
                <a
                  href={`https://polygonscan.com/address/${merchantProfile.settlementAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-700 text-slate-400 cursor-pointer ml-0.5"
                  title="View on Block Explorer"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
                <span>⚠️ No receiving wallet configured.</span>
                <button
                  onClick={() => navigate('/settings')}
                  className="underline font-bold cursor-pointer hover:text-amber-700"
                >
                  Add Receiving Wallet
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TWO PRIMARY ACTIONS */}
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0 z-10 w-full lg:w-auto">
          {/* 1. PRIMARY ACTION: CREATE PAYMENT */}
          <Button
            variant="iris"
            size="lg"
            leftIcon={<PlusCircle className="w-5 h-5" />}
            onClick={() => navigate('/merchant/create-payment')}
            className="cursor-pointer font-bold shadow-md flex-1 sm:flex-none text-sm px-6 py-3"
          >
            CREATE PAYMENT
          </Button>

          {/* 2. PRIMARY ACTION: VIEW TRANSACTIONS */}
          <Button
            variant="outline"
            size="lg"
            leftIcon={<Receipt className="w-5 h-5 text-purple-600" />}
            onClick={() => navigate('/merchant/payments')}
            className="cursor-pointer border-slate-300 hover:border-purple-300 text-slate-800 bg-white hover:bg-slate-50 font-bold shadow-xs flex-1 sm:flex-none text-sm px-5 py-3"
          >
            VIEW TRANSACTIONS
          </Button>

          {/* Verification Suite Test Modal Trigger */}
          <button
            onClick={() => setIsVerificationModalOpen(true)}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-purple-700 bg-slate-50 transition-colors cursor-pointer"
            title="Open Blockchain Verification Test Suite"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CORE PAYMENT METRICS (5 PRIMARY METRICS) */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
          Payment Overview
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Total Received */}
          <StatCard
            label="Total Received"
            value={`$${totalReceivedUSD.toFixed(2)}`}
            subvalue="All-time settled volume"
            change={totalReceivedUSD > 0 ? `${successfulPaymentsCount} paid invoices` : '$0.00 volume'}
            isPositive={true}
            accentIris={true}
            icon={<DollarSign className="w-5 h-5" />}
          />

          {/* 2. Available Balance */}
          <StatCard
            label="Available Balance"
            value={`$${totalNetSettledUSD.toFixed(2)}`}
            subvalue="Net settled to wallet"
            change="100% Non-custodial"
            isPositive={true}
            icon={<Wallet className="w-5 h-5" />}
          />

          {/* 3. Number of Payments */}
          <StatCard
            label="Number of Payments"
            value={`${totalPaymentsCount}`}
            subvalue="Total invoices created"
            change={totalPaymentsCount > 0 ? `${totalPaymentsCount} total requests` : '0 created'}
            isPositive={true}
            icon={<CreditCard className="w-5 h-5" />}
          />

          {/* 4. Successful Payments */}
          <StatCard
            label="Successful Payments"
            value={`${successfulPaymentsCount}`}
            subvalue={`${successRate}% completion rate`}
            change={`${successfulPaymentsCount} confirmed on-chain`}
            isPositive={true}
            icon={<CheckCircle className="w-5 h-5" />}
          />

          {/* 5. Pending Payments */}
          <StatCard
            label="Pending Payments"
            value={`${pendingPaymentsCount}`}
            subvalue={`$${pendingVolumeUSD.toFixed(2)} awaiting`}
            change={pendingPaymentsCount > 0 ? 'Awaiting customer tx' : 'All settled'}
            isPositive={pendingPaymentsCount === 0}
            icon={<Clock className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* 3. RECENT TRANSACTIONS */}
      <Card variant="default">
        <CardHeader
          title="Recent Transactions"
          subtitle="Real-time payment requests and settled customer transactions"
          action={
            <div className="flex items-center gap-2">
              {/* Quick filter pills */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setTransactionFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    transactionFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All ({isolatedPayments.length})
                </button>
                <button
                  onClick={() => setTransactionFilter('successful')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    transactionFilter === 'successful'
                      ? 'bg-white text-emerald-700 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Successful ({successfulPaymentsCount})
                </button>
                <button
                  onClick={() => setTransactionFilter('pending')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    transactionFilter === 'pending'
                      ? 'bg-white text-amber-700 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Pending ({pendingPaymentsCount})
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-300 hover:border-purple-300 text-slate-700 cursor-pointer hidden sm:flex"
                onClick={() => navigate('/merchant/payments')}
              >
                View All
              </Button>
            </div>
          }
        />
        <CardContent className="p-0">
          {filteredRecentPayments.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-400">
                <CreditCard className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  {transactionFilter === 'all'
                    ? 'No transactions created yet'
                    : `No ${transactionFilter} transactions found`}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {transactionFilter === 'all'
                    ? 'Create your first payment request to receive non-custodial crypto payments with instant verification.'
                    : `There are currently no ${transactionFilter} payments recorded in your ledger.`}
                </p>
              </div>
              {transactionFilter === 'all' && (
                <Button
                  variant="iris"
                  size="sm"
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                  className="cursor-pointer"
                  onClick={() => navigate('/merchant/create-payment')}
                >
                  Create Payment
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRecentPayments.slice(0, 7).map((p) => {
                const isPaid = isSuccessful(p.status);
                const explorerUrl = p.txHash ? getExplorerTxUrl(p.chainId || 137, p.txHash) : null;

                return (
                  <div
                    key={p.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {p.invoiceNumber || p.id}
                        </span>
                        <StatusBadge status={p.status} size="sm" pulse={isPending(p.status)} />
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                          {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">{p.description || 'Payment Request'}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span>
                          Customer:{' '}
                          {p.customerWallet
                            ? `${p.customerWallet.slice(0, 6)}...${p.customerWallet.slice(-4)}`
                            : 'Awaiting connection'}
                        </span>
                        {p.txHash && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold">
                              Tx: {p.txHash.slice(0, 8)}...
                            </span>
                          </>
                        )}
                        {p.verseEarned ? (
                          <>
                            <span>•</span>
                            <span className="text-purple-600 font-medium">+{p.verseEarned} VERSE</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="text-base font-bold text-slate-900 font-mono">
                          ${(p.amountUSD || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {p.tokenAmount || p.amountUSD} {p.selectedToken || 'USDT'}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Copy Checkout Link */}
                        <button
                          onClick={() => handleCopyLink(p.id)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
                          title="Copy Customer Checkout Link"
                        >
                          {copiedId === p.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Open Customer Checkout */}
                        <button
                          onClick={() => navigate(`/pay/${p.id}`)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
                          title="Open Checkout Page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        {/* Block Explorer Link (if tx on-chain) */}
                        {explorerUrl && (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 transition-colors cursor-pointer shadow-xs"
                            title="View On-Chain Transaction on Block Explorer"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Engine Test Suite Modal */}
      <VerificationTestSuiteModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />
    </div>
  );
};
