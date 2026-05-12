import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { History, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import api from '../utils/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="minimal-tooltip">
      <p className="text-[10px] text-[var(--text-muted)] font-mono mb-2">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1">
          <span className="text-xs text-[var(--text-secondary)]">{e.name}</span>
          <span className="text-xs font-mono font-bold" style={{ color: e.color }}>
            {e.value.toFixed(1)} {label?.includes('Water') ? 'L/min' : 'W'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');

  useEffect(() => {
    setLoading(true);
    api.get(`/history/compare?range=${range}`)
      .then(res => {
        // res is already unwrapped by axios interceptor to { success: true, data: {...} }
        // or just contains data if backend structure changed.
        setData(res?.data || res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  const renderTrend = (change) => {
    if (change > 0) {
      return (
        <span className="flex items-center gap-1 text-rose-400 text-sm font-bold bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
          <TrendingUp size={14} /> +{change.toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
        <TrendingDown size={14} /> {change.toFixed(1)}%
      </span>
    );
  };

  const chartData = data ? [
    {
      name: 'Electricity (W)',
      Previous: data.previous.electricity,
      Current: data.current.electricity,
    },
    {
      name: 'Water (L/m)',
      Previous: data.previous.water,
      Current: data.current.water,
    }
  ] : [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <History size={24} className="text-purple-400" />
            Historical Analytics
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Compare current property consumption against past periods.</p>
        </div>
        
        <div className="flex bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-1 w-full md:w-auto">
          {['1h', '24h', '7d', '30d'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 md:w-16 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                range === r 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] border border-transparent'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-[var(--text-muted)] animate-pulse font-mono text-sm">
          Aggregating Historical Data...
        </div>
      ) : !data ? (
        <div className="h-64 flex items-center justify-center text-[var(--text-muted)]">
          No historical data available for this range.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Key Metrics */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Avg Electricity</h3>
                <Clock size={14} className="text-purple-400" />
              </div>
              <div className="text-3xl font-black text-[var(--text-primary)] font-mono mb-3">
                {data.current.electricity.toFixed(0)}<span className="text-lg text-[var(--text-muted)]">W</span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                <span className="text-xs text-[var(--text-secondary)]">vs Previous {range}</span>
                {renderTrend(data.changePercentage.electricity)}
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Avg Water Flow</h3>
                <Clock size={14} className="text-cyan-400" />
              </div>
              <div className="text-3xl font-black text-[var(--text-primary)] font-mono mb-3">
                {data.current.water.toFixed(1)}<span className="text-lg text-[var(--text-muted)]">L/m</span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                <span className="text-xs text-[var(--text-secondary)]">vs Previous {range}</span>
                {renderTrend(data.changePercentage.water)}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2 card-base p-5 min-h-[300px] flex flex-col">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
              Period Comparison Bar Chart
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'var(--text-muted)', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill:'var(--text-muted)', fontSize: 12}} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--bg-active)'}} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Previous" fill="var(--text-muted)" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  <Bar dataKey="Current" fill="#c084fc" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
