import { X, Zap, Droplets } from 'lucide-react';
import { formatWatts, formatWater, roomLabel } from '../../utils/helpers';

export default function RoomDetailPanel({ roomKey, data, onClose }) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{roomLabel(roomKey)}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5 bg-transparent">
           <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Status</span>
              <span className={`badge ${data.status === 'critical' ? 'badge-red' : data.status === 'warning' ? 'badge-amber' : 'badge-green'} capitalize`}>
                {data.status || 'Normal'}
              </span>
           </div>

           <div className="grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] pt-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)] mb-1">
                  <Zap size={14} />
                  <span className="text-xs font-medium uppercase">Power</span>
                </div>
                <div className="text-2xl font-semibold text-blue-500 font-mono tracking-tight">
                  {formatWatts(data.electricity)}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)] mb-1">
                  <Droplets size={14} />
                  <span className="text-xs font-medium uppercase">Water</span>
                </div>
                <div className="text-2xl font-semibold text-emerald-500 font-mono tracking-tight">
                  {formatWater(data.water)}
                </div>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-active)] flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
