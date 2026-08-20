import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import { Button } from './Button';
import { IrisLogo } from './IrisLogo';
import { WalletType, Web3WalletService } from '../../services/web3WalletService';
import {
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN_ID,
  getChainConfig,
  getExplorerAddressUrl,
} from '../../config';
import {
  Wallet,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  X,
  AlertTriangle,
  RefreshCw,
  Zap,
  Globe,
  ChevronDown,
  Coins,
  ArrowRight,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

interface WalletCardInfo {
  type: WalletType;
  name: string;
  badge: string;
  icon: string;
  iconBg: string;
  description: string;
}

const WALLET_OPTIONS: WalletCardInfo[] = [
  {
    type: 'metamask',
    name: 'MetaMask',
    badge: 'Popular',
    icon: '🦊',
    iconBg: 'from-orange-500/20 to-amber-500/20 border-orange-200',
    description: 'Connect using MetaMask browser extension or mobile app',
  },
  {
    type: 'coinbase',
    name: 'Coinbase Wallet',
    badge: 'EVM & Smart Wallet',
    icon: '🔵',
    iconBg: 'from-blue-500/20 to-indigo-500/20 border-blue-200',
    description: 'Connect Coinbase Wallet extension, mobile app, or passkeys',
  },
  {
    type: 'trust',
    name: 'Trust Wallet',
    badge: 'Mobile & Extension',
    icon: '🛡️',
    iconBg: 'from-cyan-500/20 to-blue-500/20 border-cyan-200',
    description: 'Connect Trust Wallet browser extension or mobile app',
  },
  {
    type: 'walletconnect',
    name: 'WalletConnect / Reown',
    badge: '300+ Wallets',
    icon: '⚡',
    iconBg: 'from-purple-500/20 to-pink-500/20 border-purple-200',
    description: 'Scan QR code with Rainbow, Zerion, Verse, Ledger, or any mobile wallet',
  },
  {
    type: 'injected',
    name: 'Browser Injected Wallet',
    badge: 'Auto-Detect',
    icon: '🌐',
    iconBg: 'from-slate-500/20 to-slate-700/20 border-slate-200',
    description: 'Connect any detected browser wallet (Rabby, Brave, Phantom, Frame)',
  },
];

export const WalletModal: React.FC = () => {
  const { isWalletModalOpen, setIsWalletModalOpen } = useApp();
  const {
    isConnected,
    isConnecting,
    connectingWalletType,
    isLoadingBalances,
    address,
    chainId,
    currentChain,
    isWrongNetwork,
    walletType,
    discoveredProviders,
    balances,
    error,
    clearError,
    connectWithWallet,
    disconnect,
    switchTargetNetwork,
    refreshBalances,
  } = useWeb3();

  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);

  if (!isWalletModalOpen) return null;

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalances();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleSelectWallet = async (type: WalletType, customProvider?: any) => {
    clearError();
    await connectWithWallet(type, customProvider);
  };

  const formatShortAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const activeChain = currentChain || getChainConfig(DEFAULT_CHAIN_ID);
  const explorerUrl = address && chainId ? getExplorerAddressUrl(chainId, address) : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900">
        {/* Iridescent Top Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080]" />

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IrisLogo size={28} />
            <div>
              <h3 className="font-bold text-slate-900 text-base tracking-tight">
                {isConnected ? 'Connected Web3 Wallet' : 'Connect a Wallet'}
              </h3>
              <p className="text-xs text-slate-500">
                {isConnected ? 'Self-Custodial EVM Account' : 'Choose your preferred wallet to connect to IRISME'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              clearError();
              setIsWalletModalOpen(false);
            }}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-2 animate-fadeIn">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">
                  {error.isUserRejection ? 'Connection Request Rejected' : 'Connection Error'}
                </p>
                <p className="mt-0.5 text-rose-700 text-[11px] leading-relaxed">
                  {error.message || 'Wallet connection was not approved.'}
                </p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-rose-500 hover:text-rose-900 text-xs p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {isConnected ? (
            <div className="space-y-4">
              {/* Connected Address Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-700 font-bold">Connected</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                      isWrongNetwork
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-purple-50 text-purple-800 border-purple-300'
                    }`}
                  >
                    {activeChain ? activeChain.name : `Chain ${chainId}`}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm sm:text-base text-slate-900 font-bold truncate bg-white px-3 py-2 rounded-xl border border-slate-200 flex-1 shadow-xs">
                    {formatShortAddress(address)}
                  </span>

                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs cursor-pointer flex-shrink-0"
                    title="Copy full address"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs cursor-pointer flex-shrink-0"
                    title="View on block explorer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="text-[11px] text-slate-500 font-mono break-all bg-slate-100/70 p-2 rounded-lg">
                  {address}
                </div>

                {/* Network Switcher */}
                <div className="pt-2 border-t border-slate-200/80">
                  <div className="text-[11px] font-semibold text-slate-600 mb-1.5">Active Network</div>
                  <button
                    onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                    className="w-full p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-800 transition-colors cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-slate-900">
                        {activeChain ? activeChain.name : `Chain ID ${chainId}`}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {showNetworkDropdown && (
                    <div className="mt-1 p-1.5 rounded-xl bg-white border border-slate-200 space-y-1 animate-fadeIn z-20 shadow-xl">
                      {Object.values(SUPPORTED_CHAINS).map((chain) => (
                        <button
                          key={chain.id}
                          onClick={() => {
                            switchTargetNetwork(chain.id);
                            setShowNetworkDropdown(false);
                          }}
                          className={`w-full p-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            chainId === chain.id
                              ? 'bg-purple-50 text-purple-900 font-bold border border-purple-300'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{chain.icon}</span>
                            <span>{chain.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{chain.shortName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Real Balances Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-purple-600" />
                    On-Chain Balances
                  </span>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isLoadingBalances}
                    className="text-[11px] text-purple-700 font-mono font-bold flex items-center gap-1 hover:text-purple-900 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing || isLoadingBalances ? 'animate-spin' : ''}`} />
                    {isLoadingBalances ? 'Fetching...' : 'Refresh'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <span className="text-slate-700 font-medium">USDT</span>
                    <span className="font-mono font-bold text-slate-900">${(balances.USDT || 0).toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <span className="text-slate-700 font-medium">USDC</span>
                    <span className="font-mono font-bold text-slate-900">${(balances.USDC || 0).toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <span className="text-slate-700 font-medium">ETH</span>
                    <span className="font-mono font-bold text-slate-900">{balances.ETH || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <span className="text-slate-700 font-medium">POL</span>
                    <span className="font-mono font-bold text-slate-900">{balances.POL || balances.MATIC || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <span className="text-purple-700 font-bold">VERSE</span>
                    <span className="font-mono font-bold text-purple-700">{(balances.VERSE || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <span className="text-slate-700 font-medium">BNB</span>
                    <span className="font-mono font-bold text-slate-900">{balances.BNB || 0}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full text-rose-700 hover:text-rose-900 hover:bg-rose-50 border-rose-200 cursor-pointer font-bold"
                  onClick={disconnect}
                >
                  Disconnect Wallet
                </Button>
                <Button
                  variant="iris"
                  size="md"
                  className="w-full font-bold cursor-pointer"
                  onClick={() => setIsWalletModalOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Connecting State Banner */}
              {isConnecting && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-3 animate-pulse">
                  <RefreshCw className="w-5 h-5 text-purple-600 animate-spin flex-shrink-0" />
                  <div>
                    <p className="font-bold text-purple-900">Requesting Connection Approval...</p>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      Please open your wallet application and approve connecting to IRISME.
                    </p>
                  </div>
                </div>
              )}

              {/* Wallet Options List */}
              <div className="space-y-2">
                {WALLET_OPTIONS.map((wallet) => {
                  const isThisWalletConnecting = isConnecting && connectingWalletType === wallet.type;
                  const isInstalled = Web3WalletService.isWalletAvailable(wallet.type);

                  return (
                    <button
                      key={wallet.type}
                      onClick={() => handleSelectWallet(wallet.type)}
                      disabled={isConnecting}
                      className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between group cursor-pointer ${
                        isThisWalletConnecting
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-400/20'
                          : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 bg-white shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${wallet.iconBg} flex items-center justify-center text-xl shadow-xs flex-shrink-0`}
                        >
                          {wallet.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                              {wallet.name}
                            </h4>
                            {isInstalled && wallet.type !== 'walletconnect' ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                                Installed
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                                {wallet.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                            {wallet.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center pl-2 flex-shrink-0">
                        {isThisWalletConnecting ? (
                          <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Discovered EIP-6963 Injected Providers (if any additional wallets detected) */}
              {discoveredProviders.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Detected Browser Extensions
                  </p>
                  <div className="space-y-1">
                    {discoveredProviders.map((dp) => (
                      <button
                        key={dp.info.uuid || dp.info.rdns}
                        onClick={() => handleSelectWallet('injected', dp.provider)}
                        disabled={isConnecting}
                        className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-slate-50 bg-white flex items-center justify-between text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {dp.info.icon ? (
                            <img src={dp.info.icon} alt={dp.info.name} className="w-5 h-5 rounded-md" />
                          ) : (
                            <span className="text-base">💼</span>
                          )}
                          <span className="text-xs font-bold text-slate-800">{dp.info.name}</span>
                        </div>
                        <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          Connect →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Shield Notice */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600 mt-3">
                <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Self-custodial & secure. IRISME will <strong className="text-slate-900 font-bold">never</strong> ask for your seed phrases, private keys, or passwords.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
