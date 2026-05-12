require('dotenv').config();
const connectDB = require('./config/db');
const Config = require('./models/Config');

const enrichedRooms = [
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
];

async function updateConfig() {
  try {
    await connectDB();
    const config = await Config.findOne();
    if (config) {
      config.rooms = enrichedRooms;
      await config.save();
      console.log('✅ Configuration enriched successfully with 20+ devices!');
    } else {
      await Config.create({
        houseName: 'Smart Home v4.0',
        rooms: enrichedRooms
      });
      console.log('✅ New configuration created with 20+ devices!');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Update failed:', err.message);
    process.exit(1);
  }
}

updateConfig();
