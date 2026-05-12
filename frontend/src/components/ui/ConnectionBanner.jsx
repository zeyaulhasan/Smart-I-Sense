import { WifiOff } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConnectionBanner() {
  const { isConnected } = useSocket();

  return (
    <AnimatePresence>
      {!isConnected && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2.5 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-wider">
            <WifiOff size={14} className="animate-pulse" />
            Real-time connection lost — attempting to reconnect...
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
