// Mijn Assistent — Service Worker v1
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

// Scheduled reminders via postMessage
const scheduled = {};
self.addEventListener('message', e => {
  if (!e.data) return;
  if (e.data.type === 'SCHEDULE') {
    const { id, text, time, minBefore, cat, fireAt } = e.data;
    const delay = new Date(fireAt) - Date.now();
    if (delay <= 0) return;
    if (scheduled[id]) clearTimeout(scheduled[id]);
    scheduled[id] = setTimeout(async () => {
      delete scheduled[id];
      try {
        await self.registration.showNotification('⏰ Herinnering', {
          body: 'Over ' + minBefore + ' min: ' + text,
          vibrate: [200, 100, 200, 100, 200],
          tag: 'rem-' + id,
          requireInteraction: true,
          icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><circle cx=%2232%22 cy=%2232%22 r=%2232%22 fill=%22%236eb5a0%22/><text x=%2232%22 y=%2243%22 text-anchor=%22middle%22 font-size=%2230%22 fill=%22white%22>✓</text></svg>'
        });
      } catch(err) {}
    }, delay);
  }
  if (e.data.type === 'CANCEL') {
    if (scheduled[e.data.id]) { clearTimeout(scheduled[e.data.id]); delete scheduled[e.data.id]; }
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length) return list[0].focus();
      return clients.openWindow ? clients.openWindow('.') : null;
    })
  );
});

self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(d.title || '⏰ Herinnering', {
    body: d.body || '', vibrate: [200,100,200], tag: d.tag || 'push'
  }));
});
