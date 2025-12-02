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

    const userStatusRef = ref(rtdb, `presence/${userName}`);
    const allPresenceRef = ref(rtdb, "presence");

    // Set user as online
    const setUserOnline = async () => {
      const userStatus = {
        state: "online",
        lastChanged: serverTimestamp(),
        userName: userName,
      };

      try {
        // Set user online
        await set(userStatusRef, userStatus);

        // Set up disconnect handler
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
    const unsubscribe = onValue(
      allPresenceRef,
      (snapshot) => {
        const presenceData = snapshot.val() || {};
        setOnlineUsers(presenceData);
      },
      (error) => {
        console.error("❌ Error listening to presence:", error);
        console.error("Error details:", error.message);
      }
    );

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        set(userStatusRef, {
          state: "away",
          lastChanged: serverTimestamp(),
          userName: userName,
        });
      } else {
        setUserOnline();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      unsubscribe();

      // Set user offline on unmount
      set(userStatusRef, {
        state: "offline",
        lastChanged: serverTimestamp(),
        userName: userName,
      }).catch(() => {
        // Ignore errors on cleanup
      });
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
