/**
 * Advanced Match Data Analysis Service
 * Provides intelligent insights from dota2_matches.json and dota2_statistics.json
 */

let matchData = null;
let statsData = null;

/**
 * Load match data from JSON files
 */
export async function loadMatchData() {
  if (matchData && statsData) return { matchData, statsData };

  try {
    const [matchesRes, statsRes] = await Promise.all([
      fetch('/dota2_matches.json'),
      fetch('/dota2_statistics.json')
    ]);

    matchData = await matchesRes.json();
    statsData = await statsRes.json();

    return { matchData, statsData };
  } catch (error) {
    console.error('Error loading match data:', error);
    return { matchData: null, statsData: null };
  }
}

/**
 * Analyze specific player performance
 */
export function analyzePlayer(playerName) {
  if (!matchData || !statsData) return null;

  const playerStats = statsData.player_statistics.find(
    p => String(p.player_name).toLowerCase() === String(playerName).toLowerCase()
  );

  if (!playerStats) return null;

  // Get player's match history
  const playerMatches = matchData.matches.filter(
    m => String(m.player_name).toLowerCase() === String(playerName).toLowerCase()
  );

  // Analyze recent performance (last 10 games)
  const recentMatches = playerMatches.slice(-10);
  const recentWins = recentMatches.filter(m => m.w_l === 'W').length;
  const recentWinRate = (recentWins / recentMatches.length * 100).toFixed(1);

  // Calculate average KDA for recent games
  const recentKDA = recentMatches.reduce((acc, m) =>
    acc + (m.kill + m.assist) / Math.max(m.death, 1), 0
  ) / recentMatches.length;

  // Get hero pool
  const heroPool = {};
  playerMatches.forEach(m => {
    if (!heroPool[m.hero_name]) {
      heroPool[m.hero_name] = { games: 0, wins: 0 };
    }
    heroPool[m.hero_name].games++;
    if (m.w_l === 'W') heroPool[m.hero_name].wins++;
  });

  // Sort by most played
  const topHeroes = Object.entries(heroPool)
    .map(([hero, data]) => ({
      hero,
      games: data.games,
      wins: data.wins,
      winRate: (data.wins / data.games * 100).toFixed(1)
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 5);

  // Best performing heroes (min 3 games, 60%+ WR)
  const bestHeroes = Object.entries(heroPool)
    .filter(([, data]) => data.games >= 3)
    .map(([hero, data]) => ({
      hero,
      games: data.games,
      winRate: (data.wins / data.games * 100).toFixed(1)
    }))
    .filter(h => parseFloat(h.winRate) >= 60)
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))
    .slice(0, 3);

  return {
    playerStats,
    totalMatches: playerMatches.length,
    recentWinRate,
    recentKDA: recentKDA.toFixed(2),
    topHeroes,
    bestHeroes,
    recentMatches: recentMatches.slice(-5).reverse()
  };
}

/**
 * Analyze hero performance across all matches
 */
export function analyzeHero(heroName) {
  if (!matchData || !statsData) return null;

  const heroStats = statsData.hero_statistics.find(
    h => String(h.hero_name).toLowerCase() === String(heroName).toLowerCase()
  );

  if (!heroStats) return null;

  // Get all matches with this hero
  const heroMatches = matchData.matches.filter(
    m => String(m.hero_name).toLowerCase() === String(heroName).toLowerCase()
  );

  // Players who play this hero
  const playerPerformance = {};
  heroMatches.forEach(m => {
    if (!playerPerformance[m.player_name]) {
      playerPerformance[m.player_name] = { games: 0, wins: 0, totalKDA: 0 };
    }
    const data = playerPerformance[m.player_name];
    data.games++;
    if (m.w_l === 'W') data.wins++;
    data.totalKDA += (m.kill + m.assist) / Math.max(m.death, 1);
  });

  // Best players on this hero
  const bestPlayers = Object.entries(playerPerformance)
    .filter(([, data]) => data.games >= 3)
    .map(([player, data]) => ({
      player,
      games: data.games,
      winRate: (data.wins / data.games * 100).toFixed(1),
      avgKDA: (data.totalKDA / data.games).toFixed(2)
    }))
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))
    .slice(0, 3);

  // Popular item builds
  const itemBuilds = {};
  heroMatches.forEach(m => {
    const items = [m.item1, m.Item2, m.item3, m.item4, m.item5, m.item6]
      .filter(item => item && item !== 'null');
    items.forEach(item => {
      if (!itemBuilds[item]) itemBuilds[item] = 0;
      itemBuilds[item]++;
    });
  });

  const popularItems = Object.entries(itemBuilds)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([item, count]) => ({
      item,
      pickRate: (count / heroMatches.length * 100).toFixed(1)
    }));

  return {
    heroStats,
    bestPlayers,
    popularItems,
    totalMatches: heroMatches.length
  };
}

