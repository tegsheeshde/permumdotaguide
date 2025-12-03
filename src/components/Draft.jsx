import { useState, useEffect, useRef } from "react";
import { Swords, Users, Trash2, RotateCcw, UserPlus, Award, Download, MessageCircle, X as XIcon } from "lucide-react";
import { db } from "../firebase";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import * as htmlToImage from 'html-to-image';
import Chat from "./Chat";

export default function Draft() {
  // Draft Picker State
  const [draftData, setDraftData] = useState({
    captain1: "",
    captain2: "",
    team1: [],
    team2: [],
    availablePlayers: [],
    draftOrder: [], // Array of {playerName, team, pickNumber}
  });
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  // Chat overlay state
  const [showChat, setShowChat] = useState(false);
  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || ""
  );
  const [showNameModal, setShowNameModal] = useState(false);

  // Registered players state
  const [registeredPlayers, setRegisteredPlayers] = useState({});
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  // Ref for capturing the draft area
  const draftAreaRef = useRef(null);

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
            draftOrder: [],
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

  // Load registered players from Firebase
  useEffect(() => {
    const playersRef = doc(db, "app-data", "players");

    const unsubscribe = onSnapshot(
      playersRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setRegisteredPlayers(docSnap.data().list || {});
        } else {
          setRegisteredPlayers({});
        }
        setIsLoadingPlayers(false);
      },
      (error) => {
        console.error("Error loading registered players:", error);
        setIsLoadingPlayers(false);
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

    // Check if player is already drafted
    const existingDraft = updates.draftOrder?.find(d => d.playerName === playerName);
    console.log('aaaaa',playerName);

    // Remove from all locations
    updates.availablePlayers = updates.availablePlayers.filter(
      (p) => p !== playerName
    );
    updates.team1 = updates.team1.filter((p) => p !== playerName);
    updates.team2 = updates.team2.filter((p) => p !== playerName);

    // Add to target team if not full
    if (toTeam === "team1" && updates.team1.length < 4) {
      updates.team1.push(playerName);
      // Add to draft order if not already there
      if (!existingDraft) {
        const pickNumber = (updates.draftOrder?.length || 0) + 1;
        updates.draftOrder = [...(updates.draftOrder || []), { playerName, team: "team1", pickNumber }];
      } else {
        // Update team in draft order
        updates.draftOrder = updates.draftOrder.map(d =>
          d.playerName === playerName ? { ...d, team: "team1" } : d
        );
      }
    } else if (toTeam === "team2" && updates.team2.length < 4) {
      updates.team2.push(playerName);
      // Add to draft order if not already there
      if (!existingDraft) {
        const pickNumber = (updates.draftOrder?.length || 0) + 1;
        updates.draftOrder = [...(updates.draftOrder || []), { playerName, team: "team2", pickNumber }];
      } else {
        // Update team in draft order
        updates.draftOrder = updates.draftOrder.map(d =>
          d.playerName === playerName ? { ...d, team: "team2" } : d
        );
      }
    } else if (toTeam === "available") {
      updates.availablePlayers.push(playerName);
      // Remove from draft order
      updates.draftOrder = (updates.draftOrder || []).filter(d => d.playerName !== playerName);
    } else {
      // If team is full, return player to available
      updates.availablePlayers.push(playerName);
      // Remove from draft order
      updates.draftOrder = (updates.draftOrder || []).filter(d => d.playerName !== playerName);
    }

    updateDraft(updates);
  };

  const setCaptain = (captainName, team) => {
    const updates = { ...draftData };

    if (team === 1) {
      // If clearing captain, add them back to team1
      if (!captainName && draftData.captain1) {
        if (updates.team1.length < 4) {
          updates.team1.push(draftData.captain1);
        } else {
          updates.availablePlayers.push(draftData.captain1);
        }
      }
      // Remove the player from team1 if they're in it
      updates.team1 = updates.team1.filter((p) => p !== captainName);
      updates.captain1 = captainName;
    } else {
      // If clearing captain, add them back to team2
      if (!captainName && draftData.captain2) {
        if (updates.team2.length < 4) {
          updates.team2.push(draftData.captain2);
        } else {
          updates.availablePlayers.push(draftData.captain2);
        }
      }
      // Remove the player from team2 if they're in it
      updates.team2 = updates.team2.filter((p) => p !== captainName);
      updates.captain2 = captainName;
    }

    updateDraft(updates);
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
      draftOrder: [],
    };
    updateDraft(reset);
  };

  // Helper function to get draft pick number for a player
  const getDraftPickNumber = (playerName) => {
    const draft = draftData.draftOrder?.find(d => d.playerName === playerName);
    return draft?.pickNumber;
  };

  // Download draft as image
  const handleDownloadDraft = async () => {
    if (!draftAreaRef.current) return;

    try {
      // First render to ensure fonts are loaded
      await htmlToImage.toPng(draftAreaRef.current);

      // Second render for actual download (better quality)
      const dataUrl = await htmlToImage.toPng(draftAreaRef.current, {
        quality: 1,
        pixelRatio: 2, // High quality (2x)
        backgroundColor: '#0f172a', // slate-900 background
        cacheBust: true,
        skipFonts: false, // Include fonts
      });

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `dota2-draft-${timestamp}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading draft:', error);
      alert('Failed to download draft image. Please try again.');
    }
  };

  return (
    <div className="space-y-6 px-2 sm:px-0 relative">
      {/* Draft Header */}
      <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Swords className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Captain's Draft</h2>
              <p className="text-slate-400 text-sm">Pick captains and draft your teams</p>
            </div>
          </div>
          <button
            onClick={handleDownloadDraft}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            title="Download draft as image"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {isLoadingDraft ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 mt-4">Loading draft...</p>
        </div>
      ) : (
        <>
          {/* 3-Column Grid: Radiant | All Players | Dire */}
          <div ref={draftAreaRef} className="grid grid-cols-1 lg:grid-cols-3 gap-4 backdrop-blur-sm ">
            {/* Radiant Team */}
            <div className="bg-linear-to-br from-green-900/40 to-slate-900/60 rounded-xl p-4 border-2 border-green-500/30">
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-green-400">Radiant</h3>
                  <div className="text-xs text-slate-400">
                    {(draftData.captain1 ? 1 : 0) + draftData.team1.length}/5
                  </div>
                </div>
                <div className="text-xs text-green-300 font-medium mt-1">
                  Total MMR: {(() => {
                    let totalMMR = 0;

                    // Add captain MMR
                    if (draftData.captain1) {
                      const captainStats = registeredPlayers[draftData.captain1];
                      if (captainStats?.mmr) {
                        const mmr = typeof captainStats.mmr === 'number'
                          ? captainStats.mmr
                          : parseInt(captainStats.mmr, 10);
                        if (!isNaN(mmr) && mmr > 0) {
                          totalMMR += mmr;
                        }
                      }
                    }

                    // Add team players MMR
                    draftData.team1.forEach((playerName) => {
                      const player = registeredPlayers[playerName];
                      if (player?.mmr) {
                        const mmr = typeof player.mmr === 'number'
                          ? player.mmr
                          : parseInt(player.mmr, 10);
                        if (!isNaN(mmr) && mmr > 0) {
                          totalMMR += mmr;
                        }
                      }
                    });

                    return totalMMR.toLocaleString();
                  })()}
                </div>
              </div>

              {/* Captain */}
              <div className="mb-3">
                <label className="text-xs text-green-400/70 uppercase font-bold mb-1 flex items-center gap-2">
                  <Award className="w-3 h-3" />
                  Captain
                </label>
                {draftData.captain1 ? (
                  <div className="h-10 bg-slate-900/50 rounded border border-green-500/30 flex items-center px-3 justify-between group">
                    <span className="text-white font-medium text-sm">{draftData.captain1}</span>
                    <button
                      onClick={() => setCaptain("", 1)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded text-xs text-red-400 transition-opacity"
                      title="Remove captain"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 p-2 bg-slate-900/30 rounded border border-green-500/20">
                    Select a captain from drafted players below
                  </div>
                )}
              </div>

              {/* Team Slots */}
              <div className="space-y-2">
                {[...Array(4)].map((_, idx) => {
                  const playerName = draftData.team1[idx];
                  const pickNumber = playerName ? getDraftPickNumber(playerName) : null;
                  const playerStats = playerName ? registeredPlayers[playerName] : null;
                  return (
                    <div
                      key={idx}
                      className="min-h-10 bg-slate-900/40 rounded border border-green-500/20 flex items-center px-3 py-2"
                    >
                      {playerName ? (
                        <div className="flex items-center justify-between w-full group">
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium text-sm">{playerName}</span>
                              {pickNumber && (
                                <span className="text-green-400/60 text-xs font-semibold">
                                  #{pickNumber}
                                </span>
                              )}
                              {draftData.captain1 === playerName && (
                                <Award className="w-3 h-3 text-yellow-400" title="Captain" />
                              )}
                            </div>
                            {playerStats && (
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                {playerStats.mmr && (
                                  <span className="text-green-300">
                                    {typeof playerStats.mmr === 'number'
                                      ? playerStats.mmr.toLocaleString()
                                      : parseInt(playerStats.mmr, 10).toLocaleString()} MMR
                                  </span>
                                )}
                                {playerStats.role && (
                                  <span>• {playerStats.role.charAt(0).toUpperCase() + playerStats.role.slice(1)}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {draftData.captain1 !== playerName && (
                              <button
                                onClick={() => setCaptain(playerName, 1)}
                                className="p-1 hover:bg-green-700 rounded text-xs text-yellow-400"
                                title="Make captain"
                              >
                                <Award className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => movePlayerToTeam(playerName, "team2")}
                              className="p-1 hover:bg-slate-700 rounded text-xs text-slate-300"
                              title="Move to Dire"
                            >
                              →
                            </button>
                            <button
                              onClick={() => movePlayerToTeam(playerName, "available")}
                              className="p-1 hover:bg-slate-700 rounded text-xs text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-xs">Slot {idx + 1}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All Players - Center Column */}
            <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>
                    All Players <span className="text-purple-400">({draftData.team1.length + draftData.team2.length} drafted / {Object.keys(registeredPlayers).length + draftData.availablePlayers.filter(p => !registeredPlayers[p]).length} total)</span>
                  </span>
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddPlayer(!showAddPlayer)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors"
                  >
                    <UserPlus className="w-3 h-3" />
                    Add
                  </button>
                  <button
                    onClick={resetDraft}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Add Player Form */}
              {showAddPlayer && (
                <div className="mb-3 p-2 bg-slate-900/50 rounded border border-slate-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Player Name"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addPlayerToDraft()}
                      className="flex-1 p-1.5 bg-slate-800 text-white rounded border border-slate-600 focus:border-purple-500 focus:outline-none text-xs"
                      autoFocus
                    />
                    <button
                      onClick={addPlayerToDraft}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded font-medium text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {isLoadingPlayers ? (
                <div className="text-center py-8">
                  <div className="inline-block w-6 h-6 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-400 mt-2 text-xs">Loading...</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                  {/* Registered players */}
                  {Object.entries(registeredPlayers)
                    .sort((a, b) => (b[1].mmr || 0) - (a[1].mmr || 0))
                    .map(([playerName, stats]) => {
                      const getRankName = (rankTier) => {
                        if (!rankTier) return "Unranked";
                        if (typeof rankTier === "string") {
                          return rankTier.charAt(0).toUpperCase() + rankTier.slice(1);
                        }
                        const ranks = ["Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine", "Immortal"];
                        const tier = Math.floor(rankTier / 10);
                        const star = rankTier % 10;
                        if (tier === 8) return `Immortal ${star > 0 ? `#${star}` : ""}`;
                        return `${ranks[tier - 1]} ${star}`;
                      };

                      const isInTeam1 = draftData.team1.includes(playerName);
                      const isInTeam2 = draftData.team2.includes(playerName);
                      const isCaptain1 = draftData.captain1 === playerName;
                      const isCaptain2 = draftData.captain2 === playerName;
                      const isDrafted = isInTeam1 || isInTeam2 || isCaptain1 || isCaptain2;
                      const pickNumber = isDrafted ? getDraftPickNumber(playerName) : null;

                      return (
                        <div
                          key={playerName}
                          className={`p-2 rounded border transition-all ${
                            isDrafted
                              ? "bg-slate-900/20 border-slate-700/30 opacity-50"
                              : "bg-slate-900/60 border-slate-700/50 hover:border-cyan-500/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {stats.avatar ? (
                              <img
                                src={stats.avatar}
                                alt={playerName}
                                className="w-8 h-8 rounded-full border border-cyan-600/50"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                                {playerName.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-white font-medium text-xs truncate">{playerName}</span>
                                {isDrafted && (
                                  <>
                                    <span className="text-[10px] px-1 py-0.5 bg-purple-600/20 text-purple-400 border border-purple-600/40 rounded">
                                      {(isInTeam1 || isCaptain1) ? "R" : "D"}
                                    </span>
                                    {(isCaptain1 || isCaptain2) && (
                                      <Award className="w-3 h-3 text-yellow-400" title="Captain" />
                                    )}
                                    {pickNumber && (
                                      <span className="text-[10px] px-1 py-0.5 bg-cyan-600/20 text-cyan-400 border border-cyan-600/40 rounded font-semibold">
                                        #{pickNumber}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <span className="text-yellow-400 font-medium">{getRankName(stats.rank)}</span>
                                {stats.mmr > 0 && <span>• {stats.mmr.toLocaleString()}</span>}
                                {stats.role && <span>• {stats.role.charAt(0).toUpperCase() + stats.role.slice(1)}</span>}
                              </div>
                            </div>

                            {!isDrafted ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    if (!draftData.availablePlayers.includes(playerName)) {
                                      updateDraft({ availablePlayers: [...draftData.availablePlayers, playerName] });
                                    }
                                    setTimeout(() => movePlayerToTeam(playerName, "team1"), 100);
                                  }}
                                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-medium transition-colors disabled:opacity-40"
                                  disabled={draftData.team1.length >= 4}
                                  title="Add to Radiant"
                                >
                                  R
                                </button>
                                <button
                                  onClick={() => {
                                    if (!draftData.availablePlayers.includes(playerName)) {
                                      updateDraft({ availablePlayers: [...draftData.availablePlayers, playerName] });
                                    }
                                    setTimeout(() => movePlayerToTeam(playerName, "team2"), 100);
                                  }}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-medium transition-colors disabled:opacity-40"
                                  disabled={draftData.team2.length >= 4}
                                  title="Add to Dire"
                                >
                                  D
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => movePlayerToTeam(playerName, "available")}
                                className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[10px] font-medium transition-colors"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {/* Non-registered players */}
                  {draftData.availablePlayers
                    .filter(player => !registeredPlayers[player])
                    .map((player) => (
                      <div
                        key={player}
                        className="p-2 rounded border bg-slate-900/60 border-slate-700/50 hover:border-cyan-500/50 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                            {player.charAt(0).toUpperCase()}
                          </div>
                          <span className="flex-1 text-white font-medium text-xs">{player}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => movePlayerToTeam(player, "team1")}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-medium transition-colors disabled:opacity-40"
                              disabled={draftData.team1.length >= 4}
                            >
                              R
                            </button>
                            <button
                              onClick={() => movePlayerToTeam(player, "team2")}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-medium transition-colors disabled:opacity-40"
                              disabled={draftData.team2.length >= 4}
                            >
                              D
                            </button>
                            <button
                              onClick={() => removePlayer(player)}
                              className="px-1.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[10px] transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* Empty state */}
                  {Object.keys(registeredPlayers).length === 0 && draftData.availablePlayers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 text-xs">No players</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dire Team */}
            <div className="bg-linear-to-br from-red-900/40 to-slate-900/60 rounded-xl p-4 border-2 border-red-500/30">
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-red-400">Dire</h3>
                  <div className="text-xs text-slate-400">
                    {(draftData.captain2 ? 1 : 0) + draftData.team2.length}/5
                  </div>
                </div>
                <div className="text-xs text-red-300 font-medium mt-1">
                  Total MMR: {(() => {
                    let totalMMR = 0;

                    // Add captain MMR
                    if (draftData.captain2) {
                      const captainStats = registeredPlayers[draftData.captain2];
                      if (captainStats?.mmr) {
                        const mmr = typeof captainStats.mmr === 'number'
                          ? captainStats.mmr
                          : parseInt(captainStats.mmr, 10);
                        if (!isNaN(mmr) && mmr > 0) {
                          totalMMR += mmr;
                        }
                      }
                    }

                    // Add team players MMR
                    draftData.team2.forEach((playerName) => {
                      const player = registeredPlayers[playerName];
                      if (player?.mmr) {
                        const mmr = typeof player.mmr === 'number'
                          ? player.mmr
                          : parseInt(player.mmr, 10);
                        if (!isNaN(mmr) && mmr > 0) {
                          totalMMR += mmr;
                        }
                      }
                    });

                    return totalMMR.toLocaleString();
                  })()}
                </div>
              </div>

              {/* Captain */}
              <div className="mb-3">
                <label className="text-xs text-red-400/70 uppercase font-bold mb-1 flex items-center gap-2">
                  <Award className="w-3 h-3" />
                  Captain
                </label>
                {draftData.captain2 ? (
                  <div className="h-10 bg-slate-900/50 rounded border border-red-500/30 flex items-center px-3 justify-between group">
                    <span className="text-white font-medium text-sm">{draftData.captain2}</span>
                    <button
                      onClick={() => setCaptain("", 2)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded text-xs text-red-400 transition-opacity"
                      title="Remove captain"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 p-2 bg-slate-900/30 rounded border border-red-500/20">
                    Select a captain from drafted players below
                  </div>
                )}
              </div>

              {/* Team Slots */}
              <div className="space-y-2">
                {[...Array(4)].map((_, idx) => {
                  const playerName = draftData.team2[idx];
                  const pickNumber = playerName ? getDraftPickNumber(playerName) : null;
                  const playerStats = playerName ? registeredPlayers[playerName] : null;
                  return (
                    <div
                      key={idx}
                      className="min-h-10 bg-slate-900/40 rounded border border-red-500/20 flex items-center px-3 py-2"
                    >
                      {playerName ? (
                        <div className="flex items-center justify-between w-full group">
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium text-sm">{playerName}</span>
                              {pickNumber && (
                                <span className="text-red-400/60 text-xs font-semibold">
                                  #{pickNumber}
                                </span>
                              )}
                              {draftData.captain2 === playerName && (
                                <Award className="w-3 h-3 text-yellow-400" title="Captain" />
                              )}
                            </div>
                            {playerStats && (
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                {playerStats.mmr && (
                                  <span className="text-red-300">
                                    {typeof playerStats.mmr === 'number'
                                      ? playerStats.mmr.toLocaleString()
                                      : parseInt(playerStats.mmr, 10).toLocaleString()} MMR
                                  </span>
                                )}
                                {playerStats.role && (
                                  <span>• {playerStats.role.charAt(0).toUpperCase() + playerStats.role.slice(1)}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {draftData.captain2 !== playerName && (
                              <button
                                onClick={() => setCaptain(playerName, 2)}
                                className="p-1 hover:bg-red-700 rounded text-xs text-yellow-400"
                                title="Make captain"
                              >
                                <Award className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => movePlayerToTeam(playerName, "team1")}
                              className="p-1 hover:bg-slate-700 rounded text-xs text-slate-300"
                              title="Move to Radiant"
                            >
                              ←
                            </button>
                            <button
                              onClick={() => movePlayerToTeam(playerName, "available")}
                              className="p-1 hover:bg-slate-700 rounded text-xs text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-xs">Slot {idx + 1}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Floating Chat Button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          title="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Overlay */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 bg-black/30 backdrop-blur-xs">
          <div className="w-full sm:w-[450px] h-[600px] max-h-[90vh] bg-slate-900 rounded-xl shadow-2xl border-2 border-slate-700 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-bold text-white">Draft Chat</h3>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                title="Close chat"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <Chat userName={userName} setShowNameModal={setShowNameModal} />
            </div>
          </div>
        </div>
      )}

      {/* Name Modal for Chat */}
      {showNameModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full border-2 border-slate-700 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Welcome!
            </h2>
            <p className="text-slate-300 mb-6">
              Enter your name to chat Noob
            </p>
            <input
              type="text"
              placeholder="Your name"
              defaultValue={userName}
              className="w-full p-3 sm:p-4 bg-slate-900 text-white rounded-lg border-2 border-slate-600 focus:border-green-500 focus:outline-none mb-4 text-base sm:text-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const name = e.target.value.trim();
                  if (name) {
                    setUserName(name);
                    localStorage.setItem("userName", name);
                    setShowNameModal(false);
                  }
                }
              }}
              autoFocus
            />
            <button
              onClick={(e) => {
                const input = e.target.previousElementSibling;
                const name = input.value.trim();
                if (name) {
                  setUserName(name);
                  localStorage.setItem("userName", name);
                  setShowNameModal(false);
                }
              }}
              className="w-full py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors duration-200 text-base sm:text-lg"
            >
              Continue
            </button>
          </div>
        </div>
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
