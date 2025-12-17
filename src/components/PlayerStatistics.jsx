import { useState, useEffect, useMemo } from "react";
import { X, Trophy, Sword, DollarSign, Target, TrendingUp, Zap, Award, Crosshair, Users, Medal, Crown } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

/**
 * Map display names to JSON data names
 */
const playerNameMapping = {
  "Elchapo": "El'Chapo",
  ".911": 911,
  "Rozigoo": "HeaVeN_FoundER",
  "Zorigoo": "HeaVeN_FoundER",
  "Khume": "khume",
  "@Nine.!": "Nine",
  "Orgil": "gahh tui",
  "Brown OO": "Brown OO",
  "humbledog": "humbledog",
  "xaky": "xaky",
  "Woody": "Woody",
  "MiRaGS": "MIRAGS",
  // Add more mappings as needed
};

/**
 * Get the JSON data name from display name
 */
const getDataName = (displayName) => {
  return playerNameMapping[displayName] || displayName;
};

/**
 * PlayerStatistics Modal Component
 * Displays detailed statistics for a selected player including:
 * - All played heroes
 * - Highest GPM heroes
 * - Most kills heroes
 * - Highest win rate heroes
 */
export default function PlayerStatistics({ playerName, isOpen, onClose }) {
  const [matchesData, setMatchesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStat, setExpandedStat] = useState(null);

  // Get the actual data name for this player
  const dataPlayerName = getDataName(playerName);

  // Toggle stat expansion
  const toggleStat = (statName) => {
    setExpandedStat(expandedStat === statName ? null : statName);
  };

  // Fetch match data
  useEffect(() => {
    if (!isOpen || !playerName) return;

    const fetchMatches = async () => {
      try {
        const response = await fetch("/dota2_matches.json");
        if (response.ok) {
          const data = await response.json();
          setMatchesData(data.matches || []);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching match data:", error);
        setLoading(false);
      }
    };

    fetchMatches();
  }, [isOpen, playerName]);

  // Calculate hero statistics for the player
  const heroStats = useMemo(() => {
    if (!matchesData.length || !playerName) return [];

    // Filter matches for this player (using mapped name)
    const playerMatches = matchesData.filter(
      (match) => match.player_name === dataPlayerName
    );

    // Group by hero and calculate stats
    const heroMap = {};

    playerMatches.forEach((match) => {
      const hero = match.hero_name;
      if (!hero) return;

      if (!heroMap[hero]) {
        heroMap[hero] = {
          hero_name: hero,
          games: 0,
          wins: 0,
          total_kills: 0,
          total_deaths: 0,
          total_assists: 0,
          total_gpm: 0,
          total_xpm: 0,
          total_networth: 0,
          max_kills: 0,
          max_gpm: 0,
          max_xpm: 0,
          max_networth: 0,
          max_assists: 0,
        };
      }

      heroMap[hero].games += 1;
      if (match.w_l === "W") heroMap[hero].wins += 1;

      // Add to totals
      heroMap[hero].total_kills += match.kill || 0;
      heroMap[hero].total_deaths += match.death || 0;
      heroMap[hero].total_assists += match.assist || 0;
      heroMap[hero].total_gpm += match.gpm || 0;
      heroMap[hero].total_xpm += match.xpm || 0;
      heroMap[hero].total_networth += match.networth || 0;

      // Track maximums
      heroMap[hero].max_kills = Math.max(heroMap[hero].max_kills, match.kill || 0);
      heroMap[hero].max_gpm = Math.max(heroMap[hero].max_gpm, match.gpm || 0);
      heroMap[hero].max_xpm = Math.max(heroMap[hero].max_xpm, match.xpm || 0);
      heroMap[hero].max_networth = Math.max(heroMap[hero].max_networth, match.networth || 0);
      heroMap[hero].max_assists = Math.max(heroMap[hero].max_assists, match.assist || 0);
    });

    // Calculate averages and win rates
    return Object.values(heroMap).map((hero) => ({
      ...hero,
      avg_kills: hero.total_kills / hero.games,
      avg_deaths: hero.total_deaths / hero.games,
      avg_assists: hero.total_assists / hero.games,
      avg_gpm: hero.total_gpm / hero.games,
      avg_xpm: hero.total_xpm / hero.games,
      avg_networth: hero.total_networth / hero.games,
      win_rate: (hero.wins / hero.games) * 100,
      kda: hero.total_deaths > 0 ? (hero.total_kills + hero.total_assists) / hero.total_deaths : hero.total_kills + hero.total_assists,
    }));
  }, [matchesData, playerName, dataPlayerName]);

  // Get top heroes by MAX (highest single game) stats
  const topHeroesByMaxGPM = useMemo(
    () => [...heroStats].sort((a, b) => b.max_gpm - a.max_gpm).slice(0, 5),
    [heroStats]
  );

  const topHeroesByMaxKills = useMemo(
    () => [...heroStats].sort((a, b) => b.max_kills - a.max_kills).slice(0, 5),
    [heroStats]
  );

  const topHeroesByMaxAssists = useMemo(
    () => [...heroStats].sort((a, b) => b.max_assists - a.max_assists).slice(0, 5),
    [heroStats]
  );

  const topHeroesByMaxXPM = useMemo(
    () => [...heroStats].sort((a, b) => b.max_xpm - a.max_xpm).slice(0, 5),
    [heroStats]
  );

  const topHeroesByMaxNetworth = useMemo(
    () => [...heroStats].sort((a, b) => b.max_networth - a.max_networth).slice(0, 5),
    [heroStats]
  );

  const topHeroesByWinRate = useMemo(
    () =>
      [...heroStats]
        .filter((h) => h.games >= 3) // Only heroes with 3+ games
        .sort((a, b) => b.win_rate - a.win_rate)
        .slice(0, 5),
    [heroStats]
  );

  const topHeroesByKDA = useMemo(
    () =>
      [...heroStats]
        .filter((h) => h.games >= 3) // Only heroes with 3+ games
        .sort((a, b) => b.kda - a.kda)
        .slice(0, 5),
    [heroStats]
  );

  const allHeroesSorted = useMemo(
    () => [...heroStats].sort((a, b) => b.games - a.games),
    [heroStats]
  );

  // Calculate overall player statistics (needed by getPlayerOverallRank)
  const overallStats = useMemo(() => {
    if (!matchesData.length || !playerName) return null;

    const playerMatches = matchesData.filter(
      (match) => match.player_name === dataPlayerName
    );

    if (!playerMatches.length) return null;

    const totalGames = playerMatches.length;
    const wins = playerMatches.filter((m) => m.w_l === "W").length;
    const losses = totalGames - wins;

    // Calculate totals
    const totals = playerMatches.reduce(
      (acc, match) => ({
        kills: acc.kills + (match.kill || 0),
        deaths: acc.deaths + (match.death || 0),
        assists: acc.assists + (match.assist || 0),
        gpm: acc.gpm + (match.gpm || 0),
        xpm: acc.xpm + (match.xpm || 0),
        networth: acc.networth + (match.networth || 0),
      }),
      { kills: 0, deaths: 0, assists: 0, gpm: 0, xpm: 0, networth: 0 }
    );

    // Count positions
    const positionCounts = {};
    playerMatches.forEach((match) => {
      const pos = match.positsion || "Unknown";
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });
    const mostPlayedPosition = Object.entries(positionCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    // Get most played hero
    const mostPlayedHero = allHeroesSorted[0]?.hero_name || "None";

    return {
      totalGames,
      wins,
      losses,
      winRate: (wins / totalGames) * 100,
      avgKills: totals.kills / totalGames,
      avgDeaths: totals.deaths / totalGames,
      avgAssists: totals.assists / totalGames,
      avgGPM: totals.gpm / totalGames,
      avgXPM: totals.xpm / totalGames,
      avgNetworth: totals.networth / totalGames,
      kda:
        totals.deaths > 0
          ? (totals.kills + totals.assists) / totals.deaths
          : totals.kills + totals.assists,
      mostPlayedPosition,
      mostPlayedHero,
      totalKills: totals.kills,
      totalDeaths: totals.deaths,
      totalAssists: totals.assists,
    };
  }, [matchesData, playerName, dataPlayerName, allHeroesSorted]);

  // Calculate global hero rankings for all players
  // This creates a map: { heroName: { statName: [sorted array of values] } }
  const globalHeroRankings = useMemo(() => {
    if (!matchesData.length) return {};

    const heroStatsMap = {};

    // Group matches by hero
    matchesData.forEach((match) => {
      const hero = match.hero_name;
      const player = match.player_name;
      if (!hero || !player) return;

      if (!heroStatsMap[hero]) {
        heroStatsMap[hero] = {};
      }

      if (!heroStatsMap[hero][player]) {
        heroStatsMap[hero][player] = {
          games: 0,
          wins: 0,
          totalKills: 0,
          totalDeaths: 0,
          totalAssists: 0,
          maxGPM: 0,
          maxKills: 0,
          maxAssists: 0,
          maxXPM: 0,
          maxNetworth: 0,
        };
      }

      const stats = heroStatsMap[hero][player];
      stats.games += 1;
      if (match.w_l === "W") stats.wins += 1;
      stats.totalKills += match.kill || 0;
      stats.totalDeaths += match.death || 0;
      stats.totalAssists += match.assist || 0;
      stats.maxGPM = Math.max(stats.maxGPM, match.gpm || 0);
      stats.maxKills = Math.max(stats.maxKills, match.kill || 0);
      stats.maxAssists = Math.max(stats.maxAssists, match.assist || 0);
      stats.maxXPM = Math.max(stats.maxXPM, match.xpm || 0);
      stats.maxNetworth = Math.max(stats.maxNetworth, match.networth || 0);
    });

    // Convert to rankings for each stat
    const rankings = {};
    Object.entries(heroStatsMap).forEach(([heroName, playerStats]) => {
      rankings[heroName] = {
        maxGPM: Object.entries(playerStats)
          .filter(([, stats]) => stats.games >= 3)
          .map(([pName, stats]) => ({ player: pName, value: stats.maxGPM }))
          .sort((a, b) => b.value - a.value),
        maxKills: Object.entries(playerStats)
          .filter(([, stats]) => stats.games >= 3)
          .map(([pName, stats]) => ({ player: pName, value: stats.maxKills }))
          .sort((a, b) => b.value - a.value),
        maxAssists: Object.entries(playerStats)
          .filter(([, stats]) => stats.games >= 3)
          .map(([pName, stats]) => ({ player: pName, value: stats.maxAssists }))
          .sort((a, b) => b.value - a.value),
        maxXPM: Object.entries(playerStats)
          .filter(([, stats]) => stats.games >= 3)
          .map(([pName, stats]) => ({ player: pName, value: stats.maxXPM }))
          .sort((a, b) => b.value - a.value),
        maxNetworth: Object.entries(playerStats)
          .filter(([, stats]) => stats.games >= 3)
          .map(([pName, stats]) => ({ player: pName, value: stats.maxNetworth }))
          .sort((a, b) => b.value - a.value),
        winRate: Object.entries(playerStats)
          .filter(([, stats]) => stats.games >= 3)
          .map(([pName, stats]) => ({
            player: pName,
            value: (stats.wins / stats.games) * 100,
          }))
          .sort((a, b) => b.value - a.value),
        kda: Object.entries(playerStats)
          .filter(([, stats]) => stats.games >= 3)
          .map(([pName, stats]) => ({
            player: pName,
            value:
              stats.totalDeaths > 0
                ? (stats.totalKills + stats.totalAssists) / stats.totalDeaths
                : stats.totalKills + stats.totalAssists,
          }))
          .sort((a, b) => b.value - a.value),
      };
    });

    return rankings;
  }, [matchesData]);

  // Get global rank for a specific hero + stat combination
  const getGlobalRank = (heroName, statName, playerName) => {
    const rankings = globalHeroRankings[heroName]?.[statName];
    if (!rankings) return null;

    // Handle both number and string player names (e.g., 911 can be number or string)
    const index = rankings.findIndex((r) => String(r.player) === String(playerName));
    return index >= 0 ? index + 1 : null;
  };

  // Calculate overall player rankings across all players
  const allPlayersOverallStats = useMemo(() => {
    if (!matchesData.length) return [];

    const playerMap = {};

    matchesData.forEach((match) => {
      const pName = match.player_name;
      if (!pName) return;

      if (!playerMap[pName]) {
        playerMap[pName] = {
          name: pName,
          games: 0,
          wins: 0,
          totalKills: 0,
          totalDeaths: 0,
          totalAssists: 0,
          totalGPM: 0,
          totalXPM: 0,
        };
      }

      playerMap[pName].games += 1;
      if (match.w_l === "W") playerMap[pName].wins += 1;
      playerMap[pName].totalKills += match.kill || 0;
      playerMap[pName].totalDeaths += match.death || 0;
      playerMap[pName].totalAssists += match.assist || 0;
      playerMap[pName].totalGPM += match.gpm || 0;
      playerMap[pName].totalXPM += match.xpm || 0;
    });

    return Object.values(playerMap)
      .filter(p => p.games >= 10) // Minimum 10 games for overall rankings
      .map((player) => ({
        ...player,
        winRate: (player.wins / player.games) * 100,
        avgKills: player.totalKills / player.games,
        avgDeaths: player.totalDeaths / player.games,
        avgAssists: player.totalAssists / player.games,
        avgGPM: player.totalGPM / player.games,
        avgXPM: player.totalXPM / player.games,
        kda:
          player.totalDeaths > 0
            ? (player.totalKills + player.totalAssists) / player.totalDeaths
            : player.totalKills + player.totalAssists,
      }));
  }, [matchesData]);

  // Get player's global rank for overall stats and formatted leaderboards
  const getPlayerOverallRank = useMemo(() => {
    if (!overallStats || !allPlayersOverallStats.length) return { ranks: {}, leaderboards: {} };

    const rankings = {
      totalGames: [...allPlayersOverallStats].sort((a, b) => b.games - a.games),
      winRate: [...allPlayersOverallStats].sort((a, b) => b.winRate - a.winRate),
      kda: [...allPlayersOverallStats].sort((a, b) => b.kda - a.kda),
      avgKills: [...allPlayersOverallStats].sort((a, b) => b.avgKills - a.avgKills),
      avgAssists: [...allPlayersOverallStats].sort((a, b) => b.avgAssists - a.avgAssists),
      avgGPM: [...allPlayersOverallStats].sort((a, b) => b.avgGPM - a.avgGPM),
      avgXPM: [...allPlayersOverallStats].sort((a, b) => b.avgXPM - a.avgXPM),
    };

    const ranks = {};
    const leaderboards = {};

    Object.keys(rankings).forEach((statName) => {
      const index = rankings[statName].findIndex((p) => p.name === dataPlayerName);
      ranks[statName] = index >= 0 ? index + 1 : null;

      // Format leaderboard with displayValue
      leaderboards[statName] = rankings[statName].map((p) => ({
        ...p,
        displayValue:
          statName === "totalGames" ? p.games
          : statName === "winRate" ? `${p.winRate.toFixed(1)}%`
          : statName === "kda" ? p.kda.toFixed(2)
          : statName === "avgKills" ? p.avgKills.toFixed(1)
          : statName === "avgAssists" ? p.avgAssists.toFixed(1)
          : statName === "avgGPM" ? Math.round(p.avgGPM)
          : statName === "avgXPM" ? Math.round(p.avgXPM)
          : "",
      }));
    });

    return { ranks, leaderboards };
  }, [overallStats, allPlayersOverallStats, dataPlayerName]);

  // Get player image path
  const getPlayerImage = (playerName) => {
    if (!playerName) return null;
    // Convert to string first to handle numeric player names like 911
    const nameStr = String(playerName);
    const formattedName = nameStr.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_');
    return `/player_images/${formattedName}.jpg`;
  };

  // Format hero name for display
  const formatHeroName = (heroName) => {
    if (!heroName) return "";
    return heroName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get hero image path
  const getHeroImage = (heroName) => {
    if (!heroName) return null;
    const formattedName = heroName.toLowerCase().replace(/\s+/g, "_");
    return `/hero_avatars/${formattedName}.png`;
  };

  // Get rank styling based on position
  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return {
          border: "border-yellow-500",
          bg: "bg-yellow-500/10",
          text: "text-yellow-500",
          glow: "shadow-yellow-500/50",
          icon: Crown,
        };
      case 2:
        return {
          border: "border-slate-400",
          bg: "bg-slate-400/10",
          text: "text-slate-300",
          glow: "shadow-slate-400/50",
          icon: Medal,
        };
      case 3:
        return {
          border: "border-orange-600",
          bg: "bg-orange-600/10",
          text: "text-orange-500",
          glow: "shadow-orange-600/50",
          icon: Medal,
        };
      default:
        return {
          border: "border-slate-700",
          bg: "bg-slate-800/50",
          text: "text-slate-400",
          glow: "",
          icon: null,
        };
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 overflow-hidden"
          >
            <div className="w-full h-full bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    {playerName}'s Statistics
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    {heroStats.length} heroes played • {matchesData.filter(m => m.player_name === dataPlayerName).length} total games
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-slate-400">Loading statistics...</div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Player Overview Card */}
                    {overallStats && (
                      <div className="bg-linear-to-br from-slate-800 via-slate-800/90 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-2xl">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Player Image */}
                          <div className="shrink-0">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-lg relative">
                              <img
                                src={getPlayerImage(playerName)}
                                alt={playerName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  const fallback = e.target.parentElement.querySelector(".fallback-gradient");
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                              <div className="fallback-gradient hidden absolute inset-0 items-center justify-center bg-linear-to-br from-purple-600 to-pink-600">
                                <span className="text-6xl font-bold text-white">
                                  {String(playerName).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Player Stats */}
                          <div className="flex-1 space-y-4">
                            {/* Name and Position */}
                            <div>
                              <h3 className="text-3xl font-black text-white mb-2">
                                {playerName}
                              </h3>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30 font-semibold">
                                  Position {overallStats.mostPlayedPosition}
                                </span>
                                <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30 font-semibold">
                                  {formatHeroName(overallStats.mostPlayedHero)}
                                </span>
                              </div>
                            </div>

                            {/* Win Rate and Games */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <StatBox
                                label="Total Games"
                                value={overallStats.totalGames}
                                rank={getPlayerOverallRank.ranks.totalGames}
                                getRankStyle={getRankStyle}
                                valueColor="text-white"
                                statKey="totalGames"
                                onClick={toggleStat}
                                isExpanded={expandedStat === "totalGames"}
                                allPlayersStats={getPlayerOverallRank.leaderboards.totalGames}
                                dataPlayerName={dataPlayerName}
                                getPlayerImage={getPlayerImage}
                              />
                              <StatBox
                                label="Win Rate"
                                value={`${overallStats.winRate.toFixed(1)}%`}
                                rank={getPlayerOverallRank.ranks.winRate}
                                getRankStyle={getRankStyle}
                                valueColor="text-green-400"
                                statKey="winRate"
                                onClick={toggleStat}
                                isExpanded={expandedStat === "winRate"}
                                allPlayersStats={getPlayerOverallRank.leaderboards.winRate}
                                dataPlayerName={dataPlayerName}
                                getPlayerImage={getPlayerImage}
                              />
                              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                                <div className="text-xs text-slate-400 mb-1">Wins / Losses</div>
                                <div className="text-2xl font-bold text-white">{overallStats.wins}W / {overallStats.losses}L</div>
                              </div>
                              <StatBox
                                label="KDA Ratio"
                                value={overallStats.kda.toFixed(2)}
                                rank={getPlayerOverallRank.ranks.kda}
                                getRankStyle={getRankStyle}
                                valueColor="text-purple-400"
                                statKey="kda"
                                onClick={toggleStat}
                                isExpanded={expandedStat === "kda"}
                                allPlayersStats={getPlayerOverallRank.leaderboards.kda}
                                dataPlayerName={dataPlayerName}
                                getPlayerImage={getPlayerImage}
                              />
                            </div>

                            {/* Average Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              <StatBox
                                label="Avg Kills"
                                value={overallStats.avgKills.toFixed(1)}
                                rank={getPlayerOverallRank.ranks.avgKills}
                                getRankStyle={getRankStyle}
                                valueColor="text-red-400"
                                compact
                                statKey="avgKills"
                                onClick={toggleStat}
                                isExpanded={expandedStat === "avgKills"}
                                allPlayersStats={getPlayerOverallRank.leaderboards.avgKills}
                                dataPlayerName={dataPlayerName}
                                getPlayerImage={getPlayerImage}
                              />
                              <div className="bg-slate-900/30 rounded-lg p-2 border border-slate-700/30">
                                <div className="text-xs text-slate-500 mb-1">Avg Deaths</div>
                                <div className="text-lg font-bold text-slate-400">{overallStats.avgDeaths.toFixed(1)}</div>
                              </div>
                              <StatBox
                                label="Avg Assists"
                                value={overallStats.avgAssists.toFixed(1)}
                                rank={getPlayerOverallRank.ranks.avgAssists}
                                getRankStyle={getRankStyle}
                                valueColor="text-blue-400"
                                compact
                                statKey="avgAssists"
                                onClick={toggleStat}
                                isExpanded={expandedStat === "avgAssists"}
                                allPlayersStats={getPlayerOverallRank.leaderboards.avgAssists}
                                dataPlayerName={dataPlayerName}
                                getPlayerImage={getPlayerImage}
                              />
                              <StatBox
                                label="Avg GPM"
                                value={Math.round(overallStats.avgGPM)}
                                rank={getPlayerOverallRank.ranks.avgGPM}
                                getRankStyle={getRankStyle}
                                valueColor="text-yellow-400"
                                compact
                                statKey="avgGPM"
                                onClick={toggleStat}
                                isExpanded={expandedStat === "avgGPM"}
                                allPlayersStats={getPlayerOverallRank.leaderboards.avgGPM}
                                dataPlayerName={dataPlayerName}
                                getPlayerImage={getPlayerImage}
                              />
                              <StatBox
                                label="Avg XPM"
                                value={Math.round(overallStats.avgXPM)}
                                rank={getPlayerOverallRank.ranks.avgXPM}
                                getRankStyle={getRankStyle}
                                valueColor="text-cyan-400"
                                compact
                                statKey="avgXPM"
                                onClick={toggleStat}
                                isExpanded={expandedStat === "avgXPM"}
                                allPlayersStats={getPlayerOverallRank.leaderboards.avgXPM}
                                dataPlayerName={dataPlayerName}
                                getPlayerImage={getPlayerImage}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hero Statistics with Win Rate and KDA */}
                    <div className="pt-4 border-t border-slate-700">
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-green-400" />
                        Best Performance Heroes
                      </h3>
                      <div className="space-y-6">
                        <Section
                          title="Highest Win Rate Heroes"
                          icon={Trophy}
                          iconColor="text-green-400"
                          heroes={topHeroesByWinRate}
                          formatHeroName={formatHeroName}
                          getHeroImage={getHeroImage}
                          renderStat={(hero) => (
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-400">
                                {hero.win_rate.toFixed(1)}%
                              </div>
                              <div className="text-xs text-slate-400">{hero.games} games</div>
                            </div>
                          )}
                          getGlobalRank={(hero) => getGlobalRank(hero.hero_name, "winRate", dataPlayerName)}
                          getRankStyle={getRankStyle}
                          statType="winRate"
                          expandedStat={expandedStat}
                          onToggle={toggleStat}
                          globalHeroRankings={globalHeroRankings}
                          dataPlayerName={dataPlayerName}
                          getPlayerImage={getPlayerImage}
                        />

                        <Section
                          title="Best KDA Heroes"
                          icon={Award}
                          iconColor="text-purple-400"
                          heroes={topHeroesByKDA}
                          formatHeroName={formatHeroName}
                          getHeroImage={getHeroImage}
                          renderStat={(hero) => (
                            <div className="text-right">
                              <div className="text-lg font-bold text-purple-400">
                                {hero.kda.toFixed(2)}
                              </div>
                              <div className="text-xs text-slate-400">KDA</div>
                            </div>
                          )}
                          getGlobalRank={(hero) => getGlobalRank(hero.hero_name, "kda", dataPlayerName)}
                          getRankStyle={getRankStyle}
                          statType="kda"
                          expandedStat={expandedStat}
                          onToggle={toggleStat}
                          globalHeroRankings={globalHeroRankings}
                          dataPlayerName={dataPlayerName}
                          getPlayerImage={getPlayerImage}
                        />
                      </div>
                    </div>

                    {/* Highest Single-Game Records */}
                    <div className="pt-4 border-t border-slate-700">
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-400" />
                        Highest Single-Game Records
                      </h3>
                      <div className="space-y-6">
                        <Section
                          title="Highest GPM in One Game"
                          icon={DollarSign}
                          iconColor="text-yellow-400"
                          heroes={topHeroesByMaxGPM}
                          formatHeroName={formatHeroName}
                          getHeroImage={getHeroImage}
                          renderStat={(hero) => (
                            <div className="text-right">
                              <div className="text-lg font-bold text-yellow-400">
                                {Math.round(hero.max_gpm)}
                              </div>
                              <div className="text-xs text-slate-400">Max GPM</div>
                            </div>
                          )}
                          getGlobalRank={(hero) => getGlobalRank(hero.hero_name, "maxGPM", dataPlayerName)}
                          getRankStyle={getRankStyle}
                          statType="maxGPM"
                          expandedStat={expandedStat}
                          onToggle={toggleStat}
                          globalHeroRankings={globalHeroRankings}
                          dataPlayerName={dataPlayerName}
                          getPlayerImage={getPlayerImage}
                        />

                        <Section
                          title="Most Kills in One Game"
                          icon={Sword}
                          iconColor="text-red-400"
                          heroes={topHeroesByMaxKills}
                          formatHeroName={formatHeroName}
                          getHeroImage={getHeroImage}
                          renderStat={(hero) => (
                            <div className="text-right">
                              <div className="text-lg font-bold text-red-400">
                                {hero.max_kills}
                              </div>
                              <div className="text-xs text-slate-400">Max Kills</div>
                            </div>
                          )}
                          getGlobalRank={(hero) => getGlobalRank(hero.hero_name, "maxKills", dataPlayerName)}
                          getRankStyle={getRankStyle}
                          statType="maxKills"
                          expandedStat={expandedStat}
                          onToggle={toggleStat}
                          globalHeroRankings={globalHeroRankings}
                          dataPlayerName={dataPlayerName}
                          getPlayerImage={getPlayerImage}
                        />

                        <Section
                          title="Most Assists in One Game"
                          icon={Users}
                          iconColor="text-blue-400"
                          heroes={topHeroesByMaxAssists}
                          formatHeroName={formatHeroName}
                          getHeroImage={getHeroImage}
                          renderStat={(hero) => (
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-400">
                                {hero.max_assists}
                              </div>
                              <div className="text-xs text-slate-400">Max Assists</div>
                            </div>
                          )}
                          getGlobalRank={(hero) => getGlobalRank(hero.hero_name, "maxAssists", dataPlayerName)}
                          getRankStyle={getRankStyle}
                          statType="maxAssists"
                          expandedStat={expandedStat}
                          onToggle={toggleStat}
                          globalHeroRankings={globalHeroRankings}
                          dataPlayerName={dataPlayerName}
                          getPlayerImage={getPlayerImage}
                        />

                        <Section
                          title="Highest XPM in One Game"
                          icon={TrendingUp}
                          iconColor="text-cyan-400"
                          heroes={topHeroesByMaxXPM}
                          formatHeroName={formatHeroName}
                          getHeroImage={getHeroImage}
                          renderStat={(hero) => (
                            <div className="text-right">
                              <div className="text-lg font-bold text-cyan-400">
                                {Math.round(hero.max_xpm)}
                              </div>
                              <div className="text-xs text-slate-400">Max XPM</div>
                            </div>
                          )}
                          getGlobalRank={(hero) => getGlobalRank(hero.hero_name, "maxXPM", dataPlayerName)}
                          getRankStyle={getRankStyle}
                          statType="maxXPM"
                          expandedStat={expandedStat}
                          onToggle={toggleStat}
                          globalHeroRankings={globalHeroRankings}
                          dataPlayerName={dataPlayerName}
                          getPlayerImage={getPlayerImage}
                        />

                        <Section
                          title="Highest Networth in One Game"
                          icon={Crosshair}
                          iconColor="text-orange-400"
                          heroes={topHeroesByMaxNetworth}
                          formatHeroName={formatHeroName}
                          getHeroImage={getHeroImage}
                          renderStat={(hero) => (
                            <div className="text-right">
                              <div className="text-lg font-bold text-orange-400">
                                {(hero.max_networth / 1000).toFixed(1)}k
                              </div>
                              <div className="text-xs text-slate-400">Max NW</div>
                            </div>
                          )}
                          getGlobalRank={(hero) => getGlobalRank(hero.hero_name, "maxNetworth", dataPlayerName)}
                          getRankStyle={getRankStyle}
                          statType="maxNetworth"
                          expandedStat={expandedStat}
                          onToggle={toggleStat}
                          globalHeroRankings={globalHeroRankings}
                          dataPlayerName={dataPlayerName}
                          getPlayerImage={getPlayerImage}
                        />
                      </div>
                    </div>

                    {/* All Heroes */}
                    <div className="pt-4 border-t border-slate-700">
                      <Section
                        title="All Played Heroes"
                        icon={Target}
                        iconColor="text-slate-400"
                        heroes={allHeroesSorted}
                        formatHeroName={formatHeroName}
                        getHeroImage={getHeroImage}
                        renderStat={(hero) => (
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">
                              {hero.games}
                            </div>
                            <div className="text-xs text-slate-400">
                              {hero.win_rate.toFixed(0)}% WR
                            </div>
                          </div>
                        )}
                        isExpanded
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * StatBox Component - Displays a single stat with global ranking indicator and clickable dropdown
 */
function StatBox({ label, value, rank, getRankStyle, valueColor, compact = false, statKey, onClick, isExpanded, allPlayersStats, dataPlayerName, getPlayerImage }) {
  const isTopThree = rank && rank <= 3;
  const rankStyle = isTopThree ? getRankStyle(rank) : null;
  const RankIcon = rankStyle?.icon;

  return (
    <div className="relative">
      <div
        onClick={() => onClick && onClick(statKey)}
        className={`relative rounded-xl ${compact ? 'p-2' : 'p-3'} border-2 ${
          isTopThree ? `${rankStyle.border} ${rankStyle.bg} shadow-lg ${rankStyle.glow}` : "border-slate-700/50 bg-slate-900/50"
        } transition-all ${onClick ? 'cursor-pointer hover:border-slate-500' : ''}`}
      >
        {/* Rank Badge */}
        {isTopThree && RankIcon && (
          <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${rankStyle.bg} border-2 ${rankStyle.border} flex items-center justify-center shadow-lg z-10`}>
            <RankIcon className={`w-3 h-3 ${rankStyle.text}`} />
          </div>
        )}

        <div className={`text-xs ${isTopThree ? rankStyle.text : "text-slate-400"} mb-1 flex items-center gap-1`}>
          {label}
          {rank && (
            <span className={`text-[10px] font-bold ${isTopThree ? rankStyle.text : "text-slate-500"}`}>#{rank}</span>
          )}
        </div>
        <div className={`${compact ? 'text-lg' : 'text-2xl'} font-bold ${isTopThree ? rankStyle.text : valueColor}`}>
          {value}
        </div>
      </div>

      {/* Dropdown showing top 3 + current player */}
      {isExpanded && allPlayersStats && allPlayersStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border-2 border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
            {allPlayersStats.slice(0, 3).map((player, index) => {
              const playerRank = index + 1;
              const playerRankStyle = getRankStyle(playerRank);
              const PlayerRankIcon = playerRankStyle.icon;
              const isCurrentPlayer = player.name === dataPlayerName;

              return (
                <div
                  key={player.name}
                  className={`flex items-center gap-2 p-2 rounded-lg border ${
                    playerRank <= 3 ? `${playerRankStyle.border} ${playerRankStyle.bg}` : "border-slate-700 bg-slate-900/50"
                  } ${isCurrentPlayer ? "ring-2 ring-blue-500" : ""}`}
                >
                  {/* Rank */}
                  <div className="w-8 flex items-center justify-center">
                    {PlayerRankIcon ? (
                      <PlayerRankIcon className={`w-4 h-4 ${playerRankStyle.text}`} />
                    ) : (
                      <span className="text-sm font-bold text-slate-500">#{playerRank}</span>
                    )}
                  </div>

                  {/* Player Image */}
                  <div className={`w-8 h-8 rounded-lg overflow-hidden border ${playerRank <= 3 ? playerRankStyle.border : "border-slate-700"}`}>
                    <img
                      src={getPlayerImage(player.name)}
                      alt={String(player.name)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        const fallback = e.target.parentElement.querySelector(".fallback");
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div className="fallback hidden w-full h-full items-center justify-center bg-slate-700">
                      <span className="text-xs font-bold text-slate-400">
                        {String(player.name).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Player Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${playerRank <= 3 ? playerRankStyle.text : "text-white"}`}>
                      {player.name}
                    </p>
                  </div>

                  {/* Value */}
                  <div className={`text-sm font-bold ${playerRank <= 3 ? playerRankStyle.text : "text-slate-300"}`}>
                    {player.displayValue}
                  </div>
                </div>
              );
            })}

            {/* Show current player if not in top 3 */}
            {rank && rank > 3 && (
              <>
                <div className="border-t border-slate-600 my-2"></div>
                <div className="flex items-center gap-2 p-2 rounded-lg border-2 border-blue-500 bg-blue-500/10 ring-2 ring-blue-500">
                  {/* Current player rank */}
                  <div className="w-8 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-400">#{rank}</span>
                  </div>

                  {/* Player Image */}
                  <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-blue-500">
                    <img
                      src={getPlayerImage(dataPlayerName)}
                      alt={String(dataPlayerName)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        const fallback = e.target.parentElement.querySelector(".fallback");
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div className="fallback hidden w-full h-full items-center justify-center bg-slate-700">
                      <span className="text-xs font-bold text-slate-400">
                        {String(dataPlayerName).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Player Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-blue-400">
                      {dataPlayerName} (You)
                    </p>
                  </div>

                  {/* Value */}
                  <div className="text-sm font-bold text-blue-400">
                    {value}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Section Component - Displays a category of hero statistics with clickable dropdown
 */
// eslint-disable-next-line no-unused-vars
function Section({ title, icon: Icon, iconColor, heroes, formatHeroName, getHeroImage, renderStat, isExpanded = false, getGlobalRank, getRankStyle, statType, expandedStat, onToggle, globalHeroRankings, dataPlayerName, getPlayerImage }) {
  if (!heroes.length) return null;

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 bg-slate-700/50 rounded-lg ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>

      <div className={`grid gap-3 ${isExpanded ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
        {heroes.map((hero, index) => {
          const globalRank = getGlobalRank ? getGlobalRank(hero) : null;
          const rankStyle = globalRank && globalRank <= 3 && getRankStyle ? getRankStyle(globalRank) : null;
          const RankIcon = rankStyle?.icon;
          const isTopThree = globalRank && globalRank <= 3;
          const heroStatKey = `${statType}-${hero.hero_name}`;
          const isHeroExpanded = expandedStat === heroStatKey;

          // Get leaderboard for this specific hero
          const heroLeaderboard = globalHeroRankings?.[hero.hero_name]?.[statType] || [];

          return (
            <div key={hero.hero_name} className="relative">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onToggle && onToggle(heroStatKey)}
                className={`flex items-center gap-4 p-3 rounded-lg border-2 ${
                  isTopThree ? `${rankStyle.border} ${rankStyle.bg} shadow-lg ${rankStyle.glow}` : "border-slate-700/50 bg-slate-900/50"
                } hover:border-slate-600 transition-all ${onToggle ? 'cursor-pointer' : ''}`}
              >
              {/* Hero Image with Rank Badge */}
              <div className="relative">
                <div className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-800 border-2 ${
                  isTopThree ? rankStyle.border : "border-slate-700"
                }`}>
                  <img
                    src={getHeroImage(hero.hero_name)}
                    alt={formatHeroName(hero.hero_name)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      const fallback = e.target.parentElement.querySelector(".fallback-gradient");
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div className="fallback-gradient hidden items-center justify-center w-full h-full bg-linear-to-br from-slate-700 to-slate-800">
                    <span className="text-2xl font-bold text-slate-500">
                      {formatHeroName(hero.hero_name).charAt(0)}
                    </span>
                  </div>
                </div>
                {/* Rank Badge */}
                {isTopThree && RankIcon && (
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full ${rankStyle.bg} border-2 ${rankStyle.border} flex items-center justify-center shadow-lg`}>
                    <RankIcon className={`w-4 h-4 ${rankStyle.text}`} />
                  </div>
                )}
              </div>

              {/* Hero Info */}
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold truncate ${isTopThree ? rankStyle.text : "text-white"}`}>
                  {formatHeroName(hero.hero_name)}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span>{hero.games} games</span>
                  {isTopThree && (
                    <>
                      <span>•</span>
                      <span className={`font-bold ${rankStyle.text}`}>#{globalRank} Global</span>
                    </>
                  )}
                </div>
              </div>

              {/* Stat */}
              {renderStat(hero)}
            </motion.div>

            {/* Dropdown showing top 3 players for this hero */}
            {isHeroExpanded && heroLeaderboard.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border-2 border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                  {heroLeaderboard.slice(0, 3).map((entry, idx) => {
                    const playerRank = idx + 1;
                    const playerRankStyle = getRankStyle(playerRank);
                    const PlayerRankIcon = playerRankStyle.icon;
                    const isCurrentPlayer = entry.player === dataPlayerName;

                    return (
                      <div
                        key={entry.player}
                        className={`flex items-center gap-2 p-2 rounded-lg border ${
                          playerRank <= 3 ? `${playerRankStyle.border} ${playerRankStyle.bg}` : "border-slate-700 bg-slate-900/50"
                        } ${isCurrentPlayer ? "ring-2 ring-blue-500" : ""}`}
                      >
                        {/* Rank */}
                        <div className="w-8 flex items-center justify-center">
                          {PlayerRankIcon ? (
                            <PlayerRankIcon className={`w-4 h-4 ${playerRankStyle.text}`} />
                          ) : (
                            <span className="text-sm font-bold text-slate-500">#{playerRank}</span>
                          )}
                        </div>

                        {/* Player Image */}
                        <div className={`w-8 h-8 rounded-lg overflow-hidden border ${playerRank <= 3 ? playerRankStyle.border : "border-slate-700"}`}>
                          <img
                            src={getPlayerImage(entry.player)}
                            alt={String(entry.player)}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              const fallback = e.target.parentElement.querySelector(".fallback");
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                          <div className="fallback hidden w-full h-full items-center justify-center bg-slate-700">
                            <span className="text-xs font-bold text-slate-400">
                              {String(entry.player).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Player Name */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${playerRank <= 3 ? playerRankStyle.text : "text-white"}`}>
                            {entry.player}
                          </p>
                        </div>

                        {/* Value */}
                        <div className={`text-sm font-bold ${playerRank <= 3 ? playerRankStyle.text : "text-slate-300"}`}>
                          {statType === "winRate" ? `${entry.value.toFixed(1)}%` :
                           statType === "kda" ? entry.value.toFixed(2) :
                           Math.round(entry.value)}
                        </div>
                      </div>
                    );
                  })}

                  {/* Show current player if not in top 3 */}
                  {globalRank && globalRank > 3 && (
                    <>
                      <div className="border-t border-slate-600 my-2"></div>
                      <div className="flex items-center gap-2 p-2 rounded-lg border-2 border-blue-500 bg-blue-500/10 ring-2 ring-blue-500">
                        {/* Current player rank */}
                        <div className="w-8 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-400">#{globalRank}</span>
                        </div>

                        {/* Player Image */}
                        <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-blue-500">
                          <img
                            src={getPlayerImage(dataPlayerName)}
                            alt={String(dataPlayerName)}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              const fallback = e.target.parentElement.querySelector(".fallback");
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                          <div className="fallback hidden w-full h-full items-center justify-center bg-slate-700">
                            <span className="text-xs font-bold text-slate-400">
                              {String(dataPlayerName).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Player Name */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate text-blue-400">
                            {dataPlayerName} (You)
                          </p>
                        </div>

                        {/* Value - based on statType */}
                        <div className="text-sm font-bold text-blue-400">
                          {statType === "winRate" ? `${hero.win_rate.toFixed(1)}%` :
                           statType === "kda" ? hero.kda.toFixed(2) :
                           statType === "maxGPM" ? Math.round(hero.max_gpm) :
                           statType === "maxKills" ? hero.max_kills :
                           statType === "maxAssists" ? hero.max_assists :
                           statType === "maxXPM" ? Math.round(hero.max_xpm) :
                           statType === "maxNetworth" ? `${(hero.max_networth / 1000).toFixed(1)}k` :
                           ""}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}

