import { useState, useEffect } from 'react';
import { Lightbulb, Info, AlertCircle, Sparkles, Zap, Brain, Activity } from 'lucide-react';
import api from '../../utils/api';

export default function AIInsightsPanel({ compact = false }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = () => {
      api.get('/predictions')
        .then(res => {
          const data = res?.data || res;
          setPrediction(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };
    
    fetchInsights();
    const interval = setInterval(fetchInsights, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="card-base flex flex-col h-full relative overflow-hidden group">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
      
      <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between relative z-10">
        <h2 className="text-sm font-bold tracking-wide flex items-center gap-2 uppercase bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          <Sparkles size={16} className="text-blue-400" />
          AI Neural Insights
        </h2>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto min-h-0 min-h-[300px] relative z-10">
        {loading ? (
           <div className="text-sm text-[var(--text-muted)] animate-pulse flex items-center gap-2">
             <Activity size={14} className="animate-spin" /> Analyzing neural patterns...
           </div>
        ) : !prediction ? (
           <div className="text-sm text-[var(--text-muted)]">No insights available.</div>
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* Dynamic Suggestions from Backend */}
            {(prediction.suggestions || []).map((suggestion, idx) => (
              <div key={idx} className="flex gap-4 p-4 bg-[var(--bg-active)] rounded-xl border border-[var(--border-subtle)] shadow-[inset_0_0_20px_rgba(255,255,255,0.01)] transition-colors">
                <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center border ${getPriorityColor(suggestion.priority)}`}>
                  <span className="text-sm">{suggestion.icon || '🧠'}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">{suggestion.type}</h4>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">{suggestion.confidence}% CONF</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    {suggestion.message}
                  </p>
                </div>
              </div>
            ))}

            {/* General Trend */}
            <div className="flex gap-4 p-4 bg-[var(--bg-active)] rounded-xl border border-[var(--border-subtle)]">
              <div className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center border text-blue-400 bg-blue-500/10 border-blue-500/20">
                <Activity size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">Forecast Matrix</h4>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Projected target load: <span className="font-mono font-bold text-blue-400">{Math.round(prediction.predicted?.[prediction.predicted.length - 1]?.electricity || 0)}W</span>. Trend is currently <span className="font-bold text-[var(--text-primary)]">{prediction.trend || 'stable'}</span>.
                </p>
              </div>
            </div>

            {/* Model Info */}
            {!compact && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3 rounded-xl flex flex-col items-center justify-center">
                  <div className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] mb-1">Model Confidence</div>
                  <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">{prediction.confidence}%</div>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3 rounded-xl flex flex-col items-center justify-center">
                  <div className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] mb-1">Architecture</div>
                  <div className="text-xs font-black text-cyan-400 tracking-wide mt-1">LSTM Ensemble</div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
