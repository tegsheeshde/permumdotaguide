/**
 * Auto Draft Service
 * Generates balanced team compositions based on match statistics and player data
 */

import { loadMatchData } from './matchAnalysis';

/**
 * Generate multiple balanced draft options based on available players
 */
export async function generateAutoDrafts(availablePlayers, registeredPlayers) {
  // Load match data for analysis
  const { statsData } = await loadMatchData();

  if (!statsData || !availablePlayers || availablePlayers.length < 10) {
    return null;
  }

  // Get player stats from both sources
  const playerStatsMap = buildPlayerStatsMap(availablePlayers, statsData, registeredPlayers);

  // Generate multiple draft options using different strategies
  const drafts = [];

  // Strategy 1: Balanced MMR
  drafts.push(generateBalancedMMRDraft(availablePlayers, playerStatsMap));

  // Strategy 2: Balanced Win Rate
  drafts.push(generateBalancedWinRateDraft(availablePlayers, playerStatsMap));

  // Strategy 3: Role-Based Balance
  drafts.push(generateRoleBasedDraft(availablePlayers, playerStatsMap));

  // Strategy 4: Hybrid (MMR + Win Rate + Synergy)
  drafts.push(generateHybridDraft(availablePlayers, playerStatsMap));

  // Strategy 5: Random but Fair
  drafts.push(generateRandomFairDraft(availablePlayers, playerStatsMap));

  return drafts;
}

/**
 * Build a comprehensive player stats map
 */
function buildPlayerStatsMap(availablePlayers, statsData, registeredPlayers) {
  const statsMap = {};

  availablePlayers.forEach(playerName => {
    // Get match history stats
    const matchStats = statsData.player_statistics.find(
      p => String(p.player_name).toLowerCase() === String(playerName).toLowerCase()
    );

    // Get registered player info
    const registeredInfo = registeredPlayers[playerName];

    statsMap[playerName] = {
      playerName,
      // MMR
      mmr: registeredInfo?.mmr || 0,
      // Win rate from match history
      winRate: matchStats?.win_rate || 50,
      // KDA from match history
      kda: matchStats?.kda_ratio || 0,
      // Games played
      gamesPlayed: matchStats?.games_played || 0,
      // Role preference
      role: registeredInfo?.role || 'core',
      // Most played hero
      mostPlayedHero: matchStats?.most_played_hero || null,
      // Overall stats
      avgGPM: matchStats?.avg_gpm || 0,
      avgXPM: matchStats?.avg_xpm || 0,
      // Skill score (composite)
      skillScore: calculateSkillScore(matchStats, registeredInfo)
    };
  });

  return statsMap;
}

/**
 * Calculate a composite skill score
 */
function calculateSkillScore(matchStats, registeredInfo) {
  let score = 0;

  // MMR contributes 40%
  const mmr = registeredInfo?.mmr || 0;
  score += (mmr / 10000) * 40;

  if (matchStats) {
    // Win rate contributes 30%
    score += (matchStats.win_rate / 100) * 30;

    // KDA contributes 20%
    score += Math.min(matchStats.kda_ratio / 10, 1) * 20;

    // GPM/XPM contributes 10%
    const farmScore = (matchStats.avg_gpm / 800 + matchStats.avg_xpm / 1000) / 2;
    score += farmScore * 10;
  }

  return score;
}

/**
 * Strategy 1: Balance teams by MMR
 */
function generateBalancedMMRDraft(players, statsMap) {
  // Sort by MMR descending
  const sortedPlayers = [...players].sort((a, b) =>
    (statsMap[b]?.mmr || 0) - (statsMap[a]?.mmr || 0)
  );

  const team1 = [];
  const team2 = [];

  // Snake draft: 1-2-2-1-1-2-2-1
  const draftOrder = [1, 2, 2, 1, 1, 2, 2, 1, 1, 2];

  sortedPlayers.slice(0, 10).forEach((player, idx) => {
    if (draftOrder[idx] === 1) {
      team1.push(player);
    } else {
      team2.push(player);
    }
  });

  const team1MMR = team1.reduce((sum, p) => sum + (statsMap[p]?.mmr || 0), 0);
  const team2MMR = team2.reduce((sum, p) => sum + (statsMap[p]?.mmr || 0), 0);

  return {
    name: 'Balanced MMR',
    description: 'Teams balanced by average MMR (snake draft)',
    team1: {
      captain: team1[0],
      players: team1.slice(1, 5),
      totalMMR: team1MMR,
      avgMMR: Math.round(team1MMR / team1.length)
    },
    team2: {
      captain: team2[0],
      players: team2.slice(1, 5),
      totalMMR: team2MMR,
      avgMMR: Math.round(team2MMR / team2.length)
    },
    balance: {
      mmrDiff: Math.abs(team1MMR - team2MMR),
      fairness: calculateFairness(team1MMR, team2MMR)
    }
  };
}

