const SensorData = require('../models/SensorData');
const Alert = require('../models/Alert');
const Config = require('../models/Config');
const { sendPushNotification } = require('./pushService');

const ELECTRICITY_SPIKE_MULTIPLIER = 1.5;
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Checks incoming sensor data for anomalies and creates alerts.
 * Thresholds are pulled from user configuration.
 */
async function checkAnomalies(currentData, io) {
  try {
    const [config, recentData] = await Promise.all([
      Config.findOne(),
      SensorData.find().sort({ timestamp: -1 }).limit(10).lean()
    ]);

    if (!config || recentData.length < 3) return;

    // ── Global Electricity Check ──
    const avgElectricity = recentData.reduce((sum, d) => sum + d.electricity, 0) / recentData.length;
    if (currentData.electricity > avgElectricity * ELECTRICITY_SPIKE_MULTIPLIER) {
      const recentAlert = await Alert.findOne({
        type: 'electricity',
        timestamp: { $gte: new Date(Date.now() - ALERT_COOLDOWN_MS) },
        resolved: false
      });

      if (!recentAlert) {
        const maxRoomId = findHighestRoom(currentData, 'electricity');
        const severity = currentData.electricity > avgElectricity * 2 ? 'critical' : 'warning';

        const alert = await Alert.create({
          propertyId: currentData.propertyId || 'default',
          type: 'electricity',
          severity,
          message: `High power consumption detected: ${currentData.electricity.toFixed(0)}W (avg: ${avgElectricity.toFixed(0)}W)`,
          room: maxRoomId,
          value: currentData.electricity,
          threshold: Math.round(avgElectricity * ELECTRICITY_SPIKE_MULTIPLIER)
        });
        io.emit('alert', alert);
        sendPushNotification(currentData.propertyId || 'default', '⚠️ Critical Power Spike', alert.message, { alertId: alert._id });
      }
    }

    // ── Room-Specific Checks ──
    if (currentData.rooms) {
      const rooms = currentData.rooms.toObject ? currentData.rooms.toObject() : currentData.rooms;
      
      for (const roomConfig of config.rooms) {
        const roomData = rooms[roomConfig.id];
        if (!roomData) continue;

        // Electricity Threshold Check
        if (roomConfig.elecThreshold > 0 && roomData.electricity > roomConfig.elecThreshold) {
           const recentAlert = await Alert.findOne({
             type: 'electricity',
             room: roomConfig.id,
             timestamp: { $gte: new Date(Date.now() - ALERT_COOLDOWN_MS) },
             resolved: false
           });

           if (!recentAlert) {
             const alert = await Alert.create({
               propertyId: currentData.propertyId || 'default',
               type: 'electricity',
               severity: 'warning',
               message: `${roomConfig.label}: Power spike detected (${roomData.electricity}W > ${roomConfig.elecThreshold}W)`,
               room: roomConfig.id,
               value: roomData.electricity,
               threshold: roomConfig.elecThreshold
             });
             io.emit('alert', alert);
             sendPushNotification(currentData.propertyId || 'default', `⚠️ Power Spike: ${roomConfig.label}`, alert.message, { alertId: alert._id });
           }
        }

        // Water Leakage Check
        if (roomConfig.waterThreshold > 0 && roomData.water > roomConfig.waterThreshold) {
           const recentAlert = await Alert.findOne({
             type: 'water',
             room: roomConfig.id,
             timestamp: { $gte: new Date(Date.now() - ALERT_COOLDOWN_MS) },
             resolved: false
           });

           if (!recentAlert) {
             const alert = await Alert.create({
               propertyId: currentData.propertyId || 'default',
               type: 'water',
               severity: 'critical',
               message: `${roomConfig.label}: High water flow detected (${roomData.water.toFixed(1)} L/m)`,
               room: roomConfig.id,
               value: roomData.water,
               threshold: roomConfig.waterThreshold
             });
             io.emit('alert', alert);
             sendPushNotification(currentData.propertyId || 'default', `💧 Water Leak: ${roomConfig.label}`, alert.message, { alertId: alert._id });
           }
        }
      }
    }
  } catch (error) {
    console.error('Anomaly detection error:', error.message);
  }
}

function findHighestRoom(data, field) {
  if (!data.rooms) return 'unknown';
  const rooms = data.rooms.toObject ? data.rooms.toObject() : data.rooms;

  let maxRoom = 'unknown';
  let maxVal = 0;

  for (const [room, vals] of Object.entries(rooms)) {
    if (vals && vals[field] > maxVal) {
      maxVal = vals[field];
      maxRoom = room;
    }
  }

  return maxRoom;
}

module.exports = { checkAnomalies };
