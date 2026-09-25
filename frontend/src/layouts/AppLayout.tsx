import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar.js';
import { Navbar } from '../components/Navbar.js';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Dashboard Overview';
      case '/generate': return 'AI Content Generator';
      case '/history': return 'Content History & Archive';
      case '/api-keys': return 'API Keys & Developer Access';
      case '/usage': return 'Usage Metrics & Observability';
      case '/profiles': return 'Business Profiles';
      case '/docs': return 'Developer API Documentation';
      case '/admin': return 'Administrative Control Center';
      default: return 'DXGen Studio';
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar onToggleMobile={() => setMobileOpen(true)} title={getPageTitle(location.pathname)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
