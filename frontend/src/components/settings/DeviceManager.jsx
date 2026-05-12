import { useState } from 'react';
import { Plus, Trash2, Zap, Power, ToggleLeft, ToggleRight } from 'lucide-react';

export default function DeviceManager({ devices, onChange, readOnly }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', nominalPower: 100, icon: 'Zap', isActive: true });

  const handleAdd = () => {
    if (!newDevice.name.trim()) return;
    onChange([...devices, { ...newDevice }]);
    setNewDevice({ name: '', nominalPower: 100, icon: 'Zap', isActive: true });
    setShowAdd(false);
  };

  const handleRemove = (index) => {
    onChange(devices.filter((_, i) => i !== index));
  };

  const handleToggle = (index) => {
    const updated = devices.map((d, i) => i === index ? { ...d, isActive: !d.isActive } : d);
    onChange(updated);
  };

  if (devices.length === 0 && readOnly) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] py-1">
        <Power size={11} />
        No devices configured
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
        <Power size={10} /> Devices ({devices.length})
      </div>

      {devices.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {devices.map((device, i) => {
            const active = device.isActive !== false;
            return (
              <div
                key={i}
                className={`inline-flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs transition-all group ${
                  active
                    ? 'bg-cyan-500/8 border border-cyan-500/15 text-[var(--text-primary)]'
                    : 'bg-[var(--border-subtle)]/50 border border-transparent text-[var(--text-muted)] line-through opacity-60'
                }`}
              >
                <Zap size={10} className={active ? 'text-cyan-400' : 'text-[var(--text-muted)]'} />
                <span className="font-medium">{device.name}</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">{device.nominalPower}W</span>
                
                {!readOnly && (
                  <>
                    <button
                      onClick={() => handleToggle(i)}
                      className="ml-1 text-[var(--text-muted)] hover:text-cyan-400 transition-colors"
                      aria-label={active ? 'Deactivate device' : 'Activate device'}
                    >
                      {active ?
                        <ToggleRight size={16} className="text-cyan-400" /> :
                        <ToggleLeft size={16} />
                      }
                    </button>
                    <button
                      onClick={() => handleRemove(i)}
                      className="text-[var(--text-muted)] hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Remove device"
                    >
                      <Trash2 size={11} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!readOnly && (
        <>
          {showAdd ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                value={newDevice.name}
                onChange={e => setNewDevice({ ...newDevice, name: e.target.value })}
                placeholder="Device name"
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-cyan-500/50 placeholder:text-[var(--text-muted)] transition-colors"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <input
                type="number"
                value={newDevice.nominalPower}
                onChange={e => setNewDevice({ ...newDevice, nominalPower: Number(e.target.value) })}
                placeholder="W"
                className="w-20 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-cyan-500/50 transition-colors"
              />
              <button onClick={handleAdd} disabled={!newDevice.name.trim()} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-30 px-2 py-1.5 transition-colors">
                Add
              </button>
              <button onClick={() => setShowAdd(false)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1 py-1.5 transition-colors">
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="self-start inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-cyan-400 transition-colors mt-1"
            >
              <Plus size={12} /> Add Device
            </button>
          )}
        </>
      )}
    </div>
  );
}
