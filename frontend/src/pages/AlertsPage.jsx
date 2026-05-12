import { useState, useEffect } from 'react';
import { Bell, Search, Zap, Droplets, ShieldAlert, CheckCircle2 } from 'lucide-react';
import AlertItem from '../components/alerts/AlertItem';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/ToastProvider';
import api from '../utils/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { socket } = useSocket();
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (filter === 'active')   params.set('resolved', 'false');
    if (filter === 'resolved') params.set('resolved', 'true');
    if (typeFilter !== 'all')  params.set('type', typeFilter);
    
    api.get(`/alerts?${params}`)
      .then(res => setAlerts(res.data || []))
      .catch(() => toast.error('Failed to load alerts'))
      .finally(() => setLoading(false));
  }, [filter, typeFilter]);

  useEffect(() => {
    if (!socket) return;
    const onNew = a => setAlerts(p => [a, ...p]);
    const onRes = a => setAlerts(p => p.map(x => x._id === a._id ? { ...x, resolved: true } : x));
    socket.on('alert', onNew);
    socket.on('alert-resolved', onRes);
    return () => { socket.off('alert', onNew); socket.off('alert-resolved', onRes); };
  }, [socket]);

  const handleResolve = async id => {
    try {
      await api.patch(`/alerts/${id}/resolve`);
      setAlerts(p => p.map(a => a._id === id ? { ...a, resolved: true } : a));
      toast.success('Alert resolved');
    } catch {
      toast.error('Failed to resolve alert');
    }
  };

  const filtered = alerts.filter(a => search ? a.message.toLowerCase().includes(search.toLowerCase()) : true);
  const activeCount   = alerts.filter(a => !a.resolved).length;
  const criticalCount = alerts.filter(a => !a.resolved && a.severity === 'critical').length;
  const resolvedCount = alerts.filter(a => a.resolved).length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <Bell size={24} className="text-amber-500" />
            Alerts & Logs
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{activeCount} active · {alerts.length} total</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-base p-4 flex items-center justify-between">
          <div>
             <div className="text-xs text-[var(--text-secondary)] mb-1">Total</div>
             <div className="text-2xl font-semibold text-cyan-500 font-mono tracking-tight">{alerts.length}</div>
          </div>
        </div>
        <div className="card-base p-4 flex items-center justify-between">
          <div>
             <div className="text-xs text-[var(--text-secondary)] mb-1">Active</div>
             <div className="text-2xl font-semibold text-amber-500 font-mono tracking-tight">{activeCount}</div>
          </div>
          <Bell size={16} className="text-amber-500 opacity-60" />
        </div>
        <div className="card-base p-4 flex items-center justify-between">
          <div>
             <div className="text-xs text-[var(--text-secondary)] mb-1">Critical</div>
             <div className="text-2xl font-semibold text-red-500 font-mono tracking-tight">{criticalCount}</div>
          </div>
          <ShieldAlert size={16} className="text-red-500 opacity-50" />
        </div>
        <div className="card-base p-4 flex items-center justify-between">
          <div>
             <div className="text-xs text-[var(--text-secondary)] mb-1">Resolved</div>
             <div className="text-2xl font-semibold text-emerald-500 font-mono tracking-tight">{resolvedCount}</div>
          </div>
          <CheckCircle2 size={16} className="text-emerald-500 opacity-50" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-[var(--bg-active)] border border-[var(--border-glass)] p-1 rounded-md shrink-0 self-start">
          <button onClick={() => setFilter('all')} className={`pill-tab ${filter==='all'?'active':''}`}>All</button>
          <button onClick={() => setFilter('active')} className={`pill-tab ${filter==='active'?'active':''}`}>Active</button>
          <button onClick={() => setFilter('resolved')} className={`pill-tab ${filter==='resolved'?'active':''}`}>Resolved</button>
        </div>
        
        <div className="flex bg-[var(--bg-active)] border border-[var(--border-glass)] p-1 rounded-md shrink-0 self-start">
          <button onClick={() => setTypeFilter('all')} className={`pill-tab ${typeFilter==='all'?'active':''}`}>All Types</button>
          <button onClick={() => setTypeFilter('electricity')} className={`pill-tab flex gap-1 items-center ${typeFilter==='electricity'?'active':''}`}><Zap size={10}/>Elec</button>
          <button onClick={() => setTypeFilter('water')} className={`pill-tab flex gap-1 items-center ${typeFilter==='water'?'active':''}`}><Droplets size={10}/>Water</button>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Search alerts..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-active)] border border-[var(--border-glass)] rounded-md py-1.5 pl-8 pr-3 text-sm outline-none focus:border-[var(--border-focus)] text-[var(--text-primary)] h-full placeholder:text-[var(--text-muted)] transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="card-base flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8 text-sm text-[var(--text-muted)]">Loading alerts...</div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 text-sm text-[var(--text-muted)]">No alerts found matching filters.</div>
        ) : (
          <div className="flex flex-col">
            {filtered.map(alert => <AlertItem key={alert._id} alert={alert} onResolve={handleResolve} />)}
          </div>
        )}
      </div>
    </div>
  );
}
