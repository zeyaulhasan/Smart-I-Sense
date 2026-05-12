import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  error:   { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text: 'text-rose-400',    bar: 'bg-rose-500' },
  warning: { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   bar: 'bg-amber-500' },
  info:    { bg: 'bg-cyan-500/10',     border: 'border-cyan-500/30',    text: 'text-cyan-400',    bar: 'bg-cyan-500' },
};

export default function Toast({ id, type = 'info', message, duration = 4000, onDismiss }) {
  const [progress, setProgress] = useState(100);
  const Icon = ICONS[type] || ICONS.info;
  const color = COLORS[type] || COLORS.info;

  useEffect(() => {
    if (duration <= 0) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onDismiss(id);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border ${color.bg} ${color.border} backdrop-blur-xl shadow-lg`}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon size={18} className={`${color.text} shrink-0 mt-0.5`} />
        <p className="text-sm text-[var(--text-primary)] flex-1 leading-relaxed font-medium">{message}</p>
        <button
          onClick={() => onDismiss(id)}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
      {duration > 0 && (
        <div className="h-[2px] w-full bg-[var(--border-subtle)]">
          <div
            className={`h-full ${color.bar} transition-[width] duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}
