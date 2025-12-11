import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
} from "recharts";
import { BarChart3, TrendingUp, Users, Target, Trophy, Zap } from "lucide-react";

// Custom Tooltip Component (defined outside to avoid re-creation on render)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm p-3 rounded-lg border border-slate-600 shadow-xl">
        <p className="text-white font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const COLORS = [
  "#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#ef4444", "#3b82f6", "#14b8a6", "#f97316", "#a855f7",
  "#22c55e", "#eab308", "#6366f1", "#84cc16", "#f43f5e"
];

export default function Dashboard() {
  const [playerStats, setPlayerStats] = useState([]);
  const [heroStats, setHeroStats] = useState([]);
  const [overallStats, setOverallStats] = useState({});
  const [selectedView, setSelectedView] = useState("players");
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  useEffect(() => {
    // Load statistics data
    fetch(`${import.meta.env.BASE_URL}dota2_statistics.json`)
      .then((res) => res.json())
      .then((data) => {
        const stats = data.player_statistics || [];
        setPlayerStats(stats);
        setHeroStats(data.hero_statistics || []);
        setOverallStats(data.overall_stats || {});
        // Auto-select top 3 players by default
        setSelectedPlayers(stats.slice(0, 3).map(p => p.player_name));
      })
      .catch((err) => console.error("Error loading statistics:", err));
  }, []);

  // Prepare data for charts
  const topPlayersByWinRate = [...playerStats]
    .sort((a, b) => b.win_rate - a.win_rate)
    .slice(0, 10);

  const topPlayersByKDA = [...playerStats]
    .sort((a, b) => b.kda_ratio - a.kda_ratio)
    .slice(0, 10);

  const topHeroesByWinRate = [...heroStats]
    .filter((h) => h.times_picked >= 10)
    .sort((a, b) => b.win_rate - a.win_rate)
    .slice(0, 10);

  const topHeroesByPickRate = [...heroStats]
    .sort((a, b) => b.times_picked - a.times_picked)
    .slice(0, 10);

  const radarData = useMemo(() => {
    if (selectedPlayers.length === 0) return [];

    // Calculate Dota 2-style attributes for each player
    const calculatePlayerAttributes = (player) => {
      // Normalize all values to 0-100 scale
      const maxKDA = Math.max(...playerStats.map(p => p.kda_ratio), 1);
      const maxGPM = Math.max(...playerStats.map(p => p.avg_gpm), 1);
      const maxAssists = Math.max(...playerStats.map(p => p.total_assists / p.games_played), 1);
      const maxKills = Math.max(...playerStats.map(p => p.total_kills / p.games_played), 1);

      const avgKills = player.total_kills / player.games_played;
      const avgAssists = player.total_assists / player.games_played;

      return {
        Fighting: Math.min((avgKills / maxKills) * 100, 100), // Based on kills per game
        Farming: Math.min((player.avg_gpm / maxGPM) * 100, 100), // Based on GPM
        Supporting: Math.min((avgAssists / maxAssists) * 100, 100), // Based on assists per game
        Pushing: Math.min((player.avg_gpm / maxGPM) * 80 + (player.win_rate * 0.2), 100), // GPM + Win Rate contribution
        Versatility: Math.min((player.kda_ratio / maxKDA) * 100, 100), // Based on KDA (shows overall skill)
      };
    };

    const attributes = ['Fighting', 'Farming', 'Supporting', 'Pushing', 'Versatility'];
    return attributes.map(attr => {
      const dataPoint = { attribute: attr };
      selectedPlayers.forEach(playerName => {
        const player = playerStats.find(p => p.player_name === playerName);
        if (player) {
          const playerAttrs = calculatePlayerAttributes(player);
          dataPoint[playerName] = playerAttrs[attr];
        }
      });
      return dataPoint;
    });
  }, [playerStats, selectedPlayers]);

  const togglePlayer = (playerName) => {
    setSelectedPlayers(prev =>
      prev.includes(playerName)
        ? prev.filter(p => p !== playerName)
        : [...prev, playerName]
    );
  };

  const heroPerformanceScatter = heroStats.map((hero) => ({
    name: hero.hero_name,
    pickRate: hero.times_picked,
    winRate: hero.win_rate,
  }));

  const statCards = [
    {
      title: "Total Games",
      value: overallStats.total_games || 0,
      icon: <Trophy className="w-6 h-6" />,
      color: "from-cyan-500 to-blue-500",
    },
    {
      title: "Total Players",
      value: overallStats.total_players || 0,
      icon: <Users className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Heroes Played",
      value: overallStats.total_heroes_played || 0,
      icon: <Target className="w-6 h-6" />,
      color: "from-orange-500 to-red-500",
    },
    {
      title: "Avg Game Length",
      value: overallStats.average_game_length || "N/A",
      icon: <Zap className="w-6 h-6" />,
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-6 border-2 border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-8 h-8 text-cyan-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
            <p className="text-slate-400 text-sm">
              Comprehensive Dota 2 statistics and insights
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedView("players")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedView === "players"
                ? "bg-cyan-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Player Stats
          </button>
          <button
            onClick={() => setSelectedView("heroes")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedView === "heroes"
                ? "bg-cyan-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Hero Stats
          </button>
          <button
            onClick={() => setSelectedView("overview")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedView === "overview"
                ? "bg-cyan-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Overview
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50"
          >
            <div className={`inline-flex p-3 rounded-lg bg-linear-to-br ${card.color} mb-2`}>
              {card.icon}
            </div>
            <h3 className="text-slate-400 text-sm font-medium">{card.title}</h3>
            <p className="text-white text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Player Statistics View */}
      {selectedView === "players" && (
        <>
          {/* Top Players by Win Rate */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Top 10 Players by Win Rate
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topPlayersByWinRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="player_name"
                  stroke="#9ca3af"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="win_rate" fill="#06b6d4" name="Win Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Players by KDA */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Top 10 Players by KDA Ratio
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topPlayersByKDA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="player_name"
                  stroke="#9ca3af"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="kda_ratio" fill="#8b5cf6" name="KDA Ratio" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Player Performance Comparison */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white text-lg font-bold mb-4">
              Player Performance Comparison (GPM & XPM)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={playerStats.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="player_name"
                  stroke="#9ca3af"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avg_gpm"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Avg GPM"
                />
                <Line
                  type="monotone"
                  dataKey="avg_xpm"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Avg XPM"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Dota 2-Style Player Radar Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h3 className="text-white text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  Player Performance Radar
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Dota 2-style attribute comparison
                </p>
              </div>
            </div>

            {/* Player Selection */}
            <div className="mb-4">
              <p className="text-slate-300 text-sm mb-2">Select players to compare (max 5):</p>
              <div className="flex flex-wrap gap-2">
                {playerStats.map((player, index) => {
                  const isSelected = selectedPlayers.includes(player.player_name);
                  const canSelect = selectedPlayers.length < 5 || isSelected;
                  return (
                    <button
                      key={player.player_name}
                      onClick={() => canSelect && togglePlayer(player.player_name)}
                      disabled={!canSelect}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? `text-white border-2`
                          : canSelect
                          ? "bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600"
                          : "bg-slate-700/50 text-slate-500 border border-slate-700 cursor-not-allowed"
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: COLORS[index % COLORS.length] + "40",
                              borderColor: COLORS[index % COLORS.length],
                              color: COLORS[index % COLORS.length],
                            }
                          : {}
                      }
                    >
                      {player.player_name}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedPlayers.length > 0 ? (
              <ResponsiveContainer width="100%" height={500}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" strokeWidth={1.5} />
                  <PolarAngleAxis
                    dataKey="attribute"
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 14, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-800/95 backdrop-blur-sm p-3 rounded-lg border border-slate-600 shadow-xl">
                            <p className="text-white font-semibold mb-2">{payload[0].payload.attribute}</p>
                            {payload.map((entry, idx) => (
                              <p key={idx} className="text-sm" style={{ color: entry.stroke }}>
                                {entry.name}: {entry.value.toFixed(1)}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  {selectedPlayers.map((playerName) => {
                    const playerIndex = playerStats.findIndex(p => p.player_name === playerName);
                    return (
                      <Radar
                        key={playerName}
                        name={playerName}
                        dataKey={playerName}
                        stroke={COLORS[playerIndex % COLORS.length]}
                        fill={COLORS[playerIndex % COLORS.length]}
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                    );
                  })}
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-slate-400">
                <p>Select at least one player to view the radar chart</p>
              </div>
            )}

            {/* Attribute Descriptions */}
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-2">
              {[
                { name: 'Fighting', desc: 'Kill potential', icon: '⚔️' },
                { name: 'Farming', desc: 'Gold per minute', icon: '💰' },
                { name: 'Supporting', desc: 'Team assistance', icon: '🤝' },
                { name: 'Pushing', desc: 'Objective focus', icon: '🏰' },
                { name: 'Versatility', desc: 'Overall skill', icon: '⭐' },
              ].map((attr) => (
                <div key={attr.name} className="bg-slate-700/30 rounded-lg p-2 text-center">
                  <p className="text-lg mb-1">{attr.icon}</p>
                  <p className="text-white text-xs font-semibold">{attr.name}</p>
                  <p className="text-slate-400 text-xs">{attr.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Hero Statistics View */}
      {selectedView === "heroes" && (
        <>
          {/* Top Heroes by Win Rate */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Top 10 Heroes by Win Rate (Min 10 picks)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topHeroesByWinRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="hero_name"
                  stroke="#9ca3af"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="win_rate" fill="#eab308" name="Win Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Heroes by Pick Rate */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white text-lg font-bold mb-4">
              Most Picked Heroes
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={topHeroesByPickRate}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ hero_name, times_picked }) =>
                    `${hero_name} (${times_picked})`
                  }
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="times_picked"
                >
                  {topHeroesByPickRate.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Hero Performance Scatter */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white text-lg font-bold mb-4">
              Hero Win Rate vs Pick Rate
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  type="number"
                  dataKey="pickRate"
                  name="Pick Rate"
                  stroke="#9ca3af"
                  label={{ value: "Times Picked", position: "bottom", fill: "#9ca3af" }}
                />
                <YAxis
                  type="number"
                  dataKey="winRate"
                  name="Win Rate"
                  stroke="#9ca3af"
                  label={{
                    value: "Win Rate %",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#9ca3af",
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-800/95 backdrop-blur-sm p-3 rounded-lg border border-slate-600 shadow-xl">
                          <p className="text-white font-semibold">
                            {payload[0].payload.name}
                          </p>
                          <p className="text-cyan-400 text-sm">
                            Picks: {payload[0].payload.pickRate}
                          </p>
                          <p className="text-green-400 text-sm">
                            Win Rate: {payload[0].payload.winRate.toFixed(2)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={heroPerformanceScatter} fill="#ec4899" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Hero GPM/XPM Comparison */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white text-lg font-bold mb-4">
              Top Heroes by GPM & XPM
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={heroStats.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="hero_name"
                  stroke="#9ca3af"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="avg_gpm" fill="#f59e0b" name="Avg GPM" />
                <Bar dataKey="avg_xpm" fill="#10b981" name="Avg XPM" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Overview View */}
      {selectedView === "overview" && (
        <>
          {/* Combined Player Stats */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white text-lg font-bold mb-4">
              Player Statistics Overview
            </h3>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={playerStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="player_name"
                  stroke="#9ca3af"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="total_kills" fill="#10b981" name="Total Kills" />
                <Bar dataKey="total_deaths" fill="#ef4444" name="Total Deaths" />
                <Bar dataKey="total_assists" fill="#06b6d4" name="Total Assists" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Games Played Distribution */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white text-lg font-bold mb-4">
              Games Played by Player
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={playerStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ player_name, games_played }) =>
                    `${player_name} (${games_played})`
                  }
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="games_played"
                  nameKey="player_name"
                >
                  {playerStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Most Played Heroes */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white text-lg font-bold mb-4">
              Most Played Heroes by Each Player
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {playerStats.map((player, index) => (
                <div
                  key={index}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                >
                  <h4 className="text-white font-semibold mb-2">{player.player_name}</h4>
                  <p className="text-slate-300 text-sm">
                    Most Played: <span className="text-cyan-400">{player.most_played_hero}</span>
                  </p>
                  <p className="text-slate-300 text-sm">
                    Games: <span className="text-green-400">{player.games_played}</span>
                  </p>
                  <p className="text-slate-300 text-sm">
                    Win Rate: <span className="text-yellow-400">{player.win_rate}%</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Info Footer */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
        <h3 className="text-sm font-semibold text-white mb-2">About this Dashboard</h3>
        <p className="text-xs text-slate-400">
          Interactive analytics dashboard powered by your Dota 2 match data. View detailed
          statistics for {playerStats.length} players and {heroStats.length} heroes across{" "}
          {overallStats.total_games || 0} games.
        </p>
      </div>
    </div>
  );
}
