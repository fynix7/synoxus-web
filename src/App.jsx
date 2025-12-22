import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Hero from './components/Hero';
import RevenueCalculator from './components/RevenueCalculator';
import PackagingSection from './components/PackagingSection';
import ServiceNotifications from './components/ServiceNotifications';
import InternalPortal from './components/InternalPortal';
import Footer from './components/Footer';

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

function App() {
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [portalInitialView, setPortalInitialView] = useState('menu');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState('default');
  const [siteSettings, setSiteSettings] = useState(getSiteSettings);

  useEffect(() => {
    const path = window.location.pathname;
    const settings = getSiteSettings();

    // If landing page is disabled and we're at root, redirect to portal
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
      setPortalInitialView('landing_page');
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
  }, []);

  // Handler to update site settings from portal
  const handleUpdateSiteSettings = (newSettings) => {
    setSiteSettings(newSettings);
    saveSiteSettings(newSettings);
  };

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
      />
    );
  }

  const handleOpenChat = (mode = 'default') => {
    setChatMode(mode);
    setIsChatOpen(true);
  };

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

export default App;
