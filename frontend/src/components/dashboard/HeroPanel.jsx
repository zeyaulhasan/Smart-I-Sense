import { Zap, Droplets, AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

function StatCard({ title, value, unit, icon: Icon, trend, colorClass, gradientClass, shadowClass, onClick }) {
  // Automatically reduce text size if value is a long word like "Warning"
  const isText = typeof value === 'string' && isNaN(Number(value));
  const textSizeClass = isText && value.length > 5 ? 'text-3xl' : 'text-4xl';

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClick}
      className={`card-base p-6 flex flex-col relative overflow-hidden group ${shadowClass} ${onClick ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
    >
      {/* Background glow decoration */}
      <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${gradientClass}`} />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl bg-[var(--border-subtle)] border border-[var(--border-glass)] shadow-inner transition-transform group-hover:rotate-12 ${colorClass}`}>
          <Icon size={18} />
        </div>
      </div>
      
      <div className="mt-auto flex items-baseline gap-1 relative z-10 pb-1">
        <h3 className={`${textSizeClass} font-bold tracking-tight text-[var(--text-primary)] drop-shadow-sm leading-none`}>{value}</h3>
        {unit && <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{unit}</span>}
      </div>
      
      {trend && (
        <p className="mt-3 text-xs font-medium text-[var(--text-muted)] flex items-center gap-1 relative z-10">{trend}</p>
      )}
    </motion.div>
  );
}

export default function HeroPanel({ data, alertCount = 0, onAlertClick }) {
  const elecRaw = data?.electricity ? Math.round(data.electricity) : '-';
  const waterRaw = data?.water ? parseFloat(data.water).toFixed(1) : '-';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
      <StatCard 
        title="Total Power" 
        value={elecRaw} 
        unit="W" 
        icon={Zap} 
        colorClass="text-cyan-500"
        gradientClass="bg-cyan-500"
        shadowClass="hover:shadow-[0_8px_32px_rgba(34,211,238,0.2)] hover:border-cyan-500/40"
      />
      <StatCard 
        title="Water Flow" 
        value={waterRaw} 
        unit="L/m" 
        icon={Droplets} 
        colorClass="text-emerald-400"
        gradientClass="bg-emerald-500"
        shadowClass="hover:shadow-[0_8px_32px_rgba(52,211,153,0.2)] hover:border-emerald-500/40"
      />
      <StatCard 
        title="Active Alerts" 
        value={alertCount} 
        icon={AlertTriangle} 
        colorClass="text-rose-500"
        gradientClass="bg-rose-500"
        shadowClass="hover:shadow-[0_8px_32px_rgba(244,63,94,0.2)] hover:border-rose-500/40"
        onClick={onAlertClick}
      />
      <StatCard 
        title="System Status" 
        value={alertCount === 0 ? 'Healthy' : 'Warning'} 
        icon={Activity} 
        colorClass={alertCount === 0 ? "text-emerald-400" : "text-amber-400"}
        gradientClass={alertCount === 0 ? "bg-emerald-500" : "bg-amber-500"}
        shadowClass={alertCount === 0 ? "hover:shadow-[0_8px_32px_rgba(52,211,153,0.2)] hover:border-emerald-500/40" : "hover:shadow-[0_8px_32px_rgba(251,191,36,0.2)] hover:border-amber-500/40"}
      />
    </div>
  );
}
