import { useEffect, useState } from "react";
import { rtdb } from "../firebase";
import {
  ref,
  onValue,
  onDisconnect,
  set,
  serverTimestamp,
  get,
} from "firebase/database";

/**
 * Custom hook for managing user presence in Firebase Realtime Database
 * Tracks online/offline status and user activity
 */
export function usePresence(userName) {
  const [onlineUsers, setOnlineUsers] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    // Don't set up presence if no userName
    if (!userName || userName.trim() === '') {
      console.log('[Presence] No userName provided, skipping presence setup');
      return;
    }

    console.log('[Presence] Setting up presence for:', userName);

    const userStatusRef = ref(rtdb, `presence/${userName}`);
    const allPresenceRef = ref(rtdb, "presence");

    // Track last update time to prevent spam
    let lastUpdateTime = 0;
    const UPDATE_THROTTLE = 5000; // 5 seconds minimum between updates

    // Set user as online
    const setUserOnline = async () => {
      const now = Date.now();

      // Throttle updates - don't update more than once per 5 seconds
      if (now - lastUpdateTime < UPDATE_THROTTLE) {
        console.log('[Presence] Update throttled, too soon since last update');
        return;
      }

      lastUpdateTime = now;

      const userStatus = {
        state: "online",
        lastChanged: serverTimestamp(),
        userName: userName,
      };

      try {
        console.log('[Presence] Setting user online');
        // Set user online
        await set(userStatusRef, userStatus);

        // Set up disconnect handler (only once)
        await onDisconnect(userStatusRef).set({
          state: "offline",
          lastChanged: serverTimestamp(),
          userName: userName,
        });
      } catch (error) {
        console.error("❌ Error setting user presence:", error);
        console.error("Error details:", error.message);
        if (error.code === "PERMISSION_DENIED") {
          console.error("🔒 PERMISSION_DENIED: Check Firebase Realtime Database rules");
          setError("PERMISSION_DENIED");
        } else {
          console.error("⚠️ Database might not be enabled. Please enable Firebase Realtime Database.");
          setError("DATABASE_NOT_ENABLED");
        }
      }
    };

    setUserOnline();

    // Listen to all users' presence
    let unsubscribe;
    try {
      unsubscribe = onValue(
        allPresenceRef,
        (snapshot) => {
          const presenceData = snapshot.val() || {};
          setOnlineUsers(presenceData);
        },
        (error) => {
          console.error("❌ Error listening to presence:", error);
          console.error("Error details:", error.message);
          if (error.code === "PERMISSION_DENIED") {
            setError("PERMISSION_DENIED");
          }
        }
      );
    } catch (error) {
      console.error("❌ Failed to set up presence listener:", error);
      setError("DATABASE_NOT_ENABLED");
      return; // Exit early if setup failed
    }

    // Handle page visibility changes with debounce
    let visibilityTimeout;
    const handleVisibilityChange = () => {
      // Clear any pending visibility change
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }

      // Debounce visibility changes by 1 second
      visibilityTimeout = setTimeout(() => {
        if (document.hidden) {
          console.log('[Presence] Tab hidden, setting away');
          set(userStatusRef, {
            state: "away",
            lastChanged: serverTimestamp(),
            userName: userName,
          }).catch(err => console.log('[Presence] Error setting away:', err.message));
        } else {
          console.log('[Presence] Tab visible, setting online');
          setUserOnline();
        }
      }, 1000); // Wait 1 second before updating
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      console.log('[Presence] Cleaning up presence for:', userName);

      // Clear any pending visibility timeout
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Unsubscribe if listener was set up
      if (unsubscribe) {
        unsubscribe();
      }

      // Set user offline on unmount
      if (userName && userName.trim() !== '') {
        set(userStatusRef, {
          state: "offline",
          lastChanged: serverTimestamp(),
          userName: userName,
        }).catch((err) => {
          // Ignore errors on cleanup
          console.log('[Presence] Cleanup error (ignoring):', err.message);
        });
      }
    };
  }, [userName]);

  return { onlineUsers, error };
}

/**
 * Update user's game status (in-game, in-lobby, etc.)
 */
export async function updateUserGameStatus(userName, gameStatus) {
  if (!userName) return;

  const userStatusRef = ref(rtdb, `presence/${userName}`);

  try {
    const snapshot = await get(userStatusRef);
    const currentStatus = snapshot.val() || {};

    await set(userStatusRef, {
      ...currentStatus,
      gameStatus: gameStatus, // "in-game", "in-lobby", "idle", null
      lastChanged: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating game status:", error);
  }
}
