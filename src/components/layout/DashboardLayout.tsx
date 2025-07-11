'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSidebar } from './DashboardSidebar';
import { Menu, X, ArrowUp } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  activeSection: string;
  onLogoutClick: () => void;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  sidebarComponent?: React.ComponentType<SidebarProps> | ((props: SidebarProps) => React.ReactElement);
  onLogout?: () => void;
}

const SIDEBAR_WIDTH = 320;
const SIDEBAR_COLLAPSED_WIDTH = 80;

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeSection = 'overview',
  onSectionChange,
  sidebarComponent: SidebarComponent = DashboardSidebar,
  onLogout
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      // Auto-open sidebar on desktop
      if (width >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuClick = (section: string) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
    // Auto-close sidebar on mobile after selection
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior - redirect to login
      window.location.href = '/auth/login';
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate main content styles based on screen size and sidebar state
  const getMainContentStyles = () => {
    if (isMobile) {
      return {
        marginLeft: 0,
        width: '100%',
      };
    }
    
    if (isTablet) {
      return {
        marginLeft: sidebarOpen ? SIDEBAR_COLLAPSED_WIDTH : 0,
        width: sidebarOpen ? `calc(100% - ${SIDEBAR_COLLAPSED_WIDTH}px)` : '100%',
      };
    }
    
    return {
      marginLeft: sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
      width: sidebarOpen ? `calc(100% - ${SIDEBAR_WIDTH}px)` : `calc(100% - ${SIDEBAR_COLLAPSED_WIDTH}px)`,
    };
  };

  const mainContentStyles = getMainContentStyles();

  const sidebarProps: SidebarProps = {
    open: isMobile ? true : sidebarOpen,
    onToggle: handleSidebarToggle,
    onMenuClick: handleMenuClick,
    activeSection: activeSection,
    onLogoutClick: handleLogout,
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-sky-50/50 via-white to-celestial-50/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid opacity-30"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-sky-400/20 to-celestial-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-celestial-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Mobile Header */}
      {isMobile && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <motion.button
                    onClick={handleSidebarToggle}
                    className="relative overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-celestial-600 rounded-2xl flex items-center justify-center shadow-lg">
                      {sidebarOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
                    </div>
                  </motion.button>
                  
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 via-celestial-600 to-sky-700 bg-clip-text text-transparent">
                      Fidelya
                    </h1>
                    <p className="text-sm text-gray-600">Panel de Socio</p>
                  </div>
                </div>
                
                {/* Mobile Quick Actions */}
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={() => handleMenuClick('validar')}
                    className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => handleMenuClick('notificaciones')}
                    className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg relative"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    </svg>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">3</span>
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || !isMobile) && (
          <>
            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            {/* Sidebar Container */}
            <motion.div
              initial={isMobile ? { x: -SIDEBAR_WIDTH } : false}
              animate={isMobile ? { x: 0 } : false}
              exit={isMobile ? { x: -SIDEBAR_WIDTH } : undefined}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`
                ${isMobile ? 'fixed' : 'fixed'} 
                top-0 left-0 h-full z-50
                transition-all duration-300 ease-in-out
              `}
              style={{
                width: isMobile ? 320 : sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH
              }}
            >
              <div className="h-full bg-white/90 backdrop-blur-xl border-r border-white/20 shadow-2xl">
                {React.createElement(SidebarComponent, sidebarProps)}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <motion.main
        className="flex-1 relative z-10 min-h-screen"
        style={mainContentStyles}
        animate={mainContentStyles}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Content Container */}
        <div className={`
          h-full overflow-auto
          ${isMobile ? 'pt-20' : 'pt-0'}
        `}>
          {/* Scrollable Content */}
          <div className="min-h-full">
            {children}
          </div>
        </div>
      </motion.main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-40">
        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0, y: 20 }}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToTop}
              className="w-14 h-14 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group"
            >
              <ArrowUp className="w-6 h-6 text-gray-600 group-hover:text-sky-600 transition-colors" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Quick QR Scanner (Mobile) */}
        {isMobile && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleMenuClick('validar')}
            className="w-14 h-14 bg-gradient-to-br from-sky-500 to-celestial-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Responsive Breakpoint Indicator (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-4 left-4 z-50 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-xl border border-white/20"
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isMobile ? 'bg-red-400' : isTablet ? 'bg-yellow-400' : 'bg-green-400'
            }`}></div>
            <span>{isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</span>
          </div>
        </motion.div>
      )}

      {/* Loading Overlay (if needed) */}
      <AnimatePresence>
        {/* You can add a loading state here if needed */}
      </AnimatePresence>
    </div>
  );
};