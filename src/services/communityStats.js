/**
 * Community Statistics Service
 * Stores and queries local Dota 2 community game statistics
 * Data source: Power BI Dashboard
 */

import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Get community statistics from Firebase
 * @returns {Promise<Object>} Community stats data
 */
export const getCommunityStats = async () => {
  try {
    const statsRef = doc(db, 'app-data', 'community-stats');
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      return statsSnap.data();
    }

    // Return default structure if no data exists
    return {
      players: {},
      lastUpdated: null,
      totalGames: 0,
    };
  } catch (error) {
    console.error('Error fetching community stats:', error);
    return { players: {}, lastUpdated: null, totalGames: 0 };
  }
};

/**
 * Save community statistics to Firebase
 * @param {Object} stats - Community stats data
 */
export const saveCommunityStats = async (stats) => {
  try {
    const statsRef = doc(db, 'app-data', 'community-stats');
    await setDoc(statsRef, {
      ...stats,
      lastUpdated: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error saving community stats:', error);
    return false;
  }
};

/**
 * Find player stats by name (case-insensitive, partial match)
 * @param {Object} communityStats - All community stats
 * @param {string} playerName - Player name to search
 * @returns {Object|null} Player stats or null
 */
export const findPlayerStats = (communityStats, playerName) => {
  if (!communityStats || !communityStats.players) return null;

  const searchName = playerName.toLowerCase().trim();
  const players = communityStats.players;

  // Exact match
  if (players[searchName]) {
    return { name: searchName, ...players[searchName] };
  }

  // Partial match
  const matchedKey = Object.keys(players).find(key =>
    key.toLowerCase().includes(searchName) || searchName.includes(key.toLowerCase())
  );

  if (matchedKey) {
    return { name: matchedKey, ...players[matchedKey] };
  }

  return null;
};

/**
 * Format player stats for AI response
 * @param {Object} playerStats - Player statistics
 * @returns {string} Formatted response
 */
export const formatPlayerStats = (playerStats) => {
  if (!playerStats) return null;

  const {
    name,
    totalGames = 0,
    wins = 0,
    losses = 0,
    winRate = 0,
    averageKills = 0,
    averageDeaths = 0,
    averageAssists = 0,
    kda = 0,
    favoriteHeroes = [],
    favoriteRole = 'Unknown',
    lastPlayed = null,
  } = playerStats;

  let response = `**${name}** - Community Stats\n\n`;

  response += `**📊 Overall Performance:**\n`;
  response += `• Games: ${totalGames} (${wins}W / ${losses}L)\n`;
  response += `• Win Rate: ${winRate}%\n`;
  response += `• KDA: ${kda} (${averageKills}/${averageDeaths}/${averageAssists})\n\n`;

  if (favoriteRole) {
    response += `**🎮 Preferred Role:** ${favoriteRole}\n\n`;
  }

  if (favoriteHeroes && favoriteHeroes.length > 0) {
    response += `**⭐ Top Heroes:**\n`;
    favoriteHeroes.slice(0, 5).forEach((hero, idx) => {
      response += `${idx + 1}. ${hero.name} (${hero.games} games, ${hero.winRate}% WR)\n`;
    });
    response += '\n';
  }

  if (lastPlayed) {
    const lastPlayedDate = new Date(lastPlayed);
    const daysAgo = Math.floor((Date.now() - lastPlayedDate.getTime()) / (1000 * 60 * 60 * 24));
    response += `**📅 Last Played:** ${daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}\n`;
  }

  response += `\n💡 *Data from local community games*`;

  return response;
};

/**
 * Get top players by win rate
 * @param {Object} communityStats - All community stats
 * @param {number} limit - Number of players to return
 * @returns {Array} Top players
 */
export const getTopPlayersByWinRate = (communityStats, limit = 5) => {
  if (!communityStats || !communityStats.players) return [];

  return Object.entries(communityStats.players)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => (b.winRate || 0) - (a.winRate || 0))
    .slice(0, limit);
};

/**
 * Get leaderboard
 * @param {Object} communityStats - All community stats
 * @returns {string} Formatted leaderboard
 */
export const formatLeaderboard = (communityStats) => {
  const topPlayers = getTopPlayersByWinRate(communityStats, 10);

  if (topPlayers.length === 0) {
    return 'No community stats available yet.';
  }

  let response = `**🏆 Community Leaderboard (Win Rate)**\n\n`;

  topPlayers.forEach((player, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
    response += `${medal} **${player.name}** - ${player.winRate}% (${player.wins}W/${player.losses}L)\n`;
  });

  response += `\n💡 *Based on ${communityStats.totalGames || 0} local games*`;

  return response;
};

/**
 * Compare two players
 * @param {Object} communityStats - All community stats
 * @param {string} player1Name - First player name
 * @param {string} player2Name - Second player name
 * @returns {string} Comparison result
 */
export const comparePlayers = (communityStats, player1Name, player2Name) => {
  const player1 = findPlayerStats(communityStats, player1Name);
  const player2 = findPlayerStats(communityStats, player2Name);

  if (!player1 || !player2) {
    const missing = !player1 ? player1Name : player2Name;
    return `❌ Couldn't find stats for "${missing}"`;
  }

  let response = `**${player1.name}** vs **${player2.name}**\n\n`;

  // Win Rate
  response += `**Win Rate:**\n`;
  response += `• ${player1.name}: ${player1.winRate || 0}% ${player1.winRate > player2.winRate ? '🏆' : ''}\n`;
  response += `• ${player2.name}: ${player2.winRate || 0}% ${player2.winRate > player1.winRate ? '🏆' : ''}\n\n`;

  // Games
  response += `**Total Games:**\n`;
  response += `• ${player1.name}: ${player1.totalGames || 0}\n`;
  response += `• ${player2.name}: ${player2.totalGames || 0}\n\n`;

  // KDA
  response += `**KDA:**\n`;
  response += `• ${player1.name}: ${player1.kda || 0} ${player1.kda > player2.kda ? '🏆' : ''}\n`;
  response += `• ${player2.name}: ${player2.kda || 0} ${player2.kda > player1.kda ? '🏆' : ''}\n`;

  return response;
};

/**
 * Example data structure - Use this as a template
 */
export const EXAMPLE_COMMUNITY_STATS = {
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
        { name: 'Shadow Shaman', games: 8, winRate: 62.5 },
      ],
      lastPlayed: '2025-12-03',
    },
    // Add more players here...
  },
};
