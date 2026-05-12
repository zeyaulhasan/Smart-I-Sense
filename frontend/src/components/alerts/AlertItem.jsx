import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

export default function AlertItem({ alert, onResolve }) {
  const getIcon = () => {
    switch(alert.severity) {
      case 'critical': return <ShieldAlert size={16} className="text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />;
      default: return <Info size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />;
    }
  };

  return (
    <div className={`p-4 border-b border-[var(--border-subtle)] min-w-0 last:border-0 ${alert.resolved ? 'opacity-50' : 'bg-[var(--border-glass)] rounded-lg border-none shadow-sm mb-2'}`}>
      <div className="flex gap-3 min-w-0">
        <div className="mt-0.5 shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1 leading-snug truncate whitespace-normal">
            {alert.message}
          </p>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
            <span className="uppercase">{alert.type}</span>
            <span>·</span>
            <span>{formatDistanceToNow(new Date(alert.timestamp))} ago</span>
          </div>
        </div>
        {!alert.resolved && (
          <div className="shrink-0 flex items-center pr-2">
             <button 
              onClick={() => onResolve(alert._id)}
              className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded transition-colors"
            >
              Resolve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
