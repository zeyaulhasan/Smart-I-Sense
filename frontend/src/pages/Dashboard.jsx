import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import HeroPanel from '../components/dashboard/HeroPanel';
import DigitalTwin from '../components/dashboard/DigitalTwin';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import PredictionChart from '../components/charts/PredictionChart';
import AlertPanel from '../components/alerts/AlertPanel';
import AlertsModal from '../components/alerts/AlertsModal';
import AIInsightsPanel from '../components/ai/AIInsightsPanel';
import LiveFeed from '../components/dashboard/LiveFeed';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/ToastProvider';
import api from '../utils/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

export default function Dashboard() {
  const [latestData, setLatestData] = useState(null);
  const [realtimeData, setRealtimeData] = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const { socket } = useSocket();
  const toast = useToast();

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [latestRes, alertRes] = await Promise.all([
          api.get('/latest'),
          api.get('/alerts?resolved=false&limit=50'),
        ]);
        // The API interceptor returns response.data directly, which is { success, data }
        setLatestData(latestRes?.data || latestRes);
        // The API returns { success, data, unresolvedCount }
        setAlertCount(alertRes?.unresolvedCount || 0);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onSensor = (data) => { 
      setLatestData(data); 
      setRealtimeData(data); 
    };
    const onAlert  = () => setAlertCount(p => p + 1);
    const onRes    = () => setAlertCount(p => Math.max(0, p - 1));
    
    socket.on('sensor-data', onSensor);
    socket.on('alert', onAlert);
    socket.on('alert-resolved', onRes);
    
    return () => {
      socket.off('sensor-data', onSensor);
      socket.off('alert', onAlert);
      socket.off('alert-resolved', onRes);
    };
  }, [socket]);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5 w-full max-w-full"
    >
      
      {/* Row 1: KPI Stats Grid */}
      <motion.div variants={itemVariants}>
        <HeroPanel 
          data={latestData} 
          alertCount={alertCount} 
          onAlertClick={() => setIsAlertsModalOpen(true)}
        />
      </motion.div>
 
      {/* Tier 1: Digital Twin & Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <motion.div variants={itemVariants} className="xl:col-span-8 flex flex-col min-w-0">
          <DigitalTwin data={latestData} />
        </motion.div>
        <motion.div variants={itemVariants} className="xl:col-span-4 flex flex-col min-w-0">
          <LiveFeed />
        </motion.div>
      </div>

      {/* Tier 2: Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <motion.div variants={itemVariants} className="flex flex-col min-w-0">
          <TimeSeriesChart realtimeData={realtimeData} />
        </motion.div>
        <motion.div variants={itemVariants} className="flex flex-col min-w-0">
          <PredictionChart />
        </motion.div>
      </div>

      {/* Tier 3: Logistics & Insights */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <AIInsightsPanel />
        <AlertPanel />
      </motion.div>

      <AlertsModal 
        isOpen={isAlertsModalOpen} 
        onClose={() => setIsAlertsModalOpen(false)} 
        onResolve={() => setAlertCount(p => Math.max(0, p - 1))}
      />

    </motion.div>
  );
}
