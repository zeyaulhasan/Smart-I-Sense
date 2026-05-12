import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, isValid } from 'date-fns';
import { Eye, X, TrendingUp, Sparkles, Zap, AlertCircle } from 'lucide-react';
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
            {typeof e.value === 'number' ? `${e.value.toFixed(0)}W` : '0W'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function PredictionChart({ compact = false }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchPredictions = async () => {
    try {
      const res = await api.get('/predictions');
      if (!res) throw new Error("Empty response");

      const source = res.actual ? res : (res.data || {});
      const actual = source.actual || [];
      const predicted = source.predicted || [];
      
      const chartData = [];
      
      actual.forEach(d => {
        const date = new Date(d.timestamp);
        const val = Number(d.electricity);
        chartData.push({
          time: isValid(date) ? format(date, 'HH:mm:ss') : '--:--:--',
          actual: isNaN(val) ? 0 : val,
          predicted: null
        });
      });

      if (chartData.length > 0 && predicted.length > 0) {
        const lastActual = chartData[chartData.length - 1].actual;
        chartData[chartData.length - 1].predicted = lastActual;
      }

      predicted.forEach(d => {
        const date = new Date(d.timestamp);
        const val = Number(d.electricity);
        chartData.push({
          time: isValid(date) ? format(date, 'HH:mm:ss') : '--:--:--',
          actual: null,
          predicted: isNaN(val) ? 0 : val
        });
      });

      setData(chartData);
      setError(chartData.length === 0 ? "No prediction vectors available" : null);
    } catch (err) {
      console.error('Prediction Engine Error:', err);
      setError("Unable to link with Prediction Engine");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 10000);
    return () => clearInterval(interval);
  }, []);

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
              <div>
                <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Predictive Grid Modeling</h2>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em]">Neural Network Output // Flux Capacity: {error ? 'INTERRUPTED' : 'STABLE'}</p>
              </div>
              <button onClick={() => setIsExpanded(false)} className="p-3 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 p-8 min-h-0 relative">
               {error ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
                    <AlertCircle size={48} className="text-rose-500/50" />
                    <p className="text-sm font-black text-rose-500 tracking-widest uppercase italic">{error}</p>
                 </div>
               ) : (
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="5 5" stroke="var(--border-subtle)" vertical={false} />
                       <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill:'var(--text-muted)', fontSize: 12}} minTickGap={40} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill:'var(--text-muted)', fontSize: 12}} tickFormatter={(v) => `${v}W`} width={70} domain={['auto', 'auto']} />
                       <Tooltip content={<CustomTooltip />} />
                       <Area 
                          type="monotone" dataKey="actual" name="Current State" stroke="#22D3EE" 
                          strokeWidth={4} fillOpacity={0.2} fill="#22D3EE" connectNulls={true} isAnimationActive={false}
                       />
                       <Area 
                          type="monotone" dataKey="predicted" name="AI Sequence" stroke="#10B981" 
                          strokeWidth={3} strokeDasharray="10 5" fillOpacity={0.1} fill="#10B981" connectNulls={true}
                          isAnimationActive={false}
                          activeDot={{ r: 8, fill: '#10B981', stroke: '#000', strokeWidth: 3 }}
                       />
                      </AreaChart>
                 </ResponsiveContainer>
               )}
            </div>

            <div className="p-6 bg-black/20 border-t border-[var(--border-subtle)] flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model Precision</span>
                  <span className="text-2xl font-black text-emerald-400">98.4%</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Target Consumption</span>
                     <span className="text-2xl font-black text-white">420W</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                     <Zap size={24} className="text-emerald-400" />
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="card-base flex flex-col h-full min-h-[350px]">
      <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" />
            Forecast Analytics
          </h2>
          <button 
            type="button"
            onClick={() => setIsExpanded(true)}
            className="p-1.5 hover:bg-emerald-500/10 text-[var(--text-muted)] hover:text-emerald-400 rounded-lg transition-all"
          >
            <Eye size={16} />
          </button>
        </div>
        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
           <Sparkles size={10} className="text-emerald-400 animate-pulse" />
           <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">A.I. Enabled</span>
        </div>
      </div>
      
      <div className="h-[280px] w-full p-4 pr-6 relative">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-[var(--text-muted)] animate-pulse uppercase tracking-widest font-black italic">Stabilizing Vectors...</div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
            <AlertCircle size={24} className="text-rose-500 opacity-50" />
            <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">{error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill:'var(--text-muted)', fontSize: 10}} minTickGap={30} />
              <YAxis axisLine={false} tickLine={false} tick={{fill:'var(--text-muted)', fontSize: 10}} tickFormatter={(v) => `${v}W`} width={50} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" dataKey="actual" name="Actual" stroke="#22D3EE" 
                strokeWidth={2} fillOpacity={0.15} fill="#22D3EE" connectNulls={true} isAnimationActive={false}
              />
              <Area 
                type="monotone" dataKey="predicted" name="Predicted" stroke="#10B981" 
                strokeWidth={2} strokeDasharray="5 5" fillOpacity={0.1} fill="#10B981" connectNulls={true} isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {createPortal(modalContent, document.body)}
    </div>
  );
}
