import React from 'react';
import {
  SUPPORTED_CHAINS,
  SupportedAsset,
  getAssetsForChain,
  formatAssetLabel,
  getChainConfig,
} from '../../config';
import { SupportedToken } from '../../types';
import { TokenLogo } from './TokenLogo';
import { Layers, ShieldCheck, Check, ChevronDown, Coins, Fuel } from 'lucide-react';

interface PaymentNetworkSelectorProps {
  selectedChainId: number;
  selectedToken: SupportedToken;
  onChainChange: (chainId: number) => void;
  onTokenChange: (token: SupportedToken) => void;
  amountUSD?: number;
  onAmountChange?: (amount: number) => void;
  isAmountEditable?: boolean;
  balances?: Record<string, number | undefined>;
  disabled?: boolean;
  showBalances?: boolean;
  className?: string;
}

export const PaymentNetworkSelector: React.FC<PaymentNetworkSelectorProps> = ({
  selectedChainId,
  selectedToken,
  onChainChange,
  onTokenChange,
  amountUSD,
  onAmountChange,
  isAmountEditable = false,
  balances = {},
  disabled = false,
  showBalances = true,
  className = '',
}) => {
  const currentChain = getChainConfig(selectedChainId) || SUPPORTED_CHAINS[137];
  const availableAssets = getAssetsForChain(selectedChainId);

  // If current selectedToken is not supported on this chain, pick the first available token
  React.useEffect(() => {
    const isSupported = availableAssets.some((a) => a.symbol === selectedToken);
    if (!isSupported && availableAssets.length > 0) {
      onTokenChange(availableAssets[0].symbol);
    }
  }, [selectedChainId, availableAssets, selectedToken, onTokenChange]);

  const selectedAsset = availableAssets.find((a) => a.symbol === selectedToken) || availableAssets[0];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Payment Network Selection */}
      <div>
        <label className="block text-[11px] font-mono uppercase text-slate-500 font-bold mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            1. Select Settlement Network
          </span>
          <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            Chain ID: {selectedChainId}
          </span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.values(SUPPORTED_CHAINS)
            .filter((chain) => !chain.isTestnet)
            .map((chain) => {
              const isSelected = chain.id === selectedChainId;
              return (
                <button
                  key={chain.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChainChange(chain.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-50/90 border-purple-600 shadow-xs ring-1 ring-purple-600/30'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xl">{chain.icon}</span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>
                      {chain.shortName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Fuel className="w-2.5 h-2.5 text-amber-500" />
                      {chain.nativeCurrency.symbol} Gas
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* 2. Payment Asset Selection (Token + Blockchain) */}
      <div>
        <label className="block text-[11px] font-mono uppercase text-slate-500 font-bold mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-purple-600" />
            2. Payment Asset ({currentChain.shortName})
          </span>
          <span className="text-[10px] text-slate-400">
            Identified by Token + Blockchain
          </span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableAssets.map((asset) => {
            const isSelected = asset.symbol === selectedToken;
            const userBal = balances[asset.symbol] ?? (asset.isNative && (asset.symbol === 'MATIC' || asset.symbol === 'POL') ? (balances['MATIC'] ?? 0) : 0);

            return (
              <button
                key={asset.id}
                type="button"
                disabled={disabled}
                onClick={() => onTokenChange(asset.symbol)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50 text-slate-800'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <TokenLogo
                    symbol={asset.symbol}
                    size="md"
                    variant={isSelected ? 'gif' : 'icon'}
                    animated={isSelected}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs truncate">{asset.symbol}</span>
                      {asset.isNative && (
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 font-semibold'
                          }`}
                        >
                          Native
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] truncate ${isSelected ? 'text-purple-100' : 'text-slate-400'}`}>
                      {asset.name.split('(')[0]}
                    </div>
                  </div>
                </div>

                {showBalances && userBal !== undefined && (
                  <div className="text-right pl-1 shrink-0">
                    <div className={`text-[10px] font-mono font-medium ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                      {typeof userBal === 'number' ? userBal.toFixed(userBal < 1 ? 3 : 1) : userBal}
                    </div>
                    <div className={`text-[9px] ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                      bal
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Asset Verified Badge */}
        {selectedAsset && (
          <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Asset: <strong className="text-slate-800">{formatAssetLabel(selectedAsset)}</strong></span>
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
              {selectedAsset.isNative
                ? `Native ${selectedAsset.nativeGasToken} Gas Currency`
                : selectedAsset.contractAddress
                ? `${selectedAsset.contractAddress.slice(0, 6)}...${selectedAsset.contractAddress.slice(-4)}`
                : 'Verified Protocol Asset'}
            </span>
          </div>
        )}
      </div>

      {/* 3. Optional Payment Amount Selection */}
      {isAmountEditable && onAmountChange && (
        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-500 font-bold mb-1.5">
            3. Payment Amount (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
            <input
              type="number"
              min="0.10"
              step="any"
              value={amountUSD || ''}
              onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
              disabled={disabled}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
};
