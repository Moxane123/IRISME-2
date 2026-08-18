import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { TokenLogo } from '../ui/TokenLogo';
import { SupportedToken } from '../../types';
import {
  X,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface SettleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettleModal: React.FC<SettleModalProps> = ({ isOpen, onClose }) => {
  const { merchantProfile, merchantBalance, withdrawSettlement } = useApp();

  const [amount, setAmount] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<SupportedToken>('USDT');
  const [customDestination, setCustomDestination] = useState<string>('');
  const [useCustomDest, setUseCustomDest] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<{ id: string; txHash?: string; amount: number } | null>(null);

  if (!isOpen) return null;

  const defaultDestination = merchantProfile.settlementAddress || '0x8F3a4e9b72cD4562098b584d4D9fB231f6C2A093';
  const effectiveDestination = useCustomDest && customDestination ? customDestination.trim() : defaultDestination;

  const availableBalance = merchantBalance.availableBalanceUSD;
  const numAmount = parseFloat(amount) || 0;
  const isAmountValid = numAmount > 0 && numAmount <= availableBalance;

  const handleSetMax = () => {
    setAmount(availableBalance.toFixed(2));
    setError(null);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAmountValid) {
      setError(`Please enter an amount between $0.01 and $${availableBalance.toFixed(2)}.`);
      return;
    }

    if (!effectiveDestination || !effectiveDestination.startsWith('0x') || effectiveDestination.length !== 42) {
      setError('Invalid destination wallet address. Must be a valid 0x EVM address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await withdrawSettlement({
        amountUSD: numAmount,
        tokenSymbol: selectedToken,
        destinationAddress: effectiveDestination,
        chainId: 137,
        note: `Instant merchant withdrawal to ${effectiveDestination.slice(0, 6)}...${effectiveDestination.slice(-4)}`,
      });

      if (res.success && res.settlement) {
        setSuccessTx({
          id: res.settlement.id,
          txHash: res.settlement.txHash,
          amount: res.settlement.amountUSD,
        });
      } else {
        setError(res.error || 'Failed to complete withdrawal.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error executing settlement transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessTx(null);
    setAmount('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 my-8">
        {/* Top Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080]" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Settle Funds to Wallet</h3>
              <p className="text-xs text-slate-500">Non-custodial instant withdrawal</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {successTx ? (
            /* Success View */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900">Settlement Transferred!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  <span className="font-bold text-slate-900">${successTx.amount.toFixed(2)} USD</span> has been settled directly to your non-custodial wallet.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left font-mono text-[11px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Settlement ID:</span>
                  <span className="text-slate-900 font-bold">{successTx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="text-purple-700 font-bold">
                    {effectiveDestination.slice(0, 8)}...{effectiveDestination.slice(-6)}
                  </span>
                </div>
                {successTx.txHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Tx Hash:</span>
                    <a
                      href={`https://polygonscan.com/tx/${successTx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline flex items-center gap-1 font-bold"
                    >
                      {successTx.txHash.slice(0, 10)}...
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Settlement Status:</span>
                  <span className="text-emerald-700 font-bold">COMPLETED (ON-CHAIN)</span>
                </div>
              </div>

              <Button
                variant="iris"
                size="md"
                onClick={handleResetAndClose}
                className="w-full font-bold cursor-pointer"
              >
                Done
              </Button>
            </div>
          ) : (
            /* Settlement Form */
            <form onSubmit={handleWithdraw} className="space-y-5">
              {/* Balance Banner */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block">
                    Available to Settle
                  </span>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    ${availableBalance.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Pending
                  </span>
                  <div className="text-sm font-bold text-amber-700 font-mono">
                    ${merchantBalance.pendingBalanceUSD.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">Withdrawal Amount (USD)</label>
                  <button
                    type="button"
                    onClick={handleSetMax}
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                  >
                    Set Max (${availableBalance.toFixed(2)})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={availableBalance}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError(null);
                    }}
                    className="w-full pl-8 pr-20 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none text-base font-mono font-bold text-slate-900"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <select
                      value={selectedToken}
                      onChange={(e) => setSelectedToken(e.target.value as SupportedToken)}
                      className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                    >
                      <option value="USDT">USDT</option>
                      <option value="USDC">USDC</option>
                      <option value="DAI">DAI</option>
                      <option value="MATIC">POL</option>
                      <option value="VERSE">VERSE</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Destination Wallet */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-slate-500" />
                    Settlement Destination
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomDest(!useCustomDest)}
                    className="text-[11px] text-slate-500 hover:text-purple-700 underline cursor-pointer"
                  >
                    {useCustomDest ? 'Use Default Wallet' : 'Custom Wallet'}
                  </button>
                </div>

                {useCustomDest ? (
                  <input
                    type="text"
                    placeholder="0x..."
                    value={customDestination}
                    onChange={(e) => setCustomDestination(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-800 font-bold truncate">
                      {defaultDestination}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-sans font-bold flex-shrink-0 ml-2">
                      Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Security & Non-Custodial Note */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Zero Custody:</strong> iRisme never holds private keys. Funds settle directly on Polygon blockchain without intermediary holding.
                </p>
              </div>

              {/* Error Box */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs">{error}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleResetAndClose}
                  className="cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="iris"
                  size="md"
                  disabled={!isAmountValid || isSubmitting || availableBalance <= 0}
                  className="cursor-pointer font-bold text-xs shadow-xs min-w-[140px]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Settling...
                    </span>
                  ) : (
                    `Settle $${numAmount > 0 ? numAmount.toFixed(2) : '0.00'}`
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
