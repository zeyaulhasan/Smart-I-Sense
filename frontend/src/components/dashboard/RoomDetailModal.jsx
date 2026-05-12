import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Droplets, Laptop, Lightbulb, Thermometer, Wind, Tv, Settings, Plus, Trash2, ShieldCheck, Activity, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { createPortal } from 'react-dom';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';

// ── Room ID → SensorData camelCase key mapping ──
const ROOM_KEY_MAP = {
  living_room: 'livingRoom',
  livingroom:  'livingRoom',
  bedroom:     'bedroom',
  kitchen:     'kitchen',
  bathroom:    'bathroom'
};
function toSensorKey(id) {
  return ROOM_KEY_MAP[id] || id.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// ── Compute per-room watts from all rooms' active devices ──
function buildRoomOverride(allRooms) {
  const override = {};
  const KNOWN = ['livingRoom','bedroom','kitchen','bathroom'];
  KNOWN.forEach(k => { override[k] = { electricity: 0 }; });
  for (const room of allRooms) {
    const key = toSensorKey(room.id);
    const watts = (room.devices || [])
      .filter(d => d.isActive !== false)
      .reduce((s, d) => s + (d.nominalPower || 0), 0);
    override[key] = { electricity: watts };
  }
  return override;
}

const DEVICE_ICONS = {
  Fan: Wind,
  Lights: Lightbulb,
  TV: Tv,
  Pump: Zap,
  Fridge: Thermometer,
  Geyser: Droplets,
  Wind,
  Lightbulb,
  Tv,
  Zap,
  Thermometer,
  Droplets,
  Laptop
};

export default function RoomDetailModal({ isOpen, onClose, room, data, onUpdate, allRooms }) {
  const [isEditing, setIsEditing]       = useState(false);
  const [localRoom, setLocalRoom]       = useState(room);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagResult, setDiagResult]     = useState(null);
  const [togglingIdx, setTogglingIdx]   = useState(null); // index of device being toggled
  const [toast, setToast]               = useState(null); // { msg, type }
  const { isDark } = useTheme();

  useEffect(() => { if (room) setLocalRoom(room); }, [room]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  if (!isOpen || !room) return null;

  const currentElec  = data?.electricity || 0;
  const currentWater = data?.water || 0;

  const mockHistory = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    val: Math.max(10, currentElec + (Math.random() - 0.5) * 40)
  }));

  // ── Toggle handler: saves to Config + pushes override to dashboard ──
  const handleDeviceChange = async (idx, field, value) => {
    const updatedDevices = [...localRoom.devices];
    updatedDevices[idx]  = { ...updatedDevices[idx], [field]: value };
    const updatedRoom    = { ...localRoom, devices: updatedDevices };
    setLocalRoom(updatedRoom);

    if (!isEditing && field === 'isActive') {
      setTogglingIdx(idx);
      await persistToggle(updatedRoom);
      setTogglingIdx(null);
    }
  };

  const persistToggle = async (updatedRoom) => {
    try {
      // 1. Persist device state to Config DB
      const config      = await api.get('/config');
      const configData  = config?.data || config;
      const latestRooms = configData.rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
      await api.patch('/config', { rooms: latestRooms });
      if (onUpdate) onUpdate(updatedRoom, latestRooms);

      // 2. Compute new per-room watts from ALL rooms' active devices
      const roomsForCompute = (allRooms || []).map(r => r.id === updatedRoom.id ? updatedRoom : r);
      const override        = buildRoomOverride(roomsForCompute.length ? roomsForCompute : [updatedRoom]);

      // 3. POST to /api/hardware/override → backend emits socket → dashboard updates
      const result = await api.post('/hardware/override', { rooms: override });

      const newRoomWatts = override[toSensorKey(updatedRoom.id)]?.electricity || 0;
      showToast(`⚡ ${updatedRoom.label}: Load updated to ${newRoomWatts.toFixed(0)}W`, 'success');
    } catch (err) {
      console.error('Toggle persist error:', err);
      showToast('Failed to update power reading', 'error');
    }
  };

  const handleAddDevice = () => {
    const newDevice = { name: 'New Device', nominalPower: 50, icon: 'Zap', isActive: true };
    setLocalRoom({ ...localRoom, devices: [...localRoom.devices, newDevice] });
  };

  const handleRemoveDevice = (idx) => {
    const updatedDevices = localRoom.devices.filter((_, i) => i !== idx);
    setLocalRoom({ ...localRoom, devices: updatedDevices });
  };

  const handleSave = async () => {
    try {
      const config     = await api.get('/config');
      const configData = config?.data || config;
      const updatedRooms = configData.rooms.map(r => r.id === localRoom.id ? localRoom : r);
      await api.patch('/config', { rooms: updatedRooms });
      setIsEditing(false);
      if (onUpdate) onUpdate(localRoom);
      showToast('Configuration saved!', 'success');
    } catch (err) {
      showToast('Failed to save: ' + err.message, 'error');
    }
  };

  // ── Diagnostic Run: computes real device-based load & broadcasts ──
  const handleDiagnose = async () => {
    try {
      setIsDiagnosing(true);
      setDiagResult(null);
      const res = await api.post('/hardware/diagnose-rooms');
      setDiagResult(res);
      showToast(`🔍 Diagnostic: ${(res.totalElectricity || 0).toFixed(0)}W total computed`, 'success');
    } catch (err) {
      showToast('Diagnostic failed: ' + err.message, 'error');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const modalContent = (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
        />
        
        <motion.div 
          initial={{ scale: 0.9, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 40, opacity: 0 }}
          className={`relative w-full max-w-2xl border-[3px] rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] transition-all duration-500
            ${isDark ? 'bg-slate-900 border-teal-500/40' : 'bg-white border-slate-200'}
          `}
        >
          {/* Header */}
          <div className={`px-8 py-6 border-b-[3px] flex items-center justify-between transition-colors
            ${isDark ? 'bg-slate-800/50 border-teal-500/20' : 'bg-slate-50 border-slate-100'}
          `}>
            <div>
              <h2 className={`text-2xl font-black uppercase tracking-tighter italic ${isDark ? 'text-white' : 'text-slate-900'}`}>{localRoom.label}</h2>
              <div className="flex items-center gap-3 mt-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isDiagnosing ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'} animate-pulse`} />
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDiagnosing ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {isDiagnosing ? 'Diagnostic Scan In Progress' : 'Active Sector Secure Feed'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`w-12 h-12 rounded-2xl border-[3px] flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95
                  ${isEditing ? 'bg-amber-500 text-black border-amber-600 shadow-amber-500/30' : isDark ? 'bg-slate-700 text-white border-teal-500/30 hover:border-teal-400' : 'bg-slate-100 text-slate-500 border-slate-200'}
                `}
              >
                <Settings size={20} className={isEditing ? 'animate-spin-slow' : ''} />
              </button>
              <button onClick={onClose} className={`w-12 h-12 rounded-2xl border-[3px] flex items-center justify-center transition-all hover:bg-rose-500 hover:text-white hover:border-rose-600 shadow-xl
                ${isDark ? 'bg-slate-700 text-slate-400 border-teal-500/30' : 'bg-slate-100 text-slate-400 border-slate-200'}
              `}>
                <X size={24} />
              </button>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar ${isDark ? 'bg-black/20' : 'bg-slate-50/30'}`}>
            {/* Stats Overview */}
            {!isEditing && (
              <div className="grid grid-cols-2 gap-6">
                <div className={`p-6 rounded-3xl border-[3px] flex flex-col gap-2 shadow-2xl transition-all
                  ${isDark ? 'bg-teal-500/5 border-teal-500/20' : 'bg-white border-teal-100'}
                `}>
                  <div className="flex items-center gap-3 text-teal-500 mb-1">
                    <Zap size={20} className="animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Load Signature</span>
                  </div>
                  <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentElec} <span className="text-xs font-bold opacity-50">Watts</span></span>
                </div>
                <div className={`p-6 rounded-3xl border-[3px] flex flex-col gap-2 shadow-2xl transition-all
                  ${isDark ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-white border-cyan-100'}
                `}>
                  <div className="flex items-center gap-3 text-cyan-500 mb-1">
                    <Droplets size={20} />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Fluid Dynamics</span>
                  </div>
                  <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentWater.toFixed(1)} <span className="text-xs font-bold opacity-50">L/min</span></span>
                </div>
              </div>
            )}

            {/* Threshold Settings (Editing) */}
            {isEditing && (
              <div className={`p-6 rounded-3xl border-[3px] space-y-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500
                ${isDark ? 'bg-amber-500/5 border-amber-500/30' : 'bg-amber-50 border-amber-200'}
              `}>
                <h3 className="text-[12px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.3em]">Sector Optimization Thresholds</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Elec Spike (W)</label>
                    <input 
                      type="number" 
                      value={localRoom.elecThreshold}
                      onChange={(e) => setLocalRoom({ ...localRoom, elecThreshold: Number(e.target.value) })}
                      className={`w-full border-[3px] rounded-2xl px-5 py-3 text-lg font-black outline-none focus:border-amber-500 transition-all
                        ${isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}
                      `}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Water Leak (L/m)</label>
                    <input 
                      type="number" 
                      value={localRoom.waterThreshold}
                      onChange={(e) => setLocalRoom({ ...localRoom, waterThreshold: Number(e.target.value) })}
                      className={`w-full border-[3px] rounded-2xl px-5 py-3 text-lg font-black outline-none focus:border-amber-500 transition-all
                        ${isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}
                      `}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Detail Chart - Fixed Overlap */}
            {!isEditing && (
              <div className={`h-36 w-full rounded-3xl border-[3px] relative overflow-hidden shadow-inner group
                ${isDark ? 'bg-black/40 border-teal-500/10' : 'bg-white border-slate-200'}
              `}>
                {/* Fixed Label - Moved away from graph lines */}
                <div className="absolute top-5 left-6 z-20">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-cyan-500" />
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Sector Flux Analysis</span>
                  </div>
                </div>
                
                <div className="absolute inset-0 pt-10 pb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="roomColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="val" stroke="#22D3EE" strokeWidth={4} fill="url(#roomColor)" animationDuration={2000} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Device Control Matrix */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-black uppercase tracking-[0.4em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Device Control Matrix</h3>
                {isEditing && (
                  <button onClick={handleAddDevice} className="flex items-center gap-2 px-5 py-2 rounded-full bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-teal-500/30">
                    <Plus size={14} /> Add Peripheral
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4">
                {localRoom.devices.map((device, idx) => {
                  const Icon = DEVICE_ICONS[device.name] || DEVICE_ICONS[device.icon] || Laptop;
                  const isActive = device.isActive !== false;
                  return (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-4 rounded-2xl border-[3px] transition-all group/item
                        ${isActive ? 
                          (isDark ? 'bg-slate-800/80 border-teal-500/30 shadow-xl' : 'bg-white border-slate-200 shadow-md') : 
                          (isDark ? 'bg-black/20 border-white/5 opacity-40 grayscale' : 'bg-slate-50 border-slate-100 opacity-60')}
                      `}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-[3px]
                          ${isActive ? 
                            (isDark ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-teal-50 text-teal-600 border-teal-200') : 
                            (isDark ? 'bg-slate-900 text-slate-700 border-white/5' : 'bg-slate-200 text-slate-400 border-slate-300')}
                        `}>
                          <Icon size={24} className={isActive ? 'animate-pulse-slow' : ''} />
                        </div>
                        {isEditing ? (
                          <div className="flex flex-col gap-2 flex-1">
                            <input 
                              className={`bg-transparent border-b-2 border-dashed border-slate-300 dark:border-slate-700 text-base font-black outline-none focus:border-teal-500 transition-colors
                                ${isDark ? 'text-white' : 'text-slate-900'}
                              `}
                              value={device.name}
                              onChange={(e) => handleDeviceChange(idx, 'name', e.target.value)}
                            />
                            <p className="text-[10px] text-teal-500 font-black uppercase tracking-widest">Sector Node Identifier</p>
                          </div>
                        ) : (
                          <div>
                            <p className={`text-base font-black ${isActive ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-400'}`}>{device.name}</p>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-teal-500' : 'text-slate-400'}`}>Grid Node Verified</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                         {isEditing ? (
                           <div className="flex items-center gap-3">
                             <div className="relative">
                               <input 
                                 type="number"
                                 className={`w-24 border-[3px] rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-amber-500
                                   ${isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}
                                 `}
                                 value={device.nominalPower}
                                 onChange={(e) => handleDeviceChange(idx, 'nominalPower', Number(e.target.value))}
                               />
                               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500">W</span>
                             </div>
                             <button onClick={() => handleRemoveDevice(idx)} className="w-10 h-10 flex items-center justify-center text-rose-500 hover:bg-rose-500/20 rounded-xl transition-all border-2 border-transparent hover:border-rose-500/30">
                               <Trash2 size={20} />
                             </button>
                           </div>
                         ) : (
                           <div className="flex flex-col items-end gap-1">
                             <span className={`text-sm font-black ${isActive ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-400'}`}>{device.nominalPower}W</span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nominal Load</span>
                           </div>
                         )}
                         {!isEditing && (
                           <button
                             onClick={() => togglingIdx !== idx && handleDeviceChange(idx, 'isActive', !isActive)}
                             disabled={togglingIdx === idx}
                             className={`w-14 h-7 rounded-full relative p-1.5 transition-all duration-500 shadow-inner flex items-center
                               ${togglingIdx === idx ? 'opacity-60 cursor-wait' : 'cursor-pointer'}
                               ${isActive ? 'bg-teal-500 shadow-teal-500/50' : 'bg-slate-300 dark:bg-slate-700'}
                             `}
                           >
                             {togglingIdx === idx
                               ? <Loader2 size={12} className="animate-spin text-white mx-auto" />
                               : <div className={`w-4 h-4 rounded-full bg-white shadow-xl transition-all duration-500 ${isActive ? 'translate-x-7' : 'translate-x-0'}`} />}
                           </button>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Diagnostic Result Panel */}
          {diagResult && !isEditing && (
            <div className={`mx-8 mb-0 mt-0 p-5 rounded-3xl border-[3px] space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500
              ${isDark ? 'bg-teal-500/5 border-teal-500/20' : 'bg-teal-50 border-teal-200'}
            `}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-500 flex items-center gap-2">
                  <Activity size={14} className="animate-pulse" /> Diagnostic Results — {(diagResult.totalElectricity || 0).toFixed(0)}W Total
                </span>
                <button onClick={() => setDiagResult(null)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={16}/></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {diagResult.diagnosis && Object.values(diagResult.diagnosis).map((r, i) => (
                  <div key={i} className={`p-3 rounded-2xl border-2 ${isDark ? 'bg-slate-900/60 border-teal-500/10' : 'bg-white border-teal-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{r.label}</p>
                    <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.totalWatts}W</p>
                    <p className="text-[9px] text-teal-500 font-black uppercase">{r.activeCount} on · {r.offCount} off</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className={`px-8 py-6 border-t-[3px] flex items-center justify-between transition-colors
            ${isDark ? 'bg-slate-800/80 border-teal-500/20' : 'bg-slate-100 border-slate-100'}
          `}>
            <div className="flex items-center gap-3">
               <ShieldCheck size={18} className="text-teal-500" />
               <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>System Architecture: Secure Mesh v4.0</span>
            </div>
            <div className="flex gap-4">
              {isEditing ? (
                <button onClick={handleSave} className="px-10 py-3 rounded-2xl bg-amber-500 text-black text-[11px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-amber-500/40">
                  Apply Configuration
                </button>
              ) : (
                <button
                  onClick={handleDiagnose}
                  disabled={isDiagnosing}
                  className={`flex items-center gap-3 px-10 py-3 rounded-2xl bg-teal-600 dark:bg-teal-500 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-teal-500/40 ${isDiagnosing ? 'opacity-70 cursor-wait scale-100' : ''}`}
                >
                  {isDiagnosing && <Loader2 size={14} className="animate-spin" />}
                  {isDiagnosing ? 'Running Diagnostics...' : 'Diagnostic Run'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-[3px] text-sm font-black
              ${ toast.type === 'success'
                  ? 'bg-teal-500 text-white border-teal-400 shadow-teal-500/40'
                  : 'bg-rose-500 text-white border-rose-400 shadow-rose-500/40' }
            `}
          >
            {toast.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
