import { Home, Bed, Coffee, Bath } from 'lucide-react';

const ICONS = {
  living_room: Home,
  bedroom: Bed,
  kitchen: Coffee,
  bathroom: Bath
};

const LABELS = {
  living_room: 'Living Room',
  bedroom: 'Bedroom',
  kitchen: 'Kitchen',
  bathroom: 'Bathroom'
};

export default function RoomCard({ room, data, onClick }) {
  const Icon = ICONS[room] || Home;
  const label = LABELS[room] || room;
  const status = data?.status || 'normal';
  
  const elec = data?.electricity ? Math.round(data.electricity) : 0;
  const water = data?.water ? parseFloat(data.water).toFixed(1) : 0;
  
  const isDanger = status === 'critical';
  const isWarn = status === 'warning';

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 text-left min-w-0 shrink-0 group
        ${isDanger ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40' : 
          isWarn ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40' : 
          'bg-[var(--bg-active)] border-[var(--border-subtle)] hover:border-cyan-500/30 hover:bg-cyan-500/5'}
      `}
    >
      <div className="flex items-center gap-3.5 min-w-0 pr-2">
         <div className="w-10 h-10 rounded-xl shrink-0 bg-[var(--bg-page)] flex items-center justify-center border border-[var(--border-glass)] text-[var(--text-secondary)] group-hover:text-cyan-400 group-hover:scale-105 transition-all shadow-inner">
           <Icon size={18} />
         </div>
         <div className="flex flex-col min-w-0">
           <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors tracking-tight truncate">{label}</span>
           <span className="text-[10px] font-mono font-black text-[var(--text-muted)] tracking-wider uppercase mt-0.5">
             <span className="text-cyan-400">{elec}w</span> <span className="text-[var(--text-muted)] opacity-30 mx-1">|</span> <span className="text-emerald-400">{water}l/m</span>
           </span>
         </div>
      </div>
      <div className="shrink-0 pl-2">
         <div className={`w-2 h-2 rounded-full ring-4 ${isDanger ? 'bg-rose-500 ring-rose-500/20 animate-pulse' : isWarn ? 'bg-amber-400 ring-amber-400/20' : 'bg-emerald-400 ring-emerald-400/20'}`} />
      </div>
    </button>
  );
}
