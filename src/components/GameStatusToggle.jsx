import { useState } from "react";
import { Gamepad2, Home, Circle } from "lucide-react";
import { updateUserGameStatus } from "../hooks/usePresence";

/**
 * Demo component for testing game status updates
 * Can be added to any page to manually change game status
 * Useful for testing without Steam API integration
 */
export default function GameStatusToggle({ userName }) {
  const [currentStatus, setCurrentStatus] = useState(null);

  const handleStatusChange = async (status) => {
    if (!userName) {
      alert("Please enter a username first!");
      return;
    }

    await updateUserGameStatus(userName, status);
    setCurrentStatus(status);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-slate-700/50">
      <h3 className="text-sm font-semibold text-white mb-3">
        Game Status Tester (for {userName || "Unknown"})
      </h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleStatusChange(null)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentStatus === null
              ? "bg-green-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          <Circle className="w-4 h-4" />
          Online
        </button>

        <button
          onClick={() => handleStatusChange("in-game")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentStatus === "in-game"
              ? "bg-red-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          In Game
        </button>

        <button
          onClick={() => handleStatusChange("in-lobby")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentStatus === "in-lobby"
              ? "bg-yellow-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          <Home className="w-4 h-4" />
          In Lobby
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Click buttons to simulate different game statuses. Others will see your
        status update in real-time!
      </p>
    </div>
  );
}
