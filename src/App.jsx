import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Hero from './components/Hero';
import RevenueCalculator from './components/RevenueCalculator';
import PackagingSection from './components/PackagingSection';
import ServiceNotifications from './components/ServiceNotifications';
import InternalPortal from './components/InternalPortal';
import AuthPage from './components/AuthPage';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import Footer from './components/Footer';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Site settings key for localStorage
const SITE_SETTINGS_KEY = 'synoxus_site_settings';
const SETTINGS_PASSWORD = 'SNoxus123!';

// Get site settings from localStorage
const getSiteSettings = () => {
  try {
    const stored = localStorage.getItem(SITE_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading site settings:', e);
  }
  // Default: landing page disabled (redirects to portal)
  return { landingEnabled: false };
};

// Save site settings to localStorage
const saveSiteSettings = (settings) => {
  try {
    localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving site settings:', e);
  }
};

import SkoolTrackingSetup from './components/SkoolTrackingSetup';

// Main App Content (uses auth context)
function AppContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [portalInitialView, setPortalInitialView] = useState('menu');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState('default');
  const [siteSettings, setSiteSettings] = useState(getSiteSettings);



  useEffect(() => {
    const path = window.location.pathname;
    const settings = getSiteSettings();

    // If authenticated, check for public routes too (so logged in users can see them)
    if (path === '/s/x7k9p2m4-tracking') {
      // For logged in users, we can either show the standalone component or redirect to portal view
      // Let's show standalone for consistency with the link
      return;
    }

    // Only handle routing if authenticated
    if (!isAuthenticated && !loading) {
      return;
    }

    // If landing page is disabled and we're at root, go to portal
    if ((path === '/' || path === '') && !settings.landingEnabled) {
      setIsPortalOpen(true);
      setPortalInitialView('menu');
      window.history.replaceState({}, '', '/portal');
      return;
    }

    if (path === '/portal') {
      setIsPortalOpen(true);
      setPortalInitialView('menu');
    } else if (path === '/thumbnail-generator') {
      setIsPortalOpen(true);
      setPortalInitialView('packaging');
    } else if (path === '/note-taker') {
      setIsPortalOpen(true);
      setPortalInitialView('note_taker');
    } else if (path === '/short-form-scribe') {
      setIsPortalOpen(true);
      setPortalInitialView('short_form_scribe');
    } else if (path === '/chat-config') {
      setIsPortalOpen(true);
      setPortalInitialView('messaging');
    } else if (path === '/vsl') {
      setIsPortalOpen(true);
      setPortalInitialView('vsl');
    } else if (path === '/title-generator') {
      setIsPortalOpen(true);
      setPortalInitialView('title_generator');
    } else if (path === '/landing-page') {
      setIsPortalOpen(true);
      setPortalInitialView('landing_page_builder');
    } else if (path === '/masterclass') {
      setIsPortalOpen(true);
      setPortalInitialView('masterclass');
    } else if (path === '/outlier-scout') {
      setIsPortalOpen(true);
      setPortalInitialView('outlier_scout');
    } else if (path === '/skool-tracking') {
      setIsPortalOpen(true);
      setPortalInitialView('skool_tracking');
    }
  }, [isAuthenticated, loading]);

  // Handler to update site settings from portal
  const handleUpdateSiteSettings = (newSettings) => {
    setSiteSettings(newSettings);
    saveSiteSettings(newSettings);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080705] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="black">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </div>
          <p className="text-[#71717a] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Public routes - accessible without auth
  const path = window.location.pathname;

  // Complex slug for Skool Tracking Setup (publicly accessible)
  if (path === '/s/x7k9p2m4-tracking') {
    return <SkoolTrackingSetup />;
  }

  if (path === '/terms') {
    return <TermsPage />;
  }
  if (path === '/privacy') {
    return <PrivacyPage />;
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Show portal if open
  if (isPortalOpen) {
    return (
      <InternalPortal
        initialView={portalInitialView}
        onExit={() => {
          const settings = getSiteSettings();
          if (settings.landingEnabled) {
            setIsPortalOpen(false);
            window.history.pushState({}, '', '/');
          } else {
            // If landing is disabled, stay in portal
            window.history.pushState({}, '', '/portal');
          }
        }}
        siteSettings={siteSettings}
        onUpdateSiteSettings={handleUpdateSiteSettings}
        settingsPassword={SETTINGS_PASSWORD}
        user={user}
      />
    );
  }

  const handleOpenChat = (mode = 'default') => {
    setChatMode(mode);
    setIsChatOpen(true);
  };

  // Show landing page
  return (
    <Layout>
      <ServiceNotifications
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        mode={chatMode}
      />
      <Hero onOpenChat={handleOpenChat} />
      <RevenueCalculator />
      <PackagingSection />
      <Footer />
    </Layout>
  );
}

// App wrapper with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
