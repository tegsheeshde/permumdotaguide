import { useState, useEffect } from "react";
import { Swords, Users, Trash2, RotateCcw, UserPlus } from "lucide-react";
import { db } from "../firebase";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";

export default function Draft() {
  // Draft Picker State
  const [draftData, setDraftData] = useState({
    captain1: "",
    captain2: "",
    team1: [],
    team2: [],
    availablePlayers: [],
  });
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  // Load and sync draft data from Firebase
  useEffect(() => {
    const draftRef = doc(db, "app-data", "draft");

    const unsubscribe = onSnapshot(
      draftRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setDraftData(docSnap.data());
        } else {
          const initialDraft = {
            captain1: "",
            captain2: "",
            team1: [],
            team2: [],
            availablePlayers: [],
          };
          setDoc(draftRef, initialDraft);
          setDraftData(initialDraft);
        }
        setIsLoadingDraft(false);
      },
      (error) => {
        console.error("Error loading draft:", error);
        setIsLoadingDraft(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateDraft = async (updates) => {
    try {
      const draftRef = doc(db, "app-data", "draft");
      await updateDoc(draftRef, updates);
    } catch (error) {
      console.error("Error updating draft:", error);
    }
  };

  const addPlayerToDraft = () => {
    if (newPlayerName.trim()) {
      const updatedPlayers = [
        ...draftData.availablePlayers,
        newPlayerName.trim(),
      ];
      updateDraft({ availablePlayers: updatedPlayers });
      setNewPlayerName("");
      setShowAddPlayer(false);
    }
  };

  const movePlayerToTeam = (playerName, toTeam) => {
    const updates = { ...draftData };

    // Remove from all locations
    updates.availablePlayers = updates.availablePlayers.filter(
      (p) => p !== playerName
    );
    updates.team1 = updates.team1.filter((p) => p !== playerName);
    updates.team2 = updates.team2.filter((p) => p !== playerName);

    // Add to target team if not full
    if (toTeam === "team1" && updates.team1.length < 4) {
      updates.team1.push(playerName);
    } else if (toTeam === "team2" && updates.team2.length < 4) {
      updates.team2.push(playerName);
    } else if (toTeam === "available") {
      updates.availablePlayers.push(playerName);
    } else {
      // If team is full, return player to available
      updates.availablePlayers.push(playerName);
    }

    updateDraft(updates);
  };

  const setCaptain = (captainName, team) => {
    if (team === 1) {
      updateDraft({ captain1: captainName });
    } else {
      updateDraft({ captain2: captainName });
    }
  };

  const removePlayer = (playerName) => {
    const updates = {
      availablePlayers: draftData.availablePlayers.filter(
        (p) => p !== playerName
      ),
    };
    updateDraft(updates);
  };

  const resetDraft = () => {
    const reset = {
      captain1: "",
      captain2: "",
      team1: [],
      team2: [],
      availablePlayers: draftData.availablePlayers,
    };
    updateDraft(reset);
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Draft Header */}
      <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
              <Swords className="w-6 h-6 text-purple-400" />
              Captain's Draft
            </h2>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Pick captains and draft your teams
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowAddPlayer(!showAddPlayer)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm sm:text-base"
            >
              <UserPlus className="w-4 h-4" />
              Add Player
            </button>
            <button
              onClick={resetDraft}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm sm:text-base"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Add Player Form */}
        {showAddPlayer && (
          <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-top-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Player Name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayerToDraft()}
                className="flex-1 p-2 bg-slate-800 text-white rounded border border-slate-600 focus:border-purple-500 focus:outline-none text-sm sm:text-base"
                autoFocus
              />
              <button
                onClick={addPlayerToDraft}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium text-sm sm:text-base"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoadingDraft ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 mt-4">Loading draft...</p>
        </div>
      ) : (
        <>
          {/* Teams Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 backdrop-blur-sm">
            {/* Radiant Team */}
            <div className="bg-linear-to-br from-green-900/40 to-slate-900/60 rounded-xl p-4 sm:p-6 border-2 border-green-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-green-400">
                  Radiant
                </h3>
                <div className="text-sm text-slate-400">
                  {draftData.team1.length}/5 Players
                </div>
              </div>

              {/* Captain Selection */}
              <div className="mb-4">
                <label className="text-xs text-green-400/70 uppercase font-bold tracking-wider mb-1 block">
                  Captain
                </label>
                <input
                  type="text"
                  placeholder="Enter Captain Name"
                  value={draftData.captain1}
                  onChange={(e) => setCaptain(e.target.value, 1)}
                  className="w-full p-2 bg-slate-900/50 text-white rounded border border-green-500/30 focus:border-green-500 focus:outline-none text-sm"
                />
              </div>

              {/* Team Slots */}
              <div className="space-y-2">
                {[...Array(4)].map((_, idx) => (
                  <div
                    key={idx}
                    className="h-10 sm:h-12 bg-slate-900/40 rounded border border-green-500/20 flex items-center px-3 sm:px-4"
                  >
                    {draftData.team1[idx] ? (
                      <div className="flex items-center justify-between w-full group">
                        <span className="text-white font-medium text-sm sm:text-base">
                          {draftData.team1[idx]}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              movePlayerToTeam(
                                draftData.team1[idx],
                                "team2"
                              )
                            }
                            className="p-1 hover:bg-slate-700 rounded text-xs text-slate-300"
                            title="Move to Dire"
                          >
                            Swap
                          </button>
                          <button
                            onClick={() =>
                              movePlayerToTeam(
                                draftData.team1[idx],
                                "available"
                              )
                            }
                            className="p-1 hover:bg-slate-700 rounded text-xs text-red-400"
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs sm:text-sm">
                        Empty slot {idx + 1}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dire Team */}
            <div className="bg-linear-to-br from-red-900/40 to-slate-900/60 rounded-xl p-4 sm:p-6 border-2 border-red-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-red-400">
                  Dire
                </h3>
                <div className="text-sm text-slate-400">
                  {draftData.team2.length}/5 Players
                </div>
              </div>

              {/* Captain Selection */}
              <div className="mb-4">
                <label className="text-xs text-red-400/70 uppercase font-bold tracking-wider mb-1 block">
                  Captain
                </label>
                <input
                  type="text"
                  placeholder="Enter Captain Name"
                  value={draftData.captain2}
                  onChange={(e) => setCaptain(e.target.value, 2)}
                  className="w-full p-2 bg-slate-900/50 text-white rounded border border-red-500/30 focus:border-red-500 focus:outline-none text-sm"
                />
              </div>

              {/* Team Slots */}
              <div className="space-y-2">
                {[...Array(4)].map((_, idx) => (
                  <div
                    key={idx}
                    className="h-10 sm:h-12 bg-slate-900/40 rounded border border-red-500/20 flex items-center px-3 sm:px-4"
                  >
                    {draftData.team2[idx] ? (
                      <div className="flex items-center justify-between w-full group">
                        <span className="text-white font-medium text-sm sm:text-base">
                          {draftData.team2[idx]}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              movePlayerToTeam(
                                draftData.team2[idx],
                                "team1"
                              )
                            }
                            className="p-1 hover:bg-slate-700 rounded text-xs text-slate-300"
                            title="Move to Radiant"
                          >
                            Swap
                          </button>
                          <button
                            onClick={() =>
                              movePlayerToTeam(
                                draftData.team2[idx],
                                "available"
                              )
                            }
                            className="p-1 hover:bg-slate-700 rounded text-xs text-red-400"
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs sm:text-sm">
                        Empty slot {idx + 1}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Available Players Pool */}
          <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              Available Players ({draftData.availablePlayers.length})
            </h3>

            {draftData.availablePlayers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  No players available. Add players to start drafting!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {draftData.availablePlayers.map((player, idx) => (
                  <div
                    key={idx}
                    className="group p-3 sm:p-4 bg-slate-900/50 hover:bg-slate-800/70 rounded-lg border border-slate-700 hover:border-green-500 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col gap-2">
                      <span className="text-white font-medium text-sm sm:text-base truncate">
                        {player}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            movePlayerToTeam(player, "team1")
                          }
                          className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                          disabled={draftData.team1.length >= 4}
                        >
                          Radiant
                        </button>
                        <button
                          onClick={() =>
                            movePlayerToTeam(player, "team2")
                          }
                          className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                          disabled={draftData.team2.length >= 4}
                        >
                          Dire
                        </button>
                        <button
                          onClick={() => removePlayer(player)}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function X({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 18 12" />
    </svg>
  );
}