/**
 * Get item timing analysis for a hero
 */
export function getItemTimings(heroName) {
  if (!matchData) return null;

  const heroMatches = matchData.matches.filter(
    m => String(m.hero_name).toLowerCase() === String(heroName).toLowerCase()
  );

  if (heroMatches.length === 0) return null;

  // Analyze item timings
  const itemTimings = {};
  heroMatches.forEach(m => {
    for (let i = 1; i <= 6; i++) {
      const item = m[`item${i}`] || m[`Item${i}`];
      const timing = m[`item${i}-t`];

      if (item && timing && item !== 'null') {
        if (!itemTimings[item]) {
          itemTimings[item] = [];
        }
        itemTimings[item].push(timing);
      }
    }
  });

  // Calculate average timings
  const avgTimings = Object.entries(itemTimings)
    .map(([item, timings]) => ({
      item,
      avgTiming: calculateAvgTime(timings),
      samples: timings.length
    }))
    .filter(t => t.samples >= 3) // Only include items with 3+ samples
    .sort((a, b) => timeToSeconds(a.avgTiming) - timeToSeconds(b.avgTiming));

  return avgTimings;
}

/**
 * Compare two players head-to-head
 */
export function comparePlayersDetailed(player1Name, player2Name) {
  if (!statsData) return null;

  const p1 = statsData.player_statistics.find(
    p => String(p.player_name).toLowerCase() === String(player1Name).toLowerCase()
  );
  const p2 = statsData.player_statistics.find(
    p => String(p.player_name).toLowerCase() === String(player2Name).toLowerCase()
  );

  if (!p1 || !p2) return null;

  return {
    player1: {
      name: p1.player_name,
      winRate: p1.win_rate,
      kda: p1.kda_ratio,
      gpm: p1.avg_gpm.toFixed(0),
      xpm: p1.avg_xpm.toFixed(0),
      games: p1.games_played,
      mostPlayed: p1.most_played_hero
    },
    player2: {
      name: p2.player_name,
      winRate: p2.win_rate,
      kda: p2.kda_ratio,
      gpm: p2.avg_gpm.toFixed(0),
      xpm: p2.avg_xpm.toFixed(0),
      games: p2.games_played,
      mostPlayed: p2.most_played_hero
    },
    winner: {
      winRate: p1.win_rate > p2.win_rate ? p1.player_name : p2.player_name,
      kda: p1.kda_ratio > p2.kda_ratio ? p1.player_name : p2.player_name,
      gpm: p1.avg_gpm > p2.avg_gpm ? p1.player_name : p2.player_name,
      xpm: p1.avg_xpm > p2.avg_xpm ? p1.player_name : p2.player_name
    }
  };
}

/**
 * Get meta insights - best performing heroes
 */
export function getMetaHeroes() {
  if (!statsData) return null;

  // High win rate heroes (min 10 games)
  const metaHeroes = statsData.hero_statistics
    .filter(h => h.times_picked >= 10)
    .sort((a, b) => b.win_rate - a.win_rate)
    .slice(0, 5);

  // Most picked heroes
  const popularHeroes = [...statsData.hero_statistics]
    .sort((a, b) => b.times_picked - a.times_picked)
    .slice(0, 5);

  return {
    metaHeroes,
    popularHeroes
  };
}

