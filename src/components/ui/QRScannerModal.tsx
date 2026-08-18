import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { Button } from './Button';
import { IrisLogo } from './IrisLogo';
import {
  QrCode,
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Upload,
  Sparkles,
  Store,
  Receipt,
  Coins,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose }) => {
  const { navigate } = useRouter();
  const { payments } = useApp();
  const [manualInput, setManualInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Available sample invoices for quick testing
  const samplePayments = payments.slice(0, 4);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setCameraError(null);
      setManualInput('');
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    setIsScanning(true);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        setCameraError('Camera access is not supported by this browser. You can paste or select an invoice below.');
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera permission denied or camera not found. Please paste the payment URL or choose an invoice below.');
      setCameraActive(false);
    } finally {
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleProcessScan = (scannedText: string) => {
    const trimmed = scannedText.trim();
    if (!trimmed) return;

    // Check if it's a full URL like https://.../pay/pay-123 or just pay-123
    let targetPaymentId = trimmed;
    const match = trimmed.match(/\/pay\/([^/?#]+)/);
    if (match && match[1]) {
      targetPaymentId = match[1];
    }

    setScannedResult(targetPaymentId);
    stopCamera();

    // Navigate to customer payment checkout
    setTimeout(() => {
      onClose();
      navigate(`/pay/${targetPaymentId}`);
    }, 600);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate scanning uploaded image barcode/QR code
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      if (samplePayments.length > 0) {
        handleProcessScan(samplePayments[0].id);
      } else {
        handleProcessScan('pay-1');
      }
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00D2FE] via-[#7C3AED] to-[#FF0080] flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">QR Code & Barcode Scanner</h3>
              <p className="text-xs text-slate-500">Scan merchant barcode or paste checkout link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Camera Viewfinder Box */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-purple-300 min-h-[220px] flex flex-col items-center justify-center text-center p-4">
            {cameraActive ? (
              <div className="relative w-full h-[220px] bg-black rounded-xl overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                {/* Laser animation scanning line */}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] shadow-lg shadow-pink-500/50 animate-pulse" />
                <div className="absolute inset-6 border-2 border-white/40 rounded-xl pointer-events-none" />
                <button
                  onClick={stopCamera}
                  className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-white font-mono cursor-pointer"
                >
                  Stop Camera
                </button>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Scan Merchant QR / Barcode</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Use your phone or webcam to scan the barcode shown at the merchant's counter.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Button
                    variant="iris"
                    size="sm"
                    onClick={startCamera}
                    leftIcon={<Camera className="w-3.5 h-3.5" />}
                    className="font-bold text-xs shadow-md"
                  >
                    Open Camera Scanner
                  </Button>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload QR</span>
                    </span>
                  </label>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] flex items-center gap-2 max-w-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Manual Link Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Or Enter Payment ID / Checkout URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. pay-1740000000000 or /pay/pay-1"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleProcessScan(manualInput)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
              <Button
                variant="iris"
                size="md"
                onClick={() => handleProcessScan(manualInput)}
                disabled={!manualInput.trim()}
                className="font-bold text-xs"
              >
                Open
              </Button>
            </div>
          </div>

          {/* Quick Select Available Invoices (Demo Convenience) */}
          {samplePayments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Recent Merchant Invoices:</span>
                <span className="font-mono text-purple-600">Quick Test</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {samplePayments.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProcessScan(p.id)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/50 flex items-center justify-between text-left text-xs transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-[10px]">
                        {p.selectedToken.slice(0, 1)}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 font-sans block truncate">
                          {p.description || 'Crypto Checkout'}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {p.id} • {p.selectedToken}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono font-bold text-slate-900">
                        ${p.amountUSD.toFixed(2)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero account creation required</span>
          </div>
          <span className="font-mono font-medium text-slate-400">Verse Pay Engine</span>
        </div>
      </div>
    </div>
  );
};
