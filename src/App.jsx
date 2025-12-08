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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState('default'); // 'default' | 'qualification'

  React.useEffect(() => {
    if (window.location.pathname === '/portal') {
      setIsPortalOpen(true);
    }
  }, []);

  if (isPortalOpen) {
    return <InternalPortal onExit={() => {
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
