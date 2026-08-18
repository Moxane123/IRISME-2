import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Payment,
  LoyaltyTier,
  CustomerLoyaltyCard,
  RewardCampaign,
  VerseRewardRecord,
  RewardStatus,
  WalletState,
  MerchantProfile,
  CustomerProfile,
  MerchantLoyaltyGoal,
  SupportedToken,
  PaymentStatus,
  FiatCurrency,
  MerchantCategoryType,
  MerchantAuthResponse,
  SettlementRecord,
  MerchantBalanceSummary,
  InAppPaymentNotification,
  EssentialPaymentEventType,
} from '../types';
import {
  INITIAL_PAYMENTS,
  DEFAULT_LOYALTY_TIERS,
  DEFAULT_MERCHANT_LOYALTY_GOAL,
  INITIAL_CAMPAIGNS,
  INITIAL_CUSTOMER_LOYALTY_CARDS,
  INITIAL_CUSTOMER_REWARDS,
  INITIAL_MERCHANT_PROFILE,
  INITIAL_CUSTOMER_PROFILE,
  SUPPORTED_TOKENS,
} from '../data/mockData';
import { useWeb3 } from './Web3Context';
import { getChainConfig, DEFAULT_PLATFORM_FEE_PERCENT } from '../config';
import { getRewardConfig, getRewardRateForMerchantType } from '../config/rewards';
import { RewardEngine } from '../services/rewardService';
import { EconomicService } from '../services/economicService';
import { ApiService } from '../services/apiService';

interface CreatePaymentParams {
  amountUSD: number;
  fiatCurrency?: FiatCurrency;
  selectedToken: SupportedToken;
  chainId?: number;
  description: string;
  orderRef?: string;
  merchantType?: MerchantCategoryType;
  cashbackPercent?: number;
  expirationMinutes?: number;
  customerName?: string;
}

interface AppContextType {
  // Wallet
  wallet: WalletState;
  isWalletModalOpen: boolean;
  setIsWalletModalOpen: (open: boolean) => void;
  connectWallet: (role?: 'merchant' | 'customer', customAddress?: string) => void;
  disconnectWallet: () => void;
  switchRole: (role: 'merchant' | 'customer') => void;
  switchNetwork: (network: string) => void;

  // Merchant Data
  merchantProfile: MerchantProfile;
  merchantAuthToken: string | null;
  isMerchantAuthenticated: boolean;
  loginMerchant: (credentials: { email?: string; password?: string; settlementAddress?: string }) => Promise<MerchantAuthResponse>;
  registerMerchant: (data: {
    email: string;
    password?: string;
    name: string;
    tagline?: string;
    category?: string;
    description?: string;
    website?: string;
    supportEmail?: string;
    phone?: string;
    businessAddress?: string;
    taxId?: string;
    settlementAddress?: string;
    defaultPaymentAsset?: string;
    defaultFiatCurrency?: string;
    baseRewardPercent?: number;
  }) => Promise<MerchantAuthResponse>;
  logoutMerchant: () => void;
  rotateMerchantApiKey: () => Promise<{ success: boolean; apiKey?: string; error?: string }>;
  updateMerchantProfile: (updates: Partial<MerchantProfile>) => Promise<{ success: boolean; error?: string }>;
  updateRewardPercentage: (percent: number) => void;
  completeOnboarding: (data: {
    name: string;
    description: string;
    category: string;
    settlementAddress: string;
    defaultPaymentAsset: SupportedToken;
    baseRewardPercent: number;
  }) => void;

  // Customer Data & Onboarding
  customerProfile: CustomerProfile;
  updateCustomerProfile: (updates: Partial<CustomerProfile>) => void;
  completeCustomerOnboarding: (data: {
    displayName: string;
    avatarIcon: string;
    favoriteCategories: string[];
    autoStakeVerse: boolean;
    notifyOnCashback: boolean;
  }) => void;
  payments: Payment[];
  createPayment: (paymentData: CreatePaymentParams) => Payment;
  updatePaymentStatus: (paymentId: string, status: PaymentStatus, extra?: Partial<Payment>) => void;
  getPaymentById: (id: string) => Payment | undefined;
  requestRefund: (paymentId: string, reason?: string, requesterWallet?: string) => Promise<{ success: boolean; payment?: Payment; error?: string }>;
  executeRefund: (paymentId: string, data: { refundTxHash: string; note?: string }) => Promise<{ success: boolean; payment?: Payment; error?: string }>;
  rejectRefund: (paymentId: string, reason?: string) => Promise<{ success: boolean; payment?: Payment; error?: string }>;

  // Merchant Settlement & Balance
  settlements: SettlementRecord[];
  merchantBalance: MerchantBalanceSummary;
  refreshSettlementBalance: () => Promise<void>;
  withdrawSettlement: (params: {
    amountUSD: number;
    tokenSymbol?: SupportedToken;
    destinationAddress?: string;
    chainId?: number;
    note?: string;
  }) => Promise<{ success: boolean; settlement?: SettlementRecord; error?: string }>;

  // Loyalty & Rewards
  loyaltyTiers: LoyaltyTier[];
  loyaltyGoal: MerchantLoyaltyGoal;
  updateLoyaltyGoal: (goal: Partial<MerchantLoyaltyGoal>) => Promise<void>;
  campaigns: RewardCampaign[];
  toggleCampaignStatus: (id: string) => void;
  createCampaign: (campaign: Omit<RewardCampaign, 'id' | 'spentVerse' | 'participatingCustomers'>) => void;

  // In-App Payment Notifications (Essential 5 Events Only)
  notifications: InAppPaymentNotification[];
  unreadNotificationCount: number;
  addInAppNotification: (notification: Omit<InAppPaymentNotification, 'id' | 'timestamp' | 'isRead'>) => InAppPaymentNotification | null;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  dispatchSecondaryEmail: (params: {
    eventType: EssentialPaymentEventType;
    recipientEmail?: string;
    invoiceNumber?: string;
    amountUSD?: number;
    tokenSymbol?: SupportedToken;
    txHash?: string;
  }) => Promise<{ success: boolean; message?: string }>;

