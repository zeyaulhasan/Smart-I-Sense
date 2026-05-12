import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { Zap, Droplets, AlertTriangle, Info, Activity, Monitor, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveFeed() {
  const [events, setEvents] = useState([]);
  const { socket } = useSocket();
  const { isDark } = useTheme();

  useEffect(() => {
    if (!socket) return;

    const handleSensor = (data) => {
      const newEntries = [];
      const timestamp = new Date();

      // 1. Electricity entry
      newEntries.push({
        id: `elec-${Date.now()}`,
        type: 'electricity',
        icon: Zap,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
        title: 'Power Telemetry',
        value: `${Math.round(data.electricity)}W`,
        detail: 'Active grid signature detected.',
        timestamp
      });

      // 2. Water entry (only if flow > 0)
      if (data.water > 0) {
        newEntries.push({
          id: `water-${Date.now()}`,
          type: 'water',
          icon: Droplets,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          title: 'Hydraulic Flow',
          value: `${data.water.toFixed(1)}L/m`,
          detail: 'Fluid dynamics stable.',
          timestamp
        });
      }

      setEvents(prev => [...newEntries, ...prev].slice(0, 50));
    };

    const handleAlert = (alert) => {
      setEvents(prev => {
        const newEvent = { 
          id: `alert-${Date.now()}`, 
          type: 'alert',
          icon: AlertTriangle,
          color: 'text-rose-400',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          title: 'Critical Alert',
          value: 'System Warning',
          detail: alert.message,
          timestamp: new Date() 
        };
        return [newEvent, ...prev].slice(0, 50);
      });
    };

    socket.on('sensor-data', handleSensor);
    socket.on('alert', handleAlert);
    return () => { socket.off('sensor-data', handleSensor); socket.off('alert', handleAlert); };
  }, [socket]);

  return (
    <div className={`flex flex-col h-[600px] relative overflow-hidden rounded-[2rem] border-[3px] transition-all duration-700 shadow-2xl
      ${isDark ? 'bg-slate-900 border-teal-500/40' : 'bg-white border-slate-200'}
    `}>
      {/* Header */}
      <div className={`px-6 py-4 flex items-center justify-between border-b-[3px] backdrop-blur-3xl relative z-10 transition-colors
        ${isDark ? 'bg-slate-800 border-teal-500/40' : 'bg-slate-50 border-slate-200'}
      `}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border-2 border-cyan-500/20 flex items-center justify-center">
            <Activity size={20} className="text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h2 className={`text-sm font-black uppercase tracking-widest leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Live Telemetry</h2>
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-teal-500/60' : 'text-slate-500'}`}>Real-Time Feed // Secure_TX</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 transition-colors ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">Live</span>
        </div>
      </div>

      {/* Events Feed */}
      <div className={`flex-1 overflow-y-auto p-6 flex flex-col gap-4 relative z-10 custom-scrollbar ${isDark ? 'bg-black/30' : 'bg-slate-50/30'}`}>
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-[10px] text-slate-500 text-center my-auto font-mono uppercase tracking-[0.3em] italic"
            >
              _initializing_secure_handshake...
            </motion.div>
          ) : (
            events.map((ev) => {
              const Icon = ev.icon || Info;
              return (
                <motion.div
                  key={ev.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  layout
                  className={`flex gap-5 p-5 rounded-[1.5rem] border-2 shadow-lg transition-all hover:scale-[1.02] active:scale-95 group/item
                    ${isDark ? `${ev.bg} ${ev.border}` : 'bg-white border-slate-100'}
                  `}
                >
                  <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border-2 shadow-inner
                    ${isDark ? `${ev.bg} ${ev.border}` : 'bg-slate-50 border-slate-100'}
                  `}>
                    <Icon size={24} className={ev.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ev.title}</span>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-teal-500/50' : 'text-slate-400'}`}>[{format(ev.timestamp, 'HH:mm:ss')}]</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <p className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{ev.value}</p>
                       <p className={`text-[11px] font-bold truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ev.detail}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer */}
      <div className={`px-8 py-4 border-t-[3px] flex items-center justify-between transition-colors
        ${isDark ? 'bg-slate-800 border-teal-500/40' : 'bg-slate-50 border-slate-200'}
      `}>
         <div className="flex items-center gap-2">
            <Wifi size={12} className="text-teal-500" />
            <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Latency: 24ms</span>
         </div>
         <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Events: {events.length}/50</span>
      </div>
    </div>
  );
}
