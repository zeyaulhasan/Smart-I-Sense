import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ConnectionBanner from '../ui/ConnectionBanner';

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-transparent text-[var(--text-primary)] font-sans selection:bg-[var(--border-focus)]">
      {/* Sidebar with mobile support */}
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent relative z-0">
        <Header setMobileMenuOpen={setMobileMenuOpen} />
        <ConnectionBanner />
        
        {/* Scrollable Page Content */}
        <main id="main-content" role="main" className="flex-1 overflow-auto p-4 md:p-5 lg:p-6 relative z-0">
          <div className="max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
