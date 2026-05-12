const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');
const Config = require('../models/Config');
const { checkAnomalies } = require('../services/anomalyDetector');
const { auth } = require('../middleware/auth');

// Simple device key auth — no JWT needed for hardware
const DEVICE_KEY = process.env.DEVICE_API_KEY || 'smartisense-esp32-secret-2024';

// POST /api/hardware/data — ESP32 sends sensor readings here
router.post('/hardware/data', async (req, res) => {
  // Check device key header
  const key = req.headers['x-device-key'];
  if (key !== DEVICE_KEY) {
    return res.status(401).json({ success: false, error: 'Invalid device key' });
  }

  try {
    const { propertyId, electricity, water, rooms } = req.body;

    if (electricity === undefined || water === undefined) {
      return res.status(400).json({ success: false, error: 'Missing electricity or water fields' });
    }

    const sensorData = new SensorData({
      timestamp: new Date(),
      propertyId: propertyId || 'default',
      electricity: parseFloat(electricity) || 0,
      water: parseFloat(water) || 0,
      rooms: rooms || {}
    });

    await sensorData.save();

    const io = req.app.get('io');

    // Push to dashboard in real-time
    io.emit('sensor-data', sensorData);

    // Live feed badge
    io.emit('live-feed', {
      id: `feed-${Date.now()}-hw`,
      timestamp: new Date(),
      type: 'data',
      message: `🔌 ESP32: ${sensorData.electricity.toFixed(0)}W | 💧 ${sensorData.water.toFixed(1)} L/min`
    });

    // Run anomaly detection
    await checkAnomalies(sensorData, io);

    console.log(`📡 ESP32 Data: ${sensorData.electricity.toFixed(0)}W | ${sensorData.water.toFixed(2)} L/min [${propertyId}]`);

    res.status(201).json({ success: true, message: 'Data saved', id: sensorData._id });
  } catch (error) {
    console.error('Hardware ingest error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/hardware/ping — ESP32 can test connectivity
router.get('/hardware/ping', (req, res) => {
  res.json({ success: true, message: 'Smart-I-Sense backend online', timestamp: new Date() });
});

// ─────────────────────────────────────────────────────────────
// POST /api/hardware/override — Frontend sends computed device watts
// Called when user toggles appliances ON/OFF in the dashboard.
// Requires JWT (frontend user), not hardware device key.
// ─────────────────────────────────────────────────────────────
router.post('/hardware/override', auth, async (req, res) => {
  try {
    const propertyId = req.user?.propertyId || 'default';
    const { rooms, water } = req.body;
    // rooms: { livingRoom: { electricity: X }, bedroom: { electricity: Y }, ... }

    if (!rooms || typeof rooms !== 'object') {
      return res.status(400).json({ success: false, error: 'rooms object required' });
    }

    // Compute total electricity from all room values
    const totalElectricity = Object.values(rooms).reduce(
      (sum, r) => sum + (parseFloat(r.electricity) || 0), 0
    );

    // Fetch latest record to carry forward water reading if not provided
    const latest = await SensorData.findOne({ propertyId }).sort({ timestamp: -1 }).lean();
    const waterVal = water !== undefined ? parseFloat(water) : (latest?.water || 0);

    // Build per-room data merging override with latest sensor water values
    const mergedRooms = {
      livingRoom: {
        electricity: parseFloat(rooms.livingRoom?.electricity) || 0,
        water: latest?.rooms?.livingRoom?.water || 0
      },
      bedroom: {
        electricity: parseFloat(rooms.bedroom?.electricity) || 0,
        water: latest?.rooms?.bedroom?.water || 0
      },
      kitchen: {
        electricity: parseFloat(rooms.kitchen?.electricity) || 0,
        water: latest?.rooms?.kitchen?.water || 0
      },
      bathroom: {
        electricity: parseFloat(rooms.bathroom?.electricity) || 0,
        water: latest?.rooms?.bathroom?.water || 0
      }
    };

    const sensorData = new SensorData({
      timestamp: new Date(),
      propertyId,
      electricity: Math.round(totalElectricity * 10) / 10,
      water: waterVal,
      rooms: mergedRooms
    });

    await sensorData.save();

    const io = req.app.get('io');

    // Broadcast to all connected dashboard clients
    io.emit('sensor-data', sensorData);

    // Live feed notification
    io.emit('live-feed', {
      id: `feed-${Date.now()}-override`,
      timestamp: new Date(),
      type: 'control',
      message: `🔧 Appliance override: Total load ${totalElectricity.toFixed(0)}W`
    });

    await checkAnomalies(sensorData, io);

    console.log(`🔧 Override applied: ${totalElectricity.toFixed(0)}W [${propertyId}]`);

    res.status(201).json({
      success: true,
      message: 'Override applied',
      totalElectricity: Math.round(totalElectricity * 10) / 10,
      rooms: mergedRooms
    });
  } catch (error) {
    console.error('Override error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/hardware/diagnose-rooms — Compute load from active devices
// Used by Diagnostic Run button in room modals.
// ─────────────────────────────────────────────────────────────
router.post('/hardware/diagnose-rooms', auth, async (req, res) => {
  try {
    const propertyId = req.user?.propertyId || 'default';
    const config = await Config.findOne({ propertyId }).lean();
    if (!config) return res.status(404).json({ success: false, error: 'Config not found' });

    // Known room ID → SensorData key mapping
    const ROOM_KEY_MAP = {
      livingRoom: 'livingRoom',
      living_room: 'livingRoom',
      bedroom: 'bedroom',
      kitchen: 'kitchen',
      bathroom: 'bathroom'
    };

    const diagnosis = {};
    const roomOverride = {};

    for (const room of config.rooms) {
      const sensorKey = ROOM_KEY_MAP[room.id] || room.id;
      const activeDevices = (room.devices || []).filter(d => d.isActive !== false);
      const offDevices    = (room.devices || []).filter(d => d.isActive === false);
      const totalWatts    = activeDevices.reduce((sum, d) => sum + (d.nominalPower || 0), 0);

      diagnosis[room.id] = {
        label: room.label,
        totalWatts,
        activeCount: activeDevices.length,
        offCount: offDevices.length,
        activeDevices: activeDevices.map(d => ({ name: d.name, power: d.nominalPower })),
        offDevices: offDevices.map(d => ({ name: d.name, power: d.nominalPower }))
      };

      roomOverride[sensorKey] = { electricity: totalWatts };
    }

    const totalElectricity = Object.values(diagnosis).reduce((s, r) => s + r.totalWatts, 0);

    // Fetch latest water reading to carry forward
    const latest = await SensorData.findOne({ propertyId }).sort({ timestamp: -1 }).lean();

    const mergedRooms = {
      livingRoom: { electricity: roomOverride.livingRoom?.electricity || 0, water: latest?.rooms?.livingRoom?.water || 0 },
      bedroom:    { electricity: roomOverride.bedroom?.electricity    || 0, water: latest?.rooms?.bedroom?.water    || 0 },
      kitchen:    { electricity: roomOverride.kitchen?.electricity    || 0, water: latest?.rooms?.kitchen?.water    || 0 },
      bathroom:   { electricity: roomOverride.bathroom?.electricity   || 0, water: latest?.rooms?.bathroom?.water   || 0 }
    };

    const sensorData = new SensorData({
      timestamp: new Date(),
      propertyId,
      electricity: Math.round(totalElectricity * 10) / 10,
      water: latest?.water || 0,
      rooms: mergedRooms
    });

    await sensorData.save();

    const io = req.app.get('io');
    io.emit('sensor-data', sensorData);
    io.emit('live-feed', {
      id: `feed-${Date.now()}-diag`,
      timestamp: new Date(),
      type: 'diagnostic',
      message: `🔍 Diagnostic: Computed ${totalElectricity.toFixed(0)}W from active devices`
    });

    await checkAnomalies(sensorData, io);

    console.log(`🔍 Diagnostic run: ${totalElectricity.toFixed(0)}W total [${propertyId}]`);

    res.json({
      success: true,
      message: 'Diagnostic complete',
      totalElectricity: Math.round(totalElectricity * 10) / 10,
      diagnosis
    });
  } catch (error) {
    console.error('Diagnose-rooms error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
