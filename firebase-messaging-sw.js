// Firebase Messaging Service Worker
// This file handles background notifications when the app is not open

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Note: These values should match your Firebase config
// You'll need to update these with your actual Firebase config values
firebase.initializeApp({
  apiKey: "AIzaSyCNqbJUNeTCRbELxx9m-KGWmGP7-kIyscQ",
  authDomain: "permumdota.firebaseapp.com",
  projectId: "permumdota",
  storageBucket: "permumdota.firebasestorage.app",
  messagingSenderId: "408163118002",
  appId: "1:408163118002:web:80eab5438011edeea352ab"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Permum Dota 2';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: payload.data?.type || 'general',
    data: payload.data || {},
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  const data = event.notification.data || {};
  let urlToOpen = '/';

  // Route based on notification type
  if (data.type === 'feed') {
    urlToOpen = '/?tab=feed';
  } else if (data.type === 'chat') {
    urlToOpen = '/?tab=chat';
  } else if (data.url) {
    urlToOpen = data.url;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'notification-click',
            data: data
          });
          return;
        }
      }

      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activated');
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installed');
  self.skipWaiting();
});
