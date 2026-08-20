import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  CreditCard,
  PlusCircle,
  Coins,
  Settings,
  ArrowLeftRight,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { currentPath, navigate } = useRouter();

  if (currentPath === '/' || currentPath.startsWith('/pay/')) {
    return null; // Don't block screen on landing or dedicated checkout
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-3 py-2 flex items-center justify-around text-[10px] text-slate-500 shadow-lg">
      <button
        onClick={() => navigate('/merchant')}
        className={`flex flex-col items-center gap-1 p-1 cursor-pointer ${
          currentPath === '/merchant' ? 'text-purple-600 font-bold' : 'hover:text-slate-900'
        }`}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Dashboard</span>
      </button>

      <button
        onClick={() => navigate('/merchant/payments')}
        className={`flex flex-col items-center gap-1 p-1 cursor-pointer ${
          currentPath === '/merchant/payments' ? 'text-purple-600 font-bold' : 'hover:text-slate-900'
        }`}
      >
        <CreditCard className="w-4 h-4" />
        <span>Payments</span>
      </button>

      <button
        onClick={() => navigate('/merchant/create-payment')}
        className="flex flex-col items-center gap-1 p-1 text-white font-semibold cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] flex items-center justify-center -mt-5 shadow-lg shadow-purple-500/30 text-white">
          <PlusCircle className="w-5 h-5" />
        </div>
        <span className="text-purple-600 font-bold text-[10px]">Create</span>
      </button>

      <button
        onClick={() => navigate('/transfer')}
        className={`flex flex-col items-center gap-1 p-1 cursor-pointer ${
          currentPath === '/transfer' ? 'text-purple-600 font-bold' : 'hover:text-slate-900'
        }`}
      >
        <ArrowLeftRight className="w-4 h-4 text-purple-600" />
        <span>Transfer</span>
      </button>

      <button
        onClick={() => navigate('/settings')}
        className={`flex flex-col items-center gap-1 p-1 cursor-pointer ${
          currentPath === '/settings' ? 'text-purple-600 font-bold' : 'hover:text-slate-900'
        }`}
      >
        <Settings className="w-4 h-4" />
        <span>Settings</span>
      </button>
    </nav>
  );
};
