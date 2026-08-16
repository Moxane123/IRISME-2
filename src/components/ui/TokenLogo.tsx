import React, { useState } from 'react';
import { TOKEN_LOGO_DATA, TokenLogoMeta } from '../../config/tokenLogos';
import { SupportedToken } from '../../types';

export interface TokenLogoProps {
  symbol: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  variant?: 'icon' | 'coin' | 'badge' | 'gif' | 'detailed';
  animated?: boolean;
  showName?: boolean;
  showSymbol?: boolean;
  chainBadge?: 'polygon' | 'ethereum' | 'bsc' | 'avalanche' | 'solana' | 'tron' | 'bitcoin' | number | string;
  className?: string;
  onClick?: () => void;
}

const SIZE_MAP = {
  xs: { box: 'w-4 h-4', px: 16, text: 'text-[9px]', sub: 'text-[8px]' },
  sm: { box: 'w-5 h-5', px: 20, text: 'text-[10px]', sub: 'text-[9px]' },
  md: { box: 'w-7 h-7', px: 28, text: 'text-xs', sub: 'text-[10px]' },
  lg: { box: 'w-9 h-9', px: 36, text: 'text-sm', sub: 'text-xs' },
  xl: { box: 'w-11 h-11', px: 44, text: 'text-base', sub: 'text-xs' },
  '2xl': { box: 'w-14 h-14', px: 56, text: 'text-lg', sub: 'text-xs' },
  '3xl': { box: 'w-20 h-20', px: 80, text: 'text-2xl', sub: 'text-sm' },
};

