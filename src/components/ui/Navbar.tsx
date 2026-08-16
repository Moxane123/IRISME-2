import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import { IrisLogo } from './IrisLogo';
import { Button } from './Button';
import { TokenLogo } from './TokenLogo';
import { TokenLogoModal } from './TokenLogoModal';
import { getChainConfig, DEFAULT_CHAIN_ID } from '../../config';
import {
  Wallet,
  Store,
  User,
  Settings,
  ChevronDown,
  Menu,
  X,
  PlusCircle,
  AlertTriangle,
  Globe,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { wallet, setIsWalletModalOpen, switchRole } = useApp();
  const { isConnected, isWrongNetwork, chainId, currentChain } = useWeb3();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  const isMerchant = currentPath.startsWith('/merchant');
  const isCustomer = currentPath.startsWith('/customer');

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleRoleToggle = (targetRole: 'merchant' | 'customer') => {
    switchRole(targetRole);
    if (targetRole === 'merchant') {
      navigate('/merchant');
    } else {
      navigate('/customer');
    }
  };

  const activeChain = currentChain || getChainConfig(DEFAULT_CHAIN_ID);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <IrisLogo size={34} showText={true} />
          </button>

          {/* Role Switcher on Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => navigate('/')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentPath === '/'
                  ? 'bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => handleRoleToggle('merchant')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isMerchant
                  ? 'bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Merchant Portal</span>
            </button>
            <button
              onClick={() => handleRoleToggle('customer')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isCustomer
                  ? 'bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer Checkout</span>
            </button>
          </nav>
        </div>

        {/* Right Actions & Wallet */}
        <div className="flex items-center gap-2.5">
          {/* Quick Create Payment CTA for Merchants */}
          <Button
            variant="iris"
            size="sm"
            className="flex items-center gap-1.5 text-xs font-bold shadow-sm"
            onClick={() => navigate('/merchant/create-payment')}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Payment</span>
          </Button>

          {/* Currency Logos & GIFs Gallery Trigger */}
          <button
            onClick={() => setIsLogoModalOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50 transition-all text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
            title="Browse all token and currency logos, animated GIFs, and live price feeds"
          >
            <TokenLogo symbol="VERSE" size="xs" variant="gif" animated={true} />
            <span>Token Logos</span>
          </button>

          {/* Network Pill */}
          {isConnected && (
            <button
              onClick={() => setIsWalletModalOpen(true)}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                isWrongNetwork
                  ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
              title="Click to switch EVM network"
            >
              {isWrongNetwork ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
              <span>{activeChain ? activeChain.shortName : `Chain ${chainId}`}</span>
            </button>
          )}

          {/* Wallet State Pill */}
          {isConnected ? (
            <button
              onClick={() => setIsWalletModalOpen(true)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-300 transition-all text-xs text-slate-700 group cursor-pointer shadow-sm"
            >
              <TokenLogo symbol="VERSE" size="xs" variant="gif" animated={true} />
              <div className="hidden lg:flex items-center gap-1.5 pr-1.5 border-r border-slate-200">
                <span className="text-[#00D2FE] font-bold font-mono">
                  {(wallet.balances?.VERSE || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">VERSE</span>
              </div>
              <span className="font-mono text-slate-800 font-semibold">{formatAddress(wallet.address)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>
          ) : (
            <Button
              variant="iris"
              size="sm"
              leftIcon={<Wallet className="w-4 h-4" />}
              onClick={() => setIsWalletModalOpen(true)}
            >
              Connect Wallet
            </Button>
          )}

          {/* Settings Button */}
          <button
            onClick={() => navigate('/settings')}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              currentPath === '/settings'
                ? 'bg-slate-100 border-slate-300 text-slate-900'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white p-4 space-y-3 animate-fadeIn shadow-lg">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                navigate('/');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-xs font-medium text-center border ${
                currentPath === '/'
                  ? 'bg-slate-100 border-slate-300 text-slate-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                handleRoleToggle('merchant');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold text-center border ${
                isMerchant
                  ? 'bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] text-white border-purple-500'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              Merchant
            </button>
            <button
              onClick={() => {
                handleRoleToggle('customer');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold text-center border ${
                isCustomer
                  ? 'bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] text-white border-purple-500'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              Customer
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
            <button
              onClick={() => {
                navigate('/merchant/create-payment');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
            >
              <PlusCircle className="w-4 h-4 text-[#00D2FE]" />
              <span>Create Payment Invoice</span>
            </button>
            <button
              onClick={() => {
                navigate('/merchant/payments');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              Merchant Payments List
            </button>
            <button
              onClick={() => {
                navigate('/customer/rewards');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              Customer VERSE Rewards
            </button>
            <button
              onClick={() => {
                navigate('/customer/loyalty');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              Merchant Loyalty Cards
            </button>
            <button
              onClick={() => {
                setIsLogoModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-purple-700 hover:bg-purple-50 font-bold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Token Logos & Animated GIFs</span>
            </button>
          </div>
        </div>
      )}

      {/* Currency & Token Logos Modal */}
      <TokenLogoModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        onSelectToken={(sym) => {
          setIsLogoModalOpen(false);
        }}
      />
    </header>
  );
};
