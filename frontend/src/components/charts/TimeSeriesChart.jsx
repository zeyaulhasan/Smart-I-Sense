import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, isValid } from 'date-fns';
import { Eye, X, Zap, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import api from '../../utils/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="minimal-tooltip">
      <p className="text-[10px] text-[var(--text-muted)] font-mono mb-2">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="text-xs text-[var(--text-secondary)]">{e.name}:</span>
          <span className="text-xs font-mono font-medium text-[var(--text-primary)]">
            {e.name === 'Power' ? `${e.value?.toFixed(0)}W` : `${e.value?.toFixed(1)}L/m`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function TimeSeriesChart({ realtimeData }) {
  const [data, setData] = useState([]);
  const [range, setRange] = useState('1h');
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/history?range=${range}`);
        if (!cancelled) {
          // IMPORTANT: Backend wraps result in { success, data, ... }
          const historyArray = res?.data || [];
          
          const formatted = historyArray.map(d => {
            const date = new Date(d.timestamp);
            return {
              time: isValid(date) ? format(date, (range === '7d' || range === '30d') ? 'MMM dd' : 'HH:mm') : '??:??',
              electricity: Math.round(d.electricity || 0),
              water: parseFloat((d.water || 0).toFixed(2)),
            };
          });
          setData(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchHistory();
    return () => { cancelled = true; };
  }, [range]);

  useEffect(() => {
    if (range !== '1h' || !realtimeData) return;
    setData(prev => {
      const point = {
        time: format(new Date(), 'HH:mm'),
        electricity: Math.round(realtimeData.electricity || 0),
        water: parseFloat((realtimeData.water || 0).toFixed(2)),
      };
      return [...prev, point].slice(-60);
    });
  }, [realtimeData, range]);

  const modalContent = (
    <AnimatePresence>
      {isExpanded && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl pointer-events-auto"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-6xl bg-[var(--bg-page)] border border-[var(--border-glass)] rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh] pointer-events-auto"
          >
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-6">
                <div>
                  <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Real-Time Grid Analysis</h2>
                  <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.3em]">Full Scale Resource Telemetry // Secure Stream</p>
                </div>
              </div>
              
              <button onClick={() => setIsExpanded(false)} className="p-3 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 p-8 min-h-0">
               {loading ? (
                 <div className="h-full flex items-center justify-center text-sm text-[var(--text-muted)] animate-pulse uppercase tracking-widest font-black">Re-indexing Streams...</div>
               ) : (
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
                       <defs>
                          <linearGradient id="expColorElec" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.6}/>
                             <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="5 5" stroke="var(--border-subtle)" vertical={false} />
                       <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill:'var(--text-muted)', fontSize: 12}} minTickGap={30} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill:'var(--text-muted)', fontSize: 12}} width={60} />
                       <Tooltip content={<CustomTooltip />} />
                       <Area 
                          type="monotone" dataKey="electricity" name="Power" stroke="#22D3EE" 
                          strokeWidth={4} fillOpacity={1} fill="url(#expColorElec)" 
                          activeDot={{ r: 8, fill: '#22D3EE', stroke: '#000', strokeWidth: 3 }}
                       />
                       <Area 
                          type="monotone" dataKey="water" name="Water" stroke="#10B981" 
                          strokeWidth={4} fillOpacity={0.2} fill="transparent" 
                       />
                    </AreaChart>
                 </ResponsiveContainer>
               )}
            </div>
            
            <div className="p-6 bg-black/20 border-t border-[var(--border-subtle)] flex items-center justify-between">
               <div className="flex gap-8">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Power</span>
                     <span className="text-2xl font-black text-white">{data[data.length-1]?.electricity || 0}W</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hydraulic Flow</span>
                     <span className="text-2xl font-black text-emerald-400">{data[data.length-1]?.water || 0}L/m</span>
                  </div>
               </div>

               <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
                  {['1h', '24h', '7d', '30d'].map(r => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${range === r ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      {r}
                    </button>
                  ))}
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="card-base flex flex-col h-full min-h-[350px]">
      <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">Resource Monitoring</h2>
          <button 
            type="button"
            onClick={() => setIsExpanded(true)}
            className="p-1.5 hover:bg-cyan-500/10 text-[var(--text-muted)] hover:text-cyan-400 rounded-lg transition-all"
            title="Expand View"
          >
            <Eye size={16} />
          </button>
        </div>
        <div className="flex gap-1 bg-[var(--bg-active)] border border-[var(--border-glass)] p-1 rounded-lg">
          {['1h', '24h', '7d', '30d'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${range === r ? 'bg-cyan-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[280px] w-full p-4 pr-6">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-[var(--text-muted)] animate-pulse uppercase tracking-widest font-black">Syncing Waves...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorElec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill:'var(--text-muted)', fontSize: 10}} minTickGap={25} />
              <YAxis axisLine={false} tickLine={false} tick={{fill:'var(--text-muted)', fontSize: 10}} width={45} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" dataKey="electricity" name="Power" stroke="#06B6D4" 
                strokeWidth={2} fillOpacity={1} fill="url(#colorElec)" animationDuration={1000}
              />
              <Area 
                type="monotone" dataKey="water" name="Water" stroke="#10B981" 
                strokeWidth={2} fillOpacity={1} fill="url(#colorWater)" animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {createPortal(modalContent, document.body)}
    </div>
  );
}
