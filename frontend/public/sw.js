/* TechPulse Web Push Service Worker */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'TechPulse',
    body: 'New update available in TechPulse.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'techpulse-general',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/favicon.svg',
      badge: payload.badge || '/favicon.svg',
      tag: payload.tag || 'techpulse-notification',
      renotify: true,
      data: payload.data || { url: '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';
  const isExternal = /^https?:\/\//i.test(targetUrl);

  event.waitUntil(
    (async () => {
      if (isExternal) {
        return self.clients.openWindow(targetUrl);
      }

      const fullUrl = new URL(targetUrl, self.location.origin).href;
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            return client.navigate(fullUrl);
          }
          return client;
        }
      }

      return self.clients.openWindow(fullUrl);
    })()
  );
});
