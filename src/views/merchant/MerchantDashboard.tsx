import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TokenLogo } from '../../components/ui/TokenLogo';
import { SettleModal } from '../../components/merchant/SettleModal';
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
  History,
  CheckCircle2,
} from 'lucide-react';

export const MerchantDashboard: React.FC = () => {
  const { navigate } = useRouter();
  const {
    merchantProfile,
    payments,
    settlements,
    merchantBalance,
    refreshSettlementBalance,
  } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedMerchantId, setCopiedMerchantId] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'successful' | 'pending' | 'settlements'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);


  // Merchant data isolation
  const merchantId = merchantProfile.id || 'm-iris-merchant-default';
  const isolatedPayments = payments.filter(
    (p) => !p.merchantId || p.merchantId === merchantId || p.merchantId === 'm-iris-merchant-default'
  );

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

  const successfulPayments = isolatedPayments.filter((p) => isSuccessful(p.status));
  const totalReceivedUSD = successfulPayments.reduce((sum, p) => sum + (p.amountUSD || 0), 0);
  const totalPaymentsCount = isolatedPayments.length;
  const successfulPaymentsCount = successfulPayments.length;
  const pendingPayments = isolatedPayments.filter((p) => isPending(p.status));
  const pendingPaymentsCount = pendingPayments.length;
  const pendingVolumeUSD = pendingPayments.reduce((sum, p) => sum + (p.amountUSD || 0), 0);

  const availableBalanceUSD = merchantBalance.availableBalanceUSD;
  const destinationAddress = merchantProfile.settlementAddress || '0x8F3a4e9b72cD4562098b584d4D9fB231f6C2A093';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSettlementBalance();
    setTimeout(() => setIsRefreshing(false), 500);
  };

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
    if (destinationAddress) {
      navigator.clipboard.writeText(destinationAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  return (
    <div className="space-y-7">
      {/* 1. MERCHANT IDENTITY & PRIMARY ACTIONS HEADER */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-3 z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
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
                {copiedMerchantId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {merchantProfile.name || 'Merchant Dashboard'}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              Non-custodial crypto checkout, real-time payment tracking, and automated settlement to your verified wallet.
            </p>
          </div>

          {/* Settlement / Receiving Wallet Badge */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700">
              <Wallet className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
              <span className="text-slate-500 font-sans">Settlement Destination:</span>
              <span className="font-bold text-slate-900">
                {destinationAddress.slice(0, 8)}...{destinationAddress.slice(-6)}
              </span>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="hover:text-purple-700 cursor-pointer ml-1"
                title="Copy Receiving Address"
              >
                {copiedAddress ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
              <a
                href={`https://polygonscan.com/address/${destinationAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-purple-700 text-slate-400 cursor-pointer ml-0.5"
                title="View on Polygonscan"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0 z-10 w-full lg:w-auto">
          {/* 1. Settle Funds Action */}
          <Button
            variant="outline"
            size="lg"
            leftIcon={<ArrowUpRight className="w-5 h-5 text-emerald-600" />}
            onClick={() => setIsSettleModalOpen(true)}
            className="cursor-pointer border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-900 font-bold shadow-xs flex-1 sm:flex-none text-sm px-5 py-3"
          >
            SETTLE / WITHDRAW
          </Button>

          {/* 2. Create Payment Action */}
          <Button
            variant="iris"
            size="lg"
            leftIcon={<PlusCircle className="w-5 h-5" />}
            onClick={() => navigate('/merchant/create-payment')}
            className="cursor-pointer font-bold shadow-md flex-1 sm:flex-none text-sm px-6 py-3"
          >
            CREATE PAYMENT
          </Button>

          {/* 3. View Transactions Action */}
          <Button
            variant="outline"
            size="lg"
            leftIcon={<Receipt className="w-5 h-5 text-purple-600" />}
            onClick={() => navigate('/merchant/payments')}
            className="cursor-pointer border-slate-300 hover:border-purple-300 text-slate-800 bg-white hover:bg-slate-50 font-bold shadow-xs flex-1 sm:flex-none text-sm px-5 py-3"
          >
            TRANSACTIONS
          </Button>
        </div>
      </div>

      {/* 2. CORE PAYMENT & SETTLEMENT METRICS */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Settlement & Payment Overview
          </div>
          <button
            onClick={handleRefresh}
            className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Balances
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* 1. Available Balance */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 relative overflow-hidden shadow-xs space-y-2">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Available Balance</span>
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              ${availableBalanceUSD.toFixed(2)}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-emerald-700 font-semibold">100% Non-custodial</span>
              <button
                onClick={() => setIsSettleModalOpen(true)}
                disabled={availableBalanceUSD <= 0}
                className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950 cursor-pointer disabled:opacity-40"
              >
                Withdraw Funds →
              </button>
            </div>
          </div>

          {/* 2. Pending Balance */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 relative overflow-hidden shadow-xs space-y-2">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Balance</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              ${pendingVolumeUSD.toFixed(2)}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold pt-1">
              {pendingPaymentsCount} awaiting confirmation
            </div>
          </div>

          {/* 3. Total Received Volume */}
          <StatCard
            label="Total Received"
            value={`$${totalReceivedUSD.toFixed(2)}`}
            subvalue="All-time settled volume"
            change={totalReceivedUSD > 0 ? `${successfulPaymentsCount} paid invoices` : '$0.00 volume'}
            isPositive={true}
            icon={<DollarSign className="w-5 h-5" />}
          />

          {/* 4. Number of Payments */}
          <StatCard
            label="Number of Payments"
            value={`${totalPaymentsCount}`}
            subvalue="Total invoices created"
            change={totalPaymentsCount > 0 ? `${totalPaymentsCount} total requests` : '0 created'}
            isPositive={true}
            icon={<CreditCard className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* 3. RECENT ACTIVITY & SETTLEMENT HISTORY */}
      <Card variant="default">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Activity & Settlement Ledger</h3>
            <p className="text-xs text-slate-500">Live feed of customer payments and non-custodial wallet payouts</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setTransactionFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  transactionFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({isolatedPayments.length})
              </button>
              <button
                onClick={() => setTransactionFilter('successful')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  transactionFilter === 'successful' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Confirmed ({successfulPaymentsCount})
              </button>
              <button
                onClick={() => setTransactionFilter('pending')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  transactionFilter === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({pendingPaymentsCount})
              </button>
              <button
                onClick={() => setTransactionFilter('settlements')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  transactionFilter === 'settlements' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Settlements ({settlements.length})
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/merchant/payments')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs font-semibold text-purple-700 cursor-pointer hidden md:flex"
            >
              All Transactions
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {transactionFilter === 'settlements' ? (
            /* Settlement History View */
            <div className="divide-y divide-slate-100">
              {settlements.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <History className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No settlement withdrawals yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When you withdraw available funds to your verified wallet, settlement records with on-chain hashes will appear here.
                  </p>
                </div>
              ) : (
                settlements.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{s.id}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {s.status}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(s.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">{s.note || 'Non-custodial settlement'}</p>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Destination: {s.destinationAddress.slice(0, 8)}...{s.destinationAddress.slice(-6)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="text-base font-bold text-emerald-700 font-mono">
                          ${s.amountUSD.toFixed(2)} USD
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {s.tokenAmount} {s.tokenSymbol}
                        </div>
                      </div>

                      {s.txHash && (
                        <a
                          href={`https://polygonscan.com/tx/${s.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 transition-colors cursor-pointer shadow-2xs"
                          title="View on Polygonscan"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Payments List View */
            <div className="divide-y divide-slate-100">
              {(transactionFilter === 'all'
                ? isolatedPayments
                : transactionFilter === 'successful'
                ? isolatedPayments.filter((p) => isSuccessful(p.status))
                : isolatedPayments.filter((p) => isPending(p.status))
              ).length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No payment requests found</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click "Create Payment" to generate an on-chain checkout request for your customers.
                  </p>
                </div>
              ) : (
                (transactionFilter === 'all'
                  ? isolatedPayments
                  : transactionFilter === 'successful'
                  ? isolatedPayments.filter((p) => isSuccessful(p.status))
                  : isolatedPayments.filter((p) => isPending(p.status))
                )
                  .slice(0, 8)
                  .map((p) => {
                    const explorerUrl = p.txHash ? getExplorerTxUrl(p.chainId || 137, p.txHash) : null;
                    return (
                      <div
                        key={p.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {p.invoiceNumber}
                            </span>
                            <StatusBadge status={p.status} size="sm" pulse={isPending(p.status)} />
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(p.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              •{' '}
                              {new Date(p.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
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
                            <button
                              onClick={() => handleCopyLink(p.id)}
                              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
                              title="Copy Customer Checkout Link"
                            >
                              {copiedId === p.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-slate-400" />
                              )}
                            </button>

                            <button
                              onClick={() => navigate(`/pay/${p.id}`)}
                              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
                              title="Open Checkout Page"
                            >
                              <ExternalLink className="w-4 h-4 text-slate-500" />
                            </button>

                            {explorerUrl && (
                              <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 transition-colors cursor-pointer shadow-2xs"
                                title="View On-Chain Transaction on Block Explorer"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settle / Withdrawal Modal */}
      <SettleModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
      />
    </div>
  );
};

