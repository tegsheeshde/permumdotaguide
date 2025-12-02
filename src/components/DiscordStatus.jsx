/**
 * Discord Status Component
 * Shows Discord online users and voice channel participants
 */

import { useState } from 'react';
import { Users, Mic, ChevronDown, ChevronUp } from 'lucide-react';
import { useDiscordPresence } from '../hooks/useDiscordPresence';

export default function DiscordStatus() {
  const {
    discordUsers,
    voiceChannels,
    onlineCount,
    voiceUsers,
    isLoading,
    error,
  } = useDiscordPresence();

  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [showVoiceUsers, setShowVoiceUsers] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400">Loading Discord status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-red-700/50">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-red-400" />
          <div>
            <p className="text-red-400 font-semibold">Discord Not Connected</p>
            <p className="text-slate-400 text-sm">Bot offline or not configured</p>
          </div>
        </div>
      </div>
    );
  }

  const onlineUsers = Object.entries(discordUsers)
    .filter(([, user]) => user.status !== 'offline')
    .sort((a, b) => {
      // Sort: Playing Dota 2 first, then by status
      if (a[1].playingDota && !b[1].playingDota) return -1;
      if (!a[1].playingDota && b[1].playingDota) return 1;
      return 0;
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'idle': return 'Idle';
      case 'dnd': return 'Do Not Disturb';
      default: return 'Offline';
    }
  };

  return (
    <div className="space-y-4">
      {/* Online Users Card */}
      <div className="bg-linear-to-br from-indigo-900/30 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-indigo-700/50">
        <button
          onClick={() => setShowOnlineUsers(!showOnlineUsers)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-400" />
            <div className="text-left">
              <h3 className="text-white font-bold text-lg">Discord Online</h3>
              <p className="text-slate-400 text-sm">
                {onlineCount} {onlineCount === 1 ? 'user' : 'users'} online
              </p>
            </div>
          </div>
          {showOnlineUsers ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showOnlineUsers && onlineUsers.length > 0 && (
          <div className="mt-4 space-y-2">
            {onlineUsers.map(([username, user]) => (
              <div
                key={username}
                className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50"
              >
                <div className="relative">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${getStatusColor(user.status)}`}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{user.displayName || username}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{getStatusLabel(user.status)}</span>
                    {user.playingDota && (
                      <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">
                        🎮 Playing Dota 2
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showOnlineUsers && onlineUsers.length === 0 && (
          <div className="mt-4 text-center py-8">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400">No one online on Discord</p>
          </div>
        )}
      </div>

      {/* Voice Channels Card */}
      {Object.keys(voiceChannels).length > 0 && (
        <div className="bg-linear-to-br from-purple-900/30 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-purple-700/50">
          <button
            onClick={() => setShowVoiceUsers(!showVoiceUsers)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Mic className="w-6 h-6 text-purple-400" />
              <div className="text-left">
                <h3 className="text-white font-bold text-lg">Voice Channels</h3>
                <p className="text-slate-400 text-sm">
                  {voiceUsers.length} {voiceUsers.length === 1 ? 'user' : 'users'} in voice
                </p>
              </div>
            </div>
            {showVoiceUsers ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showVoiceUsers && (
            <div className="mt-4 space-y-3">
              {Object.entries(voiceChannels).map(([channelName, members]) => (
                <div key={channelName} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-4 h-4 text-purple-400" />
                    <h4 className="text-white font-semibold text-sm">{channelName}</h4>
                    <span className="text-xs text-slate-400">({members.length})</span>
                  </div>
                  <div className="space-y-1 ml-6">
                    {members.map((member) => (
                      <div key={member.id} className="text-sm text-slate-300">
                        • {member.nickname || member.username}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
