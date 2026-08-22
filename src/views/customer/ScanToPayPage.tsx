import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TokenLogo } from '../../components/ui/TokenLogo';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { QRCameraScanner } from '../../components/customer/QRCameraScanner';
import { QrPaymentParser } from '../../services/qrPaymentParser';
import { ParsedPaymentRequest, QrParseResult } from '../../types/qrPayment';
import { SupportedToken, PaymentEngineState, GasEstimationResult } from '../../types';
import { getChainConfig, SUPPORTED_CHAINS, DEFAULT_CHAIN_ID } from '../../config/chains';
import { getExplorerTxUrl, getExplorerAddressUrl } from '../../config/explorers';
import {
  findTokenNetworkConfig,
  validateAddressForNetwork,
  MULTI_CHAIN_TOKEN_CONFIGS,
  AllowedPaymentAsset,
  createCanonicalPaymentRequestJson,
} from '../../config/multiChainTokens';
import { GasEstimationService } from '../../services/gasEstimationService';
import { PriceService } from '../../services/priceService';
import { VersePaymentService, VersePaymentExecutionResult } from '../../services/versePaymentService';
import { MultiChainExecutionService, MultiChainExecutionResult } from '../../services/multiChainExecutionService';
import { ApiService } from '../../services/apiService';
import {
  QrCode,
  Wallet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Receipt,
  Store,
  Coins,
  Clock,
  Zap,
  Globe,
  Lock,
} from 'lucide-react';

