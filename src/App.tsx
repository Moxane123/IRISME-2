import React from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { Web3Provider } from './context/Web3Context';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/ui/Navbar';
import { Sidebar } from './components/ui/Sidebar';
import { MobileNav } from './components/ui/MobileNav';
import { WalletModal } from './components/ui/WalletModal';
import { WrongNetworkBanner } from './components/ui/WrongNetworkBanner';

// Views
import { LandingPage } from './views/LandingPage';
import { MerchantDashboard } from './views/merchant/MerchantDashboard';
import { MerchantAuthPage } from './views/merchant/MerchantAuthPage';
import { MerchantOnboarding } from './views/merchant/MerchantOnboarding';
import { MerchantPayments } from './views/merchant/MerchantPayments';
import { CreatePayment } from './views/merchant/CreatePayment';
import { MerchantRewards } from './views/merchant/MerchantRewards';
import { MerchantLoyalty } from './views/merchant/MerchantLoyalty';
import { MerchantCampaigns } from './views/merchant/MerchantCampaigns';
import { CustomerPaymentPage } from './views/customer/CustomerPaymentPage';
import { CustomerDashboard } from './views/customer/CustomerDashboard';
import { CustomerRewards } from './views/customer/CustomerRewards';
import { CustomerLoyalty } from './views/customer/CustomerLoyalty';
import { CustomerOnboarding } from './views/customer/CustomerOnboarding';
import { TransferPage } from './views/transfer/TransferPage';
import { SettingsPage } from './views/SettingsPage';

const AppContent: React.FC = () => {
  const { currentPath } = useRouter();
  const { wallet } = useApp();

  const isMerchantRoute = currentPath.startsWith('/merchant');
  const isCustomerRoute = currentPath.startsWith('/customer');
  const isPayRoute = currentPath.startsWith('/pay');
  const isTransferRoute = currentPath === '/transfer';
  const isLandingRoute = currentPath === '/';

  // Determine active layout mode
  const sidebarMode: 'merchant' | 'customer' = isCustomerRoute ? 'customer' : 'merchant';

  const renderCurrentView = () => {
    // 1. Landing
    if (isLandingRoute) {
      return <LandingPage />;
    }

    // 2. Customer Payment Checkout (/pay/:paymentId)
    if (isPayRoute) {
      return <CustomerPaymentPage />;
    }

    // 3. Multi-Chain Transfer Page (/transfer)
    if (isTransferRoute) {
      return <TransferPage />;
    }

    // 4. Merchant Routes
    if (currentPath === '/merchant/login') {
      return <MerchantAuthPage defaultMode="login" />;
    }
    if (currentPath === '/merchant/register') {
      return <MerchantAuthPage defaultMode="register" />;
    }
    if (currentPath === '/merchant/onboarding') {
      return <MerchantOnboarding />;
    }
    if (currentPath === '/merchant') {
      return <MerchantDashboard />;
    }
    if (currentPath === '/merchant/payments') {
      return <MerchantPayments />;
    }
    if (currentPath === '/merchant/create-payment') {
      return <CreatePayment />;
    }
    if (currentPath === '/merchant/rewards') {
      return <MerchantRewards />;
    }
    if (currentPath === '/merchant/loyalty') {
      return <MerchantLoyalty />;
    }
    if (currentPath === '/merchant/campaigns') {
      return <MerchantCampaigns />;
    }

    // 5. Customer Routes
    if (currentPath === '/customer/onboarding') {
      return <CustomerOnboarding />;
    }
    if (currentPath === '/customer') {
      return <CustomerDashboard />;
    }
    if (currentPath === '/customer/rewards') {
      return <CustomerRewards />;
    }
    if (currentPath === '/customer/loyalty') {
      return <CustomerLoyalty />;
    }

    // 6. Settings
    if (currentPath === '/settings') {
      return <SettingsPage />;
    }

    // Fallback
    return <LandingPage />;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#7C3AED]/20 selection:text-slate-900">
      {/* Top Navbar */}
      <Navbar />

      {/* Wrong Network Warning Banner */}
      <WrongNetworkBanner />

      {/* Main Layout Container */}
      <div className="flex-1 flex w-full">
        {/* Sidebar on App Pages (Merchant & Customer), hidden on Landing and Dedicated Checkout */}
        {!isLandingRoute && !isPayRoute && <Sidebar mode={sidebarMode} />}

        {/* View Content Area */}
        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full ${
            !isLandingRoute && !isPayRoute ? 'pb-24 md:pb-8' : ''
          }`}
        >
          {renderCurrentView()}
        </main>
      </div>

      {/* Bottom Navigation on Mobile */}
      <MobileNav />

      {/* Web3 Wallet Modal */}
      <WalletModal />
    </div>
  );
};

export default function App() {
  return (
    <RouterProvider>
      <Web3Provider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </Web3Provider>
    </RouterProvider>
  );
}

