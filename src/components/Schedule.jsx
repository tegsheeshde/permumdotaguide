import {
  Calendar,
  Clock,
  Check,
  X,
  Wifi,
  Trophy,
  Trash2,
  Users,
  Award,
} from "lucide-react";
import UserProfile from "./UserProfile";

export default function Schedule({
  scheduleData,
  updateSchedule,
  userName,
  setShowNameModal,
}) {
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const timeSlots = [
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00",
  ];

  const toggleAvailability = (day, time) => {
    if (!userName) {
      setShowNameModal(true);
      return;
    }

    const slotKey = `${day}-${time}`;
    const userAvailability = scheduleData.availability[userName] || {};
    const newAvailability = {
      ...scheduleData.availability,
      [userName]: {
        ...userAvailability,
        [slotKey]: !userAvailability[slotKey],
      },
    };

    updateSchedule({ availability: newAvailability });
  };

  const clearMyAvailability = () => {
    if (!userName) return;

    const newAvailability = { ...scheduleData.availability };
    const newPreferences = { ...scheduleData.preferences };
    delete newAvailability[userName];
    delete newPreferences[userName];
    updateSchedule({
      availability: newAvailability,
      preferences: newPreferences,
    });
  };

  const toggleGameMode = (mode) => {
    if (!userName) {
      setShowNameModal(true);
      return;
    }

    const userPrefs = scheduleData.preferences[userName] || {
      lan: false,
      ranked: false,
    };
    const newPreferences = {
      ...scheduleData.preferences,
      [userName]: {
        ...userPrefs,
        [mode]: !userPrefs[mode],
      },
    };

    updateSchedule({ preferences: newPreferences });
  };

  // Calculate best time slots
  const getBestTimeSlots = () => {
    const slotCounts = {};
    const slotPlayers = {};
    const slotModes = {};

    // Count availability for each slot
    Object.entries(scheduleData.availability).forEach(([player, slots]) => {
      Object.entries(slots).forEach(([slotKey, isAvailable]) => {
        if (isAvailable) {
          slotCounts[slotKey] = (slotCounts[slotKey] || 0) + 1;
          if (!slotPlayers[slotKey]) slotPlayers[slotKey] = [];
          slotPlayers[slotKey].push(player);

          // Track game mode preferences for this slot
          if (!slotModes[slotKey]) {
            slotModes[slotKey] = { lan: 0, ranked: 0 };
          }
          const playerPrefs = scheduleData.preferences[player] || {};
          if (playerPrefs.lan) slotModes[slotKey].lan++;
          if (playerPrefs.ranked) slotModes[slotKey].ranked++;
        }
      });
    });

    // Sort by count (descending)
    const sorted = Object.entries(slotCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([slot, count]) => ({
        slot,
        count,
        players: slotPlayers[slot],
        modes: slotModes[slot],
      }));

    return sorted;
  };

  const bestSlots = getBestTimeSlots();

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Schedule Header */}
      <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-6 h-6 text-orange-400" />
              Team Schedule
            </h2>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Mark your availability for the week
            </p>
          </div>
          {userName && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700 w-full sm:w-auto justify-center">
                <span className="text-slate-400 text-sm">Preferences:</span>
                <button
                  onClick={() => toggleGameMode("lan")}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs sm:text-sm transition-colors ${
                    scheduleData.preferences[userName]?.lan
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  <Wifi className="w-3 h-3 sm:w-4 sm:h-4" />
                  LAN
                </button>
                <button
                  onClick={() => toggleGameMode("ranked")}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs sm:text-sm transition-colors ${
                    scheduleData.preferences[userName]?.ranked
                      ? "bg-yellow-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                  Ranked
                </button>
              </div>
              <button
                onClick={clearMyAvailability}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors border border-red-600/30 w-full sm:w-auto text-sm sm:text-base"
              >
                <Trash2 className="w-4 h-4" />
                Clear My Schedule
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Best Time Slots */}
      {bestSlots.length > 0 && (
        <div className="bg-linear-to-br from-green-900/20 to-slate-900/40 rounded-xl p-4 sm:p-6 border border-green-500/20 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Best Times to Play
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bestSlots.slice(0, 6).map(({ slot, count, players, modes }) => (
              <div
                key={slot}
                className="bg-slate-900/60 p-3 rounded-lg border border-slate-700 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-white text-sm sm:text-base">
                    {slot.replace("-", " ")}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {players.join(", ")}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 bg-green-600/20 px-2 py-1 rounded text-green-400 text-xs font-bold">
                    <Check className="w-3 h-3" />
                    {count}
                  </div>
                  <div className="flex gap-1">
                    {modes.lan > 0 && (
                      <span
                        className="text-[10px] bg-purple-600/20 text-purple-400 px-1 rounded"
                        title={`${modes.lan} players want LAN`}
                      >
                        LAN
                      </span>
                    )}
                    {modes.ranked > 0 && (
                      <span
                        className="text-[10px] bg-yellow-600/20 text-yellow-400 px-1 rounded"
                        title={`${modes.ranked} players want Ranked`}
                      >
                        Ranked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Grid */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px] bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-8 border-b border-slate-700 bg-slate-800/50">
            <div className="p-2 sm:p-2 font-bold text-slate-400 border-r border-slate-700 sticky left-0 bg-slate-800/95 backdrop-blur-sm z-10 text-sm sm:text-base">
              Time
            </div>
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="p-2 sm:p-2 font-bold text-white text-center border-r border-slate-700 last:border-r-0 text-sm sm:text-base"
              >
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {timeSlots.map((time) => (
            <div
              key={time}
              className="grid grid-cols-8 border-b border-slate-700 last:border-b-0 hover:bg-slate-800/30 transition-colors"
            >
              <div className="p-2 sm:p-3 text-slate-400 font-medium text-xs sm:text-sm border-r border-slate-700 flex items-center justify-center sticky left-0 bg-slate-900/95 backdrop-blur-sm z-10">
                {time}
              </div>
              {daysOfWeek.map((day) => {
                const slotKey = `${day}-${time}`;
                const availablePlayers = Object.entries(
                  scheduleData.availability
                )
                  .filter(([_, slots]) => slots[slotKey])
                  .map(([player]) => player);
                const isUserAvailable =
                  scheduleData.availability[userName]?.[slotKey];

                return (
                  <div
                    key={`${day}-${time}`}
                    onClick={() => toggleAvailability(day, time)}
                    className={`p-1 sm:p-2 border-r border-slate-700 last:border-r-0 min-h-[60px] sm:min-h-[80px] cursor-pointer transition-all duration-200 relative group ${
                      isUserAvailable
                        ? "bg-green-600/10 hover:bg-green-600/20"
                        : "hover:bg-slate-700/30"
                    }`}
                  >
                    {/* User Indicator */}
                    {isUserAvailable && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    )}

                    {/* Players List */}
                    <div className="flex flex-wrap gap-1 content-start h-full">
                      {availablePlayers.map((player) => (
                        <span
                          key={player}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            player === userName
                              ? "bg-green-600 text-white border-green-500"
                              : "bg-slate-800 text-slate-300 border-slate-600"
                          }`}
                        >
                          {player}
                        </span>
                      ))}
                    </div>

                    {/* Hover Add/Remove Hint */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                      {isUserAvailable ? (
                        <X className="w-4 h-4 sm:w-6 sm:h-6 text-red-400" />
                      ) : (
                        <Check className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Players Summary */}
      {Object.keys(scheduleData.availability).length > 0 && (
        <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              Players ({Object.keys(scheduleData.availability).length})
            </h3>
            <UserProfile
              userName={userName}
              scheduleData={scheduleData}
              updateSchedule={updateSchedule}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.keys(scheduleData.availability).map((player) => {
              const prefs = scheduleData.preferences[player] || {
                lan: false,
                ranked: false,
              };
              const stats = scheduleData.playerStats[player];

              // Get rank name helper
              const getRankName = (rankTier) => {
                if (!rankTier) return "Unranked";
                if (typeof rankTier === "string") {
                  return rankTier.charAt(0).toUpperCase() + rankTier.slice(1);
                }
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
                <div
                  key={player}
                  className={`p-4 bg-slate-900/50 rounded-lg border ${
                    stats ? "border-blue-600/40" : "border-slate-700"
                  } hover:border-slate-600 transition-colors`}
                >
                  {/* Player Header */}
                  <div className="flex items-center gap-3 mb-3">
                    {stats?.avatar && (
                      <img
                        src={stats.avatar}
                        alt={player}
                        className="w-12 h-12 rounded-full border-2 border-slate-600"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm sm:text-base truncate">
                          {player}
                        </span>
                        {stats?.isPlaying && (
                          <span className="shrink-0 px-2 py-0.5 bg-green-600/20 text-green-400 border border-green-600/40 rounded text-xs font-medium animate-pulse">
                            Playing
                          </span>
                        )}
                      </div>
                      {stats && (
                        <div className="flex items-center gap-2 mt-1">
                          {stats.rank > 0 ? (
                            <span className="text-yellow-400 font-bold text-xs sm:text-sm">
                              {getRankName(stats.rank)}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs sm:text-sm">
                              Unranked
                            </span>
                          )}
                          {stats.mmr > 0 && (
                            <span className="text-slate-400 text-xs">
                              • {stats.mmr.toLocaleString()} MMR
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Profile Info */}
                  {stats &&
                    (stats.role || stats.phone || stats.preferredHeroes) && (
                      <div className="mb-3 pt-2 border-t border-slate-700/50 space-y-1">
                        {stats.role && (
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span className="font-medium text-slate-500">
                              Role:
                            </span>
                            <span className="text-white">
                              {stats.role.charAt(0).toUpperCase() +
                                stats.role.slice(1)}
                            </span>
                          </div>
                        )}
                        {stats.phone && (
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span className="font-medium text-slate-500">
                              Phone:
                            </span>
                            <span className="text-white">{stats.phone}</span>
                          </div>
                        )}
                        {stats.preferredHeroes && (
                          <div className="text-xs text-slate-400 flex items-start gap-2">
                            <span className="font-medium text-slate-500 shrink-0">
                              Heroes:
                            </span>
                            <span className="text-white truncate">
                              {stats.preferredHeroes}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Stats */}
                  {stats && (
                    <div className="space-y-2 mb-3">
                      {stats.totalGames > 0 ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Win Rate:</span>
                            <span
                              className={`font-semibold ${
                                parseFloat(stats.winRate) >= 50
                                  ? "text-green-400"
                                  : "text-orange-400"
                              }`}
                            >
                              {stats.winRate}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Total Games:</span>
                            <span className="text-white font-semibold">
                              {stats.totalGames.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">W/L:</span>
                            <span className="text-white font-semibold">
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
                      ) : (
                        <div className="text-xs text-slate-500">
                          No public match data available
                        </div>
                      )}
                      {stats.lastMatchTime && !stats.isPlaying && (
                        <div className="text-xs text-slate-500">
                          Last:{" "}
                          {new Date(stats.lastMatchTime).toLocaleDateString()}{" "}
                          {new Date(stats.lastMatchTime).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </div>
                      )}
                      {!stats.lastMatchTime && !stats.isPlaying && (
                        <div className="text-xs text-slate-500 italic">
                          Profile data fetched successfully
                        </div>
                      )}
                    </div>
                  )}

                  {/* Game Mode Preferences */}
                  <div className="flex gap-2 mb-3">
                    {prefs.lan && (
                      <span className="inline-flex items-center px-2 py-1 bg-purple-600/20 text-purple-300 border border-purple-600/30 rounded text-xs">
                        <Wifi className="w-3 h-3 mr-1" />
                        LAN
                      </span>
                    )}
                    {prefs.ranked && (
                      <span className="inline-flex items-center px-2 py-1 bg-orange-600/20 text-orange-300 border border-orange-600/30 rounded text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Ranked
                      </span>
                    )}
                    {!prefs.lan && !prefs.ranked && !stats && (
                      <span className="text-slate-500 text-xs">
                        No preference set
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {stats && (
                      <a
                        href={stats.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded text-xs hover:bg-blue-600/30 transition-colors"
                      >
                        View Profile
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
