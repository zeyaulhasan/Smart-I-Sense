const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nominalPower: { type: Number, required: true },
  icon: { type: String, default: 'Zap' },
  isActive: { type: Boolean, default: true }
});

const roomSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  color: { type: String, default: 'teal' },
  elecThreshold: { type: Number, default: 400 },
  waterThreshold: { type: Number, default: 6 },
  devices: [deviceSchema]
});

const configSchema = new mongoose.Schema({
  propertyId: { type: String, default: 'default', unique: true },
  houseName: { type: String, default: 'Smart Home' },
  rooms: [roomSchema],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Config', configSchema);
