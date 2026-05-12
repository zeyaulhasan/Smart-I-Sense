import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Zap, Droplets, Brain, Bell, Settings,
  PanelLeftClose, PanelLeftOpen, X, History
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/electricity', label: 'Electricity', icon: Zap },
  { path: '/water', label: 'Water', icon: Droplets },
  { path: '/analytics', label: 'Analytics', icon: History },
  { path: '/predictions', label: 'Predictions', icon: Brain },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const { isDark } = useTheme();

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen, setMobileMenuOpen]);

  const SidebarContent = (
    <motion.div 
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className={`border-r border-[var(--border-subtle)] bg-[var(--bg-card)] backdrop-blur-3xl flex flex-col shrink-0 h-full relative z-40 md:relative absolute shadow-[var(--shadow-glass)]`}
    >
      {/* Logo Area */}
      <div className="h-[72px] flex items-center px-5 border-b border-[var(--border-subtle)] shrink-0 gap-3 justify-between">
        <div className="flex items-center gap-3 group px-1">
          <div className="w-10 h-10 relative shrink-0">
            {/* Backdrop glow */}
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-lg group-hover:bg-cyan-400/30 transition-colors" />
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
              {/* Outer Hexagon */}
              <path d="M32 4L56 18V46L32 60L8 46V18L32 4Z" stroke="url(#sidebar_logo_grad_1)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {/* Inner interconnected lines */}
              <path d="M32 4V18 M8 18L20 25 M56 18L44 25 M8 46L20 39 M56 46L44 39 M32 60V46" stroke="url(#sidebar_logo_grad_1)" strokeWidth="1.5" strokeLinecap="round" />
              {/* Inner Solid Hexagon */}
              <path d="M32 18L44 25V39L32 46L20 39V25L32 18Z" fill="url(#sidebar_logo_grad_2)" className="animate-pulse" style={{ animationDuration: '3s' }} />
              {/* Digital Core */}
              <circle cx="32" cy="32" r="5" fill="#FFFFFF" className={isDark ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]"} />
              
              <defs>
                <linearGradient id="sidebar_logo_grad_1" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#22D3EE" />
                  <stop offset="1" stopColor="#3B82F6" />
                </linearGradient>
                <linearGradient id="sidebar_logo_grad_2" x1="20" y1="18" x2="44" y2="46" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0EA5E9" />
                  <stop offset="1" stopColor="#1E3A8A" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {!collapsed && (
            <motion.span 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="font-black text-[var(--text-primary)] tracking-tighter text-lg uppercase italic"
            >
              Smart-I-Sense
            </motion.span>
          )}
        </div>
        {/* Mobile Close Button */}
        <button 
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-4 flex flex-col gap-2 overflow-y-auto overflow-x-hidden relative">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `
              relative flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-300 text-sm font-semibold w-full group
              ${isActive 
                ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)] border border-cyan-500/30' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] border border-transparent'}
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? label : undefined}
          >
            <Icon size={20} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
            {!collapsed && <span className="truncate min-w-0">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Toggle */}
      <div className="hidden md:block p-4 border-t border-[var(--border-subtle)] shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-all shadow-sm border border-transparent hover:border-[var(--border-glass)]"
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full z-10">
        {SidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            />
            {/* Slide-out Menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-[260px] z-40 shadow-2xl"
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
