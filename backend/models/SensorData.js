const mongoose = require('mongoose');

const roomSchema = {
  electricity: { type: Number, default: 0 },
  water: { type: Number, default: 0 }
};

const sensorDataSchema = new mongoose.Schema({
  propertyId: { type: String, default: 'default', index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  electricity: { type: Number, required: true },
  water: { type: Number, required: true },
  rooms: {
    livingRoom: roomSchema,
    bedroom: roomSchema,
    kitchen: roomSchema,
    bathroom: roomSchema
  }
}, {
  timestamps: false,
  versionKey: false
});

// Compound descending index for fast latest-first queries
sensorDataSchema.index({ timestamp: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
