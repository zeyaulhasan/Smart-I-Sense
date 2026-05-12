import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Mail, User, ChevronRight, Fingerprint, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ui/ToastProvider';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();

  const handleAuth = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        await register(name, email, password);
        toast.success('Account created successfully!');
      }
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.error || (isLogin ? 'Invalid email or password' : 'Registration failed');
      toast.error(message);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-page)] flex items-center justify-center relative overflow-hidden font-sans transition-colors duration-500">
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={toggleTheme}
          className="p-3 text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-glass)] hover:bg-cyan-500/10 hover:text-cyan-400 rounded-2xl transition-all shadow-lg active:scale-95 group"
          title="Toggle Theme"
        >
          {isDark ? <Sun size={20} className="group-hover:rotate-45 transition-transform" /> : <Moon size={20} className="group-hover:-rotate-12 transition-transform" />}
        </button>
      </div>

      {/* Background Cyber Aesthetics */}
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-100 transition-opacity duration-1000">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] mix-blend-screen dark:mix-blend-screen mix-blend-multiply animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] mix-blend-screen dark:mix-blend-screen mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
        
        {/* Left Side: Brand Identity */}
        <div className="flex-1 text-center md:text-left pt-12 md:pt-0">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-6 mb-6 group">
              <div className="w-20 h-20 relative shrink-0">
                {/* Backdrop glow */}
                <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-400/30 transition-colors" />
                <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                  {/* Outer Hexagon */}
                  <path d="M32 4L56 18V46L32 60L8 46V18L32 4Z" stroke="url(#logo_grad_1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[3px] transition-all duration-300" />
                  {/* Inner interconnected lines */}
                  <path d="M32 4V18 M8 18L20 25 M56 18L44 25 M8 46L20 39 M56 46L44 39 M32 60V46" stroke="url(#logo_grad_1)" strokeWidth="1.5" strokeLinecap="round" />
                  {/* Inner Solid Hexagon */}
                  <path d="M32 18L44 25V39L32 46L20 39V25L32 18Z" fill="url(#logo_grad_2)" className="animate-pulse" style={{ animationDuration: '3s' }} />
                  {/* Digital Core */}
                  <circle cx="32" cy="32" r="5" fill="#FFFFFF" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  
                  <defs>
                    <linearGradient id="logo_grad_1" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#22D3EE" />
                      <stop offset="1" stopColor="#3B82F6" />
                    </linearGradient>
                    <linearGradient id="logo_grad_2" x1="20" y1="18" x2="44" y2="46" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#0EA5E9" />
                      <stop offset="1" stopColor="#1E3A8A" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h1 className="text-5xl md:text-7xl font-sans text-[var(--text-primary)] text-center md:text-left drop-shadow-xl">
                <span className="font-black tracking-tighter">SMART</span>
                <span className="text-cyan-400 font-light mx-1 opacity-50">-</span>
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-500 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">I</span>
                <span className="text-cyan-400 font-light mx-1 opacity-50">-</span>
                <span className="font-light tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-muted)]">SENSE</span>
              </h1>
            </div>
            <p className="text-lg md:text-2xl text-[var(--text-secondary)] font-medium max-w-xl mx-auto md:mx-0 leading-relaxed">
              The Next Generation <span className="text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">Digital Twin</span> Infrastructure for Smart Cities and Homes.
            </p>
            
            <div className="mt-8 flex items-center justify-center md:justify-start gap-6 text-[var(--text-muted)] font-mono text-sm uppercase tracking-widest">
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" /> Secure</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]" /> Real-time</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]" /> Predictive</span>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Auth Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="bg-[var(--bg-card)]/80 backdrop-blur-2xl border border-[var(--border-glass)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5),_0_0_40px_rgba(34,211,238,0.1)] rounded-3xl overflow-hidden relative group transition-all duration-500">
            
            {/* Top Glow Edge */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="p-8 pb-10">
              
              {/* Toggle Login / Sign Up */}
              <div className="flex bg-[var(--bg-active)] rounded-xl p-1 mb-8 border border-[var(--border-subtle)] relative overflow-hidden">
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.15)] ${isLogin ? 'left-1' : 'left-[50%]'}`}
                />
                <button 
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2.5 text-[10px] tracking-widest font-black z-10 transition-colors ${isLogin ? 'text-cyan-400' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  SYSTEM LOGIN
                </button>
                <button 
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2.5 text-[10px] tracking-widest font-black z-10 transition-colors ${!isLogin ? 'text-cyan-400' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  REQUEST ACCESS
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAuth} className="space-y-5">
                <AnimatePresence mode="popLayout">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1.5"
                    >
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] ml-1">Full Name</label>
                      <div className="relative group/input">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/input:text-cyan-400 transition-colors" size={18} />
                        <input 
                          type="text" 
                          required={!isLogin}
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full bg-[var(--bg-active)]/50 border border-[var(--border-subtle)] rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-cyan-400 focus:bg-[var(--bg-card)] transition-all placeholder:text-[var(--text-muted)] shadow-inner"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] ml-1">Email Directive</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/input:text-cyan-400 transition-colors" size={18} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@smart-i-sense.com"
                      className="w-full bg-[var(--bg-active)]/50 border border-[var(--border-subtle)] rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-cyan-400 focus:bg-[var(--bg-card)] transition-all placeholder:text-[var(--text-muted)] shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Security Key</label>
                  </div>
                  <div className="relative group/input">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/input:text-cyan-400 transition-colors" size={18} />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      minLength={6}
                      className="w-full bg-[var(--bg-active)]/50 border border-[var(--border-subtle)] rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-cyan-400 focus:bg-[var(--bg-card)] transition-all placeholder:text-[var(--text-muted)] shadow-inner tracking-widest"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] flex items-center justify-center gap-2 group transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isLogin ? (
                    <>
                      <Fingerprint size={18} className="group-hover:scale-110 transition-transform" />
                      AUTHENTICATE SESSION
                    </>
                  ) : (
                    <>
                      <Shield size={18} className="group-hover:scale-110 transition-transform" />
                      INITIALIZE CLEARANCE
                    </>
                  )}
                  {!submitting && <ChevronRight size={18} className="absolute right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />}
                </button>
              </form>
              
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
