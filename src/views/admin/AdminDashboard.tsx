import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '../../context/RouterContext';
import { ApiService } from '../../services/apiService';
import {
  AdminStats,
  AdminMerchantItem,
  AdminTransactionItem,
  AdminPlatformFeesSummary,
  AdminSystemActivity,
  Payment,
  VerificationAuditLog,
} from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  LogOut,
  RefreshCw,
  Users,
  CreditCard,
  Layers,
  DollarSign,
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Search,
  Key,
  Server,
  AlertTriangle,
  Zap,
  TrendingUp,
  Sliders,
  Eye,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { navigate } = useRouter();

  // Admin Auth State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [adminKeyInput, setAdminKeyInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Tab Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'merchants' | 'payments' | 'transactions' | 'fees' | 'activity'>('overview');

  // Operational Data State
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [merchants, setMerchants] = useState<AdminMerchantItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<AdminTransactionItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<VerificationAuditLog[]>([]);
  const [feeSummary, setFeeSummary] = useState<AdminPlatformFeesSummary | null>(null);
  const [activities, setActivities] = useState<AdminSystemActivity[]>([]);

  // Filter & Search Controls
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [paymentSearch, setPaymentSearch] = useState<string>('');
  const [merchantSearch, setMerchantSearch] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verify Admin Session on mount
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      const isAuthed = await ApiService.verifyAdminSession();
      if (isMounted) {
        setIsAdminAuthenticated(isAuthed);
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch all administrative data
  const loadAdminData = useCallback(async () => {
    if (!isAdminAuthenticated) return;
    setIsLoadingData(true);
    setActionMessage(null);

    try {
      const [
        statsRes,
        merchantsRes,
        paymentsRes,
        txRes,
        feesRes,
        activityRes,
      ] = await Promise.all([
        ApiService.getAdminStats(),
        ApiService.getAdminMerchants(),
        ApiService.getAdminPayments({ status: paymentStatusFilter, search: paymentSearch }),
        ApiService.getAdminTransactions(),
        ApiService.getAdminPlatformFees(),
        ApiService.getAdminSystemActivity(),
      ]);

      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
      if (merchantsRes.success && merchantsRes.merchants) setMerchants(merchantsRes.merchants);
      if (paymentsRes.success && paymentsRes.payments) setPayments(paymentsRes.payments);
      if (txRes.success) {
        if (txRes.transactions) setTransactions(txRes.transactions);
        if (txRes.auditLogs) setAuditLogs(txRes.auditLogs);
      }
      if (feesRes.success) setFeeSummary(feesRes as AdminPlatformFeesSummary);
      if (activityRes.success && activityRes.activities) setActivities(activityRes.activities);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Error syncing platform operational data.' });
    } finally {
      setIsLoadingData(false);
    }
  }, [isAdminAuthenticated, paymentStatusFilter, paymentSearch]);

  // Load data whenever auth status is confirmed or filters change
  useEffect(() => {
    if (isAdminAuthenticated) {
      loadAdminData();
    }
  }, [isAdminAuthenticated, loadAdminData]);

  // Handle Admin Login Submit
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKeyInput.trim()) {
      setLoginError('Please enter the administrative key.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await ApiService.adminLogin(adminKeyInput.trim());
      if (res.success) {
        setIsAdminAuthenticated(true);
        setAdminKeyInput('');
      } else {
        setLoginError(res.error || 'Invalid administrative credentials.');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Server connection failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Admin Logout
  const handleAdminLogout = async () => {
    await ApiService.adminLogout();
    setIsAdminAuthenticated(false);
    setStats(null);
    setMerchants([]);
    setPayments([]);
  };

  // Handle Merchant Status Toggle (Active <-> Suspended)
  const handleUpdateMerchantStatus = async (merchantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await ApiService.updateAdminMerchantStatus(merchantId, newStatus);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Merchant status changed to ${newStatus.toUpperCase()}.`,
        });
        loadAdminData();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to update merchant status.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Status update failed.' });
    }
  };

  // Filtered Merchants
  const filteredMerchants = merchants.filter((m) => {
    if (!merchantSearch) return true;
    const q = merchantSearch.toLowerCase();
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.settlementAddress && m.settlementAddress.toLowerCase().includes(q)) ||
      (m.id && m.id.toLowerCase().includes(q))
    );
  });

  // Shorten EVM Address helper
  const shortenAddress = (addr?: string) => {
    if (!addr) return '—';
    if (addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Format Explorer Tx URL
  const getExplorerTxUrl = (txHash?: string, chainId = 137) => {
    if (!txHash) return '#';
    if (chainId === 137) return `https://polygonscan.com/tx/${txHash}`;
    if (chainId === 1) return `https://etherscan.io/tx/${txHash}`;
    if (chainId === 8453) return `https://basescan.org/tx/${txHash}`;
    if (chainId === 56) return `https://bscscan.com/tx/${txHash}`;
    return `https://polygonscan.com/tx/${txHash}`;
  };

  // ==========================================
  // 1. AUTHENTICATION / ACCESS GATE SCREEN
  // ==========================================
  if (isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-mono text-slate-500">Verifying administrative security credentials...</p>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <Card variant="iris" className="shadow-2xl border-purple-300">
          <CardHeader
            title="System Administration & Operations"
            subtitle="Restricted Operator Access"
            icon={<ShieldAlert className="w-6 h-6 text-purple-600" />}
          />
          <CardContent className="space-y-6 pt-2">
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 leading-relaxed flex items-start gap-3">
              <Lock className="w-4 h-4 text-purple-700 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block font-semibold mb-0.5">Server-Side Protected Portal</strong>
                Administrative tools are protected with server-level session verification. Normal merchant accounts cannot access system metrics or platform controls.
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Admin Master Key
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={adminKeyInput}
                    onChange={(e) => setAdminKeyInput(e.target.value)}
                    placeholder="Enter security key..."
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm font-mono text-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
                  Default MVP Demonstration Key: <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700 font-bold">iris_admin_secret_2026</code>
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="iris"
                size="lg"
                isLoading={isLoggingIn}
                className="w-full text-sm font-bold shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                Authenticate Operator
              </Button>
            </form>

            <div className="pt-2 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={() => navigate('/merchant')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Return to Merchant Dashboard
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==========================================
  // 2. AUTHENTICATED ADMIN MONITORING DASHBOARD
  // ==========================================
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Operational Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white shadow-xl border border-purple-500/20">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00D2FE] via-[#7C3AED] to-[#FF0080] flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">iRisme Platform Administration</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {stats?.systemStatus || 'OPERATIONAL'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              Core MVP Payment Monitoring & Non-Custodial Gateway Operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAdminData}
            isLoading={isLoadingData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs font-bold border-white/20 text-white hover:bg-white/10 cursor-pointer"
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAdminLogout}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-300" />}
            className="text-xs font-bold border-rose-500/30 text-rose-200 hover:bg-rose-900/30 cursor-pointer"
          >
            Exit Admin
          </Button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>System Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('merchants')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'merchants'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Merchants ({merchants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payments & Statuses ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>On-Chain Transactions ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'fees'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Platform Fees (${feeSummary?.totalFeesCollectedUSD?.toFixed(2) || '0.00'})</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>System Activity ({activities.length})</span>
        </button>
      </div>

      {/* ==========================================
          TAB 1: SYSTEM OVERVIEW & KPI CARDS
          ========================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Total Processed Volume</span>
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">
                ${stats?.totalVolumeUSD?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Non-custodial settlement
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Platform Fees (0.50%)</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600 font-mono">
                ${stats?.totalPlatformFeesUSD?.toFixed(4) || '0.0000'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {feeSummary?.totalTransactionsCharged || 0} transactions monetized
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Active Merchants</span>
                <Users className="w-4 h-4 text-cyan-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">
                {stats?.activeMerchants || 0} / {stats?.totalMerchants || 0}
              </p>
              <p className="text-[11px] text-slate-500">
                {stats?.suspendedMerchants ? `${stats.suspendedMerchants} suspended` : 'All accounts healthy'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>On-Chain Invoices</span>
                <CreditCard className="w-4 h-4 text-pink-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">
                {stats?.totalPayments || 0}
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-emerald-600 font-bold">{stats?.paymentsByStatus?.paid || 0} Paid</span>
                <span className="text-slate-300">•</span>
                <span className="text-amber-600 font-bold">{stats?.paymentsByStatus?.pending || 0} Pending</span>
              </div>
            </div>
          </div>

          {/* Payment Status Breakdown & Quick System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Breakdown Card */}
            <Card variant="default" className="lg:col-span-2 shadow-sm">
              <CardHeader
                title="Payment Statuses Overview"
                subtitle="Live status distribution across all generated merchant invoices"
                icon={<Sliders className="w-5 h-5 text-purple-600" />}
              />
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                    <span className="text-[11px] font-bold text-emerald-700 block uppercase">Paid / Confirmed</span>
                    <span className="text-xl font-black text-emerald-900 font-mono mt-0.5 block">
                      {stats?.paymentsByStatus?.paid || 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                    <span className="text-[11px] font-bold text-amber-700 block uppercase">Pending</span>
                    <span className="text-xl font-black text-amber-900 font-mono mt-0.5 block">
                      {stats?.paymentsByStatus?.pending || 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-center">
                    <span className="text-[11px] font-bold text-slate-600 block uppercase">Expired</span>
                    <span className="text-xl font-black text-slate-800 font-mono mt-0.5 block">
                      {stats?.paymentsByStatus?.expired || 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-center">
                    <span className="text-[11px] font-bold text-cyan-700 block uppercase">Refunded</span>
                    <span className="text-xl font-black text-cyan-900 font-mono mt-0.5 block">
                      {stats?.paymentsByStatus?.refunded || 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-center col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-bold text-rose-700 block uppercase">Failed</span>
                    <span className="text-xl font-black text-rose-900 font-mono mt-0.5 block">
                      {stats?.paymentsByStatus?.failed || 0}
                    </span>
                  </div>
                </div>

                {/* Status Bar */}
                {stats && stats.totalPayments > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        style={{ width: `${(stats.paymentsByStatus.paid / stats.totalPayments) * 100}%` }}
                        className="bg-emerald-500 h-full"
                        title="Paid"
                      />
                      <div
                        style={{ width: `${(stats.paymentsByStatus.pending / stats.totalPayments) * 100}%` }}
                        className="bg-amber-400 h-full"
                        title="Pending"
                      />
                      <div
                        style={{ width: `${(stats.paymentsByStatus.expired / stats.totalPayments) * 100}%` }}
                        className="bg-slate-300 h-full"
                        title="Expired"
                      />
                      <div
                        style={{ width: `${(stats.paymentsByStatus.failed / stats.totalPayments) * 100}%` }}
                        className="bg-rose-500 h-full"
                        title="Failed"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Paid: {((stats.paymentsByStatus.paid / stats.totalPayments) * 100).toFixed(1)}%</span>
                      <span>Total Invoices: {stats.totalPayments}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Platform Infrastructure Health Card */}
            <Card variant="default" className="shadow-sm">
              <CardHeader
                title="System Operational Core"
                subtitle="Gateway infrastructure telemetry"
                icon={<Server className="w-5 h-5 text-cyan-600" />}
              />
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Gateway Status</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Healthy & Online
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Server Uptime</span>
                  <span className="font-mono font-bold text-slate-800">
                    {stats?.serverUptimeSeconds ? `${Math.floor(stats.serverUptimeSeconds / 60)} mins` : 'Active'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Platform Fee Standard</span>
                  <span className="font-mono font-bold text-purple-700">0.50% / TX</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Settlement Model</span>
                  <span className="font-bold text-slate-800">100% Non-Custodial</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Blockchain Oracles</span>
                  <span className="font-mono text-emerald-600 font-bold">Polygon / Multi-EVM</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: VIEW MERCHANTS & STATUS TOGGLES
          ========================================== */}
      {activeTab === 'merchants' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={merchantSearch}
                onChange={(e) => setMerchantSearch(e.target.value)}
                placeholder="Search merchant name, email, wallet..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs bg-white text-slate-900"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredMerchants.length} registered merchants
            </span>
          </div>

          {/* Merchants Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Merchant Name & ID</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Settlement Wallet</th>
                  <th className="px-4 py-3.5">Volume (USD)</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMerchants.map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{merchant.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{merchant.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {merchant.category || 'Retail'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-800">
                      {shortenAddress(merchant.settlementAddress)}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      ${merchant.totalVolumeUSD?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                          merchant.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : merchant.status === 'suspended'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {merchant.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant={merchant.status === 'active' ? 'outline' : 'iris'}
                        size="sm"
                        onClick={() => handleUpdateMerchantStatus(merchant.id, merchant.status)}
                        className="text-[11px] py-1 px-2.5 cursor-pointer"
                      >
                        {merchant.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredMerchants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No merchants found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: VIEW PAYMENTS & STATUSES
          ========================================== */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Filter Status:</span>
              {['all', 'paid', 'pending', 'expired', 'failed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setPaymentStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase font-mono transition-all cursor-pointer ${
                    paymentStatusFilter === st
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                placeholder="Search payment ID, ref, tx..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Payments Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Invoice ID & Ref</th>
                  <th className="px-4 py-3.5">Merchant</th>
                  <th className="px-4 py-3.5">Amount (USD)</th>
                  <th className="px-4 py-3.5">Payable Asset</th>
                  <th className="px-4 py-3.5">Fee (0.5%)</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Created At</th>
                  <th className="px-4 py-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 font-mono">{p.id}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.orderRef || 'Direct'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-800">{p.merchantName || 'Merchant'}</span>
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono text-slate-900">
                      ${(Number(p.amountUSD) || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono font-bold text-[10px]">
                        {p.selectedToken || 'USDT'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-emerald-600 font-bold">
                      ${(Number(p.platformFeeUSD) || (Number(p.amountUSD || 0) * 0.005)).toFixed(4)}
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge status={p.status as any} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <a
                        href={`/pay/${p.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-bold text-[11px] cursor-pointer"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No invoices found for the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: ON-CHAIN TRANSACTIONS & AUDITS
          ========================================== */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-600 flex-shrink-0" />
              <span>
                <strong>Idempotent On-Chain Payment Verification:</strong> Transactions are verified directly against EVM RPC nodes to prevent double-spending and replay attacks.
              </span>
            </div>
            <span className="font-mono font-bold text-cyan-950 whitespace-nowrap">
              {transactions.length} Verified
            </span>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Tx Hash</th>
                  <th className="px-4 py-3.5">Payment ID</th>
                  <th className="px-4 py-3.5">Token & Amount</th>
                  <th className="px-4 py-3.5">Payer Address</th>
                  <th className="px-4 py-3.5">Settlement Recipient</th>
                  <th className="px-4 py-3.5">Verified At</th>
                  <th className="px-4 py-3.5 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.txHash} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {shortenAddress(tx.txHash)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-purple-700">
                      {tx.paymentId}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {tx.amount} {tx.token}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">
                      {shortenAddress(tx.payerAddress)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">
                      {shortenAddress(tx.merchantAddress)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                      {new Date(tx.verifiedAt).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <a
                        href={getExplorerTxUrl(tx.txHash, tx.chainId)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 font-bold text-[11px] cursor-pointer"
                      >
                        <span>Scan</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No on-chain transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 5: VIEW PLATFORM FEES & MONETIZATION
          ========================================== */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* Top Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-1">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Platform Revenue</span>
              <p className="text-3xl font-black text-emerald-950 font-mono">
                ${feeSummary?.totalFeesCollectedUSD?.toFixed(4) || '0.0000'}
              </p>
              <p className="text-[11px] text-emerald-700">Calculated from completed on-chain transactions</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Take Rate</span>
              <p className="text-3xl font-black text-purple-700 font-mono">
                0.50%
              </p>
              <p className="text-[11px] text-slate-500">Fixed MVP gateway processing fee</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monetized Invoices</span>
              <p className="text-3xl font-black text-slate-900 font-mono">
                {feeSummary?.totalTransactionsCharged || 0}
              </p>
              <p className="text-[11px] text-slate-500">100% Non-custodial fee routing</p>
            </div>
          </div>

          {/* Token Breakdown Cards */}
          {feeSummary?.tokenBreakdown && (
            <Card variant="default" className="shadow-sm">
              <CardHeader
                title="Fees Collected by Token Asset"
                subtitle="Multi-token revenue breakdown"
                icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
              />
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(feeSummary.tokenBreakdown).map(([token, info]: [string, { tokenAmount: number; usdAmount: number; count: number }]) => (
                    <div key={token} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-900 font-mono text-xs">{token}</span>
                      <p className="text-base font-black text-emerald-700 font-mono mt-1">
                        ${Number(info.usdAmount || 0).toFixed(4)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {Number(info.tokenAmount || 0).toFixed(4)} {token} ({info.count || 0} tx)
                      </p>
                    </div>
                  ))}

                </div>
              </CardContent>
            </Card>
          )}

          {/* Fee Audit Ledger Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Fee Collection Audit Ledger</h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Payment ID</th>
                    <th className="px-4 py-3.5">Merchant</th>
                    <th className="px-4 py-3.5">Gross Amount (USD)</th>
                    <th className="px-4 py-3.5">Fee (USD)</th>
                    <th className="px-4 py-3.5">Fee Token Amount</th>
                    <th className="px-4 py-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeSummary?.feeLedger?.map((item) => (
                    <tr key={item.paymentId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{item.paymentId}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">{item.merchantName}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-900">${item.grossAmountUSD.toFixed(2)}</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-emerald-600">${item.feeAmountUSD.toFixed(4)}</td>
                      <td className="px-4 py-3.5 font-mono text-purple-700">{item.feeTokenAmount} {item.tokenSymbol}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                  {(!feeSummary?.feeLedger || feeSummary.feeLedger.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No fees charged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 6: BASIC SYSTEM ACTIVITY STREAM
          ========================================== */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Real-Time Platform Event Log Stream
            </span>
            <span className="text-xs text-slate-500 font-mono">Auto-recorded server activity</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    act.severity === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : act.severity === 'warning'
                      ? 'bg-amber-100 text-amber-700'
                      : act.severity === 'alert'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{act.details}</p>
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs font-mono">
                No system activity recorded yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
