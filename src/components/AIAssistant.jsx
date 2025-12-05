import { useState, useEffect, useRef } from "react";
import { Bot, Send, Trash2, Sparkles, Zap, User, Users, CheckCircle, XCircle, Download, Award, Swords } from "lucide-react";
import { searchPlayer, getRecentMatches, formatMatchHistory, getPlayerProfile, getPlayerWinLoss } from "../services/opendota";
import { getCommunityStats, findPlayerStats, formatPlayerStats, formatLeaderboard, comparePlayers } from "../services/communityStats";
import * as htmlToImage from 'html-to-image';
import {
  loadMatchData,
  analyzePlayer,
  analyzeHero,
  getItemTimings,
  comparePlayersDetailed,
  getMetaHeroes,
  getPlayerHeroStats,
  getLeaderboard,
  getCounterPicks,
  getBestTeammates,
  getWorstTeammates,
  getBestMatchups,
  getWorstMatchups,
  formatPlayerAnalysis,
  formatHeroAnalysis,
  formatComparison,
  formatMetaAnalysis,
  formatCounterPicks,
  formatBestTeammates,
  formatWorstTeammates,
  formatBestMatchups,
  formatWorstMatchups
} from "../services/matchAnalysis";
import { generateAutoDrafts } from "../services/autoDraft";

/**
 * AI Assistant Component
 * Provides Dota 2 tips, strategy advice, and community help
 */
