/**
 * Custom hook to fetch Discord presence data from Firebase
 * Shows who's online on Discord and syncs with the app
 */

import { useState, useEffect } from 'react';
import { rtdb } from '../firebase';
import { ref, onValue } from 'firebase/database';

export function useDiscordPresence() {
  const [discordUsers, setDiscordUsers] = useState({});
  const [voiceChannels, setVoiceChannels] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let loadingTimeout;
    let unsubscribePresence;
    let unsubscribeVoice;
    let didCancel = false;
    let connectionAttempts = 0;
    const MAX_ATTEMPTS = 3;

    // Debug: Log database URL and connection attempt
    console.log('[Discord Presence] Initializing connection...');
    console.log('[Discord Presence] Database URL:', rtdb.app.options.databaseURL);
    console.log('[Discord Presence] Project ID:', rtdb.app.options.projectId);
    console.log('[Discord Presence] User Agent:', navigator.userAgent);
    console.log('[Discord Presence] Browser:', /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) ? 'Safari' : 'Other');

    // Set timeout to stop loading after 10 seconds (increased for production)
    loadingTimeout = setTimeout(() => {
      if (!didCancel) {
        console.warn('[Discord Presence] ⏱️ Loading timeout - bot may be offline or connection slow');
        // Don't set error immediately, keep trying in background
        setIsLoading(false);
      }
    }, 10000);

    try {
      // Listen to Discord presence data
      const presenceRef = ref(rtdb, 'discord/presence');
      console.log('[Discord Presence] Setting up listener for path:', 'discord/presence');

      unsubscribePresence = onValue(
        presenceRef,
        (snapshot) => {
          if (!didCancel) {
            clearTimeout(loadingTimeout);
            const data = snapshot.val();
            console.log('[Discord Presence] Data received:', data ? 'Has data' : 'No data', 'Keys:', data ? Object.keys(data).length : 0);

            // If we got data (even if empty object), connection is working
            if (data !== null) {
              setDiscordUsers(data || {});
              setIsLoading(false);
              setError(null); // Clear any previous errors
              console.log('[Discord Presence] ✅ Connection successful');
            } else {
              // No data at all - bot might not be running
              setDiscordUsers({});
              setIsLoading(false);
              console.log('[Discord Presence] ⚠️ No data available');
              // Only set error if we've never received data
              if (Object.keys(discordUsers).length === 0) {
                setError('No Discord data available - bot may be offline');
              }
            }
          }
        },
        (err) => {
          if (!didCancel) {
            connectionAttempts++;
            console.error('[Discord Presence] ❌ Error (attempt ' + connectionAttempts + '):', err.code, err.message);
            console.error('[Discord Presence] Full error:', err);
            console.error('[Discord Presence] Error details:', {
              code: err.code,
              message: err.message,
              name: err.name,
              toString: err.toString()
            });

            // For Safari, provide specific guidance
            const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
            let errorMessage = `Connection error: ${err.code || err.message}`;

            if (err.code === 'PERMISSION_DENIED' || err.message?.includes('permission')) {
              errorMessage = 'Permission denied. Please check Firebase Realtime Database rules.';
            } else if (isSafari && (err.message?.includes('network') || err.message?.includes('quota'))) {
              errorMessage = 'Safari connection issue. Try: Settings → Safari → Privacy → Disable "Prevent Cross-Site Tracking"';
            }

            setError(errorMessage);
            setIsLoading(false);
            clearTimeout(loadingTimeout);
          }
        }
      );

      // Listen to voice channel data
      const voiceRef = ref(rtdb, 'discord/voice-channels');
      unsubscribeVoice = onValue(
        voiceRef,
        (snapshot) => {
          if (!didCancel) {
            const data = snapshot.val() || {};
            setVoiceChannels(data);
          }
        },
        (err) => {
          if (!didCancel) {
            console.error('Discord voice error:', err);
          }
        }
      );
    } catch (err) {
      if (!didCancel) {
        console.error('Discord hook error:', err);
        setError(err.message);
        setIsLoading(false);
        clearTimeout(loadingTimeout);
      }
    }

    return () => {
      didCancel = true;
      if (loadingTimeout) clearTimeout(loadingTimeout);
      if (unsubscribePresence) unsubscribePresence();
      if (unsubscribeVoice) unsubscribeVoice();
    };
  }, []);

  // Get online Discord users count
  const getOnlineCount = () => {
    return Object.values(discordUsers).filter(
      (user) => user.status !== 'offline'
    ).length;
  };

  // Get users in voice channels
  const getVoiceUsers = () => {
    const users = [];
    Object.entries(voiceChannels).forEach(([channelName, members]) => {
      members.forEach((member) => {
        users.push({
          ...member,
          channel: channelName,
        });
      });
    });
    return users;
  };

  // Check if a user is online on Discord
  const isUserOnlineOnDiscord = (username) => {
    return discordUsers[username]?.status === 'online' ||
           discordUsers[username]?.status === 'idle' ||
           discordUsers[username]?.status === 'dnd';
  };

  // Check if a user is playing Dota 2 on Discord
  const isUserPlayingDota = (username) => {
    return discordUsers[username]?.playingDota || false;
  };

  // Get user's Discord avatar
  const getUserAvatar = (username) => {
    return discordUsers[username]?.avatar || null;
  };

  return {
    discordUsers,
    voiceChannels,
    onlineCount: getOnlineCount(),
    voiceUsers: getVoiceUsers(),
    isUserOnlineOnDiscord,
    isUserPlayingDota,
    getUserAvatar,
    isLoading,
    error,
  };
}
