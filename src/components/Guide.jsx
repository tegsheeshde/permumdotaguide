import { useState } from "react";
import { Zap, Map, Brain, Users, Target, Trophy, Check } from "lucide-react";

export default function Guide() {
  const [selectedTrack, setSelectedTrack] = useState(null);

  const skillTracks = [
    {
      id: "mechanics",
      title: "Mechanics & Execution",
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
      practices: [
        "Last-hitting practice: 50+ CS in 10 min (custom lobby)",
        "Deny practice: Focus on denying every 4th creep",
        "Combos: Practice hero-specific combos in demo mode",
        "Camera control: Use edge pan + control groups efficiently",
        "Quick buy & hotkeys: Memorize item slots (1-6)",
        "Animation canceling: Master attack & cast animations",
      ],
      resources: [
        "Watch your replays at 0.5x speed for mechanical mistakes",
        "Use the demo hero feature to practice combos",
        'Try "Dota 2 Last Hit Trainer" custom game',
      ],
    },
    {
      id: "map",
      title: "Map Awareness & Vision",
      icon: Map,
      color: "from-green-500 to-emerald-500",
      practices: [
        "Minimap glance: Look every 3-5 seconds (set timer)",
        "Ward spots: Learn all meta ward positions",
        "Enemy movements: Track enemy heroes on minimap",
        "Smoke timings: Note when smokes are available",
        "Roshan timer: Always track Aegis timing",
        "TP reactions: Keep TP ready, watch for dives",
      ],
      resources: [
        "Study high MMR player minimap camera movements",
        "Use a minimap metronome while playing",
        "Watch pro replays focusing only on their ward placements",
      ],
    },
    {
      id: "game-sense",
      title: "Game Sense & Decision Making",
      icon: Brain,
      color: "from-purple-500 to-pink-500",
      practices: [
        "Power spikes: Know when your hero is strongest",
        "Itemization: Adapt builds to enemy lineup",
        "Objective priority: Towers > Kills in most cases",
        "When to farm vs fight: Read the game state",
        "Buyback discipline: Save for critical moments",
        "Risk assessment: When to trade, when to back",
      ],
      resources: [
        'Watch replays asking "why" for every decision',
        "Study DotaBuff meta trends for your heroes",
        "Review pro player item builds and adapt them",
      ],
    },
    {
      id: "roles",
      title: "Role Mastery",
      icon: Users,
      color: "from-orange-500 to-red-500",
      practices: [
        "Pick 2-3 heroes per role to master",
        "Learn role-specific timings (stacks, pulls, rotations)",
        "Understand your win condition as that role",
        "Study matchups: Know your counters & advantages",
        "Position 1-2: Farm patterns & space creation",
        "Position 3-5: Map control & enabling carries",
      ],
      resources: [
        "Watch role-specific guides from top players",
        "Join role-specific Discord communities",
        "Analyze your hero's win rate by matchup",
      ],
    },
    {
      id: "mental",
      title: "Mental Game & Consistency",
      icon: Target,
      color: "from-yellow-500 to-amber-500",
      practices: [
        'Set 1-2 specific goals per session (not just "win")',
        "Review 1 replay per day - wins AND losses",
        "Mute toxicity immediately, use pings",
        "Take breaks after 2-3 games to reset",
        "Focus on YOUR play, not teammates' mistakes",
        "Track your improvement (CS, KDA, impact)",
      ],
      resources: [
        "Keep a Dota journal noting what you learned",
        "Use Dota Plus or tracking tools to measure progress",
        "Watch BSJ or GameLeap mental game guides",
      ],
    },
    {
      id: "learning",
      title: "Learning Resources",
      icon: Trophy,
      color: "from-indigo-500 to-violet-500",
      practices: [
        "Watch EL`Chapos game per week (player perspective)",
        "Follow patch notes and adapt quickly",
        "Study meta shifts on DotaBuff/OpenDota",
        "Join coaching Discord servers",
        "Watch educational content (BSJ, Jenkins, Gameleap)",
        "Analyze immortal replays of your heroes",
      ],
      resources: [
        "YouTube: BananaSlamJamma (BSJ), Jenkins, DotaCinema",
        "Twitch: Watch high MMR players for your role",
        "Reddit: r/TrueDoTA2 for serious discussions",
        "DotaBuff.com for stats and meta analysis",
      ],
    },
  ];

  return (
    <div className="space-y-6 px-2 sm:px-0 backdrop-blur-sm">
      <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Skill Improvement Tracks
        </h2>
        <p className="text-slate-300 text-sm sm:text-base">
          Select a track to focus your training
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {skillTracks.map((track) => {
          const Icon = track.icon;
          const isSelected = selectedTrack === track.id;

          return (
            <div
              key={track.id}
              onClick={() =>
                setSelectedTrack(isSelected ? null : track.id)
              }
              className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer group ${
                isSelected
                  ? "border-white/50 scale-105 shadow-2xl z-10"
                  : "border-slate-700 hover:border-slate-500 hover:scale-[1.02]"
              }`}
            >
              {/* Background Gradient */}
              <div
                className={`absolute inset-0 bg-linear-to-br ${track.color} opacity-10 group-hover:opacity-20 transition-opacity`}
              ></div>

              <div className="p-5 sm:p-6 relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`p-3 rounded-lg bg-linear-to-br ${track.color} shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                    {track.title}
                  </h3>
                </div>

                {isSelected && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div>
                      <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Daily Practices
                      </h4>
                      <ul className="space-y-2">
                        {track.practices.map((practice, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-slate-300"
                          >
                            <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                            <span>{practice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Resources
                      </h4>
                      <ul className="space-y-2">
                        {track.resources.map((resource, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-slate-300"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1.5 shrink-0" />
                            <span>{resource}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {!isSelected && (
                  <div className="flex items-center text-slate-400 text-sm mt-2 group-hover:text-white transition-colors">
                    <span>Click to view details</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