export default function AIAssistant({ userName, scheduleData }) {
  const [communityStats, setCommunityStats] = useState(null);
  const [matchDataLoaded, setMatchDataLoaded] = useState(false);
  const [playerNames, setPlayerNames] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(null);

  // Auto-draft state
  const [showDraftSelector, setShowDraftSelector] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [generatedDrafts, setGeneratedDrafts] = useState(null);
  const draftCardRefs = useRef([]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: `👋 Hey${userName ? ` ${userName}` : ''}! I'm your Dota 2 AI assistant with **ADVANCED MATCH ANALYTICS**!

I can help you with:

📊 **PLAYER ANALYSIS** (From Permum Data)
• "Analyze @El'Chapo" - Deep performance breakdown (use @ for autocomplete!)
• "El'Chapo on Puck" - Player + hero specific stats
• "Compare El'Chapo vs sase" - Head-to-head comparison
• "Leaderboard by KDA" - Rankings by any stat

🤝 **PLAYER RELATIONSHIPS**
• "Best teammates [player]" - Top performing duos
• "Worst teammates [player]" - Struggling combos
• "Best matchups [player]" - Enemy players they dominate
• "Worst matchups [player]" - Enemy players they struggle against

⚔️ **AUTO DRAFT** (NEW!)
• "Auto draft" or "Draft teams" - Select 10 players for AI-balanced teams
• Get 5 different balanced team compositions
• Based on MMR, win rate, KDA, and roles

🦸 **HERO ANALYTICS**
• "Analyze Invoker" - Full hero meta analysis
• "Best Puck players" - Who dominates this hero
• "Invoker item timings" - Average item timing benchmarks
• "What counters Ogre?" - Data-driven counter picks

📈 **META INSIGHTS**
• "Meta heroes" - Best performing heroes
• "What's the meta?" - Current meta analysis
• "Popular picks" - Most picked heroes

🔍 **PRO PLAYER SEARCH** (OpenDota)
• "Miracle last 10 games" - Live pro player stats

🎮 **DOTA 2 TIPS**
• "Best carry items?" - Item builds
• "Laning tips?" - Lane phase advice

💡 **Pro Tip:** Type @ to see all available players! 🚀`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load community stats and match data on mount
  useEffect(() => {
    const loadStats = async () => {
      const stats = await getCommunityStats();
      setCommunityStats(stats);
    };
    const loadData = async () => {
      const { statsData } = await loadMatchData();
      setMatchDataLoaded(true);

      // Extract unique player names from statistics
      if (statsData && statsData.player_statistics) {
        const names = statsData.player_statistics.map(p => String(p.player_name));
        setPlayerNames(names);
      }
    };
    loadStats();
    loadData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle input change with @ autocomplete
  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    setInput(value);
    setCursorPosition(cursorPos);

    // Check if we should show autocomplete
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const searchTerm = textBeforeCursor.substring(atIndex + 1).toLowerCase();

      // Filter player names based on search term
      const filtered = playerNames.filter(name =>
        String(name).toLowerCase().includes(searchTerm)
      );

      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (playerName) => {
    // Find the @ symbol position
    const textBeforeCursor = input.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      // Replace from @ to cursor with the player name
      const beforeAt = input.substring(0, atIndex);
      const afterCursor = input.substring(cursorPosition);
      const newInput = `${beforeAt}${playerName} ${afterCursor}`;

      setInput(newInput);
      setShowSuggestions(false);

      // Focus back on input and set cursor after player name
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newCursorPos = atIndex + playerName.length + 1; // +1 for the space
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 10);
    }
  };

  // Handle keyboard navigation in autocomplete
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !showSuggestions) {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (e.key === "Tab" && showSuggestions && filteredSuggestions.length > 0) {
      e.preventDefault();
      handleSuggestionClick(filteredSuggestions[0]);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smart AI responses with live data fetching
  const getAIResponse = async (userMessage) => {
    const msg = userMessage.toLowerCase();

    // ============================================
    // AUTO DRAFT FEATURE
    // ============================================

    // Auto draft - "Auto draft" or "Draft teams" or "Make draft"
    if (msg.includes("auto draft") || msg.includes("draft teams") || msg.includes("make draft") || (msg.includes("draft") && msg.includes("10"))) {
      setShowDraftSelector(true);
      setSelectedPlayers([]);
      return `**🎯 Auto Draft Generator**

Please select 10 players from the list below to generate balanced team compositions.

I'll analyze their stats and create 5 different balanced drafts for you!

Click on players to select them (you need exactly 10).`;
    }

    // ============================================
    // ADVANCED MATCH DATA ANALYTICS
    // ============================================

    // Player deep analysis - "Analyze [player]" (with fallback to hero if player not found)
    if ((msg.includes("analyze") || msg.includes("analysis") || msg.includes("breakdown")) && !msg.includes("hero") && !msg.includes("meta")) {
      const match = userMessage.match(/(?:analyze|analysis|breakdown)\s+([a-z0-9'_\s]+)/i);
      if (match && matchDataLoaded) {
        const name = match[1].trim();

        // Try player first
        const playerAnalysis = analyzePlayer(name);
        if (playerAnalysis) {
          return formatPlayerAnalysis(playerAnalysis);
        }

        // If player not found, try hero
        const heroAnalysis = analyzeHero(name);
        if (heroAnalysis) {
          return formatHeroAnalysis(heroAnalysis);
        }

        // Neither found
        return `❌ Couldn't find "${name}" as a player or hero in the database.\n\nTry checking the spelling or ask for available players/heroes.`;
      }
    }

    // Player + Hero specific stats - "El'Chapo on Puck" or "El'Chapo Invoker stats"
    if ((msg.includes(" on ") || msg.includes(" with ") || (msg.includes("hero") && msg.includes("stats"))) && matchDataLoaded) {
      const patterns = [
        /([a-z0-9'_]+)\s+on\s+([a-z0-9\s]+)/i,
        /([a-z0-9'_]+)\s+with\s+([a-z0-9\s]+)/i,
        /([a-z0-9'_]+)\s+([a-z0-9\s]+)\s+stats/i
      ];

      for (const pattern of patterns) {
        const match = userMessage.match(pattern);
        if (match) {
          const playerName = match[1];
          const heroName = match[2].trim();
          const stats = getPlayerHeroStats(playerName, heroName);

          if (stats) {
            let response = `**${playerName}** playing **${heroName}**\n\n`;
            response += `**📊 Performance:**\n`;
            response += `• Games: ${stats.games} (${stats.wins}W/${stats.games - stats.wins}L)\n`;
            response += `• Win Rate: ${stats.winRate}%\n`;
            response += `• KDA: ${stats.totalKills}/${stats.totalDeaths}/${stats.totalAssists}\n`;
            response += `• AVG KDA Ratio: ${stats.avgKDA}\n`;
            response += `• AVG GPM: ${stats.avgGPM}\n\n`;

            if (stats.recentMatches.length > 0) {
              response += `**🎮 Recent Matches:**\n`;
              stats.recentMatches.slice(0, 3).forEach((m, i) => {
                response += `${i + 1}. ${m.w_l === 'W' ? '✅' : '❌'} ${m.kill}/${m.death}/${m.assist} - ${m.gpm} GPM\n`;
              });
            }

            return response;
          } else {
            return `❌ No matches found for **${playerName}** playing **${heroName}**.`;
          }
        }
      }
    }

    // Hero analysis - "Analyze Invoker" or "Invoker analysis"
    if ((msg.includes("analyze") || msg.includes("analysis")) && msg.includes("hero") ||
        (msg.match(/analyze\s+[a-z\s]+$/i) && !msg.includes("player"))) {
      const heroMatch = userMessage.match(/(?:analyze|analysis)\s+(?:hero\s+)?([a-z\s]+)/i);
      if (heroMatch && matchDataLoaded) {
        const heroName = heroMatch[1].trim();
        const analysis = analyzeHero(heroName);
        if (analysis) {
          return formatHeroAnalysis(analysis);
        }
      }
    }

    // Item timings - "Invoker item timings" or "Puck items"
    if ((msg.includes("item timing") || msg.includes("item build") || (msg.includes("items") && msg.includes("when"))) && matchDataLoaded) {
      const heroMatch = userMessage.match(/([a-z\s]+?)\s+item/i);
      if (heroMatch) {
        const heroName = heroMatch[1].trim();
        const timings = getItemTimings(heroName);

        if (timings && timings.length > 0) {
          let response = `**${heroName.toUpperCase()}** - Item Timing Benchmarks\n\n`;
          response += `📦 **Average Item Timings:**\n`;
          timings.slice(0, 8).forEach((t, i) => {
            response += `${i + 1}. **${t.item}** - ${t.avgTiming} (${t.samples} samples)\n`;
          });
          response += `\n💡 These timings are averaged from real match data!`;
          return response;
        } else {
          return `❌ No item timing data found for ${heroName}.`;
        }
      }
    }

    // Enhanced player comparison - "Compare El'Chapo vs sase"
    if (msg.includes("compare") && msg.includes("vs")) {
      const compareMatch = msg.match(/compare\s+([a-z0-9'_]+)\s+vs\s+([a-z0-9'_]+)/i);
      if (compareMatch && matchDataLoaded) {
        const comparison = comparePlayersDetailed(compareMatch[1], compareMatch[2]);
        if (comparison) {
          return formatComparison(comparison);
        }
      }
    }

    // Leaderboard by stat - "Leaderboard by KDA" or "Top players GPM"
    if ((msg.includes("leaderboard") || msg.includes("top players") || msg.includes("ranking")) && matchDataLoaded) {
      let statType = 'winRate';
      if (msg.includes("kda")) statType = 'kda';
      else if (msg.includes("gpm") || msg.includes("farm")) statType = 'gpm';
      else if (msg.includes("xpm") || msg.includes("experience")) statType = 'xpm';

      const leaderboard = getLeaderboard(statType, 10);
      if (leaderboard) {
        let response = `**🏆 Leaderboard - ${statType.toUpperCase()}** (10+ games)\n\n`;
        leaderboard.forEach((p, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          const value = statType === 'winRate' ? `${p.win_rate}%` :
                       statType === 'kda' ? p.kda_ratio :
                       statType === 'gpm' ? `${p.avg_gpm.toFixed(0)}` :
                       `${p.avg_xpm.toFixed(0)}`;
          response += `${medal} **${p.player_name}** - ${value}\n`;
        });
        return response;
      }
    }

    // Meta analysis - "Meta heroes" or "What's the meta"
    if ((msg.includes("meta") && !msg.includes("analyze")) || msg.includes("best hero") || msg.includes("popular pick")) {
      if (matchDataLoaded) {
        const meta = getMetaHeroes();
        if (meta) {
          return formatMetaAnalysis(meta);
        }
      }
    }

    // Best players on a hero - "Best Puck players" or "Who plays Invoker best"
    if ((msg.includes("best") && msg.includes("player")) || msg.includes("who plays")) {
      const heroMatch = userMessage.match(/(?:best|who plays?)\s+(?:the\s+)?([a-z\s]+?)\s+(?:player|best)/i);
      if (heroMatch && matchDataLoaded) {
        const heroName = heroMatch[1].trim();
        const analysis = analyzeHero(heroName);
        if (analysis && analysis.bestPlayers.length > 0) {
          let response = `**Best ${heroName.toUpperCase()} Players:**\n\n`;
          analysis.bestPlayers.forEach((p, i) => {
            response += `${i + 1}. **${p.player}** - ${p.winRate}% WR (${p.games} games, ${p.avgKDA} KDA)\n`;
          });
          return response;
        }
      }
    }

    // Counter picks - "What counters Ogre?" or "Invoker counters" or "Counter to Puck"
    if ((msg.includes("counter") || msg.includes("counters")) && matchDataLoaded) {
      // Multiple patterns to catch different phrasings
      const patterns = [
        /what\s+(?:hero\s+)?counters?\s+([a-z\s]+?)(?:\?|$)/i,
        /([a-z\s]+?)\s+counters?(?:\?|$)/i,
        /counter\s+(?:to|for|pick)\s+([a-z\s]+?)(?:\?|$)/i,
        /counters?\s+(?:to|for|against)\s+([a-z\s]+?)(?:\?|$)/i,
        /who\s+counters?\s+([a-z\s]+?)(?:\?|$)/i
      ];

      for (const pattern of patterns) {
        const match = userMessage.match(pattern);
        if (match) {
          const heroName = match[1].trim();

          // Skip if it's clearly asking about general counters advice (existing feature)
          if (heroName.includes('invoker') && msg.includes('nyx')) {
            break; // Let it fall through to existing counter tips
          }

          const counterData = getCounterPicks(heroName);
          if (counterData) {
            return formatCounterPicks(counterData);
          } else {
            return `❌ Couldn't find "${heroName}" in the match database.\n\nTry checking the spelling or use hero names from your data.`;
          }
        }
      }
    }

    // Best teammates - "Best teammates [player]" or "[player] best teammates"
    if ((msg.includes("best teammate") || msg.includes("best team mate")) && matchDataLoaded) {
      const patterns = [
        /best\s+teammates?\s+(?:for\s+)?([a-z0-9'_]+)/i,
        /([a-z0-9'_]+)\s+best\s+teammates?/i,
        /who\s+(?:are|is)\s+([a-z0-9'_]+)(?:'s)?\s+best\s+teammates?/i
      ];

      for (const pattern of patterns) {
        const match = userMessage.match(pattern);
        if (match) {
          const playerName = match[1].trim();
          const data = getBestTeammates(playerName);
          if (data) {
            return formatBestTeammates(data);
          } else {
            return `❌ Couldn't find player "${playerName}" in the match database.`;
          }
        }
      }
    }

    // Worst teammates - "Worst teammates [player]" or "[player] worst teammates"
    if ((msg.includes("worst teammate") || msg.includes("worst team mate")) && matchDataLoaded) {
      const patterns = [
        /worst\s+teammates?\s+(?:for\s+)?([a-z0-9'_]+)/i,
        /([a-z0-9'_]+)\s+worst\s+teammates?/i,
        /who\s+(?:are|is)\s+([a-z0-9'_]+)(?:'s)?\s+worst\s+teammates?/i
      ];

      for (const pattern of patterns) {
        const match = userMessage.match(pattern);
        if (match) {
          const playerName = match[1].trim();
          const data = getWorstTeammates(playerName);
          if (data) {
            return formatWorstTeammates(data);
          } else {
            return `❌ Couldn't find player "${playerName}" in the match database.`;
          }
        }
      }
    }

    // Best matchups - "Best matchups [player]" or "[player] best matchups"
    if ((msg.includes("best matchup") || msg.includes("best match up")) && matchDataLoaded) {
      const patterns = [
        /best\s+matchups?\s+(?:for\s+)?([a-z0-9'_]+)/i,
        /([a-z0-9'_]+)\s+best\s+matchups?/i,
        /who\s+(?:does|do)\s+([a-z0-9'_]+)\s+(?:beat|dominate|own)/i
      ];

      for (const pattern of patterns) {
        const match = userMessage.match(pattern);
        if (match) {
          const playerName = match[1].trim();
          const data = getBestMatchups(playerName);
          if (data) {
            return formatBestMatchups(data);
          } else {
            return `❌ Couldn't find player "${playerName}" in the match database.`;
          }
        }
      }
    }

    // Worst matchups - "Worst matchups [player]" or "[player] worst matchups"
    if ((msg.includes("worst matchup") || msg.includes("worst match up") || msg.includes("struggles against")) && matchDataLoaded) {
      const patterns = [
        /worst\s+matchups?\s+(?:for\s+)?([a-z0-9'_]+)/i,
        /([a-z0-9'_]+)\s+worst\s+matchups?/i,
        /who\s+(?:does|do)\s+([a-z0-9'_]+)\s+struggle\s+against/i,
        /([a-z0-9'_]+)\s+struggles?\s+against\s+who/i
      ];

      for (const pattern of patterns) {
        const match = userMessage.match(pattern);
        if (match) {
          const playerName = match[1].trim();
          const data = getWorstMatchups(playerName);
          if (data) {
            return formatWorstMatchups(data);
          } else {
            return `❌ Couldn't find player "${playerName}" in the match database.`;
          }
        }
      }
    }

    // ============================================
    // EXISTING FEATURES (OpenDota, Community Stats, Tips)
    // ============================================

    // Player match history queries - NEW FEATURE!
    // Examples: "Tebo last 10 games", "What heroes does Miracle play?", "Show me Arteezy matches"
    const playerQueryMatch = msg.match(/(?:what (?:heroes|hero) (?:does|did|do)|last \d+ games?|recent (?:games?|matches?)|show (?:me )?(?:matches?|games?)).*?([a-z0-9_]+)/i);

    if (playerQueryMatch || msg.includes("games") || msg.includes("playing") && !msg.includes("who's")) {
      // Extract player name from various question formats
      let playerName = null;

      // Try different patterns
      const patterns = [
        /(?:what (?:heroes|hero) (?:does|do|did))?\s*([a-z0-9_]+)\s*(?:play|playing|last|recent)/i,
        /last \d+ games?\s+(?:of\s+)?([a-z0-9_]+)/i,
        /([a-z0-9_]+)\s+last \d+ games?/i,
        /show (?:me\s+)?(?:matches?|games?)\s+(?:of\s+|for\s+)?([a-z0-9_]+)/i,
      ];

      for (const pattern of patterns) {
        const match = userMessage.match(pattern);
        if (match && match[1]) {
          playerName = match[1];
          break;
        }
      }

      if (playerName) {
        try {
          // Search for player
          const players = await searchPlayer(playerName);

          if (players.length === 0) {
            return `❌ Couldn't find player "${playerName}".\n\nTry:\n• Full Steam name\n• Check spelling\n• OpenDota profile URL`;
          }

          const player = players[0]; // Get best match
          const accountId = player.account_id;

          // Fetch recent matches
          const matches = await getRecentMatches(accountId, 10);

          if (matches.length === 0) {
            return `Found **${player.personaname}** but no recent matches available.`;
          }

          // Get player profile for additional info
          const profile = await getPlayerProfile(accountId);
          const wl = await getPlayerWinLoss(accountId);

          // Format response
          let response = `**${player.personaname || playerName}**\n`;
          response += `🔗 [OpenDota Profile](https://www.opendota.com/players/${accountId})\n\n`;

          if (profile) {
            const mmr = profile.mmr_estimate?.estimate || profile.solo_competitive_rank || profile.competitive_rank || 'Unknown';
            response += `**MMR:** ${mmr}\n`;
            response += `**Total Games:** ${wl.win + wl.lose} (${wl.win}W/${wl.lose}L)\n`;
            response += `**Win Rate:** ${((wl.win / (wl.win + wl.lose)) * 100).toFixed(1)}%\n\n`;
          }

          // Add match history analysis
          response += formatMatchHistory(matches);

          return response;
        } catch (error) {
          console.error('Error fetching player data:', error);
          return `❌ Error fetching data for "${playerName}". Try again or check the name.`;
        }
      }
    }

    // Community stats queries - NEW FEATURE!
    // Examples: "El'Chapo winrate", "Show me Tebo stats", "Community leaderboard"
    if (msg.includes("winrate") || msg.includes("win rate") || msg.includes("stats") || msg.includes("performance")) {
      // Extract player name
      const playerNameMatch = msg.match(/(?:show (?:me\s+)?)?([a-z0-9'_]+)(?:'s)?/i);

      if (playerNameMatch && playerNameMatch[1] && !msg.includes("our") && !msg.includes("team")) {
        const playerName = playerNameMatch[1];

        if (communityStats) {
          const playerStats = findPlayerStats(communityStats, playerName);

          if (playerStats) {
            return formatPlayerStats(playerStats);
          } else {
            return `❌ Couldn't find "${playerName}" in our community stats.\n\nAvailable players: ${Object.keys(communityStats.players || {}).join(", ")}\n\nTry checking the spelling or ask for the leaderboard!`;
          }
        } else {
          return `⚠️ Community stats not loaded yet. Please contact admin to set up the stats database.`;
        }
      }
    }

    // Leaderboard queries
    if (msg.includes("leaderboard") || msg.includes("top players") || msg.includes("rankings")) {
      if (communityStats) {
        return formatLeaderboard(communityStats);
      } else {
        return `⚠️ Community stats not available yet.`;
      }
    }

    // Player comparison
    if (msg.includes("vs") || msg.includes("compare")) {
      const vsMatch = msg.match(/([a-z0-9'_]+)\s+vs\s+([a-z0-9'_]+)/i);
      const compareMatch = msg.match(/compare\s+([a-z0-9'_]+)\s+(?:and|&|with)\s+([a-z0-9'_]+)/i);

      const match = vsMatch || compareMatch;

      if (match && communityStats) {
        return comparePlayers(communityStats, match[1], match[2]);
      }
    }

    // Community-related questions
    if (msg.includes("playing today") || msg.includes("who's online") || msg.includes("available")) {
      const availablePlayers = Object.keys(scheduleData?.availability || {});
      if (availablePlayers.length > 0) {
        return `Based on the schedule, these players have marked availability: **${availablePlayers.join(", ")}**.\n\nCheck the Schedule tab to see specific times! 📅`;
      }
      return "No one has marked their availability yet. Head to the Schedule tab to add yours! 📅";
    }

    if (msg.includes("mmr") || msg.includes("rank")) {
      const players = Object.entries(scheduleData?.playerStats || {});
      if (players.length > 0) {
        const playerList = players
          .map(([name, stats]) => `• **${name}**: ${stats.mmr || 0} MMR`)
          .join("\n");
        return `Here are the registered players and their MMR:\n\n${playerList}`;
      }
      return "No players have registered their MMR yet. Use the Profile section to add yours!";
    }

    // Hero counter questions
    if (msg.includes("counter") && msg.includes("invoker")) {
      return `**Invoker Counters:**\n\n**Hard Counters:**\n• **Nyx Assassin** - Mana Burn destroys his mana pool\n• **Anti-Mage** - Blink to dodge spells, mana break\n• **Pugna** - Nether Ward punishes spell spam\n\n**Soft Counters:**\n• **Storm Spirit** - High mobility to dodge spells\n• **Templar Assassin** - Refraction blocks combos\n• **Phantom Assassin** - Blur makes skillshots harder\n\n💡 **Pro tip:** Silence items (Orchid, Hex) shut him down hard!`;
    }

    if (msg.includes("counter") && (msg.includes("pudge") || msg.includes("butcher"))) {
      return `**Pudge Counters:**\n\n**Hard Counters:**\n• **Lifestealer** - Rage blocks Hook and Dismember\n• **Juggernaut** - Blade Fury makes you magic immune\n• **Slark** - Dark Pact dispels Hook\n\n**Soft Counters:**\n• **Phantom Lancer** - Illusions confuse hooks\n• **Weaver** - Time Lapse dodges hooks\n• **Anti-Mage** - Blink mobility\n\n💡 **Pro tip:** Ward his common hook spots and stay behind creeps!`;
    }

    // Item build questions
    if (msg.includes("item") || msg.includes("build")) {
      if (msg.includes("carry") || msg.includes("pos 1") || msg.includes("safelane")) {
        return `**Carry (Pos 1) Core Items:**\n\n**Early Game:**\n• Quelling Blade, Wraith Band x2, Magic Wand\n• Power Treads or Phase Boots\n\n**Mid Game:**\n• Battle Fury (farm heroes) or Maelstrom (fighting)\n• Black King Bar (always!)\n\n**Late Game:**\n• Butterfly, Satanic, Divine Rapier\n• Situational: Monkey King Bar, Abyssal Blade\n\n💡 **Remember:** BKB timing wins games!`;
      }

      if (msg.includes("support") || msg.includes("pos 5") || msg.includes("pos 4")) {
        return `**Support (Pos 4/5) Core Items:**\n\n**Early Game:**\n• Wards (always!), Smoke, Dust\n• Brown Boots → Tranquil Boots\n• Wind Lace for speed\n\n**Mid Game:**\n• Glimmer Cape or Force Staff\n• Aether Lens for cast range\n• Magic Wand\n\n**Late Game:**\n• Aghanim's Scepter\n• Ghost Scepter / Aeon Disk\n• Solar Crest or Lotus Orb\n\n💡 **Pro tip:** Buy Smokes on cooldown!`;
      }
    }

    // Lane tips
    if (msg.includes("lane") || msg.includes("laning")) {
      if (msg.includes("mid")) {
        return `**Mid Lane Tips:**\n\n1. **Control the high ground** - Stand on your side's high ground for vision advantage\n2. **Secure ranged creep** - It gives the most XP and gold\n3. **Manage aggro** - Right-click enemy hero to pull creeps toward you\n4. **Rune control** - Contest power runes at 6:00 and every 2 min\n5. **Stack camps** - Stack the nearby camps at :53 for farming\n\n💡 **Pro tip:** The first one to hit level 6 often wins the lane!`;
      }

      return `**General Laning Tips:**\n\n1. **Last hit** - Focus on getting every last hit\n2. **Deny** - Deny your own creeps to reduce enemy XP\n3. **Trading** - Harass enemy when they go for last hits\n4. **Positioning** - Stay out of creep aggro range\n5. **Vision** - Place an early ward to avoid ganks\n\n💡 **Pro tip:** The lane equilibrium is your best friend!`;
    }

    // Draft advice
    if (msg.includes("draft") || msg.includes("pick") || msg.includes("hero")) {
      return `**Draft Tips:**\n\n**First Phase (Bans/Picks):**\n• Ban meta heroes or counters to your strat\n• Pick versatile heroes (can flex positions)\n• Secure strong laners\n\n**Second Phase:**\n• Counter enemy cores\n• Pick heroes with good synergy\n• Save your last pick for counter-picks\n\n**Good First Picks:**\n• Bane, Snapfire, Mars, Primal Beast\n• Hard to counter, flexible\n\n**Good Last Picks:**\n• Broodmother, Huskar, Meepo\n• Can dominate if not countered\n\n💡 **Pro tip:** Communication wins drafts!`;
    }

    // MMR / Climbing tips
    if (msg.includes("mmr") || msg.includes("climb") || msg.includes("rank up")) {
      return `**MMR Climbing Tips:**\n\n1. **Master 2-3 heroes** - Don't play everything\n2. **Focus on fundamentals:**\n   • Last hitting (aim for 50+ by 10min)\n   • Map awareness (check minimap every 5sec)\n   • Positioning (don't die for free)\n3. **Communication:**\n   • Use chat wheel\n   • Call missing\n   • Positive mindset (no flame!)\n4. **Learn from losses:**\n   • Watch replays\n   • Identify mistakes\n   • Don't blame team\n\n💡 **Pro tip:** +25 MMR per win adds up. Stay consistent!`;
    }

    // Funny/meme responses
    if (msg.includes("toxic") || msg.includes("tilted") || msg.includes("rage")) {
      return `**Anti-Tilt Guide:**\n\n1. **Take a break** - Walk away after 2 losses\n2. **Mute flamers** - Instantly\n3. **Remember:** It's just a game\n4. **Focus on improvement** - Not LP\n\n😤 → 😌\n\n*"GG go next"* - Ancient proverb`;
    }

    if (msg.includes("easy") || msg.includes("gg ez")) {
      return `**EZ?** 🤨\n\n*"The hardest battles are fought in the easiest games."*\n\n- Sun Tzu, probably\n\nAlso you're about to get counter-picked next game. 😏`;
    }

    // Default response
    return `🤔 Interesting question! Here are some things I can help with:\n\n• **Hero questions**: "Who counters [hero]?", "Best [hero] build?"\n• **Strategy**: "How to win mid?", "Draft tips?"\n• **Community**: "Who's playing today?", "What's our team MMR?"\n• **Tips**: "Laning tips?", "How to climb MMR?"\n\nTry asking about a specific hero or game mechanic! 🎮`;
  };

  // Handle player selection for auto-draft
  const togglePlayerSelection = (playerName) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerName)) {
        return prev.filter(p => p !== playerName);
      } else if (prev.length < 10) {
        return [...prev, playerName];
      }
      return prev;
    });
  };

  // Generate drafts from selected players
  const handleGenerateDrafts = async () => {
    if (selectedPlayers.length !== 10) {
      alert('Please select exactly 10 players');
      return;
    }

    setIsLoading(true);
    try {
      // Mock registered players data - in real app, this would come from Firebase
      const registeredPlayersData = {};
      selectedPlayers.forEach(name => {
        const stats = communityStats?.players?.[name];
        if (stats) {
          registeredPlayersData[name] = stats;
        }
      });

      const drafts = await generateAutoDrafts(selectedPlayers, registeredPlayersData);

      // Store drafts for visual display
      setGeneratedDrafts({ drafts, registeredPlayers: registeredPlayersData });

      // Add AI message
      const draftMessage = {
        id: Date.now(),
        role: "assistant",
        content: `✨ **Generated 5 Balanced Team Compositions!**\n\nScroll down to see the visual draft cards. You can download each draft as an image.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, draftMessage]);
      setShowDraftSelector(false);
    } catch (error) {
      console.error('Error generating drafts:', error);
      alert('Failed to generate drafts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Download draft card as image
  const handleDownloadDraft = async (index) => {
    const element = draftCardRefs.current[index];
    if (!element) return;

    try {
      // First render
      await htmlToImage.toPng(element);

      // Second render for download
      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0f172a',
        cacheBust: true,
      });

      const link = document.createElement('a');
      const draftName = generatedDrafts.drafts[index].name.replace(/\s+/g, '-').toLowerCase();
      link.download = `dota2-draft-${draftName}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading draft:', error);
      alert('Failed to download draft. Please try again.');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input;

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: userInput,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setInput("");
    setIsLoading(true);

    // Get AI response (may fetch live data)
    try {
      const responseContent = await getAIResponse(userInput);

      const aiResponse = {
        id: Date.now() + 1,
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);

      const errorResponse = {
        id: Date.now() + 1,
        role: "assistant",
        content: "❌ Oops! Something went wrong. Please try again.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (confirm("Clear all messages?")) {
      setMessages([
        {
          id: 1,
          role: "assistant",
          content: "Chat cleared! What would you like to know? 🤖",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  return (
    <div className="space-y-4 px-2 sm:px-0 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 border-2 border-purple-400/50 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Dota 2 AI Assistant
                <Sparkles className="w-5 h-5 animate-pulse" />
              </h2>
              <p className="text-purple-100 text-sm">
                Your personal coach & community helper
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: Sparkles, text: "Analyze Player", query: "Analyze El'Chapo" },
          { icon: Zap, text: "Counter Picks", query: "What counters Ogre?" },
          { icon: Bot, text: "Hero Analysis", query: "Analyze Invoker" },
          { icon: User, text: "Meta Heroes", query: "Meta heroes" },
        ].map((action, idx) => (
          <button
            key={idx}
            onClick={() => setInput(action.query)}
            className="flex items-center gap-2 p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700"
          >
            <action.icon className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white font-medium">{action.text}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border-2 border-slate-700/50 h-[500px] flex flex-col">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === "assistant"
                    ? "bg-gradient-to-br from-purple-600 to-pink-600"
                    : "bg-gradient-to-br from-blue-600 to-cyan-600"
                }`}
              >
                {message.role === "assistant" ? (
                  <Bot className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`flex-1 max-w-[80%] ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`rounded-2xl p-4 ${
                    message.role === "assistant"
                      ? "bg-slate-900/50 text-white border border-slate-700"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                  }`}
                >
                  <div className="prose prose-invert prose-sm max-w-none">
                    {message.content.split("\n").map((line, idx) => (
                      <p key={idx} className="mb-2 last:mb-0 whitespace-pre-wrap">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-slate-500 mt-1 block px-2">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Player Selector for Auto Draft */}
          {showDraftSelector && (
            <div className="bg-slate-900/80 rounded-lg p-4 border-2 border-purple-500/50 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Select 10 Players</h3>
                  <span className="text-purple-300 text-sm">({selectedPlayers.length}/10)</span>
                </div>
                <button
                  onClick={() => {
                    setShowDraftSelector(false);
                    setSelectedPlayers([]);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto mb-3">
                {playerNames.map((playerName, idx) => {
                  const isSelected = selectedPlayers.includes(playerName);
                  return (
                    <button
                      key={idx}
                      onClick={() => togglePlayerSelection(playerName)}
                      disabled={!isSelected && selectedPlayers.length >= 10}
                      className={`flex items-center gap-2 p-2 rounded-lg transition-all text-sm ${
                        isSelected
                          ? 'bg-purple-600 text-white border-2 border-purple-400'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-purple-500 disabled:opacity-40 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      <span className="truncate">{playerName}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleGenerateDrafts}
                disabled={selectedPlayers.length !== 10}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate {selectedPlayers.length === 10 ? 'Drafts' : `(${selectedPlayers.length}/10)`}
              </button>
            </div>
          )}

          {/* Generated Draft Cards */}
          {generatedDrafts && (
            <div className="space-y-4 mb-4">
              {generatedDrafts.drafts.map((draft, idx) => (
                <div
                  key={idx}
                  ref={(el) => (draftCardRefs.current[idx] = el)}
                  className="bg-slate-900 rounded-xl border-2 border-slate-700 overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Swords className="w-5 h-5 text-purple-400" />
                          <h3 className="text-white font-bold text-lg">{draft.name}</h3>
                          {idx === 3 && (
                            <span className="px-2 py-0.5 bg-purple-600/30 text-purple-300 text-xs border border-purple-500/50 rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm mt-1">{draft.description}</p>
                      </div>
                      <button
                        onClick={() => handleDownloadDraft(idx)}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Teams Grid */}
                  <div className="grid grid-cols-2 gap-0">
                    {/* Radiant Team */}
                    <div className="bg-green-900/20 p-4 border-r border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-green-400 font-bold text-lg">Radiant</h4>
                        <div className="text-green-300 text-sm font-semibold">
                          {draft.team1.totalMMR?.toLocaleString() || 0} MMR
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Captain */}
                        <div className="bg-green-900/30 rounded-lg p-2 border border-green-500/30">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-yellow-400" />
                            <div className="flex-1">
                              <div className="text-white font-semibold text-sm">{draft.team1.captain}</div>
                              <div className="text-green-300 text-xs">
                                Captain • {generatedDrafts.registeredPlayers[draft.team1.captain]?.mmr?.toLocaleString() || 0} MMR
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Players */}
                        {draft.team1.players.map((player, pidx) => (
                          <div key={pidx} className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                            <div className="text-white font-medium text-sm">{player}</div>
                            <div className="text-slate-400 text-xs">
                              {generatedDrafts.registeredPlayers[player]?.mmr?.toLocaleString() || 0} MMR
                              {generatedDrafts.registeredPlayers[player]?.role && (
                                <span> • {generatedDrafts.registeredPlayers[player].role}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dire Team */}
                    <div className="bg-red-900/20 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-red-400 font-bold text-lg">Dire</h4>
                        <div className="text-red-300 text-sm font-semibold">
                          {draft.team2.totalMMR?.toLocaleString() || 0} MMR
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Captain */}
                        <div className="bg-red-900/30 rounded-lg p-2 border border-red-500/30">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-yellow-400" />
                            <div className="flex-1">
                              <div className="text-white font-semibold text-sm">{draft.team2.captain}</div>
                              <div className="text-red-300 text-xs">
                                Captain • {generatedDrafts.registeredPlayers[draft.team2.captain]?.mmr?.toLocaleString() || 0} MMR
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Players */}
                        {draft.team2.players.map((player, pidx) => (
                          <div key={pidx} className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                            <div className="text-white font-medium text-sm">{player}</div>
                            <div className="text-slate-400 text-xs">
                              {generatedDrafts.registeredPlayers[player]?.mmr?.toLocaleString() || 0} MMR
                              {generatedDrafts.registeredPlayers[player]?.role && (
                                <span> • {generatedDrafts.registeredPlayers[player].role}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Balance Stats Footer */}
                  <div className="bg-slate-800/50 p-3 border-t border-slate-700 flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">MMR Difference:</span>
                      <span className="text-purple-300 font-semibold">{draft.balance.mmrDiff?.toLocaleString() || 0}</span>
                    </div>
                    <div className="w-px h-4 bg-slate-600"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Fairness Score:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${draft.balance.fairness}%` }}
                          ></div>
                        </div>
                        <span className="text-purple-300 font-semibold">{draft.balance.fairness}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-700 relative">
          {/* Autocomplete Suggestions */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-900 border-2 border-purple-500 rounded-lg shadow-2xl max-h-48 overflow-y-auto z-50">
              <div className="p-2">
                <div className="text-xs text-purple-400 font-semibold px-2 py-1 mb-1">
                  Players ({filteredSuggestions.length})
                </div>
                {filteredSuggestions.map((playerName, idx) => (
                  <button
                    key={idx}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input from losing focus
                      handleSuggestionClick(playerName);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-purple-600/30 rounded-md transition-colors text-white text-sm flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-purple-400" />
                    {playerName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onClick={(e) => setCursorPosition(e.target.selectionStart)}
                onKeyUp={(e) => setCursorPosition(e.target.selectionStart)}
                placeholder="Ask me anything about Dota 2... (Type @ for player names)"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-900/50 text-white rounded-lg border-2 border-slate-700 focus:border-purple-500 focus:outline-none disabled:opacity-50"
              />
              {input.includes('@') && !showSuggestions && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 text-xs animate-pulse">
                  @ autocomplete active
                </div>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
