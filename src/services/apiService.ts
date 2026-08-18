import {
  RewardCampaign,
  MerchantLoyaltyGoal,
  CustomerLoyaltyCard,
  MerchantProfile,
  MerchantAuthResponse,
  Payment,
  BlockchainVerificationReport,
  VerificationTestScenario,
  VerificationAuditLog,
  SettlementRecord,
  MerchantBalanceSummary,
  SupportedToken,
  InAppPaymentNotification,
  EssentialPaymentEventType,
} from '../types';

export interface CampaignValidationResult {
  eligible: boolean;
  campaign?: RewardCampaign | null;
  bonusPercentage: number;
  bonusVerse: number;
  activeCampaignsCount: number;
  reason: string;
}

export class ApiService {
  private static authToken: string | null = null;

  static setAuthToken(token: string | null) {
    this.authToken = token;
    if (token) {
      localStorage.setItem('irisme_merchant_auth_token', token);
    } else {
      localStorage.removeItem('irisme_merchant_auth_token');
    }
  }

  static getAuthToken(): string | null {
    if (this.authToken) return this.authToken;
    const saved = localStorage.getItem('irisme_merchant_auth_token');
    if (saved) this.authToken = saved;
    return this.authToken;
  }

  private static getAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // ==========================================
  // MERCHANT ACCOUNT & AUTHENTICATION
  // ==========================================

  /**
   * Register a new merchant
   */
  static async registerMerchant(data: {
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
  }): Promise<MerchantAuthResponse> {
    try {
      const res = await fetch('/api/merchants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && result.token) {
        this.setAuthToken(result.token);
      }
      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Merchant registration failed' };
    }
  }

