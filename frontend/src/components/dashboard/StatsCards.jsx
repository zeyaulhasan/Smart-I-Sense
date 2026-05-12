import { motion } from 'framer-motion';
import { Zap, Droplets, AlertTriangle, Activity } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { formatWater } from '../../utils/helpers';

const cards = (data, alertCount) => [
  {
    label: 'Total Power',
    value: data?.electricity ? `${Math.round(data.electricity)}W` : '—',
    sub: data?.electricity > 400 ? 'High load' : 'Normal',
    subOk: !(data?.electricity > 400),
    Icon: Zap,
    accent: '#00e5ff',
    glow: 'rgba(0,229,255,0.18)',
    gradFrom: 'rgba(0,229,255,0.08)',
    gradTo: 'rgba(0,229,255,0.02)',
    iconBg: 'rgba(0,229,255,0.1)',
  },
  {
    label: 'Water Flow',
    value: formatWater(data?.water),
    sub: data?.water > 4 ? 'High flow' : 'Normal',
    subOk: !(data?.water > 4),
    Icon: Droplets,
    accent: '#00ff9d',
    glow: 'rgba(0,255,157,0.18)',
    gradFrom: 'rgba(0,255,157,0.08)',
    gradTo: 'rgba(0,255,157,0.02)',
    iconBg: 'rgba(0,255,157,0.1)',
  },
  {
    label: 'Active Alerts',
    value: alertCount.toString(),
    sub: alertCount > 0 ? `${alertCount} pending` : 'All clear',
    subOk: alertCount === 0,
    Icon: AlertTriangle,
    accent: alertCount > 0 ? '#ffb830' : '#00ff9d',
    glow: alertCount > 0 ? 'rgba(255,184,48,0.18)' : 'rgba(0,255,157,0.18)',
    gradFrom: alertCount > 0 ? 'rgba(255,184,48,0.08)' : 'rgba(0,255,157,0.08)',
    gradTo: 'rgba(0,0,0,0)',
    iconBg: alertCount > 0 ? 'rgba(255,184,48,0.1)' : 'rgba(0,255,157,0.1)',
  },
  {
    label: 'System Health',
    value: '98.7%',
    sub: 'Excellent',
    subOk: true,
    Icon: Activity,
    accent: '#bd6eff',
    glow: 'rgba(189,110,255,0.18)',
    gradFrom: 'rgba(189,110,255,0.08)',
    gradTo: 'rgba(189,110,255,0.02)',
    iconBg: 'rgba(189,110,255,0.1)',
  },
];

export default function StatsCards({ data, alertCount = 0 }) {
  const { isDark } = useTheme();
  const items = cards(data, alertCount);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {items.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.4, ease: 'easeOut' }}
          className="kpi-card p-4 cursor-default"
          style={{
            boxShadow: `0 4px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}
        >
          {/* Accent colour band at top */}
          <div
            className="absolute inset-x-0 top-0 h-[2px] rounded-t-[20px]"
            style={{ background: `linear-gradient(90deg, ${c.accent}, transparent)` }}
          />

          {/* Glow blob */}
          <div
            className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none"
            style={{ background: c.glow, opacity: 0.6 }}
          />

          <div className="relative flex items-center justify-between mb-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: c.iconBg, border: `1px solid ${c.accent}22` }}
            >
              <c.Icon size={16} style={{ color: c.accent }} />
            </div>

            {/* Live dot */}
            <div className="flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: c.accent }}
              />
              <span className="text-[9px] font-mono" style={{ color: c.accent }}>
                LIVE
              </span>
            </div>
          </div>

          {/* Number */}
          <div
            className="text-2xl font-bold tracking-tight leading-none mb-1.5 font-mono"
            style={{ color: c.accent }}
          >
            {c.value}
          </div>

          {/* Label + sub */}
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: isDark ? 'rgba(148,163,184,0.7)' : '#64748b' }}
            >
              {c.label}
            </span>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{
                color: c.subOk ? '#00ff9d' : '#ffb830',
                background: c.subOk ? 'rgba(0,255,157,0.1)' : 'rgba(255,184,48,0.1)',
              }}
            >
              {c.sub}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