/**
 * Find player matches with specific hero
 */
export function getPlayerHeroStats(playerName, heroName) {
  if (!matchData) return null;

  const matches = matchData.matches.filter(
    m => String(m.player_name).toLowerCase() === String(playerName).toLowerCase() &&
         String(m.hero_name).toLowerCase() === String(heroName).toLowerCase()
  );

  if (matches.length === 0) return null;

  const wins = matches.filter(m => m.w_l === 'W').length;
  const totalKills = matches.reduce((acc, m) => acc + m.kill, 0);
  const totalDeaths = matches.reduce((acc, m) => acc + m.death, 0);
  const totalAssists = matches.reduce((acc, m) => acc + m.assist, 0);
  const avgGPM = matches.reduce((acc, m) => acc + m.gpm, 0) / matches.length;
  const avgKDA = matches.reduce((acc, m) =>
    acc + (m.kill + m.assist) / Math.max(m.death, 1), 0
  ) / matches.length;

  return {
    games: matches.length,
    wins,
    winRate: (wins / matches.length * 100).toFixed(1),
    totalKills,
    totalDeaths,
    totalAssists,
    avgKDA: avgKDA.toFixed(2),
    avgGPM: avgGPM.toFixed(0),
    recentMatches: matches.slice(-5).reverse()
  };
}

/**
 * Get leaderboard by specific stat
 */
export function getLeaderboard(statType = 'winRate', minGames = 10) {
  if (!statsData) return null;

  const players = statsData.player_statistics
    .filter(p => p.games_played >= minGames)
    .sort((a, b) => {
      switch (statType) {
        case 'winRate': return b.win_rate - a.win_rate;
        case 'kda': return b.kda_ratio - a.kda_ratio;
        case 'gpm': return b.avg_gpm - a.avg_gpm;
        case 'xpm': return b.avg_xpm - a.avg_xpm;
        default: return b.win_rate - a.win_rate;
      }
    })
    .slice(0, 10);

  return players;
}

// Helper functions
function calculateAvgTime(times) {
  const totalSeconds = times.reduce((acc, time) => acc + timeToSeconds(time), 0);
  const avgSeconds = totalSeconds / times.length;
  return secondsToTime(avgSeconds);
}

function timeToSeconds(timeStr) {
  const [min, sec] = timeStr.split(':').map(Number);
  return min * 60 + sec;
}

function secondsToTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Format player analysis response
 */
export function formatPlayerAnalysis(analysis) {
  if (!analysis) return "Player not found in match data.";

  const { playerStats, recentWinRate, recentKDA, topHeroes, bestHeroes } = analysis;

  let response = `**${playerStats.player_name}** - Full Analysis\n\n`;

  response += `**📊 Overall Stats:**\n`;
  response += `• Games: ${playerStats.games_played} (${playerStats.wins}W/${playerStats.games_played - playerStats.wins}L)\n`;
  response += `• Win Rate: ${playerStats.win_rate}%\n`;
  response += `• KDA Ratio: ${playerStats.kda_ratio}\n`;
  response += `• AVG GPM/XPM: ${playerStats.avg_gpm.toFixed(0)}/${playerStats.avg_xpm.toFixed(0)}\n\n`;

  response += `**🔥 Recent Form (Last 10):**\n`;
  response += `• Win Rate: ${recentWinRate}%\n`;
  response += `• AVG KDA: ${recentKDA}\n\n`;

  response += `**🎮 Top Heroes:**\n`;
  topHeroes.forEach((h, i) => {
    response += `${i + 1}. **${h.hero}** - ${h.games} games (${h.winRate}% WR)\n`;
  });

  if (bestHeroes.length > 0) {
    response += `\n**⭐ Best Performers (60%+ WR):**\n`;
    bestHeroes.forEach(h => {
      response += `• **${h.hero}**: ${h.winRate}% WR in ${h.games} games\n`;
    });
  }

  return response;
}

/**
 * Format hero analysis response
 */
