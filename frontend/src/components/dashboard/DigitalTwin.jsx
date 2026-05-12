import { Zap, Droplets, Activity, Home, Plus, Trash2, Check, X, RefreshCw, Signal } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import RoomDetailModal from './RoomDetailModal';
import api from '../../utils/api';

// Build per-room override from all rooms' active devices
function buildRoomOverride(rooms) {
  const ROOM_KEY_MAP = { living_room:'livingRoom', livingroom:'livingRoom', bedroom:'bedroom', kitchen:'kitchen', bathroom:'bathroom' };
  const toKey = id => ROOM_KEY_MAP[id] || id.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  const override = { livingRoom:{electricity:0}, bedroom:{electricity:0}, kitchen:{electricity:0}, bathroom:{electricity:0} };
  for (const room of rooms) {
    const key   = toKey(room.id);
    const watts = (room.devices||[]).filter(d=>d.isActive!==false).reduce((s,d)=>s+(d.nominalPower||0),0);
    override[key] = { electricity: watts };
  }
  return override;
}

const COLORS = [
  { key: 'teal',    hex: '#14b8a6' },
  { key: 'cyan',    hex: '#06b6d4' },
  { key: 'blue',    hex: '#3b82f6' },
  { key: 'violet',  hex: '#8b5cf6' },
  { key: 'amber',   hex: '#f59e0b' },
  { key: 'emerald', hex: '#10b981' },
  { key: 'rose',    hex: '#f43f5e' },
];
function hex(colorKey) {
  return COLORS.find(c => c.key === colorKey)?.hex || '#14b8a6';
}

