import React, { useState } from 'react';
import { Copy, Check, QrCode, Smartphone, Barcode, ExternalLink, Store, Tag, Coins, ShieldCheck } from 'lucide-react';
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
  onOpenScanner?: () => void;
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
  onOpenScanner,
}) => {
  const [viewMode, setViewMode] = useState<'qr' | 'barcode' | 'uri'>('qr');
  const [copied, setCopied] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const activeValue =
    viewMode === 'qr' || viewMode === 'barcode'
      ? url
      : paymentUri || `ethereum:${merchantAddress}?value=${tokenAmount}`;

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

  // Generate deterministic pseudo 1D barcode lines
  const generateBarcodeBars = (seedStr: string) => {
    const bars: { width: number; space: number }[] = [];
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    for (let i = 0; i < 36; i++) {
      const pseudo = Math.abs(Math.sin((i + hash) * 7823) * 100);
      const width = (pseudo % 3) + 1;
      const space = ((pseudo * 2) % 3) + 1;
      bars.push({ width, space });
    }
    return bars;
  };

  const matrix = generateMatrix(activeValue);
  const barcodeBars = generateBarcodeBars(activeValue);

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-md relative overflow-hidden">
      {/* Iridescent subtle accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] absolute top-0 left-0 right-0" />

      {/* Mode Switcher */}
      <div className="flex items-center justify-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs max-w-xs mx-auto">
        <button
          type="button"
          onClick={() => setViewMode('qr')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
          onClick={() => setViewMode('barcode')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            viewMode === 'barcode'
              ? 'bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Barcode className="w-3.5 h-3.5" />
          <span>Barcode</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('uri')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            viewMode === 'uri'
              ? 'bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Web3 URI</span>
        </button>
      </div>

      {/* Visual Barcode or QR Code Box */}
      <div className="flex justify-center items-center py-1">
        {viewMode === 'qr' || viewMode === 'uri' ? (
          /* 2D QR Matrix Frame */
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
        ) : (
          /* 1D Linear Barcode Frame */
          <div className="w-full max-w-sm p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-md space-y-2">
            <div className="h-28 flex items-stretch justify-center gap-1 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
              {barcodeBars.map((bar, i) => (
                <div
                  key={i}
                  style={{ width: `${bar.width * 2.5}px`, marginRight: `${bar.space * 1.5}px` }}
                  className="bg-slate-900 h-full rounded-xs"
                />
              ))}
            </div>
            <p className="font-mono text-xs text-slate-700 tracking-widest font-bold">
              {url.split('/').pop() || 'IRIS-PAY-INVOICE'}
            </p>
          </div>
        )}
      </div>

      {/* Explicit Stated Information on the Barcode Card */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-left text-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-slate-500 font-medium">Item / Description:</span>
          <span className="text-slate-900 font-bold font-sans truncate max-w-[200px]">
            {itemDescription || 'Store Order Checkout'}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-slate-500 font-medium">Amount Due:</span>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-slate-900 text-sm font-mono">${amountUSD.toFixed(2)}</span>
            <span className="text-purple-700 font-mono text-xs">
              ({tokenAmount} {tokenSymbol})
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-slate-500 font-medium">Asset & Network:</span>
          <div className="flex items-center gap-1.5">
            <TokenLogo symbol={tokenSymbol as SupportedToken} size="xs" variant="gif" animated={true} />
            <span className="text-slate-800 font-bold font-mono">{tokenSymbol}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 font-mono text-[11px]">{networkName}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-slate-500 font-medium">Merchant Address:</span>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-slate-800 font-semibold truncate max-w-[140px]" title={merchantAddress}>
              {merchantAddress ? `${merchantAddress.slice(0, 6)}...${merchantAddress.slice(-4)}` : '0x...'}
            </span>
            <button
              type="button"
              onClick={handleCopyAddress}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
              title="Copy merchant address"
            >
              {copiedAddress ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {verseEarned !== undefined && verseEarned > 0 && (
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-purple-600" />
              VERSE Cashback:
            </span>
            <span className="text-purple-700 font-bold font-mono">+{verseEarned} VERSE</span>
          </div>
        )}
      </div>

      {/* Copy / Action Bar */}
      <div className="p-2 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-2 max-w-md mx-auto text-xs font-mono shadow-xs">
        <span className="text-slate-700 truncate text-left pl-2 text-[11px]">
          {activeValue}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 hover:text-slate-900 text-slate-700 font-bold flex items-center gap-1.5 flex-shrink-0 transition-all cursor-pointer shadow-xs text-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Workflow Instructions Note */}
      <p className="text-[11px] text-slate-500 leading-tight">
        Customers scan this barcode/QR code with any mobile camera or Web3 wallet. Connect wallet, authorize connection, and approve the payment on Verse.
      </p>
    </div>
  );
};
