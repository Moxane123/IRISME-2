import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  Upload,
  RefreshCw,
  Flashlight,
  FlashlightOff,
  FlipHorizontal,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FileImage,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ScannerStatus } from '../../types/qrPayment';

interface QRCameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isProcessing?: boolean;
}

export const QRCameraScanner: React.FC<QRCameraScannerProps> = ({
  onScanSuccess,
  isProcessing = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  const animationFrameId = useRef<number | null>(null);
  const isScanningActive = useRef<boolean>(false);

  // Sound chime on successful scan
  const playScanBeep = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6 note

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(80);
      }
    } catch {
      // Audio context might be restricted before interaction
    }
  }, []);

  // Stop camera tracks
  const stopCameraStream = useCallback(() => {
    isScanningActive.current = false;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    stopCameraStream();
    setErrorMessage('');
    setScannerStatus('requesting_permission');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScannerStatus('camera_unavailable');
      setErrorMessage('Camera access is not supported in this browser. Please use the image upload option.');
      setActiveTab('upload');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      // Check for torch/flashlight capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
        const capabilities = videoTrack.getCapabilities() as any;
        setHasTorch(Boolean(capabilities.torch));
      } else {
        setHasTorch(false);
      }

      setScannerStatus('scanning');
      isScanningActive.current = true;
    } catch (err: any) {
      console.warn('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setScannerStatus('permission_denied');
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings or upload an image of the QR code.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setScannerStatus('camera_unavailable');
        setErrorMessage('No camera found on this device. Please upload an image containing the payment QR code.');
        setActiveTab('upload');
      } else {
        setScannerStatus('camera_unavailable');
        setErrorMessage(`Unable to open camera: ${err.message || 'Unknown device error'}`);
      }
    }
  }, [facingMode, stopCameraStream]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const newTorchState = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: newTorchState }],
      });
      setIsTorchOn(newTorchState);
    } catch (err) {
      console.warn('Torch not supported on this device track', err);
    }
  };

  // Flip Camera
  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Live video frame processing loop
  useEffect(() => {
    if (activeTab !== 'camera' || scannerStatus !== 'scanning' || isProcessing) {
      return;
    }

    const scanFrame = () => {
      if (!isScanningActive.current || !videoRef.current || !canvasRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && code.data.trim().length > 0) {
          isScanningActive.current = false;
          playScanBeep();
          setScannerStatus('qr_detected');
          onScanSuccess(code.data);
          return;
        }
      }

      if (isScanningActive.current) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    };

    isScanningActive.current = true;
    animationFrameId.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [activeTab, scannerStatus, isProcessing, onScanSuccess, playScanBeep]);

  // Handle Tab Switch
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [activeTab, startCamera, stopCameraStream]);

  // Decode from Image File (Upload or Drag-and-drop)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (.png, .jpg, .jpeg, .webp).');
      return;
    }

    setErrorMessage('');
    setScannerStatus('processing_image');

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImagePreview(result);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setErrorMessage('Could not process the uploaded image.');
          setScannerStatus('idle');
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data && code.data.trim()) {
          playScanBeep();
          setScannerStatus('qr_detected');
          onScanSuccess(code.data);
        } else {
          setScannerStatus('idle');
          setErrorMessage('No valid QR code was detected in the uploaded image. Please try a clearer screenshot or photograph.');
        }
      };
      img.onerror = () => {
        setErrorMessage('Failed to load the image. Please try another file.');
        setScannerStatus('idle');
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
      {/* Top Iridescent Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080]" />

      {/* Mode Switcher: Camera vs Image File */}
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-600" />
              <span>Scan Merchant QR</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Point your camera at a merchant payment QR code or invoice
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-purple-600" />
            <span>Live Camera</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 text-purple-600" />
            <span>Upload Image</span>
          </button>
        </div>
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Scanner Viewport */}
      <div className="p-4 sm:p-5">
        {activeTab === 'camera' ? (
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center shadow-inner">
            {/* Live Video Element */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Scanning Overlay HUD */}
            {scannerStatus === 'scanning' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Dark Vignette Mask */}
                <div className="absolute inset-0 bg-slate-950/40" />

                {/* Clear Scanning Square Target Box */}
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 border-dashed border-white/60 bg-transparent flex items-center justify-center shadow-2xl">
                  {/* Glowing Iridescent Corner Brackets */}
                  <div className="absolute -top-1.5 -left-1.5 w-7 h-7 border-t-4 border-l-4 border-[#00D2FE] rounded-tl-xl" />
                  <div className="absolute -top-1.5 -right-1.5 w-7 h-7 border-t-4 border-r-4 border-[#FF0080] rounded-tr-xl" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-7 h-7 border-b-4 border-l-4 border-[#7C3AED] rounded-bl-xl" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 border-b-4 border-r-4 border-[#00D2FE] rounded-br-xl" />

                  {/* Scanning Laser Line */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] shadow-[0_0_12px_#7C3AED] animate-scannerLaser" />

                  {/* Center Aim Crosshair */}
                  <div className="w-6 h-6 border border-white/40 rounded-full flex items-center justify-center opacity-60">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  </div>
                </div>

                {/* Helper text overlay */}
                <div className="absolute bottom-4 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-medium tracking-wide flex items-center gap-1.5 shadow-lg border border-white/10">
                  <Sparkles className="w-3 h-3 text-[#00D2FE]" />
                  <span>Align QR code within the frame</span>
                </div>
              </div>
            )}

            {/* Permission Denied or Camera Error State */}
            {(scannerStatus === 'permission_denied' || scannerStatus === 'camera_unavailable') && (
              <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center text-white space-y-3 z-10">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Camera Access Blocked</h3>
                <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                  {errorMessage || 'Please enable camera permissions in your browser or switch to image upload.'}
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 bg-slate-800 text-white text-xs hover:bg-slate-700"
                    onClick={startCamera}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Retry Permission
                  </Button>
                  <Button
                    variant="iris"
                    size="sm"
                    className="text-xs"
                    onClick={() => setActiveTab('upload')}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                  >
                    Upload QR Image
                  </Button>
                </div>
              </div>
            )}

            {/* Requesting Permission State */}
            {scannerStatus === 'requesting_permission' && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white space-y-3 z-10">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                <p className="text-xs font-semibold text-slate-200">Requesting Camera Access...</p>
              </div>
            )}

            {/* Camera Floating Controls (Torch & Flip) */}
            {scannerStatus === 'scanning' && (
              <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-2 rounded-xl backdrop-blur-md border text-white transition-all shadow-md cursor-pointer ${
                      isTorchOn
                        ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-amber-500/40'
                        : 'bg-black/60 border-white/20 hover:bg-black/80'
                    }`}
                    title={isTorchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
                  >
                    {isTorchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={flipCamera}
                  className="p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transition-all shadow-md cursor-pointer"
                  title="Switch front/back camera"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Upload QR Image Tab */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`aspect-square w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-purple-500 bg-purple-50/80 shadow-lg scale-[0.99]'
                : 'border-slate-300 hover:border-purple-400 bg-slate-50/60 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {uploadedImagePreview ? (
              <div className="space-y-3">
                <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden border border-slate-300 shadow-sm">
                  <img
                    src={uploadedImagePreview}
                    alt="Uploaded QR preview"
                    className="w-full h-full object-cover"
                  />
                  {scannerStatus === 'processing_image' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-700">Click to choose another image</p>
              </div>
            ) : (
              <div className="space-y-3 max-w-xs">
                <div className="w-14 h-14 rounded-2xl bg-purple-100/70 border border-purple-200 flex items-center justify-center text-purple-600 mx-auto shadow-xs">
                  <FileImage className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Drop QR code screenshot here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    or click to browse files from your device
                  </p>
                </div>
                <span className="inline-block px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 shadow-2xs">
                  Supports PNG, JPG, WEBP, SVG
                </span>
              </div>
            )}
          </div>
        )}

        {/* Scan / Processing Error Alert */}
        {errorMessage && activeTab === 'upload' && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-900">QR Scan Error</p>
              <p className="text-[11px] text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Security Badge */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          <span>Client-Side Local Decoding (Zero Data Sent)</span>
        </span>
        <span className="text-purple-600 font-bold font-mono">EIP-681 / EVM</span>
      </div>
    </div>
  );
};
