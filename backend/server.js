require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

const sensorRoutes = require('./routes/sensorRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const alertRoutes = require('./routes/alertRoutes');
const configRoutes = require('./routes/configRoutes');
const authRoutes = require('./routes/authRoutes');
const hardwareRoutes = require('./routes/hardwareRoutes');
const { auth } = require('./middleware/auth');
const { startMqttBroker, startMqttClient } = require('./services/mqttService');
const { startSimulator } = require('./services/simulator');
const { seedDatabase } = require('./utils/seedData');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

// ───── Middleware ─────
app.use(cors({ origin: '*' }));
app.use(express.json());

// Make Socket.io instance accessible to routes
app.set('io', io);

// ───── Routes ─────
// Public routes (no auth required)
app.use('/api', authRoutes);
app.use('/api', hardwareRoutes); // ESP32 hardware — device key auth, no JWT

// Protected routes (require JWT)
app.use('/api', auth, sensorRoutes);
app.use('/api', auth, predictionRoutes);
app.use('/api', auth, alertRoutes);
app.use('/api', auth, configRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// ───── Socket.io ─────
io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ───── Start Server ─────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await seedDatabase();
  
  // Start MQTT Services
  startMqttBroker();
  startMqttClient(io);

  // Start real-time data simulator (generates live sensor data every 5s)
  startSimulator(io);

  server.listen(PORT, () => {
    console.log('');
    console.log('  ╔═══════════════════════════════════════════╗');
    console.log('  ║     🏠 Smart-I-Sense Backend v1.0.0       ║');
    console.log(`  ║     🚀 Server running on port ${PORT}        ║`);
    console.log('  ║     📡 WebSocket server ready              ║');
    console.log('  ║     🔌 MQTT Hardware Bridge active         ║');
    console.log('  ╚═══════════════════════════════════════════╝');
    console.log('');
  });
};

start().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
