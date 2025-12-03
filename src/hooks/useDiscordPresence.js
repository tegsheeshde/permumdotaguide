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

    // Set timeout to stop loading after 5 seconds
    loadingTimeout = setTimeout(() => {
      if (!didCancel) {
        console.warn('Discord presence loading timeout');
        setError('Connection timeout - Discord bot may be offline');
        setIsLoading(false);
      }
    }, 5000);

    try {
      // Listen to Discord presence data
      const presenceRef = ref(rtdb, 'discord/presence');
      unsubscribePresence = onValue(
        presenceRef,
        (snapshot) => {
          if (!didCancel) {
            const data = snapshot.val() || {};
            setDiscordUsers(data);
            setIsLoading(false);
            setError(null); // Clear any previous errors
            clearTimeout(loadingTimeout);
          }
        },
        (err) => {
          if (!didCancel) {
            console.error('Discord presence error:', err);
            setError(err.message);
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
