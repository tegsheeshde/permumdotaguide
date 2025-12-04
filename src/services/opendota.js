/**
 * OpenDota API Service
 * Fetches player data, match history, and hero statistics
 */

const OPENDOTA_API = 'https://api.opendota.com/api';

/**
 * Search for a player by name
 * @param {string} playerName - Player name to search
 * @returns {Promise<Array>} Array of matching players
 */
export const searchPlayer = async (playerName) => {
  try {
    const response = await fetch(`${OPENDOTA_API}/search?q=${encodeURIComponent(playerName)}`);
    const data = await response.json();
    return data.slice(0, 5); // Return top 5 matches
  } catch (error) {
    console.error('Error searching player:', error);
    return [];
  }
};

/**
 * Get player's recent matches
 * @param {string} accountId - Steam account ID
 * @param {number} limit - Number of matches to fetch (default 10)
 * @returns {Promise<Array>} Array of recent matches
 */
export const getRecentMatches = async (accountId, limit = 10) => {
  try {
    const response = await fetch(`${OPENDOTA_API}/players/${accountId}/recentMatches?limit=${limit}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching recent matches:', error);
    return [];
  }
};

/**
 * Get player profile
 * @param {string} accountId - Steam account ID
 * @returns {Promise<Object>} Player profile data
 */
export const getPlayerProfile = async (accountId) => {
  try {
    const response = await fetch(`${OPENDOTA_API}/players/${accountId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching player profile:', error);
    return null;
  }
};

/**
 * Get player's hero statistics
 * @param {string} accountId - Steam account ID
 * @returns {Promise<Array>} Array of hero stats
 */
export const getPlayerHeroes = async (accountId) => {
  try {
    const response = await fetch(`${OPENDOTA_API}/players/${accountId}/heroes`);
    const data = await response.json();
    return data.slice(0, 10); // Top 10 heroes
  } catch (error) {
    console.error('Error fetching player heroes:', error);
    return [];
  }
};

/**
 * Get player's win/loss record
 * @param {string} accountId - Steam account ID
 * @returns {Promise<Object>} Win/Loss data
 */
export const getPlayerWinLoss = async (accountId) => {
  try {
    const response = await fetch(`${OPENDOTA_API}/players/${accountId}/wl`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching win/loss:', error);
    return { win: 0, lose: 0 };
  }
};

/**
 * Get hero name by ID
 */
const HERO_NAMES = {
  1: "Anti-Mage", 2: "Axe", 3: "Bane", 4: "Bloodseeker", 5: "Crystal Maiden",
  6: "Drow Ranger", 7: "Earthshaker", 8: "Juggernaut", 9: "Mirana", 10: "Morphling",
  11: "Shadow Fiend", 12: "Phantom Lancer", 13: "Puck", 14: "Pudge", 15: "Razor",
  16: "Sand King", 17: "Storm Spirit", 18: "Sven", 19: "Tiny", 20: "Vengeful Spirit",
  21: "Windranger", 22: "Zeus", 23: "Kunkka", 25: "Lina", 26: "Lion",
  27: "Shadow Shaman", 28: "Slardar", 29: "Tidehunter", 30: "Witch Doctor", 31: "Lich",
  32: "Riki", 33: "Enigma", 34: "Tinker", 35: "Sniper", 36: "Necrophos",
  37: "Warlock", 38: "Beastmaster", 39: "Queen of Pain", 40: "Venomancer", 41: "Faceless Void",
  42: "Wraith King", 43: "Death Prophet", 44: "Phantom Assassin", 45: "Pugna", 46: "Templar Assassin",
  47: "Viper", 48: "Luna", 49: "Dragon Knight", 50: "Dazzle", 51: "Clockwerk",
  52: "Leshrac", 53: "Nature's Prophet", 54: "Lifestealer", 55: "Dark Seer", 56: "Clinkz",
  57: "Omniknight", 58: "Enchantress", 59: "Huskar", 60: "Night Stalker", 61: "Broodmother",
  62: "Bounty Hunter", 63: "Weaver", 64: "Jakiro", 65: "Batrider", 66: "Chen",
  67: "Spectre", 68: "Ancient Apparition", 69: "Doom", 70: "Ursa", 71: "Spirit Breaker",
  72: "Gyrocopter", 73: "Alchemist", 74: "Invoker", 75: "Silencer", 76: "Outworld Destroyer",
  77: "Lycan", 78: "Brewmaster", 79: "Shadow Demon", 80: "Lone Druid", 81: "Chaos Knight",
  82: "Meepo", 83: "Treant Protector", 84: "Ogre Magi", 85: "Undying", 86: "Rubick",
  87: "Disruptor", 88: "Nyx Assassin", 89: "Naga Siren", 90: "Keeper of the Light",
  91: "Io", 92: "Visage", 93: "Slark", 94: "Medusa", 95: "Troll Warlord",
  96: "Centaur Warrunner", 97: "Magnus", 98: "Timbersaw", 99: "Bristleback", 100: "Tusk",
  101: "Skywrath Mage", 102: "Abaddon", 103: "Elder Titan", 104: "Legion Commander", 105: "Techies",
  106: "Ember Spirit", 107: "Earth Spirit", 108: "Underlord", 109: "Terrorblade", 110: "Phoenix",
  111: "Oracle", 112: "Winter Wyvern", 113: "Arc Warden", 114: "Monkey King", 119: "Dark Willow",
  120: "Pangolier", 121: "Grimstroke", 123: "Hoodwink", 126: "Void Spirit", 128: "Snapfire",
  129: "Mars", 135: "Dawnbreaker", 136: "Marci", 137: "Primal Beast", 138: "Muerta",
  145: "Ringmaster", 146: "Kez"
};

export const getHeroName = (heroId) => {
  return HERO_NAMES[heroId] || `Hero ${heroId}`;
};

/**
 * Analyze player's recent hero picks
 * @param {Array} matches - Array of recent matches
 * @returns {Object} Analysis of hero picks
 */
export const analyzeRecentHeroes = (matches) => {
  const heroCount = {};
  const heroWins = {};

  matches.forEach(match => {
    const heroId = match.hero_id;
    const heroName = getHeroName(heroId);

    heroCount[heroName] = (heroCount[heroName] || 0) + 1;

    if (!heroWins[heroName]) {
      heroWins[heroName] = { wins: 0, games: 0 };
    }

    heroWins[heroName].games++;
    if ((match.player_slot < 128 && match.radiant_win) ||
        (match.player_slot >= 128 && !match.radiant_win)) {
      heroWins[heroName].wins++;
    }
  });

  // Sort by frequency
  const sortedHeroes = Object.entries(heroCount)
    .sort((a, b) => b[1] - a[1])
    .map(([hero, count]) => ({
      hero,
      games: count,
      wins: heroWins[hero].wins,
      winrate: ((heroWins[hero].wins / heroWins[hero].games) * 100).toFixed(1)
    }));

  return sortedHeroes;
};

/**
 * Format match history for display
 * @param {Array} matches - Array of matches
 * @returns {string} Formatted match history
 */
export const formatMatchHistory = (matches) => {
  if (matches.length === 0) return "No recent matches found.";

  const heroStats = analyzeRecentHeroes(matches);

  let result = `**Last ${matches.length} Games:**\n\n`;

  // Most played heroes
  result += "**Hero Pool:**\n";
  heroStats.forEach((stat, idx) => {
    const emoji = stat.winrate >= 50 ? "✅" : "❌";
    result += `${idx + 1}. **${stat.hero}** - ${stat.games} games (${stat.winrate}% WR) ${emoji}\n`;
  });

  // Recent performance
  const recentWins = matches.slice(0, 5).filter(m =>
    (m.player_slot < 128 && m.radiant_win) || (m.player_slot >= 128 && !m.radiant_win)
  ).length;

  result += `\n**Recent Form:** ${recentWins}/5 wins`;

  return result;
};
