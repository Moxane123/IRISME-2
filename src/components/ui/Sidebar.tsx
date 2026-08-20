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
  ShieldCheck,
  KeyRound,
  ArrowLeftRight,
} from 'lucide-react';

interface SidebarProps {
  mode?: 'merchant' | 'customer';
}

interface SidebarLink {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
  isAction?: boolean;
  action?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { currentPath, navigate } = useRouter();
  const {
    merchantProfile,
    payments,
    customerLoyaltyCards,
    isMerchantAuthenticated,
  } = useApp();

  const pendingPaymentsCount = payments.filter(
    (p) => p.status === 'awaiting_payment' || p.status === 'pending'
  ).length;

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
      label: 'Multi-Chain Transfer',
      path: '/transfer',
      icon: <ArrowLeftRight className="w-4 h-4" />,
      badge: 'Pay Tool',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      label: 'VERSE Rewards Pool',
      path: '/merchant/rewards',
      icon: <Coins className="w-4 h-4" />,
    },
    {
      label: 'Customer Loyalty Cards',
      path: '/merchant/loyalty',
      icon: <Award className="w-4 h-4" />,
    },
    {
      label: 'Marketing Campaigns',
      path: '/merchant/campaigns',
      icon: <Flame className="w-4 h-4" />,
    },
    {
      label: 'Store & Settlements',
      path: '/settings',
      icon: <Settings className="w-4 h-4" />,
    },
    {
      label: 'Merchant Sign In / Portal',
      path: '/merchant/login',
      icon: <KeyRound className="w-4 h-4" />,
      badge: isMerchantAuthenticated ? 'Active' : 'Sign In',
      badgeColor: isMerchantAuthenticated
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 hidden md:flex flex-col border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 justify-between">
      <div className="space-y-6">
        {/* Merchant Profile Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 via-pink-500/10 to-transparent pointer-events-none rounded-full blur-xl" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-600 border border-cyan-300">
                <Store className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Merchant Portal
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#00D2FE]" />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-900 truncate">
              {merchantProfile.name || 'Merchant Account'}
            </p>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${reputationStats.currentTier.bgColor} ${reputationStats.currentTier.textColor} ${reputationStats.currentTier.borderColor}`}
            >
              {reputationStats.currentTier.badge} {reputationStats.currentTier.name}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Settlement:</span>
            <span
              className="font-bold text-slate-700 truncate max-w-[110px]"
              title={merchantProfile.settlementAddress}
            >
              {merchantProfile.settlementAddress
                ? `${merchantProfile.settlementAddress.slice(0, 6)}...${merchantProfile.settlementAddress.slice(-4)}`
                : 'Not Set'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {merchantLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.label}
                onClick={() => {
                  if (link.isAction && link.action) {
                    link.action();
                  } else {
                    navigate(link.path);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  link.highlight
                    ? 'bg-gradient-to-r from-[#00D2FE]/10 via-[#7C3AED]/10 to-[#FF0080]/10 border border-purple-200 text-purple-700 hover:border-purple-400 font-bold'
                    : isActive
                    ? 'bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive || link.highlight ? 'text-purple-600' : 'text-slate-400'}>
                    {link.icon}
                  </span>
                  <span className="truncate">{link.label}</span>
                </div>
                {link.badge && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      link.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Settlement Security Badge */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/30 border border-slate-200 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Non-Custodial Protocol</span>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="text-[10px] text-purple-700 hover:text-purple-900 font-mono font-bold hover:underline cursor-pointer"
            title="Protected Server-Side System Admin"
          >
            Admin Ops
          </button>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Direct on-chain settlements on Verse L2 & Polygon. Zero customer registration required.
        </p>
      </div>
    </aside>
  );
};
