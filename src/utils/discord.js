/**
 * Discord Integration Utilities
 * Handles sending messages and updates to Discord via webhooks
 */

const DISCORD_WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
const DISCORD_ENABLED = import.meta.env.VITE_DISCORD_ENABLED === 'true';

/**
 * Check if Discord integration is enabled
 */
export const isDiscordEnabled = () => {
  return DISCORD_ENABLED && DISCORD_WEBHOOK_URL;
};

/**
 * Send a chat message to Discord
 */
export const sendChatToDiscord = async (userName, message) => {
  if (!isDiscordEnabled()) return;

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userName,
        content: message,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`,
      }),
    });
  } catch (error) {
    console.error('Failed to send message to Discord:', error);
  }
};

/**
 * Send a feed post to Discord
 */
export const sendFeedPostToDiscord = async (userName, post) => {
  if (!isDiscordEnabled()) return;

  try {
    const embed = {
      title: '📢 New Feed Post',
      description: post.content || '',
      color: 0x9333ea, // Purple color
      author: {
        name: userName,
        icon_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`,
      },
      timestamp: new Date().toISOString(),
      fields: [],
    };

    // Add image if present
    if (post.imageUrl) {
      embed.image = { url: post.imageUrl };
    }

    // Add video link if present
    if (post.videoUrl) {
      embed.fields.push({
        name: '🎥 Video',
        value: post.videoUrl,
      });
    }

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });
  } catch (error) {
    console.error('Failed to send feed post to Discord:', error);
  }
};

/**
 * Send poll creation to Discord
 */
export const sendPollToDiscord = async (userName, pollTitle, options) => {
  if (!isDiscordEnabled()) return;

  try {
    const optionsText = options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n');

    const embed = {
      title: '📊 New Poll Created',
      description: pollTitle,
      color: 0x10b981, // Green color
      author: {
        name: userName,
        icon_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`,
      },
      fields: [
        {
          name: 'Options',
          value: optionsText,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });
  } catch (error) {
    console.error('Failed to send poll to Discord:', error);
  }
};

/**
 * Send poll results to Discord
 */
export const sendPollResultsToDiscord = async (pollTitle, results) => {
  if (!isDiscordEnabled()) return;

  try {
    const resultsText = results
      .map((result, idx) => `${idx + 1}. ${result.option}: **${result.count} votes** (${result.percentage}%)`)
      .join('\n');

    const embed = {
      title: '📊 Poll Results',
      description: pollTitle,
      color: 0x3b82f6, // Blue color
      fields: [
        {
          name: 'Results',
          value: resultsText || 'No votes yet',
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });
  } catch (error) {
    console.error('Failed to send poll results to Discord:', error);
  }
};

/**
 * Send user status update to Discord
 */
export const sendStatusUpdateToDiscord = async (userName, status) => {
  if (!isDiscordEnabled()) return;

  try {
    const statusEmojis = {
      online: '🟢',
      ingame: '🎮',
      lobby: '🏠',
      away: '🟡',
      offline: '⚫',
    };

    const statusLabels = {
      online: 'Online',
      ingame: 'In Game',
      lobby: 'In Lobby',
      away: 'Away',
      offline: 'Offline',
    };

    const emoji = statusEmojis[status] || '❓';
    const label = statusLabels[status] || status;

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `${emoji} **${userName}** is now ${label}`,
        username: 'Status Bot',
      }),
    });
  } catch (error) {
    console.error('Failed to send status update to Discord:', error);
  }
};

/**
 * Send draft/match notification to Discord
 */
export const sendMatchNotificationToDiscord = async (radiant, dire) => {
  if (!isDiscordEnabled()) return;

  try {
    const embed = {
      title: '⚔️ Match Starting!',
      color: 0xef4444, // Red color
      fields: [
        {
          name: '🌟 Radiant Team',
          value: radiant.map(h => `• ${h.name}`).join('\n') || 'No heroes picked',
          inline: true,
        },
        {
          name: '🌙 Dire Team',
          value: dire.map(h => `• ${h.name}`).join('\n') || 'No heroes picked',
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: '🎮 **New Dota 2 Draft Created!**',
        embeds: [embed],
      }),
    });
  } catch (error) {
    console.error('Failed to send match notification to Discord:', error);
  }
};
