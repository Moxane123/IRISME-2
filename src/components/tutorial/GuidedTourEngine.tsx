import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Zap,
  Store,
  Smartphone,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string; // CSS selector or data-tour identifier
  expectedRoute: string; // Route the tour expects to be on
  pointerDirection: 'top' | 'bottom' | 'left' | 'right';
  badge: string;
  autoAction?: () => void;
  nextButtonText?: string;
}

export const CUSTOMER_TOUR_STEPS: TourStep[] = [
  {
    id: 'cust-1',
    title: 'Input Payment Link or Scan QR',
    description: 'Customers start by pasting a payment link or clicking to test a live order right here.',
    targetSelector: '[data-tour="customer-input-link"]',
    expectedRoute: '/',
    pointerDirection: 'bottom',
    badge: 'Step 1 of 5',
    nextButtonText: 'Next: Select Token 👉',
  },
  {
    id: 'cust-2',
    title: 'Choose Payable Asset (VERSE / Multi-Chain)',
    description: 'Customers choose their preferred token (VERSE, USDT, USDC, ETH) with live rate conversion.',
    targetSelector: '[data-tour="token-selector"]',
    expectedRoute: '/pay',
    pointerDirection: 'top',
    badge: 'Step 2 of 5',
    nextButtonText: 'Next: Web3 Connect 👉',
  },
  {
    id: 'cust-3',
    title: 'Connect Web3 Wallet',
    description: 'Click here to connect MetaMask, Verse Wallet, Coinbase, or Rabby. Zero sign-up required!',
    targetSelector: '[data-tour="connect-wallet-btn"]',
    expectedRoute: '/pay',
    pointerDirection: 'top',
    badge: 'Step 3 of 5',
    nextButtonText: 'Next: VERSE Cashback 👉',
  },
  {
    id: 'cust-4',
    title: 'Automated VERSE Cashback',
    description: 'Every payment earns instant VERSE loyalty rewards deposited directly to your wallet.',
    targetSelector: '[data-tour="verse-cashback-box"]',
    expectedRoute: '/pay',
    pointerDirection: 'top',
    badge: 'Step 4 of 5',
    nextButtonText: 'Next: Authorize Payment 👉',
  },
  {
    id: 'cust-5',
    title: 'Complete On-Chain Checkout',
    description: 'Click "Pay with Connected Wallet" to execute the transaction non-custodially on-chain!',
    targetSelector: '[data-tour="pay-action-btn"]',
    expectedRoute: '/pay',
    pointerDirection: 'bottom',
    badge: 'Step 5 of 5',
    nextButtonText: 'Finish Tutorial ✨',
  },
];

export const MERCHANT_TOUR_STEPS: TourStep[] = [
  {
    id: 'merch-1',
    title: 'Merchant Business Onboarding',
    description: 'Businesses sign up with 0 intermediaries to accept crypto and earn with VERSE rewards.',
    targetSelector: '[data-tour="merchant-signup-btn"]',
    expectedRoute: '/',
    pointerDirection: 'bottom',
    badge: 'Step 1 of 5',
    nextButtonText: 'Next: Register Store 👉',
  },
  {
    id: 'merch-2',
    title: 'Display Store Online & Set Settlement Wallet',
    description: 'Set your business name, category, and EVM wallet address to receive 100% direct payouts.',
    targetSelector: '[data-tour="merchant-register-form"]',
    expectedRoute: '/merchant/register',
    pointerDirection: 'top',
    badge: 'Step 2 of 5',
    nextButtonText: 'Next: Create Channel 👉',
  },
  {
    id: 'merch-3',
    title: 'Create Point-of-Sale Payment Channel',
    description: 'Input the item price in USD and choose the settlement token to generate an instant invoice.',
    targetSelector: '[data-tour="create-payment-form"]',
    expectedRoute: '/merchant/create-payment',
    pointerDirection: 'top',
    badge: 'Step 3 of 5',
    nextButtonText: 'Next: QR & Barcodes 👉',
  },
  {
    id: 'merch-4',
    title: 'Point-of-Sale Barcode & Countertop Stand',
    description: 'Print this dynamic barcode or copy the payment URL to share with in-store or online customers.',
    targetSelector: '[data-tour="generated-qr-channel"]',
    expectedRoute: '/merchant/create-payment',
    pointerDirection: 'left',
    badge: 'Step 4 of 5',
    nextButtonText: 'Next: Dashboard 👉',
  },
  {
    id: 'merch-5',
    title: 'Real-Time Analytics & Settlement Dashboard',
    description: 'Monitor live blockchain transactions, inspect audit logs, and manage VERSE loyalty pools!',
    targetSelector: '[data-tour="merchant-dashboard-stats"]',
    expectedRoute: '/merchant',
    pointerDirection: 'top',
    badge: 'Step 5 of 5',
    nextButtonText: 'Complete Guide ✨',
  },
];

