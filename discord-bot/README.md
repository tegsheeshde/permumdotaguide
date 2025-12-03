<<<<<<< HEAD
# discord-bot
=======
# Discord Bot for Dota 2 Community App

This bot creates a full bidirectional integration between your Discord server and the Dota 2 web app.

## ✨ Features

### Bidirectional Message Sync
- Messages from web app appear in Discord
- Messages from Discord appear in web app
- Real-time synchronization via Firebase

### Discord Presence Integration
- Shows who's online on Discord
- Displays current activities (Playing Dota 2, etc.)
- Shows user status (Online, Idle, DND)
- Syncs every 15 seconds

### Voice Channel Monitoring
- Shows who's in voice channels
- Displays channel names and participants
- Updates immediately when users join/leave
- Syncs every 10 seconds

### Feed Posts to Discord
- Automatically posts feed updates to Discord
- Includes images and videos
- Rich embed formatting
- Shows reactions and comments

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** installed (v18 or higher)
2. **Discord Bot Token** (see setup guide)
3. **Firebase Admin SDK credentials**
4. **Discord Webhook URL**

## 🚀 Quick Setup

### Step 1: Install Dependencies

```bash
cd discord-bot
npm install
```

### Step 2: Get Firebase Admin SDK Credentials

1. Go to: https://console.firebase.google.com/project/permumdota/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Download the JSON file
4. Rename it to `firebase-service-account.json`
5. Place it in the `discord-bot/` directory

**⚠️ IMPORTANT: Never commit this file to Git!**

### Step 3: Configure Environment Variables

Create a `.env` file in the `discord-bot/` directory:

```env
# Discord Bot Token (from Developer Portal)
DISCORD_BOT_TOKEN=YOUR_BOT_TOKEN_HERE

# Discord Channel ID (right-click channel → Copy ID)
DISCORD_CHANNEL_ID=YOUR_CHANNEL_ID_HERE

# Discord Server/Guild ID (right-click server icon → Copy ID)
DISCORD_GUILD_ID=YOUR_SERVER_ID_HERE

# Firebase Configuration
FIREBASE_DATABASE_URL=https://permumdota-default-rtdb.asia-southeast1.firebasedatabase.app
FIREBASE_PROJECT_ID=permumdota
```

**How to get IDs:**
1. Enable Developer Mode in Discord: Settings → Advanced → Developer Mode
2. Right-click channel or server → "Copy ID"

### Step 4: Start the Bot

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## ✅ Verification

When the bot starts successfully, you should see:

```
🚀 Starting Discord bot...
✅ Discord bot is online!
📝 Logged in as: YourBotName#1234
🔗 Monitoring channel ID: 1234567890
🎤 Starting voice channel monitoring...
👥 Starting presence monitoring...
```

## 📊 What Gets Synced

### Web App → Discord:
- ✅ Chat messages
- ✅ Feed posts (with images/videos)
- ✅ Poll creations
- ✅ User status updates

### Discord → Web App:
- ✅ Chat messages
- ✅ Online/offline status
- ✅ Voice channel participants
- ✅ Playing Dota 2 status
- ✅ User avatars

## 🔧 Troubleshooting

### Bot shows offline
- Check `DISCORD_BOT_TOKEN` is correct
- Verify bot has been invited to your server
- Ensure bot has proper permissions

### Messages not syncing
- Verify `DISCORD_CHANNEL_ID` is correct
- Check bot can read/send messages in that channel
- Look for errors in console

### Presence not working
- Ensure "Presence Intent" is enabled in Developer Portal
- Check Firebase Realtime Database rules allow writes
- Verify `DISCORD_GUILD_ID` is correct

### Voice channels not detected
- Check bot has "View Channels" permission
- Verify it can see voice channels
- Ensure "Guild Voice States" intent is enabled

## 🔐 Security Best Practices

### Never Commit:
- ❌ `.env` file
- ❌ `firebase-service-account.json`
- ❌ Bot tokens or API keys

### Protect Your Bot Token:
- Regenerate token if accidentally exposed
- Use environment variables only
- Never hardcode in source files

### Firebase Security:
- Use service account with minimal permissions
- Regularly rotate service account keys
- Monitor Firebase usage for anomalies

## 📁 Project Structure

```
discord-bot/
├── bot.js                          # Main bot code
├── package.json                    # Dependencies
├── .env                           # Configuration (not in Git)
├── .env.example                   # Example configuration
├── firebase-service-account.json  # Firebase credentials (not in Git)
└── README.md                      # This file
```

## 🔄 Data Flow

```
┌─────────────────┐
│   Web App       │
│  (React/Vite)   │
└────────┬────────┘
         │
         │ Writes messages
         ▼
┌─────────────────┐
│   Firebase      │◄───────────┐
│  (Firestore +   │            │
│   Realtime DB)  │            │ Bot writes
└────────┬────────┘            │ presence/messages
         │                     │
         │ Webhook sends       │
         │ to Discord          │
         ▼                     │
┌─────────────────┐            │
│   Discord       │            │
│   Server        │            │
└────────┬────────┘            │
         │                     │
         │ Bot reads messages, │
         │ presence, voice     │
         └─────────────────────┘
```

## 🛠️ Development

### Run with auto-restart:
```bash
npm run dev
```

### Test bot commands:
```bash
# Check if bot can read messages
# Send a message in Discord, check console for logs

# Check if bot can write to Firebase
# Look for "✅ Message synced to Firebase"
```

### Debug mode:
Add to `.env`:
```env
DEBUG=true
```

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_BOT_TOKEN` | ✅ Yes | Your bot's authentication token |
| `DISCORD_CHANNEL_ID` | ✅ Yes | Channel to sync messages with |
| `DISCORD_GUILD_ID` | ✅ Yes | Your Discord server ID |
| `FIREBASE_DATABASE_URL` | ✅ Yes | Firebase Realtime Database URL |
| `FIREBASE_PROJECT_ID` | ✅ Yes | Firebase project identifier |

## 🆘 Support

### Common Errors:

**Error: "Invalid token"**
- Your `DISCORD_BOT_TOKEN` is incorrect
- Go to Developer Portal and reset token

**Error: "Missing Access"**
- Bot doesn't have required permissions
- Re-invite bot with correct permissions

**Error: "Firebase permission denied"**
- Service account doesn't have write access
- Check Firebase IAM settings

**Error: "Cannot read channel"**
- `DISCORD_CHANNEL_ID` is wrong
- Bot doesn't have access to that channel

### Getting Help:

1. Check console logs for specific errors
2. Verify all environment variables are set
3. Test Firebase connection separately
4. Ensure bot is online in Discord

## 📚 Additional Resources

- [Discord.js Documentation](https://discord.js.org/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Main Setup Guide](../DISCORD_INTEGRATION_SETUP.md)

## 🎉 Success!

Once running, you should see:
- Messages syncing both ways
- Discord online status in web app
- Voice channel participants displayed
- Feed posts appearing in Discord

The bot will run continuously and automatically restart on crashes. For production, consider using PM2 or similar process manager.
>>>>>>> aa50446 (Initial Discord bot commit)
