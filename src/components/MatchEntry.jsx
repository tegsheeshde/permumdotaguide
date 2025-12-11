import { useState, useEffect } from "react";
import { Plus, Trash2, Download, Upload, Save, Users, Calendar, Clock } from "lucide-react";

export default function MatchEntry() {
  const [matches, setMatches] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [formData, setFormData] = useState({
    game_id: "",
    draft: "n",
    series: 1,
    game: 1,
    match_length: "",
    date: new Date().toISOString().split('T')[0],
    radiant_win: true,
    players: Array(10).fill(null).map((_, i) => ({
      player_name: "",
      hero_name: "",
      team: i < 5 ? "Radiant" : "Dire",
      position: (i % 5) + 1,
      kill: 0,
      death: 0,
      assist: 0,
      networth: 0,
      lh: 0,
      dn: 0,
      gpm: 0,
      xpm: 0,
      hero_lvl: 25,
      ob_ward: 0,
      sentry_ward: 0,
      smoke: 0,
      dust: 0,
      gem: 0,
      stack: 0,
      items: Array(9).fill(""),
      item_timings: Array(9).fill(""),
    }))
  });

  useEffect(() => {
    // Load existing data
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}dota2_matches.json`).then(res => res.json()),
      fetch(`${import.meta.env.BASE_URL}dota2_statistics.json`).then(res => res.json())
    ]).then(([matchData, statsData]) => {
      setMatches(matchData.matches || []);
      setStatistics(statsData);
    }).catch(err => console.error("Error loading data:", err));
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlayerChange = (playerIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.map((player, idx) =>
        idx === playerIndex ? { ...player, [field]: value } : player
      )
    }));
  };

  const handleItemChange = (playerIndex, itemIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.map((player, idx) => {
        if (idx === playerIndex) {
          const newItems = [...player.items];
          const newTimings = [...player.item_timings];
          if (field === 'item') {
            newItems[itemIndex] = value;
          } else {
            newTimings[itemIndex] = value;
          }
          return { ...player, items: newItems, item_timings: newTimings };
        }
        return player;
      })
    }));
  };

  const calculateStatistics = (allMatches) => {
    const playerMap = {};
    const heroMap = {};

    allMatches.forEach(match => {
      // This would be the player data from the match
      // For now, we'll just aggregate the existing stats
    });

    // Calculate player statistics
    const playerStats = Object.entries(playerMap).map(([name, stats]) => ({
      player_name: name,
      total_kills: stats.kills,
      total_deaths: stats.deaths,
      total_assists: stats.assists,
      games_played: stats.games,
      wins: stats.wins,
      most_played_hero: stats.mostPlayedHero,
      avg_gpm: stats.totalGPM / stats.games,
      avg_xpm: stats.totalXPM / stats.games,
      avg_networth: stats.totalNetworth / stats.games,
      win_rate: ((stats.wins / stats.games) * 100).toFixed(2),
      kda_ratio: ((stats.kills + stats.assists) / Math.max(stats.deaths, 1)).toFixed(2),
    }));

    return { player_statistics: playerStats, hero_statistics: [], overall_stats: {} };
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Create match entries for each player
    const newMatches = formData.players
      .filter(p => p.player_name && p.hero_name)
      .map((player, idx) => {
        const team = player.team;
        const won = (team === "Radiant" && formData.radiant_win) ||
                    (team === "Dire" && !formData.radiant_win);

        return {
          game_id: formData.game_id,
          draft: formData.draft,
          Series: formData.series,
          Game: formData.game,
          "S-G-T": `${formData.series}-${formData.game}-${team}`,
          match_length: formData.match_length,
          Date: formData.date,
          w_l: won ? "W" : "L",
          team: team,
          Teamname: team === "Radiant" ? "Team1" : "Team2",
          name: player.player_name,
          player_name: player.player_name,
          positsion: player.position,
          hero_name: player.hero_name,
          hero_lvl: player.hero_lvl,
          kill: player.kill,
          death: player.death,
          assist: player.assist,
          networth: player.networth,
          lh: player.lh,
          dn: player.dn,
          gpm: player.gpm,
          xpm: player.xpm,
          ob_ward: player.ob_ward,
          sentry_ward: player.sentry_ward,
          smoke: player.smoke,
          dust: player.dust,
          gem: player.gem,
          stack: player.stack,
          item1: player.items[0] || null,
          Item2: player.items[1] || null,
          item3: player.items[2] || null,
          item4: player.items[3] || null,
          item5: player.items[4] || null,
          item6: player.items[5] || null,
          item7: player.items[6] || null,
          item8: player.items[7] || null,
          item9: player.items[8] || null,
          "item1-t": player.item_timings[0] || null,
          "item2-t": player.item_timings[1] || null,
          "item3-t": player.item_timings[2] || null,
          "item4-t": player.item_timings[3] || null,
          "item5-t": player.item_timings[4] || null,
          "item6-t": player.item_timings[5] || null,
          "item7-t": player.item_timings[6] || null,
          "item8-t": player.item_timings[7] || null,
          "item9-t": player.item_timings[8] || null,
        };
      });

    const updatedMatches = [...matches, ...newMatches];

    // Generate download for matches
    const matchesData = {
      metadata: {
        total_matches: updatedMatches.length,
        date_exported: new Date().toISOString(),
        description: "Dota 2 match statistics including player performance, hero picks, and item timings",
      },
      matches: updatedMatches
    };

    // Download matches JSON
    downloadJSON(matchesData, 'dota2_matches.json');

    alert('Match added successfully! JSON file downloaded. Please replace the file in your public folder.');

    // Reset form
    setFormData({
      game_id: "",
      draft: "n",
      series: formData.series,
      game: formData.game + 1,
      match_length: "",
      date: formData.date,
      radiant_win: true,
      players: Array(10).fill(null).map((_, i) => ({
        player_name: "",
        hero_name: "",
        team: i < 5 ? "Radiant" : "Dire",
        position: (i % 5) + 1,
        kill: 0,
        death: 0,
        assist: 0,
        networth: 0,
        lh: 0,
        dn: 0,
        gpm: 0,
        xpm: 0,
        hero_lvl: 25,
        ob_ward: 0,
        sentry_ward: 0,
        smoke: 0,
        dust: 0,
        gem: 0,
        stack: 0,
        items: Array(9).fill(""),
        item_timings: Array(9).fill(""),
      }))
    });
  };

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fillDemoData = () => {
    setFormData({
      game_id: `demo-${Date.now()}`,
      draft: "n",
      series: 1,
      game: 1,
      match_length: "35:42",
      date: new Date().toISOString().split('T')[0],
      radiant_win: true,
      players: [
        { player_name: "Player1", hero_name: "invoker", team: "Radiant", position: 1, kill: 10, death: 3, assist: 15, networth: 20000, lh: 250, dn: 20, gpm: 650, xpm: 750, hero_lvl: 25, ob_ward: 0, sentry_ward: 0, smoke: 0, dust: 0, gem: 0, stack: 0, items: ["blink", "bkb", "aghs", "", "", "", "", "", ""], item_timings: ["12:00", "18:30", "25:00", "", "", "", "", "", ""] },
        { player_name: "Player2", hero_name: "axe", team: "Radiant", position: 2, kill: 8, death: 5, assist: 20, networth: 18000, lh: 180, dn: 15, gpm: 550, xpm: 680, hero_lvl: 24, ob_ward: 0, sentry_ward: 0, smoke: 0, dust: 0, gem: 0, stack: 0, items: ["blade mail", "blink", "heart", "", "", "", "", "", ""], item_timings: ["10:00", "15:00", "28:00", "", "", "", "", "", ""] },
        { player_name: "Player3", hero_name: "crystal", team: "Radiant", position: 3, kill: 2, death: 8, assist: 25, networth: 12000, lh: 50, dn: 5, gpm: 350, xpm: 450, hero_lvl: 22, ob_ward: 15, sentry_ward: 20, smoke: 3, dust: 0, gem: 0, stack: 0, items: ["glimmer", "force", "aether", "", "", "", "", "", ""], item_timings: ["14:00", "20:00", "30:00", "", "", "", "", "", ""] },
        { player_name: "Player4", hero_name: "jugg", team: "Radiant", position: 4, kill: 12, death: 4, assist: 10, networth: 22000, lh: 300, dn: 25, gpm: 700, xpm: 800, hero_lvl: 25, ob_ward: 0, sentry_ward: 0, smoke: 0, dust: 0, gem: 0, stack: 0, items: ["battlefury", "manta", "butterfly", "", "", "", "", "", ""], item_timings: ["13:00", "22:00", "32:00", "", "", "", "", "", ""] },
        { player_name: "Player5", hero_name: "lion", team: "Radiant", position: 5, kill: 3, death: 7, assist: 22, networth: 10000, lh: 30, dn: 0, gpm: 320, xpm: 420, hero_lvl: 21, ob_ward: 12, sentry_ward: 18, smoke: 2, dust: 5, gem: 0, stack: 0, items: ["blink", "aether", "glimmer", "", "", "", "", "", ""], item_timings: ["16:00", "24:00", "31:00", "", "", "", "", "", ""] },
        { player_name: "Enemy1", hero_name: "sf", team: "Dire", position: 1, kill: 8, death: 7, assist: 12, networth: 18000, lh: 220, dn: 18, gpm: 580, xpm: 720, hero_lvl: 24, ob_ward: 0, sentry_ward: 0, smoke: 0, dust: 0, gem: 0, stack: 0, items: ["bkb", "euls", "blink", "", "", "", "", "", ""], item_timings: ["15:00", "11:00", "20:00", "", "", "", "", "", ""] },
        { player_name: "Enemy2", hero_name: "pudge", team: "Dire", position: 2, kill: 6, death: 9, assist: 15, networth: 15000, lh: 120, dn: 10, gpm: 450, xpm: 600, hero_lvl: 23, ob_ward: 0, sentry_ward: 0, smoke: 0, dust: 0, gem: 0, stack: 0, items: ["blink", "blade mail", "heart", "", "", "", "", "", ""], item_timings: ["12:00", "18:00", "29:00", "", "", "", "", "", ""] },
        { player_name: "Enemy3", hero_name: "cm", team: "Dire", position: 3, kill: 1, death: 10, assist: 20, networth: 9000, lh: 25, dn: 0, gpm: 280, xpm: 380, hero_lvl: 20, ob_ward: 10, sentry_ward: 15, smoke: 1, dust: 3, gem: 0, stack: 0, items: ["glimmer", "force", "aether", "", "", "", "", "", ""], item_timings: ["17:00", "25:00", "33:00", "", "", "", "", "", ""] },
        { player_name: "Enemy4", hero_name: "pa", team: "Dire", position: 4, kill: 9, death: 8, assist: 8, networth: 19000, lh: 260, dn: 20, gpm: 620, xpm: 750, hero_lvl: 25, ob_ward: 0, sentry_ward: 0, smoke: 0, dust: 0, gem: 0, stack: 0, items: ["deso", "bkb", "satanic", "", "", "", "", "", ""], item_timings: ["14:00", "21:00", "30:00", "", "", "", "", "", ""] },
        { player_name: "Enemy5", hero_name: "witch doctor", team: "Dire", position: 5, kill: 2, death: 9, assist: 18, networth: 8500, lh: 20, dn: 0, gpm: 270, xpm: 370, hero_lvl: 19, ob_ward: 8, sentry_ward: 12, smoke: 1, dust: 2, gem: 0, stack: 0, items: ["glimmer", "force", "aether", "", "", "", "", "", ""], item_timings: ["19:00", "27:00", "35:00", "", "", "", "", "", ""] },
      ]
    });
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-6 border-2 border-slate-700/50">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Plus className="w-8 h-8 text-green-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Match Entry Form</h2>
              <p className="text-slate-400 text-sm">
                Add new match data to your Dota 2 statistics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fillDemoData}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Fill Demo Data
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Match Information */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Match Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">
                Game ID *
              </label>
              <input
                type="text"
                required
                value={formData.game_id}
                onChange={(e) => handleInputChange('game_id', e.target.value)}
                className="w-full p-2 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                placeholder="e.g., 1-1"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">
                Series
              </label>
              <input
                type="number"
                value={formData.series}
                onChange={(e) => handleInputChange('series', parseInt(e.target.value))}
                className="w-full p-2 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">
                Game
              </label>
              <input
                type="number"
                value={formData.game}
                onChange={(e) => handleInputChange('game', parseInt(e.target.value))}
                className="w-full p-2 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">
                Draft
              </label>
              <select
                value={formData.draft}
                onChange={(e) => handleInputChange('draft', e.target.value)}
                className="w-full p-2 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
              >
                <option value="n">No Draft</option>
                <option value="y">With Draft</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">
                Match Length *
              </label>
              <input
                type="text"
                required
                value={formData.match_length}
                onChange={(e) => handleInputChange('match_length', e.target.value)}
                className="w-full p-2 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                placeholder="e.g., 35:42"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full p-2 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-slate-300 text-sm font-medium block mb-2">
                Winner
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.radiant_win}
                    onChange={() => handleInputChange('radiant_win', true)}
                    className="w-4 h-4 text-green-500"
                  />
                  <span className="text-green-400 font-semibold">Radiant</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!formData.radiant_win}
                    onChange={() => handleInputChange('radiant_win', false)}
                    className="w-4 h-4 text-red-500"
                  />
                  <span className="text-red-400 font-semibold">Dire</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Player Data */}
        {['Radiant', 'Dire'].map((team, teamIdx) => (
          <div key={team} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
              team === 'Radiant' ? 'text-green-400' : 'text-red-400'
            }`}>
              <Users className="w-5 h-5" />
              {team} Team
            </h3>

            <div className="space-y-6">
              {formData.players
                .filter((_, idx) => (team === 'Radiant' ? idx < 5 : idx >= 5))
                .map((player, idx) => {
                  const playerIndex = team === 'Radiant' ? idx : idx + 5;
                  return (
                    <div key={playerIndex} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                      <h4 className="text-white font-semibold mb-3">
                        Position {player.position}
                      </h4>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="md:col-span-2">
                          <label className="text-slate-400 text-xs block mb-1">Player Name *</label>
                          <input
                            type="text"
                            value={player.player_name}
                            onChange={(e) => handlePlayerChange(playerIndex, 'player_name', e.target.value)}
                            className="w-full p-2 bg-slate-800 text-white text-sm rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                            placeholder="Player name"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-slate-400 text-xs block mb-1">Hero *</label>
                          <input
                            type="text"
                            value={player.hero_name}
                            onChange={(e) => handlePlayerChange(playerIndex, 'hero_name', e.target.value)}
                            className="w-full p-2 bg-slate-800 text-white text-sm rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                            placeholder="Hero name"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs block mb-1">Kills</label>
                          <input
                            type="number"
                            value={player.kill}
                            onChange={(e) => handlePlayerChange(playerIndex, 'kill', parseInt(e.target.value) || 0)}
                            className="w-full p-2 bg-slate-800 text-white text-sm rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs block mb-1">Deaths</label>
                          <input
                            type="number"
                            value={player.death}
                            onChange={(e) => handlePlayerChange(playerIndex, 'death', parseInt(e.target.value) || 0)}
                            className="w-full p-2 bg-slate-800 text-white text-sm rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs block mb-1">Assists</label>
                          <input
                            type="number"
                            value={player.assist}
                            onChange={(e) => handlePlayerChange(playerIndex, 'assist', parseInt(e.target.value) || 0)}
                            className="w-full p-2 bg-slate-800 text-white text-sm rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs block mb-1">GPM</label>
                          <input
                            type="number"
                            value={player.gpm}
                            onChange={(e) => handlePlayerChange(playerIndex, 'gpm', parseInt(e.target.value) || 0)}
                            className="w-full p-2 bg-slate-800 text-white text-sm rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs block mb-1">XPM</label>
                          <input
                            type="number"
                            value={player.xpm}
                            onChange={(e) => handlePlayerChange(playerIndex, 'xpm', parseInt(e.target.value) || 0)}
                            className="w-full p-2 bg-slate-800 text-white text-sm rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs block mb-1">Net Worth</label>
                          <input
                            type="number"
                            value={player.networth}
                            onChange={(e) => handlePlayerChange(playerIndex, 'networth', parseInt(e.target.value) || 0)}
                            className="w-full p-2 bg-slate-800 text-white text-sm rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs block mb-1">LH</label>
                          <input
                            type="number"
                            value={player.lh}
                            onChange={(e) => handlePlayerChange(playerIndex, 'lh', parseInt(e.target.value) || 0)}
                            className="w-full p-2 bg-slate-800 text-white text-sm rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs block mb-1">Denies</label>
                          <input
                            type="number"
                            value={player.dn}
                            onChange={(e) => handlePlayerChange(playerIndex, 'dn', parseInt(e.target.value) || 0)}
                            className="w-full p-2 bg-slate-800 text-white text-sm rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs block mb-1">Level</label>
                          <input
                            type="number"
                            value={player.hero_lvl}
                            onChange={(e) => handlePlayerChange(playerIndex, 'hero_lvl', parseInt(e.target.value) || 0)}
                            className="w-full p-2 bg-slate-800 text-white text-sm rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                            max="30"
                          />
                        </div>
                      </div>

                      {/* Items */}
                      <div className="mt-3">
                        <label className="text-slate-400 text-xs block mb-2">Items (with timings)</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Array(6).fill(0).map((_, itemIdx) => (
                            <div key={itemIdx} className="flex gap-1">
                              <input
                                type="text"
                                value={player.items[itemIdx]}
                                onChange={(e) => handleItemChange(playerIndex, itemIdx, 'item', e.target.value)}
                                className="flex-1 p-1.5 bg-slate-800 text-white text-xs rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                                placeholder={`Item ${itemIdx + 1}`}
                              />
                              <input
                                type="text"
                                value={player.item_timings[itemIdx]}
                                onChange={(e) => handleItemChange(playerIndex, itemIdx, 'timing', e.target.value)}
                                className="w-16 p-1.5 bg-slate-800 text-white text-xs rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                                placeholder="12:30"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}

        {/* Submit Button */}
        <div className="flex gap-4 justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Match & Download JSON
          </button>
        </div>
      </form>

      {/* Instructions */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Download className="w-4 h-4 text-cyan-400" />
          Instructions
        </h3>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• Fill in match details and player statistics for all 10 players</li>
          <li>• Click "Save Match & Download JSON" to download the updated dota2_matches.json file</li>
          <li>• Replace the file in your <code className="text-cyan-400">public/</code> folder</li>
          <li>• Refresh the dashboard to see the updated statistics</li>
          <li>• Use "Fill Demo Data" to see an example of a complete match</li>
        </ul>
      </div>
    </div>
  );
}
