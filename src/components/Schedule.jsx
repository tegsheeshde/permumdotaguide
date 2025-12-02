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
                  .filter(([, slots]) => slots[slotKey])
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
    </div>
  );
}