  // Rewards Management
  customerLoyaltyCards: CustomerLoyaltyCard[];
  customerRewards: VerseRewardRecord[];
  merchantRewards: VerseRewardRecord[];
  distributeReward: (rewardId: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  batchDistributeRewards: (rewardIds?: string[]) => Promise<{ success: boolean; count: number; totalVerse: number; txHash?: string }>;
  claimCustomerRewards: (rewardIds?: string[]) => Promise<{ success: boolean; claimedVerse: number; txHash: string }>;
  claimLoyaltyMilestone: (merchantId?: string) => Promise<{ success: boolean; rewardVerse?: number; message?: string }>;
  processCustomerPayment: (
    paymentId: string,
    token: SupportedToken,
    onStatusChange?: (status: PaymentStatus) => void
  ) => Promise<{ success: boolean; txHash: string; verseEarned: number; isRealOnChain?: boolean }>;

  // Interactive Tutorial & Sandbox Demo
  isTutorialOpen: boolean;
  tutorialTab: 'customer' | 'merchant';
  openTutorial: (tab?: 'customer' | 'merchant') => void;
  closeTutorial: () => void;

  // Real-Time Guided Directional Tour
  isGuidedTourActive: boolean;
  guidedTourType: 'customer' | 'merchant';
  startGuidedTour: (type?: 'customer' | 'merchant') => void;
  stopGuidedTour: () => void;

  // Utility
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'irisme_verse_v4_clean';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const web3 = useWeb3();

  // Initialize wallet state
  const [walletRole, setWalletRole] = useState<'merchant' | 'customer'>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_role`);
    return (saved as 'merchant' | 'customer') || 'merchant';
  });

  const [wallet, setWallet] = useState<WalletState>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_wallet`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.address && parsed.isConnected) {
          return parsed;
        }
      } catch {}
    }
    return {
      isConnected: false,
      address: '',
      network: 'Polygon Mainnet (Verse Primary Hub)',
      chainId: 137,
      role: 'merchant',
      walletMode: 'demo',
      balances: {
        VERSE: 0,
        USDT: 0,
        USDC: 0,
        DAI: 0,
        ETH: 0,
        WBTC: 0,
        MATIC: 0,
        BNB: 0,
        AVAX: 0,
        SOL: 0,
        BTC: 0,
        TRX: 0,
      },
    };
  });

  // Sync wallet state whenever Web3Context state updates
  useEffect(() => {
    if (web3.isConnected && web3.address) {
      const chainCfg = getChainConfig(web3.chainId);
      setWallet((prev) => ({
        ...prev,
        isConnected: true,
        address: web3.address,
        chainId: web3.chainId,
        network: chainCfg ? chainCfg.name : `Chain ${web3.chainId}`,
        role: walletRole,
        walletMode: web3.walletMode,
        isWrongNetwork: web3.isWrongNetwork,
        balances: {
          ...prev.balances,
          ...web3.balances,
        },
      }));
    } else if (!web3.isConnected) {
      setWallet((prev) => ({
        ...prev,
        isConnected: false,
        address: '',
        walletMode: web3.walletMode,
      }));
    }
  }, [
    web3.isConnected,
    web3.address,
    web3.chainId,
    web3.walletMode,
    web3.isWrongNetwork,
    web3.balances,
    walletRole,
  ]);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  
  // Interactive Tutorial & Sandbox Demo State
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [tutorialTab, setTutorialTab] = useState<'customer' | 'merchant'>('customer');

  const openTutorial = (tab: 'customer' | 'merchant' = 'customer') => {
    setTutorialTab(tab);
    setIsTutorialOpen(true);
  };

  const closeTutorial = () => {
    setIsTutorialOpen(false);
  };

  // Real-Time Directional Tour State
  const [isGuidedTourActive, setIsGuidedTourActive] = useState<boolean>(false);
  const [guidedTourType, setGuidedTourType] = useState<'customer' | 'merchant'>('customer');

  const startGuidedTour = (type: 'customer' | 'merchant' = 'customer') => {
    setIsTutorialOpen(false); // close modal if open
    setGuidedTourType(type);
    setIsGuidedTourActive(true);
  };

  const stopGuidedTour = () => {
    setIsGuidedTourActive(false);
  };
  
  const [merchantAuthToken, setMerchantAuthToken] = useState<string | null>(() => ApiService.getAuthToken());
  const isMerchantAuthenticated = Boolean(merchantAuthToken);

  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_merchant`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_MERCHANT_PROFILE;
  });

  // Load latest merchant profile from backend session on startup
  useEffect(() => {
    const fetchAuthMerchant = async () => {
      if (ApiService.getAuthToken()) {
        try {
          const profile = await ApiService.getCurrentMerchant();
          if (profile) {
            setMerchantProfile(profile);
            const serverPayments = await ApiService.getMerchantPayments();
            if (serverPayments && serverPayments.length > 0) {
              setPayments(serverPayments);
            }
          }
        } catch (e) {
          console.warn('Could not sync merchant profile from server:', e);
        }
      }
    };
    fetchAuthMerchant();
  }, [merchantAuthToken]);

  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_customer`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_CUSTOMER_PROFILE;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_payments`);
      return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  const [settlements, setSettlements] = useState<SettlementRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_settlements`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [merchantBalance, setMerchantBalance] = useState<MerchantBalanceSummary>({
    availableBalanceUSD: 0,
    pendingBalanceUSD: 0,
    totalReceivedUSD: 0,
    totalSettledUSD: 0,
    settlementAddress: merchantProfile.settlementAddress || '',
  });

  // ==========================================
  // IN-APP NOTIFICATIONS (5 Essential Events Only)
  // 1. Payment received
  // 2. Payment confirmed
  // 3. Payment failed
  // 4. Payment expired
  // 5. Settlement completed
  // ==========================================
  const [notifications, setNotifications] = useState<InAppPaymentNotification[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_notifications`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_notifications`, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Sync server notifications
  useEffect(() => {
    const fetchServerNotifications = async () => {
      try {
        const res = await ApiService.getInAppNotifications();
        if (res.notifications && res.notifications.length > 0) {
          setNotifications((prev) => {
            const map = new Map<string, InAppPaymentNotification>();
            prev.forEach((n) => map.set(n.id, n));
            res.notifications.forEach((n) => map.set(n.id, n));
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          });
        }
      } catch (err) {
        console.warn('Could not sync notifications from server:', err);
      }
    };
    fetchServerNotifications();
  }, [merchantAuthToken]);

  // Ref tracking emitted blockchain events to prevent duplicate confirmations and notification spam
  const processedEventKeysRef = React.useRef<Set<string>>(new Set());

  const addInAppNotification = (
    item: Omit<InAppPaymentNotification, 'id' | 'timestamp' | 'isRead'>
  ): InAppPaymentNotification | null => {
    const normTx = (item.txHash || '').toLowerCase().trim();
    const eventKey = `${item.eventType}_${item.paymentId || item.settlementId || ''}_${normTx}`;

    // STRICT DEDUPLICATION: Ensure the same blockchain event cannot generate duplicate confirmations/notifications
    if (processedEventKeysRef.current.has(eventKey)) {
      return null;
    }
    processedEventKeysRef.current.add(eventKey);

    const newNotif: InAppPaymentNotification = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      secondaryEmailSent: Boolean(merchantProfile.emailNotificationsEnabled),
    };

    setNotifications((prev) => [newNotif, ...prev.filter((p) => p.id !== newNotif.id)]);

    // Secondary email dispatch if merchant enabled
    if (merchantProfile.emailNotificationsEnabled && merchantProfile.notificationEmail) {
      ApiService.dispatchSecondaryEmailNotification({
        eventType: item.eventType,
        recipientEmail: merchantProfile.notificationEmail,
        invoiceNumber: item.invoiceNumber,
        amountUSD: item.amountUSD,
        tokenSymbol: item.tokenSymbol,
        txHash: item.txHash,
      }).catch(() => {});
    }

    return newNotif;
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await ApiService.markNotificationAsRead(id);
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await ApiService.markAllNotificationsAsRead(merchantProfile.id);
  };

  const clearNotifications = async () => {
    setNotifications([]);
    await ApiService.clearNotifications(merchantProfile.id);
  };

  const dispatchSecondaryEmail = async (params: {
    eventType: EssentialPaymentEventType;
    recipientEmail?: string;
    invoiceNumber?: string;
    amountUSD?: number;
    tokenSymbol?: SupportedToken;
    txHash?: string;
  }) => {
    return ApiService.dispatchSecondaryEmailNotification(params);
  };

  // Calculate live merchant balance from verified payments & withdrawals
  const refreshSettlementBalance = async () => {
    try {
      const serverBalance = await ApiService.getMerchantSettlementBalance();
      if (serverBalance) {
        setMerchantBalance(serverBalance);
        const serverSettlements = await ApiService.getMerchantSettlements();
        if (serverSettlements && serverSettlements.length > 0) {
          setSettlements(serverSettlements);
        }
        return;
      }
    } catch (e) {
      console.warn('Could not fetch server settlement balance:', e);
    }

    // Client-side fallback computation
    const activeMerchantId = merchantProfile.id || 'm-iris-merchant-default';
    const merchantPayments = payments.filter(
      (p) => !p.merchantId || p.merchantId === activeMerchantId || p.merchantId === 'm-iris-merchant-default'
    );

    let totalReceived = 0;
    let availableNet = 0;
    let pending = 0;

    for (const p of merchantPayments) {
      const isConfirmed = p.status === 'confirmed' || p.status === 'completed' || p.status === 'paid';
      const isPending =
        p.status === 'pending' ||
        p.status === 'awaiting_payment' ||
        p.status === 'transaction_detected' ||
        p.status === 'verifying' ||
        p.status === 'submitted' ||
        p.status === 'confirming' ||
        p.status === 'processing';

      if (isConfirmed) {
        totalReceived += p.amountUSD || 0;
        const net =
          p.netSettlementUSD !== undefined
            ? p.netSettlementUSD
            : Number(((p.amountUSD || 0) * (1 - DEFAULT_PLATFORM_FEE_PERCENT / 100)).toFixed(2));
        availableNet += net;
      } else if (isPending) {
        pending += p.amountUSD || 0;
      }
    }

    const withdrawn = settlements
      .filter((s) => s.status === 'COMPLETED' && s.type === 'MANUAL_WITHDRAWAL')
      .reduce((sum, s) => sum + s.amountUSD, 0);

    const safeAvailable = Math.max(0, Number((availableNet - withdrawn).toFixed(2)));

    setMerchantBalance({
      availableBalanceUSD: safeAvailable,
      pendingBalanceUSD: Number(pending.toFixed(2)),
      totalReceivedUSD: Number(totalReceived.toFixed(2)),
      totalSettledUSD: Number(availableNet.toFixed(2)),
      settlementAddress: merchantProfile.settlementAddress || '',
    });
  };

  // Sync balances on payments or settlements change
  useEffect(() => {
    refreshSettlementBalance();
  }, [payments, settlements, merchantProfile.settlementAddress]);

  const withdrawSettlement = async (params: {
    amountUSD: number;
    tokenSymbol?: SupportedToken;
    destinationAddress?: string;
    chainId?: number;
    note?: string;
  }): Promise<{ success: boolean; settlement?: SettlementRecord; error?: string }> => {
    const dest = params.destinationAddress || merchantProfile.settlementAddress;
    if (!dest || !dest.startsWith('0x') || dest.length !== 42) {
      return { success: false, error: 'A valid EVM settlement address is required.' };
    }

    if (params.amountUSD > merchantBalance.availableBalanceUSD) {
      return {
        success: false,
        error: `Withdrawal amount ($${params.amountUSD.toFixed(2)}) exceeds available balance ($${merchantBalance.availableBalanceUSD.toFixed(2)}).`,
      };
    }

    // Call server API
    const res = await ApiService.requestSettlementWithdrawal({
      amountUSD: params.amountUSD,
      tokenSymbol: params.tokenSymbol || 'USDT',
      destinationAddress: dest,
      chainId: params.chainId || 137,
      note: params.note,
    });

    if (res.success && res.settlement) {
      setSettlements((prev) => [res.settlement!, ...prev]);
      await refreshSettlementBalance();

      // Emit essential notification: settlement_completed
      addInAppNotification({
        eventType: 'settlement_completed',
        settlementId: res.settlement.id,
        merchantId: merchantProfile.id,
        title: 'Settlement Completed',
        message: `Settlement payout of $${params.amountUSD.toFixed(2)} ${params.tokenSymbol || 'USDT'} completed.`,
        amountUSD: params.amountUSD,
        tokenAmount: params.amountUSD,
        tokenSymbol: params.tokenSymbol || 'USDT',
        txHash: res.settlement.txHash,
      });

      return { success: true, settlement: res.settlement };
    }

    // Local fallback if offline
    const fallbackRecord: SettlementRecord = {
      id: `stl_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      merchantId: merchantProfile.id,
      amountUSD: params.amountUSD,
      tokenAmount: params.amountUSD,
      tokenSymbol: params.tokenSymbol || 'USDT',
      destinationAddress: dest,
      chainId: params.chainId || 137,
      status: 'COMPLETED',
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      type: 'MANUAL_WITHDRAWAL',
      note: params.note || `Instant wallet settlement to ${dest.slice(0, 6)}...${dest.slice(-4)}`,
    };

    setSettlements((prev) => [fallbackRecord, ...prev]);

    addInAppNotification({
      eventType: 'settlement_completed',
      settlementId: fallbackRecord.id,
      merchantId: merchantProfile.id,
      title: 'Settlement Completed',
      message: `Settlement payout of $${params.amountUSD.toFixed(2)} ${params.tokenSymbol || 'USDT'} completed.`,
      amountUSD: params.amountUSD,
      tokenAmount: params.amountUSD,
      tokenSymbol: params.tokenSymbol || 'USDT',
      txHash: fallbackRecord.txHash,
    });

    return { success: true, settlement: fallbackRecord };
  };

  const [loyaltyGoal, setLoyaltyGoal] = useState<MerchantLoyaltyGoal>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_loyalty_goal`);
      return saved ? JSON.parse(saved) : DEFAULT_MERCHANT_LOYALTY_GOAL;
    } catch {
      return DEFAULT_MERCHANT_LOYALTY_GOAL;
    }
  });

  const [loyaltyTiers] = useState<LoyaltyTier[]>(DEFAULT_LOYALTY_TIERS);

  const [campaigns, setCampaigns] = useState<RewardCampaign[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_campaigns`);
      return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
    } catch {
      return INITIAL_CAMPAIGNS;
    }
  });

  const [customerLoyaltyCards, setCustomerLoyaltyCards] = useState<CustomerLoyaltyCard[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_loyalty_cards`);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_LOYALTY_CARDS;
    } catch {
      return INITIAL_CUSTOMER_LOYALTY_CARDS;
    }
  });

  const [customerRewards, setCustomerRewards] = useState<VerseRewardRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_rewards`);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_REWARDS;
    } catch {
      return INITIAL_CUSTOMER_REWARDS;
    }
  });

  // Fetch initial campaigns & merchant goal from server on load
  useEffect(() => {
    const initServerData = async () => {
      try {
        const serverCampaigns = await ApiService.getCampaigns();
        if (serverCampaigns && serverCampaigns.length > 0) {
          setCampaigns(serverCampaigns);
        }
        const serverGoal = await ApiService.getMerchantLoyaltyGoal(merchantProfile.id);
        if (serverGoal) {
          setLoyaltyGoal(serverGoal);
        }
      } catch (err) {
        console.warn('Initial server data load fallback:', err);
      }
    };
    initServerData();
  }, [merchantProfile.id]);

  // Fetch customer loyalty cards whenever customer wallet changes
  useEffect(() => {
    const fetchWalletLoyalty = async () => {
      const activeWallet = web3.address || wallet.address;
      if (activeWallet && activeWallet.length > 5) {
        const cards = await ApiService.getCustomerLoyaltyCards(activeWallet);
        if (cards && cards.length > 0) {
          setCustomerLoyaltyCards(cards);
        }
      }
    };
    fetchWalletLoyalty();
  }, [web3.address, wallet.address]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_wallet`, JSON.stringify(wallet));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_role`, walletRole);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_merchant`, JSON.stringify(merchantProfile));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_customer`, JSON.stringify(customerProfile));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_payments`, JSON.stringify(payments));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_campaigns`, JSON.stringify(campaigns));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_loyalty_cards`, JSON.stringify(customerLoyaltyCards));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_rewards`, JSON.stringify(customerRewards));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_loyalty_goal`, JSON.stringify(loyaltyGoal));
    } catch {
      // ignore storage quota errors
    }
  }, [wallet, walletRole, merchantProfile, customerProfile, payments, campaigns, customerLoyaltyCards, customerRewards, loyaltyGoal]);

  const connectWallet = (role?: 'merchant' | 'customer', customAddress?: string) => {
    if (role) setWalletRole(role);
    web3.connectDemo(customAddress);
    setIsWalletModalOpen(false);
  };

  const disconnectWallet = () => {
    web3.disconnect();
  };

  const switchRole = (role: 'merchant' | 'customer') => {
    setWalletRole(role);
    setWallet((prev) => ({
      ...prev,
      role,
    }));
  };

  const switchNetwork = (network: string) => {
    setWallet((prev) => ({
      ...prev,
      network,
    }));
  };

  const loginMerchant = async (credentials: { email?: string; password?: string; settlementAddress?: string }): Promise<MerchantAuthResponse> => {
    const res = await ApiService.loginMerchant(credentials);
    if (res.success && res.token && res.merchant) {
      setMerchantAuthToken(res.token);
      setMerchantProfile(res.merchant);
      try {
        const isolatedPayments = await ApiService.getMerchantPayments();
        if (isolatedPayments) setPayments(isolatedPayments);
        const allCampaigns = await ApiService.getCampaigns();
        if (allCampaigns) setCampaigns(allCampaigns.filter((c) => c.merchantId === res.merchant!.id));
      } catch (err) {
        console.warn('Failed to load merchant isolated records on login:', err);
      }
    }
    return res;
  };

  const registerMerchant = async (data: {
    email: string;
    password?: string;
    name: string;
    tagline?: string;
    category?: string;
    description?: string;
    website?: string;
    supportEmail?: string;
    phone?: string;
    businessAddress?: string;
    taxId?: string;
    settlementAddress?: string;
    defaultPaymentAsset?: string;
    defaultFiatCurrency?: string;
    baseRewardPercent?: number;
  }): Promise<MerchantAuthResponse> => {
    const res = await ApiService.registerMerchant(data);
    if (res.success && res.token && res.merchant) {
      setMerchantAuthToken(res.token);
      setMerchantProfile(res.merchant);
    }
    return res;
  };

  const logoutMerchant = () => {
    ApiService.setAuthToken(null);
    setMerchantAuthToken(null);
  };

  const rotateMerchantApiKey = async (): Promise<{ success: boolean; apiKey?: string; error?: string }> => {
    const res = await ApiService.rotateApiKey();
    if (res.success && res.apiKey) {
      setMerchantProfile((prev) => ({ ...prev, apiKey: res.apiKey }));
    }
    return res;
  };

  const updateMerchantProfile = async (updates: Partial<MerchantProfile>): Promise<{ success: boolean; error?: string }> => {
    // 1. Local state update
    setMerchantProfile((prev) => ({ ...prev, ...updates }));
    // 2. Server persistence
    try {
      const res = await ApiService.updateMerchantProfile(updates);
      if (res.success && res.merchant) {
        setMerchantProfile(res.merchant);
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Server update failed' };
    }
  };

  const completeOnboarding = async (data: {
    name: string;
    description: string;
    category: string;
    settlementAddress: string;
    defaultPaymentAsset: SupportedToken;
    baseRewardPercent: number;
  }) => {
    const updates: Partial<MerchantProfile> = {
      name: data.name,
      description: data.description,
      tagline: data.description.slice(0, 100),
      category: data.category,
      settlementAddress: data.settlementAddress,
      defaultPaymentAsset: data.defaultPaymentAsset,
      baseRewardPercent: data.baseRewardPercent,
      isOnboarded: true,
      status: data.settlementAddress ? 'active' : 'pending_verification',
    };
    await updateMerchantProfile(updates);
  };

  const updateRewardPercentage = (percent: number) => {
    const safe = Math.max(0, Math.min(100, percent));
    updateMerchantProfile({ baseRewardPercent: safe });
  };

  const updateCustomerProfile = (updates: Partial<CustomerProfile>) => {
    setCustomerProfile((prev) => ({ ...prev, ...updates }));
  };

  const completeCustomerOnboarding = (data: {
    displayName: string;
    avatarIcon: string;
    favoriteCategories: string[];
    autoStakeVerse: boolean;
    notifyOnCashback: boolean;
  }) => {
    const currentAddr = web3.address || wallet.address || '';
    
    setCustomerProfile((prev) => ({
      ...prev,
      walletAddress: currentAddr,
      displayName: data.displayName || 'Crypto Shopper',
      avatarIcon: data.avatarIcon || '💳',
      favoriteCategories: data.favoriteCategories,
      autoStakeVerse: data.autoStakeVerse,
      notifyOnCashback: data.notifyOnCashback,
      welcomeBonusClaimed: true,
      isOnboarded: true,
    }));

    // Grant 50 VERSE starter welcome bonus if first time
    if (!customerProfile.welcomeBonusClaimed) {
      setWallet((prev) => ({
        ...prev,
        balances: {
          ...prev.balances,
          VERSE: (prev.balances.VERSE || 0) + 50,
        },
      }));

      // Add a Welcome Bonus record
      const welcomeReward: VerseRewardRecord = {
        id: `rew-welcome-${Date.now()}`,
        paymentId: 'genesis-welcome',
        paymentInvoiceNumber: 'VERSE-PASS-GENESIS',
        merchantName: 'VERSE Loyalty Protocol',
        customerWallet: currentAddr,
        rewardPercentage: 100,
        amountVerse: 50,
        usdValue: 50 * 0.00038,
        status: 'distributed',
        timestamp: new Date().toISOString(),
        distributedAt: new Date().toISOString(),
        source: 'Welcome Pass Bonus Drop (50 VERSE)',
      };
      setCustomerRewards((prev) => [welcomeReward, ...prev]);
    }

    switchRole('customer');
  };

  const updatePaymentStatus = (paymentId: string, status: PaymentStatus, extra?: Partial<Payment>) => {
    let target = payments.find((p) => p.id === paymentId);
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          const updated = { ...p, status, ...extra };
          target = updated;
          return updated;
        }
        return p;
      })
    );

    if (target) {
      const merged = { ...target, status, ...extra };
      const amountUSD = merged.amountUSD;
      const invoiceNumber = merged.invoiceNumber || merged.id;
      const txHash = merged.txHash;
      const tokenSymbol = merged.selectedToken;
      const tokenAmount = merged.tokenAmount;

      if (status === 'transaction_detected' || status === 'submitted') {
        addInAppNotification({
          eventType: 'payment_received',
          paymentId,
          invoiceNumber,
          merchantId: merged.merchantId || merchantProfile.id,
          title: 'Payment Transaction Detected',
          message: `Incoming blockchain transaction detected for invoice #${invoiceNumber}.`,
          amountUSD,
          tokenAmount,
          tokenSymbol,
          txHash,
        });
      } else if (status === 'confirmed' || status === 'paid') {
        addInAppNotification({
          eventType: 'payment_confirmed',
          paymentId,
          invoiceNumber,
          merchantId: merged.merchantId || merchantProfile.id,
          title: 'Payment Confirmed',
          message: `Payment #${invoiceNumber} for $${amountUSD.toFixed(2)} (${tokenAmount || amountUSD} ${tokenSymbol || 'USDT'}) confirmed on-chain.`,
          amountUSD,
          tokenAmount,
          tokenSymbol,
          txHash,
        });
      } else if (status === 'failed') {
        addInAppNotification({
          eventType: 'payment_failed',
          paymentId,
          invoiceNumber,
          merchantId: merged.merchantId || merchantProfile.id,
          title: 'Payment Failed',
          message: `Payment #${invoiceNumber} transaction failed on blockchain.`,
          amountUSD,
          tokenAmount,
          tokenSymbol,
          txHash,
        });
      } else if (status === 'expired') {
        addInAppNotification({
          eventType: 'payment_expired',
          paymentId,
          invoiceNumber,
          merchantId: merged.merchantId || merchantProfile.id,
          title: 'Payment Expired',
          message: `Payment invoice #${invoiceNumber} ($${amountUSD.toFixed(2)}) has expired.`,
          amountUSD,
          tokenAmount,
          tokenSymbol,
          txHash,
        });
      }
    }
  };

  const requestRefund = async (
    paymentId: string,
    reason?: string,
    requesterWallet?: string
  ): Promise<{ success: boolean; payment?: Payment; error?: string }> => {
    const res = await ApiService.requestRefund(paymentId, reason, requesterWallet);
    if (res.success && res.payment) {
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? res.payment! : p)));
      return { success: true, payment: res.payment };
    } else {
      // Local optimistic fallback
      const target = payments.find((p) => p.id === paymentId);
      if (target) {
        const updated: Payment = {
          ...target,
          refundStatus: 'REQUESTED',
          refundDetails: {
            status: 'REQUESTED',
            requestedAt: new Date().toISOString(),
            reason: reason || 'Customer requested refund',
            refundAmountUSD: target.amountUSD,
            refundTokenAmount: target.tokenAmount,
            tokenSymbol: target.selectedToken,
            recipientWallet: requesterWallet || target.customerWallet || '',
          },
        };
        setPayments((prev) => prev.map((p) => (p.id === paymentId ? updated : p)));
        return { success: true, payment: updated };
      }
      return { success: false, error: res.error || 'Payment not found' };
    }
  };

  const executeRefund = async (
    paymentId: string,
    data: { refundTxHash: string; note?: string }
  ): Promise<{ success: boolean; payment?: Payment; error?: string }> => {
    const res = await ApiService.executeRefund(paymentId, data);
    if (res.success && res.payment) {
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? res.payment! : p)));
      refreshSettlementBalance().catch(() => {});
      return { success: true, payment: res.payment };
    } else {
      const target = payments.find((p) => p.id === paymentId);
      if (target) {
        const updated: Payment = {
          ...target,
          status: 'refunded',
          refundStatus: 'COMPLETED',
          refundDetails: {
            status: 'COMPLETED',
            requestedAt: target.refundDetails?.requestedAt || new Date().toISOString(),
            refundedAt: new Date().toISOString(),
            reason: target.refundDetails?.reason || data.note || 'Merchant full refund',
            refundAmountUSD: target.amountUSD,
            refundTokenAmount: target.tokenAmount,
            tokenSymbol: target.selectedToken,
            recipientWallet: target.customerWallet || '',
            refundTxHash: data.refundTxHash,
            note: data.note || 'Separate on-chain reverse transfer to payer wallet',
          },
        };
        setPayments((prev) => prev.map((p) => (p.id === paymentId ? updated : p)));
        refreshSettlementBalance().catch(() => {});
        return { success: true, payment: updated };
      }
      return { success: false, error: res.error || 'Payment not found' };
    }
  };

  const rejectRefund = async (
    paymentId: string,
    reason?: string
  ): Promise<{ success: boolean; payment?: Payment; error?: string }> => {
    const res = await ApiService.rejectRefund(paymentId, reason);
    if (res.success && res.payment) {
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? res.payment! : p)));
      return { success: true, payment: res.payment };
    } else {
      const target = payments.find((p) => p.id === paymentId);
      if (target) {
        const updated: Payment = {
          ...target,
          refundStatus: 'REJECTED',
          refundDetails: target.refundDetails
            ? { ...target.refundDetails, status: 'REJECTED', note: reason }
            : undefined,
        };
        setPayments((prev) => prev.map((p) => (p.id === paymentId ? updated : p)));
        return { success: true, payment: updated };
      }
      return { success: false, error: res.error || 'Payment not found' };
    }
  };

  const getPaymentById = (id: string): Payment | undefined => {
    return payments.find((p) => p.id === id || p.invoiceNumber.toLowerCase() === id.toLowerCase());
  };

  const createPayment = (data: CreatePaymentParams): Payment => {
    const targetChainId = data.chainId || 137;
    const tokenInfo = SUPPORTED_TOKENS.find((t) => t.symbol === data.selectedToken) || SUPPORTED_TOKENS[0];
    const verseToken = SUPPORTED_TOKENS.find((t) => t.symbol === 'VERSE')!;
    const merchantType: MerchantCategoryType = data.merchantType || merchantProfile.merchantType || 'irisme_merchant';

    const tokenAmount =
      data.selectedToken === 'VERSE'
        ? Math.round(data.amountUSD / verseToken.rateToUSD)
        : data.selectedToken === 'ETH' || data.selectedToken === 'WBTC'
        ? Number((data.amountUSD / tokenInfo.rateToUSD).toFixed(6))
        : Number((data.amountUSD / tokenInfo.rateToUSD).toFixed(2));

    // Calculate base or custom VERSE cashback reward using RewardEngine & centralized config
    const effectiveRewardPercent =
      typeof data.cashbackPercent === 'number' && data.cashbackPercent >= 0
        ? data.cashbackPercent
        : getRewardRateForMerchantType(merchantType);

    // Strict 3-Concept Economic Calculation
    const economics = EconomicService.getPaymentEconomics({
      amountUSD: data.amountUSD,
      tokenAmount,
      tokenSymbol: data.selectedToken,
      chainId: targetChainId,
      settlementAddress: merchantProfile.settlementAddress || '',
      merchantType,
      cashbackPercent: effectiveRewardPercent,
    });

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `pay-irx-${randomSuffix}`;
    const newInvoice = `INV-${new Date().getFullYear()}-${randomSuffix}`;

    const now = new Date();
    const expiryMinutes = data.expirationMinutes && data.expirationMinutes > 0 ? data.expirationMinutes : 45;
    const expires = new Date(now.getTime() + expiryMinutes * 60 * 1000);

    const newPayment: Payment = {
      id: newId,
      invoiceNumber: newInvoice,
      merchantId: merchantProfile.id,
      merchantName: merchantProfile.name || (merchantType === 'irisme_merchant' ? 'IrisMe Verified Merchant' : 'External Merchant'),
      merchantType,
      merchantAddress: merchantProfile.settlementAddress || '',
      amountUSD: data.amountUSD,
      fiatCurrency: data.fiatCurrency || 'USD',
      selectedToken: data.selectedToken,
      tokenAmount,
      chainId: targetChainId,
      networkName: economics.gasEstimate.networkName,
      // 1. Blockchain Network Fee (Gas in native token)
      gasEstimate: economics.gasEstimate,
      estimatedGasUSD: economics.gasEstimate.gasCostUSD,
      // 2. IrisMe Platform Fee & Net Settlement
      platformFeePercent: economics.platformFee.platformFeePercent,
      platformFeeUSD: economics.platformFee.platformFeeUSD,
      platformFeeTokenAmount: economics.platformFee.platformFeeTokenAmount,
      netSettlementUSD: economics.merchantSettlement.netUSD,
      netSettlementTokenAmount: economics.merchantSettlement.netTokenAmount,
      // 3. VERSE Customer Rewards
      cashbackPercent: effectiveRewardPercent,
      verseEarned: economics.customerReward.rewardAmountVerse,
      verseUSDValue: economics.customerReward.rewardAmountUSD,
      rewardStatus: 'calculated',
      loyaltyPointsEarned: Math.round(data.amountUSD),
      description: data.description || 'IRISME Crypto Checkout',
      orderRef: data.orderRef?.trim() || undefined,
      customerName: data.customerName,
      status: 'awaiting_payment',
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };

    setPayments((prev) => [newPayment, ...prev]);
    ApiService.saveMerchantPayment(newPayment).catch(() => {});

    // Create Initial "Calculated" Accounting Reward Record
    const initialRewardRecord: VerseRewardRecord = {
      id: `rew-${newId}`,
      paymentId: newId,
      paymentInvoiceNumber: newInvoice,
      merchantId: merchantProfile.id,
      merchantName: merchantProfile.name || (merchantType === 'irisme_merchant' ? 'IrisMe Verified Merchant' : 'External Merchant'),
      merchantType,
      customerWallet: data.customerName ? `0xCust...${data.customerName.slice(0, 4)}` : '0x0000000000000000000000000000000000000000',
      rewardPercentage: effectiveRewardPercent,
      amountVerse: economics.customerReward.rewardAmountVerse,
      usdValue: economics.customerReward.rewardAmountUSD,
      status: 'calculated',
      timestamp: now.toISOString(),
      source: `Purchase #${newInvoice} (${effectiveRewardPercent}% ${merchantType === 'irisme_merchant' ? 'IrisMe' : 'External'} Cashback)`,
    };

    setCustomerRewards((prev) => [initialRewardRecord, ...prev]);

    return newPayment;
  };

  const processCustomerPayment = async (
    paymentId: string,
    token: SupportedToken,
    onStatusChange?: (status: PaymentStatus) => void
  ): Promise<{ success: boolean; txHash: string; verseEarned: number; isRealOnChain?: boolean }> => {
    const target = payments.find((p) => p.id === paymentId);
    if (!target) throw new Error('Payment request not found');

    const tokenInfo = SUPPORTED_TOKENS.find((t) => t.symbol === token) || SUPPORTED_TOKENS[0];
    const verseToken = SUPPORTED_TOKENS.find((t) => t.symbol === 'VERSE')!;
    const payerAddress = web3.address || wallet.address || '0x71C...9B42';
    const merchantType: MerchantCategoryType = target.merchantType || merchantProfile.merchantType || 'irisme_merchant';
    const effectiveRewardPercent =
      typeof target.cashbackPercent === 'number'
        ? target.cashbackPercent
        : getRewardRateForMerchantType(merchantType);

    const calculatedTokenAmount =
      token === 'VERSE'
        ? Math.round(target.amountUSD / verseToken.rateToUSD)
        : token === 'ETH' || token === 'WBTC'
        ? Number((target.amountUSD / tokenInfo.rateToUSD).toFixed(6))
        : Number((target.amountUSD / tokenInfo.rateToUSD).toFixed(2));

    // Check server-side campaign validation
    let multiplier = 1.0;
    let fixedBonus = 0;
    let appliedCampaignId = '';
    try {
      const valResult = await ApiService.validateCampaignEligibility({
        merchantId: target.merchantId || merchantProfile.id,
        customerWallet: payerAddress,
        paymentAmountUSD: target.amountUSD,
      });
      if (valResult.eligible && valResult.campaign) {
        appliedCampaignId = valResult.campaign.id;
        if (valResult.campaign.rewardType === 'percentage') {
          fixedBonus = (target.amountUSD * (valResult.campaign.rewardValue / 100)) / (verseToken.rateToUSD || 0.00038);
        } else {
          fixedBonus = valResult.campaign.rewardValue;
        }
      }
    } catch {
      // fallback to frontend campaign check if server unavailable
      const activeCampaign = campaigns.find((c) => c.status === 'active');
      if (activeCampaign) {
        if (activeCampaign.type === 'multiplier') {
          multiplier = activeCampaign.verseMultiplier || 1.0;
        } else if (activeCampaign.type === 'fixed_bonus') {
          fixedBonus = activeCampaign.fixedBonusVerse || 0;
        }
      }
    }

    const calc = RewardEngine.calculateCashback(target.amountUSD, effectiveRewardPercent, {
      versePriceUSD: verseToken.rateToUSD,
      campaignMultiplier: multiplier,
      fixedBonusVerse: Math.round(fixedBonus),
      merchantType,
    });

    const calculatedVerse = calc.rewardAmountVerse;
    let txHash = '';
    let isRealOnChain = false;
    let blockNumber = 19842200 + Math.floor(Math.random() * 500);

    // Check expiration before execution
    if (target.expiresAt && new Date() > new Date(target.expiresAt)) {
      updatePaymentStatus(paymentId, 'expired');
      onStatusChange?.('failed');
      throw new Error('Payment request has expired. Please ask the merchant to generate a new invoice.');
    }

    // 1. STAGE: TRANSACTION_DETECTED
    // If connected with real injected EVM wallet, execute real on-chain transaction
    if (web3.isConnected && web3.walletMode === 'injected' && web3.isAvailable) {
      onStatusChange?.('submitted');
      updatePaymentStatus(paymentId, 'submitted', {
        customerWallet: web3.address,
        selectedToken: token,
        tokenAmount: calculatedTokenAmount,
      });

      const onChainResult = await web3.executePaymentOnChain({
        merchantAddress: merchantProfile.settlementAddress || target.merchantAddress || '0x8F3a4e9b72cD4562098b584d4D9fB231f6C2A093',
        token,
        tokenAmount: calculatedTokenAmount,
        paymentId,
        onStatusUpdate: (status, hash) => {
          if (status === 'submitted') {
            onStatusChange?.('submitted');
            if (hash) updatePaymentStatus(paymentId, 'transaction_detected', { txHash: hash });
          } else if (status === 'confirming') {
            onStatusChange?.('confirming');
            if (hash) updatePaymentStatus(paymentId, 'verifying', { txHash: hash });
          } else if (status === 'failed') {
            onStatusChange?.('failed');
            updatePaymentStatus(paymentId, 'failed');
          }
        },
      });

      txHash = onChainResult.txHash;
      isRealOnChain = onChainResult.isRealOnChain;
      if (onChainResult.receipt?.blockNumber) {
        blockNumber = onChainResult.receipt.blockNumber;
      }
    } else {
      // Demo / Simulator Mode
      txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      onStatusChange?.('submitted');
      updatePaymentStatus(paymentId, 'transaction_detected', {
        customerWallet: payerAddress,
        selectedToken: token,
        tokenAmount: calculatedTokenAmount,
        txHash,
      });

      await new Promise((r) => setTimeout(r, 600));

      // 2. STAGE: VERIFYING
      onStatusChange?.('confirming');
      updatePaymentStatus(paymentId, 'verifying', { txHash });

      await new Promise((r) => setTimeout(r, 800));
    }

    const finalChainId = web3.chainId || target.chainId || 137;

    // 3. STAGE: INDEPENDENT BACKEND VERIFICATION
    // The fundamental rule: Transaction submission does NOT mean merchant has been paid.
    // The backend must independently verify all 8 parameters.
    const verification = await ApiService.verifyPayment({
      paymentId,
      txHash,
      chainId: finalChainId,
      payerAddress,
      tokenSymbol: token,
      tokenAmount: calculatedTokenAmount,
      recipientAddress: merchantProfile.settlementAddress || target.merchantAddress || '0x8F3a4e9b72cD4562098b584d4D9fB231f6C2A093',
    });

    if (!verification.verified && !verification.success) {
      updatePaymentStatus(paymentId, 'failed', { txHash });
      onStatusChange?.('failed');
      throw new Error(
        verification.report?.errorMessage ||
          verification.error ||
          'Independent blockchain payment verification failed on backend.'
      );
    }

    const nowIso = new Date().toISOString();

    // Calculate final payment economics with selected token & chain
    const finalEconomics = EconomicService.getPaymentEconomics({
      amountUSD: target.amountUSD,
      tokenAmount: calculatedTokenAmount,
      tokenSymbol: token,
      chainId: finalChainId,
      settlementAddress: merchantProfile.settlementAddress || target.merchantAddress || '',
      merchantType,
      cashbackPercent: effectiveRewardPercent,
      campaignMultiplier: multiplier,
      fixedBonusVerse: Math.round(fixedBonus),
    });

    // Finalize payment state
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'confirmed',
              completedAt: nowIso,
              txHash,
              blockNumber,
              chainId: finalChainId,
              networkName: finalEconomics.gasEstimate.networkName,
              isRealOnChain,
              merchantType,
              customerWallet: payerAddress,
              selectedToken: token,
              tokenAmount: calculatedTokenAmount,
              // 1. Blockchain Network Fee
              gasEstimate: finalEconomics.gasEstimate,
              estimatedGasUSD: finalEconomics.gasEstimate.gasCostUSD,
              // 2. IrisMe Platform Fee & Net Settlement
              platformFeePercent: finalEconomics.platformFee.platformFeePercent,
              platformFeeUSD: finalEconomics.platformFee.platformFeeUSD,
              platformFeeTokenAmount: finalEconomics.platformFee.platformFeeTokenAmount,
              netSettlementUSD: finalEconomics.merchantSettlement.netUSD,
              netSettlementTokenAmount: finalEconomics.merchantSettlement.netTokenAmount,
              // 3. VERSE Customer Rewards
              verseEarned: calculatedVerse,
              verseUSDValue: calc.rewardAmountUSD,
              rewardStatus: 'claimable',
            }
          : p
      )
    );

    onStatusChange?.('confirmed');

    // Update or Create Reward Record: Move from 'calculated' to 'pending' / 'claimable'
    // Status is 'pending' / 'claimable' (NOT 'distributed' until actual reward distribution tx takes place)
    setCustomerRewards((prev) => {
      const existingIdx = prev.findIndex((r) => r.paymentId === target.id);
      const updatedReward: VerseRewardRecord = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `rew-${target.id}`,
        paymentId: target.id,
        paymentInvoiceNumber: target.invoiceNumber,
        merchantId: merchantProfile.id,
        merchantName: target.merchantName || merchantProfile.name || (merchantType === 'irisme_merchant' ? 'IrisMe Verified Merchant' : 'External Merchant'),
        merchantType,
        customerWallet: payerAddress,
        rewardPercentage: effectiveRewardPercent,
        amountVerse: calculatedVerse,
        usdValue: calc.rewardAmountUSD,
        timestamp: nowIso,
        status: 'claimable', // Reward is now confirmed on payment and ready to be claimed or distributed
        paymentTxHash: txHash,
        chainId: web3.chainId || 137,
        source: `Purchase #${target.invoiceNumber} (${multiplier > 1 ? `${multiplier}x ` : ''}${merchantType === 'irisme_merchant' ? 'IrisMe' : 'External'} Cashback)`,
      };

      if (existingIdx >= 0) {
        return prev.map((r, idx) => (idx === existingIdx ? updatedReward : r));
      }
      return [updatedReward, ...prev];
    });

    // Update Customer Loyalty Card / Stamps and Progress Metrics
    const goal = loyaltyGoal || DEFAULT_MERCHANT_LOYALTY_GOAL;
    const targetGoalPurchases = goal.targetPurchases || 5;

    setCustomerLoyaltyCards((prev) => {
      const existing = prev.find((c) => c.merchantId === target.merchantId);
      if (existing) {
        const newVisits = (existing.visitsCount || 0) + 1;
        const newPurchases = (existing.purchaseCount || 0) + 1;
        const newTotalSpent = (existing.totalSpentUSD || 0) + target.amountUSD;
        const newVerseEarned = (existing.verseEarned || 0) + calculatedVerse;
        const newStamps = (existing.stampsCount + 1) % (existing.maxStampsPerCard + 1);

        const currentProgress = newPurchases % targetGoalPurchases;
        const totalMilestones = Math.floor(newPurchases / targetGoalPurchases);
        const previouslyClaimed = (existing.claimedMilestones || 0);
        const unclaimedRewardsCount = Math.max(0, totalMilestones - previouslyClaimed);
        const rewardAvailable = unclaimedRewardsCount > 0;
        const remainingPurchases = targetGoalPurchases - currentProgress;
        const nextMilestone = rewardAvailable
          ? 'Milestone reward unlocked & ready to claim!'
          : `${remainingPurchases} more purchase${remainingPurchases === 1 ? '' : 's'} until ${goal.rewardValue} ${goal.rewardType === 'discount_percent' ? '%' : 'VERSE'} reward`;

        let newTier = DEFAULT_LOYALTY_TIERS[0];
        for (let i = DEFAULT_LOYALTY_TIERS.length - 1; i >= 0; i--) {
          if (newVisits >= DEFAULT_LOYALTY_TIERS[i].minVisits || newTotalSpent >= DEFAULT_LOYALTY_TIERS[i].minSpendUSD) {
            newTier = DEFAULT_LOYALTY_TIERS[i];
            break;
          }
        }

        return prev.map((c) =>
          c.merchantId === target.merchantId
            ? {
                ...c,
                visitsCount: newVisits,
                purchaseCount: newPurchases,
                totalSpentUSD: Number(newTotalSpent.toFixed(2)),
                verseEarned: newVerseEarned,
                loyaltyProgress: currentProgress,
                targetPurchases: targetGoalPurchases,
                rewardAvailable,
                unclaimedRewardsCount,
                rewardDescription: goal.rewardDescription,
                rewardType: goal.rewardType,
                rewardValue: goal.rewardValue,
                nextMilestone,
                stampsCount: newStamps === 0 ? 1 : newStamps,
                currentTier: newTier,
                lastVisitAt: nowIso,
              }
            : c
        );
      } else {
        const currentProgress = 1 % targetGoalPurchases;
        const totalMilestones = Math.floor(1 / targetGoalPurchases);
        const unclaimedRewardsCount = totalMilestones;
        const rewardAvailable = unclaimedRewardsCount > 0;
        const remainingPurchases = targetGoalPurchases - currentProgress;
        const nextMilestone = rewardAvailable
          ? 'Milestone reward unlocked & ready to claim!'
          : `${remainingPurchases} more purchase${remainingPurchases === 1 ? '' : 's'} until ${goal.rewardValue} ${goal.rewardType === 'discount_percent' ? '%' : 'VERSE'} reward`;

        const newCard: CustomerLoyaltyCard = {
          merchantId: target.merchantId || merchantProfile.id,
          merchantName: target.merchantName || merchantProfile.name,
          merchantCategory: merchantProfile.category || 'Retail & Dining',
          customerWallet: payerAddress,
          visitsCount: 1,
          purchaseCount: 1,
          totalSpentUSD: target.amountUSD,
          verseEarned: calculatedVerse,
          loyaltyProgress: currentProgress,
          targetPurchases: targetGoalPurchases,
          rewardAvailable,
          unclaimedRewardsCount,
          rewardDescription: goal.rewardDescription,
          rewardType: goal.rewardType,
          rewardValue: goal.rewardValue,
          nextMilestone,
          currentTier: DEFAULT_LOYALTY_TIERS[0],
          stampsCount: 1,
          maxStampsPerCard: 8,
          lastVisitAt: nowIso,
          joinedAt: nowIso,
          availableDiscountPercent: 0,
        };
        return [newCard, ...prev];
      }
    });

    // Record checkout with server-side API
    ApiService.recordPaymentCheckout({
      merchantId: target.merchantId || merchantProfile.id,
      customerWallet: payerAddress,
      amountUSD: target.amountUSD,
      verseEarned: calculatedVerse,
      campaignId: appliedCampaignId,
    });

    return {
      success: true,
      txHash,
      verseEarned: calculatedVerse,
      isRealOnChain,
    };
  };

  /**
   * Distribute a specific reward on-chain with verified txHash
   */
  const distributeReward = async (
    rewardId: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    const target = customerRewards.find((r) => r.id === rewardId);
    if (!target) {
      return { success: false, error: 'Reward record not found' };
    }

    if (target.status === 'distributed' || target.status === 'claimed') {
      return { success: true, txHash: target.distributionTxHash || target.claimTxHash };
    }

    const result = await RewardEngine.executeDistribution({
      reward: target,
      customerWalletOverride: web3.address || wallet.address,
    });

    if (result.success && result.distributionTxHash) {
      const nowIso = new Date().toISOString();

      // Update reward record to 'distributed'
      setCustomerRewards((prev) =>
        prev.map((r) =>
          r.id === rewardId
            ? {
                ...r,
                status: 'distributed',
                distributionTxHash: result.distributionTxHash,
                claimTxHash: result.distributionTxHash,
                blockNumber: result.blockNumber,
                isRealOnChain: result.isRealOnChain,
                distributedAt: nowIso,
              }
            : r
        )
      );

      // Deduct from merchant reward pool reserve
      setMerchantProfile((prev) => ({
        ...prev,
        verseRewardPoolBalance: Math.max(0, (prev.verseRewardPoolBalance || 0) - target.amountVerse),
      }));

      // Credit customer wallet balance
      setWallet((prev) => ({
        ...prev,
        balances: {
          ...prev.balances,
          VERSE: (prev.balances.VERSE || 0) + target.amountVerse,
        },
      }));

      return { success: true, txHash: result.distributionTxHash };
    } else {
      // Mark as failed with reason
      setCustomerRewards((prev) =>
        prev.map((r) =>
          r.id === rewardId
            ? {
                ...r,
                status: 'failed',
                failedReason: result.error || 'Distribution failed on blockchain',
              }
            : r
        )
      );
      return { success: false, error: result.error };
    }
  };

  /**
   * Batch distribute all pending/claimable rewards
   */
  const batchDistributeRewards = async (
    rewardIds?: string[]
  ): Promise<{ success: boolean; count: number; totalVerse: number; txHash?: string }> => {
    const targets = customerRewards.filter(
      (r) =>
        (r.status === 'pending' || r.status === 'claimable' || r.status === 'calculated') &&
        (!rewardIds || rewardIds.includes(r.id))
    );

    if (targets.length === 0) {
      return { success: false, count: 0, totalVerse: 0 };
    }

    let distributedCount = 0;
    let totalDistributedVerse = 0;
    let latestTx = '';

    for (const reward of targets) {
      const res = await distributeReward(reward.id);
      if (res.success) {
        distributedCount++;
        totalDistributedVerse += reward.amountVerse;
        if (res.txHash) latestTx = res.txHash;
      }
    }

    return {
      success: distributedCount > 0,
      count: distributedCount,
      totalVerse: totalDistributedVerse,
      txHash: latestTx,
    };
  };

  const claimCustomerRewards = async (
    rewardIds?: string[]
  ): Promise<{ success: boolean; claimedVerse: number; txHash: string }> => {
    const targets = customerRewards.filter((r) =>
      (r.status === 'claimable' || r.status === 'pending') && (!rewardIds || rewardIds.includes(r.id))
    );

    if (targets.length === 0) {
      return { success: false, claimedVerse: 0, txHash: '' };
    }

    const totalToClaim = targets.reduce((sum, r) => sum + r.amountVerse, 0);
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const nowIso = new Date().toISOString();

    // Mark as distributed/claimed
    setCustomerRewards((prev) =>
      prev.map((r) =>
        targets.some((t) => t.id === r.id)
          ? {
              ...r,
              status: 'distributed',
              distributionTxHash: txHash,
              claimTxHash: txHash,
              distributedAt: nowIso,
            }
          : r
      )
    );

    // Deduct from merchant reserve pool
    setMerchantProfile((prev) => ({
      ...prev,
      verseRewardPoolBalance: Math.max(0, (prev.verseRewardPoolBalance || 0) - totalToClaim),
    }));

    // Increase customer wallet VERSE balance
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        VERSE: (prev.balances.VERSE || 0) + totalToClaim,
      },
    }));

    return {
      success: true,
      claimedVerse: totalToClaim,
      txHash,
    };
  };

  const updateLoyaltyGoal = async (goalUpdates: Partial<MerchantLoyaltyGoal>) => {
    const updated: MerchantLoyaltyGoal = {
      ...loyaltyGoal,
      ...goalUpdates,
    };
    setLoyaltyGoal(updated);
    setMerchantProfile((prev) => ({
      ...prev,
      loyaltyGoal: updated,
    }));
    await ApiService.updateMerchantLoyaltyGoal(merchantProfile.id, updated);
  };

  const claimLoyaltyMilestone = async (
    targetMerchantId: string = merchantProfile.id
  ): Promise<{ success: boolean; rewardVerse?: number; message?: string }> => {
    const customerWallet = web3.address || wallet.address;
    if (!customerWallet) {
      return { success: false, message: 'No wallet connected' };
    }

    const card = customerLoyaltyCards.find((c) => c.merchantId === targetMerchantId);
    const goal = loyaltyGoal;
    const target = goal.targetPurchases || 5;

    // Server-side claim
    const serverResult = await ApiService.claimLoyaltyMilestone({
      merchantId: targetMerchantId,
      customerWallet,
    });

    const rewardVerse = goal.rewardType === 'fixed_verse' ? goal.rewardValue : 250;

    // Credit user's wallet
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        VERSE: (prev.balances.VERSE || 0) + rewardVerse,
      },
    }));

    // Update loyalty card state
    setCustomerLoyaltyCards((prev) =>
      prev.map((c) => {
        if (c.merchantId === targetMerchantId) {
          const newClaimedCount = (c.unclaimedRewardsCount || 1) - 1;
          const remainingPurchases = target - ((c.purchaseCount || 0) % target);
          return {
            ...c,
            rewardAvailable: newClaimedCount > 0,
            unclaimedRewardsCount: Math.max(0, newClaimedCount),
            nextMilestone:
              newClaimedCount > 0
                ? 'Additional milestone reward unlocked & ready to claim!'
                : `${remainingPurchases} more purchase${remainingPurchases === 1 ? '' : 's'} until ${goal.rewardValue} ${goal.rewardType === 'discount_percent' ? '%' : 'VERSE'} reward`,
          };
        }
        return c;
      })
    );

    // Create a loyalty milestone reward record
    const loyaltyRewardRecord: VerseRewardRecord = {
      id: `rew-milestone-${Date.now()}`,
      paymentId: `loyalty-${Date.now()}`,
      paymentInvoiceNumber: `LOYALTY-${targetMerchantId.slice(0, 6).toUpperCase()}`,
      merchantId: targetMerchantId,
      merchantName: card?.merchantName || merchantProfile.name || 'Store Loyalty',
      customerWallet,
      rewardPercentage: 100,
      amountVerse: rewardVerse,
      usdValue: rewardVerse * 0.00038,
      status: 'distributed',
      timestamp: new Date().toISOString(),
      distributedAt: new Date().toISOString(),
      source: `Loyalty Goal Reward: ${goal.rewardDescription}`,
    };
    setCustomerRewards((prev) => [loyaltyRewardRecord, ...prev]);

    return {
      success: true,
      rewardVerse,
      message: serverResult.message || `Successfully claimed ${rewardVerse} VERSE loyalty reward!`,
    };
  };

  const toggleCampaignStatus = async (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: c.status === 'active' ? 'ended' : 'active',
            }
          : c
      )
    );
    await ApiService.toggleCampaign(id);
  };

  const createCampaign = async (data: Omit<RewardCampaign, 'id' | 'spentVerse' | 'participatingCustomers'>) => {
    const newCamp: RewardCampaign = {
      ...data,
      id: `camp-${Date.now()}`,
      spentVerse: 0,
      participatingCustomers: 0,
      merchantId: merchantProfile.id,
      currentParticipants: 0,
      participantWallets: [],
    };
    setCampaigns((prev) => [newCamp, ...prev]);
    await ApiService.createCampaign({
      ...newCamp,
      name: data.title || (data as any).name,
      description: data.tagline || data.description,
    });
  };

  const resetToDefaults = () => {
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_wallet`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_role`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_merchant`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_customer`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_payments`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_campaigns`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_loyalty_cards`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_rewards`);

    setMerchantProfile(INITIAL_MERCHANT_PROFILE);
    setCustomerProfile(INITIAL_CUSTOMER_PROFILE);
    setPayments(INITIAL_PAYMENTS);
    setCampaigns(INITIAL_CAMPAIGNS);
    setCustomerLoyaltyCards(INITIAL_CUSTOMER_LOYALTY_CARDS);
    setCustomerRewards(INITIAL_CUSTOMER_REWARDS);
  };

  return (
    <AppContext.Provider
      value={{
        wallet,
        isWalletModalOpen,
        setIsWalletModalOpen,
        connectWallet,
        disconnectWallet,
        switchRole,
        switchNetwork,
        merchantProfile,
        merchantAuthToken,
        isMerchantAuthenticated,
        loginMerchant,
        registerMerchant,
        logoutMerchant,
        rotateMerchantApiKey,
        updateMerchantProfile,
        updateRewardPercentage,
        completeOnboarding,
        customerProfile,
        updateCustomerProfile,
        completeCustomerOnboarding,
        payments,
        createPayment,
        updatePaymentStatus,
        getPaymentById,
        requestRefund,
        executeRefund,
        rejectRefund,
        settlements,
        merchantBalance,
        refreshSettlementBalance,
        withdrawSettlement,
        loyaltyTiers,
        loyaltyGoal,
        updateLoyaltyGoal,
        campaigns,
        toggleCampaignStatus,
        createCampaign,
        notifications,
        unreadNotificationCount,
        addInAppNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        dispatchSecondaryEmail,
        customerLoyaltyCards,
        customerRewards,
        merchantRewards: customerRewards,
        distributeReward,
        batchDistributeRewards,
        claimCustomerRewards,
        claimLoyaltyMilestone,
        processCustomerPayment,
        isTutorialOpen,
        tutorialTab,
        openTutorial,
        closeTutorial,
        isGuidedTourActive,
        guidedTourType,
        startGuidedTour,
        stopGuidedTour,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
