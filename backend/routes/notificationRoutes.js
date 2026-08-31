const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getPublicKey, saveSubscription } = require('../services/pushService');

// GET /api/notifications/vapid-public-key — Get VAPID public key for frontend subscription
router.get('/vapid-public-key', (req, res) => {
  res.json({ success: true, publicKey: getPublicKey() });
});

// POST /api/notifications/subscribe — Save customer push subscription
router.post('/subscribe', authenticate, (req, res) => {
  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription object' });
    }

    saveSubscription(req.user.id, subscription);
    res.json({ success: true, message: 'Push notification subscription saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
