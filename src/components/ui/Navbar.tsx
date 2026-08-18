import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import { IrisLogo } from './IrisLogo';
import { Button } from './Button';
import { TokenLogo } from './TokenLogo';
import { TokenLogoModal } from './TokenLogoModal';
import { QRScannerModal } from './QRScannerModal';
import { NotificationCenter } from './NotificationCenter';
import { getChainConfig, DEFAULT_CHAIN_ID } from '../../config';
import {
  Wallet,
  Store,
  Settings,
  ChevronDown,
  Menu,
  X,
  PlusCircle,
  AlertTriangle,
  Sparkles,
  QrCode,
  CreditCard,
  KeyRound,
  Camera,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const {
    wallet,
    setIsWalletModalOpen,
    isMerchantAuthenticated,
    merchantProfile,
    openTutorial,
  } = useApp();
  const { isConnected, isWrongNetwork, chainId, currentChain } = useWeb3();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  const isMerchant = currentPath.startsWith('/merchant') || currentPath === '/';

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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

          {/* Navigation on Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => navigate('/merchant')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentPath === '/merchant'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-purple-600" />
              <span>Merchant Portal</span>
            </button>

            <button
              onClick={() => navigate('/merchant/payments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentPath === '/merchant/payments'
                  ? 'bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Invoices & Payments
            </button>

            <button
              onClick={() => navigate('/merchant/rewards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentPath === '/merchant/rewards'
                  ? 'bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              VERSE Rewards Pool
            </button>

            <button
              onClick={() => navigate('/transfer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentPath === '/transfer'
                  ? 'bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Multi-Chain Transfer
            </button>
          </nav>
        </div>

        {/* Right Actions & Wallet */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Tutorial & Interactive Demo Trigger */}
          <button
            onClick={() => openTutorial('customer')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-xs font-bold text-purple-900 transition-all cursor-pointer shadow-xs"
            title="Interactive tutorial on how customers pay and how merchants create channels"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            <span>Tutorial & Demo</span>
          </button>

          {/* Scan QR Code to Pay Button */}
          <button
            onClick={() => setIsScannerModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-xs"
            title="Scan customer barcode or QR code to test or pay invoice"
          >
            <Camera className="w-3.5 h-3.5 text-[#00D2FE]" />
            <span className="hidden sm:inline">Scan to Pay</span>
          </button>

          {/* Quick Create Payment CTA for Merchants */}
          <Button
            variant="iris"
            size="sm"
            className="flex items-center gap-1.5 text-xs font-bold shadow-sm"
            onClick={() => navigate('/merchant/create-payment')}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create Payment</span>
            <span className="sm:hidden">Create</span>
          </Button>

          {/* In-App Essential Payment Notifications */}
          <NotificationCenter />

          {/* Currency Logos & GIFs Gallery Trigger */}
          <button
            onClick={() => setIsLogoModalOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50 transition-all text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
            title="Browse all token and currency logos, animated GIFs, and live price feeds"
          >
            <TokenLogo symbol="VERSE" size="xs" variant="gif" animated={true} />
            <span>Tokens</span>
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
              className="flex items-center gap-1.5 text-xs font-bold shadow-md shadow-purple-500/20"
              onClick={() => setIsWalletModalOpen(true)}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet</span>
            </Button>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl animate-fadeIn">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                navigate('/merchant');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold text-center border ${
                currentPath === '/merchant'
                  ? 'bg-purple-50 border-purple-300 text-purple-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              Merchant Portal
            </button>
            <button
              onClick={() => {
                setIsScannerModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl text-xs font-bold text-center border bg-slate-50 border-slate-200 text-slate-700 flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-[#00D2FE]" />
              <span>Scan Barcode</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
            <button
              onClick={() => {
                openTutorial('customer');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 text-purple-900 font-bold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
              <span>Quick Tutorial & Live Demo</span>
            </button>
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
              className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span>Merchant Invoices & Payments</span>
            </button>
            <button
              onClick={() => {
                navigate('/merchant/rewards');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              VERSE Rewards Pool
            </button>
            <button
              onClick={() => {
                navigate('/transfer');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              Multi-Chain Transfer Tool
            </button>
            <button
              onClick={() => {
                navigate('/settings');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Settings & Settlements</span>
            </button>
            <button
              onClick={() => {
                setIsLogoModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-purple-700 hover:bg-purple-50 font-bold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Token Logos Gallery</span>
            </button>
          </div>
        </div>
      )}

      {/* Currency & Token Logos Modal */}
      <TokenLogoModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        onSelectToken={() => {
          setIsLogoModalOpen(false);
        }}
      />

      {/* QR & Barcode Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
      />
    </header>
  );
};
