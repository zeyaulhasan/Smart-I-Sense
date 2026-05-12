const SensorData = require('../models/SensorData');
const Config = require('../models/Config');
const { checkAnomalies } = require('./anomalyDetector');

const SYSTEM_MESSAGES = [
  'Sensor data received from ESP32-001',
  'Environmental scan complete — all zones nominal',
  'System health check: all sensors online',
  'Data pipeline processing complete',
  'ML model inference cycle complete',
  'Network latency: {latency}ms — within threshold',
  'Signal strength: {signal}dBm — excellent',
  'Firmware v2.4.1 — up to date',
  'Data integrity check: CRC32 passed',
  'MQTT broker connection stable — 0 dropped packets',
  'Edge compute node: CPU 12% | RAM 340MB',
  'Sensor calibration verified — accuracy ±0.3%',
  'Backup data sync to cloud: complete',
  'Power grid frequency: 50.02Hz — stable',
  'Water pressure sensor: 2.4 bar — normal range'
];

function getBaseElectricity() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return 450;
  if (hour >= 9 && hour < 12) return 300;
  if (hour >= 12 && hour < 14) return 350;
  if (hour >= 14 && hour < 17) return 280;
  if (hour >= 17 && hour < 20) return 620;
  if (hour >= 20 && hour < 23) return 480;
  return 180;
}

function getBaseWater() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return 5.5;
  if (hour >= 9 && hour < 12) return 2.0;
  if (hour >= 12 && hour < 14) return 4.0;
  if (hour >= 14 && hour < 17) return 1.5;
  if (hour >= 17 && hour < 20) return 4.5;
  if (hour >= 20 && hour < 23) return 3.0;
  return 0.8;
}

function addNoise(value, factor = 0.15) {
  return value * (1 + (Math.random() - 0.5) * 2 * factor);
}

/**
 * Generates sensor data based on dynamic room configuration.
 */
async function generateSensorData() {
  const config = await Config.findOne();
  if (!config) return null;

  const baseElec = getBaseElectricity();
  const baseWater = getBaseWater();

  let electricity = addNoise(baseElec);
  let water = addNoise(baseWater, 0.2);

  // 3% chance of an anomaly spike
  const isAnomaly = Math.random() < 0.03;
  if (isAnomaly) {
    electricity *= 1.8 + Math.random() * 0.5;
    if (Math.random() > 0.5) water *= 2.5;
  }

  // Calculate room distribution based on device nominal power
  const rooms = {};
  const totalNominalPower = config.rooms.reduce((sum, r) => 
    sum + r.devices.reduce((dSum, d) => dSum + (d.isActive !== false ? d.nominalPower : 0), 0), 0
  );

  config.rooms.forEach(room => {
    const roomNominalPower = room.devices.reduce((sum, d) => sum + (d.isActive !== false ? d.nominalPower : 0), 0);
    const elecRatio = totalNominalPower > 0 ? roomNominalPower / totalNominalPower : 1 / config.rooms.length;
    
    // Water ratio is more fixed for now, but could be dynamic too
    const waterRatioMap = { living_room: 0.05, bedroom: 0.05, kitchen: 0.35, bathroom: 0.55 };
    const waterRatio = waterRatioMap[room.id] || (1 / config.rooms.length);

    rooms[room.id] = {
      electricity: Math.round(addNoise(electricity * elecRatio, 0.1) * 10) / 10,
      water: Math.round(addNoise(water * waterRatio, 0.15) * 100) / 100
    };
  });

  return {
    timestamp: new Date(),
    electricity: Math.round(electricity * 10) / 10,
    water: Math.round(water * 100) / 100,
    rooms
  };
}

function generateFeedMessages(data) {
  const messages = [];
  const now = new Date();

  messages.push({
    id: `feed-${Date.now()}-0`,
    timestamp: now,
    type: 'data',
    message: `Electricity: ${data.electricity.toFixed(0)}W | Water: ${data.water.toFixed(1)} L/min`
  });

  const roomKeys = Object.keys(data.rooms);
  if (roomKeys.length > 0) {
    const room = roomKeys[Math.floor(Math.random() * roomKeys.length)];
    const roomData = data.rooms[room];
    const roomLabel = room.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const status = roomData.electricity > 300 ? 'warning' : 'info';

    messages.push({
      id: `feed-${Date.now()}-1`,
      timestamp: now,
      type: status,
      message: `${roomLabel}: ${roomData.electricity.toFixed(0)}W, ${roomData.water.toFixed(1)} L/min — ${status === 'warning' ? 'elevated' : 'normal'}`
    });
  }

  if (Math.random() < 0.3) {
    const template = SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)];
    const msg = template
      .replace('{latency}', Math.floor(12 + Math.random() * 8))
      .replace('{signal}', (-30 - Math.floor(Math.random() * 20)).toString());

    messages.push({
      id: `feed-${Date.now()}-2`,
      timestamp: now,
      type: 'system',
      message: msg
    });
  }

  return messages;
}

function startSimulator(io) {
  // Set DISABLE_SIMULATOR=true in backend/.env when real ESP32 hardware is connected
  if (process.env.DISABLE_SIMULATOR === 'true') {
    console.log('🔌 Simulator DISABLED — running in ESP32 hardware mode');
    return;
  }
  console.log('🔄 Real-time data simulator started (5s interval)');

  setInterval(async () => {
    try {
      const data = await generateSensorData();
      if (!data) return;

      const sensorData = new SensorData(data);
      await sensorData.save();

      io.emit('sensor-data', sensorData);

      const feedMessages = generateFeedMessages(data);
      feedMessages.forEach(msg => io.emit('live-feed', msg));

      await checkAnomalies(sensorData, io);
    } catch (error) {
      console.error('Simulator error:', error.message);
    }
  }, 5000);
}

module.exports = { startSimulator };
