import React from 'react';
import { FIAT_LOGO_DATA } from '../../config/tokenLogos';

export interface CurrencyLogoProps {
  currency: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showSign?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { box: 'w-5 h-5 text-xs', flag: 'text-xs', text: 'text-xs' },
  md: { box: 'w-7 h-7 text-sm', flag: 'text-sm', text: 'text-sm' },
  lg: { box: 'w-9 h-9 text-base', flag: 'text-base', text: 'text-base' },
  xl: { box: 'w-12 h-12 text-lg', flag: 'text-xl', text: 'text-lg' },
};

export const CurrencyLogo: React.FC<CurrencyLogoProps> = ({
  currency,
  size = 'md',
  showName = false,
  showSign = true,
  className = '',
}) => {
  const code = (currency || 'USD').toUpperCase().trim();
  const info = FIAT_LOGO_DATA[code] || {
    symbol: code,
    name: `${code} Currency`,
    flag: '🌐',
    sign: code,
    color: '#64748B',
  };

  const dim = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`${dim.box} rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-2xs font-bold`}
        style={{ color: info.color }}
        title={`${info.name} (${info.symbol})`}
      >
        <span>{info.flag}</span>
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1">
          <span className={`font-bold text-slate-900 ${dim.text}`}>{info.symbol}</span>
          {showSign && (
            <span className="text-[10px] text-slate-400 font-mono">({info.sign})</span>
          )}
        </div>
        {showName && <span className="text-[10px] text-slate-500 truncate">{info.name}</span>}
      </div>
    </div>
  );
};
