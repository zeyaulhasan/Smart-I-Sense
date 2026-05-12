const SensorData = require('../models/SensorData');
const Alert = require('../models/Alert');
const Config = require('../models/Config');

/**
 * Seeds the database with 24 hours of realistic demo data and initial configuration.
 */
async function seedDatabase() {
  try {
    // 1. Seed initial configuration if missing
    const configCount = await Config.countDocuments();
    if (configCount === 0) {
      await Config.create({
        houseName: 'Smart Home v4.0',
        rooms: [
          {
            id: 'living_room',
            label: 'Living Room',
            color: 'blue',
            elecThreshold: 600,
            waterThreshold: 2,
            devices: [
              { name: 'Ceiling Fan', nominalPower: 65, icon: 'Wind', isActive: true },
              { name: 'Ambient Lights', nominalPower: 45, icon: 'Lightbulb', isActive: true },
              { name: 'Smart TV 4K', nominalPower: 150, icon: 'Tv', isActive: true },
              { name: 'Split AC', nominalPower: 1800, icon: 'Wind', isActive: false },
              { name: 'Home Theater', nominalPower: 200, icon: 'Tv', isActive: false },
              { name: 'Wi-Fi Router', nominalPower: 15, icon: 'Laptop', isActive: true },
              { name: 'Air Purifier', nominalPower: 40, icon: 'Wind', isActive: true }
            ]
          },
          {
            id: 'kitchen',
            label: 'Kitchen',
            color: 'emerald',
            elecThreshold: 1500,
            waterThreshold: 5,
            devices: [
              { name: 'Smart Fridge', nominalPower: 180, icon: 'Thermometer', isActive: true },
              { name: 'Microwave Oven', nominalPower: 1400, icon: 'Zap', isActive: false },
              { name: 'Dishwasher', nominalPower: 2200, icon: 'Droplets', isActive: false },
              { name: 'Exhaust Fan', nominalPower: 45, icon: 'Wind', isActive: true },
              { name: 'Coffee Maker', nominalPower: 800, icon: 'Zap', isActive: false },
              { name: 'Ceiling Lights', nominalPower: 60, icon: 'Lightbulb', isActive: true },
              { name: 'Electric Kettle', nominalPower: 1500, icon: 'Droplets', isActive: false }
            ]
          },
          {
            id: 'bedroom',
            label: 'Bedroom',
            color: 'amber',
            elecThreshold: 800,
            waterThreshold: 0,
            devices: [
              { name: 'Inverter AC', nominalPower: 1200, icon: 'Wind', isActive: true },
              { name: 'Night Lamp', nominalPower: 20, icon: 'Lightbulb', isActive: true },
              { name: 'MacBook Pro', nominalPower: 85, icon: 'Laptop', isActive: true },
              { name: 'Bedroom TV', nominalPower: 100, icon: 'Tv', isActive: false },
              { name: 'Pedestal Fan', nominalPower: 55, icon: 'Wind', isActive: true },
              { name: 'Phone Charger', nominalPower: 15, icon: 'Zap', isActive: true },
              { name: 'Air Humidifier', nominalPower: 30, icon: 'Droplets', isActive: false }
            ]
          },
          {
            id: 'bathroom',
            label: 'Bathroom',
            color: 'rose',
            elecThreshold: 2500,
            waterThreshold: 12,
            devices: [
              { name: 'Storage Geyser', nominalPower: 2500, icon: 'Droplets', isActive: false },
              { name: 'High-Speed Exhaust', nominalPower: 50, icon: 'Wind', isActive: true },
              { name: 'Vanity Lights', nominalPower: 35, icon: 'Lightbulb', isActive: true },
              { name: 'Hair Dryer', nominalPower: 1200, icon: 'Zap', isActive: false },
              { name: 'Electric Shaver', nominalPower: 10, icon: 'Zap', isActive: false }
            ]
          }
        ]
      });
      console.log('✅ Seeded enriched house configuration');
    }

    // 2. Seed sensor data if missing
    const count = await SensorData.countDocuments();
    if (count > 0) {
      console.log(`📦 Database has ${count} records — skipping sensor seed`);
    } else {
      console.log('🌱 Seeding database with 24h of demo data...');
      const now = new Date();
      const data = [];
      const intervalMs = 30000; 
      const totalReadings = Math.floor((24 * 60 * 60 * 1000) / intervalMs);

      for (let i = totalReadings; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * intervalMs);
        const hour = timestamp.getHours();

        let baseElec;
        if (hour >= 6 && hour < 9) baseElec = 450;
        else if (hour >= 9 && hour < 12) baseElec = 300;
        else if (hour >= 12 && hour < 14) baseElec = 350;
        else if (hour >= 14 && hour < 17) baseElec = 280;
        else if (hour >= 17 && hour < 20) baseElec = 620;
        else if (hour >= 20 && hour < 23) baseElec = 480;
        else baseElec = 180;

        let baseWater;
        if (hour >= 6 && hour < 9) baseWater = 5.5;
        else if (hour >= 9 && hour < 12) baseWater = 2.0;
        else if (hour >= 12 && hour < 14) baseWater = 4.0;
        else if (hour >= 14 && hour < 17) baseWater = 1.5;
        else if (hour >= 17 && hour < 20) baseWater = 4.5;
        else if (hour >= 20 && hour < 23) baseWater = 3.0;
        else baseWater = 0.8;

        const noise = (val, f = 0.15) => val * (1 + (Math.random() - 0.5) * 2 * f);
        const elec = noise(baseElec);
        const water = noise(baseWater, 0.2);

        data.push({
          timestamp,
          electricity: Math.round(elec * 10) / 10,
          water: Math.round(water * 100) / 100,
          rooms: {
            livingRoom: {
              electricity: Math.round(noise(elec * 0.30, 0.1) * 10) / 10,
              water: Math.round(noise(water * 0.05, 0.15) * 100) / 100
            },
            bedroom: {
              electricity: Math.round(noise(elec * 0.20, 0.1) * 10) / 10,
              water: Math.round(noise(water * 0.15, 0.15) * 100) / 100
            },
            kitchen: {
              electricity: Math.round(noise(elec * 0.35, 0.1) * 10) / 10,
              water: Math.round(noise(water * 0.35, 0.15) * 100) / 100
            },
            bathroom: {
              electricity: Math.round(noise(elec * 0.15, 0.1) * 10) / 10,
              water: Math.round(noise(water * 0.45, 0.15) * 100) / 100
            }
          }
        });
      }

      const batchSize = 500;
      for (let i = 0; i < data.length; i += batchSize) {
        await SensorData.insertMany(data.slice(i, i + batchSize));
      }
      console.log(`✅ Seeded ${data.length} sensor records`);
    }

    // 3. Seed demo alerts if missing
    const alertCount = await Alert.countDocuments();
    if (alertCount === 0) {
      const now = new Date();
      await Alert.insertMany([
        {
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          type: 'electricity', severity: 'warning',
          message: 'High power consumption in Kitchen: 485W',
          room: 'kitchen', value: 485, threshold: 400
        },
        {
          timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
          type: 'water', severity: 'critical',
          message: 'Possible water leakage in Bathroom: 8.2 L/min sustained',
          room: 'bathroom', value: 8.2, threshold: 6
        },
        {
          timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
          type: 'electricity', severity: 'warning',
          message: 'Bedroom electricity spike: 320W detected',
          room: 'bedroom', value: 320, threshold: 250
        },
        {
          timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
          type: 'electricity', severity: 'critical',
          message: 'System-wide power consumption exceeded: 890W',
          room: 'living_room', value: 890, threshold: 700,
          resolved: true
        }
      ]);
      console.log('✅ Seeded 4 demo alerts');
    }
  } catch (error) {
    console.error('Seeding error:', error.message);
  }
}

module.exports = { seedDatabase };
