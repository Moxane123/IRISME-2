import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useApp } from '../context/AppContext';
import { useWeb3 } from '../context/Web3Context';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { IrisLogo } from '../components/ui/IrisLogo';
import { getExplorerAddressUrl, getChainConfig, DEFAULT_CHAIN_ID } from '../config';
import {
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  LogOut,
  Sparkles,
  Globe,
  Coins,
  ArrowRight,
  Zap,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { navigate } = useRouter();
  const { setIsWalletModalOpen } = useApp();
  const {
    isConnected,
    isConnecting,
    connectingWalletType,
    address,
    chainId,
    currentChain,
    isWrongNetwork,
    walletType,
    balances,
    error,
    clearError,
    disconnect,
    refreshBalances,
    isLoadingBalances,
  } = useWeb3();

  const [copied, setCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalances();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const formatShortAddress = (addr: string): string => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const activeChain = currentChain || getChainConfig(DEFAULT_CHAIN_ID);
  const explorerUrl = address && chainId ? getExplorerAddressUrl(chainId, address) : '#';

  return (
    <div className="min-h-[85vh] flex flex-col justify-between pb-12 animate-fadeIn">
      {/* Hero Section with Iridescent Aura */}
      <section className="relative pt-10 sm:pt-16 pb-12 max-w-3xl mx-auto px-4 w-full text-center">
        {/* Iridescent Glow Backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-gradient-to-tr from-[#00D2FE]/20 via-[#7C3AED]/20 to-[#FF0080]/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulseGlow" />

        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center justify-center space-y-4 mb-6">
          <div className="p-3 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-purple-500/10">
            <IrisLogo size={56} showText={false} />
          </div>

          <div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.08]">
              IRISME
            </h1>
            <p className="mt-2 text-base sm:text-xl font-medium bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] bg-clip-text text-transparent">
              Web3 Merchant Payments & Verse Rewards
            </p>
          </div>
        </div>

        {/* Error Alert Box (e.g. Wallet connection rejected) */}
        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-left flex items-start justify-between gap-3 animate-fadeIn shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">
                  {error.isUserRejection ? 'Wallet Connection Rejected' : 'Connection Error'}
                </p>
                <p className="text-rose-700 text-[11px] mt-0.5 leading-relaxed">
                  {error.message || 'The wallet connection request was not completed.'}
                </p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-rose-400 hover:text-rose-700 p-1 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Central Wallet Action Card */}
        <div className="max-w-md mx-auto">
          {!isConnected ? (
            /* Disconnected State */
            <div className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl shadow-purple-500/10 space-y-6 relative overflow-hidden text-center">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] absolute top-0 left-0 right-0" />

              <div className="space-y-2 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mx-auto shadow-xs">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Connect Web3 Wallet</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Connect your MetaMask, Coinbase Wallet, Trust Wallet, or WalletConnect to access IRISME.
                </p>
              </div>

              {/* Primary Connect Wallet Button */}
              <div className="space-y-3">
                <Button
                  variant="iris"
                  size="lg"
                  className="w-full py-4 text-base font-bold shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 cursor-pointer transition-all active:scale-[0.99]"
                  onClick={() => setIsWalletModalOpen(true)}
                  isLoading={isConnecting}
                  leftIcon={!isConnecting ? <Wallet className="w-5 h-5" /> : undefined}
                >
                  {isConnecting ? 'Waiting for Wallet Approval...' : 'Connect Wallet'}
                </Button>

                {isConnecting && (
                  <p className="text-[11px] text-purple-700 animate-pulse font-medium">
                    Please approve the connection prompt inside your wallet application.
                  </p>
                )}
              </div>

              {/* Supported Protocols */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">🦊 MetaMask</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">🔵 Coinbase</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">🛡️ Trust</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">⚡ Reown / WC</span>
              </div>
            </div>
          ) : (
            /* Connected State */
            <div className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl shadow-purple-500/10 space-y-6 relative overflow-hidden text-left animate-fadeIn">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] absolute top-0 left-0 right-0" />

              {/* Top Connected Status */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50" />
                  <span className="text-sm font-black text-emerald-700 uppercase tracking-wider">
                    Connected
                  </span>
                </div>

                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-50 border border-purple-200 text-purple-900 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-purple-600" />
                  <span>{activeChain ? activeChain.name : `Chain ${chainId}`}</span>
                </span>
              </div>

              {/* Visual Wallet Address Display */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Account Address</span>
                  <span className="font-mono text-[11px] text-purple-700 font-bold capitalize">
                    {walletType ? `${walletType} provider` : 'Web3 Injected'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-base sm:text-lg text-slate-900 font-extrabold truncate bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 flex-1 shadow-xs">
                    {formatShortAddress(address)}
                  </span>

                  <button
                    onClick={handleCopyAddress}
                    className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors shadow-xs cursor-pointer flex-shrink-0"
                    title="Copy full public address"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors shadow-xs cursor-pointer flex-shrink-0"
                    title="View on block explorer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="text-[11px] text-slate-500 font-mono break-all bg-white p-2 rounded-lg border border-slate-200/60">
                  {address}
                </div>
              </div>

              {/* On-Chain Balances Grid */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-purple-600" />
                    Live Balances
                  </span>
                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing || isLoadingBalances}
                    className="text-[11px] text-purple-700 font-mono font-bold flex items-center gap-1 hover:text-purple-900 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing || isLoadingBalances ? 'animate-spin' : ''}`} />
                    <span>{isLoadingBalances ? 'Fetching...' : 'Refresh'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <span className="text-slate-600 font-medium">USDT:</span>
                    <span className="font-mono font-bold text-slate-900">${(balances.USDT || 0).toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <span className="text-slate-600 font-medium">USDC:</span>
                    <span className="font-mono font-bold text-slate-900">${(balances.USDC || 0).toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <span className="text-slate-600 font-medium">ETH:</span>
                    <span className="font-mono font-bold text-slate-900">{balances.ETH || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <span className="text-purple-700 font-medium">VERSE:</span>
                    <span className="font-mono font-bold text-purple-700">{(balances.VERSE || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Disconnect Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full text-rose-700 hover:text-rose-900 hover:bg-rose-50 border-rose-200 cursor-pointer font-bold flex items-center justify-center gap-1.5"
                  onClick={disconnect}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect</span>
                </Button>

                <Button
                  variant="iris"
                  size="md"
                  className="w-full font-bold cursor-pointer"
                  onClick={() => setIsWalletModalOpen(true)}
                >
                  Manage Wallet
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Security & Non-Custodial Highlights */}
        <div className="mt-12 pt-8 border-t border-slate-200 max-w-xl mx-auto flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00D2FE]" />
            <span>Self-Custodial Permission Protocol</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#7C3AED]" />
            <span>Zero Sign-Up Required</span>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 max-w-5xl mx-auto px-4 w-full">
        <div className="flex items-center gap-2">
          <IrisLogo size={18} />
          <span className="font-bold text-slate-800">iRisme</span>
          <span>© 2026 Non-Custodial Web3 Payment & Loyalty Protocol</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/merchant')}
            className="hover:text-purple-600 font-medium transition-colors cursor-pointer"
          >
            Merchant Portal
          </button>
          <span className="text-slate-300">•</span>
          <button
            onClick={() => navigate('/admin')}
            className="hover:text-purple-700 font-bold transition-colors cursor-pointer flex items-center gap-1 text-slate-700"
          >
            <span>Platform Admin</span>
            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[10px] rounded font-mono font-bold">Ops</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
