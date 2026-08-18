import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import { Button } from './Button';
import { IrisLogo } from './IrisLogo';
import {
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN_ID,
  getChainConfig,
  getExplorerAddressUrl,
} from '../../config';
import {
  Wallet,
  ShieldCheck,
  ArrowRightLeft,
  Copy,
  Check,
  ExternalLink,
  X,
  AlertTriangle,
  RefreshCw,
  Zap,
  Globe,
  Radio,
  ChevronDown,
  Coins,
} from 'lucide-react';

export const WalletModal: React.FC = () => {
  const { wallet, isWalletModalOpen, setIsWalletModalOpen, switchRole } = useApp();
  const {
    isAvailable: isEthereumAvailable,
    isConnected,
    isConnecting,
    isLoadingBalances,
    address,
    chainId,
    currentChain,
    isWrongNetwork,
    walletMode,
    balances,
    error,
    clearError,
    connectInjected,
    connectDemo,
    disconnect,
    switchTargetNetwork,
    refreshBalances,
  } = useWeb3();

  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customAddressInput, setCustomAddressInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
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

  const handleConnectInjected = async () => {
    clearError();
    await connectInjected();
  };

  const handleConnectCustom = (customAddr?: string) => {
    connectDemo(customAddr);
    setShowCustomInput(false);
  };

  const activeChain = currentChain || getChainConfig(DEFAULT_CHAIN_ID);
  const explorerUrl = address && chainId ? getExplorerAddressUrl(chainId, address) : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900">
        {/* Iridescent Top Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080]" />

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IrisLogo size={28} />
            <div>
              <h3 className="font-bold text-slate-900 text-base tracking-tight">Self-Custodial Web3 Wallet</h3>
              <p className="text-xs text-slate-500">Live On-Chain Settlement & Real Balances</p>
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
          <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">
                  {error.isUserRejection ? 'Request Rejected in Wallet' : 'Connection Error'}
                </p>
                <p className="mt-0.5 text-rose-700 text-[11px] leading-relaxed">{error.message}</p>
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
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-700 font-bold">
                      {walletMode === 'injected' ? 'Live Web3 Connected' : 'Custom Address Connected'}
                    </span>
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
                  <span className="font-mono text-xs sm:text-sm text-slate-900 font-bold truncate bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex-1 shadow-xs">
                    {address}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={handleCopy}
                      className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer shadow-xs"
                      title="Copy Address"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 shadow-xs"
                      title="View on Explorer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {isWrongNetwork && (
                  <div className="pt-1 flex items-center justify-between text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <span className="font-medium">Switch to Polygon / Verse Hub</span>
                    <button
                      onClick={() => switchTargetNetwork(DEFAULT_CHAIN_ID)}
                      className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold text-[11px] rounded-lg hover:bg-amber-400 transition-colors shadow-xs"
                    >
                      Switch Network
                    </button>
                  </div>
                )}
              </div>

              {/* Network Switcher Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Active Blockchain Network
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                    className="w-full p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-800 transition-colors cursor-pointer shadow-xs"
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

              {/* Real Wallet Balances Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-purple-600" />
                    Real On-Chain Balances
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-600 font-bold">₮</span>
                      <span className="text-slate-700 font-medium">USDT</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      ${(balances.USDT || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-600 font-bold">$</span>
                      <span className="text-slate-700 font-medium">USDC</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      ${(balances.USDC || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-purple-600 font-bold">Ξ</span>
                      <span className="text-slate-700 font-medium">ETH</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {balances.ETH || 0}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500 font-bold">₿</span>
                      <span className="text-slate-700 font-medium">WBTC</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {balances.WBTC || balances.BTC || 0}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-purple-600 font-bold">🟣</span>
                      <span className="text-slate-700 font-medium">POL</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {balances.POL || balances.MATIC || 0}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-cyan-500 font-bold">⚡</span>
                      <span className="text-slate-700 font-medium">VERSE</span>
                    </div>
                    <span className="font-mono font-bold text-purple-700">
                      {(balances.VERSE || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-yellow-500 font-bold">🟡</span>
                      <span className="text-slate-700 font-medium">BNB</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {balances.BNB || 0}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-red-500 font-bold">🔺</span>
                      <span className="text-slate-700 font-medium">AVAX</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {balances.AVAX || 0}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-500 font-bold">🟣</span>
                      <span className="text-slate-700 font-medium">SOL</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {balances.SOL || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-slate-700 hover:text-slate-900 border-slate-300"
                  onClick={disconnect}
                >
                  Disconnect Wallet
                </Button>
                <Button
                  variant="iris"
                  size="sm"
                  className="w-full font-bold"
                  onClick={() => setIsWalletModalOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Connect your Web3 wallet (MetaMask, Rabby, Coinbase Wallet, Verse Wallet). Real on-chain balances and assets will be displayed directly.
              </p>

              {/* Injected Browser Wallet Primary Card */}
              <button
                onClick={handleConnectInjected}
                disabled={isConnecting}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-cyan-50 to-pink-50 hover:from-purple-100 hover:to-cyan-100 border border-purple-300 hover:border-purple-500 flex items-center justify-between text-left transition-all group cursor-pointer shadow-md shadow-purple-500/10 relative overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00D2FE] via-[#7C3AED] to-[#FF0080] flex items-center justify-center text-lg font-bold text-white shadow-sm flex-shrink-0">
                    ⚡
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                        Connect Injected Web3 Wallet
                      </h4>
                      {isEthereumAvailable ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                          Detected
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                          Browser Wallet
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-600 font-medium">
                      MetaMask, Rabby, Coinbase Wallet, Verse, Brave
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isConnecting ? (
                    <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
                  ) : (
                    <span className="text-xs text-purple-700 font-bold group-hover:translate-x-0.5 transition-transform bg-white px-2.5 py-1 rounded-lg border border-purple-200 shadow-xs">
                      Connect Wallet →
                    </span>
                  )}
                </div>
              </button>

              {/* Custom 0x Address Option */}
              <div className="pt-2">
                {!showCustomInput ? (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="text-xs text-slate-500 hover:text-purple-600 transition-colors underline cursor-pointer font-medium"
                  >
                    Or look up balances for any public address...
                  </button>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 animate-fadeIn">
                    <label className="text-[11px] text-slate-700 block font-bold">
                      Enter Address to Query Real On-Chain Balances
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={customAddressInput}
                      onChange={(e) => setCustomAddressInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-xs"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="iris"
                        size="sm"
                        className="w-full text-xs font-bold"
                        onClick={() => {
                          if (customAddressInput.trim().startsWith('0x')) {
                            handleConnectCustom(customAddressInput.trim());
                          }
                        }}
                      >
                        Query Real On-Chain Balances
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-slate-300 text-slate-700"
                        onClick={() => setShowCustomInput(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Shield Callout */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Self-custodial & non-custodial. IRISME will <strong className="text-slate-900 font-bold">never</strong> ask for your seed phrases, private keys, or credentials.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
