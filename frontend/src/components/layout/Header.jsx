import { Bell, Search, Menu, Sun, Moon, User, Mail, LogOut } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import UserProfileModal from './UserProfileModal';

export default function Header({ setMobileMenuOpen }) {
  const { isConnected } = useSocket();
  const { isDark, toggleTheme } = useTheme();
  const { userProfile } = useUser();
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [critCount, setCritCount] = useState(0);
  const [focused, setFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    api.get('/alerts?resolved=false').then(res => {
      setCritCount((res.data || []).filter(a => a.severity === 'critical').length);
    }).catch(()=>{});
  }, []);

  return (
    <header className="h-[72px] border-b border-[var(--border-subtle)] bg-[var(--bg-card)] backdrop-blur-2xl flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 sticky top-0 shadow-[var(--shadow-glass)]">
      
      {/* Mobile Hamburger & Search */}
      <div className="flex-1 flex items-center gap-3 min-w-0 pr-4 sm:pr-6">
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Menu size={24} />
        </button>

        <motion.div 
          animate={{ scale: focused ? 1.02 : 1, boxShadow: focused ? '0 0 20px rgba(34,211,238,0.2)' : 'none' }}
          className="hidden sm:flex items-center gap-3 max-w-sm w-full bg-[var(--bg-active)]/50 border border-[var(--border-glass)] rounded-xl px-4 py-2 focus-within:border-cyan-500/50 transition-all shadow-inner"
        >
          <Search size={18} className={`${focused ? 'text-cyan-400' : 'text-[var(--text-muted)]'} shrink-0 transition-colors duration-300`} />
          <input 
            type="text" 
            placeholder="Search dashboard..." 
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-full font-semibold tracking-tight"
          />
        </motion.div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        <div className="hidden sm:flex items-center gap-2.5 text-[10px] font-black tracking-widest text-[var(--text-secondary)] bg-[var(--bg-active)] border border-[var(--border-glass)] px-4 py-1.5 rounded-full shadow-inner">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'}`} />
          {isConnected ? 'SECURE_LIVE' : 'LINK_OFFLINE'}
        </div>

        <button 
          onClick={toggleTheme}
          className="p-2.5 text-[var(--text-secondary)] hover:bg-cyan-500/10 hover:text-cyan-400 rounded-xl transition-all hover:scale-110 active:scale-95"
          title="Toggle Theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="relative p-2.5 text-[var(--text-secondary)] hover:bg-cyan-500/10 hover:text-cyan-400 rounded-xl transition-all hover:scale-110 active:scale-95">
          <Bell size={20} />
          {critCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[var(--bg-card)] shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          )}
        </button>

        {/* User Profile Container */}
        <div className="relative hidden sm:block" ref={profileRef}>
          <div 
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 p-[1.5px] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          >
            <div className="w-full h-full rounded-full bg-[var(--bg-page)] flex items-center justify-center">
              <span className="text-[10px] font-black text-[var(--text-primary)] tracking-widest">
                {(authUser?.name || userProfile.name).substring(0, 2).toUpperCase()}
              </span>
            </div>
          </div>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-64 bg-[var(--bg-page)] border border-[var(--border-glass)] shadow-[0_8px_32px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-active)]/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                    <span className="text-[10px] font-black text-white tracking-widest">
                      {(authUser?.name || userProfile.name).substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-[var(--text-primary)] truncate">{authUser?.name || userProfile.name}</span>
                    <span className="text-[10px] uppercase font-mono text-cyan-400 tracking-wider truncate">{authUser?.role || userProfile.role}</span>
                  </div>
                </div>
                
                <div className="p-2">
                  <button 
                    onClick={() => {
                      setProfileOpen(false);
                      setAccountModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-active)] text-[var(--text-secondary)] hover:text-cyan-400 transition-colors text-sm font-semibold group"
                  >
                    <User size={16} className="group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all" />
                    My Account
                  </button>
                  <button 
                    onClick={() => {
                      setProfileOpen(false);
                      alert("Messaging module is currently encrypted and offline.");
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-active)] text-[var(--text-secondary)] hover:text-cyan-400 transition-colors text-sm font-semibold group"
                  >
                    <Mail size={16} className="group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all" />
                    Messages
                  </button>
                </div>
                
                <div className="p-2 border-t border-[var(--border-subtle)]">
                  <button 
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 transition-colors text-sm font-bold group"
                  >
                    <LogOut size={16} className="group-hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.5)] transition-all" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <UserProfileModal 
        isOpen={accountModalOpen} 
        onClose={() => setAccountModalOpen(false)} 
      />
    </header>
  );
}
