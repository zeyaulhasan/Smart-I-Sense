import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';

export default function AlertsModal({ isOpen, onClose, onResolve }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      // The API returns { success, data: alerts, unresolvedCount }
      const res = await api.get('/alerts?resolved=false&limit=50');
      const alertsData = res.data || [];
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.patch(`/alerts/${id}/resolve`);
      setAlerts(prev => prev.filter(a => a._id !== id));
      if (onResolve) onResolve();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
          />
          
          <motion.div 
            initial={{ scale: 0.9, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 40, opacity: 0 }}
            className={`relative w-full max-w-xl border-[3px] rounded-[3rem] shadow-[0_0_50px_rgba(244,63,94,0.2)] overflow-hidden flex flex-col max-h-[85vh] transition-all duration-500
              ${isDark ? 'bg-slate-900 border-rose-500/40' : 'bg-white border-slate-200'}
            `}
          >
            {/* Header */}
            <div className={`px-8 py-6 border-b-[3px] flex items-center justify-between transition-colors
              ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}
            `}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center border-2 border-rose-500/30">
                  <ShieldAlert className="text-rose-500 animate-pulse" size={24} />
                </div>
                <div>
                  <h2 className={`text-xl font-black uppercase tracking-tighter italic ${isDark ? 'text-white' : 'text-slate-900'}`}>Active System Alerts</h2>
                  <p className="text-[10px] font-black text-rose-500/70 uppercase tracking-widest mt-0.5">Real-Time Threat Detection</p>
                </div>
              </div>
              <button onClick={onClose} className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all hover:bg-rose-500 hover:text-white hover:border-rose-600
                ${isDark ? 'bg-slate-800 text-slate-400 border-rose-500/20' : 'bg-slate-100 text-slate-400 border-slate-200'}
              `}>
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar ${isDark ? 'bg-black/20' : 'bg-slate-50/30'}`}>
              {loading ? (
                <div className="py-24 text-center">
                  <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.4em]">Syncing nodes...</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center border-[3px] border-emerald-500/30 shadow-xl shadow-emerald-500/10">
                    <CheckCircle size={40} className="text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>System Nominal</p>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-1">All Clear // No Active Threats</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {alerts.map((alert) => (
                    <motion.div 
                      key={alert._id || Math.random()} 
                      layout
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className={`p-6 rounded-[2rem] border-[3px] flex flex-col gap-4 transition-all group
                        ${alert.severity === 'critical' ? 
                          (isDark ? 'bg-rose-500/10 border-rose-500/30 shadow-xl shadow-rose-500/10' : 'bg-rose-50 border-rose-200') : 
                          (isDark ? 'bg-amber-500/10 border-amber-500/30 shadow-xl shadow-amber-500/10' : 'bg-amber-50 border-amber-200')}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg
                            ${alert.severity === 'critical' ? 'bg-rose-500 text-white shadow-rose-500/30' : 'bg-amber-500 text-black shadow-amber-500/30'}`}>
                            {alert.severity}
                          </span>
                          <span className={`text-[10px] font-mono flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            <Clock size={12} /> {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'N/A'}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleResolve(alert._id)}
                          className="px-6 py-2 rounded-xl bg-teal-600 dark:bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-110 active:scale-95 transition-all shadow-lg shadow-teal-500/30"
                        >
                          Resolve
                        </button>
                      </div>
                      <div>
                        <p className={`text-base font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{alert.message}</p>
                        <div className="flex items-center gap-3 mt-3">
                           <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-200/50 text-slate-600'}`}>Sector: {alert.room}</span>
                           <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-200/50 text-slate-600'}`}>Limit: {alert.threshold}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`px-8 py-5 border-t-[3px] text-center transition-colors
              ${isDark ? 'bg-black/40 border-rose-500/20' : 'bg-slate-100 border-slate-100'}
            `}>
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Security Protocol 10.4 // Active Monitoring</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
