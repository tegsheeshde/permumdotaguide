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
    try {
      // Listen to Discord presence data
      const presenceRef = ref(rtdb, 'discord/presence');
      const unsubscribePresence = onValue(
        presenceRef,
        (snapshot) => {
          const data = snapshot.val() || {};
          setDiscordUsers(data);
          setIsLoading(false);
        },
        (err) => {
          console.error('Discord presence error:', err);
          setError(err.message);
          setIsLoading(false);
        }
      );

      // Listen to voice channel data
      const voiceRef = ref(rtdb, 'discord/voice-channels');
      const unsubscribeVoice = onValue(
        voiceRef,
        (snapshot) => {
          const data = snapshot.val() || {};
          setVoiceChannels(data);
        },
        (err) => {
          console.error('Discord voice error:', err);
        }
      );

      return () => {
        unsubscribePresence();
        unsubscribeVoice();
      };
    } catch (err) {
      console.error('Discord hook error:', err);
      setError(err.message);
      setIsLoading(false);
    }
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
