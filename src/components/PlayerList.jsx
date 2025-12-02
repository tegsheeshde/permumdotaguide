import { useState, useEffect } from "react";
import { Users, Award, Flag, Smile } from "lucide-react";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";

export default function PlayerList({ userName }) {
  const [players, setPlayers] = useState({});
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [reports, setReports] = useState({});
  const [customReasons, setCustomReasons] = useState([]);

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

  // Load fun reports from Firebase
  useEffect(() => {
    const reportsRef = doc(db, "app-data", "fun-reports");

    const unsubscribe = onSnapshot(
      reportsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setReports(docSnap.data().reports || {});
        } else {
          setReports({});
        }
      },
      (error) => {
        console.error("Error loading reports:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Load custom reasons from Firebase
  useEffect(() => {
    const customReasonsRef = doc(db, "app-data", "custom-report-reasons");

    const unsubscribe = onSnapshot(
      customReasonsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setCustomReasons(docSnap.data().reasons || []);
        } else {
          setCustomReasons([]);
        }
      },
      (error) => {
        console.error("Error loading custom reasons:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const defaultFunReportReasons = [
    { emoji: "💣", text: "Picked Techies", color: "text-red-400" },
    { emoji: "👁️", text: "Didn't buy wards", color: "text-yellow-400" },
    { emoji: "😎", text: "Too handsome", color: "text-blue-400" },
    { emoji: "🔇", text: "Didn't join voice", color: "text-purple-400" },
    { emoji: "🤡", text: "Acted like pro, played like Herald", color: "text-orange-400" },
    { emoji: "🐢", text: "Slowest farmer in history", color: "text-green-400" },
    { emoji: "🎯", text: "Missed every skillshot", color: "text-pink-400" },
    { emoji: "💤", text: "AFK farming while team fights", color: "text-cyan-400" },
  ];

  // Combine default and custom reasons
  const funReportReasons = [
    ...defaultFunReportReasons,
    ...customReasons.map(reason => ({
      emoji: "✨",
      text: reason,
      color: "text-indigo-400"
    }))
  ];

  const hasUserReported = (playerName) => {
    if (!userName) return false;
    const playerReports = reports[playerName] || [];
    return playerReports.some(report => report.reporter === userName);
  };

  const handleReport = async (playerName, reason) => {
    if (!userName) {
      alert("Please set your username first!");
      return;
    }

    try {
      const reportsRef = doc(db, "app-data", "fun-reports");
      const customReasonsRef = doc(db, "app-data", "custom-report-reasons");

      const reportsSnap = await getDoc(reportsRef);

      const currentReports = reportsSnap.exists() ? reportsSnap.data().reports || {} : {};
      const playerReports = currentReports[playerName] || [];

      // Check if user already reported this player
      const existingReportIndex = playerReports.findIndex(report => report.reporter === userName);

      let updatedPlayerReports;
      if (existingReportIndex !== -1) {
        // Update existing report
        updatedPlayerReports = [...playerReports];
        updatedPlayerReports[existingReportIndex] = {
          ...updatedPlayerReports[existingReportIndex],
          reason,
          timestamp: new Date().toISOString(),
        };
      } else {
        // Add new report
        const newReport = {
          reason,
          reporter: userName,
          timestamp: new Date().toISOString(),
          id: Date.now(),
        };
        updatedPlayerReports = [...playerReports, newReport];
      }

      const updatedReports = {
        ...currentReports,
        [playerName]: updatedPlayerReports,
      };

      await setDoc(reportsRef, { reports: updatedReports });

      // If it's a custom reason and not in the list yet, add it
      const isDefaultReason = defaultFunReportReasons.some(r => r.text === reason);
      if (!isDefaultReason && !customReasons.includes(reason)) {
        const customReasonsSnap = await getDoc(customReasonsRef);
        const currentCustomReasons = customReasonsSnap.exists() ? customReasonsSnap.data().reasons || [] : [];

        await setDoc(customReasonsRef, {
          reasons: [...currentCustomReasons, reason]
        });
      }

      setShowReportModal(false);
      setSelectedPlayer(null);
      setSelectedReason("");
      setCustomReason("");
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
    }
  };

  const getPlayerReports = (playerName) => {
    return reports[playerName] || [];
  };

  const getMostReportedReason = (playerName) => {
    const playerReports = getPlayerReports(playerName);
    if (playerReports.length === 0) return null;

    const reasonCounts = {};
    playerReports.forEach(report => {
      reasonCounts[report.reason] = (reasonCounts[report.reason] || 0) + 1;
    });

    return Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
  };

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

                  {/* Fun Reports */}
                  {getMostReportedReason(playerName) && (
                    <div className="mt-3 px-3 py-2 bg-orange-600/10 border border-orange-600/30 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Most Reported:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {funReportReasons.find(r => r.text === getMostReportedReason(playerName)[0])?.emoji}
                          </span>
                          <span className={`text-xs font-medium ${funReportReasons.find(r => r.text === getMostReportedReason(playerName)[0])?.color}`}>
                            {getMostReportedReason(playerName)[0]}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({getMostReportedReason(playerName)[1]}x)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Report Button */}
                  <button
                    onClick={() => {
                      setSelectedPlayer(playerName);
                      // Pre-fill existing report if user has already reported
                      const playerReports = reports[playerName] || [];
                      const existingReport = playerReports.find(report => report.reporter === userName);
                      if (existingReport) {
                        // Check if it's a default reason or custom
                        const isDefaultReason = defaultFunReportReasons.some(r => r.text === existingReport.reason);
                        if (isDefaultReason) {
                          setSelectedReason(existingReport.reason);
                          setCustomReason("");
                        } else {
                          setSelectedReason("");
                          setCustomReason(existingReport.reason);
                        }
                      }
                      setShowReportModal(true);
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 border rounded text-sm transition-colors bg-orange-600/20 text-orange-400 border-orange-600/30 hover:bg-orange-600/30"
                  >
                    <Smile className="w-4 h-4" />
                    {hasUserReported(playerName) ? "Change Report" : "Report (For Fun!)"}
                  </button>

                  {/* Profile Link */}
                  {stats.profileUrl && (
                    <a
                      href={stats.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-center px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-600/30 rounded text-sm hover:bg-cyan-600/30 transition-colors"
                    >
                      View OpenDota Profile
                    </a>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Fun Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto pt-20">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border-2 border-orange-600/50 shadow-2xl my-auto max-h-[calc(100vh-160px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Smile className="w-6 h-6 text-orange-400" />
                {hasUserReported(selectedPlayer) ? `Change Report for ${selectedPlayer}` : `Report ${selectedPlayer}`}
              </h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedPlayer(null);
                  setSelectedReason("");
                  setCustomReason("");
                }}
                className="text-slate-400 hover:text-white"
              >
                <Flag className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4">
              This is just for laughs! No one is actually being reported. 😄
            </p>

            <div className="space-y-2 mb-4">
              {funReportReasons.map((reason) => (
                <button
                  key={reason.text}
                  onClick={() => {
                    setSelectedReason(reason.text);
                    setCustomReason("");
                  }}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    selectedReason === reason.text && !customReason
                      ? `border-orange-600 bg-orange-600/20 ${reason.color}`
                      : "border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{reason.emoji}</span>
                    <span className="text-sm font-medium">{reason.text}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Reason Input */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">
                Or write your own reason:
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  if (e.target.value) {
                    setSelectedReason("");
                  }
                }}
                placeholder="e.g., Stole all the bounty runes..."
                className="w-full px-3 py-2 bg-slate-900 text-white rounded-lg border-2 border-slate-700 focus:border-orange-600 focus:outline-none text-sm"
                maxLength={50}
              />
              <p className="text-xs text-slate-500 mt-1">
                {customReason.length}/50 characters
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const reason = customReason.trim() || selectedReason;
                  if (reason) {
                    handleReport(selectedPlayer, reason);
                    setCustomReason("");
                  }
                }}
                disabled={!selectedReason && !customReason.trim()}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Report
              </button>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedPlayer(null);
                  setSelectedReason("");
                  setCustomReason("");
                }}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