const RoomMonitorTile = ({ id, label, color, data, onClick, onDelete, editMode }) => {
  const electricity = data?.electricity || 0;
  const water = data?.water || 0;
  const isAlert = (id === 'bathroom' && water > 10) || (id === 'kitchen' && electricity > 800);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isDark } = useTheme();

  const hexColor = hex(color);

  return (
    <div 
      className={`relative flex flex-col rounded-2xl border-2 transition-all duration-300 group shadow-lg hover:shadow-2xl flex-grow basis-[45%] h-[190px] overflow-hidden
        ${isAlert ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/20' : 
          isDark ? 'bg-slate-800/90' : 'bg-white'}
        ${isDeleting ? 'opacity-50 grayscale scale-95' : ''}
      `}
      style={!isAlert ? { 
        borderColor: isDark ? `${hexColor}40` : `${hexColor}80`,
        boxShadow: `0 4px 20px ${hexColor}10`
      } : {}}
    >
      {/* Edit Mode Overlay */}
      {editMode && !isDeleting && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsDeleting(true); }}
          className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center z-20 shadow-xl hover:scale-110 transition-transform border-2 border-white dark:border-slate-900"
        >
          <Trash2 size={18} />
        </button>
      )}

      {isDeleting && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/95 p-4 gap-3 text-center backdrop-blur-md">
          <p className="text-sm font-black text-white uppercase tracking-widest">Delete {label}?</p>
          <div className="flex gap-2 w-full">
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(id); }} 
              className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-[11px] font-black uppercase shadow-lg shadow-rose-500/30"
            >
              Confirm
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsDeleting(false); }} 
              className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-[11px] font-black uppercase"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div 
        onClick={onClick}
        className="flex-1 cursor-pointer flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className={`px-4 py-3 border-b-2 flex items-center justify-between rounded-t-xl ${isAlert ? 'bg-rose-500/20 border-rose-500/30' : isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`} style={!isAlert ? { borderColor: `${hexColor}20` } : {}}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isAlert ? 'bg-rose-500' : ''}`} style={!isAlert ? { backgroundColor: hexColor, boxShadow: `0 0 10px ${hexColor}` } : {}} />
            <h3 className={`text-[12px] font-black uppercase tracking-wider ${isAlert ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-900'}`}>{label}</h3>
          </div>
          <span className={`px-2 py-0.5 rounded text-[8px] font-black text-white ${isAlert ? 'bg-rose-500 animate-pulse' : 'shadow-sm'}`} style={!isAlert ? { backgroundColor: hexColor, boxShadow: `0 2px 10px ${hexColor}50` } : {}}>
            {isAlert ? 'ALERT' : 'ACTIVE'}
          </span>
        </div>

        <div className="p-4 flex flex-col gap-3 flex-1 justify-center">
          <div className="grid grid-cols-2 gap-3">
            <div className={`flex flex-col items-center py-2.5 rounded-2xl border-2 shadow-inner transition-colors ${isDark ? 'bg-slate-900/60 border-teal-500/5' : 'bg-slate-50 border-slate-100'}`}>
              <span className={`text-[9px] uppercase font-black mb-1 flex items-center gap-2 ${isDark ? 'text-teal-400/80' : 'text-slate-500'}`}><Zap size={12} className="text-amber-500" /> Power</span>
              <span className={`text-lg font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{electricity}<span className={`text-xs ml-1 ${isDark ? 'text-teal-500/50' : 'text-slate-400'}`}>W</span></span>
            </div>
            <div className={`flex flex-col items-center py-2.5 rounded-2xl border-2 shadow-inner transition-colors ${isDark ? 'bg-slate-900/60 border-teal-500/5' : 'bg-slate-50 border-slate-100'}`}>
              <span className={`text-[9px] uppercase font-black mb-1 flex items-center gap-2 ${isDark ? 'text-teal-400/80' : 'text-slate-500'}`}><Droplets size={12} className="text-cyan-500" /> Flow</span>
              <span className={`text-xl font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{water.toFixed(1)}<span className={`text-xs ml-1 ${isDark ? 'text-teal-500/50' : 'text-slate-400'}`}>L/m</span></span>
            </div>
          </div>
        </div>

        {/* Footer - Added vertical padding (pb-4) for breathing room */}
        <div className={`px-4 py-2 pb-4 flex items-center justify-between text-[8px] font-black border-t-2 uppercase tracking-widest transition-colors rounded-b-xl ${isDark ? 'bg-black/30 text-teal-500/40 border-teal-500/10' : 'bg-slate-50/50 text-slate-400 border-slate-100'}`}>
          <div className="flex items-center gap-1.5">
            <Signal size={10} className="text-teal-500" />
            <span>Connection Stable</span>
          </div>
          <span>Ref: {id.substring(0,3).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

export default function DigitalTwin({ data }) {
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const config = await api.get('/config');
      const fetched = config?.data?.rooms || config?.rooms || [];
      setRooms(fetched);

      // On first load: push computed device-based electricity to dashboard
      // so the numbers reflect active appliances, not ESP32 noise.
      if (fetched.length > 0) {
        try {
          const override = buildRoomOverride(fetched);
          await api.post('/hardware/override', { rooms: override });
        } catch (_) { /* silent — override is best-effort */ }
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchConfig();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const confirmAddRoom = async () => {
    if (!newName.trim()) {
      setIsAdding(false);
      return;
    }
    
    const id = newName.toLowerCase().replace(/\s+/g, '_');
    const newRoom = {
      id,
      label: newName,
      color: 'teal',
      elecThreshold: 500,
      waterThreshold: 2,
      devices: [{ name: 'Lights', nominalPower: 40, icon: 'Lightbulb', isActive: true }]
    };

    try {
      const updatedRooms = [...rooms, newRoom];
      await api.patch('/config', { rooms: updatedRooms });
      setRooms(updatedRooms);
      setIsAdding(false);
      setNewName('');
    } catch (err) {
      alert('Failed to add room: ' + err.message);
    }
  };

  const handleDeleteRoom = async (id) => {
    try {
      const updatedRooms = rooms.filter(r => r.id !== id);
      await api.patch('/config', { rooms: updatedRooms });
      setRooms(updatedRooms);
    } catch (err) {
      alert('Failed to delete room: ' + err.message);
    }
  };

  const handleUpdateRoom = (updatedRoom, latestRooms) => {
    // If modal provides the full updated rooms list (from toggle), use it directly
    if (latestRooms) {
      setRooms(latestRooms);
    } else {
      setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
    }
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId);
  // Normalize camelCase keys (livingRoom) → snake_case (living_room) to match Config room IDs
  const toSnake = (s) => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
  const roomData = Object.fromEntries(
    Object.entries(data?.rooms || {}).map(([k, v]) => [toSnake(k), v])
  );

  return (
    <div className={`flex flex-col transition-all duration-700 relative overflow-hidden rounded-[2.5rem] h-[600px] border-[3px] shadow-2xl
      ${isDark ? 'bg-slate-900 border-teal-500/40' : 'bg-white border-slate-200'}
    `}>
      {/* Header */}
      <div className={`px-8 py-4 backdrop-blur-3xl flex items-center justify-between shrink-0 border-b-[3px] relative transition-colors
        ${isDark ? 'bg-slate-800 border-teal-500/40' : 'bg-slate-50 border-slate-200'}
      `}>
        <div className="absolute top-0 left-0 w-2 h-full bg-teal-500" />
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 flex items-center justify-center border-2 border-teal-500/30 shadow-inner">
             <Home size={22} className="text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className={`text-sm font-black uppercase tracking-[0.2em] italic leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Digital Twin Dashboard</h2>
            <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isDark ? 'text-teal-400/70' : 'text-slate-500'}`}>Active Monitoring Matrix // Rev 4.0</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => { setEditMode(!editMode); setIsAdding(false); }}
             className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md ${editMode ? 'bg-amber-500 text-black shadow-amber-500/40' : isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
           >
             {editMode ? 'Finish Edit' : 'Edit Layout'}
           </button>
           <div className={`flex items-center gap-2 px-5 py-2 bg-teal-500/10 rounded-xl border-2 transition-colors ${isDark ? 'border-teal-500/40' : 'border-teal-500/20'}`}>
              <Activity size={14} className="text-teal-500 animate-pulse" />
              <span className="text-[11px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.1em]">Linked</span>
           </div>
        </div>
      </div>

      {/* Grid Container - Taller padding to avoid clipping */}
      <div className={`flex-1 overflow-y-auto p-8 custom-scrollbar transition-colors ${isDark ? 'bg-black/30' : 'bg-slate-50/50'}`}>
        <div className="flex flex-wrap gap-5 items-stretch justify-start">
          {loading ? (
            <div className="w-full py-20 text-center animate-pulse uppercase tracking-[0.4em] text-[14px] font-black text-teal-500/50">
              Initializing digital nodes...
            </div>
          ) : (
            <>
              {rooms.map(room => (
                <RoomMonitorTile 
                  key={room.id}
                  id={room.id}
                  label={room.label}
                  color={room.color}
                  data={roomData[room.id]}
                  editMode={editMode}
                  onClick={() => setActiveRoomId(room.id)}
                  onDelete={handleDeleteRoom}
                />
              ))}
              
              {isAdding ? (
                <div className={`flex flex-col rounded-2xl border-[3px] p-6 gap-4 animate-in fade-in zoom-in duration-300 flex-grow basis-[45%] h-[190px] shadow-2xl transition-colors ${isDark ? 'bg-slate-800 border-teal-500' : 'bg-white border-teal-500'}`}>
                  <input 
                    autoFocus
                    placeholder="Sector Name..."
                    className={`border-2 rounded-2xl px-4 py-3 text-sm font-black outline-none focus:border-teal-500 transition-all shadow-inner ${isDark ? 'bg-slate-900 border-teal-500/30 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmAddRoom()}
                  />
                  <div className="flex gap-3">
                    <button onClick={confirmAddRoom} className="flex-1 py-2 rounded-xl bg-teal-500 text-black text-[12px] font-black uppercase flex items-center justify-center gap-3 shadow-xl shadow-teal-500/40 hover:scale-105 transition-transform">
                      <Check size={16} /> Add
                    </button>
                    <button onClick={() => setIsAdding(false)} className={`flex-1 py-2 rounded-xl text-[12px] font-black uppercase flex items-center justify-center gap-3 transition-colors ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'}`}>
                      <X size={16} /> Cancel
                    </button>
                  </div>
                </div>
              ) : editMode && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-[3px] border-dashed p-8 transition-all group flex-grow basis-[45%] h-[190px] ${isDark ? 'bg-teal-500/5 border-teal-500/30 text-teal-400 hover:bg-teal-500/10 hover:border-teal-500/60' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-teal-500'}`}
                >
                  <Plus size={40} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[14px] font-black uppercase tracking-widest">Add New Sector</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className={`mx-6 mb-6 p-3 rounded-[1.5rem] border-[3px] flex items-center justify-between gap-6 shadow-xl transition-colors
        ${isDark ? 'bg-slate-800 border-teal-500/40 shadow-none' : 'bg-white border-slate-200'}
      `}>
         <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-[11px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 flex items-center gap-2">
               💡 System Insight
            </span>
            <span className={`text-[10px] font-black truncate tracking-tight uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Optimized grid signature detected. Recommended load shift.</span>
         </div>
         <button 
           onClick={handleRefresh}
           disabled={isRefreshing}
           className="px-5 py-2.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-500 text-white text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-teal-500/40 shrink-0 flex items-center gap-3"
         >
           <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
           {isRefreshing ? 'Analyzing...' : 'Optimize'}
         </button>
      </div>

      {/* Detail Modal Integration */}
      {activeRoomId && (
        <RoomDetailModal
          isOpen={true}
          onClose={() => setActiveRoomId(null)}
          room={activeRoom}
          data={roomData[activeRoomId]}
          onUpdate={handleUpdateRoom}
          allRooms={rooms}
        />
      )}
    </div>
  );
}
