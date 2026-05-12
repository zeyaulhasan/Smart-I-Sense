import { useState } from 'react';
import {
  Plus, Trash2, Edit3, Save, X, Zap, Droplets, ChevronRight,
  Home, Utensils, Bed, Bath, Sofa, Lamp, Car, TreePine, Warehouse,
  Dumbbell, Gamepad2, BookOpen, Monitor, Shirt, Baby, Dog, Wrench,
  Power, ToggleLeft, ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Auto Icon Resolver ─── */
const ICON_KEYWORDS = [
  { keywords: ['living', 'lounge', 'family', 'sitting'],                    icon: Sofa },
  { keywords: ['kitchen', 'cook', 'pantry', 'dining'],                      icon: Utensils },
  { keywords: ['bed', 'master', 'sleep', 'guest_room'],                     icon: Bed },
  { keywords: ['bath', 'wash', 'toilet', 'restroom', 'shower'],             icon: Bath },
  { keywords: ['garage', 'parking', 'car', 'vehicle'],                      icon: Car },
  { keywords: ['garden', 'yard', 'lawn', 'terrace', 'patio', 'balcony'],    icon: TreePine },
  { keywords: ['basement', 'cellar', 'storage', 'attic', 'warehouse'],      icon: Warehouse },
  { keywords: ['gym', 'fitness', 'exercise', 'workout'],                    icon: Dumbbell },
  { keywords: ['game', 'play', 'entertainment', 'media'],                   icon: Gamepad2 },
  { keywords: ['study', 'office', 'library', 'work'],                       icon: BookOpen },
  { keywords: ['server', 'computer', 'tech', 'lab'],                        icon: Monitor },
  { keywords: ['laundry', 'cloth', 'wardrobe', 'closet'],                   icon: Shirt },
  { keywords: ['nursery', 'kid', 'child', 'baby'],                          icon: Baby },
  { keywords: ['pet', 'dog', 'cat'],                                        icon: Dog },
  { keywords: ['utility', 'tool', 'maintenance'],                           icon: Wrench },
  { keywords: ['hall', 'corridor', 'lobby'],                                icon: Lamp },
];

function getRoomIcon(id, label) {
  const s = `${id} ${label}`.toLowerCase();
  for (const e of ICON_KEYWORDS) { if (e.keywords.some(k => s.includes(k))) return e.icon; }
  return Home;
}

/* ─── Colors ─── */
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

/* ═══════════════════════════════════════════
   ▍ ROOM MANAGER
   ═══════════════════════════════════════════ */
export default function RoomManager({ rooms, onSave, saving }) {
  const [selected, setSelected]     = useState(null);   // room id being edited or viewed
  const [editData, setEditData]     = useState(null);   // mutable copy during edit
  const [deleting, setDeleting]     = useState(null);   // room id pending deletion
  const [showAdd, setShowAdd]       = useState(false);
  const [newRoom, setNewRoom]       = useState({ id: '', label: '', color: 'teal', elecThreshold: 400, waterThreshold: 6, devices: [] });

  /* ── Handlers ── */
  const startEdit = (room) => { setEditData({ ...room, devices: [...(room.devices || [])] }); setSelected(room.id); };
  const cancelEdit = () => { setEditData(null); };
  const saveEdit = () => { if (!editData) return; onSave(rooms.map(r => r.id === editData.id ? editData : r)); setEditData(null); };
  const confirmDelete = (id) => { onSave(rooms.filter(r => r.id !== id)); setDeleting(null); if (selected === id) setSelected(null); };
  const addRoom = () => {
    if (!newRoom.id.trim() || !newRoom.label.trim() || rooms.some(r => r.id === newRoom.id)) return;
    onSave([...rooms, { ...newRoom }]);
    setNewRoom({ id: '', label: '', color: 'teal', elecThreshold: 400, waterThreshold: 6, devices: [] });
    setShowAdd(false);
  };

  const isEditing = (id) => editData?.id === id;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Room List ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {rooms.map(room => {
          const cur    = isEditing(room.id) ? editData : room;
          const Icon   = getRoomIcon(cur.id, cur.label);
          const color  = hex(cur.color);
          const active = selected === room.id;

          return (
            <motion.div
              key={room.id}
              layout
              className={`relative rounded-[2rem] border-[3px] transition-all duration-300 cursor-pointer overflow-hidden group ${
                isEditing(room.id)
                  ? 'border-cyan-500 bg-[var(--bg-card)] shadow-[0_0_40px_rgba(34,211,238,0.15)] col-span-full'
                  : deleting === room.id
                    ? 'border-rose-500/50 bg-rose-500/[0.05]'
                    : active
                      ? 'border-cyan-500/50 bg-[var(--bg-card)] shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-card)]/30 hover:border-cyan-500/30 hover:shadow-lg'
              }`}
              onClick={() => !isEditing(room.id) && deleting !== room.id && setSelected(active ? null : room.id)}
            >
              {/* ─ Delete Confirmation ─ */}
              {deleting === room.id && (
                <div className="p-5 flex flex-col items-center justify-center gap-3 text-center min-h-[120px]">
                  <Trash2 size={20} className="text-rose-400" />
                  <p className="text-xs text-[var(--text-secondary)]">
                    Delete <strong className="text-[var(--text-primary)]">{cur.label}</strong>?
                  </p>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); confirmDelete(room.id); }}
                      className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors">
                      Delete
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleting(null); }}
                      className="px-4 py-1.5 rounded-lg text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-active)] transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ─ Normal Card ─ */}
              {deleting !== room.id && !isEditing(room.id) && (
                <div className="p-6 flex flex-col gap-4">
                  {/* Top Row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-inner"
                        style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}>
                        <Icon size={20} style={{ color }} className="animate-pulse-slow" />
                      </div>
                      <div>
                        <div className="text-[14px] font-black uppercase tracking-widest text-[var(--text-primary)] leading-tight">{cur.label}</div>
                        <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] mt-1">Node: {cur.id}</div>
                      </div>
                    </div>
                    {/* Actions on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => startEdit(room)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors" aria-label="Edit">
                        <Edit3 size={13} />
                      </button>
                      <button onClick={() => setDeleting(room.id)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors" aria-label="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Stats Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400/80 bg-amber-500/8 rounded-md px-2 py-1">
                      <Zap size={9} /> {cur.elecThreshold}W
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-400/80 bg-cyan-500/8 rounded-md px-2 py-1">
                      <Droplets size={9} /> {cur.waterThreshold}L/m
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] ml-auto font-medium">
                      {(cur.devices || []).length} device{(cur.devices || []).length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Device Preview (collapsed) */}
                  {(cur.devices || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[var(--border-subtle)]">
                      {(cur.devices || []).slice(0, 4).map((d, i) => (
                        <span key={i} className={`text-[9px] font-medium px-2 py-0.5 rounded-md ${
                          d.isActive !== false
                            ? 'bg-[var(--bg-active)] text-[var(--text-secondary)]'
                            : 'bg-[var(--bg-active)]/50 text-[var(--text-muted)] line-through'
                        }`}>
                          {d.name}
                        </span>
                      ))}
                      {(cur.devices || []).length > 4 && (
                        <span className="text-[9px] text-[var(--text-muted)] px-1 py-0.5">+{(cur.devices || []).length - 4} more</span>
                      )}
                    </div>
                  )}

                  {/* Expand Indicator */}
                  <div className="flex items-center justify-center">
                    <ChevronRight size={12} className={`text-[var(--text-muted)] transition-transform ${active ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              )}

              {/* ─ Edit Mode (full width) ─ */}
              {isEditing(room.id) && (
                <EditPanel
                  data={editData}
                  setData={setEditData}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  saving={saving}
                />
              )}
            </motion.div>
          );
        })}

        {/* Add Button */}
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-[2rem] border-[3px] border-dashed border-[var(--border-subtle)] flex flex-col items-center justify-center gap-4 py-10 text-[var(--text-muted)] hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/[0.05] transition-all min-h-[160px] group"
          >
            <Plus size={32} className="group-hover:scale-110 transition-transform duration-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Deploy New Node</span>
          </button>
        )}
      </div>

      {/* ── Add Room Form ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-cyan-500/20 bg-[var(--bg-card)] p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">New Room</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InputField label="ID" value={newRoom.id} onChange={v => setNewRoom({ ...newRoom, id: v.toLowerCase().replace(/\s+/g, '_') })} placeholder="basement" />
              <InputField label="Name" value={newRoom.label} onChange={v => setNewRoom({ ...newRoom, label: v })} placeholder="Basement" />
              <InputField label="Elec (W)" value={newRoom.elecThreshold} onChange={v => setNewRoom({ ...newRoom, elecThreshold: Number(v) })} type="number" />
              <InputField label="Water (L/m)" value={newRoom.waterThreshold} onChange={v => setNewRoom({ ...newRoom, waterThreshold: Number(v) })} type="number" step="0.1" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Color</span>
              <div className="flex gap-1.5">
                {COLORS.map(c => (
                  <button key={c.key} onClick={() => setNewRoom({ ...newRoom, color: c.key })}
                    className={`w-5 h-5 rounded-md transition-all ${newRoom.color === c.key ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-card)] scale-110' : 'opacity-40 hover:opacity-80'}`}
                    style={{ backgroundColor: c.hex }} />
                ))}
              </div>
            </div>
            <button onClick={addRoom}
              disabled={!newRoom.id.trim() || !newRoom.label.trim() || rooms.some(r => r.id === newRoom.id)}
              className="self-start inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all disabled:opacity-30 disabled:shadow-none">
              <Plus size={13} /> Create Room
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ▍ EDIT PANEL (inline, full-width)
   ═══════════════════════════════════════════ */
function EditPanel({ data, setData, onSave, onCancel, saving }) {
  const [newDevName, setNewDevName] = useState('');
  const [newDevPower, setNewDevPower] = useState(100);
  const [addingDev, setAddingDev] = useState(false);
  const Icon = getRoomIcon(data.id, data.label);
  const color = hex(data.color);

  const addDevice = () => {
    if (!newDevName.trim()) return;
    setData({ ...data, devices: [...(data.devices || []), { name: newDevName, nominalPower: newDevPower, isActive: true }] });
    setNewDevName(''); setNewDevPower(100); setAddingDev(false);
  };
  const removeDevice = (i) => setData({ ...data, devices: data.devices.filter((_, idx) => idx !== i) });
  const toggleDevice = (i) => setData({ ...data, devices: data.devices.map((d, idx) => idx === i ? { ...d, isActive: !d.isActive } : d) });
  const toggleAllDevices = () => {
    const allOn = data.devices.every(d => d.isActive !== false);
    setData({ ...data, devices: data.devices.map(d => ({ ...d, isActive: !allOn })) });
  };

  return (
    <div className="p-8 flex flex-col gap-8 bg-cyan-500/[0.02] border-t-[3px] border-[var(--border-subtle)]" onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-inner" style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}>
            <Icon size={20} style={{ color }} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] font-black text-[var(--text-muted)] mb-1">Editing Node Matrix</div>
            <input value={data.label} onChange={e => setData({ ...data, label: e.target.value })}
              className="text-lg font-black uppercase tracking-widest text-[var(--text-primary)] bg-transparent border-b-[3px] border-dashed border-[var(--border-focus)] outline-none pb-1 w-48 focus:border-cyan-500" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onSave} disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors disabled:opacity-50">
            <Save size={12} /> Save
          </button>
          <button onClick={onCancel}
            className="px-3 py-2 rounded-lg text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors">
            Cancel
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[9px] uppercase font-bold tracking-widest text-[var(--text-muted)] mb-2 block">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button key={c.key} onClick={() => setData({ ...data, color: c.key })}
                className={`w-7 h-7 rounded-lg transition-all ${data.color === c.key ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-card)] scale-110' : 'opacity-35 hover:opacity-80'}`}
                style={{ backgroundColor: c.hex }} />
            ))}
          </div>
        </div>
        <InputField label="Electricity Threshold (W)" value={data.elecThreshold} onChange={v => setData({ ...data, elecThreshold: Number(v) })} type="number" />
        <InputField label="Water Threshold (L/min)" value={data.waterThreshold} onChange={v => setData({ ...data, waterThreshold: Number(v) })} type="number" step="0.1" />
      </div>

      {/* Devices */}
      <div className="border-t border-[var(--border-subtle)] pt-4">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={toggleAllDevices}
            className="text-[11px] uppercase font-black tracking-[0.2em] text-[var(--text-muted)] flex items-center gap-3 hover:text-cyan-400 transition-all group/toggle active:scale-95"
            title="Toggle All Devices"
          >
            <div className="p-2 rounded-lg bg-[var(--bg-active)] group-hover/toggle:bg-cyan-500/20 group-hover/toggle:text-cyan-400 transition-colors border-2 border-transparent group-hover/toggle:border-cyan-500/30">
              <Power size={16} className={data.devices?.every(d => d.isActive !== false) ? 'text-emerald-400' : ''} />
            </div>
            Devices ({(data.devices || []).length})
          </button>
          {!addingDev && (
            <button onClick={() => setAddingDev(true)} className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
              <Plus size={11} /> Add
            </button>
          )}
        </div>

        {(data.devices || []).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {data.devices.map((d, i) => {
              const on = d.isActive !== false;
              return (
                <div key={i} className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest group transition-all border-[3px] ${
                  on ? 'bg-[var(--bg-active)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-cyan-500/30 shadow-md'
                     : 'bg-[var(--bg-active)]/40 text-[var(--text-muted)] border-transparent line-through opacity-50'
                }`}>
                  <Zap size={9} className={on ? 'text-cyan-400' : 'text-[var(--text-muted)]'} />
                  {d.name}
                  <span className="text-[9px] font-mono text-[var(--text-muted)]">{d.nominalPower}W</span>
                  <button onClick={() => toggleDevice(i)} className="text-[var(--text-muted)] hover:text-cyan-400 transition-colors ml-0.5">
                    {on ? <ToggleRight size={14} className="text-cyan-400" /> : <ToggleLeft size={14} />}
                  </button>
                  <button onClick={() => removeDevice(i)} className="text-[var(--text-muted)] hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                    <X size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {addingDev && (
          <div className="flex items-center gap-2">
            <input value={newDevName} onChange={e => setNewDevName(e.target.value)} placeholder="Device name"
              className="flex-1 bg-[var(--bg-active)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-cyan-500/40 placeholder:text-[var(--text-muted)]"
              autoFocus onKeyDown={e => e.key === 'Enter' && addDevice()} />
            <input type="number" value={newDevPower} onChange={e => setNewDevPower(Number(e.target.value))} placeholder="W"
              className="w-20 bg-[var(--bg-active)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-cyan-500/40" />
            <button onClick={addDevice} disabled={!newDevName.trim()} className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-30 px-2">Add</button>
            <button onClick={() => setAddingDev(false)} className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1">✕</button>
          </div>
        )}

        {(data.devices || []).length === 0 && !addingDev && (
          <p className="text-[10px] text-[var(--text-muted)]">No devices added yet. Click "Add" to configure devices for this room.</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ▍ Shared Input
   ═══════════════════════════════════════════ */
function InputField({ label, value, onChange, type = 'text', placeholder, step }) {
  return (
    <div>
      <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[var(--text-muted)] mb-2 block">{label}</label>
      <input
        type={type} step={step} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[var(--bg-active)] border-[3px] border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-black text-[var(--text-primary)] outline-none focus:border-cyan-500/50 placeholder:text-[var(--text-muted)] transition-colors shadow-inner"
      />
    </div>
  );
}
