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
} from 'lucide-react';

export const WalletModal: React.FC = () => {
  const { wallet, isWalletModalOpen, setIsWalletModalOpen, switchRole } = useApp();
  const {
    isAvailable: isEthereumAvailable,
    isConnected,
    isConnecting,
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
    const success = await connectInjected();
    if (success) {
      // modal can remain open or close
    }
  };

  const handleConnectDemo = (customAddr?: string) => {
    connectDemo(customAddr);
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
              <h3 className="font-bold text-slate-900 text-base tracking-tight">Self-Custodial Web3 Wallet</h3>
              <p className="text-xs text-slate-500">EVM-compatible connection for Verse settlement</p>
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
                  {error.isUserRejection ? 'Request Rejected' : 'Connection Error'}
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
                    <span className="w-2 h-2 rounded-full bg-[#00D2FE] animate-pulse" />
                    <span className="text-slate-700 font-bold">
                      {walletMode === 'injected' ? 'EVM Injected' : 'Simulation Mode'}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                      isWrongNetwork
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-cyan-50 text-cyan-800 border-cyan-300'
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
                      {copied ? <Check className="w-4 h-4 text-[#00D2FE]" /> : <Copy className="w-4 h-4" />}
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
                  Active EVM Network
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                    className="w-full p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-800 transition-colors cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#00D2FE]" />
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
                              ? 'bg-gradient-to-r from-[#00D2FE]/15 to-[#7C3AED]/15 text-slate-900 font-bold border border-cyan-300'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                chain.isTestnet ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            />
                            <span>{chain.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{chain.shortName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Wallet Balances Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Wallet Balances</span>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="text-[11px] text-[#7C3AED] font-mono font-bold flex items-center gap-1 hover:text-[#FF0080] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#00D2FE] font-bold">⚡</span>
                      <span className="text-slate-700 font-medium">VERSE</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {(balances.VERSE || 0).toLocaleString()}
                    </span>
                  </div>

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
                      <span className="text-slate-700 font-medium">
                        {chainId === 137 || chainId === 80002 ? 'POL' : 'ETH'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {chainId === 137 || chainId === 80002
                        ? balances.MATIC || 0
                        : balances.ETH || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Role Switcher */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-[#7C3AED]" />
                  <div>
                    <p className="font-bold text-slate-900">
                      Active Role: <span className="capitalize text-[#7C3AED]">{wallet.role}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal">Switch merchant / customer view</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => switchRole('merchant')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      wallet.role === 'merchant'
                        ? 'bg-gradient-to-r from-[#00D2FE] to-[#7C3AED] text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Merchant
                  </button>
                  <button
                    onClick={() => switchRole('customer')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      wallet.role === 'customer'
                        ? 'bg-gradient-to-r from-[#7C3AED] to-[#FF0080] text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Customer
                  </button>
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
                  Disconnect
                </Button>
                <Button
                  variant="iris"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsWalletModalOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Connect your EVM-compatible self-custodial wallet. Your private keys never leave your browser.
              </p>

              {/* Injected Browser Wallet Primary Card */}
              <button
                onClick={handleConnectInjected}
                disabled={isConnecting}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-purple-50/30 hover:from-slate-100 hover:to-purple-50/50 border border-slate-200 hover:border-purple-300 flex items-center justify-between text-left transition-all group cursor-pointer shadow-sm relative overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D2FE] to-[#7C3AED] flex items-center justify-center text-lg font-bold text-white shadow-sm flex-shrink-0">
                    ⚡
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                        Injected EVM Wallet
                      </h4>
                      {isEthereumAvailable ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                          Detected
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                          EIP-1193
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      MetaMask, Rabby, Coinbase, Brave, Rainbow
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 text-[#7C3AED] animate-spin" />
                  ) : (
                    <span className="text-xs text-[#7C3AED] font-bold group-hover:translate-x-0.5 transition-transform">
                      Connect →
                    </span>
                  )}
                </div>
              </button>

              {/* Demo Mode / Custom Address Button */}
              <div className="pt-2">
                <button
                  onClick={() => handleConnectDemo()}
                  className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-left transition-all text-xs cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🧪</span>
                    <div>
                      <h5 className="font-bold text-slate-800 group-hover:text-slate-950">
                        Use Testnet / Demo Wallet
                      </h5>
                      <p className="text-[11px] text-slate-500 font-normal">Test checkout & VERSE cashback without real gas</p>
                    </div>
                  </div>
                  <span className="text-slate-500 font-medium group-hover:text-slate-900">Select →</span>
                </button>
              </div>

              {/* Custom 0x Address Option */}
              <div className="pt-1">
                {!showCustomInput ? (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="text-xs text-slate-500 hover:text-purple-600 transition-colors underline cursor-pointer font-medium"
                  >
                    Or connect with custom 0x address...
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-fadeIn">
                    <label className="text-[11px] text-slate-600 block font-mono font-medium">
                      0x Wallet Address (42 characters)
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={customAddressInput}
                      onChange={(e) => setCustomAddressInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="iris"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          if (customAddressInput.trim().startsWith('0x')) {
                            handleConnectDemo(customAddressInput.trim());
                          }
                        }}
                      >
                        Set Custom Address
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
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-[#00D2FE] flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Self-custodial & trustless. IRISME will <strong className="text-slate-900 font-bold">never</strong> request your seed phrases, private keys, or wallet credentials.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
