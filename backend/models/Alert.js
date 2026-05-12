const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  propertyId: { type: String, default: 'default', index: true },
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ['electricity', 'water'], required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
  message: { type: String, required: true },
  room: { type: String },
  value: { type: Number },
  threshold: { type: Number },
  resolved: { type: Boolean, default: false }
}, {
  versionKey: false
});

alertSchema.index({ timestamp: -1 });
alertSchema.index({ resolved: 1, timestamp: -1 });

module.exports = mongoose.model('Alert', alertSchema);
