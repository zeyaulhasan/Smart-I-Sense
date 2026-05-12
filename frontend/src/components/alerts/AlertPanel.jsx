import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AlertItem from './AlertItem';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';

export default function AlertPanel({ compact = false }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    api.get('/alerts?limit=20')
      .then(res => setAlerts(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onNew = (alert) => setAlerts(prev => [alert, ...prev].slice(0, 50));
    const onRes = (alert) => setAlerts(prev => prev.map(a => a._id === alert._id ? { ...a, resolved: true } : a));
    socket.on('alert', onNew);
    socket.on('alert-resolved', onRes);
    return () => { socket.off('alert', onNew); socket.off('alert-resolved', onRes); };
  }, [socket]);

  const handleResolve = async (id) => {
    try {
      await api.patch(`/alerts/${id}/resolve`);
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, resolved: true } : a));
    } catch { }
  };

  const displayAlerts = compact 
    ? alerts.filter(a => !a.resolved).slice(0, 5) 
    : alerts;

  return (
    <div className="card-base flex flex-col h-[450px]">
      <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
        <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-wide uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          Recent Alerts
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-transparent relative">
        {loading ? (
          <div className="p-5 text-sm text-[var(--text-muted)] text-center my-auto animate-pulse">Loading secure channels...</div>
        ) : displayAlerts.length === 0 ? (
          <div className="p-5 text-sm text-[var(--text-muted)] text-center my-auto">No unacknowledged alerts.</div>
        ) : (
          <div className="flex flex-col p-3 gap-2">
            <AnimatePresence initial={false}>
              {displayAlerts.map((alert) => (
                <motion.div
                  key={alert._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertItem alert={alert} onResolve={handleResolve} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
