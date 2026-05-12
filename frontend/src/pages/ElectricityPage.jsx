import { useState, useEffect } from 'react';
import { Zap, Download, Activity, ShieldCheck, TrendingUp, BarChart3, Clock, LayoutGrid } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ui/ToastProvider';
import { formatWatts, roomLabel, exportToCSV } from '../utils/helpers';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`p-4 rounded-2xl border-[3px] shadow-2xl backdrop-blur-xl ${isDark ? 'bg-slate-900/90 border-teal-500/30' : 'bg-white border-slate-200'}`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-teal-400/60' : 'text-slate-400'}`}>{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
          <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{e.value?.toFixed(1)} <span className="text-[10px] opacity-50 uppercase">Watts</span></span>
        </div>
      ))}
    </div>
  );
};

export default function ElectricityPage() {
  const [data, setData] = useState(null);
  const [roomsConfig, setRoomsConfig] = useState([]);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState('24h');
  const [exporting, setExporting] = useState(false);
  const { socket } = useSocket();
  const { isDark } = useTheme();
  const toast = useToast();

  useEffect(() => { 
    // Fetch both latest data and the room configuration to ensure sync
    const init = async () => {
      try {
        const [latestRes, configRes] = await Promise.all([
          api.get('/latest'),
          api.get('/config')
        ]);
        setData(latestRes?.data || latestRes);
        setRoomsConfig(configRes?.data?.rooms || configRes?.rooms || []);
      } catch (err) {
        toast.error('Failed to sync electricity data');
      }
    };
    init();
  }, []);

  useEffect(() => {
    api.get(`/history?range=${range}`).then(r => {
      setHistory((r.data || []).map(d => ({
        time: format(new Date(d.timestamp), range === '7d' ? 'MMM dd' : 'HH:mm'),
        total: Math.round(d.electricity),
      })));
    }).catch(() => toast.error('Failed to load electricity history'));
  }, [range]);

  useEffect(() => {
    if (!socket) return;
    const h = d => setData(d);
    socket.on('sensor-data', h);
    return () => socket.off('sensor-data', h);
  }, [socket]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/history?range=${range}`);
      exportToCSV(res.data || [], `electricity-${range}`);
    } catch (e) { toast.error('Export failed'); }
    setExporting(false);
  };

  // Normalize camelCase keys (livingRoom) → snake_case (living_room) to match Config room IDs
  const toSnake = (s) => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
  const sensorRooms = Object.fromEntries(
    Object.entries(data?.rooms || {}).map(([k, v]) => [toSnake(k), v])
  );
  
  // Build room breakdown based on actual config for perfect sync
  const roomBreakdown = roomsConfig.map(room => ({
    id: room.id,
    name: room.label,
    value: Math.round(sensorRooms[room.id]?.electricity || 0),
  }));

  const maxUsage = history.length > 0 ? Math.max(...history.map(h => h.total)) : 0;
  const avgUsage = history.length > 0 ? Math.round(history.reduce((a, b) => a + b.total, 0) / history.length) : 0;

  return (
    <div className="flex flex-col gap-8 w-full max-w-full pb-10">
      {/* Premium Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-teal-500/10 flex items-center justify-center border-[3px] border-teal-500/20 shadow-xl">
            <Zap size={32} className="text-teal-500 animate-pulse" />
          </div>
          <div>
            <h1 className={`text-4xl font-black uppercase tracking-tighter italic leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Electricity Monitoring
            </h1>
            <div className="flex items-center gap-3 mt-1">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-500">Live Grid signature</span>
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Facility Node: secure_rx_04</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex p-1.5 rounded-2xl border-[3px] transition-colors ${isDark ? 'bg-slate-800 border-teal-500/20' : 'bg-slate-100 border-slate-200'}`}>
            {['1h', '24h', '7d'].map(r => (
              <button 
                key={r} 
                onClick={() => setRange(r)} 
                className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                  ${range === r ? 
                    'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 
                    `text-slate-500 hover:text-teal-500`}
                `}
              >
                {r}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExport} 
            disabled={exporting} 
            className={`px-6 py-3.5 rounded-2xl border-[3px] flex items-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95
              ${isDark ? 'bg-slate-800 border-teal-500/20 text-white hover:border-teal-500' : 'bg-white border-slate-200 text-slate-700 hover:border-teal-500'}
            `}
          >
            <Download size={16} />
            {exporting ? 'Syncing...' : 'Export Dataset'}
          </button>
        </div>
      </div>

      {/* Hero Stats Row - Dynamically synced with all rooms */}
      <div className="flex overflow-x-auto gap-6 pb-4 custom-scrollbar no-scrollbar-md">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className={`p-8 rounded-[2.5rem] border-[3px] relative overflow-hidden shadow-2xl transition-all min-w-[280px] shrink-0
            ${isDark ? 'bg-slate-900 border-teal-500/40' : 'bg-white border-slate-200'}
          `}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={64} className="text-teal-500" />
          </div>
          <div className="flex items-center gap-3 text-teal-500 mb-4">
            <Activity size={20} />
            <span className="text-[12px] font-black uppercase tracking-[0.2em]">Total Load</span>
          </div>
          <div className={`text-4xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {data?.electricity || 0}<span className="text-sm ml-2 opacity-50">W</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Grid Nominal</span>
          </div>
        </motion.div>

        {roomsConfig.map((room, idx) => (
          <motion.div 
            key={room.id}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (idx + 1) * 0.05 }}
            className={`p-8 rounded-[2.5rem] border-[3px] shadow-xl transition-all min-w-[240px] shrink-0
              ${isDark ? 'bg-slate-800/50 border-teal-500/10' : 'bg-slate-50 border-slate-100'}
            `}
          >
            <div className={`text-[12px] font-black uppercase tracking-[0.2em] mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{room.label}</div>
            <div className={`text-4xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {sensorRooms[room.id]?.electricity || 0}<span className="text-sm ml-2 opacity-50">W</span>
            </div>
            <div className={`h-1 w-12 rounded-full mt-5 ${isDark ? 'bg-teal-500/20' : 'bg-slate-200'}`} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Main Area Chart */}
        <div className={`xl:col-span-8 p-10 rounded-[3rem] border-[3px] flex flex-col min-h-[500px] shadow-2xl transition-all
          ${isDark ? 'bg-slate-900 border-teal-500/40' : 'bg-white border-slate-200'}
        `}>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className={`text-xl font-black uppercase tracking-widest italic ${isDark ? 'text-white' : 'text-slate-900'}`}>Usage Over Time</h2>
              <div className="flex items-center gap-4 mt-2">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Real-time Signature</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/20 border border-teal-500/50" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Peak threshold: {maxUsage}W</span>
                 </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-3xl font-black italic ${isDark ? 'text-teal-500' : 'text-slate-900'}`}>{avgUsage}<span className="text-xs ml-1 opacity-50">W</span></span>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Avg Power Drain</p>
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="usageColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke={isDark ? 'rgba(20,184,166,0.05)' : 'rgba(0,0,0,0.03)'} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: isDark ? '#475569' : '#94a3b8' }}
                  interval="preserveStartEnd" 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: isDark ? '#475569' : '#94a3b8' }}
                  tickFormatter={v => `${v}W`} 
                  width={60} 
                />
                <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ stroke: '#14B8A6', strokeWidth: 2, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  name="Power" 
                  stroke="#14B8A6" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#usageColor)" 
                  animationDuration={2500}
                />
                <ReferenceLine y={maxUsage} stroke="#F43F5E" strokeDasharray="8 8" label={{ value: 'Peak', position: 'right', fill: '#F43F5E', fontSize: 10, fontWeight: 900 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Breakdown Bar Chart - Dynamic with all rooms */}
        <div className={`xl:col-span-4 p-10 rounded-[3rem] border-[3px] flex flex-col min-h-[500px] shadow-2xl transition-all
          ${isDark ? 'bg-slate-900 border-teal-500/40' : 'bg-white border-slate-200'}
        `}>
          <div className="mb-10">
            <h2 className={`text-xl font-black uppercase tracking-widest italic ${isDark ? 'text-white' : 'text-slate-900'}`}>Room Breakdown</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Cross-Sector Distribution</p>
          </div>

          <div className="flex-1 min-h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomBreakdown} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="6 6" horizontal={false} stroke={isDark ? 'rgba(20,184,166,0.05)' : 'rgba(0,0,0,0.03)'} />
                  <XAxis 
                    type="number" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: isDark ? '#475569' : '#94a3b8' }}
                    tickFormatter={v => `${v}W`} 
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 900, fill: isDark ? '#f8fafc' : '#1e293b' }}
                    width={90} 
                  />
                  <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: 'rgba(20,184,166,0.05)' }} />
                  <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={24}>
                    {roomBreakdown.map((entry, i) => (
                      <Cell 
                        key={i} 
                        fill={i % 2 === 0 ? '#14B8A6' : '#22D3EE'} 
                        fillOpacity={0.9} 
                        className="transition-all hover:fillOpacity-100"
                      />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>

          <div className="mt-8 pt-8 border-t-[3px] border-teal-500/5">
             <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Highest Drain</span>
                <span className="text-teal-500">{roomBreakdown.length > 0 ? [...roomBreakdown].sort((a,b) => b.value - a.value)[0]?.name : 'N/A'}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Secondary Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-8 rounded-[2.5rem] border-[3px] flex items-center gap-6 transition-all ${isDark ? 'bg-slate-800/50 border-teal-500/10' : 'bg-slate-50 border-slate-100'}`}>
           <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/20">
              <ShieldCheck className="text-emerald-500" size={24} />
           </div>
           <div>
              <p className={`text-[12px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>System Health</p>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Optimal Grid Logic</p>
           </div>
        </div>
        <div className={`p-8 rounded-[2.5rem] border-[3px] flex items-center gap-6 transition-all ${isDark ? 'bg-slate-800/50 border-teal-500/10' : 'bg-slate-50 border-slate-100'}`}>
           <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border-2 border-amber-500/20">
              <TrendingUp className="text-amber-500" size={24} />
           </div>
           <div>
              <p className={`text-[12px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>Peak Signature</p>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-0.5">{maxUsage}W Recorded</p>
           </div>
        </div>
        <div className={`p-8 rounded-[2.5rem] border-[3px] flex items-center gap-6 transition-all ${isDark ? 'bg-slate-800/50 border-teal-500/10' : 'bg-slate-50 border-slate-100'}`}>
           <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border-2 border-cyan-500/20">
              <Clock className="text-cyan-500" size={24} />
           </div>
           <div>
              <p className={`text-[12px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>Last Sync</p>
              <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mt-0.5">{format(new Date(), 'HH:mm:ss')} EST</p>
           </div>
        </div>
      </div>
    </div>
  );
}
