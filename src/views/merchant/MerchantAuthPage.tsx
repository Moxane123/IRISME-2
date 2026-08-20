import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useApp } from '../../context/AppContext';
import { useWeb3 } from '../../context/Web3Context';
import { IrisLogo } from '../../components/ui/IrisLogo';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { SUPPORTED_TOKENS, FIAT_CURRENCIES } from '../../data/mockData';
import {
  Store,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Wallet,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building,
  Globe,
  Phone,
  Coins,
  KeyRound,
  UserCheck,
  HelpCircle,
} from 'lucide-react';

export const MerchantAuthPage: React.FC<{ defaultMode?: 'login' | 'register' }> = ({
  defaultMode = 'login',
}) => {
  const { navigate } = useRouter();
  const { loginMerchant, registerMerchant, isMerchantAuthenticated, merchantProfile } = useApp();
  const { address: connectedWalletAddress, isConnected } = useWeb3();

  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState<string>('merchant@irisme.io');
  const [loginPassword, setLoginPassword] = useState<string>('password');

  // Register Form State
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regCategory, setRegCategory] = useState<string>('Retail / E-Commerce');
  const [regTagline, setRegTagline] = useState<string>('');
  const [regDescription, setRegDescription] = useState<string>('');
  const [regSettlementAddress, setRegSettlementAddress] = useState<string>('');
  const [regDefaultAsset, setRegDefaultAsset] = useState<string>('USDT');
  const [regDefaultFiat, setRegDefaultFiat] = useState<string>('USD');
  const [regRewardPercent, setRegRewardPercent] = useState<number>(3.0);
  const [regWebsite, setRegWebsite] = useState<string>('');
  const [regSupportEmail, setRegSupportEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regBusinessAddress, setRegBusinessAddress] = useState<string>('');
  const [regTaxId, setRegTaxId] = useState<string>('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await loginMerchant({
        email: loginEmail.trim(),
        password: loginPassword.trim(),
      });

      if (res.success) {
        setSuccessMessage('Authenticated successfully. Redirecting to Merchant Dashboard...');
        setTimeout(() => {
          navigate('/merchant');
        }, 600);
      } else {
        setErrorMessage(res.error || 'Failed to authenticate. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const { setIsWalletModalOpen } = useApp();

  const handleWalletLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!connectedWalletAddress) {
      setIsWalletModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await loginMerchant({
        settlementAddress: connectedWalletAddress,
      });

      if (res.success) {
        setSuccessMessage('Wallet authenticated! Redirecting to Merchant Dashboard...');
        setTimeout(() => {
          navigate('/merchant');
        }, 600);
      } else {
        setErrorMessage(
          res.error || 'No merchant account registered with this wallet address. Please register below.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Wallet login failed.');
    } finally {
      setLoading(false);
    }
  };


  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim()) {
      setErrorMessage('Business Name is required.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('Business Email is required.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (regSettlementAddress && !/^0x[a-fA-F0-9]{40}$/.test(regSettlementAddress.trim())) {
      setErrorMessage('Invalid receiving EVM wallet address format (must start with 0x and be 42 characters).');
      return;
    }

    setLoading(true);

    try {
      const res = await registerMerchant({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        category: regCategory,
        tagline: regTagline.trim() || `${regName.trim()} on IRISME`,
        description: regDescription.trim() || `Instant crypto checkout with VERSE rewards.`,
        settlementAddress: regSettlementAddress.trim(),
        defaultPaymentAsset: regDefaultAsset,
        defaultFiatCurrency: regDefaultFiat,
        baseRewardPercent: Number(regRewardPercent) || 3.0,
        website: regWebsite.trim(),
        supportEmail: regSupportEmail.trim() || regEmail.trim(),
        phone: regPhone.trim(),
        businessAddress: regBusinessAddress.trim(),
        taxId: regTaxId.trim(),
      });

      if (res.success) {
        setSuccessMessage('Merchant Account registered successfully! Welcome to IRISME.');
        setTimeout(() => {
          navigate('/merchant');
        }, 800);
      } else {
        setErrorMessage(res.error || 'Registration failed. Please check the inputs.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/70 border border-purple-200 text-purple-900 text-xs font-semibold shadow-xs">
          <Store className="w-3.5 h-3.5 text-purple-700" />
          <span>IRISME Merchant Account Portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {mode === 'login' ? 'Merchant Portal Sign In' : 'Register Your Business'}
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          {mode === 'login'
            ? 'Access your merchant dashboard, transaction settlement, API keys, and VERSE loyalty campaigns.'
            : 'Accept decentralized multi-chain crypto payments with instant non-custodial settlement & customer rewards.'}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In to Existing Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create New Merchant Account
          </button>
        </div>
      </div>


      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <div>
            <span className="font-bold">Authentication Error: </span>
            {errorMessage}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
          <div className="font-medium">{successMessage}</div>
        </div>
      )}

      {/* SIGN IN VIEW */}
      {mode === 'login' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7">
            <Card variant="default" className="shadow-sm">
              <CardHeader
                title="Merchant Account Credentials"
                subtitle="Sign in with your registered merchant email and password"
              />
              <CardContent>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                      Business Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="merchant@yourbusiness.com"
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="iris"
                    size="lg"
                    isLoading={loading}
                    className="w-full mt-2 cursor-pointer font-bold"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Sign In to Dashboard
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <div className="text-center">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Or Sign In With Web3 Wallet
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleWalletLogin}
                    disabled={loading}
                    className="w-full border-slate-200 hover:border-purple-300 text-slate-700 cursor-pointer font-medium text-xs flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-4 h-4 text-purple-600" />
                    <span>Sign In With Settlement Wallet Address</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-5 space-y-4">
            <Card variant="default" className="bg-gradient-to-br from-purple-50/70 via-cyan-50/40 to-white border-purple-200/70 shadow-xs">
              <CardContent className="space-y-4 p-6">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Self-Custodial Architecture</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    IrisMe never holds your private keys or customer funds. Payment proceeds are routed straight to your verified settlement address on Polygon and Ethereum.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-purple-100 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Instant token settlement (USDT, USDC, VERSE)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Automated VERSE cashback & loyalty tiers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Isolated merchant data & live webhook API</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="p-3 bg-white/90 rounded-xl border border-purple-200 text-slate-700 text-xs">
                    <span className="font-bold text-purple-900 block mb-0.5">Quick Demo Account:</span>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      Email: <b>merchant@irisme.io</b>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      Password: <b>password</b>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* REGISTRATION VIEW */}
      {mode === 'register' && (
        <form data-tour="merchant-register-form" onSubmit={handleRegisterSubmit} className="space-y-6">
          {/* Section 1: Business Identity */}
          <Card variant="default" className="shadow-sm">
            <CardHeader
              title="1. Business Identity & Account Setup"
              subtitle="Provide your primary business name, category, and account credentials"
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Business Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Apex Coffee & Roasters"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Business Category
                  </label>
                  <select
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  >
                    <option value="Retail / E-Commerce">Retail / E-Commerce</option>
                    <option value="Food & Beverage / Dining">Food & Beverage / Dining</option>
                    <option value="Digital Services / SaaS">Digital Services / SaaS</option>
                    <option value="Hospitality & Travel">Hospitality & Travel</option>
                    <option value="Entertainment & Gaming">Entertainment & Gaming</option>
                    <option value="Other Commercial">Other Commercial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Business Email (Login) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="owner@yourstore.com"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Account Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Business Tagline
                  </label>
                  <input
                    type="text"
                    value={regTagline}
                    onChange={(e) => setRegTagline(e.target.value)}
                    placeholder="e.g. Specialty coffee roasted daily with instant crypto cashback"
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Store Website URL
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="url"
                      value={regWebsite}
                      onChange={(e) => setRegWebsite(e.target.value)}
                      placeholder="https://yourstore.com"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Settlement & Receiving Address */}
          <Card variant="default" className="shadow-sm">
            <CardHeader
              title="2. Crypto Settlement & Payment Receiving Address"
              subtitle="Non-custodial EVM wallet address where all incoming customer payments will be deposited"
            />
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                    Receiving / Settlement Wallet Address
                  </label>
                  {connectedWalletAddress && (
                    <button
                      type="button"
                      onClick={() => setRegSettlementAddress(connectedWalletAddress)}
                      className="text-[11px] text-purple-700 hover:text-purple-900 font-medium cursor-pointer underline flex items-center gap-1"
                    >
                      <Wallet className="w-3 h-3" />
                      Use Connected Wallet ({connectedWalletAddress.slice(0, 6)}...{connectedWalletAddress.slice(-4)})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Wallet className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={regSettlementAddress}
                    onChange={(e) => setRegSettlementAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  You can set or change this anytime in Account Settings. If left empty, your account status will be <b>Pending Verification</b> until a valid wallet is attached.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Default Settlement Asset
                  </label>
                  <select
                    value={regDefaultAsset}
                    onChange={(e) => setRegDefaultAsset(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  >
                    {SUPPORTED_TOKENS.filter((t) => ['USDT', 'USDC', 'DAI', 'VERSE'].includes(t.symbol)).map((t) => (
                      <option key={t.symbol} value={t.symbol}>
                        {t.symbol} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Default Currency
                  </label>
                  <select
                    value={regDefaultFiat}
                    onChange={(e) => setRegDefaultFiat(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  >
                    {FIAT_CURRENCIES.map((f) => (
                      <option key={f.code} value={f.code}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Base VERSE Reward Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.1"
                    value={regRewardPercent}
                    onChange={(e) => setRegRewardPercent(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Contact & Business Details */}
          <Card variant="default" className="shadow-sm">
            <CardHeader
              title="3. Business Contact & Legal Details (Optional)"
              subtitle="Used for customer invoice receipts, receipts verification, and compliance"
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Customer Support Email
                  </label>
                  <input
                    type="email"
                    value={regSupportEmail}
                    onChange={(e) => setRegSupportEmail(e.target.value)}
                    placeholder="support@yourstore.com"
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Business Phone
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                    Tax ID / VAT / EIN
                  </label>
                  <input
                    type="text"
                    value={regTaxId}
                    onChange={(e) => setRegTaxId(e.target.value)}
                    placeholder="US-12345678"
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                  Physical Business Address
                </label>
                <input
                  type="text"
                  value={regBusinessAddress}
                  onChange={(e) => setRegBusinessAddress(e.target.value)}
                  placeholder="123 Main St, Suite 400, New York, NY 10001"
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer underline"
            >
              Already have a merchant account? Sign in
            </button>

            <Button
              type="submit"
              variant="iris"
              size="lg"
              isLoading={loading}
              className="w-full sm:w-auto px-8 cursor-pointer font-bold"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration & Open Dashboard
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
