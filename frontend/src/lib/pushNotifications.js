import axios from 'axios';

// Convert base64 VAPID key to Uint8Array required by pushManager.subscribe
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Web push notifications not supported by browser');
    return false;
  }

  try {
    // Register Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Check Notification Permission
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.log('Notification permission denied by user');
      return false;
    }

    // Get VAPID public key from backend
    const vapidRes = await axios.get('/notifications/vapid-public-key');
    const publicKey = vapidRes.data?.publicKey;
    if (!publicKey) return false;

    // Subscribe user via PushManager
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // Send subscription to backend
    await axios.post('/notifications/subscribe', subscription);
    console.log('Push notification subscription successfully registered');
    return true;

  } catch (err) {
    console.error('Failed to register push notifications:', err);
    return false;
  }
}
