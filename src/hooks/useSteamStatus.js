import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { updateUserGameStatus } from "./usePresence";

/**
 * Hook to check Steam/Dota 2 status for registered players
 * Checks if users are in a match using Steam API
 */
export function useSteamStatus(userName, intervalMs = 60000) {
  const [gameStatus, setGameStatus] = useState(null);

  useEffect(() => {
    if (!userName) return;

    let intervalId;

    const checkSteamStatus = async () => {
      try {
        // Get player's Steam ID from Firestore
        const playersRef = doc(db, "app-data", "players");
        const playersSnap = await getDoc(playersRef);

        if (!playersSnap.exists()) return;

        const players = playersSnap.data().list || {};
        const playerData = players[userName];

        if (!playerData?.steamId) return;

        // In a real implementation, you would call Steam API here
        // For now, we'll simulate this with a backend endpoint
        // You'll need to create a backend service to call Steam API
        // because Steam API requires API keys that shouldn't be exposed

        // Example API call (you need to implement this backend):
        // const response = await fetch(`/api/steam/status/${playerData.steamId}`);
        // const data = await response.json();

        // For demonstration, let's check a mock endpoint
        const response = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=YOUR_STEAM_API_KEY&steamids=${playerData.steamId}`
        ).catch(() => null);

        if (response?.ok) {
          const data = await response.json();
          const player = data.response?.players?.[0];

          if (player) {
            // Steam game states:
            // personastate: 0 = Offline, 1 = Online, 2 = Busy, 3 = Away, etc.
            // gameid: Current game ID (570 = Dota 2)

            let status = null;

            if (player.gameid === "570") {
              // Dota 2
              status = "in-game";
            } else if (player.gameextrainfo) {
              status = "in-game";
            } else if (player.personastate === 1) {
              // Could be in lobby - you'd need Dota 2 Web API for this
              status = "online";
            }

            setGameStatus(status);
            updateUserGameStatus(userName, status);
          }
        }
      } catch (error) {
        console.error("Error checking Steam status:", error);
      }
    };

    // Initial check
    checkSteamStatus();

    // Set up interval for periodic checks
    intervalId = setInterval(checkSteamStatus, intervalMs);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [userName, intervalMs]);

  return gameStatus;
}

/**
 * Check Dota 2 lobby status using OpenDota API
 * This is a more reliable way to check if someone is in a lobby
 */
export async function checkDotaLobbyStatus(steamId) {
  try {
    // OpenDota API doesn't require auth for basic calls
    const response = await fetch(
      `https://api.opendota.com/api/players/${steamId}/recentMatches`
    );

    if (!response.ok) return null;

    const matches = await response.json();

    if (matches && matches.length > 0) {
      const lastMatch = matches[0];
      const matchTime = lastMatch.start_time + lastMatch.duration;
      const now = Math.floor(Date.now() / 1000);

      // If last match was within 5 minutes, likely still in post-game
      if (now - matchTime < 300) {
        return "in-game";
      }
    }

    return null;
  } catch (error) {
    console.error("Error checking Dota lobby status:", error);
    return null;
  }
}