interface GuidedTourEngineProps {
  isActive: boolean;
  tourType: 'customer' | 'merchant';
  onClose: () => void;
}

export const GuidedTourEngine: React.FC<GuidedTourEngineProps> = ({
  isActive,
  tourType,
  onClose,
}) => {
  const { navigate, currentPath } = useRouter();
  const { createPayment, switchRole } = useApp();

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isDemoPaymentCreated, setIsDemoPaymentCreated] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const steps = tourType === 'customer' ? CUSTOMER_TOUR_STEPS : MERCHANT_TOUR_STEPS;
  const currentStep = steps[currentStepIndex] || steps[0];

  // Auto-route helper
  useEffect(() => {
    if (!isActive) return;

    const enforceRouting = () => {
      if (tourType === 'customer') {
        if (currentStepIndex === 0 && currentPath !== '/') {
          navigate('/');
        } else if (currentStepIndex >= 1 && !currentPath.startsWith('/pay')) {
          // If moving into customer checkout steps, generate or navigate to demo payment
          const p = createPayment({
            amountUSD: 12.5,
            selectedToken: 'VERSE',
            chainId: 137,
            description: 'Guided Tour Demo Order',
            orderRef: 'TOUR-DEMO',
            expirationMinutes: 60,
            cashbackPercent: 3.0,
          });
          setIsDemoPaymentCreated(p.id);
          navigate(`/pay/${p.id}`);
        }
      } else if (tourType === 'merchant') {
        if (currentStepIndex === 0 && currentPath !== '/') {
          navigate('/');
        } else if (currentStepIndex === 1 && currentPath !== '/merchant/register') {
          switchRole('merchant');
          navigate('/merchant/register');
        } else if (currentStepIndex === 2 || currentStepIndex === 3) {
          if (currentPath !== '/merchant/create-payment') {
            switchRole('merchant');
            navigate('/merchant/create-payment');
          }
        } else if (currentStepIndex === 4 && currentPath !== '/merchant') {
          switchRole('merchant');
          navigate('/merchant');
        }
      }
    };

    enforceRouting();
  }, [isActive, currentStepIndex, tourType, currentPath]);

  // Position Tracking Loop for Target Spotlight & Pointer Hand
  useEffect(() => {
    if (!isActive) return;

    const updateTargetPosition = () => {
      if (!currentStep) return;

      const element = document.querySelector(currentStep.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        // Gently scroll element into view if not visible
        if (rect.top < 80 || rect.bottom > window.innerHeight - 80) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        // Target element not found yet, fallback to screen center
        setTargetRect(null);
      }
      animationFrameRef.current = requestAnimationFrame(updateTargetPosition);
    };

    updateTargetPosition();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, currentStepIndex, currentStep, currentPath]);

  if (!isActive) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Calculate pointer coordinates
  let pointerStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    pointerEvents: 'none',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  let handEmoji = '👉';
  let handTransform = 'translate(0, 0)';

  if (targetRect) {
    if (currentStep.pointerDirection === 'top') {
      pointerStyle.top = `${targetRect.top - 70}px`;
      pointerStyle.left = `${targetRect.left + targetRect.width / 2 - 25}px`;
      handEmoji = '👇';
    } else if (currentStep.pointerDirection === 'bottom') {
      pointerStyle.top = `${targetRect.bottom + 15}px`;
      pointerStyle.left = `${targetRect.left + targetRect.width / 2 - 25}px`;
      handEmoji = '👆';
    } else if (currentStep.pointerDirection === 'left') {
      pointerStyle.top = `${targetRect.top + targetRect.height / 2 - 25}px`;
      pointerStyle.left = `${targetRect.left - 70}px`;
      handEmoji = '👉';
    } else {
      pointerStyle.top = `${targetRect.top + targetRect.height / 2 - 25}px`;
      pointerStyle.left = `${targetRect.right + 15}px`;
      handEmoji = '👈';
    }
  }

  return (
    <>
      {/* Semi-Transparent Backdrop Overlay */}
      <div className="fixed inset-0 z-[9990] bg-slate-950/40 pointer-events-none transition-opacity duration-300" />

      {/* Target Element Spotlight Highlight Box */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: `${Math.max(10, targetRect.top - 6)}px`,
            left: `${Math.max(10, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            zIndex: 9995,
            pointerEvents: 'none',
          }}
          className="rounded-2xl border-2 border-purple-400 bg-purple-500/10 shadow-[0_0_30px_rgba(168,85,247,0.5)] ring-4 ring-purple-400/30 animate-pulse transition-all duration-300"
        />
      )}

      {/* Real-Time Animated Directional Pointer Hand */}
      {targetRect && (
        <div style={pointerStyle} className="flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            {/* Pulsing Radar Ring Behind Hand */}
            <div className="absolute w-16 h-16 rounded-full bg-purple-500/30 animate-ping" />
            <div className="absolute w-12 h-12 rounded-full bg-cyan-400/40 animate-pulse" />

            {/* Directional Hand Icon with smooth bounce */}
            <div className="text-4xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] animate-bounce select-none">
              {handEmoji}
            </div>

            {/* "CLICK HERE" Pill Indicator */}
            <div className="absolute -bottom-6 px-2 py-0.5 rounded-md bg-purple-900 text-white font-mono font-black text-[10px] tracking-wider uppercase whitespace-nowrap shadow-lg border border-purple-400">
              Click Here
            </div>
          </div>
        </div>
      )}

      {/* Floating Guided Tour Dialog Card */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] max-w-xl w-[92%] sm:w-full bg-white/95 backdrop-blur-xl border border-purple-300 rounded-3xl shadow-2xl p-5 animate-scaleUp">
        <div className="flex items-center justify-between gap-3 border-b border-purple-100 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00D2FE] via-[#7C3AED] to-[#FF0080] flex items-center justify-center text-white font-bold text-xs shadow-md">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 tracking-tight">
                  {tourType === 'customer' ? 'Customer Guided Payment Tour' : 'Merchant Business Setup Tour'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold font-mono">
                  {currentStep.badge}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Real-Time Directional Assistance
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="End Tour"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="space-y-1.5 mb-4">
          <h3 className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
            <span className="text-base">{handEmoji}</span>
            <span>{currentStep.title}</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Tour Control Bar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-purple-600'
                    : idx < currentStepIndex
                    ? 'w-2 bg-purple-300'
                    : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                className="text-xs font-bold py-1.5 px-3 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Back
              </Button>
            )}

            <Button
              variant="iris"
              size="sm"
              onClick={handleNext}
              className="text-xs font-bold py-1.5 px-4 shadow-md shadow-purple-500/20 cursor-pointer"
            >
              {currentStep.nextButtonText || 'Next Step 👉'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
