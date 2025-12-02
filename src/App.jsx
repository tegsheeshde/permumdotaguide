import React, { useState, useEffect } from 'react';
import { Target, Map, Users, Zap, Brain, Trophy, Plus, BarChart3, BookOpen, Home, Swords, UserPlus, Trash2, RotateCcw, Calendar, Clock, Check, X } from 'lucide-react';
import { db } from './firebase';
import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';

const defaultPolls = [
  {
    id: 1,
    question: "Playing Dota 2 today?",
    options: ["Yes", "No"],
    votes: [
      { count: 12, voters: ['Player1', 'Player2', 'Gamer123'] },
      { count: 5, voters: ['NoobMaster', 'Support5'] }
    ]
  }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'guide', 'draft', or 'schedule'
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [showNameModal, setShowNameModal] = useState(!localStorage.getItem('userName'));

  const [polls, setPolls] = useState([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);

  // Load and sync polls from Firebase Firestore
  useEffect(() => {
    const pollsRef = doc(db, 'app-data', 'polls');

    // Set up real-time listener
    const unsubscribe = onSnapshot(pollsRef, (docSnap) => {
      if (docSnap.exists()) {
        setPolls(docSnap.data().list || []);
      } else {
        // Initialize with default polls if document doesn't exist
        setDoc(pollsRef, { list: defaultPolls });
        setPolls(defaultPolls);
      }
      setIsLoadingPolls(false);
    }, (error) => {
      console.error('Error loading polls:', error);
      // Fallback to localStorage if Firebase fails
      const savedPolls = localStorage.getItem('polls');
      setPolls(savedPolls ? JSON.parse(savedPolls) : defaultPolls);
      setIsLoadingPolls(false);
    });

    return () => unsubscribe();
  }, []);

  // Backup to localStorage
  useEffect(() => {
    if (polls.length > 0) {
      localStorage.setItem('polls', JSON.stringify(polls));
    }
  }, [polls]);

  const skillTracks = [
    {
      id: 'mechanics',
      title: 'Mechanics & Execution',
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      practices: [
        'Last-hitting practice: 50+ CS in 10 min (custom lobby)',
        'Deny practice: Focus on denying every 4th creep',
        'Combos: Practice hero-specific combos in demo mode',
        'Camera control: Use edge pan + control groups efficiently',
        'Quick buy & hotkeys: Memorize item slots (1-6)',
        'Animation canceling: Master attack & cast animations'
      ],
      resources: [
        'Watch your replays at 0.5x speed for mechanical mistakes',
        'Use the demo hero feature to practice combos',
        'Try "Dota 2 Last Hit Trainer" custom game'
      ]
    },
    {
      id: 'map',
      title: 'Map Awareness & Vision',
      icon: Map,
      color: 'from-green-500 to-emerald-500',
      practices: [
        'Minimap glance: Look every 3-5 seconds (set timer)',
        'Ward spots: Learn all meta ward positions',
        'Enemy movements: Track enemy heroes on minimap',
        'Smoke timings: Note when smokes are available',
        'Roshan timer: Always track Aegis timing',
        'TP reactions: Keep TP ready, watch for dives'
      ],
      resources: [
        'Study high MMR player minimap camera movements',
        'Use a minimap metronome while playing',
        'Watch pro replays focusing only on their ward placements'
      ]
    },
    {
      id: 'game-sense',
      title: 'Game Sense & Decision Making',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      practices: [
        'Power spikes: Know when your hero is strongest',
        'Itemization: Adapt builds to enemy lineup',
        'Objective priority: Towers > Kills in most cases',
        'When to farm vs fight: Read the game state',
        'Buyback discipline: Save for critical moments',
        'Risk assessment: When to trade, when to back'
      ],
      resources: [
        'Watch replays asking "why" for every decision',
        'Study DotaBuff meta trends for your heroes',
        'Review pro player item builds and adapt them'
      ]
    },
    {
      id: 'roles',
      title: 'Role Mastery',
      icon: Users,
      color: 'from-orange-500 to-red-500',
      practices: [
        'Pick 2-3 heroes per role to master',
        'Learn role-specific timings (stacks, pulls, rotations)',
        'Understand your win condition as that role',
        'Study matchups: Know your counters & advantages',
        'Position 1-2: Farm patterns & space creation',
        'Position 3-5: Map control & enabling carries'
      ],
      resources: [
        'Watch role-specific guides from top players',
        'Join role-specific Discord communities',
        'Analyze your hero\'s win rate by matchup'
      ]
    },
    {
      id: 'mental',
      title: 'Mental Game & Consistency',
      icon: Target,
      color: 'from-yellow-500 to-amber-500',
      practices: [
        'Set 1-2 specific goals per session (not just "win")',
        'Review 1 replay per day - wins AND losses',
        'Mute toxicity immediately, use pings',
        'Take breaks after 2-3 games to reset',
        'Focus on YOUR play, not teammates\' mistakes',
        'Track your improvement (CS, KDA, impact)'
      ],
      resources: [
        'Keep a Dota journal noting what you learned',
        'Use Dota Plus or tracking tools to measure progress',
        'Watch BSJ or GameLeap mental game guides'
      ]
    },
    {
      id: 'learning',
      title: 'Learning Resources',
      icon: Trophy,
      color: 'from-indigo-500 to-violet-500',
      practices: [
        'Watch EL`Chapos game per week (player perspective)',
        'Follow patch notes and adapt quickly',
        'Study meta shifts on DotaBuff/OpenDota',
        'Join coaching Discord servers',
        'Watch educational content (BSJ, Jenkins, Gameleap)',
        'Analyze immortal replays of your heroes'
      ],
      resources: [
        'YouTube: BananaSlamJamma (BSJ), Jenkins, DotaCinema',
        'Twitch: Watch high MMR players for your role',
        'Reddit: r/TrueDoTA2 for serious discussions',
        'DotaBuff.com for stats and meta analysis'
      ]
    }
  ];

  const handleVote = async (pollId, optionIndex) => {
    if (!userName) {
      setShowNameModal(true);
      return;
    }

    const updatedPolls = polls.map(poll => {
      if (poll.id === pollId) {
        // Check if user already voted in this poll
        const hasVoted = poll.votes.some(vote => vote.voters.includes(userName));
        if (hasVoted) {
          return poll;
        }

        const newVotes = [...poll.votes];
        newVotes[optionIndex] = {
          count: newVotes[optionIndex].count + 1,
          voters: [...newVotes[optionIndex].voters, userName]
        };
        return { ...poll, votes: newVotes };
      }
      return poll;
    });

    // Update Firebase
    try {
      const pollsRef = doc(db, 'app-data', 'polls');
      await updateDoc(pollsRef, { list: updatedPolls });
    } catch (error) {
      console.error('Error updating vote:', error);
      // Fallback to local state if Firebase fails
      setPolls(updatedPolls);
    }
  };

  const handleNameSubmit = (name) => {
    if (name.trim()) {
      setUserName(name.trim());
      localStorage.setItem('userName', name.trim());
      setShowNameModal(false);
    }
  };

  const handleCreatePoll = async () => {
    if (newPoll.question.trim() && newPoll.options.every(opt => opt.trim())) {
      const filteredOptions = newPoll.options.filter(opt => opt.trim());
      const poll = {
        id: Date.now(),
        question: newPoll.question,
        options: filteredOptions,
        votes: filteredOptions.map(() => ({ count: 0, voters: [] }))
      };
      const updatedPolls = [...polls, poll];

      // Update Firebase
      try {
        const pollsRef = doc(db, 'app-data', 'polls');
        await updateDoc(pollsRef, { list: updatedPolls });
      } catch (error) {
        console.error('Error creating poll:', error);
        // Fallback to local state if Firebase fails
        setPolls(updatedPolls);
      }

      setNewPoll({ question: '', options: ['', ''] });
      setShowCreatePoll(false);
    }
  };

  const addOption = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
  };

  // Draft Picker State
  const [draftData, setDraftData] = useState({
    captain1: '',
    captain2: '',
    team1: [],
    team2: [],
    availablePlayers: []
  });
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  // Load and sync draft data from Firebase
  useEffect(() => {
    const draftRef = doc(db, 'app-data', 'draft');

    const unsubscribe = onSnapshot(draftRef, (docSnap) => {
      if (docSnap.exists()) {
        setDraftData(docSnap.data());
      } else {
        const initialDraft = {
          captain1: '',
          captain2: '',
          team1: [],
          team2: [],
          availablePlayers: []
        };
        setDoc(draftRef, initialDraft);
        setDraftData(initialDraft);
      }
      setIsLoadingDraft(false);
    }, (error) => {
      console.error('Error loading draft:', error);
      setIsLoadingDraft(false);
    });

    return () => unsubscribe();
  }, []);

  const updateDraft = async (updates) => {
    try {
      const draftRef = doc(db, 'app-data', 'draft');
      await updateDoc(draftRef, updates);
    } catch (error) {
      console.error('Error updating draft:', error);
    }
  };

  const addPlayerToDraft = () => {
    if (newPlayerName.trim()) {
      const updatedPlayers = [...draftData.availablePlayers, newPlayerName.trim()];
      updateDraft({ availablePlayers: updatedPlayers });
      setNewPlayerName('');
      setShowAddPlayer(false);
    }
  };

  const movePlayerToTeam = (playerName, toTeam) => {
    const updates = { ...draftData };

    // Remove from all locations
    updates.availablePlayers = updates.availablePlayers.filter(p => p !== playerName);
    updates.team1 = updates.team1.filter(p => p !== playerName);
    updates.team2 = updates.team2.filter(p => p !== playerName);

    // Add to target team if not full
    if (toTeam === 'team1' && updates.team1.length < 4) {
      updates.team1.push(playerName);
    } else if (toTeam === 'team2' && updates.team2.length < 4) {
      updates.team2.push(playerName);
    } else if (toTeam === 'available') {
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
      availablePlayers: draftData.availablePlayers.filter(p => p !== playerName)
    };
    updateDraft(updates);
  };

  const resetDraft = () => {
    const reset = {
      captain1: '',
      captain2: '',
      team1: [],
      team2: [],
      availablePlayers: draftData.availablePlayers
    };
    updateDraft(reset);
  };

  // Schedule Maker State
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  const [scheduleData, setScheduleData] = useState({
    availability: {} // { playerName: { 'Monday-08:00': true, ... } }
  });
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);

  // Load and sync schedule data from Firebase
  useEffect(() => {
    const scheduleRef = doc(db, 'app-data', 'schedule');

    const unsubscribe = onSnapshot(scheduleRef, (docSnap) => {
      if (docSnap.exists()) {
        setScheduleData(docSnap.data());
      } else {
        const initialSchedule = { availability: {} };
        setDoc(scheduleRef, initialSchedule);
        setScheduleData(initialSchedule);
      }
      setIsLoadingSchedule(false);
    }, (error) => {
      console.error('Error loading schedule:', error);
      setIsLoadingSchedule(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSchedule = async (updates) => {
    try {
      const scheduleRef = doc(db, 'app-data', 'schedule');
      await updateDoc(scheduleRef, updates);
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

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
        [slotKey]: !userAvailability[slotKey]
      }
    };

    updateSchedule({ availability: newAvailability });
  };

  const clearMyAvailability = () => {
    if (!userName) return;

    const newAvailability = { ...scheduleData.availability };
    delete newAvailability[userName];
    updateSchedule({ availability: newAvailability });
  };

  // Calculate best time slots
  const getBestTimeSlots = () => {
    const slotCounts = {};
    const slotPlayers = {};

    // Count availability for each slot
    Object.entries(scheduleData.availability).forEach(([player, slots]) => {
      Object.entries(slots).forEach(([slotKey, isAvailable]) => {
        if (isAvailable) {
          slotCounts[slotKey] = (slotCounts[slotKey] || 0) + 1;
          if (!slotPlayers[slotKey]) slotPlayers[slotKey] = [];
          slotPlayers[slotKey].push(player);
        }
      });
    });

    // Sort by count (descending)
    const sorted = Object.entries(slotCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([slot, count]) => ({
        slot,
        count,
        players: slotPlayers[slot]
      }));

    return sorted;
  };

  return (
    <div className="min-h-screen relative p-4 sm:p-6 lg:p-8">
      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}dotabg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-linear-to-br from-slate-950/25 via-slate-900/35 to-slate-950/30"></div>
      </div>

      {/* Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full border-2 border-slate-700 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome!</h2>
            <p className="text-slate-300 mb-6">Enter your name to participate in polls</p>
            <input
              type="text"
              placeholder="Your name (e.g., ProPlayer123)"
              className="w-full p-3 sm:p-4 bg-slate-900 text-white rounded-lg border-2 border-slate-600 focus:border-green-500 focus:outline-none mb-4 text-base sm:text-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNameSubmit(e.target.value);
                }
              }}
              autoFocus
            />
            <button
              onClick={(e) => {
                const input = e.target.previousElementSibling;
                handleNameSubmit(input.value);
              }}
              className="w-full py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors duration-200 text-base sm:text-lg"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-6 sm:mb-8 pt-4 sm:pt-8 px-4">
          <div className="relative inline-block">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-purple-500 to-pink-500 mb-3 sm:mb-4 leading-tight drop-shadow-[0_0_30px_rgba(139,92,246,0.5)] animate-pulse-slow">
              Permum Suga Dotachid Skill Improvement
            </h1>
            <div className="absolute inset-0 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-linear-to-r from-blue-500 via-purple-600 to-pink-600 bg-clip-text text-transparent blur-2xl opacity-50 -z-10">
              Permum Suga Dotachid Skill Improvement
            </div>
          </div>
          <p className="text-white text-base sm:text-lg mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] font-medium">Choose a focus area to level up your game</p>

          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setCurrentPage('home')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 ${
                currentPage === 'home'
                  ? 'bg-green-600 text-white shadow-lg scale-105'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
              }`}
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Polls</span>
            </button>
            <button
              onClick={() => setCurrentPage('draft')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 ${
                currentPage === 'draft'
                  ? 'bg-purple-600 text-white shadow-lg scale-105'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
              }`}
            >
              <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Draft</span>
            </button>
            <button
              onClick={() => setCurrentPage('schedule')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 ${
                currentPage === 'schedule'
                  ? 'bg-orange-600 text-white shadow-lg scale-105'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Schedule</span>
            </button>
            <button
              onClick={() => setCurrentPage('guide')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 ${
                currentPage === 'guide'
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Guide</span>
            </button>
          </div>
        </div>

        {/* Home Page - Polls */}
        {currentPage === 'home' && (
          <>
            {/* Polls Section */}
            <div className="mb-8 sm:mb-12 bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 border-2 border-slate-700/50 mx-2 sm:mx-0">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 shrink-0" />
                  <span>Community Polls</span>
                </h3>
                <button
                  onClick={() => setShowCreatePoll(!showCreatePoll)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Create Poll</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>

              {/* Create Poll Form */}
              {showCreatePoll && (
                <div className="mb-6 p-4 sm:p-6 bg-slate-900/50 rounded-lg border border-slate-700">
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-4">Create New Poll</h4>
                  <input
                    type="text"
                    placeholder="Enter your question (e.g., Playing Dota 2 today?)"
                    value={newPoll.question}
                    onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                    className="w-full p-3 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none mb-4 text-sm sm:text-base"
                  />
                  <div className="space-y-2 mb-4">
                    {newPoll.options.map((option, idx) => (
                      <input
                        key={idx}
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newPoll.options];
                          newOptions[idx] = e.target.value;
                          setNewPoll({ ...newPoll, options: newOptions });
                        }}
                        className="w-full p-2 sm:p-3 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none text-sm sm:text-base"
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={addOption}
                      className="px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200 text-sm sm:text-base"
                    >
                      Add Option
                    </button>
                    <button
                      onClick={handleCreatePoll}
                      className="px-4 sm:px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-semibold text-sm sm:text-base"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowCreatePoll(false);
                        setNewPoll({ question: '', options: ['', ''] });
                      }}
                      className="px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200 text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Polls List */}
              {isLoadingPolls ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading polls...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                {polls.map(poll => {
                  const totalVotes = poll.votes.reduce((a, b) => a.count + b.count, 0);
                  const hasVoted = poll.votes.some(vote => vote.voters.includes(userName));

                  return (
                    <div key={poll.id} className="p-4 sm:p-6 bg-slate-900/50 rounded-lg border border-slate-700">
                      <h4 className="text-base sm:text-lg font-semibold text-white mb-4">{poll.question}</h4>
                      <div className="space-y-3">
                        {poll.options.map((option, idx) => {
                          const voteData = poll.votes[idx];
                          const percentage = totalVotes > 0 ? (voteData.count / totalVotes * 100).toFixed(0) : 0;
                          return (
                            <div key={idx}>
                              <button
                                onClick={() => handleVote(poll.id, idx)}
                                disabled={hasVoted}
                                className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                                  hasVoted
                                    ? 'border-slate-600 cursor-not-allowed'
                                    : 'border-slate-600 hover:border-green-500 hover:bg-slate-800/50 cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white font-medium text-sm sm:text-base">{option}</span>
                                  <span className="text-slate-400 text-xs sm:text-sm">{voteData.count} votes ({percentage}%)</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                                  <div
                                    className="bg-linear-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </button>
                              {/* Show voter names */}
                              {voteData.voters.length > 0 && (
                                <div className="mt-2 ml-3 sm:ml-4 flex flex-wrap gap-1.5">
                                  {voteData.voters.map((voter, vIdx) => (
                                    <span
                                      key={vIdx}
                                      className="inline-flex items-center px-2 py-1 bg-green-600/20 text-green-400 border border-green-600/30 rounded-md text-xs"
                                    >
                                      {voter}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-slate-400 text-xs sm:text-sm mt-4">
                        Total votes: {totalVotes} {hasVoted && `• You voted as ${userName}`}
                      </p>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          </>
        )}

        {/* Schedule Page - Auto Schedule Maker */}
        {currentPage === 'schedule' && (
          <div className="space-y-6 px-2 sm:px-0">
            {/* Header */}
            <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-orange-400" />
                    Auto Schedule Finder
                  </h2>
                  <p className="text-slate-400 text-sm sm:text-base mt-1">
                    Select your available times and we'll find the best match for everyone
                  </p>
                </div>
                {userName && (
                  <button
                    onClick={clearMyAvailability}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                  >
                    <X className="w-4 h-4" />
                    Clear My Times
                  </button>
                )}
              </div>

              {userName && (
                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 sm:p-4">
                  <p className="text-blue-300 text-sm sm:text-base">
                    <strong>Logged in as:</strong> {userName}
                  </p>
                  <p className="text-blue-400/70 text-xs sm:text-sm mt-1">
                    Click on time slots below to mark your availability
                  </p>
                </div>
              )}
            </div>

            {isLoadingSchedule ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading schedule...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Best Time Slots Recommendation */}
                {Object.keys(scheduleData.availability).length > 0 && (
                  <div className="bg-linear-to-br from-green-900/40 to-green-800/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-green-600/50">
                    <h3 className="text-lg sm:text-xl font-bold text-green-300 mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                      Recommended Time Slots
                    </h3>

                    {getBestTimeSlots().length === 0 ? (
                      <p className="text-slate-400 text-sm sm:text-base">
                        No common availability yet. Players need to select their available times.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {getBestTimeSlots().slice(0, 5).map((slot, idx) => {
                          const [day, time] = slot.slot.split('-');
                          const totalPlayers = Object.keys(scheduleData.availability).length;
                          const percentage = ((slot.count / totalPlayers) * 100).toFixed(0);

                          return (
                            <div
                              key={slot.slot}
                              className={`p-3 sm:p-4 rounded-lg border-2 ${
                                idx === 0
                                  ? 'bg-green-900/30 border-green-500'
                                  : 'bg-green-900/20 border-green-600/30'
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  {idx === 0 && (
                                    <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
                                  )}
                                  <div>
                                    <span className="text-white font-bold text-base sm:text-lg">
                                      {day} at {time}
                                    </span>
                                    {idx === 0 && (
                                      <span className="ml-2 text-xs sm:text-sm text-yellow-400 font-semibold">
                                        BEST MATCH
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-green-300 font-bold text-sm sm:text-base">
                                    {slot.count}/{totalPlayers} players
                                  </span>
                                  <span className="text-green-400/70 text-xs sm:text-sm ml-2">
                                    ({percentage}%)
                                  </span>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                                <div
                                  className="bg-linear-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>

                              {/* Available Players */}
                              <div className="flex flex-wrap gap-1.5">
                                {slot.players.map((player, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className="inline-flex items-center px-2 py-1 bg-green-600/20 text-green-300 border border-green-600/30 rounded-md text-xs"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    {player}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Time Grid */}
                <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                    Select Your Available Times
                  </h3>

                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      {/* Header Row */}
                      <div className="grid grid-cols-8 gap-1 mb-2">
                        <div className="p-2 text-slate-400 text-xs sm:text-sm font-semibold">Time</div>
                        {daysOfWeek.map((day) => (
                          <div key={day} className="p-2 text-center text-slate-300 text-xs sm:text-sm font-semibold">
                            {day.slice(0, 3)}
                          </div>
                        ))}
                      </div>

                      {/* Time Slots Grid */}
                      <div className="space-y-1">
                        {timeSlots.map((time) => (
                          <div key={time} className="grid grid-cols-8 gap-1">
                            <div className="p-2 sm:p-3 bg-slate-900/50 rounded text-slate-300 text-xs sm:text-sm font-medium flex items-center">
                              {time}
                            </div>
                            {daysOfWeek.map((day) => {
                              const slotKey = `${day}-${time}`;
                              const userAvailability = scheduleData.availability[userName] || {};
                              const isUserAvailable = userAvailability[slotKey];

                              // Count how many people are available at this slot
                              const availableCount = Object.values(scheduleData.availability).filter(
                                (userSlots) => userSlots[slotKey]
                              ).length;

                              return (
                                <button
                                  key={slotKey}
                                  onClick={() => toggleAvailability(day, time)}
                                  className={`p-2 sm:p-3 rounded transition-all text-xs sm:text-sm font-medium ${
                                    isUserAvailable
                                      ? 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-400'
                                      : availableCount > 0
                                      ? 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 border border-blue-600/30'
                                      : 'bg-slate-900/30 hover:bg-slate-800/50 text-slate-500 border border-slate-700'
                                  }`}
                                  title={
                                    availableCount > 0
                                      ? `${availableCount} player(s) available`
                                      : 'No one available'
                                  }
                                >
                                  {isUserAvailable ? (
                                    <Check className="w-3 h-3 sm:w-4 sm:h-4 mx-auto" />
                                  ) : (
                                    <span className="text-xs">{availableCount || ''}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-600 border-2 border-green-400 rounded flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-slate-300">Your availability</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-900/30 border border-blue-600/30 rounded flex items-center justify-center">
                        <span className="text-blue-300 text-xs">N</span>
                      </div>
                      <span className="text-slate-300">N other players available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-900/30 border border-slate-700 rounded"></div>
                      <span className="text-slate-300">No availability</span>
                    </div>
                  </div>
                </div>

                {/* Players Summary */}
                {Object.keys(scheduleData.availability).length > 0 && (
                  <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                      Players ({Object.keys(scheduleData.availability).length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(scheduleData.availability).map((player) => (
                        <span
                          key={player}
                          className="px-3 py-2 bg-slate-900/50 text-white rounded-lg border border-slate-700 text-sm"
                        >
                          {player}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Draft Page - Team Picker */}
        {currentPage === 'draft' && (
          <div className="space-y-6 px-2 sm:px-0">
            {/* Header Actions */}
            <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                  <Swords className="w-6 h-6 text-purple-400" />
                  Team Draft Picker
                </h2>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowAddPlayer(true)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Player</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                  <button
                    onClick={resetDraft}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Reset Teams</span>
                    <span className="sm:hidden">Reset</span>
                  </button>
                </div>
              </div>

              {/* Add Player Form */}
              {showAddPlayer && (
                <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-3">Add New Player</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Player name"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addPlayerToDraft()}
                      className="flex-1 p-2 sm:p-3 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none text-sm sm:text-base"
                      autoFocus
                    />
                    <button
                      onClick={addPlayerToDraft}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddPlayer(false);
                        setNewPlayerName('');
                      }}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isLoadingDraft ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading draft...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Team Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Team 1 */}
                  <div className="bg-linear-to-br from-blue-900/40 to-blue-800/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-blue-600/50">
                    <div className="mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-blue-300 mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                        Team Radiant
                      </h3>

                      {/* Captain Slot */}
                      <div className="mb-4 p-3 sm:p-4 bg-blue-950/50 rounded-lg border-2 border-blue-500">
                        <p className="text-xs text-blue-300 mb-2 font-semibold">CAPTAIN</p>
                        {draftData.captain1 ? (
                          <div className="flex items-center justify-between">
                            <span className="text-white font-bold text-base sm:text-lg">{draftData.captain1}</span>
                            <button
                              onClick={() => setCaptain('', 1)}
                              className="text-red-400 hover:text-red-300 text-xs sm:text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-400 text-sm">Click a player below to set captain</p>
                        )}
                      </div>

                      {/* Team Members */}
                      <div className="space-y-2">
                        {[...Array(4)].map((_, idx) => (
                          <div
                            key={idx}
                            className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                              draftData.team1[idx]
                                ? 'bg-blue-900/30 border-blue-600'
                                : 'bg-slate-900/30 border-slate-700 border-dashed'
                            }`}
                          >
                            {draftData.team1[idx] ? (
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium text-sm sm:text-base">{draftData.team1[idx]}</span>
                                <div className="flex gap-2">
                                  {!draftData.captain1 && (
                                    <button
                                      onClick={() => setCaptain(draftData.team1[idx], 1)}
                                      className="text-yellow-400 hover:text-yellow-300 text-xs"
                                    >
                                      Set Captain
                                    </button>
                                  )}
                                  <button
                                    onClick={() => movePlayerToTeam(draftData.team1[idx], 'available')}
                                    className="text-slate-400 hover:text-slate-300 text-xs"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-500 text-xs sm:text-sm">Empty slot {idx + 1}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className="bg-linear-to-br from-red-900/40 to-red-800/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-red-600/50">
                    <div className="mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-red-300 mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-red-500 rounded-full"></span>
                        Team Dire
                      </h3>

                      {/* Captain Slot */}
                      <div className="mb-4 p-3 sm:p-4 bg-red-950/50 rounded-lg border-2 border-red-500">
                        <p className="text-xs text-red-300 mb-2 font-semibold">CAPTAIN</p>
                        {draftData.captain2 ? (
                          <div className="flex items-center justify-between">
                            <span className="text-white font-bold text-base sm:text-lg">{draftData.captain2}</span>
                            <button
                              onClick={() => setCaptain('', 2)}
                              className="text-red-400 hover:text-red-300 text-xs sm:text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-400 text-sm">Click a player below to set captain</p>
                        )}
                      </div>

                      {/* Team Members */}
                      <div className="space-y-2">
                        {[...Array(4)].map((_, idx) => (
                          <div
                            key={idx}
                            className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                              draftData.team2[idx]
                                ? 'bg-red-900/30 border-red-600'
                                : 'bg-slate-900/30 border-slate-700 border-dashed'
                            }`}
                          >
                            {draftData.team2[idx] ? (
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium text-sm sm:text-base">{draftData.team2[idx]}</span>
                                <div className="flex gap-2">
                                  {!draftData.captain2 && (
                                    <button
                                      onClick={() => setCaptain(draftData.team2[idx], 2)}
                                      className="text-yellow-400 hover:text-yellow-300 text-xs"
                                    >
                                      Set Captain
                                    </button>
                                  )}
                                  <button
                                    onClick={() => movePlayerToTeam(draftData.team2[idx], 'available')}
                                    className="text-slate-400 hover:text-slate-300 text-xs"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-500 text-xs sm:text-sm">Empty slot {idx + 1}</p>
                            )}
                          </div>
                        ))}
                      </div>
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
                      <p className="text-slate-400">No players available. Add players to start drafting!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                      {draftData.availablePlayers.map((player, idx) => (
                        <div
                          key={idx}
                          className="group p-3 sm:p-4 bg-slate-900/50 hover:bg-slate-800/70 rounded-lg border border-slate-700 hover:border-green-500 transition-all cursor-pointer"
                        >
                          <div className="flex flex-col gap-2">
                            <span className="text-white font-medium text-sm sm:text-base truncate">{player}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => movePlayerToTeam(player, 'team1')}
                                className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                                disabled={draftData.team1.length >= 4}
                              >
                                Radiant
                              </button>
                              <button
                                onClick={() => movePlayerToTeam(player, 'team2')}
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
        )}

        {/* Guide Page - Skill Tracks */}
        {currentPage === 'guide' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-8 sm:mb-12 px-2 sm:px-0">
          {skillTracks.map((track) => {
            const Icon = track.icon;
            return (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(selectedTrack === track.id ? null : track.id)}
                className={`group relative p-5 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 text-left border-2 active:scale-95 ${
                  selectedTrack === track.id
                    ? 'bg-gradient-to-br ' + track.color + ' shadow-2xl shadow-' + track.color.split('-')[1] + '-500/50 sm:scale-[1.02] border-transparent'
                    : 'bg-slate-800/50 hover:bg-slate-700/50 shadow-lg border-slate-700 hover:border-slate-600 sm:hover:scale-[1.01]'
                }`}
              >
                <div className={`absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${
                  selectedTrack !== track.id ? 'bg-gradient-to-br ' + track.color : ''
                }`}></div>
                <Icon className={`w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 transition-transform duration-300 ${
                  selectedTrack === track.id ? 'text-white' : 'text-slate-400 group-hover:text-white group-hover:scale-110'
                }`} />
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 leading-tight">{track.title}</h3>
                <p className={`text-xs sm:text-sm font-medium ${
                  selectedTrack === track.id ? 'text-white/90' : 'text-slate-400'
                }`}>
                  {track.practices.length} practices
                </p>
              </button>
            );
          })}
        </div>

        {selectedTrack && (
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-2xl border-2 border-slate-700/50 animate-in fade-in slide-in-from-bottom-4 duration-500 mx-2 sm:mx-0">
            {skillTracks
              .filter((t) => t.id === selectedTrack)
              .map((track) => {
                const Icon = track.icon;
                return (
                  <div key={track.id}>
                    <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                      <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br ${track.color} shadow-lg flex-shrink-0`}>
                        <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{track.title}</h2>
                    </div>

                    <div className="mb-8 sm:mb-10">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                        <span className={`w-1 h-5 sm:h-6 rounded-full bg-gradient-to-b ${track.color}`}></span>
                        Practice Drills
                      </h3>
                      <ul className="space-y-3 sm:space-y-4">
                        {track.practices.map((practice, idx) => {
                          const isElChapos = practice.includes("EL`Chapos");
                          return (
                            <li
                              key={idx}
                              className={`flex items-start gap-3 sm:gap-4 group ${
                                isElChapos ? 'animate-pulse' : ''
                              }`}
                            >
                              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-linear-to-br ${track.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300 ${
                                isElChapos ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-800 animate-pulse' : ''
                              }`}>
                                <span className="text-xs sm:text-sm font-bold text-white">{idx + 1}</span>
                              </div>
                              <span className={`text-sm sm:text-base leading-relaxed pt-0.5 sm:pt-1 ${
                                isElChapos ? 'text-yellow-300 font-semibold' : 'text-slate-200'
                              }`}>
                                {practice}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                        <span className={`w-1 h-5 sm:h-6 rounded-full bg-gradient-to-b ${track.color}`}></span>
                        Learning Resources
                      </h3>
                      <ul className="space-y-2 sm:space-y-3">
                        {track.resources.map((resource, idx) => (
                          <li key={idx} className="flex items-start gap-3 sm:gap-4 group hover:bg-slate-700/30 p-2.5 sm:p-3 rounded-lg transition-colors duration-200">
                            <span className={`text-transparent bg-clip-text bg-gradient-to-br ${track.color} text-lg sm:text-xl font-bold flex-shrink-0`}>→</span>
                            <span className="text-slate-300 text-sm sm:text-base leading-relaxed">{resource}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {!selectedTrack && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center border-2 border-slate-700/50 border-dashed mx-2 sm:mx-0">
            <Target className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-4 sm:mb-6 animate-pulse" />
            <p className="text-slate-400 text-base sm:text-lg px-4">Select a skill track above to see detailed practice drills and resources</p>
          </div>
        )}

            <div className="mt-8 sm:mt-12 bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 border-2 border-slate-700/50 mx-2 sm:mx-0">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 flex-shrink-0" />
            <span>Quick Tips for Effective Practice</span>
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 text-slate-300">
            <li className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-slate-700/30 transition-colors duration-200">
              <span className="text-blue-400 text-base sm:text-lg flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base">Focus on <span className="font-semibold text-blue-400">ONE</span> skill area per week</span>
            </li>
            <li className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-slate-700/30 transition-colors duration-200">
              <span className="text-purple-400 text-base sm:text-lg flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base">Review replays daily (even just 5 minutes)</span>
            </li>
            <li className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-slate-700/30 transition-colors duration-200">
              <span className="text-green-400 text-base sm:text-lg flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base">Quality over quantity - 2 focused games &gt; 10 autopilot games</span>
            </li>
            <li className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-slate-700/30 transition-colors duration-200">
              <span className="text-yellow-400 text-base sm:text-lg flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base">Track your progress with stats and notes</span>
            </li>
            <li className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-slate-700/30 transition-colors duration-200">
              <span className="text-orange-400 text-base sm:text-lg flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base">Practice in unranked before taking to ranked</span>
            </li>
            <li className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-slate-700/30 transition-colors duration-200">
              <span className="text-pink-400 text-base sm:text-lg flex-shrink-0">✓</span>
              <span className="text-sm sm:text-base">Stay positive - improvement takes time!</span>
            </li>
          </ul>
        </div>
          </>
        )}
      </div>
    </div>
  );
}