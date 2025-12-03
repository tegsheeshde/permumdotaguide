import { useState } from "react";
import { Plus } from "lucide-react";
import ProfileManager from "./ProfileManager";
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
  const [mmrInput, setMmrInput] = useState("");
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
   * Rank definitions with MMR ranges
   */
  const ranks = [
    { value: "herald", label: "Herald", color: "text-gray-400", mmrMin: 0, mmrMax: 769 },
    { value: "guardian", label: "Guardian", color: "text-green-400", mmrMin: 770, mmrMax: 1539 },
    { value: "crusader", label: "Crusader", color: "text-yellow-400", mmrMin: 1540, mmrMax: 2309 },
    { value: "archon", label: "Archon", color: "text-orange-400", mmrMin: 2310, mmrMax: 3079 },
    { value: "legend", label: "Legend", color: "text-purple-400", mmrMin: 3080, mmrMax: 3849 },
    { value: "ancient", label: "Ancient", color: "text-cyan-400", mmrMin: 3850, mmrMax: 4619 },
    { value: "divine", label: "Divine", color: "text-blue-400", mmrMin: 4620, mmrMax: 5600 },
    { value: "immortal", label: "Immortal", color: "text-red-400", mmrMin: 5600, mmrMax: Infinity },
  ];

  /**
   * Calculate rank from MMR
   */
  const getRankFromMMR = (mmr) => {
    if (!mmr || mmr < 0) return "Unranked";

    for (const rank of ranks) {
      if (mmr >= rank.mmrMin && mmr <= rank.mmrMax) {
        return rank.label;
      }
    }

    return "Unranked";
  };

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

      const stats = {
        steamId,
        name: playerData.profile?.personaname || userName,
        avatar: playerData.profile?.avatarfull || playerData.profile?.avatar || playerData.profile?.avatarmedium || null,
        mmr: 0, // Will be set by user input
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
    if (!userName || !steamIdInput.trim()) {
      alert("Please enter a Steam ID or profile URL.");
      return;
    }

    if (!mmrInput.trim()) {
      alert("Please enter your MMR.");
      return;
    }

    const mmr = parseInt(mmrInput.trim());
    if (isNaN(mmr) || mmr < 0) {
      alert("Please enter a valid MMR (positive number).");
      return;
    }

    const steamId = extractSteamId(steamIdInput);
    if (!steamId) {
      alert("Invalid Steam ID or URL. Please enter:\n- OpenDota URL (opendota.com/players/...)\n- Dotabuff URL (dotabuff.com/players/...)\n- Steam ID (numeric)");
      return;
    }

    const stats = await fetchPlayerStats(steamId);
    console.log("Stats returned from fetch:", stats);

    if (stats) {
      try {
        // Override MMR with user input
        stats.mmr = mmr;

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

        // Calculate rank from MMR
        const calculatedRank = getRankFromMMR(stats.mmr);

        // Show success message
        alert(`Profile linked successfully!\n\nName: ${stats.name}\nRank: ${calculatedRank}\nMMR: ${stats.mmr}`);

        setShowSteamIdModal(false);
        setSteamIdInput("");
        setMmrInput("");
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
        <div className={compact ? "w-full space-y-2" : "flex items-center gap-2"}>
          <button
            onClick={() => setShowSteamIdModal(true)}
            className={`flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs sm:text-sm ${
              compact ? "w-full justify-center" : ""
            }`}
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            {scheduleData.playerStats[userName] ? 'Update Steam Profile' : 'Link Steam Profile'}
          </button>
          
          {/* Profile Manager Integration */}
          <ProfileManager 
            userName={userName} 
            triggerClassName={compact ? "w-full" : "w-auto"} 
          />

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-54 bg-black/70 backdrop-blur-sm">
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
              className="w-full p-3 sm:p-4 bg-slate-900 text-white rounded-lg border-2 border-slate-600 focus:border-green-500 focus:outline-none mb-4 text-sm sm:text-base"
              autoFocus
            />

            <div className="mb-4">
              <label className="block text-white text-sm font-semibold mb-2">
                Your MMR
              </label>
              <input
                type="number"
                placeholder="Enter your current MMR..."
                value={mmrInput}
                onChange={(e) => setMmrInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveSteamId();
                  }
                }}
                className="w-full p-3 sm:p-4 bg-slate-900 text-white rounded-lg border-2 border-slate-600 focus:border-green-500 focus:outline-none text-sm sm:text-base"
                min="0"
              />
              {mmrInput && !isNaN(parseInt(mmrInput)) && (
                <div className="mt-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-400">
                    Calculated Rank: <span className="font-bold text-white">{getRankFromMMR(parseInt(mmrInput))}</span>
                  </p>
                </div>
              )}
            </div>

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
                  setMmrInput("");
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
