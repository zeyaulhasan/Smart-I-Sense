const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');
const { validateSensorData } = require('../middleware/validator');
const { checkAnomalies } = require('../services/anomalyDetector');

// POST /api/sensor-data — Ingest new sensor reading
router.post('/sensor-data', validateSensorData, async (req, res) => {
  try {
    const data = new SensorData(req.body);
    await data.save();

    const io = req.app.get('io');
    io.emit('sensor-data', data);

    // Run anomaly detection
    await checkAnomalies(data, io);

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/latest — Most recent reading
router.get('/latest', async (req, res) => {
  try {
    const propertyId = req.user?.propertyId || 'default';
    const data = await SensorData.findOne({ propertyId }).sort({ timestamp: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/history?range=1h|24h|7d|30d — Time-series data
router.get('/history', async (req, res) => {
  try {
    const { range = '1h' } = req.query;
    const now = new Date();
    let startTime;

    switch (range) {
      case '1h':
        startTime = new Date(now - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now - 60 * 60 * 1000);
    }

    const propertyId = req.user?.propertyId || 'default';
    let data;

    if (range === '30d') {
      // Aggregate: average every hour
      data = await SensorData.aggregate([
        { $match: { propertyId, timestamp: { $gte: startTime } } },
        { $sort: { timestamp: 1 } },
        {
          $group: {
            _id: {
              $toDate: {
                $subtract: [
                  { $toLong: '$timestamp' },
                  { $mod: [{ $toLong: '$timestamp' }, 3600000] }
                ]
              }
            },
            timestamp: { $first: '$timestamp' },
            electricity: { $avg: '$electricity' },
            water: { $avg: '$water' },
            rooms: { $first: '$rooms' }
          }
        },
        { $sort: { timestamp: 1 } }
      ]);
    } else if (range === '7d') {
      // Aggregate: average every 10 minutes
      data = await SensorData.aggregate([
        { $match: { propertyId, timestamp: { $gte: startTime } } },
        { $sort: { timestamp: 1 } },
        {
          $group: {
            _id: {
              $toDate: {
                $subtract: [
                  { $toLong: '$timestamp' },
                  { $mod: [{ $toLong: '$timestamp' }, 600000] }
                ]
              }
            },
            timestamp: { $first: '$timestamp' },
            electricity: { $avg: '$electricity' },
            water: { $avg: '$water' },
            rooms: { $first: '$rooms' }
          }
        },
        { $sort: { timestamp: 1 } }
      ]);
    } else if (range === '24h') {
      // Aggregate: average every 2 minutes
      data = await SensorData.aggregate([
        { $match: { propertyId, timestamp: { $gte: startTime } } },
        { $sort: { timestamp: 1 } },
        {
          $group: {
            _id: {
              $toDate: {
                $subtract: [
                  { $toLong: '$timestamp' },
                  { $mod: [{ $toLong: '$timestamp' }, 120000] }
                ]
              }
            },
            timestamp: { $first: '$timestamp' },
            electricity: { $avg: '$electricity' },
            water: { $avg: '$water' },
            rooms: { $first: '$rooms' }
          }
        },
        { $sort: { timestamp: 1 } }
      ]);
    } else {
      // 1h: return raw data
      data = await SensorData.find({ propertyId, timestamp: { $gte: startTime } })
        .sort({ timestamp: 1 })
        .lean();
    }

    res.json({ success: true, data, range, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/history/compare — Compare two time periods
router.get('/history/compare', async (req, res) => {
  try {
    const { range = '7d' } = req.query; // e.g., '7d' means compare last 7 days vs previous 7 days
    const now = new Date();
    const propertyId = req.user?.propertyId || 'default';
    
    let durationMs;
    if (range === '1h') durationMs = 60 * 60 * 1000;
    else if (range === '24h') durationMs = 24 * 60 * 60 * 1000;
    else if (range === '7d') durationMs = 7 * 24 * 60 * 60 * 1000;
    else durationMs = 30 * 24 * 60 * 60 * 1000;

    const currentPeriodStart = new Date(now - durationMs);
    const previousPeriodStart = new Date(now - 2 * durationMs);

    // Aggregate Current Period
    const currentAgg = await SensorData.aggregate([
      { $match: { propertyId, timestamp: { $gte: currentPeriodStart, $lt: now } } },
      { $group: { _id: null, avgElec: { $avg: '$electricity' }, avgWater: { $avg: '$water' } } }
    ]);

    // Aggregate Previous Period
    const prevAgg = await SensorData.aggregate([
      { $match: { propertyId, timestamp: { $gte: previousPeriodStart, $lt: currentPeriodStart } } },
      { $group: { _id: null, avgElec: { $avg: '$electricity' }, avgWater: { $avg: '$water' } } }
    ]);

    const current = currentAgg[0] || { avgElec: 0, avgWater: 0 };
    const previous = prevAgg[0] || { avgElec: 0, avgWater: 0 };

    const elecChange = previous.avgElec ? ((current.avgElec - previous.avgElec) / previous.avgElec) * 100 : 0;
    const waterChange = previous.avgWater ? ((current.avgWater - previous.avgWater) / previous.avgWater) * 100 : 0;

    res.json({
      success: true,
      data: {
        range,
        current: { electricity: current.avgElec, water: current.avgWater },
        previous: { electricity: previous.avgElec, water: previous.avgWater },
        changePercentage: { electricity: elecChange, water: waterChange }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
