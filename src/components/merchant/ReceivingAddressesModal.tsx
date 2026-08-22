import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import {
  validateAddressForNetwork,
} from '../../config/multiChainTokens';
import {
  X,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Save,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface ReceivingAddressesModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightNetwork?: string;
}

const NETWORKS_LIST = [
  {
    name: 'Solana',
    symbol: 'SOL / SPL',
    format: 'Solana Base58 (32-44 chars)',
    placeholder: 'e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    sample: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    note: 'Used for USDC on Solana (SPL Token). Do not enter 0x or Tron address.',
    color: '#9945FF',
  },
  {
    name: 'Ethereum',
    symbol: 'ETH / ERC-20',
    format: 'EVM Hexadecimal (0x... 42 chars)',
    placeholder: 'e.g. 0x...',
    sample: '',
    note: 'Used for USDC & USDT on Ethereum (ERC-20).',
    color: '#627EEA',
  },
  {
    name: 'Polygon',
    symbol: 'POL / ERC-20',
    format: 'EVM Hexadecimal (0x... 42 chars)',
    placeholder: 'e.g. 0x...',
    sample: '',
    note: 'Used for VERSE, USDC & USDT on Polygon Hub.',
    color: '#8247E5',
  },
  {
    name: 'Tron',
    symbol: 'TRX / TRC-20',
    format: 'Base58 starting with T (34 chars)',
    placeholder: 'e.g. TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    sample: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    note: 'Used for USDT on TRON (TRC-20). Never use an Ethereum or Bitcoin address.',
    color: '#EB0029',
  },
  {
    name: 'BNB Smart Chain',
    symbol: 'BNB / BEP-20',
    format: 'EVM Hexadecimal (0x... 42 chars)',
    placeholder: 'e.g. 0x55d398326f99059fF775485246999027B3197955',
    sample: '0x55d398326f99059fF775485246999027B3197955',
    note: 'Used for USDT on BNB Smart Chain (BEP-20).',
    color: '#F0B90B',
  },
  {
    name: 'Bitcoin',
    symbol: 'BTC / UTXO',
    format: 'Native SegWit / Legacy (bc1..., 1..., 3...)',
    placeholder: 'e.g. bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    sample: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    note: 'Used for Native Bitcoin on Layer 1 UTXO rail. Never use an EVM 0x address.',
    color: '#F7931A',
  },
];

export const ReceivingAddressesModal: React.FC<ReceivingAddressesModalProps> = ({
  isOpen,
  onClose,
  highlightNetwork,
}) => {
  const { merchantProfile, updateMerchantProfile } = useApp();

  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAddresses({
        Solana: merchantProfile.merchantReceivingAddresses?.Solana || '',
        Ethereum: merchantProfile.merchantReceivingAddresses?.Ethereum || merchantProfile.settlementAddress || '',
        Polygon: merchantProfile.merchantReceivingAddresses?.Polygon || merchantProfile.settlementAddress || '',
        Tron: merchantProfile.merchantReceivingAddresses?.Tron || '',
        'BNB Smart Chain': merchantProfile.merchantReceivingAddresses?.['BNB Smart Chain'] || merchantProfile.settlementAddress || '',
        Bitcoin: merchantProfile.merchantReceivingAddresses?.Bitcoin || '',
      });
      setSavedSuccess(false);
    }
  }, [isOpen, merchantProfile]);

  if (!isOpen) return null;

  const handleInputChange = (network: string, val: string) => {
    setAddresses((prev) => ({
      ...prev,
      [network]: val,
    }));
  };

  const handleSetSample = (network: string, sampleVal: string) => {
    setAddresses((prev) => ({
      ...prev,
      [network]: sampleVal,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const primaryEVM =
        addresses.Polygon ||
        addresses.Ethereum ||
        addresses['BNB Smart Chain'] ||
        merchantProfile.settlementAddress;

      await updateMerchantProfile({
        merchantReceivingAddresses: addresses,
        settlementAddress: primaryEVM,
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to update receiving addresses:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 my-8">
        {/* Header Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Merchant Receiving Addresses</h3>
              <p className="text-xs text-slate-500">Configure separate receiving addresses per blockchain rail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rule Banner */}
        <div className="p-4 bg-purple-50 border-b border-purple-100 flex items-start gap-3 text-xs">
          <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-purple-900">
            <p className="font-bold">Strict Rail Separation Enforcement</p>
            <p className="text-[11px] text-purple-700">
              Each network requires its respective native address format. Never use an Ethereum 0x address for Bitcoin or Tron. Payment requests automatically pull the appropriate receiving address.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {NETWORKS_LIST.map((net) => {
            const currentVal = addresses[net.name] || '';
            const validation: { isValid: boolean; error?: string } = currentVal.trim()
              ? validateAddressForNetwork(currentVal.trim(), net.name)
              : { isValid: true };
            const isHighlighted = highlightNetwork === net.name;

            return (
              <div
                key={net.name}
                className={`p-4 rounded-2xl border transition-all ${
                  isHighlighted
                    ? 'border-purple-500 bg-purple-50/40 ring-2 ring-purple-300'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: net.color }}
                    />
                    <span className="font-bold text-xs text-slate-900">{net.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold font-mono">
                      {net.symbol}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSetSample(net.name, net.sample)}
                    className="text-[10px] text-purple-600 hover:text-purple-800 font-bold cursor-pointer"
                  >
                    Use Sample Address
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={currentVal}
                    onChange={(e) => handleInputChange(net.name, e.target.value)}
                    placeholder={net.placeholder}
                    className={`w-full px-3 py-2 rounded-xl bg-white border font-mono text-xs focus:outline-none transition-colors shadow-xs ${
                      !validation.isValid
                        ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500'
                        : 'border-slate-300 focus:border-purple-500 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between mt-1.5 text-[10px]">
                  <span className="text-slate-500">{net.note}</span>
                  {!validation.isValid && (
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validation.error}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs text-slate-700 cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="iris"
              size="sm"
              isLoading={isSaving}
              leftIcon={savedSuccess ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
              className="text-xs font-bold shadow-md shadow-purple-500/20 cursor-pointer"
            >
              {savedSuccess ? 'Addresses Saved!' : 'Save All Addresses'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
