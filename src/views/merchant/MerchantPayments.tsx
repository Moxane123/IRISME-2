import React, { useState, useMemo } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TokenLogo } from '../../components/ui/TokenLogo';
import { Payment } from '../../types';
import { getChainConfig, getExplorerTxUrl } from '../../config';
import { TransactionDetailModal } from '../../components/merchant/TransactionDetailModal';
import { VerificationTestSuiteModal } from '../../components/verification/VerificationTestSuiteModal';
import {
  Search,
  PlusCircle,
  Copy,
  Check,
  ExternalLink,
  CreditCard,
  Calendar,
  Filter,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ChevronRight,
  Info,
} from 'lucide-react';

export const MerchantPayments: React.FC = () => {
  const { navigate } = useRouter();
  const { payments, merchantProfile, updatePaymentStatus } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'failed' | 'expired'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [tokenFilter, setTokenFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Detail Modal State
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationInitialId, setVerificationInitialId] = useState<string | undefined>(undefined);

  // Merchant data isolation
  const merchantId = merchantProfile.id || 'm-iris-merchant-default';
  const isolatedPayments = useMemo(() => {
    return payments.filter(
      (p) => !p.merchantId || p.merchantId === merchantId || p.merchantId === 'm-iris-merchant-default'
    );
  }, [payments, merchantId]);

  // Helpers for Status Categorization
  const isConfirmed = (status: string) =>
    status === 'confirmed' || status === 'completed' || status === 'paid';
  const isPending = (status: string) =>
    status === 'pending' ||
    status === 'awaiting_payment' ||
    status === 'transaction_detected' ||
    status === 'verifying' ||
    status === 'submitted' ||
    status === 'confirming' ||
    status === 'processing';
  const isExpired = (status: string) => status === 'expired';
  const isFailed = (status: string) => status === 'failed';

  // Filtered & Searched Payments
  const filteredPayments = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return isolatedPayments.filter((p) => {
      // 1. Search filter
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        p.id.toLowerCase().includes(search) ||
        p.invoiceNumber.toLowerCase().includes(search) ||
        (p.orderRef && p.orderRef.toLowerCase().includes(search)) ||
        (p.description && p.description.toLowerCase().includes(search)) ||
        (p.customerWallet && p.customerWallet.toLowerCase().includes(search)) ||
        (p.txHash && p.txHash.toLowerCase().includes(search));

      // 2. Status filter
      let matchesStatus = true;
      if (statusFilter === 'confirmed') matchesStatus = isConfirmed(p.status);
      else if (statusFilter === 'pending') matchesStatus = isPending(p.status);
      else if (statusFilter === 'failed') matchesStatus = isFailed(p.status);
      else if (statusFilter === 'expired') matchesStatus = isExpired(p.status);

      // 3. Date filter
      let matchesDate = true;
      const createdTime = new Date(p.createdAt).getTime();
      if (dateFilter === 'today') {
        matchesDate = createdTime >= todayStart;
      } else if (dateFilter === '7days') {
        matchesDate = createdTime >= sevenDaysAgo;
      } else if (dateFilter === '30days') {
        matchesDate = createdTime >= thirtyDaysAgo;
      }

      // 4. Token filter
      const matchesToken = tokenFilter === 'all' || p.selectedToken === tokenFilter;

      return matchesSearch && matchesStatus && matchesDate && matchesToken;
    });
  }, [isolatedPayments, searchTerm, statusFilter, dateFilter, tokenFilter]);

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePaymentUpdated = (updated: Payment) => {
    updatePaymentStatus(updated.id, updated.status, updated);
    setSelectedPayment(updated);
  };

  const handleOpenVerificationSuite = (paymentId?: string) => {
    setVerificationInitialId(paymentId);
    setIsVerificationModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Transaction History
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Track payment lifecycle, view real-time settlement status, inspect on-chain transaction hashes, and verify blockchain proofs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<ShieldCheck className="w-4 h-4 text-purple-600" />}
            onClick={() => handleOpenVerificationSuite()}
            className="cursor-pointer border-slate-300 text-slate-800 hover:bg-slate-50 shadow-xs text-xs font-semibold"
          >
            Verification Suite
          </Button>

          <Button
            variant="iris"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/merchant/create-payment')}
            className="cursor-pointer shadow-xs text-xs font-bold"
          >
            Create Payment
          </Button>
        </div>
      </div>

      {/* Focused Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Payment ID, Invoice #, Reference, Wallet, or Tx Hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-mono"
              >
                ✕
              </button>
            )}
          </div>

          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={dateFilter}
                onChange={(e: any) => setDateFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            {/* Asset / Token Filter */}
            <select
              value={tokenFilter}
              onChange={(e) => setTokenFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Assets</option>
              <option value="USDT">USDT (Stable)</option>
              <option value="USDC">USDC (Stable)</option>
              <option value="DAI">DAI (Stable)</option>
              <option value="VERSE">VERSE</option>
              <option value="MATIC">POL / MATIC</option>
              <option value="ETH">ETH</option>
              <option value="BNB">BNB</option>
              <option value="AVAX">AVAX</option>
            </select>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-slate-100 pt-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Status:
          </span>
          {[
            { id: 'all', label: 'All Transactions', count: isolatedPayments.length },
            {
              id: 'confirmed',
              label: 'Confirmed',
              count: isolatedPayments.filter((p) => isConfirmed(p.status)).length,
            },
            {
              id: 'pending',
              label: 'Pending / In-Flight',
              count: isolatedPayments.filter((p) => isPending(p.status)).length,
            },
            {
              id: 'failed',
              label: 'Failed',
              count: isolatedPayments.filter((p) => isFailed(p.status)).length,
            },
            {
              id: 'expired',
              label: 'Expired',
              count: isolatedPayments.filter((p) => isExpired(p.status)).length,
            },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                statusFilter === st.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === st.id ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {st.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table & Ledger */}
      <Card variant="default">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Payment ID / Ref</th>
                  <th className="py-3.5 px-4">Date / Time</th>
                  <th className="py-3.5 px-4">Amount & Asset</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Transaction Hash</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-slate-500 space-y-3">
                      <CreditCard className="w-9 h-9 text-slate-300 mx-auto" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">
                          No transactions found
                        </p>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                            ? 'No payment requests match your active filters. Try clearing your search query or adjusting the status filter.'
                            : 'You have not created any payments yet. Generate your first invoice to accept non-custodial crypto payments.'}
                        </p>
                      </div>
                      {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setDateFilter('all');
                            setTokenFilter('all');
                          }}
                          className="text-xs text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const chain = getChainConfig(p.chainId || 137);
                    const explorerUrl = p.txHash ? getExplorerTxUrl(p.chainId || 137, p.txHash) : null;
                    const createdDate = new Date(p.createdAt);

                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPayment(p)}
                        className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                      >
                        {/* 1. Payment ID & Reference */}
                        <td className="py-4 px-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                              {p.invoiceNumber}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-sans truncate max-w-xs mt-0.5">
                            {p.orderRef ? (
                              <span className="text-purple-700 font-medium">Ref: {p.orderRef}</span>
                            ) : (
                              p.description || 'Payment Request'
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: {p.id}
                          </div>
                        </td>

                        {/* 2. Date / Time */}
                        <td className="py-4 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">
                            {createdDate.toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-slate-400">
                            {createdDate.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        {/* 3. Amount & Asset */}
                        <td className="py-4 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            <TokenLogo symbol={p.selectedToken} size="sm" />
                            <div>
                              <div className="font-bold text-slate-900 text-sm">
                                ${(p.amountUSD || 0).toFixed(2)}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {p.tokenAmount || p.amountUSD} {p.selectedToken} •{' '}
                                <span className="font-sans text-purple-700">
                                  {chain?.shortName || 'Polygon'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 4. Status */}
                        <td className="py-4 px-4">
                          <StatusBadge status={p.status} size="sm" pulse={isPending(p.status)} />
                        </td>

                        {/* 5. Transaction Hash */}
                        <td className="py-4 px-4 font-mono text-[11px]" onClick={(e) => e.stopPropagation()}>
                          {p.txHash ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-purple-700 font-bold">
                                {p.txHash.slice(0, 8)}...{p.txHash.slice(-6)}
                              </span>
                              <button
                                onClick={(e) => handleCopy(e, p.txHash!, `tx-${p.id}`)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                title="Copy Transaction Hash"
                              >
                                {copiedId === `tx-${p.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {explorerUrl && (
                                <a
                                  href={explorerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded hover:bg-purple-100 text-purple-600 transition-colors cursor-pointer"
                                  title="View on Explorer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No on-chain tx yet</span>
                          )}
                        </td>

                        {/* 6. Actions */}
                        <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => handleCopy(e, `${window.location.origin}/pay/${p.id}`, `url-${p.id}`)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
                              title="Copy Customer Checkout Link"
                            >
                              {copiedId === `url-${p.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              onClick={() => setSelectedPayment(p)}
                              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 text-slate-700 hover:text-purple-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <span>Details</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail View ("What happened to my payment?") */}
      <TransactionDetailModal
        isOpen={Boolean(selectedPayment)}
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onPaymentUpdated={handlePaymentUpdated}
        onOpenVerificationSuite={handleOpenVerificationSuite}
      />

      {/* Verification Engine Test Suite & Inspector Modal */}
      <VerificationTestSuiteModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        initialPaymentId={verificationInitialId || selectedPayment?.id}
      />
    </div>
  );
};
