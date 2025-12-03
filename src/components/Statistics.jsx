import { BarChart3 } from "lucide-react";
import Guide from "./Guide";

/**
 * Statistics Component
 * Embeds Power BI dashboard for Dota 2 statistics
 */
export default function Statistics() {
  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Statistics Header */}
      <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-slate-700/50">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Statistics Dashboard</h2>
            <p className="text-slate-400 text-sm">View detailed Dota 2 statistics and analytics</p>
          </div>
        </div>
      </div>

      {/* Power BI Embed */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border-2 border-slate-700/50 overflow-hidden">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
          <iframe
            title="Dota 2 Statistics Dashboard"
            src="https://app.powerbi.com/view?r=eyJrIjoiY2QwMGE1ZDItODVmNS00ZDFlLTk5NTAtMjUxNDE4ZDIxMWM1IiwidCI6ImJkZTY4YTRhLWE5YmEtNGIxYS05N2Y1LTQ2ZjNiOWY4ZjhjYyIsImMiOjEwfQ%3D%3D"
            frameBorder="0"
            allowFullScreen={true}
            className="absolute top-0 left-0 w-full h-full"
          ></iframe>
        </div>
      </div>
      <Guide/>

      {/* Info Card */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
        <h3 className="text-sm font-semibold text-white mb-2">About this Dashboard</h3>
        <p className="text-xs text-slate-400">
          This interactive dashboard displays statistics and analytics for our Dota 2 Permum toxic community.
          Explore player performance, match history, win rates, and more.
        </p>
      </div>
    </div>
  );
}
