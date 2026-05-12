const { Aedes } = require('aedes');
const aedes = new Aedes();
const net = require('net');
const mqtt = require('mqtt');
const SensorData = require('../models/SensorData');
const { checkAnomalies } = require('./anomalyDetector');

// 1. Setup Aedes MQTT Broker
function startMqttBroker() {
  const PORT = process.env.MQTT_PORT || 1883;
  const server = net.createServer(aedes.handle);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  MQTT port ${PORT} already in use — using existing broker`);
    } else {
      console.error('MQTT Broker Error:', err.message);
    }
  });

  server.listen(PORT, function () {
    console.log(`🔌 MQTT Broker running on port ${PORT}`);
  });

  aedes.on('client', (client) => {
    console.log(`📡 Hardware Client Connected: ${client.id}`);
  });

  aedes.on('clientDisconnect', (client) => {
    console.log(`📡 Hardware Client Disconnected: ${client.id}`);
  });
}

// 2. Setup Internal MQTT Client to consume physical sensor data
function startMqttClient(io) {
  const PORT = process.env.MQTT_PORT || 1883;
  const client = mqtt.connect(`mqtt://localhost:${PORT}`);

  client.on('connect', () => {
    console.log('🔗 Backend Subscribed to MQTT Broker');
    client.subscribe('smartisense/+/sensors', (err) => {
      if (err) console.error('MQTT Subscription Error:', err);
    });
  });

  client.on('message', async (topic, message) => {
    try {
      // Expected topic: smartisense/{propertyId}/sensors
      const topicParts = topic.split('/');
      const propertyId = topicParts[1];

      const rawData = JSON.parse(message.toString());

      // Parse payload from ESP32
      // Expected: { electricity: Number, water: Number, rooms: { ... } }
      const sensorData = new SensorData({
        timestamp: new Date(),
        propertyId: propertyId !== '+' ? propertyId : 'default',
        electricity: rawData.electricity || 0,
        water: rawData.water || 0,
        rooms: rawData.rooms || {}
      });

      await sensorData.save();

      // Emit to frontend UI
      io.emit('sensor-data', sensorData);

      // Emit live feed message
      io.emit('live-feed', {
        id: `feed-${Date.now()}-hw`,
        timestamp: new Date(),
        type: 'data',
        message: `Hardware update: ${sensorData.electricity.toFixed(0)}W | ${sensorData.water.toFixed(1)} L/min`
      });

      // Pass to anomaly detector
      await checkAnomalies(sensorData, io);

    } catch (error) {
      console.error('MQTT Message Processing Error:', error.message);
    }
  });
}

module.exports = { startMqttBroker, startMqttClient };
