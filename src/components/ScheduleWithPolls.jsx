import { useState } from "react";
import { Calendar, BarChart3 } from "lucide-react";
import Schedule from "./Schedule";
import Polls from "./Polls";

/**
 * ScheduleWithPolls Component
 * Integrates Schedule and Polls in a tabbed interface
 */
export default function ScheduleWithPolls({
  scheduleData,
  updateSchedule,
  userName,
  setShowNameModal,
}) {
  const [activeTab, setActiveTab] = useState("schedule"); // 'schedule' or 'polls'

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border-2 border-slate-700/50 overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
              activeTab === "schedule"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                : "bg-slate-800/30 text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="hidden sm:inline">Schedule Maker</span>
            <span className="sm:hidden">Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab("polls")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
              activeTab === "polls"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                : "bg-slate-800/30 text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="hidden sm:inline">Quick Polls</span>
            <span className="sm:hidden">Polls</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {activeTab === "schedule" && (
          <Schedule
            scheduleData={scheduleData}
            updateSchedule={updateSchedule}
            userName={userName}
            setShowNameModal={setShowNameModal}
          />
        )}

        {activeTab === "polls" && (
          <Polls userName={userName} setShowNameModal={setShowNameModal} />
        )}
      </div>
    </div>
  );
}
