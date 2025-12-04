import React from 'react';
import Layout from './components/Layout';
import Hero from './components/Hero';
import RevenueCalculator from './components/RevenueCalculator';
import PackagingShowcase from './components/PackagingShowcase';
import Stats from './components/Stats';
import ServiceNotifications from './components/ServiceNotifications';

function App() {
  return (
    <Layout>
      <ServiceNotifications />
      <Hero />
      <RevenueCalculator />
      <PackagingShowcase />
      <Stats />
    </Layout>
  );
}

export default App;
