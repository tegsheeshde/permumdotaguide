/**
 * Discord Bot for Dota 2 Community App
 * Syncs messages from Discord to Firebase
 */

require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Initialize Firebase Admin
// Support both local file and environment variable (for cloud deployment)
let credential;

// Debug: Check environment variables
console.log('🔍 Checking Firebase credentials...');
console.log('Environment check:', {
  hasBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
  base64Length: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.length || 0,
  nodeEnv: process.env.NODE_ENV,
});

if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  // Cloud deployment: use base64 encoded service account
  console.log('🔑 Using Firebase credentials from environment variable');
  try {
    const serviceAccountJson = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      'base64'
    ).toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    credential = admin.credential.cert(serviceAccount);
    console.log('✅ Firebase credentials loaded successfully from base64');
  } catch (error) {
    console.error('❌ ERROR parsing base64 credentials:', error.message);
    process.exit(1);
  }
} else {
  // Local development: use service account file
  console.log('🔑 Attempting to use Firebase credentials from local file');
  const fs = require('fs');
  const path = require('path');
  const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require('./firebase-service-account.json');
    credential = admin.credential.cert(serviceAccount);
    console.log('✅ Firebase credentials loaded successfully from file');
  } else {
    console.error('❌ ERROR: Firebase credentials not found!');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('FIREBASE')));
    console.error('Please either:');
    console.error('1. Add firebase-service-account.json file locally, OR');
    console.error('2. Set FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable');
    console.error('See DEPLOY_CHECKLIST.md for instructions');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: credential,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();
const rtdb = admin.database();

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

// Track last processed message to avoid duplicates
let lastProcessedMessageId = null;

