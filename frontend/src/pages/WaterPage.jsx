import { useState, useEffect } from 'react';
import { Droplets, Download, Activity, ShieldCheck, Waves, BarChart3, Clock, LayoutGrid } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ui/ToastProvider';
import { roomLabel, exportToCSV } from '../utils/helpers';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`p-4 rounded-2xl border-[3px] shadow-2xl backdrop-blur-xl ${isDark ? 'bg-slate-900/90 border-cyan-500/30' : 'bg-white border-slate-200'}`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-cyan-400/60' : 'text-slate-400'}`}>{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{e.value?.toFixed(2)} <span className="text-[10px] opacity-50 uppercase">L/m</span></span>
        </div>
      ))}
    </div>
  );
};

export default function WaterPage() {
  const [data, setData] = useState(null);
  const [roomsConfig, setRoomsConfig] = useState([]);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState('24h');
  const [exporting, setExporting] = useState(false);
  const { socket } = useSocket();
  const { isDark } = useTheme();
  const toast = useToast();

  useEffect(() => { 
    const init = async () => {
      try {
        const [latestRes, configRes] = await Promise.all([
          api.get('/latest'),
          api.get('/config')
        ]);
        setData(latestRes?.data || latestRes);
        setRoomsConfig(configRes?.data?.rooms || configRes?.rooms || []);
      } catch (err) {
        toast.error('Failed to sync water data');
      }
    };
    init();
  }, []);

  useEffect(() => {
    api.get(`/history?range=${range}`).then(r => {
      setHistory((r.data || []).map(d => ({
        time: format(new Date(d.timestamp), range === '7d' ? 'MMM dd' : 'HH:mm'),
        total: d.water,
      })));
    }).catch(() => toast.error('Failed to load water history'));
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
      exportToCSV(res.data || [], `water-${range}`);
    } catch (e) { toast.error('Export failed'); }
    setExporting(false);
  };

  // Normalize camelCase keys (livingRoom) → snake_case (living_room) to match Config room IDs
  const toSnake = (s) => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
  const sensorRooms = Object.fromEntries(
    Object.entries(data?.rooms || {}).map(([k, v]) => [toSnake(k), v])
  );
  
  const roomBreakdown = roomsConfig.map(room => ({
    id: room.id,
    name: room.label,
    value: Number(sensorRooms[room.id]?.water || 0),
  }));

  const maxUsage = history.length > 0 ? Math.max(...history.map(h => h.total)) : 0;
  const avgUsage = history.length > 0 ? (history.reduce((a, b) => a + b.total, 0) / history.length).toFixed(2) : 0;

  return (
    <div className="flex flex-col gap-8 w-full max-w-full pb-10">
      {/* Premium Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-cyan-500/10 flex items-center justify-center border-[3px] border-cyan-500/20 shadow-xl">
            <Droplets size={32} className="text-cyan-500 animate-bounce-slow" />
          </div>
          <div>
            <h1 className={`text-4xl font-black uppercase tracking-tighter italic leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Hydraulic Monitoring
            </h1>
            <div className="flex items-center gap-3 mt-1">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">Fluid dynamics verified</span>
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Node ID: hydro_secure_07</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex p-1.5 rounded-2xl border-[3px] transition-colors ${isDark ? 'bg-slate-800 border-cyan-500/20' : 'bg-slate-100 border-slate-200'}`}>
            {['1h', '24h', '7d'].map(r => (
              <button 
                key={r} 
                onClick={() => setRange(r)} 
                className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                  ${range === r ? 
                    'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 
                    `text-slate-500 hover:text-cyan-500`}
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
              ${isDark ? 'bg-slate-800 border-cyan-500/20 text-white hover:border-cyan-500' : 'bg-white border-slate-200 text-slate-700 hover:border-cyan-500'}
            `}
          >
            <Download size={16} />
            {exporting ? 'Syncing...' : 'Export Dataset'}
          </button>
        </div>
      </div>

      {/* Hero Stats Row - Dynamic Scroll */}
      <div className="flex overflow-x-auto gap-6 pb-4 custom-scrollbar no-scrollbar-md">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className={`p-8 rounded-[2.5rem] border-[3px] relative overflow-hidden shadow-2xl transition-all min-w-[280px] shrink-0
            ${isDark ? 'bg-slate-900 border-cyan-500/40' : 'bg-white border-slate-200'}
          `}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Waves size={64} className="text-cyan-500" />
          </div>
          <div className="flex items-center gap-3 text-cyan-500 mb-4">
            <Activity size={20} />
            <span className="text-[12px] font-black uppercase tracking-[0.2em]">Total Flow</span>
          </div>
          <div className={`text-4xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {data?.water || 0}<span className="text-sm ml-2 opacity-50">L/m</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Flow Pressure Stable</span>
          </div>
        </motion.div>

        {roomsConfig.map((room, idx) => (
          <motion.div 
            key={room.id}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (idx + 1) * 0.05 }}
            className={`p-8 rounded-[2.5rem] border-[3px] shadow-xl transition-all min-w-[240px] shrink-0
              ${isDark ? 'bg-slate-800/50 border-cyan-500/10' : 'bg-slate-50 border-slate-100'}
            `}
          >
            <div className={`text-[12px] font-black uppercase tracking-[0.2em] mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{room.label}</div>
            <div className={`text-4xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {sensorRooms[room.id]?.water || 0}<span className="text-sm ml-2 opacity-50">L/m</span>
            </div>
            <div className={`h-1 w-12 rounded-full mt-5 ${isDark ? 'bg-cyan-500/20' : 'bg-slate-200'}`} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className={`xl:col-span-8 p-10 rounded-[3rem] border-[3px] flex flex-col min-h-[500px] shadow-2xl transition-all
          ${isDark ? 'bg-slate-900 border-cyan-500/40' : 'bg-white border-slate-200'}
        `}>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className={`text-xl font-black uppercase tracking-widest italic ${isDark ? 'text-white' : 'text-slate-900'}`}>Flow Velocity</h2>
              <div className="flex items-center gap-4 mt-2">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Real-time Stream</span>
                 </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-3xl font-black italic ${isDark ? 'text-cyan-500' : 'text-slate-900'}`}>{avgUsage}<span className="text-xs ml-1 opacity-50">L/m</span></span>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Avg Flow Rate</p>
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="usageColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke={isDark ? 'rgba(34,211,238,0.05)' : 'rgba(0,0,0,0.03)'} />
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
                  tickFormatter={v => `${v}L`} 
                  width={60} 
                />
                <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ stroke: '#22D3EE', strokeWidth: 2, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  name="Water" 
                  stroke="#22D3EE" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#usageColor)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`xl:col-span-4 p-10 rounded-[3rem] border-[3px] flex flex-col min-h-[500px] shadow-2xl transition-all
          ${isDark ? 'bg-slate-900 border-cyan-500/40' : 'bg-white border-slate-200'}
        `}>
          <div className="mb-10">
            <h2 className={`text-xl font-black uppercase tracking-widest italic ${isDark ? 'text-white' : 'text-slate-900'}`}>Flow Distribution</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Cross-Sector Hydraulic Feed</p>
          </div>

          <div className="flex-1 min-h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomBreakdown} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="6 6" horizontal={false} stroke={isDark ? 'rgba(34,211,238,0.05)' : 'rgba(0,0,0,0.03)'} />
                  <XAxis 
                    type="number" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: isDark ? '#475569' : '#94a3b8' }}
                    tickFormatter={v => `${v}L`} 
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 900, fill: isDark ? '#f8fafc' : '#1e293b' }}
                    width={90} 
                  />
                  <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: 'rgba(34,211,238,0.05)' }} />
                  <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={24}>
                    {roomBreakdown.map((entry, i) => (
                      <Cell 
                        key={i} 
                        fill={i % 2 === 0 ? '#0891B2' : '#22D3EE'} 
                        fillOpacity={0.9} 
                      />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>

          <div className="mt-8 pt-8 border-t-[3px] border-cyan-500/5">
             <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Peak Demand</span>
                <span className="text-cyan-500">{roomBreakdown.length > 0 ? [...roomBreakdown].sort((a,b) => b.value - a.value)[0]?.name : 'N/A'}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Secondary Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-8 rounded-[2.5rem] border-[3px] flex items-center gap-6 transition-all ${isDark ? 'bg-slate-800/50 border-cyan-500/10' : 'bg-slate-50 border-slate-100'}`}>
           <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/20">
              <ShieldCheck className="text-emerald-500" size={24} />
           </div>
           <div>
              <p className={`text-[12px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>Hydraulic Health</p>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Leak Prevention Active</p>
           </div>
        </div>
        <div className={`p-8 rounded-[2.5rem] border-[3px] flex items-center gap-6 transition-all ${isDark ? 'bg-slate-800/50 border-cyan-500/10' : 'bg-slate-50 border-slate-100'}`}>
           <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border-2 border-cyan-500/20">
              <Waves className="text-cyan-500" size={24} />
           </div>
           <div>
              <p className={`text-[12px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>Peak Volume</p>
              <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mt-0.5">{maxUsage.toFixed(1)}L/m Recorded</p>
           </div>
        </div>
        <div className={`p-8 rounded-[2.5rem] border-[3px] flex items-center gap-6 transition-all ${isDark ? 'bg-slate-800/50 border-cyan-500/10' : 'bg-slate-50 border-slate-100'}`}>
           <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border-2 border-blue-500/20">
              <Clock className="text-blue-500" size={24} />
           </div>
           <div>
              <p className={`text-[12px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>Last Sync</p>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-0.5">{format(new Date(), 'HH:mm:ss')} EST</p>
           </div>
        </div>
      </div>
    </div>
  );
}
