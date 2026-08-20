import React, { useState } from 'react';
import { Copy, Check, QrCode, Smartphone, ExternalLink, Store, Tag, Coins, ShieldCheck } from 'lucide-react';
import { IrisLogo } from './IrisLogo';
import { TokenLogo } from './TokenLogo';
import { SupportedToken } from '../../types';

interface PaymentQRCodeProps {
  url: string;
  paymentUri?: string;
  amountUSD: number;
  tokenAmount: number;
  tokenSymbol: string;
  merchantAddress: string;
  merchantName?: string;
  itemDescription?: string;
  networkName?: string;
  verseEarned?: number;
}

export const PaymentQRCode: React.FC<PaymentQRCodeProps> = ({
  url,
  paymentUri,
  amountUSD,
  tokenAmount,
  tokenSymbol,
  merchantAddress,
  merchantName,
  itemDescription,
  networkName = 'Polygon (Verse L2)',
  verseEarned,
}) => {
  const [viewMode, setViewMode] = useState<'qr' | 'uri'>('qr');
  const [copied, setCopied] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const activeValue = viewMode === 'qr' ? url : paymentUri || `ethereum:${merchantAddress}?value=${tokenAmount}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(merchantAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Generate deterministic SVG pseudo-matrix based on activeValue string hash for 2D QR Code
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
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-md relative overflow-hidden">
      {/* Iridescent subtle accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] absolute top-0 left-0 right-0" />

      {/* Mode Switcher */}
      <div className="flex items-center justify-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs max-w-xs mx-auto">
        <button
          type="button"
          onClick={() => setViewMode('qr')}
          className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            viewMode === 'qr'
              ? 'bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>QR Code</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('uri')}
          className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            viewMode === 'uri'
              ? 'bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Web3 URI</span>
        </button>
      </div>

      {/* Visual QR Code Box */}
      <div className="flex justify-center items-center py-1">
        <div className="relative inline-block p-4 bg-white rounded-3xl shadow-md border-2 border-slate-200">
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
      </div>

      {/* Copy Link & URI Controls */}
      <div className="space-y-2 max-w-sm mx-auto">
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-xl border border-slate-200">
          <input
            type="text"
            readOnly
            value={activeValue}
            className="bg-transparent text-slate-700 font-mono text-[11px] px-2 flex-1 focus:outline-none truncate"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer flex-shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
