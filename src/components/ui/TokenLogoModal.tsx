import React, { useState } from 'react';
import { TOKEN_LOGO_DATA, TokenLogoMeta, FIAT_LOGO_DATA } from '../../config/tokenLogos';
import { TokenLogo } from './TokenLogo';
import { CurrencyLogo } from './CurrencyLogo';
import { PriceService } from '../../services/priceService';
import { X, Search, Sparkles, ExternalLink, ShieldCheck, Coins, Copy, Check } from 'lucide-react';

interface TokenLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken?: (symbol: string) => void;
}

export const TokenLogoModal: React.FC<TokenLogoModalProps> = ({
  isOpen,
  onClose,
  onSelectToken,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'crypto' | 'stablecoin' | 'native' | 'fiat'>('all');
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);

  if (!isOpen) return null;

  const allTokens = Object.values(TOKEN_LOGO_DATA);
  const allFiats = Object.values(FIAT_LOGO_DATA);

  const filteredTokens = allTokens.filter((token) => {
    const matchesSearch =
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'crypto' && (token.category === 'crypto' || token.category === 'reward')) ||
      (selectedCategory === 'stablecoin' && token.category === 'stablecoin') ||
      (selectedCategory === 'native' && token.category === 'native');

    return matchesSearch && matchesCategory;
  });

  const handleCopy = (text: string, sym: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSymbol(sym);
    setTimeout(() => setCopiedSymbol(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-pink-50/40 to-cyan-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00D2FE] via-[#7C3AED] to-[#FF0080] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Currency & Token Logo Gallery</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                  Official Logos & Animated GIF Badges
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Inspect official high-resolution vector logos, 3D animated GIF badges, and real-time prices.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search token by name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'all', label: 'All Currencies' },
                { id: 'crypto', label: 'Crypto & Verse' },
                { id: 'stablecoin', label: 'Stablecoins' },
                { id: 'native', label: 'Layer-1 Gas' },
                { id: 'fiat', label: 'Fiat Currency' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Token Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[55vh] space-y-4">
          {/* Fiat Currency Section when viewing All or Fiat */}
          {(selectedCategory === 'all' || selectedCategory === 'fiat') && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Global Invoicing Fiat Currencies
                </span>
                <span className="text-[10px] text-slate-400 font-mono">6 Currencies</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allFiats.map((fiat) => (
                  <div
                    key={fiat.symbol}
                    className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-purple-300 hover:bg-white transition-all flex items-center justify-between"
                  >
                    <CurrencyLogo currency={fiat.symbol} size="md" showName={true} />
                    <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      {fiat.sign}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Crypto Tokens Grid */}
          {selectedCategory !== 'fiat' && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Supported Cryptocurrencies & Assets
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {filteredTokens.length} Tokens
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredTokens.map((token) => {
                  const currentPrice = PriceService.getPrice(token.symbol as any);
                  return (
                    <div
                      key={token.symbol}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-[#7C3AED] hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Animated 3D GIF Coin Logo */}
                          <TokenLogo
                            symbol={token.symbol}
                            size="lg"
                            variant="gif"
                            animated={true}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-black text-slate-900 text-sm">{token.symbol}</h3>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 font-mono uppercase">
                                {token.badgeLabel}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{token.name}</p>
                          </div>
                        </div>

                        {/* Live Price Tag */}
                        <div className="text-right">
                          <p className="font-mono font-black text-slate-900 text-xs sm:text-sm">
                            ${currentPrice >= 1 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : currentPrice.toFixed(6)}
                          </p>
                          <span className="text-[10px] text-emerald-600 font-bold">USD Live</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
                        {token.description}
                      </p>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <button
                          type="button"
                          onClick={() => handleCopy(token.symbol, token.symbol)}
                          className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-mono"
                        >
                          {copiedSymbol === token.symbol ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copy Symbol</span>
                            </>
                          )}
                        </button>

                        {onSelectToken && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectToken(token.symbol);
                              onClose();
                            }}
                            className="px-3 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-colors cursor-pointer"
                          >
                            Select Token →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographically Verified Logo Assets & Standards</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
