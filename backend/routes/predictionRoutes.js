const express = require('express');
const router = express.Router();
const { getPredictions, getCostPrediction } = require('../services/predictionEngine');

// POST /api/predictions/cost — AI-powered cost forecasting based on historical averages
router.post('/predictions/cost', async (req, res) => {
  try {
    const { range = '30d', rate = 1 } = req.body;
    const propertyId = req.user?.propertyId || 'default';
    const prediction = await getCostPrediction(range, parseFloat(rate), propertyId);
    res.json({ success: true, data: prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/predictions — AI-powered usage predictions
router.get('/predictions', async (req, res) => {
  try {
    const propertyId = req.user?.propertyId || 'default';
    const predictions = await getPredictions(propertyId);
    res.json({ success: true, data: predictions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
