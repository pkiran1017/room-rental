self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = { body: event.data ? event.data.text() : 'New notification' };
  }

  // Check if app window is already open and focused
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: false }).then((clientList) => {
      // Check if any client is focused/visible
      const appIsOpenAndFocused = clientList.some(client => client.focused);

      if (appIsOpenAndFocused && clientList.length > 0) {
        // App is open and focused - send message to in-app handler instead of showing notification
        const focusedClient = clientList.find(client => client.focused) || clientList[0];
        return focusedClient.postMessage({
          type: 'PUSH_NOTIFICATION',
          payload: payload
        });
      }

      // App is closed or not focused - show system notification with professional styling
      const title = payload.title || 'New Message';
      const senderName = payload.senderName || 'Someone';
      const senderAvatar = payload.senderAvatar || '/favicon.png';
      const messageBody = payload.body || 'Sent you a message';

      const options = {
        body: messageBody,
        // Use sender's avatar as the main icon (WhatsApp-style)
        icon: senderAvatar,
        // Use app badge as secondary badge
        badge: payload.badge || '/favicon.png',
        // Group by room so similar messages stack
        tag: payload.tag || 'app-notification',
        data: payload.data || { url: '/' },
        // Professional notification settings
        renotify: true, // Notify user even if same tag
        requireInteraction: false, // Let notification auto-dismiss
        silent: false, // Play sound
        // Additional details for rich notification
        actions: [
          {
            action: 'open',
            title: 'Open Chat'
          }
        ],
      };

      return self.registration.showNotification(title, options);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app window is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate to the chat and bring window to focus (WhatsApp-style)
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      
      // If no app window is open, open a new one (WhatsApp-style)
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      
      return undefined;
    })
  );
});
