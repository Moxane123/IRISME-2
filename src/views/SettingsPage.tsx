import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useRouter } from '../context/RouterContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { SUPPORTED_TOKENS, FIAT_CURRENCIES } from '../data/mockData';
import { getReputationConfig, updateReputationConfig } from '../config/reputation';
import {
  Settings,
  Store,
  Wallet,
  ShieldCheck,
  RotateCcw,
  Check,
  Save,
  Globe,
  Sliders,
  Bell,
  Coins,
  Award,
  Star,
  Copy,
  Building,
  Mail,
  Phone,
  KeyRound,
  RefreshCw,
  LogOut,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Lock,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { navigate } = useRouter();
  const {
    merchantProfile,
    updateMerchantProfile,
    rotateMerchantApiKey,
    logoutMerchant,
    isMerchantAuthenticated,
    wallet,
    switchNetwork,
    resetToDefaults,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'settlement' | 'rewards' | 'reputation' | 'api'>('profile');

  // Business Profile Form State
  const [name, setName] = useState(merchantProfile.name || '');
  const [tagline, setTagline] = useState(merchantProfile.tagline || '');
  const [category, setCategory] = useState(merchantProfile.category || 'Retail / E-Commerce');
  const [description, setDescription] = useState(merchantProfile.description || '');
  const [website, setWebsite] = useState(merchantProfile.website || '');
  const [supportEmail, setSupportEmail] = useState(merchantProfile.supportEmail || merchantProfile.email || '');
  const [notificationEmail, setNotificationEmail] = useState(merchantProfile.notificationEmail || merchantProfile.email || '');
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState<boolean>(merchantProfile.emailNotificationsEnabled ?? true);
  const [phone, setPhone] = useState(merchantProfile.phone || '');
  const [businessAddress, setBusinessAddress] = useState(merchantProfile.businessAddress || '');
  const [taxId, setTaxId] = useState(merchantProfile.taxId || '');

  // Settlement & Financial Form State
  const [settlementAddress, setSettlementAddress] = useState(merchantProfile.settlementAddress || '');
  const [defaultAsset, setDefaultAsset] = useState(merchantProfile.defaultPaymentAsset || 'USDT');
  const [defaultFiat, setDefaultFiat] = useState(merchantProfile.defaultFiatCurrency || 'USD');

  // Rewards Form State
  const [baseRewardPercent, setBaseRewardPercent] = useState<number>(merchantProfile.baseRewardPercent || 3.0);
  const [autoReplenishPool, setAutoReplenishPool] = useState<boolean>(merchantProfile.autoReplenishPool ?? true);
  const [replenishThreshold, setReplenishThreshold] = useState<number>(merchantProfile.replenishThreshold || 10000);
  const [loyaltyProgramEnabled, setLoyaltyProgramEnabled] = useState<boolean>(merchantProfile.loyaltyProgramEnabled ?? true);

  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState(merchantProfile.apiWebhookUrl || '');

  // Reputation config state
  const initialRepConfig = getReputationConfig();
  const [pointsPerPayment, setPointsPerPayment] = useState<number>(initialRepConfig.pointsPerVerifiedPayment);
  const [bronzeMax, setBronzeMax] = useState<number>(initialRepConfig.tiers[0]?.maxPayments || 99);
  const [silverMin, setSilverMin] = useState<number>(initialRepConfig.tiers[1]?.minPayments || 100);
  const [silverMax, setSilverMax] = useState<number>(initialRepConfig.tiers[1]?.maxPayments || 999);
  const [goldMin, setGoldMin] = useState<number>(initialRepConfig.tiers[2]?.minPayments || 1000);

  // API Key Visibility & Rotate State
  const [showApiKey, setShowApiKey] = useState(false);
  const [isRotatingKey, setIsRotatingKey] = useState(false);

  // Status & Feedback States
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isResetDone, setIsResetDone] = useState(false);

  // Sync state if merchantProfile updates from backend
  useEffect(() => {
    setName(merchantProfile.name || '');
    setTagline(merchantProfile.tagline || '');
    setCategory(merchantProfile.category || 'Retail / E-Commerce');
    setDescription(merchantProfile.description || '');
    setWebsite(merchantProfile.website || '');
    setSupportEmail(merchantProfile.supportEmail || merchantProfile.email || '');
    setPhone(merchantProfile.phone || '');
    setBusinessAddress(merchantProfile.businessAddress || '');
    setTaxId(merchantProfile.taxId || '');
    setSettlementAddress(merchantProfile.settlementAddress || '');
    setDefaultAsset(merchantProfile.defaultPaymentAsset || 'USDT');
    setDefaultFiat(merchantProfile.defaultFiatCurrency || 'USD');
    setBaseRewardPercent(merchantProfile.baseRewardPercent || 3.0);
    setAutoReplenishPool(merchantProfile.autoReplenishPool ?? true);
    setReplenishThreshold(merchantProfile.replenishThreshold || 10000);
    setLoyaltyProgramEnabled(merchantProfile.loyaltyProgramEnabled ?? true);
    setWebhookUrl(merchantProfile.apiWebhookUrl || '');
  }, [merchantProfile]);

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRotateApiKey = async () => {
    if (!window.confirm('Are you sure you want to regenerate your live API key? Existing integrations using the old key will stop working.')) {
      return;
    }
    setIsRotatingKey(true);
    try {
      const res = await rotateMerchantApiKey();
      if (res.success) {
        setSaveSuccess('API Key rotated successfully.');
        setTimeout(() => setSaveSuccess(null), 3000);
      } else {
        setSaveError(res.error || 'Failed to rotate API Key.');
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Error rotating API key.');
    } finally {
      setIsRotatingKey(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    // Validate settlement address if entered
    if (settlementAddress && !/^0x[a-fA-F0-9]{40}$/.test(settlementAddress.trim())) {
      setSaveError('Invalid receiving EVM wallet address format (must be 0x followed by 40 hex characters).');
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateMerchantProfile({
        name: name.trim(),
        tagline: tagline.trim(),
        category: category.trim(),
        description: description.trim(),
        website: website.trim(),
        supportEmail: supportEmail.trim(),
        notificationEmail: notificationEmail.trim(),
        emailNotificationsEnabled,
        phone: phone.trim(),
        businessAddress: businessAddress.trim(),
        taxId: taxId.trim(),
        settlementAddress: settlementAddress.trim(),
        defaultPaymentAsset: defaultAsset as any,
        defaultFiatCurrency: defaultFiat as any,
        baseRewardPercent: Number(baseRewardPercent) || 3.0,
        autoReplenishPool,
        replenishThreshold: Number(replenishThreshold) || 10000,
        loyaltyProgramEnabled,
        apiWebhookUrl: webhookUrl.trim(),
      });

      // Update reputation thresholds
      updateReputationConfig({
        pointsPerVerifiedPayment: pointsPerPayment,
        tiers: [
          {
            id: 'bronze',
            name: 'Bronze',
            minPayments: 0,
            maxPayments: bronzeMax,
            badge: '🥉',
            color: '#CD7F32',
            textColor: 'text-amber-800',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-300',
            description: `Founding merchant tier (0–${bronzeMax} verified payments)`,
          },
          {
            id: 'silver',
            name: 'Silver',
            minPayments: silverMin,
            maxPayments: silverMax,
            badge: '🥈',
            color: '#94A3B8',
            textColor: 'text-slate-800',
            bgColor: 'bg-slate-100',
            borderColor: 'border-slate-300',
            description: `Established merchant tier (${silverMin}–${silverMax} verified payments)`,
          },
          {
            id: 'gold',
            name: 'Gold',
            minPayments: goldMin,
            maxPayments: Infinity,
            badge: '🥇',
            color: '#EAB308',
            textColor: 'text-yellow-800',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-300',
            description: `High-volume premier tier (${goldMin}+ verified payments)`,
          },
        ],
      });

      if (result.success) {
        setSaveSuccess('Merchant Account and business settings updated successfully.');
        setTimeout(() => setSaveSuccess(null), 3000);
      } else {
        setSaveError(result.error || 'Failed to update business profile.');
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logoutMerchant();
    navigate('/merchant/login');
  };

  const handleReset = () => {
    if (window.confirm('Reset all demo state to defaults?')) {
      resetToDefaults();
      setIsResetDone(true);
      setTimeout(() => setIsResetDone(false), 2500);
    }
  };

  const merchantStatus = merchantProfile.status || (merchantProfile.settlementAddress ? 'active' : 'pending_verification');

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Merchant Account Identity Bar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 relative overflow-hidden shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-purple-500/10 via-cyan-500/10 to-transparent pointer-events-none rounded-full blur-3xl" />

        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Badge */}
            {merchantStatus === 'active' && (
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Merchant Node
              </span>
            )}
            {merchantStatus === 'pending_verification' && (
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Pending Wallet Settlement
              </span>
            )}
            {merchantStatus === 'suspended' && (
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1.5 shadow-xs">
                Account Suspended
              </span>
            )}

            {/* Unique Merchant ID with Copy */}
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700">
              <span>ID:</span>
              <span className="font-bold text-slate-900">{merchantProfile.id}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(merchantProfile.id, 'merchant_id')}
                className="hover:text-purple-700 cursor-pointer ml-1"
                title="Copy Unique Merchant ID"
              >
                {copiedField === 'merchant_id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {merchantProfile.name || 'Merchant Account Settings'}
          </h1>
          <p className="text-xs text-slate-600 max-w-xl">
            Manage your verified business identity, non-custodial crypto receiving address, developer API credentials, and loyalty rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-slate-300 hover:border-rose-300 hover:text-rose-700 text-slate-700 cursor-pointer text-xs flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Switch Account</span>
          </Button>

          <Button
            variant="iris"
            size="sm"
            onClick={() => navigate('/merchant')}
            className="cursor-pointer text-xs"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-purple-50 text-purple-900 border border-purple-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4 text-purple-700" />
          <span>Business Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settlement')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settlement'
              ? 'bg-purple-50 text-purple-900 border border-purple-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Wallet className="w-4 h-4 text-purple-700" />
          <span>Settlement & Receiving Address</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'rewards'
              ? 'bg-purple-50 text-purple-900 border border-purple-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Coins className="w-4 h-4 text-purple-700" />
          <span>VERSE Rewards & Pool</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reputation')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'reputation'
              ? 'bg-purple-50 text-purple-900 border border-purple-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4 text-purple-700" />
          <span>Reputation Engine</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'api'
              ? 'bg-purple-50 text-purple-900 border border-purple-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <KeyRound className="w-4 h-4 text-purple-700" />
          <span>Developer API & Webhooks</span>
        </button>
      </div>

      {/* Global Alerts */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span className="font-medium">{saveError}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: Business Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card variant="default" className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Store className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Business & Brand Information</h3>
                    <p className="text-[11px] text-slate-500">
                      Publicly visible store details on invoices, QR codes, and customer reward receipts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. IRIS Boutique & Cafe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Industry Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-slate-900 focus:outline-none"
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

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono text-xs">
                  Business Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Decentralized non-custodial crypto checkout with instant VERSE rewards."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono text-xs">
                  Business Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of your products, services, and store offerings..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-slate-900 text-xs focus:outline-none"
                />
              </div>
            </Card>

            <Card variant="default" className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Contact & Legal Details</h3>
                    <p className="text-[11px] text-slate-500">
                      Used for invoice receipts, tax compliance, and customer dispute resolution.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Store Website
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourstore.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Customer Support Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="support@yourstore.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Physical / Legal Address
                  </label>
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="742 Evergreen Terrace, Suite 100, San Francisco, CA"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Tax ID / VAT / Registration Number
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="e.g. US-94829104"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </Card>

            {/* Essential Event Notifications (In-App Priority & Secondary Email) */}
            <Card variant="default" className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-5 h-5 text-[#FF0080]" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Essential Payment Notifications</h3>
                    <p className="text-[11px] text-slate-500">
                      In-app status updates are primary. Secondary email notifications can be dispatched for core events.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  MVP 5 Events Only
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                <div className="text-[11px] font-semibold text-slate-700">Supported Essential Events:</div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-medium">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-center">
                    Payment received
                  </span>
                  <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-center">
                    Payment confirmed
                  </span>
                  <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-center">
                    Payment failed
                  </span>
                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-center">
                    Payment expired
                  </span>
                  <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-center">
                    Settlement completed
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotificationsEnabled}
                    onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Enable Secondary Email Channel
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Dispatch immediate email receipt logs alongside in-app notifications whenever essential blockchain events occur.
                    </span>
                  </div>
                </label>

                {emailNotificationsEnabled && (
                  <div className="pl-7 pt-1">
                    <label className="block text-xs text-slate-700 font-bold uppercase tracking-wider mb-1 font-mono">
                      Notification Dispatch Email Address
                    </label>
                    <div className="relative max-w-md">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="email"
                        value={notificationEmail}
                        onChange={(e) => setNotificationEmail(e.target.value)}
                        placeholder="merchant-alerts@yourstore.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-slate-900 focus:outline-none text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: Settlement & Receiving Address */}
        {activeTab === 'settlement' && (
          <div className="space-y-6">
            <Card variant="default" className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-5 h-5 text-[#00D2FE]" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Non-Custodial Settlement Destination</h3>
                    <p className="text-[11px] text-slate-500">
                      All crypto checkout payments flow directly to your designated EVM wallet address.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-300 font-bold">
                  Zero Intermediary Escrow
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-slate-700 font-bold uppercase tracking-wider font-mono">
                  Merchant Payment Receiving Address (Polygon & Ethereum EVM) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Wallet className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={settlementAddress}
                    onChange={(e) => setSettlementAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 font-mono text-slate-900 text-xs focus:outline-none"
                  />
                  {settlementAddress && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(settlementAddress, 'settlement_addr')}
                      className="absolute right-3 top-2 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono cursor-pointer flex items-center gap-1"
                    >
                      {copiedField === 'settlement_addr' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'settlement_addr' ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Must be a standard EVM-compatible address (42 characters starting with 0x).</span>
                  {settlementAddress && /^0x[a-fA-F0-9]{40}$/.test(settlementAddress) && (
                    <a
                      href={`https://polygonscan.com/address/${settlementAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 flex items-center gap-1 font-mono"
                    >
                      View on Polygonscan <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Default Settlement Asset
                  </label>
                  <select
                    value={defaultAsset}
                    onChange={(e) => setDefaultAsset(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] text-slate-900 focus:outline-none"
                  >
                    {SUPPORTED_TOKENS.filter((t) => ['USDT', 'USDC', 'DAI', 'VERSE'].includes(t.symbol)).map((t) => (
                      <option key={t.symbol} value={t.symbol}>
                        {t.symbol} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Default Fiat Pricing Unit
                  </label>
                  <select
                    value={defaultFiat}
                    onChange={(e) => setDefaultFiat(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] text-slate-900 focus:outline-none"
                  >
                    {FIAT_CURRENCIES.map((f) => (
                      <option key={f.code} value={f.code}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            <Card variant="default" className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-slate-900 text-base">Network & Execution Routing</h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                  Polygon Primary
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Target Primary Hub
                  </label>
                  <select
                    value={wallet.network}
                    onChange={(e) => switchNetwork(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none cursor-pointer focus:border-[#7C3AED]"
                  >
                    <option value="Polygon Mainnet (Verse Primary Hub)">Polygon Mainnet (Verse Primary Hub)</option>
                    <option value="Ethereum Mainnet">Ethereum Mainnet</option>
                    <option value="BNB Smart Chain">BNB Smart Chain</option>
                    <option value="Avalanche C-Chain">Avalanche C-Chain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Gas Settlement Mode
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Dynamic On-Chain Gas Estimation (POL/ETH)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-mono text-xs"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: VERSE Rewards & Pool */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <Card variant="default" className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Coins className="w-5 h-5 text-[#00D2FE]" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Customer VERSE Cashback Program</h3>
                    <p className="text-[11px] text-slate-500">
                      Configure base cashback reward rate and automated replenishment for your merchant reward pool.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="space-y-2">
                  <label className="block text-slate-700 font-bold uppercase tracking-wider font-mono">
                    Base VERSE Cashback Rate (%)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      step="0.1"
                      value={baseRewardPercent}
                      onChange={(e) => setBaseRewardPercent(Number(e.target.value))}
                      className="w-32 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] text-slate-900 font-mono font-bold text-sm focus:outline-none"
                    />
                    <span className="text-slate-500 text-xs">
                      Default reward distributed to customers at checkout.
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900">Current Reward Pool Balance</span>
                    <span className="font-mono font-black text-purple-700 text-sm">
                      {merchantProfile.verseRewardPoolBalance.toLocaleString()} VERSE
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    This pool funds customer instant cashbacks, loyalty milestones, and promotional campaigns.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Enable Loyalty Punch-Cards & Goals</span>
                    <span className="text-[11px] text-slate-500">Allow customers to accumulate visit stamps towards milestone bonuses.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={loyaltyProgramEnabled}
                    onChange={(e) => setLoyaltyProgramEnabled(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Auto-Replenish Reward Pool</span>
                    <span className="text-[11px] text-slate-500">Automatically top up the pool when balance drops below threshold.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoReplenishPool}
                    onChange={(e) => setAutoReplenishPool(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: Reputation Engine */}
        {activeTab === 'reputation' && (
          <div className="space-y-6">
            <Card variant="default" className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Merchant Reputation & Tier Thresholds</h3>
                    <p className="text-[11px] text-slate-500">
                      Configure reputation points per verified payment and tier threshold boundaries.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                  Configurable Engine
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Reputation Points Awarded Per Verified Transaction
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={pointsPerPayment}
                      onChange={(e) => setPointsPerPayment(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-32 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] text-slate-900 font-mono font-bold text-sm focus:outline-none"
                    />
                    <span className="text-slate-500 text-xs">
                      Points (+{pointsPerPayment}) are minted solely when a transaction is verified on blockchain.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* Bronze Tier Threshold */}
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <span>🥉</span> Bronze Tier
                      </span>
                      <span className="text-[10px] font-mono text-amber-700 font-bold">Min: 0</span>
                    </div>
                    <div>
                      <label className="block text-[10px] text-amber-800 font-bold uppercase tracking-wider mb-1">
                        Max Payments
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={bronzeMax}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setBronzeMax(val);
                          setSilverMin(val + 1);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-slate-900 font-mono text-xs focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-amber-700">Range: 0 to {bronzeMax} payments</p>
                  </div>

                  {/* Silver Tier Threshold */}
                  <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-100/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>🥈</span> Silver Tier
                      </span>
                      <span className="text-[10px] font-mono text-slate-600 font-bold">Min: {silverMin}</span>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-700 font-bold uppercase tracking-wider mb-1">
                        Max Payments
                      </label>
                      <input
                        type="number"
                        min={silverMin}
                        value={silverMax}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setSilverMax(val);
                          setGoldMin(val + 1);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-600">Range: {silverMin} to {silverMax} payments</p>
                  </div>

                  {/* Gold Tier Threshold */}
                  <div className="p-3.5 rounded-xl border border-yellow-300 bg-yellow-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-yellow-900 flex items-center gap-1.5">
                        <span>🥇</span> Gold Tier
                      </span>
                      <span className="text-[10px] font-mono text-yellow-700 font-bold">Top Tier</span>
                    </div>
                    <div>
                      <label className="block text-[10px] text-yellow-800 font-bold uppercase tracking-wider mb-1">
                        Min Payments (Gold)
                      </label>
                      <input
                        type="number"
                        min={silverMax + 1}
                        value={goldMin}
                        onChange={(e) => setGoldMin(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-yellow-300 text-slate-900 font-mono text-xs focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-yellow-700">Range: {goldMin}+ payments</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 5: Developer API & Webhooks */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <Card variant="default" className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Live API Keys & Security</h3>
                    <p className="text-[11px] text-slate-500">
                      Authenticate programmatically to create payment invoices and query transaction data.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Production Mode
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 font-mono">
                    Live Secret API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        readOnly
                        value={merchantProfile.apiKey || 'iris_live_sec_89dfa0248e3a2b71946c19'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 text-xs focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(merchantProfile.apiKey || 'iris_live_sec_89dfa0248e3a2b71946c19', 'api_key')}
                      className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer flex items-center gap-1"
                    >
                      {copiedField === 'api_key' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'api_key' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRotateApiKey}
                      disabled={isRotatingKey}
                      className="px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRotatingKey ? 'animate-spin' : ''}`} />
                      <span>Rotate Key</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pass in your header: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">Authorization: Bearer &lt;API_KEY&gt;</code>. Never share in client-side HTML.
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="default" className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-5 h-5 text-[#FF0080]" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Real-Time Webhook Notifications</h3>
                    <p className="text-[11px] text-slate-500">
                      Receive instant JSON payloads when crypto payments are verified on-chain.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <label className="block text-slate-700 font-bold uppercase tracking-wider font-mono">
                  Payment Confirmed Webhook URL
                </label>
                <input
                  type="url"
                  placeholder="https://yourstore.com/api/webhooks/verse-payment"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#7C3AED] font-mono text-slate-900 text-xs focus:outline-none"
                />
                <p className="text-[11px] text-slate-500">
                  When a payment is confirmed, IRISME sends a signed JSON POST payload containing <code className="font-mono text-[10px]">invoiceNumber</code>, <code className="font-mono text-[10px]">txHash</code>, <code className="font-mono text-[10px]">amountUSD</code>, and <code className="font-mono text-[10px]">verseEarned</code>.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Global Action Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <Button
            type="submit"
            variant="iris"
            size="md"
            isLoading={isSaving}
            className="w-full sm:w-auto px-8 cursor-pointer font-bold"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save All Settings & Profile Updates
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full sm:w-auto text-slate-600 hover:text-slate-900 border-slate-300 cursor-pointer text-xs"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={handleReset}
          >
            {isResetDone ? 'Clean State Reset!' : 'Reset Demo State'}
          </Button>
        </div>
      </form>
    </div>
  );
};
