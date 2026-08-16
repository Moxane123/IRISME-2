import React, { ReactNode } from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  subvalue?: string;
  change?: string;
  isPositive?: boolean;
  icon?: ReactNode;
  accentIris?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subvalue,
  change,
  isPositive = true,
  icon,
  accentIris = false,
}) => {
  return (
    <Card
      className={`relative overflow-hidden p-5 transition-all bg-white border border-slate-200 shadow-sm ${
        accentIris ? 'border-purple-300 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 shadow-purple-500/5' : ''
      }`}
    >
      {accentIris && (
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080]" />
      )}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
          <h4 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight font-mono">{value}</h4>
          {subvalue && <p className="text-xs text-slate-500 mt-1">{subvalue}</p>}
        </div>

        {icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              accentIris
                ? 'bg-gradient-to-br from-cyan-500/15 via-purple-500/15 to-pink-500/15 border-purple-300 text-purple-600 shadow-sm'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      {change && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          <span
            className={`font-bold ${
              isPositive ? 'text-cyan-700' : 'text-rose-600'
            }`}
          >
            {change}
          </span>
          <span className="text-slate-400">vs last 30 days</span>
        </div>
      )}
    </Card>
  );
};
