import { useState, useEffect } from 'react';
import {
  Settings, Sun, Moon, Download, RefreshCw, Database, Wifi, Cpu,
  ShieldCheck, Stethoscope, Home, Palette, HardDrive, FileDown, Info,
  Layers, BarChart3, Activity, Calendar, BrainCircuit, IndianRupee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/ToastProvider';
import { exportToCSV } from '../utils/helpers';
import RoomManager from '../components/settings/RoomManager';
import api from '../utils/api';

/* ───── Tab Config ───── */
const TABS = [
  { id: 'rooms',      label: 'Rooms',      icon: Home },
  { id: 'appearance', label: 'Appearance',  icon: Palette },
  { id: 'export',     label: 'Data Export', icon: FileDown },
  { id: 'system',     label: 'System',      icon: HardDrive },
];

/* ───── Main Page ───── */
export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const { isConnected } = useSocket();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('rooms');
  const [exporting, setExporting] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [config, setConfig] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);

  useEffect(() => {
    api.get('/health').then(res => setSystemInfo(res)).catch(() => {});
    api.get('/config').then(res => setConfig(res?.data || res)).catch(() => toast.error('Failed to load config'));
  }, []);

  const handleExport = async (range) => {
    setExporting(range);
    try {
      const res = await api.get(`/history?range=${range}`);
      exportToCSV(res.data || [], `smart-i-sense-${range}`);
      toast.success(`Exported ${range.toUpperCase()} data`);
    } catch { toast.error('Export failed'); }
    setExporting(null);
  };

  const handleSaveRooms = async (updatedRooms) => {
    setSavingConfig(true);
    try {
      const res = await api.patch('/config', { rooms: updatedRooms });
      setConfig(res?.data || res);
      toast.success('Configuration saved');
    } catch { toast.error('Save failed'); }
    setSavingConfig(false);
  };

  const handleDiagnose = async () => {
    setDiagnosing(true);
    try {
      await api.post('/config/diagnose');
      toast.success('Diagnostics complete');
    } catch { toast.error('Diagnostics failed'); }
    setDiagnosing(false);
  };

  return (
    <div className="max-w-full w-full flex flex-col gap-0 pb-10">

      {/* ── Page Header ── */}
      <div className="flex items-end justify-between mb-8 gap-4">
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center border-2 border-cyan-500/30 shadow-inner">
             <Settings size={22} className="text-cyan-600 dark:text-cyan-400 animate-[spin_4s_linear_infinite]" />
          </div>
          <div>
            <h1 className={`text-2xl font-black uppercase tracking-[0.2em] italic leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>System Settings</h1>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isDark ? 'text-cyan-400/70' : 'text-slate-500'}`}>Configuration Matrix // Core Control</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)]">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={`self-start inline-flex items-center gap-2 p-1.5 rounded-2xl mb-8 border-[3px] shadow-xl ${isDark ? 'bg-slate-900/50 border-cyan-500/20' : 'bg-slate-100 border-slate-200'}`}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all z-10 ${
                active ? 'text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon size={14} className={active ? 'animate-pulse' : ''} />
              {tab.label}
              {active && (
                <motion.div
                  layoutId="settings-tab-bg"
                  className="absolute inset-0 bg-cyan-500 rounded-xl -z-10 shadow-lg shadow-cyan-500/40"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'rooms' && (
            <RoomsTab
              config={config}
              onSave={handleSaveRooms}
              saving={savingConfig}
              onDiagnose={handleDiagnose}
              diagnosing={diagnosing}
            />
          )}
          {activeTab === 'appearance' && (
            <AppearanceTab isDark={isDark} toggleTheme={toggleTheme} />
          )}
          {activeTab === 'export' && (
            <ExportTab onExport={handleExport} exporting={exporting} />
          )}
          {activeTab === 'system' && (
            <SystemTab systemInfo={systemInfo} isConnected={isConnected} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ╔══════════════════════════════════════╗
   ║          ROOMS TAB                   ║
   ╚══════════════════════════════════════╝ */
function RoomsTab({ config, onSave, saving, onDiagnose, diagnosing }) {
  if (!config) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-sm text-[var(--text-muted)]">
        <RefreshCw size={16} className="animate-spin" /> Loading configuration…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between border-b-[3px] pb-4 border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Room & Device Matrix</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-0.5">Configure spatial monitoring zones and thresholds</p>
          </div>
        </div>
        <button
          onClick={onDiagnose}
          disabled={diagnosing}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-cyan-400 border-[3px] border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/10"
        >
          {diagnosing ? <RefreshCw size={14} className="animate-spin" /> : <Stethoscope size={14} />}
          Run Diagnostics
        </button>
      </div>
      <RoomManager rooms={config.rooms || []} onSave={onSave} saving={saving} />
    </div>
  );
}

/* ╔══════════════════════════════════════╗
   ║        APPEARANCE TAB                ║
   ╚══════════════════════════════════════╝ */
function AppearanceTab({ isDark, toggleTheme }) {
  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h2 className="text-sm font-bold text-[var(--text-primary)]">Appearance</h2>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Customize the look and feel of your dashboard.</p>
      </div>

      {/* Theme Options */}
      <div className="grid grid-cols-2 gap-3">
        {/* Dark */}
        <button
          onClick={() => !isDark && toggleTheme()}
          className={`group relative rounded-2xl border-2 p-1 transition-all duration-300 ${
            isDark
              ? 'border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.12)]'
              : 'border-[var(--border-subtle)] hover:border-[var(--border-glass)] opacity-60 hover:opacity-100'
          }`}
        >
          {/* Preview */}
          <div className="rounded-xl overflow-hidden bg-[#0B0F1A] p-3 pb-4 aspect-[16/10]">
            <div className="flex gap-1.5 mb-2.5">
              <div className="w-2 h-2 rounded-full bg-rose-500/70" />
              <div className="w-2 h-2 rounded-full bg-amber-500/70" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
            </div>
            <div className="flex gap-2 h-full">
              <div className="w-1/4 flex flex-col gap-1.5">
                <div className="h-2 w-full rounded bg-white/5" />
                <div className="h-2 w-3/4 rounded bg-cyan-500/30" />
                <div className="h-2 w-full rounded bg-white/5" />
                <div className="h-2 w-full rounded bg-white/5" />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3 w-1/2 rounded bg-white/10" />
                <div className="flex gap-1.5 flex-1">
                  <div className="flex-1 rounded-md bg-white/5 border border-white/5" />
                  <div className="flex-1 rounded-md bg-white/5 border border-white/5" />
                  <div className="flex-1 rounded-md bg-cyan-500/10 border border-cyan-500/10" />
                </div>
                <div className="h-8 rounded-md bg-white/5 border border-white/5" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-2 pt-2.5 pb-1">
            <span className="text-xs font-bold text-[var(--text-primary)]">Dark Mode</span>
            {isDark && <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">ACTIVE</span>}
          </div>
        </button>

        {/* Light */}
        <button
          onClick={() => isDark && toggleTheme()}
          className={`group relative rounded-2xl border-2 p-1 transition-all duration-300 ${
            !isDark
              ? 'border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.12)]'
              : 'border-[var(--border-subtle)] hover:border-[var(--border-glass)] opacity-60 hover:opacity-100'
          }`}
        >
          <div className="rounded-xl overflow-hidden bg-[#F1F5F9] p-3 pb-4 aspect-[16/10]">
            <div className="flex gap-1.5 mb-2.5">
              <div className="w-2 h-2 rounded-full bg-rose-400/80" />
              <div className="w-2 h-2 rounded-full bg-amber-400/80" />
              <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
            </div>
            <div className="flex gap-2 h-full">
              <div className="w-1/4 flex flex-col gap-1.5">
                <div className="h-2 w-full rounded bg-slate-300/60" />
                <div className="h-2 w-3/4 rounded bg-cyan-500/40" />
                <div className="h-2 w-full rounded bg-slate-300/60" />
                <div className="h-2 w-full rounded bg-slate-300/60" />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3 w-1/2 rounded bg-slate-400/30" />
                <div className="flex gap-1.5 flex-1">
                  <div className="flex-1 rounded-md bg-white border border-slate-200" />
                  <div className="flex-1 rounded-md bg-white border border-slate-200" />
                  <div className="flex-1 rounded-md bg-cyan-50 border border-cyan-200/50" />
                </div>
                <div className="h-8 rounded-md bg-white border border-slate-200" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-2 pt-2.5 pb-1">
            <span className="text-xs font-bold text-[var(--text-primary)]">Light Mode</span>
            {!isDark && <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">ACTIVE</span>}
          </div>
        </button>
      </div>
    </div>
  );
}

/* ╔══════════════════════════════════════╗
   ║          EXPORT TAB                  ║
   ╚══════════════════════════════════════╝ */
function ExportTab({ onExport, exporting }) {
  const [rate, setRate] = useState(() => parseFloat(localStorage.getItem('electricity_rate')) || 8.5);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [forecastRange, setForecastRange] = useState('30d');

  const ranges = [
    { id: '1h',  label: 'Last Hour',     desc: 'Recent sensor readings from the past 60 minutes.',     icon: Activity },
    { id: '24h', label: 'Last 24 Hours',  desc: 'Full day of electricity and water consumption data.', icon: BarChart3 },
    { id: '7d',  label: 'Last 7 Days',    desc: 'Weekly overview including room-level breakdowns.',     icon: Layers },
    { id: '30d', label: 'Last 30 Days',   desc: 'Monthly comprehensive data for deep analytics.',       icon: Calendar },
  ];

  const handlePredict = async () => {
    localStorage.setItem('electricity_rate', rate);
    setIsPredicting(true);
    setPrediction(null);
    try {
      const res = await api.post('/predictions/cost', { range: forecastRange, rate: parseFloat(rate) });
      const data = res.data || res;
      const predictionData = data.data || data; // Handle nested { success, data } object
      setPrediction({
        title: predictionData.title || 'Projected Bill',
        usage: predictionData.usage || '0.0',
        cost: predictionData.cost || '0.00',
        confidence: predictionData.confidence || '0.0'
      });
    } catch (err) {
      console.error('Prediction failed', err);
      // Fallback in case of server error so UI doesn't crash completely
      setPrediction({
        title: 'Error',
        usage: 'N/A',
        cost: 'N/A',
        confidence: 'N/A'
      });
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-4xl w-full">
      {/* ── Export Section ── */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b-[3px] pb-4 border-[var(--border-subtle)]">
          <div className="w-2 h-8 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Data Export Terminal</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-0.5">Download historical sensor data as CSV for external analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ranges.map(r => (
            <button
              key={r.id}
              onClick={() => onExport(r.id)}
              disabled={!!exporting}
              className="group flex flex-col items-start gap-4 p-6 rounded-[2rem] bg-[var(--bg-card)]/50 border-[3px] border-[var(--border-subtle)] hover:border-amber-500/40 hover:bg-amber-500/[0.05] transition-all text-left disabled:opacity-40 hover:shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                {exporting === r.id
                  ? <RefreshCw size={20} className="text-amber-400 animate-spin" />
                  : <r.icon size={20} className="text-amber-400" />
                }
              </div>
              <div>
                <div className="text-[12px] font-black uppercase tracking-widest text-[var(--text-primary)] mb-1.5 flex items-center gap-2">
                  {r.label}
                  <Download size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-medium leading-relaxed">{r.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Cost Predictor ── */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b-[3px] pb-4 border-[var(--border-subtle)]">
          <div className="w-2 h-8 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] flex items-center gap-2">
              <BrainCircuit size={16} className="text-emerald-500" /> AI Cost Predictor
            </h2>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-0.5">Configure regional rates to forecast monthly billing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Controls */}
          <div className="p-8 rounded-[2rem] bg-[var(--bg-card)]/50 border-[3px] border-[var(--border-subtle)] flex flex-col justify-center gap-6 shadow-lg">
            <div>
              <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[var(--text-muted)] mb-3 block">Geographical Electricity Rate</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <IndianRupee size={20} />
                </div>
                <input 
                  type="number" 
                  step="0.5"
                  value={rate} 
                  onChange={e => setRate(e.target.value)}
                  className="w-full bg-[var(--bg-active)] border-[3px] border-[var(--border-subtle)] rounded-2xl pl-12 pr-20 py-4 text-xl font-black text-[var(--text-primary)] outline-none focus:border-emerald-500/50 transition-colors shadow-inner"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  Per kWh
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[var(--text-muted)] mb-3 block">Forecast Target Window</label>
              <div className="flex bg-[var(--bg-active)] p-1 rounded-xl border-[3px] border-[var(--border-subtle)]">
                {[
                  { id: '24h', label: '24 Hours' },
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' },
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => setForecastRange(r.id)}
                    className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${forecastRange === r.id ? 'bg-emerald-500 text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={handlePredict}
              disabled={isPredicting || !rate}
              className="w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] bg-emerald-500/10 text-emerald-500 border-[3px] border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              {isPredicting ? <RefreshCw size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
              {isPredicting ? 'Running Neural Analysis...' : 'Generate AI Forecast'}
            </button>
          </div>

          {/* Results */}
          <div className={`p-8 rounded-[2rem] border-[3px] flex flex-col justify-center items-center text-center transition-all duration-500 ${prediction ? 'bg-emerald-500/5 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'bg-[var(--bg-card)]/30 border-dashed border-[var(--border-subtle)]'}`}>
            {prediction ? (
              <div className="w-full animate-in zoom-in fade-in duration-500 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-6">
                   <IndianRupee size={28} className="text-emerald-500" />
                </div>
                <div className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500/80 mb-2">{prediction.title}</div>
                <div className="text-5xl font-black text-[var(--text-primary)] tracking-tighter mb-6 flex items-start justify-center gap-1">
                   <span className="text-2xl mt-1 opacity-50">₹</span>{prediction.cost}
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t-[3px] border-[var(--border-subtle)]/50">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Est. Consumption</span>
                    <span className="text-sm font-black text-[var(--text-primary)]">{prediction.usage} <span className="text-[10px] text-[var(--text-muted)]">kWh</span></span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-bold">AI Confidence</span>
                    <span className="text-sm font-black text-emerald-500">{prediction.confidence}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="opacity-40 flex flex-col items-center gap-4">
                <BrainCircuit size={48} className="text-[var(--text-muted)]" />
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Awaiting Input</div>
                <p className="text-[10px] font-medium max-w-[200px] text-[var(--text-secondary)]">Enter your local electricity rate and initiate the AI forecast.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ╔══════════════════════════════════════╗
   ║          SYSTEM TAB                  ║
   ╚══════════════════════════════════════╝ */
function SystemTab({ systemInfo, isConnected }) {
  const items = [
    { icon: Cpu,         label: 'Backend Version', value: systemInfo?.version || '1.0.0',                              color: '#22D3EE' },
    { icon: Wifi,        label: 'WebSocket',       value: isConnected ? 'Connected' : 'Disconnected',                 color: isConnected ? '#34D399' : '#F43F5E' },
    { icon: Database,    label: 'Database',         value: 'MongoDB Atlas',                                            color: '#A855F7' },
    { icon: ShieldCheck, label: 'System Status',    value: systemInfo?.status === 'online' ? 'Online' : 'Checking…',   color: systemInfo?.status === 'online' ? '#34D399' : '#FBBF24' },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-4xl w-full">
      {/* System Status */}
      <div className="flex items-center gap-3 border-b-[3px] pb-4 border-[var(--border-subtle)]">
        <div className="w-2 h-8 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">System Diagnostics</h2>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-0.5">Current health of backend services and connections</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col gap-4 p-6 rounded-[2rem] bg-[var(--bg-card)]/50 border-[3px] border-[var(--border-subtle)] hover:border-[var(--border-glass)] transition-all hover:shadow-xl">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${item.color}15`, border: `2px solid ${item.color}30` }}>
              <item.icon size={20} style={{ color: item.color }} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--text-muted)] mb-1">{item.label}</div>
              <div className="text-lg font-black font-mono tracking-tighter" style={{ color: item.color }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* About */}
      <div className="mt-4 pt-6 border-t-[3px] border-[var(--border-subtle)]">
        <h2 className="text-[12px] font-black uppercase tracking-widest text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Info size={16} className="text-violet-500" />
          About Smart-I-Sense
        </h2>
        <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-[2] max-w-3xl">
          Smart-I-Sense is an intelligent IoT monitoring platform that provides real-time visibility into electricity and water consumption across your property. Powered by digital twin technology, AI-driven forecasting, and automated anomaly detection — it helps you optimize resource usage, detect leaks and spikes instantly, and make smarter decisions about energy management.
        </p>
        <div className="mt-4 inline-flex items-center gap-2">
          <span className="text-[10px] font-black tracking-widest text-violet-400 bg-violet-500/10 px-4 py-1.5 rounded-lg border-2 border-violet-500/20 shadow-inner">BUILD V4.0.0-PRO</span>
        </div>
      </div>
    </div>
  );
}
