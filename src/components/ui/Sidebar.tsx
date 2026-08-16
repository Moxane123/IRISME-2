import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { ReputationService } from '../../services/reputationService';
import {
  LayoutDashboard,
  CreditCard,
  PlusCircle,
  Coins,
  Award,
  Flame,
  Settings,
  Store,
  User,
  QrCode,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  mode: 'merchant' | 'customer';
}

interface SidebarLink {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ mode }) => {
  const { currentPath, navigate } = useRouter();
  const { merchantProfile, customerProfile, payments, customerRewards, customerLoyaltyCards, switchRole, isMerchantAuthenticated } = useApp();

  const pendingPaymentsCount = payments.filter((p) => p.status === 'awaiting_payment' || p.status === 'pending').length;
  const claimableRewardsCount = customerRewards.filter((r) => r.status === 'claimable').length;

  const reputationStats = ReputationService.calculateReputationStats(payments, customerLoyaltyCards);

  const merchantLinks: SidebarLink[] = [
    {
      label: 'Dashboard',
      path: '/merchant',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: 'Create Payment Request',
      path: '/merchant/create-payment',
      icon: <PlusCircle className="w-4 h-4" />,
      highlight: true,
    },
    {
      label: 'Transactions & Payments',
      path: '/merchant/payments',
      icon: <CreditCard className="w-4 h-4" />,
      badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} awaiting` : undefined,
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    },
    {
      label: 'Account Portal / Sign In',
      path: '/merchant/login',
      icon: <KeyRound className="w-4 h-4" />,
      badge: isMerchantAuthenticated ? 'Active' : 'Login',
      badgeColor: isMerchantAuthenticated ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      label: 'VERSE Rewards Pool',
      path: '/merchant/rewards',
      icon: <Coins className="w-4 h-4" />,
    },
    {
      label: 'Store & Settlement Settings',
      path: '/settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const customerLinks: SidebarLink[] = [
    {
      label: 'Customer Home',
      path: '/customer',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: 'Loyalty Pass Setup',
      path: '/customer/onboarding',
      icon: <User className="w-4 h-4" />,
    },
    {
      label: 'VERSE Rewards',
      path: '/customer/rewards',
      icon: <Coins className="w-4 h-4" />,
      badge: claimableRewardsCount > 0 ? `${claimableRewardsCount} ready` : undefined,
      badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
    },
    {
      label: 'Transfer / Send',
      path: '/transfer',
      icon: <CreditCard className="w-4 h-4" />,
      badge: 'Multi-Chain',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      label: 'Loyalty Cards',
      path: '/customer/loyalty',
      icon: <Award className="w-4 h-4" />,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const links = mode === 'merchant' ? merchantLinks : customerLinks;

  return (
    <aside className="w-64 flex-shrink-0 hidden md:flex flex-col border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 justify-between">
      <div className="space-y-6">
        {/* Profile Card / Header */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 via-pink-500/10 to-transparent pointer-events-none rounded-full blur-xl" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                  mode === 'merchant'
                    ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-600 border border-cyan-300'
                    : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-pink-600 border border-pink-300 text-sm'
                }`}
              >
                {mode === 'merchant' ? <Store className="w-3.5 h-3.5" /> : (customerProfile.avatarIcon || <User className="w-3.5 h-3.5" />)}
              </div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {mode === 'merchant' ? 'Merchant Portal' : 'Customer Pass'}
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#00D2FE]" />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-900 truncate">
              {mode === 'merchant' ? merchantProfile.name || 'Merchant Account' : customerProfile.displayName || 'Customer Account'}
            </p>
            {mode === 'merchant' && (
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${reputationStats.currentTier.bgColor} ${reputationStats.currentTier.textColor} ${reputationStats.currentTier.borderColor}`}>
                {reputationStats.currentTier.badge} {reputationStats.currentTier.name}
              </span>
            )}
          </div>

          {mode === 'merchant' && (
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Merchant ID:</span>
              <span className="font-bold text-slate-700 truncate max-w-[110px]" title={merchantProfile.id}>
                {merchantProfile.id}
              </span>
            </div>
          )}

          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200">
            <span>Role Switch:</span>
            <button
              onClick={() => {
                const target = mode === 'merchant' ? 'customer' : 'merchant';
                switchRole(target);
                navigate(target === 'merchant' ? '/merchant' : '/customer');
              }}
              className="text-[#7C3AED] hover:text-[#FF0080] transition-colors font-bold cursor-pointer"
            >
              Switch to {mode === 'merchant' ? 'Customer' : 'Merchant'} →
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Navigation
          </p>
          {links.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#00D2FE]/15 via-[#7C3AED]/15 to-[#FF0080]/15 text-slate-900 border border-purple-300 font-bold shadow-sm shadow-purple-500/5'
                    : link.highlight
                    ? 'bg-slate-100 text-slate-900 hover:bg-slate-200/80 border border-slate-200 hover:border-cyan-400'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={
                      isActive
                        ? 'text-purple-600'
                        : link.highlight
                        ? 'text-cyan-600'
                        : 'text-slate-400 group-hover:text-slate-700'
                    }
                  >
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </div>

                {link.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${link.badgeColor}`}
                  >
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Interactive Payment Request Feature */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-50 to-purple-50/20 border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <QrCode className="w-3.5 h-3.5 text-[#00D2FE]" />
            <span>Instant Checkout</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
            Create custom non-custodial crypto payment links with automatic VERSE drops.
          </p>
          <button
            onClick={() => navigate('/merchant/create-payment')}
            className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00D2FE]/20 via-[#7C3AED]/20 to-[#FF0080]/20 hover:from-[#00D2FE]/30 hover:to-[#FF0080]/30 text-slate-900 text-xs font-bold border border-purple-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <span>Generate New Payment</span>
            <PlusCircle className="w-3 h-3 text-[#00D2FE]" />
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-200 space-y-2 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FE]" />
            Verse Ecosystem
          </span>
          <span className="font-mono text-slate-400 font-medium">v1.0 (MVP)</span>
        </div>
        <p className="text-[10px] leading-tight text-slate-400">
          Non-custodial merchant settlement & loyalty.
        </p>
      </div>
    </aside>
  );
};
