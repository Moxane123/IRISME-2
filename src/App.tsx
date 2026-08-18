import React from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { Web3Provider } from './context/Web3Context';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/ui/Navbar';
import { Sidebar } from './components/ui/Sidebar';
import { MobileNav } from './components/ui/MobileNav';
import { WalletModal } from './components/ui/WalletModal';
import { WrongNetworkBanner } from './components/ui/WrongNetworkBanner';
import { InteractiveTutorialModal } from './components/tutorial/InteractiveTutorialModal';
import { GuidedTourEngine } from './components/tutorial/GuidedTourEngine';

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
import { TransferPage } from './views/transfer/TransferPage';
import { SettingsPage } from './views/SettingsPage';

const AppContent: React.FC = () => {
  const { currentPath } = useRouter();
  const {
    isTutorialOpen,
    tutorialTab,
    closeTutorial,
    isGuidedTourActive,
    guidedTourType,
    stopGuidedTour,
  } = useApp();

  const isPayRoute = currentPath.startsWith('/pay');
  const isTransferRoute = currentPath === '/transfer';
  const isLandingRoute = currentPath === '/';

  const renderCurrentView = () => {
    // 1. Landing Page
    if (isLandingRoute) {
      return <LandingPage />;
    }

    // 2. Customer Payment Checkout (/pay/:paymentId) - No sign up required, instant wallet connect & pay
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

    // 5. Settings
    if (currentPath === '/settings') {
      return <SettingsPage />;
    }

    // Fallback: Default to landing page or merchant overview
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
        {/* Sidebar on App Pages, hidden on Landing and Dedicated Checkout */}
        {!isLandingRoute && !isPayRoute && <Sidebar />}

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

      {/* Global Interactive Tutorial & Live Sandbox Demo */}
      <InteractiveTutorialModal
        isOpen={isTutorialOpen}
        onClose={closeTutorial}
        defaultTab={tutorialTab}
      />

      {/* Real-Time Guided Walkthrough with Animated Directional Pointer Hand */}
      <GuidedTourEngine
        isActive={isGuidedTourActive}
        tourType={guidedTourType}
        onClose={stopGuidedTour}
      />
    </div>
  );
};

export function App() {
  return (
    <Web3Provider>
      <AppProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </AppProvider>
    </Web3Provider>
  );
}

export default App;
