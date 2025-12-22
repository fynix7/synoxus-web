import React, { useState } from 'react';
import Layout from './components/Layout';
import Hero from './components/Hero';
import RevenueCalculator from './components/RevenueCalculator';
import PackagingSection from './components/PackagingSection';
import ServiceNotifications from './components/ServiceNotifications';
import InternalPortal from './components/InternalPortal';
import Footer from './components/Footer';

function App() {
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [portalInitialView, setPortalInitialView] = useState('menu');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState('default'); // 'default' | 'qualification'

  React.useEffect(() => {
    const path = window.location.pathname;
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

  if (isPortalOpen) {
    return <InternalPortal initialView={portalInitialView} onExit={() => {
      setIsPortalOpen(false);
      window.history.pushState({}, '', '/');
    }} />;
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