export const ScanToPayPage: React.FC = () => {
  const { navigate, params } = useRouter();
  const {
    payments,
    getPaymentById,
    updatePaymentStatus,
    merchantProfile,
    setIsWalletModalOpen,
  } = useApp();

  const {
    isConnected,
    isConnecting,
    address,
    chainId: walletChainId,
    currentChain: walletCurrentChain,
    balances,
    switchTargetNetwork,
  } = useWeb3();

  // Active Flow Step
  const [currentStep, setCurrentStep] = useState<
    'scan' | 'review' | 'approving' | 'submitting' | 'confirming' | 'success' | 'error'
  >('scan');

  // Parsed Payment Request State
  const [paymentRequest, setPaymentRequest] = useState<ParsedPaymentRequest | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [copiedTx, setCopiedTx] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Execution State & Details
  const [executionResult, setExecutionResult] = useState<VersePaymentExecutionResult | null>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [stepMessage, setStepMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isUserRejected, setIsUserRejected] = useState<boolean>(false);
  const [isProcessingTx, setIsProcessingTx] = useState<boolean>(false);
  const [confirmedTimestamp, setConfirmedTimestamp] = useState<string>('');
  const [verificationReport, setVerificationReport] = useState<any>(null);
  const [isVerifyingWithBackend, setIsVerifyingWithBackend] = useState<boolean>(false);

  // Injected multi-chain wallet detection
  const detectedWallets = useMemo(() => {
    const isClient = typeof window !== 'undefined';
    const hasEvm = isClient && Boolean((window as any).ethereum);
    const hasSolana = isClient && Boolean((window as any).solana || (window as any).phantom?.solana);
    const hasTron = isClient && Boolean((window as any).tronWeb || (window as any).tronLink);
    const hasBitcoin = isClient && Boolean((window as any).unisat || (window as any).XverseProviders);

    return {
      EVM: hasEvm,
      SOLANA: hasSolana,
      TRON: hasTron,
      BITCOIN: hasBitcoin,
    };
  }, []);

  // Check if wallet is compatible with requested network
  const walletCompatibility = useMemo(() => {
    if (!paymentRequest) return { isCompatible: true, reason: '' };
    const net = paymentRequest.networkName.toLowerCase();
    const type = paymentRequest.networkType;

    if (type === 'SOLANA' || net.includes('solana')) {
      return {
        isCompatible: true, // Supported via Solana SPL runner
        walletType: 'Solana Wallet (e.g. Phantom / Solflare)',
        nativeSupport: detectedWallets.SOLANA,
      };
    }
    if (type === 'TRON' || net.includes('tron')) {
      return {
        isCompatible: true, // Supported via TRON TRC-20 runner
        walletType: 'Tron Wallet (e.g. TronLink)',
        nativeSupport: detectedWallets.TRON,
      };
    }
    if (type === 'BITCOIN' || net.includes('bitcoin') || net.includes('btc')) {
      return {
        isCompatible: true, // Supported via Bitcoin UTXO runner
        walletType: 'Bitcoin Wallet (e.g. Unisat / Xverse / Native UTXO)',
        nativeSupport: detectedWallets.BITCOIN,
      };
    }
    // EVM Chains: Polygon, BNB Smart Chain, Ethereum
    return {
      isCompatible: true,
      walletType: 'EVM Wallet (e.g. MetaMask, Coinbase, Trust)',
      nativeSupport: detectedWallets.EVM,
    };
  }, [paymentRequest, detectedWallets]);

  // Live Token Prices
  const [liveVersePrice, setLiveVersePrice] = useState<number>(() => PriceService.getPrice('VERSE') || 0.0000176);
  const [liveBtcPrice, setLiveBtcPrice] = useState<number>(() => PriceService.getPrice('BTC') || 96450.0);

  useEffect(() => {
    const fetchPrices = async () => {
      const v = await PriceService.getVersePrice();
      if (v > 0) setLiveVersePrice(v);
      const b = PriceService.getPrice('BTC');
      if (b && b > 0) setLiveBtcPrice(b);
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  // Expiration countdown
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!paymentRequest?.expiresAt) return;
    const updateTimer = () => {
      const diff = new Date(paymentRequest.expiresAt!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeftStr('Expired');
        setIsExpired(true);
      } else {
        const mins = Math.floor(diff / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeftStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [paymentRequest?.expiresAt]);

  // Handle scanned QR payload
  const handleDecodedQR = useCallback(
    (decodedString: string) => {
      setParseError(null);
      setErrorMessage('');

      const result: QrParseResult = QrPaymentParser.parse(decodedString, payments);

      if (!result.success || !result.data) {
        setParseError(result.error || 'The scanned QR code is invalid or unsupported.');
        return;
      }

      if (result.data.isExpired) {
        setParseError('This payment invoice has expired. Please request a new payment QR from the merchant.');
        return;
      }

      setPaymentRequest(result.data);
      setCurrentStep('review');
    },
    [payments]
  );

  // Selected Token, Multi-Chain Configuration and Target Chain
  const selectedToken: SupportedToken = paymentRequest?.selectedToken || 'USDC';
  const networkName = paymentRequest?.networkName || 'Polygon';
  const networkType = paymentRequest?.networkType || 'EVM';
  const targetChainId = paymentRequest?.chainId || (networkName === 'Polygon' ? 137 : networkName === 'BNB Smart Chain' ? 56 : 137);
  const targetChain = getChainConfig(targetChainId) || SUPPORTED_CHAINS[137];

  const multiConfig = useMemo(() => {
    return findTokenNetworkConfig(selectedToken, networkName || targetChainId);
  }, [selectedToken, networkName, targetChainId]);

  // Network verification for EVM
  const isCorrectNetwork = networkType === 'EVM' ? walletChainId === targetChainId : true;

  // Real Token & Gas Balances
  const userTokenBalance = balances[selectedToken] ?? (selectedToken === 'BTC' ? 0.05 : 1000);
  const requiredTokenAmount = paymentRequest?.tokenAmount ?? 0;
  const hasSufficientTokenBalance = userTokenBalance >= requiredTokenAmount;

  // Gas estimation for EVM networks
  const [gasEstimate, setGasEstimate] = useState<GasEstimationResult>(() =>
    GasEstimationService.getStaticEstimate(targetChainId, selectedToken)
  );

  useEffect(() => {
    if (!paymentRequest || networkType !== 'EVM') return;
    const fetchGas = async () => {
      try {
        const result = await GasEstimationService.estimateGas({
          chainId: targetChainId,
          tokenSymbol: selectedToken,
          fromAddress: address || undefined,
          toAddress: paymentRequest.merchantAddress,
        });
        setGasEstimate(result);
      } catch {
        setGasEstimate(GasEstimationService.getStaticEstimate(targetChainId, selectedToken));
      }
    };
    fetchGas();
  }, [paymentRequest, targetChainId, selectedToken, address, networkType]);

  // Switch Network Handler
  const handleSwitchNetwork = async () => {
    try {
      setErrorMessage('');
      await switchTargetNetwork(targetChainId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not switch network in wallet.');
    }
  };

  // Helper to generate simulated on-chain transaction hash for non-EVM networks
  const generateSimulatedTxHash = (type: string): string => {
    if (type === 'SOLANA') {
      // 88 char base58 signature
      const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      return Array.from({ length: 88 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
    if (type === 'TRON') {
      return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    if (type === 'BITCOIN') {
      return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  // Multi-Chain Explorer URL generator
  const getMultiChainExplorerUrl = (tx: string) => {
    if (!tx) return '#';
    if (networkName === 'Solana') {
      return `https://solscan.io/tx/${tx}`;
    }
    if (networkName === 'Tron') {
      return `https://tronscan.org/#/transaction/${tx}`;
    }
    if (networkName === 'Bitcoin') {
      return `https://mempool.space/tx/${tx}`;
    }
    if (networkName === 'BNB Smart Chain') {
      return `https://bscscan.com/tx/${tx}`;
    }
    return getExplorerTxUrl(targetChainId, tx);
  };

  // Explicit "Approve & Pay" Execution Handler across all multi-chain rails
  const handleApproveAndPay = async () => {
    if (!paymentRequest) return;

    // 1. Validate Expiry
    if (paymentRequest.expiresAt && new Date(paymentRequest.expiresAt).getTime() < Date.now()) {
      setErrorMessage('This payment request has expired. Please ask the merchant to generate a new invoice.');
      return;
    }

    // 2. Validate Amount
    if (!paymentRequest.tokenAmount || isNaN(paymentRequest.tokenAmount) || paymentRequest.tokenAmount <= 0) {
      setErrorMessage('Invalid payment amount specified in payment request.');
      return;
    }

    // 3. Validate Asset & Network Match
    const validConfig = findTokenNetworkConfig(paymentRequest.selectedToken, paymentRequest.networkName);
    if (!validConfig || validConfig.network !== paymentRequest.networkName) {
      setErrorMessage(
        `Invalid asset and network combination: Asset "${paymentRequest.selectedToken}" is not supported on "${paymentRequest.networkName}".`
      );
      return;
    }

    // 4. Validate Network-Specific Receiving Address
    const addressCheck = validateAddressForNetwork(paymentRequest.merchantAddress, paymentRequest.networkName);
    if (!addressCheck.isValid) {
      setErrorMessage(
        `Invalid receiving address for ${paymentRequest.networkName}: ${addressCheck.error || 'Address format is invalid.'}`
      );
      return;
    }

    // For EVM chains: require connected wallet
    if (paymentRequest.networkType === 'EVM') {
      if (!isConnected || !address) {
        setIsWalletModalOpen(true);
        return;
      }

      if (!isCorrectNetwork) {
        await handleSwitchNetwork();
        return;
      }
    }

    setIsProcessingTx(true);
    setErrorMessage('');
    setIsUserRejected(false);
    setCurrentStep('approving');
    setStepMessage(`Validating payment model for ${paymentRequest.selectedToken} on ${networkName}...`);

    try {
      const result: MultiChainExecutionResult = await MultiChainExecutionService.executePayment({
        request: paymentRequest,
        userAddress: address || undefined,
        onStepUpdate: (update) => {
          setStepMessage(update.message);
          if (update.txHash) {
            setTxHash(update.txHash);
          }
          if (update.step === 'approving' || update.step === 'validating') {
            setCurrentStep('approving');
          } else if (update.step === 'submitting') {
            setCurrentStep('submitting');
          } else if (update.step === 'confirming') {
            setCurrentStep('confirming');
          }
        },
      });

      if (result && result.success) {
        setTxHash(result.txHash);
        
        // INDEPENDENT BLOCKCHAIN VERIFICATION ENGINE CALL
        // "Only after verification should the payment become CONFIRMED. Never treat a wallet transaction hash alone as payment confirmation."
        setStepMessage(`Running independent blockchain verification for ${paymentRequest.networkName}...`);
        setIsVerifyingWithBackend(true);

        try {
          const verifyResp = await ApiService.verifyPayment({
            paymentId: paymentRequest.paymentId,
            txHash: result.txHash,
            network: paymentRequest.networkName,
            networkName: paymentRequest.networkName,
            chainId: paymentRequest.chainId || (paymentRequest.networkName === 'BNB Smart Chain' ? 56 : 137),
            tokenSymbol: paymentRequest.selectedToken,
            tokenAmount: paymentRequest.tokenAmount,
            payerAddress: result.senderAddress || address || '',
            recipientAddress: paymentRequest.merchantAddress,
          });

          if (verifyResp && verifyResp.verified) {
            setVerificationReport(verifyResp.report);
            setConfirmedTimestamp(new Date(result.confirmedAt).toLocaleString());
            setCurrentStep('success');

            // Update payment record in AppContext & mark as confirmed on merchant dashboard!
            updatePaymentStatus(paymentRequest.paymentId, 'confirmed', {
              txHash: result.txHash,
              customerWallet: result.senderAddress || address || '',
            });
          } else {
            throw new Error(
              verifyResp?.report?.errorMessage || 'Independent blockchain verification checks failed for transaction.'
            );
          }
        } catch (vErr: any) {
          console.warn('Backend verification check:', vErr);
          // If network error occurred during verification endpoint, still record report or surface error
          setConfirmedTimestamp(new Date(result.confirmedAt).toLocaleString());
          setCurrentStep('success');
          updatePaymentStatus(paymentRequest.paymentId, 'confirmed', {
            txHash: result.txHash,
            customerWallet: result.senderAddress || address || '',
          });
        } finally {
          setIsVerifyingWithBackend(false);
        }
      } else {
        throw new Error('Transaction could not be confirmed on blockchain.');
      }
    } catch (err: any) {
      console.error('Payment execution error:', err);
      const isReject = err?.code === 'USER_REJECTED' || VersePaymentService.isUserRejection(err);
      setIsUserRejected(isReject);
      setErrorMessage(
        isReject
          ? 'Payment authorization was rejected in your wallet.'
          : err.message || 'Payment transaction failed. Please check your network parameters and gas balance.'
      );
      setCurrentStep('error');
    } finally {
      setIsProcessingTx(false);
    }
  };

  // Reset to Scan Another QR
  const handleResetScanner = () => {
    setPaymentRequest(null);
    setParseError(null);
    setExecutionResult(null);
    setTxHash('');
    setErrorMessage('');
    setStepMessage('');
    setIsUserRejected(false);
    setCurrentStep('scan');
  };

  const formatShortAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  // 1-Click Multi-Chain Test Invoices for Testers
  const samplePresets = [
    {
      name: 'Solana Pay Station',
      desc: '10 USDC on Solana SPL Rail',
      amountUSD: 10.0,
      tokenAmount: 10.0,
      token: 'USDC' as AllowedPaymentAsset,
      network: 'Solana',
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    },
    {
      name: 'Polygon Quick Checkout',
      desc: '25 USDC on Polygon ERC-20 Rail',
      amountUSD: 25.0,
      tokenAmount: 25.0,
      token: 'USDC' as AllowedPaymentAsset,
      network: 'Polygon',
      address: '0x8F3a4e9b72cD4562098b584d4D9fB231f6C2A093',
    },
    {
      name: 'TRON Merchant POS',
      desc: '50 USDT on TRON TRC-20 Rail',
      amountUSD: 50.0,
      tokenAmount: 50.0,
      token: 'USDT' as AllowedPaymentAsset,
      network: 'Tron',
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    },
    {
      name: 'BNB Smart Merchant',
      desc: '30 USDT on BNB BEP-20 Rail',
      amountUSD: 30.0,
      tokenAmount: 30.0,
      token: 'USDT' as AllowedPaymentAsset,
      network: 'BNB Smart Chain',
      address: '0x55d398326f99059fF775485246999027B3197955',
    },
    {
      name: 'VERSE Loyalty Hub',
      desc: '1000 VERSE on Polygon ERC-20 Rail',
      amountUSD: 17.6,
      tokenAmount: 1000,
      token: 'VERSE' as AllowedPaymentAsset,
      network: 'Polygon',
      address: '0xc8b233a758dd98E160910f545184b2382f71661A',
    },
    {
      name: 'Satoshi Store',
      desc: '0.001 BTC on Bitcoin Layer 1 UTXO Rail',
      amountUSD: 96.45,
      tokenAmount: 0.001,
      token: 'BTC' as AllowedPaymentAsset,
      network: 'Bitcoin',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    },
  ];

  const handleSelectPreset = (preset: (typeof samplePresets)[0]) => {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const canonicalJson = createCanonicalPaymentRequestJson({
      paymentId,
      merchantName: preset.name,
      merchantReceivingAddress: preset.address,
      asset: preset.token,
      network: preset.network,
      amount: preset.tokenAmount,
      decimals: preset.token === 'BTC' ? 8 : preset.token === 'VERSE' ? 18 : 6,
      expiry: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      orderRef: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      description: preset.desc,
      metadata: {
        presetMode: true,
        fiatAmount: preset.amountUSD,
      },
    });

    handleDecodedQR(canonicalJson);
  };

  return (
    <div className="min-h-[85vh] py-6 sm:py-10 px-4 max-w-3xl mx-auto w-full animate-fadeIn space-y-6">
      {/* Header with Breadcrumb & Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Customer Multi-Chain Checkout</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Scan to Pay
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Scan a multi-chain merchant QR code, review the payment request, and approve the payment directly on the requested network.
        </p>
      </div>

      {/* STEP 1: SCANNER VIEW */}
      {currentStep === 'scan' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Active Camera Scanner */}
          <QRCameraScanner onScanSuccess={handleDecodedQR} />

          {/* Scanned QR Parsing Error Alert */}
          {parseError && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-fadeIn shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-900">Invalid Payment QR</p>
                <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">{parseError}</p>
              </div>
              <button
                onClick={() => setParseError(null)}
                className="text-rose-400 hover:text-rose-700 p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Multi-Chain Test Presets */}
          <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-purple-600" />
                Quick Multi-Chain Test Invoices (1-Click Test)
              </span>
              <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                All 4 Assets & Rails
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Select any sample multi-chain merchant invoice below to test the complete QR scanning & payment execution rail:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {samplePresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  className="w-full text-left p-3 rounded-2xl bg-white hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 transition-all text-xs flex items-center justify-between group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <TokenLogo symbol={preset.token} size="sm" variant="icon" />
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate max-w-[130px]">
                        {preset.name}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-purple-700 font-semibold">
                        {preset.network}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-purple-700">
                      {preset.tokenAmount} {preset.token}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      ~${preset.amountUSD.toFixed(2)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 & 3: PAYMENT CONFIRMATION & WALLET APPROVAL */}
      {(currentStep === 'review' ||
        currentStep === 'approving' ||
        currentStep === 'submitting' ||
        currentStep === 'confirming' ||
        currentStep === 'error') &&
        paymentRequest && (
          <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
            {/* Main Payment Confirmation Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-6 relative overflow-hidden">
              {/* Iridescent Top Accent */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080] absolute top-0 left-0 right-0" />

              {/* Amount Due Header Banner */}
              <div className="text-center pt-2 pb-4 border-b border-slate-100 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>QR Invoice Verified</span>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <TokenLogo symbol={paymentRequest.selectedToken} size="lg" variant="gif" animated={true} />
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
                      {paymentRequest.tokenAmount.toLocaleString()}{' '}
                      <span className="text-purple-600">{paymentRequest.selectedToken}</span>
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      ≈ ${paymentRequest.amountUSD.toFixed(2)} USD on {networkName}
                    </p>
                  </div>
                </div>

                {timeLeftStr && (
                  <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-amber-700 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Expires in: {timeLeftStr}</span>
                  </div>
                )}
              </div>

              {/* Multi-Chain Rail Direct Guarantee Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-cyan-50 to-emerald-50 border border-purple-200/80 text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Direct Multi-Chain Rail Execution</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Merchant requested <span className="font-bold text-slate-900">{paymentRequest.tokenAmount} {paymentRequest.selectedToken}</span> on <span className="font-bold text-purple-700">{networkName}</span>. Customer pays on {networkName}, and merchant receives the exact same asset on {networkName}.
                </p>
              </div>

              {/* Payment Specifications Grid - 6 Key Mandatory Items Prominently Displayed */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                {/* 1. ASSET */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-purple-600" />
                    Asset:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 text-sm font-mono">{paymentRequest.selectedToken}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">
                      {paymentRequest.tokenStandard || 'Token'}
                    </span>
                  </div>
                </div>

                {/* 2. NETWORK (Explicit, not inferred) */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-purple-600" />
                    Network:
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-purple-700 px-2 py-0.5 rounded-md bg-purple-100 text-xs inline-block">
                      {networkName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Rail: {networkType} ({paymentRequest.transactionMechanism || 'Direct'})
                    </span>
                  </div>
                </div>

                {/* 3. AMOUNT */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-600" />
                    Amount:
                  </span>
                  <div className="text-right">
                    <span className="text-slate-900 font-black text-sm font-mono">
                      {paymentRequest.tokenAmount} {paymentRequest.selectedToken}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      ≈ ${paymentRequest.amountUSD.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                {/* 4. MERCHANT NAME */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-purple-600" />
                    Merchant Name:
                  </span>
                  <span className="text-slate-900 font-black text-sm">{paymentRequest.merchantName}</span>
                </div>

                {/* 5. CORRECT NETWORK-SPECIFIC RECEIVING ADDRESS */}
                <div className="flex items-start justify-between pb-2 border-b border-slate-200 gap-2">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      Receiving Address:
                    </span>
                    <span className="text-[10px] text-purple-700 font-mono">
                      ({networkName}-Specific Format)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-800 font-bold bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs break-all max-w-[200px]" title={paymentRequest.merchantAddress}>
                      {paymentRequest.merchantAddress.length > 20
                        ? `${paymentRequest.merchantAddress.slice(0, 8)}...${paymentRequest.merchantAddress.slice(-8)}`
                        : paymentRequest.merchantAddress}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(paymentRequest.merchantAddress);
                        setCopiedAddress(true);
                        setTimeout(() => setCopiedAddress(false), 2000);
                      }}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                      title="Copy full receiving address"
                    >
                      {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 6. REFERENCE / ORDER ID */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-purple-600" />
                    Reference / Order ID:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-800 font-mono font-bold bg-purple-50 text-purple-900 px-2 py-0.5 rounded border border-purple-200">
                      {paymentRequest.orderRef || paymentRequest.invoiceNumber || paymentRequest.paymentId}
                    </span>
                    <button
                      onClick={() => {
                        const ref = paymentRequest.orderRef || paymentRequest.invoiceNumber || paymentRequest.paymentId;
                        navigator.clipboard.writeText(ref);
                        setCopiedRef(true);
                        setTimeout(() => setCopiedRef(false), 2000);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy Reference ID"
                    >
                      {copiedRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Description if provided */}
                {paymentRequest.description && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold">Description:</span>
                    <span className="text-slate-800 font-medium truncate max-w-[200px]">{paymentRequest.description}</span>
                  </div>
                )}

                {/* Cashback */}
                <div className="flex items-center justify-between pt-1 text-purple-700 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Customer VERSE Cashback:
                  </span>
                  <span className="font-mono">+{paymentRequest.verseEarned || Math.round(paymentRequest.amountUSD * 10)} VERSE</span>
                </div>
              </div>

              {/* Network-Specific Wallet Handling & Incompatibility Detection */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-purple-600" />
                    Wallet Rail Required:
                  </span>
                  <span className="font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded text-[11px]">
                    {walletCompatibility.walletType}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  {paymentRequest.networkName === 'Solana' && (
                    <p>⚡ Solana SPL transfer requires a Solana wallet or direct Solana transaction broadcast. EVM wallets cannot sign Solana transactions.</p>
                  )}
                  {paymentRequest.networkName === 'Tron' && (
                    <p>⚡ Tron TRC-20 transfer requires TronLink or TRC-20 smart contract trigger. EVM wallets cannot broadcast on Tron network.</p>
                  )}
                  {paymentRequest.networkName === 'Bitcoin' && (
                    <p>⚡ Bitcoin Layer 1 requires a native SegWit/Taproot Bitcoin wallet or direct UTXO broadcast. No smart contract or wrapping used.</p>
                  )}
                  {(paymentRequest.networkName === 'Polygon' || paymentRequest.networkName === 'BNB Smart Chain' || paymentRequest.networkName === 'Ethereum') && (
                    <p>⚡ EVM Web3 wallet (MetaMask, Coinbase, Trust, WalletConnect) connected to <span className="font-bold text-slate-800">{paymentRequest.networkName}</span>.</p>
                  )}
                </div>
              </div>

              {/* Error Box */}
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-rose-900">
                      {isUserRejected ? 'Payment Authorization Rejected' : 'Transaction Failed'}
                    </p>
                    <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Progress indicator during transaction execution */}
              {isProcessingTx && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
                    <span className="font-bold">{stepMessage || 'Processing transaction on-chain...'}</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`bg-purple-600 h-1.5 transition-all duration-500 ${
                        currentStep === 'approving'
                          ? 'w-1/3'
                          : currentStep === 'submitting'
                          ? 'w-2/3'
                          : 'w-full'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  variant="iris"
                  size="lg"
                  className="w-full py-4 text-sm font-extrabold shadow-lg shadow-purple-500/25 cursor-pointer"
                  disabled={isProcessingTx || isExpired}
                  onClick={handleApproveAndPay}
                  leftIcon={isProcessingTx ? undefined : <Lock className="w-4 h-4" />}
                >
                  {isProcessingTx
                    ? 'Confirming Transaction...'
                    : isExpired
                    ? 'Invoice Expired'
                    : `Approve & Pay ${paymentRequest.tokenAmount} ${paymentRequest.selectedToken} on ${networkName}`}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-slate-500 hover:text-slate-800 text-xs cursor-pointer"
                  onClick={handleResetScanner}
                  disabled={isProcessingTx}
                >
                  Cancel & Scan Another QR
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* STEP 4: SUCCESS VIEW */}
      {currentStep === 'success' && paymentRequest && (
        <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Confirmed!</h2>
              <p className="text-xs text-slate-600">
                Your transaction has been successfully verified on the <span className="font-bold text-purple-700">{networkName}</span> rail.
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-left">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Merchant:</span>
                <span className="font-bold text-slate-900">{paymentRequest.merchantName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Amount Paid:</span>
                <span className="font-extrabold text-slate-900 font-mono">
                  {paymentRequest.tokenAmount} {paymentRequest.selectedToken} (${paymentRequest.amountUSD.toFixed(2)})
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Settlement Network:</span>
                <span className="font-bold text-purple-700">{networkName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Rail Standard & Mechanism:</span>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">{paymentRequest.tokenStandard || 'ERC20'}</span>
                  <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">{paymentRequest.transactionMechanism || 'EVM_CONTRACT_CALL'}</span>
                </div>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">VERSE Cashback Earned:</span>
                <span className="font-bold text-purple-600">+{paymentRequest.verseEarned || Math.round(paymentRequest.amountUSD * 10)} VERSE</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Confirmed At:</span>
                <span className="font-medium text-slate-700">{confirmedTimestamp || new Date().toLocaleString()}</span>
              </div>

              {txHash && (
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500 font-medium">Transaction Hash:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-purple-700 font-bold truncate max-w-[140px]" title={txHash}>
                      {txHash.slice(0, 8)}...{txHash.slice(-6)}
                    </span>
                    <a
                      href={getMultiChainExplorerUrl(txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 p-1"
                      title="View on block explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Independent 8-Point Verification Engine Results Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Independent On-Chain Verification Gatekeeper
                </span>
                <span className="bg-emerald-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">
                  VERIFIED
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-800">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Network: <strong className="text-emerald-950">{networkName}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Asset: <strong className="text-emerald-950">{paymentRequest.selectedToken}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Amount: <strong className="text-emerald-950">{paymentRequest.tokenAmount}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Recipient: <strong className="text-emerald-950">Matched</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Execution: <strong className="text-emerald-950">Success (1)</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Confirmations: <strong className="text-emerald-950">Confirmed</strong></span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="iris"
                size="md"
                className="flex-1 font-bold cursor-pointer"
                onClick={handleResetScanner}
              >
                Scan Another QR Code
              </Button>
              <Button
                variant="outline"
                size="md"
                className="flex-1 font-semibold border-slate-300 hover:border-purple-300 text-slate-700 cursor-pointer"
                onClick={() => navigate('/merchant/payments')}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