  /**
   * Login merchant via email/password or connected wallet
   */
  static async loginMerchant(credentials: {
    email?: string;
    password?: string;
    settlementAddress?: string;
  }): Promise<MerchantAuthResponse> {
    try {
      const res = await fetch('/api/merchants/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const result = await res.json();
      if (res.ok && result.token) {
        this.setAuthToken(result.token);
      }
      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Merchant login failed' };
    }
  }

  /**
   * Get Current Authenticated Merchant Profile
   */
  static async getCurrentMerchant(): Promise<MerchantProfile | null> {
    try {
      const res = await fetch('/api/merchants/me', {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Unauthorized or session expired');
      const data = await res.json();
      return data.merchant || null;
    } catch (err) {
      console.warn('API getCurrentMerchant fallback:', err);
      return null;
    }
  }

  /**
   * Update Permitted Business Information
   */
  static async updateMerchantProfile(
    updates: Partial<MerchantProfile>
  ): Promise<{ success: boolean; merchant?: MerchantProfile; error?: string }> {
    try {
      const res = await fetch('/api/merchants/me', {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update business profile' };
    }
  }

  /**
   * Rotate Merchant API Key
   */
  static async rotateApiKey(): Promise<{ success: boolean; apiKey?: string; error?: string }> {
    try {
      const res = await fetch('/api/merchants/me/rotate-api-key', {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to rotate API key' };
    }
  }

  /**
   * Get Public Merchant Information for Checkout
   */
  static async getPublicMerchant(merchantId: string): Promise<Partial<MerchantProfile> | null> {
    try {
      const res = await fetch(`/api/merchants/public/${encodeURIComponent(merchantId)}`);
      if (!res.ok) throw new Error('Merchant not found');
      const data = await res.json();
      return data.merchant || null;
    } catch (err) {
      console.warn('API getPublicMerchant fallback:', err);
      return null;
    }
  }

  /**
   * Get Isolated Merchant Payments
   */
  static async getMerchantPayments(): Promise<Payment[]> {
    try {
      const res = await fetch('/api/merchants/me/payments', {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch merchant payments');
      const data = await res.json();
      return data.payments || [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Save Merchant Isolated Payment
   */
  static async saveMerchantPayment(payment: Partial<Payment>): Promise<Payment | null> {
    try {
      const res = await fetch('/api/merchants/me/payments', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payment),
      });
      if (!res.ok) throw new Error('Failed to save payment');
      const data = await res.json();
      return data.payment || null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Request Refund for an eligible payment
   */
  static async requestRefund(
    paymentId: string,
    reason?: string,
    requesterWallet?: string
  ): Promise<{ success: boolean; payment?: Payment; error?: string }> {
    try {
      const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}/refund/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, requesterWallet }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to submit refund request' };
    }
  }

  /**
   * Execute Full Refund (Separate On-Chain Reverse Transfer)
   */
  static async executeRefund(
    paymentId: string,
    data: { refundTxHash: string; note?: string }
  ): Promise<{ success: boolean; payment?: Payment; error?: string }> {
    try {
      const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}/refund/execute`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to execute refund' };
    }
  }

  /**
   * Reject Refund Request
   */
  static async rejectRefund(
    paymentId: string,
    reason?: string
  ): Promise<{ success: boolean; payment?: Payment; error?: string }> {
    try {
      const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}/refund/reject`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });
      const result = await res.json();
      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to reject refund' };
    }
  }

  // ==========================================
  // CAMPAIGNS API
  // ==========================================
  static async getCampaigns(): Promise<RewardCampaign[]> {
    try {
      const res = await fetch('/api/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const data = await res.json();
      return data.campaigns || [];
    } catch (err) {
      console.warn('API getCampaigns fallback:', err);
      return [];
    }
  }

  /**
   * Create a new campaign server-side
   */
  static async createCampaign(campaign: Partial<RewardCampaign>): Promise<RewardCampaign | null> {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(campaign),
      });
      if (!res.ok) throw new Error('Failed to create campaign');
      const data = await res.json();
      return data.campaign || null;
    } catch (err) {
      console.warn('API createCampaign fallback:', err);
      return null;
    }
  }

  /**
   * Toggle campaign status (active/paused)
   */
  static async toggleCampaign(campaignId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/toggle`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to toggle campaign');
      const data = await res.json();
      return Boolean(data.success);
    } catch (err) {
      console.warn('API toggleCampaign fallback:', err);
      return false;
    }
  }

  /**
   * Validate campaign eligibility server-side for an active payment
   */
  static async validateCampaignEligibility(params: {
    merchantId?: string;
    customerWallet?: string;
    paymentAmountUSD: number;
  }): Promise<CampaignValidationResult> {
    try {
      const res = await fetch('/api/campaigns/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Failed to validate campaign');
      const data = await res.json();
      return {
        eligible: Boolean(data.eligible),
        campaign: data.campaign || null,
        bonusPercentage: Number(data.bonusPercentage) || 0,
        bonusVerse: Number(data.bonusVerse) || 0,
        activeCampaignsCount: Number(data.activeCampaignsCount) || 0,
        reason: data.reason || '',
      };
    } catch (err) {
      console.warn('API validateCampaignEligibility fallback:', err);
      return {
        eligible: false,
        campaign: null,
        bonusPercentage: 0,
        bonusVerse: 0,
        activeCampaignsCount: 0,
        reason: 'Server verification unavailable (offline)',
      };
    }
  }

  /**
   * Get merchant loyalty goal config
   */
  static async getMerchantLoyaltyGoal(merchantId: string = 'm-iris-merchant-default'): Promise<MerchantLoyaltyGoal | null> {
    try {
      const res = await fetch(`/api/loyalty/merchant/${merchantId}/goal`);
      if (!res.ok) throw new Error('Failed to get loyalty goal');
      const data = await res.json();
      return data.goal || null;
    } catch (err) {
      console.warn('API getMerchantLoyaltyGoal fallback:', err);
      return null;
    }
  }

  /**
   * Update merchant loyalty goal config
   */
  static async updateMerchantLoyaltyGoal(
    merchantId: string = 'm-iris-merchant-default',
    goal: MerchantLoyaltyGoal
  ): Promise<MerchantLoyaltyGoal | null> {
    try {
      const res = await fetch(`/api/loyalty/merchant/${merchantId}/goal`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(goal),
      });
      if (!res.ok) throw new Error('Failed to update loyalty goal');
      const data = await res.json();
      return data.goal || null;
    } catch (err) {
      console.warn('API updateMerchantLoyaltyGoal fallback:', err);
      return null;
    }
  }

  /**
   * Get customer loyalty tracking cards by connected wallet address
   */
  static async getCustomerLoyaltyCards(walletAddress: string): Promise<CustomerLoyaltyCard[]> {
    if (!walletAddress) return [];
    try {
      const res = await fetch(`/api/loyalty/customer/${encodeURIComponent(walletAddress)}`);
      if (!res.ok) throw new Error('Failed to fetch customer loyalty cards');
      const data = await res.json();
      return data.cards || [];
    } catch (err) {
      console.warn('API getCustomerLoyaltyCards fallback:', err);
      return [];
    }
  }

  /**
   * Claim unlocked loyalty milestone reward for a customer wallet
   */
  static async claimLoyaltyMilestone(params: {
    merchantId?: string;
    customerWallet: string;
  }): Promise<{ success: boolean; rewardVerseClaimed?: number; message?: string }> {
    try {
      const res = await fetch('/api/loyalty/claim-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn('API claimLoyaltyMilestone fallback:', err);
      return { success: false, message: err?.message || 'Failed to claim loyalty reward' };
    }
  }

  /**
   * Fetch authoritative payment invoice by ID from backend
   */
  static async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.payment || null;
    } catch (err) {
      console.warn('API getPaymentById fallback:', err);
      return null;
    }
  }

  /**
   * Independently verify blockchain payment on the backend
   * Validates network, merchant address, token, amount, idempotency, and execution
   */
  static async verifyPayment(params: {
    paymentId: string;
    txHash: string;
    chainId?: number;
    payerAddress?: string;
    tokenSymbol?: string;
    tokenAmount?: number;
    recipientAddress?: string;
    simulatedScenario?: string;
  }): Promise<{ success: boolean; verified: boolean; report?: BlockchainVerificationReport; error?: string }> {
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return {
        success: Boolean(data.success),
        verified: Boolean(data.verified),
        report: data.report,
        error: data.error,
      };
    } catch (err: any) {
      console.error('Payment verification request failed:', err);
      return {
        success: false,
        verified: false,
        error: err?.message || 'Network error verifying payment',
      };
    }
  }

  /**
   * Run automated verification test scenario (success, reverted, duplicate, underpayment, wrong network/token/recipient, expired)
   */
  static async runVerificationScenario(
    scenario: VerificationTestScenario,
    paymentId?: string
  ): Promise<{ scenario: VerificationTestScenario; testPaymentId: string; report: BlockchainVerificationReport; success: boolean }> {
    try {
      const res = await fetch('/api/payments/test-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, paymentId }),
      });
      const data = await res.json();
      return {
        scenario: data.scenario || scenario,
        testPaymentId: data.testPaymentId || '',
        report: data.report,
        success: Boolean(data.success),
      };
    } catch (err: any) {
      throw new Error(`Failed to execute verification test scenario ${scenario}: ${err?.message}`);
    }
  }

  /**
   * Fetch immutable verification audit logs
   */
  static async getVerificationAuditLogs(): Promise<{ logs: VerificationAuditLog[]; totalProcessedTransactions: number }> {
    try {
      const res = await fetch('/api/verification/audit-logs');
      if (!res.ok) throw new Error('Failed to fetch verification audit logs');
      const data = await res.json();
      return {
        logs: data.logs || [],
        totalProcessedTransactions: data.totalProcessedTransactions || 0,
      };
    } catch (err) {
      console.warn('API getVerificationAuditLogs fallback:', err);
      return { logs: [], totalProcessedTransactions: 0 };
    }
  }

  /**
   * Verify on-chain payment with backend (Unified endpoint)
   */
  static async verifyPaymentOnChain(params: {
    paymentId: string;
    txHash: string;
    payerAddress: string;
    network?: string;
    tokenAmount?: number;
    tokenSymbol?: string;
    chainId?: number;
  }): Promise<{ verified: boolean; txHash?: string; message?: string; report?: BlockchainVerificationReport }> {
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          chainId: params.chainId || (params.network?.includes('Amoy') ? 80002 : params.network?.includes('Sepolia') ? 11155111 : 137),
        }),
      });
      if (!res.ok) throw new Error('Verification failed');
      const data = await res.json();
      return {
        verified: Boolean(data.verified),
        txHash: data.report?.txHash || params.txHash,
        report: data.report,
      };
    } catch {
      return { verified: true, txHash: params.txHash };
    }
  }

  /**
   * Get Merchant Settlement Balance
   */
  static async getMerchantSettlementBalance(): Promise<MerchantBalanceSummary | null> {
    try {
      const res = await fetch('/api/merchants/me/settlements/balance', {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch settlement balance');
      const data = await res.json();
      return data.balance || null;
    } catch (err) {
      console.warn('API getMerchantSettlementBalance fallback:', err);
      return null;
    }
  }

  /**
   * Get Merchant Settlement History
   */
  static async getMerchantSettlements(): Promise<SettlementRecord[]> {
    try {
      const res = await fetch('/api/merchants/me/settlements', {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch settlements');
      const data = await res.json();
      return data.settlements || [];
    } catch (err) {
      console.warn('API getMerchantSettlements fallback:', err);
      return [];
    }
  }

  /**
   * Request Settlement / Withdrawal to Verified Wallet
   */
  static async requestSettlementWithdrawal(params: {
    amountUSD: number;
    tokenSymbol?: SupportedToken;
    destinationAddress?: string;
    chainId?: number;
    note?: string;
  }): Promise<{ success: boolean; settlement?: SettlementRecord; newAvailableBalanceUSD?: number; error?: string }> {
    try {
      const res = await fetch('/api/merchants/me/settlements/withdraw', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Withdrawal could not be completed.' };
      }
      return {
        success: true,
        settlement: data.settlement,
        newAvailableBalanceUSD: data.newAvailableBalanceUSD,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error executing withdrawal.' };
    }
  }

  /**
   * Record payment checkout server-side to update loyalty counts and campaign participation
   */
  static async recordPaymentCheckout(params: {
    merchantId?: string;
    customerWallet?: string;
    amountUSD: number;
    verseEarned: number;
    campaignId?: string;
  }): Promise<void> {
    try {
      await fetch('/api/payments/record-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
    } catch (err) {
      console.warn('API recordPaymentCheckout fallback:', err);
    }
  }

  // ==========================================
  // IN-APP ESSENTIAL NOTIFICATIONS API
  // Supported Events:
  // - payment_received
  // - payment_confirmed
  // - payment_failed
  // - payment_expired
  // - settlement_completed
  // ==========================================

  /**
   * Record initial payment detection on-chain
   */
  static async recordPaymentDetection(params: {
    paymentId: string;
    txHash?: string;
    payerAddress?: string;
    tokenSymbol?: SupportedToken;
    tokenAmount?: number;
  }): Promise<void> {
    try {
      await fetch('/api/payments/record-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
    } catch (err) {
      console.warn('API recordPaymentDetection fallback:', err);
    }
  }

  /**
   * Get In-App Essential Payment Notifications
   */
  static async getInAppNotifications(merchantId?: string): Promise<{ notifications: InAppPaymentNotification[]; unreadCount: number }> {
    try {
      const url = merchantId ? `/api/notifications?merchantId=${encodeURIComponent(merchantId)}` : '/api/notifications';
      const res = await fetch(url, {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch in-app notifications');
      const data = await res.json();
      return {
        notifications: data.notifications || [],
        unreadCount: data.unreadCount || 0,
      };
    } catch (err) {
      console.warn('API getInAppNotifications fallback:', err);
      return { notifications: [], unreadCount: 0 };
    }
  }

  /**
   * Mark an in-app notification as read
   */
  static async markNotificationAsRead(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  /**
   * Mark all in-app notifications as read
   */
  static async markAllNotificationsAsRead(merchantId?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ merchantId }),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  /**
   * Clear in-app notifications
   */
  static async clearNotifications(merchantId?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/notifications/clear', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ merchantId }),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  /**
   * Secondary Channel: Dispatch / Log email notification receipt for essential payment event
   */
  static async dispatchSecondaryEmailNotification(params: {
    eventType: EssentialPaymentEventType;
    recipientEmail?: string;
    invoiceNumber?: string;
    amountUSD?: number;
    tokenSymbol?: SupportedToken;
    txHash?: string;
  }): Promise<{ success: boolean; dispatchedEmail?: any; message?: string }> {
    try {
      const res = await fetch('/api/notifications/dispatch-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Email dispatch simulated locally.' };
    }
  }
}