/**
 * Strategy 2: Balance by win rate from match history
 */
function generateBalancedWinRateDraft(players, statsMap) {
  // Sort by win rate descending
  const sortedPlayers = [...players].sort((a, b) =>
    (statsMap[b]?.winRate || 50) - (statsMap[a]?.winRate || 50)
  );

  const team1 = [];
  const team2 = [];

  // Snake draft
  const draftOrder = [1, 2, 2, 1, 1, 2, 2, 1, 1, 2];

  sortedPlayers.slice(0, 10).forEach((player, idx) => {
    if (draftOrder[idx] === 1) {
      team1.push(player);
    } else {
      team2.push(player);
    }
  });

  const team1WR = team1.reduce((sum, p) => sum + (statsMap[p]?.winRate || 50), 0) / team1.length;
  const team2WR = team2.reduce((sum, p) => sum + (statsMap[p]?.winRate || 50), 0) / team2.length;

  return {
    name: 'Balanced Win Rate',
    description: 'Teams balanced by historical win rate',
    team1: {
      captain: team1[0],
      players: team1.slice(1, 5),
      avgWinRate: team1WR.toFixed(1),
      totalMMR: team1.reduce((sum, p) => sum + (statsMap[p]?.mmr || 0), 0)
    },
    team2: {
      captain: team2[0],
      players: team2.slice(1, 5),
      avgWinRate: team2WR.toFixed(1),
      totalMMR: team2.reduce((sum, p) => sum + (statsMap[p]?.mmr || 0), 0)
    },
    balance: {
      winRateDiff: Math.abs(team1WR - team2WR).toFixed(1),
      fairness: calculateFairness(team1WR, team2WR)
    }
  };
}

/**
 * Strategy 3: Role-based balanced draft
 */
function generateRoleBasedDraft(players, statsMap) {
  // Group players by role
  const cores = players.filter(p => ['core', 'mid', 'carry', 'offlane'].includes(statsMap[p]?.role));
  const supports = players.filter(p => ['support', 'hard support'].includes(statsMap[p]?.role));
  const others = players.filter(p => !cores.includes(p) && !supports.includes(p));

  // Sort each group by skill
  const sortCores = cores.sort((a, b) => (statsMap[b]?.skillScore || 0) - (statsMap[a]?.skillScore || 0));
  const sortSupports = supports.sort((a, b) => (statsMap[b]?.skillScore || 0) - (statsMap[a]?.skillScore || 0));
  const sortOthers = others.sort((a, b) => (statsMap[b]?.skillScore || 0) - (statsMap[a]?.skillScore || 0));

  const team1 = [];
  const team2 = [];

  // Alternate picks from each category
  // 3 cores, 2 supports per team
  for (let i = 0; i < Math.min(3, sortCores.length); i++) {
    if (i % 2 === 0) {
      team1.push(sortCores[i]);
    } else {
      team2.push(sortCores[i]);
    }
  }

  for (let i = 0; i < Math.min(2, sortSupports.length); i++) {
    if (i % 2 === 0) {
      team1.push(sortSupports[i]);
    } else {
      team2.push(sortSupports[i]);
    }
  }

  // Fill remaining slots with others
  const needed1 = 5 - team1.length;
  const needed2 = 5 - team2.length;

  for (let i = 0; i < Math.min(needed1 + needed2, sortOthers.length); i++) {
    if (team1.length < 5) {
      team1.push(sortOthers[i]);
    } else if (team2.length < 5) {
      team2.push(sortOthers[i]);
    }
  }

  const team1MMR = team1.reduce((sum, p) => sum + (statsMap[p]?.mmr || 0), 0);
  const team2MMR = team2.reduce((sum, p) => sum + (statsMap[p]?.mmr || 0), 0);

  return {
    name: 'Role-Based Balance',
    description: 'Teams balanced by player roles and skill',
    team1: {
      captain: team1[0],
      players: team1.slice(1, 5),
      totalMMR: team1MMR,
      roles: team1.map(p => statsMap[p]?.role || 'core')
    },
    team2: {
      captain: team2[0],
      players: team2.slice(1, 5),
      totalMMR: team2MMR,
      roles: team2.map(p => statsMap[p]?.role || 'core')
    },
    balance: {
      mmrDiff: Math.abs(team1MMR - team2MMR),
      fairness: calculateFairness(team1MMR, team2MMR)
    }
  };
}

/**
 * Strategy 4: Hybrid approach (MMR + Win Rate + KDA)
 */