export function formatHeroAnalysis(analysis) {
  if (!analysis) return "Hero not found in match data.";

  const { heroStats, bestPlayers, popularItems } = analysis;

  let response = `**${heroStats.hero_name.toUpperCase()}** - Meta Analysis\n\n`;

  response += `**📊 Overall Stats:**\n`;
  response += `• Times Picked: ${heroStats.times_picked}\n`;
  response += `• Win Rate: ${heroStats.win_rate}%\n`;
  response += `• AVG KDA: ${heroStats.avg_kills.toFixed(1)}/${heroStats.avg_deaths.toFixed(1)}/${heroStats.avg_assists.toFixed(1)}\n`;
  response += `• AVG GPM/XPM: ${heroStats.avg_gpm.toFixed(0)}/${heroStats.avg_xpm.toFixed(0)}\n\n`;

  if (bestPlayers.length > 0) {
    response += `**🏆 Best Players:**\n`;
    bestPlayers.forEach((p, i) => {
      response += `${i + 1}. **${p.player}** - ${p.winRate}% WR (${p.games} games, ${p.avgKDA} KDA)\n`;
    });
    response += `\n`;
  }

  response += `**🛡️ Popular Items:**\n`;
  popularItems.forEach((item, i) => {
    response += `${i + 1}. **${item.item}** - ${item.pickRate}% pick rate\n`;
  });

  return response;
}

/**
 * Format comparison response
 */
export function formatComparison(comparison) {
  if (!comparison) return "One or both players not found.";

  const { player1, player2, winner } = comparison;

  let response = `**${player1.name} vs ${player2.name}**\n\n`;

  response += `**📊 Stats Comparison:**\n\n`;
  response += `**Win Rate:**\n`;
  response += `• ${player1.name}: ${player1.winRate}% ${winner.winRate === player1.name ? '👑' : ''}\n`;
  response += `• ${player2.name}: ${player2.winRate}% ${winner.winRate === player2.name ? '👑' : ''}\n\n`;

  response += `**KDA Ratio:**\n`;
  response += `• ${player1.name}: ${player1.kda} ${winner.kda === player1.name ? '👑' : ''}\n`;
  response += `• ${player2.name}: ${player2.kda} ${winner.kda === player2.name ? '👑' : ''}\n\n`;

  response += `**Farm (GPM):**\n`;
  response += `• ${player1.name}: ${player1.gpm} ${winner.gpm === player1.name ? '👑' : ''}\n`;
  response += `• ${player2.name}: ${player2.gpm} ${winner.gpm === player2.name ? '👑' : ''}\n\n`;

  response += `**Experience (XPM):**\n`;
  response += `• ${player1.name}: ${player1.xpm} ${winner.xpm === player1.name ? '👑' : ''}\n`;
  response += `• ${player2.name}: ${player2.xpm} ${winner.xpm === player2.name ? '👑' : ''}\n\n`;

  response += `**Most Played:**\n`;
  response += `• ${player1.name}: ${player1.mostPlayed}\n`;
  response += `• ${player2.name}: ${player2.mostPlayed}`;

  return response;
}

/**
 * Format meta analysis response
 */
export function formatMetaAnalysis(meta) {
  if (!meta) return "No meta data available.";

  const { metaHeroes, popularHeroes } = meta;

  let response = `**🎯 Current Meta Analysis**\n\n`;

  response += `**🏆 Highest Win Rate Heroes (10+ games):**\n`;
  metaHeroes.forEach((h, i) => {
    response += `${i + 1}. **${h.hero_name}** - ${h.win_rate}% WR (${h.times_picked} games)\n`;
  });

  response += `\n**⭐ Most Popular Heroes:**\n`;
  popularHeroes.forEach((h, i) => {
    response += `${i + 1}. **${h.hero_name}** - ${h.times_picked} picks (${h.win_rate}% WR)\n`;
  });

  return response;
}

/**
 * Find counter picks based on match data
 * Analyzes which heroes have the best win rate against a specific hero
 */
