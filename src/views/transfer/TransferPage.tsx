import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { IrisLogo } from '../../components/ui/IrisLogo';
import { TokenLogo } from '../../components/ui/TokenLogo';
import { TokenLogoModal } from '../../components/ui/TokenLogoModal';
import {
  SupportedToken,
  TransferTransaction,
  SupportedNetworkName,
} from '../../types';
import { PriceService, PriceMap } from '../../services/priceService';
import { TransferService, AddressValidationResult } from '../../services/transferService';
import {
  Send,
  ArrowRightLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Wallet,
  Coins,
  Search,
  CheckCheck,
  ArrowUpRight,
  TrendingUp,
  Layers,
  Sparkles,
} from 'lucide-react';

interface TransferAssetOption {
  symbol: SupportedToken;
  name: string;
  network: SupportedNetworkName;
  networkBadge: string;
  networkColor: string;
  icon: string;
  decimals: number;
  tokenType: string;
}

const TRANSFER_ASSETS: TransferAssetOption[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin (Solana SPL)',
    network: 'Solana',
    networkBadge: 'Solana SPL',
    networkColor: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: '$',
    decimals: 6,
    tokenType: 'SPL Token',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin (TRON TRC20)',
    network: 'TRON',
    networkBadge: 'TRON TRC20',
    networkColor: 'bg-red-100 text-red-800 border-red-300',
    icon: '$',
    decimals: 6,
    tokenType: 'TRC20 Token',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD (BNB BEP20)',
    network: 'BNB Chain',
    networkBadge: 'BNB BEP20',
    networkColor: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: '₮',
    decimals: 18,
    tokenType: 'BEP20 Token',
  },
  {
    symbol: 'BNB',
    name: 'BNB (Native Coin)',
    network: 'BNB Chain',
    networkBadge: 'BNB Native',
    networkColor: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: '🟡',
    decimals: 18,
    tokenType: 'Native Gas Coin',
  },
  {
    symbol: 'SOL',
    name: 'Solana (Native SOL)',
    network: 'Solana',
    networkBadge: 'Solana Native',
    networkColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: '🟣',
    decimals: 9,
    tokenType: 'Native Gas Coin',
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin (Native Layer 1)',
    network: 'Bitcoin',
    networkBadge: 'Bitcoin L1',
    networkColor: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '₿',
    decimals: 8,
    tokenType: 'Native Blockchain Coin',
  },
  {
    symbol: 'VERSE',
    name: 'Verse (Polygon Hub)',
    network: 'Polygon',
    networkBadge: 'Polygon PoS',
    networkColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    icon: '⚡',
    decimals: 18,
    tokenType: 'Rewards / ERC20',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum (Native ETH)',
    network: 'Ethereum',
    networkBadge: 'Ethereum L1',
    networkColor: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: 'Ξ',
    decimals: 18,
    tokenType: 'Native Gas Coin',
  },
  {
    symbol: 'MATIC',
    name: 'Polygon POL',
    network: 'Polygon',
    networkBadge: 'Polygon Native',
    networkColor: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: '🟣',
    decimals: 18,
    tokenType: 'Native Gas Coin',
  },
];

