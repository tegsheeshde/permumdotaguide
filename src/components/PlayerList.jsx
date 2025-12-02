import { useState, useEffect } from "react";
import { Users, Award } from "lucide-react";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

export default function PlayerList() {
  const [players, setPlayers] = useState({});
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  // Load and sync players from Firebase
  useEffect(() => {
    const playersRef = doc(db, "app-data", "players");

    const unsubscribe = onSnapshot(
      playersRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setPlayers(docSnap.data().list || {});
        } else {
          setPlayers({});
        }
        setIsLoadingPlayers(false);
      },
      (error) => {
        console.error("Error loading players:", error);
        setIsLoadingPlayers(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Get rank name from rank_tier or string
  const getRankName = (rankTier) => {
    if (!rankTier) return "Unranked";
    // Handle manual string ranks (e.g., "archon")
    if (typeof rankTier === "string") {
      return rankTier.charAt(0).toUpperCase() + rankTier.slice(1);
    }
    // Handle OpenDota rank tiers (number)
    const ranks = [
      "Herald",
      "Guardian",
      "Crusader",
      "Archon",
      "Legend",
      "Ancient",
      "Divine",
      "Immortal",
    ];
    const tier = Math.floor(rankTier / 10);
    const star = rankTier % 10;
    if (tier === 8) return `Immortal ${star > 0 ? `#${star}` : ""}`;
    return `${ranks[tier - 1]} ${star}`;
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-cyan-400" />
          Registered Players
        </h2>
        <p className="text-slate-300 text-sm sm:text-base">
          All players who have linked their Dota 2 profiles
        </p>
      </div>

      {/* Players List */}
      {isLoadingPlayers ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 mt-4">Loading players...</p>
        </div>
      ) : Object.keys(players).length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl p-8 border-2 border-slate-700 text-center">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No players registered yet</p>
          <p className="text-slate-500 text-sm mt-2">
            Be the first to link your Steam profile!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(players)
            .sort((a, b) => (b[1].mmr || 0) - (a[1].mmr || 0))
            .map(([playerName, stats], index) => (
              <div
                key={playerName}
                className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-5 border-2 border-cyan-600/30 hover:border-cyan-600/50 transition-all duration-300 hover:scale-105"
              >
                {/* Rank Badge */}
                {index < 3 && (
                  <div className="absolute top-3 right-3">
                    {index === 0 && (
                      <Award className="w-6 h-6 text-yellow-400" />
                    )}
                    {index === 1 && (
                      <Award className="w-6 h-6 text-gray-400" />
                    )}
                    {index === 2 && (
                      <Award className="w-6 h-6 text-orange-600" />
                    )}
                  </div>
                )}

                {/* Player Header */}
                <div className="flex items-center gap-3 mb-4">
                  {stats.avatar && (
                    <img
                      src={stats.avatar}
                      alt={playerName}
                      className="w-16 h-16 rounded-full border-2 border-cyan-600/50"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg truncate">
                      {playerName}
                    </h3>
                    {stats.name && stats.name !== playerName && (
                      <p className="text-slate-400 text-sm truncate">
                        {stats.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  {/* Rank and MMR */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Rank:</span>
                    <span className="text-yellow-400 font-bold text-sm">
                      {getRankName(stats.rank)}
                    </span>
                  </div>
                  {stats.mmr > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">MMR:</span>
                      <span className="text-cyan-400 font-bold text-sm">
                        {stats.mmr.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Additional Profile Info */}
                  {(stats.role || stats.phone || stats.preferredHeroes) && (
                    <div className="pt-2 border-t border-slate-700/50 space-y-1">
                      {stats.role && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">Role:</span>
                          <span className="text-white font-medium text-sm">
                            {stats.role.charAt(0).toUpperCase() +
                              stats.role.slice(1)}
                          </span>
                        </div>
                      )}
                      {stats.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">Phone:</span>
                          <span className="text-white font-medium text-sm">
                            {stats.phone}
                          </span>
                        </div>
                      )}
                      {stats.preferredHeroes && (
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400 text-sm">
                            Heroes:
                          </span>
                          <span className="text-white text-sm truncate">
                            {stats.preferredHeroes}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Win Rate */}
                  {stats.totalGames > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">
                          Win Rate:
                        </span>
                        <span
                          className={`font-bold text-sm ${
                            parseFloat(stats.winRate) >= 50
                              ? "text-green-400"
                              : "text-orange-400"
                          }`}
                        >
                          {stats.winRate}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">
                          Total Games:
                        </span>
                        <span className="text-white font-bold text-sm">
                          {stats.totalGames.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">W/L:</span>
                        <span className="text-white font-bold text-sm">
                          <span className="text-green-400">
                            {stats.wins}
                          </span>{" "}
                          /{" "}
                          <span className="text-red-400">
                            {stats.losses}
                          </span>
                        </span>
                      </div>
                    </>
                  )}

                  {/* Status */}
                  {stats.isPlaying && (
                    <div className="mt-3 px-3 py-1.5 bg-green-600/20 text-green-400 border border-green-600/40 rounded text-xs font-medium text-center animate-pulse">
                      Playing Now
                    </div>
                  )}

                  {/* Profile Link */}
                  {stats.profileUrl && (
                    <a
                      href={stats.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block text-center px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-600/30 rounded text-sm hover:bg-cyan-600/30 transition-colors"
                    >
                      View OpenDota Profile
                    </a>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