export function getCounterPicks(heroName) {
  if (!matchData || !statsData) return null;

  // Get all matches with this hero
  const targetHeroMatches = matchData.matches.filter(
    m => String(m.hero_name).toLowerCase() === String(heroName).toLowerCase()
  );

  if (targetHeroMatches.length === 0) return null;

  // Analyze enemy heroes (heroes that played AGAINST the target hero)
  const enemyHeroPerformance = {};

  targetHeroMatches.forEach(match => {
    const targetTeam = match.team; // Radiant or Dire
    const targetResult = match.w_l; // W or L

    // Find enemy heroes in the same game (opposite team)
    const enemyMatches = matchData.matches.filter(
      m => m.game_id === match.game_id &&
           m.team !== targetTeam &&
           String(m.hero_name).toLowerCase() !== String(heroName).toLowerCase()
    );

    enemyMatches.forEach(enemy => {
      const enemyHero = String(enemy.hero_name).toLowerCase();

      if (!enemyHeroPerformance[enemyHero]) {
        enemyHeroPerformance[enemyHero] = {
          gamesAgainst: 0,
          winsAgainst: 0,
          avgKDA: 0,
          totalKDA: 0
        };
      }

      const data = enemyHeroPerformance[enemyHero];
      data.gamesAgainst++;

      // If target hero LOST, enemy hero WON
      if (targetResult === 'L') {
        data.winsAgainst++;
      }

      // Calculate enemy's KDA in this match
      const kda = (enemy.kill + enemy.assist) / Math.max(enemy.death, 1);
      data.totalKDA += kda;
    });
  });

  // Calculate win rates and filter good counters
  const counters = Object.entries(enemyHeroPerformance)
    .map(([hero, data]) => ({
      hero,
      gamesAgainst: data.gamesAgainst,
      winsAgainst: data.winsAgainst,
      winRate: (data.winsAgainst / data.gamesAgainst * 100).toFixed(1),
      avgKDA: (data.totalKDA / data.gamesAgainst).toFixed(2)
    }))
    .filter(c => c.gamesAgainst >= 3) // Minimum 3 games for reliability
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

  // Separate strong counters (60%+) and decent counters (50-60%)
  const hardCounters = counters.filter(c => parseFloat(c.winRate) >= 60).slice(0, 5);
  const softCounters = counters.filter(c => parseFloat(c.winRate) >= 50 && parseFloat(c.winRate) < 60).slice(0, 5);

  return {
    targetHero: heroName,
    totalMatches: targetHeroMatches.length,
    hardCounters,
    softCounters,
    allCounters: counters
  };
}

/**
 * Format counter pick response
 */
export function formatCounterPicks(counterData) {
  if (!counterData) return "Hero not found in match database.";

  const { targetHero, totalMatches, hardCounters, softCounters } = counterData;

  let response = `**🛡️ Counter Picks for ${targetHero.toUpperCase()}**\n`;
  response += `📊 Analysis based on ${totalMatches} matches\n\n`;

  if (hardCounters.length > 0) {
    response += `**⚔️ Hard Counters (60%+ Win Rate):**\n`;
    hardCounters.forEach((c, i) => {
      response += `${i + 1}. **${c.hero}** - ${c.winRate}% WR against ${targetHero} (${c.gamesAgainst} games, ${c.avgKDA} KDA)\n`;
    });
    response += `\n`;
  }

  if (softCounters.length > 0) {
    response += `**🔸 Soft Counters (50-60% Win Rate):**\n`;
    softCounters.forEach((c, i) => {
      response += `${i + 1}. **${c.hero}** - ${c.winRate}% WR against ${targetHero} (${c.gamesAgainst} games, ${c.avgKDA} KDA)\n`;
    });
    response += `\n`;
  }

  if (hardCounters.length === 0 && softCounters.length === 0) {
    response += `⚠️ Not enough data to determine reliable counters.\n`;
    response += `Need heroes with 3+ games against ${targetHero} and 50%+ win rate.\n\n`;
  }

  response += `💡 **Data-Driven:** These counters are calculated from YOUR community's actual match history!`;

  return response;
}

