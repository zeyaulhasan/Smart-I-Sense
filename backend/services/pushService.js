const axios = require('axios');
const User = require('../models/User');

/**
 * Send a push notification via Expo Push API to all devices associated with the property
 */
async function sendPushNotification(propertyId, title, body, data = {}) {
  try {
    // Find all users who belong to this property and have a push token
    const users = await User.find({ propertyId, pushToken: { $ne: '', $ne: null } });
    
    if (users.length === 0) return;

    const messages = users.map(user => ({
      to: user.pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'alerts'
    }));

    // Chunking could be done here if messages length > 100
    await axios.post('https://exp.host/--/api/v2/push/send', messages, {
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      }
    });

    console.log(`[Push] Sent notification to ${users.length} device(s) for property ${propertyId}`);
  } catch (error) {
    console.error('[Push Error]', error.response?.data || error.message);
  }
}

module.exports = { sendPushNotification };
