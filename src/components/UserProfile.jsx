import { useState } from "react";
import { Plus } from "lucide-react";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * UserProfile Component
 * Handles Steam profile linking, stats fetching, and display for Dota 2 players
 * @param {boolean} compact - If true, renders in compact mode for header
 */
export default function UserProfile({ userName, scheduleData, updateSchedule, compact = false }) {
  const [showSteamIdModal, setShowSteamIdModal] = useState(false);
  const [steamIdInput, setSteamIdInput] = useState("");
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  /**
   * Extract Steam ID from various URL formats
   * Supports: OpenDota, Dotabuff, Stratz URLs, or direct Steam ID
   */
  const extractSteamId = (input) => {
    // OpenDota URL: https://www.opendota.com/players/123456789
    const openDotaMatch = input.match(/opendota\.com\/players\/(\d+)/);
    if (openDotaMatch) return openDotaMatch[1];

    // Dotabuff URL: https://www.dotabuff.com/players/123456789
    const dotabuffMatch = input.match(/dotabuff\.com\/players\/(\d+)/);
    if (dotabuffMatch) return dotabuffMatch[1];

    // Stratz URL: https://stratz.com/players/123456789
    const stratzMatch = input.match(/stratz\.com\/players\/(\d+)/);
    if (stratzMatch) return stratzMatch[1];

    // Just a number (direct Steam ID)
    if (/^\d+$/.test(input.trim())) return input.trim();

    return null;
  };

  /**
   * Get rank name from rank tier number
   */
  const getRankName = (rankTier) => {
    if (!rankTier) return "Unranked";
    const ranks = ["Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine", "Immortal"];
    const tier = Math.floor(rankTier / 10);
    const star = rankTier % 10;
    if (tier === 8) return `Immortal ${star > 0 ? `#${star}` : ""}`;
    return `${ranks[tier - 1]} ${star}`;
  };

  /**
   * Fetch player stats from OpenDota API
   */
  const fetchPlayerStats = async (steamId) => {
    try {
      setIsLoadingStats(true);

      console.log("Fetching stats for Steam ID:", steamId);

      // Fetch player data
      const playerResponse = await fetch(`https://api.opendota.com/api/players/${steamId}`);
      const playerData = await playerResponse.json();
      console.log("Player data:", playerData);

      // Fetch win/loss stats
      const wlResponse = await fetch(`https://api.opendota.com/api/players/${steamId}/wl`);
      const wlData = await wlResponse.json();
      console.log("Win/Loss data:", wlData);

      // Fetch recent matches to check current status
      const matchesResponse = await fetch(`https://api.opendota.com/api/players/${steamId}/recentMatches`);
      const matchesData = await matchesResponse.json();
      console.log("Recent matches:", matchesData);

      // Calculate stats
      const totalGames = (wlData.win || 0) + (wlData.lose || 0);
      const winRate = totalGames > 0 ? ((wlData.win / totalGames) * 100).toFixed(1) : "0.0";

      // Check if currently playing (last match within 2 hours and no duration)
      const lastMatch = matchesData && matchesData.length > 0 ? matchesData[0] : null;
      const now = Math.floor(Date.now() / 1000);
      const isPlaying = lastMatch && (now - lastMatch.start_time < 7200) && !lastMatch.duration;

      // Get last match time
      const lastMatchTime = lastMatch ? new Date(lastMatch.start_time * 1000) : null;

      // Get MMR - try multiple sources in order of preference
      let mmr = 0;
      if (playerData.computed_mmr) {
        // Most reliable - OpenDota's computed MMR
        mmr = playerData.computed_mmr;
      } else if (playerData.mmr_estimate?.estimate) {
        mmr = playerData.mmr_estimate.estimate;
      } else if (playerData.solo_competitive_rank) {
        mmr = playerData.solo_competitive_rank;
      } else if (playerData.competitive_rank) {
        mmr = playerData.competitive_rank;
      }

      const stats = {
        steamId,
        name: playerData.profile?.personaname || userName,
        avatar: playerData.profile?.avatarfull || playerData.profile?.avatar || playerData.profile?.avatarmedium || null,
        mmr: Math.round(mmr),
        rank: playerData.rank_tier || 0,
        leaderboardRank: playerData.leaderboard_rank || null,
        winRate,
        totalGames,
        wins: wlData.win || 0,
        losses: wlData.lose || 0,
        isPlaying: isPlaying || false,
        lastMatchTime: lastMatchTime ? lastMatchTime.toISOString() : null,
        profileUrl: `https://www.opendota.com/players/${steamId}`,
      };

      console.log("Final stats object:", stats);
      return stats;
    } catch (error) {
      console.error("Error fetching player stats:", error);
      alert("Error fetching stats: " + error.message);
      return null;
    } finally {
      setIsLoadingStats(false);
    }
  };

  /**
   * Handle saving Steam ID and updating Firebase
   */
  const handleSaveSteamId = async () => {
    if (!userName || !steamIdInput.trim()) return;

    const steamId = extractSteamId(steamIdInput);
    if (!steamId) {
      alert("Invalid Steam ID or URL. Please enter:\n- OpenDota URL (opendota.com/players/...)\n- Dotabuff URL (dotabuff.com/players/...)\n- Steam ID (numeric)");
      return;
    }

    const stats = await fetchPlayerStats(steamId);
    console.log("Stats returned from fetch:", stats);

    if (stats) {
      try {
        // Save to players document
        const playersRef = doc(db, "app-data", "players");

        // Get existing players data
        const playersSnap = await getDoc(playersRef);
        const existingPlayers = playersSnap.exists() ? playersSnap.data().list || {} : {};

        // Add current player with timestamp
        const updatedPlayers = {
          ...existingPlayers,
          [userName]: {
            ...stats,
            registeredAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          }
        };

        // Save to players document
        await setDoc(playersRef, { list: updatedPlayers });
        console.log("Player saved to players document:", userName);

        // Also update schedule playerStats for backward compatibility
        const newPlayerStats = {
          ...scheduleData.playerStats,
          [userName]: stats,
        };
        await updateSchedule({ playerStats: newPlayerStats });

        console.log("Player data saved successfully");
        console.log("All players:", Object.keys(updatedPlayers));

        // Show success message
        alert(`Profile linked successfully!\n\nName: ${stats.name}\nRank: ${getRankName(stats.rank)}\nMMR: ${Math.round(stats.mmr)}`);

        setShowSteamIdModal(false);
        setSteamIdInput("");
      } catch (error) {
        console.error("Error saving player data:", error);
        alert("Error saving player data: " + error.message);
      }
    } else {
      alert("Failed to fetch player stats. Please check your Steam ID and try again.");
    }
  };

  return (
    <>
      {/* Link Profile Button */}
      {userName && (
        <div className={compact ? "w-full" : "flex items-center gap-2"}>
          <button
            onClick={() => setShowSteamIdModal(true)}
            className={`flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs sm:text-sm ${
              compact ? "w-full justify-center" : ""
            }`}
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            {scheduleData.playerStats[userName] ? 'Update Profile' : 'Link Steam Profile'}
          </button>
          {/* Debug info - only show in non-compact mode */}
          {!compact && (
            <span className="text-xs text-slate-500">
              Stats: {scheduleData.playerStats[userName] ? '✓' : '✗'} | User: {userName}
            </span>
          )}
        </div>
      )}

      {/* Steam ID Modal */}
      {showSteamIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full border-2 border-slate-700 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Link Your Dota 2 Profile
            </h2>
            <p className="text-slate-300 mb-4">
              Enter your Steam ID or profile URL to display your stats
            </p>

            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 mb-4">
              <p className="text-blue-300 text-sm font-semibold mb-2">Accepted formats:</p>
              <ul className="text-blue-200 text-xs space-y-1">
                <li>• OpenDota: https://www.opendota.com/players/123456789</li>
                <li>• Dotabuff: https://www.dotabuff.com/players/123456789</li>
                <li>• Steam ID: 123456789</li>
              </ul>
            </div>

            <input
              type="text"
              placeholder="Paste your profile URL or Steam ID..."
              value={steamIdInput}
              onChange={(e) => setSteamIdInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveSteamId();
                }
              }}
              className="w-full p-3 sm:p-4 bg-slate-900 text-white rounded-lg border-2 border-slate-600 focus:border-green-500 focus:outline-none mb-4 text-sm sm:text-base"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={handleSaveSteamId}
                disabled={isLoadingStats}
                className="flex-1 py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors duration-200 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingStats ? "Loading..." : "Save Profile"}
              </button>
              <button
                onClick={() => {
                  setShowSteamIdModal(false);
                  setSteamIdInput("");
                }}
                className="px-6 py-3 sm:py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors duration-200 text-base sm:text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
