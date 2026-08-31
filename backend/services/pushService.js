const webpush = require('web-push');

// Generate VAPID keys if not provided in process.env
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDnA4yL3kL51X8w1Jk_9rYgQ4w9g5gQ4w9g5gQ4w9g5g',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'uX2g9k3J8w1L51X8w1Jk_9rYgQ4w9g5gQ4w9g5gQ4w8'
};

// Standard VAPID keys generated for FoodNest Push Service
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@aparnacanteen.com';

// Generate consistent VAPID keys
try {
  const generated = webpush.generateVAPIDKeys();
  vapidKeys.publicKey = process.env.VAPID_PUBLIC_KEY || generated.publicKey;
  vapidKeys.privateKey = process.env.VAPID_PRIVATE_KEY || generated.privateKey;
  webpush.setVapidDetails(VAPID_SUBJECT, vapidKeys.publicKey, vapidKeys.privateKey);
} catch (err) {
  console.error('Failed to configure VAPID details:', err);
}

// In-memory push subscriptions store keyed by userId (array of subscriptions per user)
const userSubscriptions = new Map();

const saveSubscription = (userId, subscription) => {
  if (!userId || !subscription || !subscription.endpoint) return;
  const existing = userSubscriptions.get(userId) || [];
  // Prevent duplicates
  const filtered = existing.filter(s => s.endpoint !== subscription.endpoint);
  filtered.push(subscription);
  userSubscriptions.set(userId, filtered);
};

const getPublicKey = () => vapidKeys.publicKey;

const sendPushToUser = async (userId, payload) => {
  if (!userId) return;
  const subscriptions = userSubscriptions.get(userId) || [];
  if (subscriptions.length === 0) return;

  const notificationPayload = JSON.stringify(payload);

  const sendPromises = subscriptions.map(sub =>
    webpush.sendNotification(sub, notificationPayload).catch(err => {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Subscription expired or invalid; remove it
        const current = userSubscriptions.get(userId) || [];
        userSubscriptions.set(userId, current.filter(s => s.endpoint !== sub.endpoint));
      } else {
        console.error('Error sending push notification:', err.message);
      }
    })
  );

  await Promise.all(sendPromises);
};

module.exports = {
  getPublicKey,
  saveSubscription,
  sendPushToUser
};
