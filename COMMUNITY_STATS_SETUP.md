# Community Stats Setup Guide

## 📊 How to Add Your Power BI Stats to the AI Assistant

Your AI Assistant can now answer questions about YOUR local community stats from Power BI!

---

## 🚀 Quick Setup (One-Time)

### Step 1: Prepare Your Data

From your Power BI dashboard (https://app.powerbi.com/view?r=eyJrIjoiY2QwMGE1ZDItODVmNS00ZDFlLTk5NTAtMjUxNDE4ZDIxMWM1IiwidCI6ImJkZTY4YTRhLWE5YmEtNGIxYS05N2Y1LTQ2ZjNiOWY4ZjhjYyIsImMiOjEwfQ%3D%3D), extract stats for each player in this format:

```javascript
{
  "totalGames": 150,  // Total games in your community
  "players": {
    "el'chapo": {  // Player name (lowercase)
      "totalGames": 45,
      "wins": 28,
      "losses": 17,
      "winRate": 62.2,  // Percentage
      "averageKills": 8.5,
      "averageDeaths": 4.2,
      "averageAssists": 12.3,
      "kda": 4.95,  // (K+A)/D
      "favoriteRole": "Support",  // Carry, Mid, Offlane, Support, Roaming
      "favoriteHeroes": [
        {
          "name": "Crystal Maiden",
          "games": 12,
          "winRate": 75
        },
        {
          "name": "Lion",
          "games": 10,
          "winRate": 60
        }
      ],
      "lastPlayed": "2025-12-04"  // YYYY-MM-DD
    },
    "tebo": {
      "totalGames": 38,
      "wins": 20,
      "losses": 18,
      "winRate": 52.6,
      "averageKills": 12.1,
      "averageDeaths": 6.8,
      "averageAssists": 9.4,
      "kda": 3.16,
      "favoriteRole": "Mid",
      "favoriteHeroes": [
        {
          "name": "Invoker",
          "games": 15,
          "winRate": 66.7
        }
      ],
      "lastPlayed": "2025-12-03"
    }
    // Add all your community players here...
  }
}
```

### Step 2: Add Data via Browser Console

1. Open your deployed site
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Copy and paste this code (replace with YOUR data):

```javascript
// Import Firebase
const { db } = await import('./src/firebase.js');
const { doc, setDoc } = await import('firebase/firestore');

// YOUR COMMUNITY STATS DATA
const communityStats = {
  totalGames: 150,
  lastUpdated: new Date().toISOString(),
  players: {
    "el'chapo": {
      totalGames: 45,
      wins: 28,
      losses: 17,
      winRate: 62.2,
      averageKills: 8.5,
      averageDeaths: 4.2,
      averageAssists: 12.3,
      kda: 4.95,
      favoriteRole: 'Support',
      favoriteHeroes: [
        { name: 'Crystal Maiden', games: 12, winRate: 75 },
        { name: 'Lion', games: 10, winRate: 60 },
      ],
      lastPlayed: '2025-12-04',
    },
    // Add ALL your players here...
  },
};

// Save to Firebase
const statsRef = doc(db, 'app-data', 'community-stats');
await setDoc(statsRef, communityStats);

console.log('✅ Community stats uploaded successfully!');
```

4. Press `Enter`
5. Wait for "✅ Community stats uploaded successfully!"

---

## 🎯 Example Queries

Once data is uploaded, users can ask:

### Individual Player Stats:
- **"El'Chapo winrate"**
- **"Show me Tebo stats"**
- **"What's Player1 performance?"**

### Leaderboard:
- **"Community leaderboard"**
- **"Top players"**
- **"Rankings"**

### Comparisons:
- **"El'Chapo vs Tebo"**
- **"Compare Player1 and Player2"**

---

## 🔄 Updating Stats

When your Power BI data changes:

1. Update the `communityStats` object with new numbers
2. Run the same browser console script
3. Data updates immediately!

---

## 💡 Tips

### Extract Data from Power BI:

1. Open each page of your Power BI dashboard
2. Note down for each player:
   - Total games, wins, losses
   - Average K/D/A
   - Favorite heroes
   - Win rate %
3. Calculate KDA: `(avgKills + avgAssists) / avgDeaths`
4. Calculate win rate: `(wins / totalGames) * 100`

### Player Names:
- Use lowercase (e.g., "el'chapo" not "El'Chapo")
- Keep apostrophes and special characters
- AI will match partial names (searching "chapo" finds "el'chapo")

---

## 📱 Testing

After uploading, test in AI Assistant:
1. Go to AI Assistant tab
2. Type: **"El'Chapo winrate"**
3. Should show full stats!

---

## 🛠️ Troubleshooting

### "Community stats not loaded yet"
- Run the browser console script again
- Refresh the page
- Check Firebase console for errors

### "Couldn't find player"
- Check spelling (case-insensitive but must match)
- Verify player name in data
- Try: "leaderboard" to see all available players

### Need to Delete All Stats?
```javascript
const { db } = await import('./src/firebase.js');
const { doc, deleteDoc } = await import('firebase/firestore');
await deleteDoc(doc(db, 'app-data', 'community-stats'));
console.log('✅ Stats deleted');
```

---

## 🎊 You're Done!

Your AI Assistant now knows YOUR community's stats from Power BI!

Players can ask about their performance, compare with others, and see leaderboards - all from the AI chat! 🚀