/**
 * Find best teammates for a player
 * Analyzes which players perform best when on the same team
 */
export function getBestTeammates(playerName) {
  if (!matchData) return null;

  // Get all matches for the target player
  const playerMatches = matchData.matches.filter(
    m => String(m.player_name).toLowerCase() === String(playerName).toLowerCase()
  );

  if (playerMatches.length === 0) return null;

  // Analyze teammates performance
  const teammatePerformance = {};

  playerMatches.forEach(match => {
    const playerTeam = match.team;
    const matchResult = match.w_l;

    // Find teammates in the same game
    const teammates = matchData.matches.filter(
      m => m.game_id === match.game_id &&
           m.team === playerTeam &&
           String(m.player_name).toLowerCase() !== String(playerName).toLowerCase()
    );

    teammates.forEach(teammate => {
      const teammateName = String(teammate.player_name);

      if (!teammatePerformance[teammateName]) {
        teammatePerformance[teammateName] = {
          gamesTogether: 0,
          winsTogether: 0,
          totalKDA: 0
        };
      }

      const data = teammatePerformance[teammateName];
      data.gamesTogether++;
      if (matchResult === 'W') {
        data.winsTogether++;
      }

      // Calculate teammate's KDA in this match
      const kda = (teammate.kill + teammate.assist) / Math.max(teammate.death, 1);
      data.totalKDA += kda;
    });
  });

  // Calculate stats and sort by win rate
  const teammates = Object.entries(teammatePerformance)
    .map(([name, data]) => ({
      name,
      gamesTogether: data.gamesTogether,
      winsTogether: data.winsTogether,
      winRate: (data.winsTogether / data.gamesTogether * 100).toFixed(1),
      avgKDA: (data.totalKDA / data.gamesTogether).toFixed(2)
    }))
    .filter(t => t.gamesTogether >= 3) // Minimum 3 games for reliability
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

  return {
    playerName,
    totalMatches: playerMatches.length,
    teammates
  };
}

/**
 * Find worst teammates for a player
 */
export function getWorstTeammates(playerName) {
  const data = getBestTeammates(playerName);
  if (!data) return null;

  // Reverse sort to get worst performing teammates
  const worstTeammates = [...data.teammates]
    .sort((a, b) => parseFloat(a.winRate) - parseFloat(b.winRate));

  return {
    playerName: data.playerName,
    totalMatches: data.totalMatches,
    teammates: worstTeammates
  };
}

/**
 * Find best matchups for a player (enemy players they perform well against)
 */
export function getBestMatchups(playerName) {
  if (!matchData) return null;

  // Get all matches for the target player
  const playerMatches = matchData.matches.filter(
    m => String(m.player_name).toLowerCase() === String(playerName).toLowerCase()
  );

  if (playerMatches.length === 0) return null;

  // Analyze enemy player performance
  const enemyPerformance = {};

  playerMatches.forEach(match => {
    const playerTeam = match.team;
    const matchResult = match.w_l;

    // Find enemies in the same game
    const enemies = matchData.matches.filter(
      m => m.game_id === match.game_id &&
           m.team !== playerTeam
    );

    enemies.forEach(enemy => {
      const enemyName = String(enemy.player_name);

      if (!enemyPerformance[enemyName]) {
        enemyPerformance[enemyName] = {
          gamesAgainst: 0,
          winsAgainst: 0,
          totalKDA: 0 // Player's KDA when facing this enemy
        };
      }

      const data = enemyPerformance[enemyName];
      data.gamesAgainst++;
      if (matchResult === 'W') {
        data.winsAgainst++;
      }

      // Player's KDA in this match (not enemy's)
      const kda = (match.kill + match.assist) / Math.max(match.death, 1);
      data.totalKDA += kda;
    });
  });

  // Calculate stats and sort by win rate
  const matchups = Object.entries(enemyPerformance)
    .map(([name, data]) => ({
      name,
      gamesAgainst: data.gamesAgainst,
      winsAgainst: data.winsAgainst,
      winRate: (data.winsAgainst / data.gamesAgainst * 100).toFixed(1),
      avgKDA: (data.totalKDA / data.gamesAgainst).toFixed(2)
    }))
    .filter(m => m.gamesAgainst >= 3) // Minimum 3 games for reliability
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

  return {
    playerName,
    totalMatches: playerMatches.length,
    matchups
  };
}

