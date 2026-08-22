import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { Button } from '../ui/Button';
import {
  Store,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Settings,
} from 'lucide-react';

interface MerchantRegistrationRequiredProps {
  title?: string;
  description?: string;
}

export const MerchantRegistrationRequired: React.FC<MerchantRegistrationRequiredProps> = ({
  title = 'Register Your Business First',
  description = 'To access the merchant dashboard environment, generate multi-chain payment requests, and receive non-custodial crypto settlements, please register your business and configure your receiving wallet address.',
}) => {
  const { navigate } = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 animate-fadeIn">
      <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-6 shadow-sm">
        {/* Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 border border-purple-200 flex items-center justify-center shadow-xs">
          <Store className="w-10 h-10 text-purple-600" />
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2.5 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold font-mono uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Merchant Environment Locked</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* What You Set Up */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-3">
          <div className="font-bold text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>What You Configure During Registration:</span>
          </div>
          <ul className="space-y-2 text-slate-600">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">Your Business Identity:</strong> Store name, trade category, website, and support contact.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">Your Receiving EVM Wallet Address:</strong> 100% of customer payments settle directly into your wallet with zero intermediary escrow.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">Custom VERSE Cashback & Loyalty:</strong> Set reward percentages and launch automated customer loyalty campaigns.
              </div>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="iris"
            size="lg"
            leftIcon={<Store className="w-5 h-5" />}
            onClick={() => navigate('/merchant/register')}
            className="cursor-pointer font-bold shadow-md w-full sm:w-auto px-7 py-3 text-sm"
          >
            Register Business Now
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/merchant/login')}
            className="cursor-pointer font-bold w-full sm:w-auto px-6 py-3 border-slate-300 text-sm hover:bg-slate-50"
          >
            Sign In to Account
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            className="cursor-pointer text-xs text-slate-500 hover:text-purple-600 flex items-center gap-1 font-semibold"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
