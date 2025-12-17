import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

/**
 * Custom hook for fetching landing page data
 * Returns live stats, top players, and hero statistics
 */
export function useLandingData() {
  const [stats, setStats] = useState({
    HeroesPlayed: 0,
    totalPlayers: 0,
    totalGames: 0,
  });
  const [players, setPlayers] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Caching state
  const [lastStatsFetch, setLastStatsFetch] = useState(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    let playersUnsubscribe;

    const fetchData = async () => {
      try {
        // 1. Listen to Firestore for players list
        const playersRef = doc(db, "app-data", "players");
        playersUnsubscribe = onSnapshot(
          playersRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const playersList = docSnap.data().list || {};
              const totalPlayers = Object.keys(playersList).length;

              // Sort players by MMR (all players)
              const topPlayers = Object.entries(playersList)
                .map(([name, data]) => ({
                  name,
                  avatar: data.avatar || "",
                  mmr: data.mmr || 0,
                  rank: data.rank || "Unranked",
                  winRate: data.winRate || 0,
                  totalGames: data.totalGames || 0,
                }))
                .sort((a, b) => (b.mmr || 0) - (a.mmr || 0));

              setPlayers(topPlayers);
              setStats((prev) => ({ ...prev, totalPlayers }));
            } else {
              setPlayers([]);
              setStats((prev) => ({ ...prev, totalPlayers: 0 }));
            }
          },
          (error) => {
            console.error("Error fetching players:", error);
            setError("Failed to load players");
          }
        );

        // 3. Fetch hero statistics from JSON (cached)
        const now = Date.now();
        if (now - lastStatsFetch > CACHE_DURATION) {
          try {
            const response = await fetch("/dota2_statistics.json");

            if (response.ok) {
              const data = await response.json();
              const totalGames = data.overall_stats?.total_games || 0;
              const HeroesPlayed = data.overall_stats?.total_heroes_played || 0;
              const heroStats = data.hero_statistics || [];

              // Get top 6 most picked heroes
              const topPickedHeroes = [...heroStats]
                .sort((a, b) => b.times_picked - a.times_picked)
                .slice(0, 6)
                .map((hero) => ({
                  hero_name: hero.hero_name,
                  displayName: formatHeroName(hero.hero_name),
                  times_picked: hero.times_picked,
                  win_rate: hero.win_rate || 0,
                  avatar: hero.avatar || null,
                }));

              setHeroes(topPickedHeroes);
              setStats((prev) => ({ ...prev, totalGames, HeroesPlayed }));
              setLastStatsFetch(now);
            }
          } catch (err) {
            console.error("Error fetching hero statistics:", err);
            // Don't set error for JSON fetch failures, just use empty data
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching landing data:", err);
        setError("Failed to load data");
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup
    return () => {
      if (playersUnsubscribe) playersUnsubscribe();
    };
  }, [CACHE_DURATION, lastStatsFetch]);

  return { stats, players, heroes, loading, error };
}

/**
 * Format hero name from snake_case to Title Case
 * Example: "ogre_magi" -> "Ogre Magi"
 */
function formatHeroName(heroName) {
  if (!heroName) return "";
  return heroName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