export const TransferPage: React.FC = () => {
  const { wallet, setIsWalletModalOpen } = useApp();
  const web3 = useWeb3();

  // Price feeds
  const [prices, setPrices] = useState<PriceMap>(PriceService.getAllPrices());
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);

  // Form State
  const [selectedAsset, setSelectedAsset] = useState<TransferAssetOption>(TRANSFER_ASSETS[0]);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [memo, setMemo] = useState('');

  // Validation State
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult>({
    isValid: false,
    network: selectedAsset.network,
  });

  // Transfer Execution Lifecycle
  const [transferStage, setTransferStage] = useState<
    'idle' | 'preparing' | 'validating' | 'signing' | 'broadcasting' | 'confirming' | 'confirmed' | 'failed'
  >('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTxHash, setActiveTxHash] = useState('');
  const [lastReceipt, setLastReceipt] = useState<TransferTransaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // History & Filter
  const [history, setHistory] = useState<TransferTransaction[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'Solana' | 'TRON' | 'BNB Chain' | 'Bitcoin' | 'Polygon'>(
    'all'
  );
  const [isLogoGalleryOpen, setIsLogoGalleryOpen] = useState(false);

  // Subscribe to real-time price updates
  useEffect(() => {
    const unsub = PriceService.subscribe((updated) => setPrices({ ...updated }));
    PriceService.fetchRealtimePrices().then((p) => setPrices({ ...p }));
    return () => unsub();
  }, []);

  // Refresh prices on interval
  const handleRefreshPrices = async () => {
    setIsRefreshingPrices(true);
    const updated = await PriceService.fetchRealtimePrices();
    setPrices({ ...updated });
    setTimeout(() => setIsRefreshingPrices(false), 600);
  };

  // Load transfer history on mount
  useEffect(() => {
    setHistory(TransferService.getTransferHistory());
  }, []);

  // Validate address whenever input or network changes
  useEffect(() => {
    if (!recipientAddress.trim()) {
      setAddressValidation({ isValid: false, network: selectedAsset.network });
      return;
    }
    const result = TransferService.validateAddress(recipientAddress, selectedAsset.network);
    setAddressValidation(result);
  }, [recipientAddress, selectedAsset]);

  // Derived price & balance calculations
  const currentTokenPrice = PriceService.getPrice(selectedAsset.symbol);
  const enteredAmountNum = parseFloat(cryptoAmount) || 0;
  const calculatedUSDValue = Number((enteredAmountNum * currentTokenPrice).toFixed(2));

  // Network fee calculation
  const feeEstimate = TransferService.estimateTransferFee(selectedAsset.symbol, selectedAsset.network);

  // Connected wallet available balance
  const activeBalance =
    selectedAsset.symbol === 'VERSE'
      ? web3.balances.VERSE || wallet.balances.VERSE || 0
      : selectedAsset.symbol === 'USDT'
      ? web3.balances.USDT || wallet.balances.USDT || 0
      : selectedAsset.symbol === 'USDC'
      ? web3.balances.USDC || wallet.balances.USDC || 0
      : selectedAsset.symbol === 'ETH'
      ? web3.balances.ETH || wallet.balances.ETH || 0
      : selectedAsset.symbol === 'SOL'
      ? web3.balances.SOL || wallet.balances.SOL || 2.4
      : selectedAsset.symbol === 'BTC'
      ? web3.balances.BTC || wallet.balances.BTC || 0.025
      : selectedAsset.symbol === 'BNB'
      ? web3.balances.BNB || wallet.balances.BNB || 1.5
      : selectedAsset.symbol === 'TRX'
      ? web3.balances.TRX || wallet.balances.TRX || 450
      : web3.balances.MATIC || wallet.balances.MATIC || 0;

  const hasSufficientBalance = activeBalance >= enteredAmountNum && enteredAmountNum > 0;

  // Handle Quick Percentage selector
  const handleQuickPercent = (pct: number) => {
    if (activeBalance <= 0) return;
    const val = (activeBalance * (pct / 100)).toFixed(selectedAsset.decimals > 6 ? 4 : 2);
    setCryptoAmount(val);
  };

  // Execute Transfer
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!web3.isConnected || !web3.address) {
      setIsWalletModalOpen(true);
      return;
    }

    if (!addressValidation.isValid) {
      alert(addressValidation.message || 'Please enter a valid recipient address for this network');
      return;
    }

    if (enteredAmountNum <= 0) {
      alert('Please enter a valid transfer amount');
      return;
    }

    try {
      setTransferStage('preparing');
      setStatusMessage('Initiating transaction pipeline...');

      const result = await TransferService.executeTransfer(
        {
          fromAddress: web3.address,
          toAddress: recipientAddress.trim(),
          token: selectedAsset.symbol,
          network: selectedAsset.network,
          amountCrypto: enteredAmountNum,
          memo: memo.trim() || undefined,
        },
        (stage, msg, txHash) => {
          setTransferStage(stage);
          setStatusMessage(msg);
          if (txHash) setActiveTxHash(txHash);
        }
      );

      setLastReceipt(result);
      setShowReceiptModal(true);
      setHistory(TransferService.getTransferHistory());

      // Reset form
      setCryptoAmount('');
      setRecipientAddress('');
      setMemo('');
      setTransferStage('idle');
    } catch (err: any) {
      setTransferStage('failed');
      setStatusMessage(err.message || 'Transaction failed');
    }
  };

  const filteredHistory = historyFilter === 'all' ? history : history.filter((h) => h.network === historyFilter);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Real-time Crypto Price Ticker Bar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between overflow-x-auto gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Price Feeds</span>
          </div>
          <button
            onClick={handleRefreshPrices}
            disabled={isRefreshingPrices}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Refresh Prices"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPrices ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          {['BTC', 'ETH', 'SOL', 'BNB', 'TRX', 'VERSE', 'USDT', 'USDC'].map((sym) => {
            const p = prices[sym] || { priceUSD: 1.0, change24h: 0 };
            const isPositive = (p.change24h || 0) >= 0;
            return (
              <div key={sym} className="flex items-center gap-1.5 flex-shrink-0 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800">{sym}:</span>
                <span className="text-slate-900 font-semibold">
                  ${p.priceUSD < 0.01 ? p.priceUSD.toFixed(6) : p.priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isPositive ? '+' : ''}
                  {(p.change24h || 0).toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-[#7C3AED]">
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Chain Transaction Layer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Asset Transfer & Payment Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Transfer USDC, USDT, Bitcoin, Solana, BNB, Verse and native assets across verified blockchains with instant confirmation.
          </p>
        </div>

        {!web3.isConnected && (
          <Button
            variant="iris"
            size="md"
            onClick={() => setIsWalletModalOpen(true)}
            leftIcon={<Wallet className="w-4 h-4" />}
            className="flex-shrink-0 cursor-pointer shadow-md"
          >
            Connect Wallet to Transfer
          </Button>
        )}
      </div>

      {/* Transfer Pipeline Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Transfer Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card variant="default" className="p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00D2FE] to-[#7C3AED] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Send Assets</h3>
                  <p className="text-xs text-slate-500">Direct wallet-to-wallet decentralized transfer</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
                Non-Custodial
              </span>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              {/* 1. Select Asset & Network */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    1. Select Transfer Asset & Network
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsLogoGalleryOpen(true)}
                    className="text-[11px] text-[#7C3AED] hover:text-[#FF0080] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#00D2FE]" />
                    <span>Browse Currency Logos & GIFs</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TRANSFER_ASSETS.map((asset) => {
                    const isSelected =
                      selectedAsset.symbol === asset.symbol && selectedAsset.network === asset.network;
                    return (
                      <button
                        key={`${asset.symbol}-${asset.network}`}
                        type="button"
                        onClick={() => setSelectedAsset(asset)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group ${
                          isSelected
                            ? 'bg-gradient-to-br from-purple-50 to-cyan-50 border-[#7C3AED] ring-1 ring-[#7C3AED] shadow-sm'
                            : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <TokenLogo
                            symbol={asset.symbol}
                            size="md"
                            variant={isSelected ? 'gif' : 'icon'}
                            animated={isSelected}
                            chainBadge={asset.network.toLowerCase()}
                          />
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block ${asset.networkColor}`}>
                            {asset.networkBadge}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="font-black text-xs text-slate-900">{asset.symbol}</span>
                          <span className="text-[10px] font-mono text-slate-500">{asset.network}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Destination Wallet Address */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    2. Destination Recipient Address ({selectedAsset.network})
                  </label>
                  {recipientAddress && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        addressValidation.isValid
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      {addressValidation.isValid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Valid {selectedAsset.network} Address
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Invalid Address Format
                        </>
                      )}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={
                      selectedAsset.network === 'Solana'
                        ? 'e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
                        : selectedAsset.network === 'TRON'
                        ? 'e.g. TR7NHqJEhKQniGkfU56b388wb275n513SY'
                        : selectedAsset.network === 'Bitcoin'
                        ? 'e.g. bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
                        : 'e.g. 0x...'
                    }
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl bg-white border font-mono text-xs text-slate-900 focus:outline-none transition-all ${
                      recipientAddress
                        ? addressValidation.isValid
                          ? 'border-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                          : 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]'
                    }`}
                  />
                </div>
                {recipientAddress && !addressValidation.isValid && (
                  <p className="text-[11px] text-rose-600 leading-tight">
                    {addressValidation.message}
                  </p>
                )}
              </div>

              {/* 3. Amount Input & Quick Selectors */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    3. Transfer Amount
                  </label>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Available:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {activeBalance.toLocaleString()} {selectedAsset.symbol}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="0.00"
                      value={cryptoAmount}
                      onChange={(e) => setCryptoAmount(e.target.value)}
                      className="bg-transparent font-mono text-xl font-black text-slate-900 focus:outline-none w-full"
                    />
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800">
                        {selectedAsset.symbol}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                    <span className="text-slate-500">
                      ≈ ${calculatedUSDValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </span>

                    {/* Quick Percentage buttons */}
                    <div className="flex items-center gap-1">
                      {[25, 50, 75, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleQuickPercent(pct)}
                          className="px-2 py-0.5 rounded-lg bg-white hover:bg-purple-50 text-slate-700 hover:text-[#7C3AED] border border-slate-200 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          {pct === 100 ? 'MAX' : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Memo / Reference (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  4. Memo / Invoice Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Order #1042 / Settlement Payment"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-xs text-slate-900 focus:outline-none"
                />
              </div>

              {/* Network Fee Summary Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Estimated Block Confirmation:
                  </span>
                  <span className="font-bold text-slate-900">
                    ~{feeEstimate.estimatedTimeSeconds}s
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Network Miner/Validator Gas:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {feeEstimate.formattedFee}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-slate-700">
                  <span className="font-bold">Total Execution Cost:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {cryptoAmount || '0'} {selectedAsset.symbol} + {feeEstimate.feeCrypto} {feeEstimate.feeToken}
                  </span>
                </div>
              </div>

              {/* Progress Indicator during execution */}
              {transferStage !== 'idle' && transferStage !== 'confirmed' && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#7C3AED] flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Stage: {transferStage.toUpperCase()}
                    </span>
                    {activeTxHash && (
                      <span className="text-[10px] font-mono text-purple-700">
                        {activeTxHash.slice(0, 10)}...{activeTxHash.slice(-8)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700">{statusMessage}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="iris"
                  size="lg"
                  disabled={transferStage !== 'idle' && transferStage !== 'failed'}
                  className="w-full justify-center text-sm font-bold shadow-lg shadow-purple-500/10 cursor-pointer"
                  rightIcon={<ArrowUpRight className="w-4 h-4" />}
                >
                  {transferStage === 'preparing'
                    ? 'Preparing Transfer...'
                    : transferStage === 'signing'
                    ? 'Awaiting Authorization...'
                    : transferStage === 'broadcasting'
                    ? 'Broadcasting to Blockchain...'
                    : transferStage === 'confirming'
                    ? 'Confirming Block...'
                    : `Send ${cryptoAmount || '0'} ${selectedAsset.symbol} on ${selectedAsset.network}`}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Wallet State & Verification Specs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Connected Wallet Verification Card */}
          <Card variant="default" className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#00D2FE]" />
                <h3 className="text-sm font-bold text-slate-900">Connected Wallet Verification</h3>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  web3.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
              />
            </div>

            {web3.isConnected && web3.address ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Sender Address:</span>
                    <span className="font-bold text-emerald-700">Verified Web3 Signer</span>
                  </div>
                  <p className="font-mono text-xs font-bold text-slate-900 truncate">
                    {web3.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Solana Balance:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {(web3.balances.SOL || 2.4).toFixed(3)} SOL
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Bitcoin Balance:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {(web3.balances.BTC || 0.025).toFixed(4)} BTC
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">VERSE Balance:</span>
                    <span className="font-mono font-bold text-[#00D2FE]">
                      {(web3.balances.VERSE || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">USDC / USDT:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ${((web3.balances.USDC || 0) + (web3.balances.USDT || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                <h4 className="text-xs font-bold text-amber-900">Wallet Not Connected</h4>
                <p className="text-[11px] text-amber-700 leading-tight">
                  Connect your self-custodial wallet to verify balances and authorize on-chain transfers.
                </p>
                <Button
                  variant="iris"
                  size="sm"
                  onClick={() => setIsWalletModalOpen(true)}
                  className="w-full text-xs cursor-pointer mt-1"
                >
                  Connect Web3 Wallet
                </Button>
              </div>
            )}
          </Card>

          {/* Supported Transaction Matrix */}
          <Card variant="default" className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
              <h3 className="text-sm font-bold text-slate-900">Supported Network Standards</h3>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Solana Network</p>
                  <p className="text-[10px] text-slate-500">Native SOL & USDC SPL Token</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  ~0.4s Finality
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">TRON Network</p>
                  <p className="text-[10px] text-slate-500">Native TRX & USDC TRC20 Token</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                  TRC-20
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">BNB Smart Chain</p>
                  <p className="text-[10px] text-slate-500">Native BNB & USDT BEP20 Token</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                  BEP-20
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Bitcoin Mainnet</p>
                  <p className="text-[10px] text-slate-500">Native L1 SegWit & Taproot</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-bold">
                  L1 Bitcoin
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Polygon & Verse Ecosystem</p>
                  <p className="text-[10px] text-slate-500">VERSE Token & Instant Loyalty Cashback</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px] font-bold">
                  Primary Hub
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <Card variant="default" className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#00D2FE]" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Transfer History & Receipts</h3>
              <p className="text-xs text-slate-500">On-chain verified transaction ledger</p>
            </div>
          </div>

          {/* Network Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['all', 'Solana', 'TRON', 'BNB Chain', 'Bitcoin', 'Polygon'].map((net) => (
              <button
                key={net}
                onClick={() => setHistoryFilter(net as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  historyFilter === net
                    ? 'bg-gradient-to-r from-[#00D2FE] to-[#7C3AED] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {net === 'all' ? 'All Networks' : net}
              </button>
            ))}
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 pl-2">Asset & Network</th>
                  <th className="pb-3">Recipient Address</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Fee</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3 pr-2 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-2">
                        <TokenLogo
                          symbol={tx.token}
                          size="sm"
                          variant="gif"
                          chainBadge={tx.network.toLowerCase()}
                        />
                        <span className="font-bold text-slate-900">{tx.token}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {tx.network}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 font-mono text-slate-700">
                      {tx.toAddress.slice(0, 8)}...{tx.toAddress.slice(-6)}
                    </td>
                    <td className="py-3.5 font-mono font-bold text-slate-900">
                      {tx.amountCrypto} {tx.token}{' '}
                      <span className="text-[11px] text-slate-500 font-normal">
                        (${tx.amountUSD.toFixed(2)})
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-slate-500">
                      {tx.feeCrypto} {tx.feeToken}
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                        Confirmed
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      {tx.explorerUrl && (
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#7C3AED] hover:text-[#FF0080] font-bold hover:underline"
                        >
                          <span>Scan</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center space-y-2 text-slate-400">
            <Coins className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">No transaction records found for this network.</p>
            <p className="text-[11px] text-slate-400">Send an asset using the transfer tool above to record on-chain transactions.</p>
          </div>
        )}
      </Card>

      {/* Confirmed Receipt Modal */}
      {showReceiptModal && lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#00D2FE] via-[#7C3AED] to-[#FF0080]" />

            <div className="p-6 space-y-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">Transaction Confirmed</h3>
                <p className="text-xs text-slate-500">
                  Successfully broadcast and confirmed on {lastReceipt.network}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Sent Amount:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {lastReceipt.amountCrypto} {lastReceipt.token} (${lastReceipt.amountUSD.toFixed(2)})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {lastReceipt.toAddress.slice(0, 10)}...{lastReceipt.toAddress.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Network Fee:</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {lastReceipt.feeCrypto} {lastReceipt.feeToken}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 block">Transaction Hash:</span>
                  <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200">
                    <span className="font-mono text-[11px] text-slate-700 truncate">
                      {lastReceipt.txHash}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(lastReceipt.txHash);
                        setCopiedHash(true);
                        setTimeout(() => setCopiedHash(false), 2000);
                      }}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {lastReceipt.explorerUrl && (
                  <a
                    href={lastReceipt.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View on Explorer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <Button
                  variant="iris"
                  size="md"
                  className="flex-1 cursor-pointer"
                  onClick={() => setShowReceiptModal(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Token and Currency Logo Explorer Modal */}
      <TokenLogoModal
        isOpen={isLogoGalleryOpen}
        onClose={() => setIsLogoGalleryOpen(false)}
        onSelectToken={(sym) => {
          const match = TRANSFER_ASSETS.find((a) => a.symbol === sym);
          if (match) setSelectedAsset(match);
          setIsLogoGalleryOpen(false);
        }}
      />
    </div>
  );
};
