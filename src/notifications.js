import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./firebase";

// Initialize Firebase Messaging
let messaging = null;

try {
  messaging = getMessaging(app);
  console.log('[FCM] Firebase Messaging initialized');
} catch (err) {
  console.warn('[FCM] Failed to initialize Firebase Messaging:', err.message);
}

// Your VAPID key - You'll need to get this from Firebase Console
// Go to: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || null;

/**
 * Request notification permission from user
 * @returns {Promise<boolean>} True if permission granted
 */
export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.warn('[FCM] This browser does not support notifications');
      return false;
    }

    if (!messaging) {
      console.warn('[FCM] Messaging not initialized');
      return false;
    }

    if (!VAPID_KEY) {
      console.warn('[FCM] VAPID key not configured. Please add VITE_FIREBASE_VAPID_KEY to your .env file');
      return false;
    }

    // Check current permission
    if (Notification.permission === 'granted') {
      console.log('[FCM] Notification permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('[FCM] Notification permission denied by user');
      return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('[FCM] Notification permission granted');

      // Get FCM token
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });

      if (token) {
        console.log('[FCM] Token obtained:', token);
        // Store token in localStorage for later use
        localStorage.setItem('fcm_token', token);
        return true;
      } else {
        console.warn('[FCM] No token received');
        return false;
      }
    } else {
      console.warn('[FCM] Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('[FCM] Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get current FCM token
 * @returns {Promise<string|null>} FCM token or null
 */
export const getFCMToken = async () => {
  try {
    if (!messaging || !VAPID_KEY) return null;

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      localStorage.setItem('fcm_token', token);
      return token;
    }
    return null;
  } catch (error) {
    console.error('[FCM] Error getting token:', error);
    return null;
  }
};

/**
 * Check if notifications are supported and enabled
 * @returns {boolean}
 */
export const areNotificationsEnabled = () => {
  return (
    'Notification' in window &&
    Notification.permission === 'granted' &&
    !!messaging &&
    !!VAPID_KEY
  );
};

/**
 * Setup foreground message listener
 * This handles notifications when user is actively on the site
 */
export const setupForegroundMessageListener = (callback) => {
  if (!messaging) return;

  try {
    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload);

      const { notification, data } = payload;

      // Show browser notification
      if (notification) {
        const notificationTitle = notification.title || 'New Notification';
        const notificationOptions = {
          body: notification.body || '',
          icon: notification.icon || '/icon.png',
          badge: '/icon.png',
          tag: data?.type || 'general',
          data: data || {},
        };

        // Show notification using service worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(notificationTitle, notificationOptions);
          });
        } else {
          // Fallback to regular notification
          new Notification(notificationTitle, notificationOptions);
        }
      }

      // Call custom callback if provided
      if (callback && typeof callback === 'function') {
        callback(payload);
      }
    });

    console.log('[FCM] Foreground message listener set up');
  } catch (error) {
    console.error('[FCM] Error setting up foreground message listener:', error);
  }
};

/**
 * Send notification to specific user(s) via Firebase Functions
 * Note: You'll need to create a Firebase Cloud Function for this
 * @param {Object} params - Notification parameters
 */
export const sendNotificationToUser = async (params) => {
  const { userToken, title, body, data, type } = params;

  try {
    // This would call your Firebase Cloud Function
    // You'll need to create this function in Firebase
    const response = await fetch('YOUR_CLOUD_FUNCTION_URL', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: userToken,
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          type,
        },
      }),
    });

    if (response.ok) {
      console.log('[FCM] Notification sent successfully');
      return true;
    } else {
      console.error('[FCM] Failed to send notification');
      return false;
    }
  } catch (error) {
    console.error('[FCM] Error sending notification:', error);
    return false;
  }
};

/**
 * Show local notification (doesn't require server)
 * Useful for testing or immediate feedback
 */
export const showLocalNotification = (title, body, data = {}) => {
  if (!areNotificationsEnabled()) {
    console.warn('[FCM] Notifications not enabled');
    return;
  }

  const notificationOptions = {
    body,
    icon: '/icon.png',
    badge: '/icon.png',
    tag: data.type || 'local',
    data,
  };

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, notificationOptions);
    });
  } else {
    new Notification(title, notificationOptions);
  }
};
