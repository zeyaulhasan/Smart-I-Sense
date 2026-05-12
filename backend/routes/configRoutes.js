const express = require('express');
const router = express.Router();
const Config = require('../models/Config');
const SensorData = require('../models/SensorData');
const { checkAnomalies } = require('../services/anomalyDetector');

// GET /api/config — Get current configuration
router.get('/config', async (req, res) => {
  try {
    const propertyId = req.user?.propertyId || 'default';
    let config = await Config.findOne({ propertyId }).lean();
    if (!config) {
      return res.status(404).json({ success: false, error: 'Config not found' });
    }
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/config — Update configuration (rooms, devices, thresholds)
router.patch('/config', async (req, res) => {
  try {
    const propertyId = req.user?.propertyId || 'default';
    const config = await Config.findOne({ propertyId });
    if (!config) return res.status(404).json({ success: false, error: 'Config not found' });

    if (req.body.rooms) config.rooms = req.body.rooms;
    if (req.body.houseName) config.houseName = req.body.houseName;

    config.updatedAt = Date.now();
    await config.save();

    res.json({ success: true, data: config.toObject() });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/config/diagnose — Diagnostic run: recalculate anomalies
router.post('/config/diagnose', async (req, res) => {
  try {
    const propertyId = req.user?.propertyId || 'default';
    const latestData = await SensorData.findOne({ propertyId }).sort({ timestamp: -1 });
    if (!latestData) return res.status(404).json({ success: false, error: 'No sensor data available for diagnosis' });

    const io = req.app.get('io');
    await checkAnomalies(latestData, io);

    res.json({ success: true, message: 'Diagnosis complete. Anomalies checked against new thresholds.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