function generateHybridDraft(players, statsMap) {
  // Sort by composite skill score
  const sortedPlayers = [...players].sort((a, b) =>
    (statsMap[b]?.skillScore || 0) - (statsMap[a]?.skillScore || 0)
  );

  const team1 = [];
  const team2 = [];

  // Use optimized pairing algorithm
  const pairs = [];
  for (let i = 0; i < Math.min(10, sortedPlayers.length); i += 2) {
    if (i + 1 < sortedPlayers.length) {
      pairs.push([sortedPlayers[i], sortedPlayers[i + 1]]);
    }
  }

  // Distribute pairs to balance teams
  pairs.forEach((pair, idx) => {
    if (idx % 2 === 0) {
      team1.push(pair[0]);
      team2.push(pair[1]);
    } else {
      team2.push(pair[0]);
      team1.push(pair[1]);
    }
  });

  const team1Score = team1.reduce((sum, p) => sum + (statsMap[p]?.skillScore || 0), 0);
  const team2Score = team2.reduce((sum, p) => sum + (statsMap[p]?.skillScore || 0), 0);
  const team1MMR = team1.reduce((sum, p) => sum + (statsMap[p]?.mmr || 0), 0);
  const team2MMR = team2.reduce((sum, p) => sum + (statsMap[p]?.mmr || 0), 0);

  return {
    name: 'Hybrid Balance (Recommended)',
    description: 'Balanced by skill score (MMR, win rate, KDA, farm)',
    team1: {
      captain: team1[0],
      players: team1.slice(1, 5),
      totalMMR: team1MMR,
      skillScore: team1Score.toFixed(1)
    },
    team2: {
      captain: team2[0],
      players: team2.slice(1, 5),
      totalMMR: team2MMR,
      skillScore: team2Score.toFixed(1)
    },
    balance: {
      mmrDiff: Math.abs(team1MMR - team2MMR),
      skillDiff: Math.abs(team1Score - team2Score).toFixed(1),
      fairness: calculateFairness(team1Score, team2Score)
    }
  };
}

/**
 * Strategy 5: Random but Fair
 */
function generateRandomFairDraft(players, statsMap) {
  // Shuffle players randomly
  const shuffled = [...players].sort(() => Math.random() - 0.5);

  // Try up to 100 random combinations to find a fair one
  let bestDraft = null;
  let bestFairness = 0;

  for (let attempt = 0; attempt < 100; attempt++) {
    const randomShuffled = [...shuffled].sort(() => Math.random() - 0.5);
    const team1 = randomShuffled.slice(0, 5);
    const team2 = randomShuffled.slice(5, 10);

    const team1MMR = team1.reduce((sum, p) => sum + (statsMap[p]?.mmr || 0), 0);
    const team2MMR = team2.reduce((sum, p) => sum + (statsMap[p]?.mmr || 0), 0);
    const fairness = calculateFairness(team1MMR, team2MMR);

    if (fairness > bestFairness) {
      bestFairness = fairness;
      bestDraft = { team1, team2, team1MMR, team2MMR };
    }
  }

  const { team1, team2, team1MMR, team2MMR } = bestDraft;

  return {
    name: 'Random Fair',
    description: 'Randomized draft with fairness optimization',
    team1: {
      captain: team1[0],
      players: team1.slice(1, 5),
      totalMMR: team1MMR
    },
    team2: {
      captain: team2[0],
      players: team2.slice(1, 5),
      totalMMR: team2MMR
    },
    balance: {
      mmrDiff: Math.abs(team1MMR - team2MMR),
      fairness: bestFairness
    }
  };
}

/**
 * Calculate fairness score (0-100, higher is more fair)
 */
function calculateFairness(value1, value2) {
  if (value1 === 0 && value2 === 0) return 100;
  const avg = (value1 + value2) / 2;
  if (avg === 0) return 100;
  const diff = Math.abs(value1 - value2);
  const fairness = Math.max(0, 100 - (diff / avg) * 100);
  return Math.round(fairness);
}

/**
 * Get teammate synergy from match history
 */
export async function getTeammateSynergy(player1, player2) {
  const { matchData } = await loadMatchData();

  if (!matchData) return null;

  // Find games where both players were on the same team
  const player1Matches = matchData.matches.filter(
    m => String(m.player_name).toLowerCase() === String(player1).toLowerCase()
  );

  let gamesTogether = 0;
  let winsTogether = 0;

  player1Matches.forEach(match => {
    const sameGameTeammates = matchData.matches.filter(
      m => m.game_id === match.game_id &&
           m.team === match.team &&
           String(m.player_name).toLowerCase() === String(player2).toLowerCase()
    );

    if (sameGameTeammates.length > 0) {
      gamesTogether++;
      if (match.w_l === 'W') {
        winsTogether++;
      }
    }
  });

  if (gamesTogether === 0) return null;

  return {
    gamesTogether,
    winsTogether,
    winRate: (winsTogether / gamesTogether * 100).toFixed(1)
  };
}
