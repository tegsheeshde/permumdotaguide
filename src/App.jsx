import React, { useState } from 'react';
import { Target, Map, Users, Zap, Brain, Trophy } from 'lucide-react';

export default function App() {
  const [selectedTrack, setSelectedTrack] = useState(null);

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
        <div className="absolute inset-0 bg-linear-to-br from-slate-950/35 via-slate-900/50 to-slate-950/45"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-8 sm:mb-12 pt-4 sm:pt-8 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 mb-3 sm:mb-4 leading-tight">
            Permum Suga Dotachid Skill Improvement
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">Choose a focus area to level up your game</p>
        </div>

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
                        {track.practices.map((practice, idx) => (
                          <li key={idx} className="flex items-start gap-3 sm:gap-4 group">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${track.color} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                              <span className="text-xs sm:text-sm font-bold text-white">{idx + 1}</span>
                            </div>
                            <span className="text-slate-200 text-sm sm:text-base leading-relaxed pt-0.5 sm:pt-1">{practice}</span>
                          </li>
                        ))}
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

        <div className="mt-8 sm:mt-12 bg-gradient-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 border-2 border-slate-700/50 mx-2 sm:mx-0">
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
      </div>
    </div>
  );
}