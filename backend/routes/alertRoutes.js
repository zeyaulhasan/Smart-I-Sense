const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// GET /api/alerts — Retrieve alerts with optional filtering
router.get('/alerts', async (req, res) => {
  try {
    const { resolved, limit = 50, type } = req.query;
    const propertyId = req.user?.propertyId || 'default';
    const filter = { propertyId };

    if (resolved !== undefined) filter.resolved = resolved === 'true';
    if (type) filter.type = type;

    const alerts = await Alert.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    const unresolvedCount = await Alert.countDocuments({ propertyId, resolved: false });

    res.json({
      success: true,
      data: alerts,
      unresolvedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/alerts/:id/resolve — Mark an alert as resolved
router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    const propertyId = req.user?.propertyId || 'default';
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, propertyId },
      { resolved: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    const io = req.app.get('io');
    io.emit('alert-resolved', alert);

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
