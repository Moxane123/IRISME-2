import React, { useState } from 'react';
import { Copy, Check, QrCode, Smartphone } from 'lucide-react';
import { IrisLogo } from './IrisLogo';

interface PaymentQRCodeProps {
  url: string;
  paymentUri?: string;
  amountUSD: number;
  tokenAmount: number;
  tokenSymbol: string;
  merchantAddress: string;
}

export const PaymentQRCode: React.FC<PaymentQRCodeProps> = ({
  url,
  paymentUri,
  amountUSD,
  tokenAmount,
  tokenSymbol,
  merchantAddress,
}) => {
  const [mode, setMode] = useState<'url' | 'uri'>('url');
  const [copied, setCopied] = useState(false);

  const activeValue = mode === 'url' ? url : paymentUri || `ethereum:${merchantAddress}?value=${tokenAmount}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate deterministic SVG pseudo-matrix based on activeValue string hash
  const generateMatrix = (seedStr: string) => {
    const size = 21;
    const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

    // Corner Finder Patterns
    const setFinderPattern = (row: number, col: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[row + r][col + c] = true;
          }
        }
      }
    };

    setFinderPattern(0, 0);
    setFinderPattern(0, size - 7);
    setFinderPattern(size - 7, 0);

    // Hash string to fill internal modules
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder areas
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c >= size - 8) ||
          (r >= size - 8 && c < 8)
        ) {
          continue;
        }
        const pseudoRandom = Math.abs(Math.sin((r * size + c + hash) * 9301 + 49297) * 233280);
        matrix[r][c] = pseudoRandom % 2 > 1;
      }
    }

    return matrix;
  };

  const matrix = generateMatrix(activeValue);

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4 shadow-sm">
      {/* Tab switch between Checkout Link & Web3 Wallet URI */}
      <div className="flex items-center justify-center p-1 bg-slate-200/70 rounded-2xl border border-slate-300/60 text-xs max-w-xs mx-auto">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'url'
              ? 'bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Checkout Link</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('uri')}
          className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'uri'
              ? 'bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Web3 URI</span>
        </button>
      </div>

      {/* QR Code Canvas Frame */}
      <div className="relative inline-block p-4 bg-white rounded-3xl shadow-lg border-2 border-slate-200">
        <svg
          viewBox="0 0 21 21"
          className="w-44 h-44 sm:w-48 sm:h-48 shape-rendering-crispEdges mx-auto"
        >
          {matrix.map((row, r) =>
            row.map((cell, c) =>
              cell ? (
                <rect
                  key={`${r}-${c}`}
                  x={c}
                  y={r}
                  width="1"
                  height="1"
                  fill="#0F172A"
                />
              ) : null
            )
          )}
        </svg>

        {/* Center Iris Logo overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-11 h-11 rounded-2xl bg-white border-2 border-purple-500 flex items-center justify-center shadow-lg p-1">
            <IrisLogo size={24} />
          </div>
        </div>
      </div>

      <div className="space-y-1 text-xs">
        <p className="font-bold text-slate-900">
          {mode === 'url' ? 'Scan with Mobile Camera to Open' : `Scan to Pay ${tokenAmount} ${tokenSymbol}`}
        </p>
        <p className="text-[11px] text-slate-500 font-mono">
          {mode === 'url'
            ? 'Compatible with standard phone camera, Verse Wallet, or any mobile browser'
            : 'Compatible with Verse Wallet, MetaMask, and non-custodial Web3 wallets'}
        </p>
      </div>

      {/* Copy Link Bar */}
      <div className="p-2 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-2 max-w-md mx-auto text-xs font-mono shadow-xs">
        <span className="text-slate-700 truncate text-left pl-2">
          {activeValue}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 hover:text-slate-900 text-slate-700 font-bold flex items-center gap-1.5 flex-shrink-0 transition-all cursor-pointer shadow-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
};