const CHAIN_ICONS: Record<string, { label: string; icon: string; color: string }> = {
  '137': { label: 'Polygon', icon: '🟣', color: '#8247E5' },
  'polygon': { label: 'Polygon', icon: '🟣', color: '#8247E5' },
  '1': { label: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
  'ethereum': { label: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
  '56': { label: 'BSC', icon: '🟡', color: '#F0B90B' },
  'bsc': { label: 'BSC', icon: '🟡', color: '#F0B90B' },
  '43114': { label: 'Avalanche', icon: '🔺', color: '#E84142' },
  'avalanche': { label: 'Avalanche', icon: '🔺', color: '#E84142' },
  'solana': { label: 'Solana', icon: '◎', color: '#14F195' },
  'tron': { label: 'TRON', icon: '🔴', color: '#FF060A' },
  'bitcoin': { label: 'Bitcoin', icon: '₿', color: '#F7931A' },
};

export const TokenLogo: React.FC<TokenLogoProps> = ({
  symbol,
  size = 'md',
  variant = 'icon',
  animated = false,
  showName = false,
  showSymbol = false,
  chainBadge,
  className = '',
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const upperSymbol = (symbol || 'VERSE').toUpperCase().trim();
  
  // Normalize symbol (e.g. POL -> MATIC or vice versa)
  const meta: TokenLogoMeta = TOKEN_LOGO_DATA[upperSymbol] ||
    TOKEN_LOGO_DATA[upperSymbol === 'POL' ? 'MATIC' : upperSymbol === 'WETH' ? 'ETH' : 'VERSE'] || {
      symbol: upperSymbol,
      name: upperSymbol,
      category: 'crypto',
      primaryColor: '#7C3AED',
      secondaryColor: '#EC4899',
      glowColor: 'rgba(124, 58, 237, 0.4)',
      gifBackground: 'radial-gradient(circle at 30% 30%, #C4B5FD, #7C3AED 60%, #4C1D95 100%)',
      badgeLabel: 'Token',
      description: `${upperSymbol} digital currency`,
      svgIcon: `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#7C3AED"/><text x="16" y="21" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${upperSymbol.slice(0, 3)}</text></svg>`,
    };

  const dim = SIZE_MAP[size] || SIZE_MAP.md;
  const isAnimated = animated || variant === 'gif';

  const chainInfo = chainBadge ? CHAIN_ICONS[String(chainBadge).toLowerCase()] : undefined;

  // The base SVG rendered safely
  const renderSvg = () => (
    <div
      className="w-full h-full flex items-center justify-center select-none"
      dangerouslySetInnerHTML={{ __html: meta.svgIcon }}
    />
  );

  // 1. Full Detailed Variant
  if (variant === 'detailed') {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        <div className="relative flex-shrink-0">
          <div
            className={`w-10 h-10 rounded-2xl p-1 flex items-center justify-center transition-transform ${
              isHovered ? 'scale-110' : ''
            }`}
            style={{
              background: meta.gifBackground,
              boxShadow: `0 4px 14px ${meta.glowColor}`,
            }}
          >
            <div className="w-7 h-7">{renderSvg()}</div>
          </div>
          {chainInfo && (
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border border-white bg-slate-900 text-white shadow-xs"
              title={`Network: ${chainInfo.label}`}
            >
              {chainInfo.icon}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-slate-900 truncate">{meta.symbol}</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono">
              {meta.badgeLabel}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">{meta.name}</p>
        </div>
      </div>
    );
  }

  // 2. GIF / Holographic 3D Coin Badge Variant
  if (variant === 'gif' || variant === 'coin') {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`inline-flex items-center gap-2 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <div className="relative group">
          {/* Pulsing Animated Halo */}
          {isAnimated && (
            <div
              className="absolute -inset-1 rounded-full opacity-70 blur-xs animate-pulse pointer-events-none"
              style={{ background: meta.glowColor }}
            />
          )}

          {/* 3D Holographic / GIF Coin Container */}
          <div
            className={`relative ${dim.box} rounded-full flex items-center justify-center shadow-md transition-all duration-300 overflow-hidden ${
              isAnimated ? 'hover:rotate-12 hover:scale-110' : 'hover:scale-105'
            }`}
            style={{
              background: meta.gifBackground,
              boxShadow: `0 2px 8px ${meta.glowColor}, inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.3)`,
            }}
          >
            {/* Specular Holographic Glare */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent opacity-80 pointer-events-none" />

            {/* Inner Core SVG Logo */}
            <div className="relative z-10 w-[78%] h-[78%] drop-shadow-sm flex items-center justify-center">
              {renderSvg()}
            </div>
          </div>

          {/* Optional Chain Sub-Badge */}
          {chainInfo && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold border border-white bg-slate-900 text-white shadow-xs"
              title={`Network: ${chainInfo.label}`}
            >
              {chainInfo.icon}
            </span>
          )}
        </div>

        {/* Optional Label */}
        {(showSymbol || showName) && (
          <div className="flex flex-col min-w-0">
            {showSymbol && <span className={`font-bold text-slate-900 ${dim.text}`}>{meta.symbol}</span>}
            {showName && <span className={`text-slate-500 truncate ${dim.sub}`}>{meta.name}</span>}
          </div>
        )}
      </div>
    );
  }

  // 3. Compact Badge Variant
  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        <div className={`relative ${dim.box} flex-shrink-0`}>
          {renderSvg()}
        </div>
        <span className="font-bold text-xs text-slate-900">{meta.symbol}</span>
        {chainInfo && (
          <span className="text-[10px] text-slate-400 font-mono">({chainInfo.label})</span>
        )}
      </div>
    );
  }

  // 4. Default Icon Variant
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className={`relative ${dim.box} flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden shadow-2xs`}>
        {renderSvg()}
        {chainInfo && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold border border-white bg-slate-900 text-white shadow-xs"
            title={`Network: ${chainInfo.label}`}
          >
            {chainInfo.icon}
          </span>
        )}
      </div>

      {(showSymbol || showName) && (
        <div className="flex flex-col min-w-0">
          {showSymbol && <span className={`font-bold text-slate-900 ${dim.text}`}>{meta.symbol}</span>}
          {showName && <span className={`text-slate-500 truncate ${dim.sub}`}>{meta.name}</span>}
        </div>
      )}
    </div>
  );
};