// Sanitize keys for Firebase (remove invalid characters)
function sanitizeFirebaseKey(key) {
  return key.replace(/[.#$\/\[\]]/g, '_');
}

// Bot ready event (updated to use clientReady for Discord.js v14+)
client.once('clientReady', async () => {
  console.log('✅ Discord bot is online!');
  console.log(`📝 Logged in as: ${client.user.tag}`);
  console.log(`🔗 Monitoring channel ID: ${CHANNEL_ID}`);

  // Start monitoring voice channels
  startVoiceChannelMonitoring();

  // Start monitoring Discord presence
  startPresenceMonitoring();
});

// Handle new messages from Discord
client.on('messageCreate', async (message) => {
  // Ignore bot messages to prevent loops
  if (message.author.bot) return;

  // Only process messages from the configured channel
  if (message.channel.id !== CHANNEL_ID) return;

  // Avoid processing the same message twice
  if (message.id === lastProcessedMessageId) return;
  lastProcessedMessageId = message.id;

  console.log(`📨 New message from ${message.author.username}: ${message.content}`);

  try {
    // Add message to Firestore (chat-messages collection)
    await db.collection('chat-messages').add({
      userName: message.author.username,
      text: message.content,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: 'discord',
      discordUserId: message.author.id,
      discordAvatarUrl: message.author.displayAvatarURL(),
    });

    console.log('✅ Message synced to Firebase');
  } catch (error) {
    console.error('❌ Error syncing message to Firebase:', error);
  }
});

// Monitor voice channel status
function startVoiceChannelMonitoring() {
  console.log('🎤 Starting voice channel monitoring...');

  // Update voice status every 10 seconds
  setInterval(async () => {
    try {
      const guild = client.guilds.cache.get(GUILD_ID);
      if (!guild) return;

      const voiceChannels = guild.channels.cache.filter(
        (channel) => channel.type === ChannelType.GuildVoice
      );

      const voiceStatus = {};

      voiceChannels.forEach((channel) => {
        const members = Array.from(channel.members.values());
        if (members.length > 0) {
          voiceStatus[channel.name] = members.map((member) => {
            const voiceState = member.voice;
            return {
              username: member.user.username,
              nickname: member.nickname || member.user.username,
              id: member.user.id,
              streaming: voiceState?.streaming || false, // Screen sharing status
              selfVideo: voiceState?.selfVideo || false, // Camera on/off
              selfMute: voiceState?.selfMute || false,   // Muted
              selfDeaf: voiceState?.selfDeaf || false,   // Deafened
              guildId: GUILD_ID,                         // For Discord link
              channelId: channel.id,                     // For Discord link
            };
          });
        }
      });

      // Update in Firebase Realtime Database
      await rtdb.ref('discord/voice-channels').set(voiceStatus);
    } catch (error) {
      console.error('❌ Error monitoring voice channels:', error);
    }
  }, 10000);
}

// Monitor Discord presence (online/offline status)
function startPresenceMonitoring() {
  console.log('👥 Starting presence monitoring...');

  // Update presence every 15 seconds
  setInterval(async () => {
    try {
      const guild = client.guilds.cache.get(GUILD_ID);
      if (!guild) return;

      const presenceData = {};

      guild.members.cache.forEach((member) => {
        if (member.user.bot) return;

        const status = member.presence?.status || 'offline';
        const activities = member.presence?.activities || [];

        // Check if playing Dota 2
        const dota2Activity = activities.find(
          (activity) =>
            activity.name.toLowerCase().includes('dota') ||
            activity.name.toLowerCase().includes('dota 2')
        );

        // Sanitize username for Firebase key
        const sanitizedUsername = sanitizeFirebaseKey(member.user.username);

        presenceData[sanitizedUsername] = {
          status: status,
          displayName: member.nickname || member.user.username,
          avatar: member.user.displayAvatarURL(),
          playingDota: !!dota2Activity,
          activity: dota2Activity ? dota2Activity.name : null,
          lastUpdated: Date.now(),
          originalUsername: member.user.username, // Keep original for reference
        };
      });

      // Update in Firebase Realtime Database
      await rtdb.ref('discord/presence').set(presenceData);
    } catch (error) {
      console.error('❌ Error monitoring presence:', error);
    }
  }, 15000);
}

// Handle presence updates in real-time
client.on('presenceUpdate', async (oldPresence, newPresence) => {
  if (!newPresence || newPresence.user.bot) return;

  const status = newPresence.status;
  const username = newPresence.user.username;
  const activities = newPresence.activities || [];

  // Check if playing Dota 2
  const dota2Activity = activities.find(
    (activity) =>
      activity.name.toLowerCase().includes('dota') ||
      activity.name.toLowerCase().includes('dota 2')
  );

  try {
    // Sanitize username for Firebase key
    const sanitizedUsername = sanitizeFirebaseKey(username);

    await rtdb.ref(`discord/presence/${sanitizedUsername}`).set({
      status: status,
      displayName: newPresence.member.nickname || username,
      avatar: newPresence.user.displayAvatarURL(),
      playingDota: !!dota2Activity,
      activity: dota2Activity ? dota2Activity.name : null,
      lastUpdated: Date.now(),
      originalUsername: username, // Keep original for reference
    });

    console.log(`👤 ${username} presence updated: ${status}`);
  } catch (error) {
    console.error('❌ Error updating presence:', error);
  }
});

// Handle voice state updates
client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;

    const voiceChannels = guild.channels.cache.filter(
      (channel) => channel.type === ChannelType.GuildVoice
    );

    const voiceStatus = {};

    voiceChannels.forEach((channel) => {
      const members = Array.from(channel.members.values());
      if (members.length > 0) {
        voiceStatus[channel.name] = members.map((member) => ({
          username: member.user.username,
          nickname: member.nickname || member.user.username,
          id: member.user.id,
        }));
      }
    });

    // Update immediately on voice state change
    await rtdb.ref('discord/voice-channels').set(voiceStatus);

    const user = newState.member.user.username;
    if (newState.channel) {
      console.log(`🎤 ${user} joined voice channel: ${newState.channel.name}`);
    } else if (oldState.channel) {
      console.log(`🎤 ${user} left voice channel: ${oldState.channel.name}`);
    }
  } catch (error) {
    console.error('❌ Error handling voice state update:', error);
  }
});

// Handle errors
client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.DISCORD_BOT_TOKEN).catch((error) => {
  console.error('❌ Failed to login to Discord:', error);
  process.exit(1);
});

console.log('🚀 Starting Discord bot...');
