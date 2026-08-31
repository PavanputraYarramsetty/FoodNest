// FoodNest Service Worker — Web Push Notifications Handler
self.addEventListener('push', function (event) {
  let data = {
    title: 'AparnaCanteen Order Update',
    body: 'Your order status has been updated!',
    icon: '/favicon.jpg',
    url: '/customer/orders'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.jpg',
    badge: '/favicon.jpg',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/customer/orders'
    },
    actions: [
      { action: 'open', title: 'View Orders' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/customer/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