/**
 * Find worst matchups for a player (enemy players they struggle against)
 */
export function getWorstMatchups(playerName) {
  const data = getBestMatchups(playerName);
  if (!data) return null;

  // Reverse sort to get worst performing matchups
  const worstMatchups = [...data.matchups]
    .sort((a, b) => parseFloat(a.winRate) - parseFloat(b.winRate));

  return {
    playerName: data.playerName,
    totalMatches: data.totalMatches,
    matchups: worstMatchups
  };
}

/**
 * Format best teammates response
 */
export function formatBestTeammates(data) {
  if (!data) return "Player not found in match database.";

  const { playerName, totalMatches, teammates } = data;

  let response = `**🤝 Best Teammates for ${playerName}**\n`;
  response += `📊 Analysis based on ${totalMatches} matches\n\n`;

  if (teammates.length > 0) {
    response += `**🌟 Top Performing Teammates:**\n`;
    teammates.slice(0, 5).forEach((t, i) => {
      response += `${i + 1}. **${t.name}** - ${t.winRate}% WR together (${t.gamesTogether} games, ${t.avgKDA} avg KDA)\n`;
    });
  } else {
    response += `⚠️ Not enough data to determine teammates.\n`;
    response += `Need at least 3 games together with each teammate.\n`;
  }

  return response;
}

/**
 * Format worst teammates response
 */
export function formatWorstTeammates(data) {
  if (!data) return "Player not found in match database.";

  const { playerName, totalMatches, teammates } = data;

  let response = `**💔 Worst Teammates for ${playerName}**\n`;
  response += `📊 Analysis based on ${totalMatches} matches\n\n`;

  if (teammates.length > 0) {
    response += `**⚠️ Struggling Combinations:**\n`;
    teammates.slice(0, 5).forEach((t, i) => {
      response += `${i + 1}. **${t.name}** - ${t.winRate}% WR together (${t.gamesTogether} games, ${t.avgKDA} avg KDA)\n`;
    });
  } else {
    response += `⚠️ Not enough data to determine teammates.\n`;
    response += `Need at least 3 games together with each teammate.\n`;
  }

  return response;
}

/**
 * Format best matchups response
 */
export function formatBestMatchups(data) {
  if (!data) return "Player not found in match database.";

  const { playerName, totalMatches, matchups } = data;

  let response = `**⚔️ Best Matchups for ${playerName}**\n`;
  response += `📊 Analysis based on ${totalMatches} matches\n\n`;

  if (matchups.length > 0) {
    response += `**🎯 Dominant Against:**\n`;
    matchups.slice(0, 5).forEach((m, i) => {
      response += `${i + 1}. **${m.name}** - ${m.winRate}% WR vs them (${m.gamesAgainst} games, ${m.avgKDA} avg KDA)\n`;
    });
  } else {
    response += `⚠️ Not enough data to determine matchups.\n`;
    response += `Need at least 3 games against each opponent.\n`;
  }

  return response;
}

/**
 * Format worst matchups response
 */
export function formatWorstMatchups(data) {
  if (!data) return "Player not found in match database.";

  const { playerName, totalMatches, matchups } = data;

  let response = `**😰 Worst Matchups for ${playerName}**\n`;
  response += `📊 Analysis based on ${totalMatches} matches\n\n`;

  if (matchups.length > 0) {
    response += `**🛑 Struggles Against:**\n`;
    matchups.slice(0, 5).forEach((m, i) => {
      response += `${i + 1}. **${m.name}** - ${m.winRate}% WR vs them (${m.gamesAgainst} games, ${m.avgKDA} avg KDA)\n`;
    });
  } else {
    response += `⚠️ Not enough data to determine matchups.\n`;
    response += `Need at least 3 games against each opponent.\n`;
  }

  return response;
}
