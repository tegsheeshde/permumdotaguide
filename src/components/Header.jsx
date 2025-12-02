import { useState, useEffect } from "react";
import {
  Home,
  Swords,
  Calendar,
  Users,
  BookOpen,
  Menu,
  X,
  User,
  LogOut,
  BarChart3,
} from "lucide-react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import UserProfile from "./UserProfile";

/**
 * Header Component
 * Contains navigation, user profile, and Steam profile linking
 */
export default function Header({
  currentPage,
  setCurrentPage,
  userName,
  scheduleData,
  updateSchedule,
  onLogout,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [registeredPlayers, setRegisteredPlayers] = useState({});

  // Load registered players from Firebase (real-time updates)
  useEffect(() => {
    const playersRef = doc(db, "app-data", "players");

    const unsubscribe = onSnapshot(
      playersRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setRegisteredPlayers(docSnap.data().list || {});
        } else {
          setRegisteredPlayers({});
        }
      },
      (error) => {
        console.error("Error loading registered players:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const navItems = [
    { id: "home", label: "Polls", icon: Home, color: "green" },
    { id: "draft", label: "Draft", icon: Swords, color: "purple" },
    { id: "schedule", label: "Schedule", icon: Calendar, color: "orange" },
    { id: "players", label: "Players", icon: Users, color: "cyan" },
    { id: "statistics", label: "Statistics", icon: BarChart3, color: "yellow" },
    { id: "guide", label: "Guide", icon: BookOpen, color: "blue" },
  ];

  const getActiveColor = (color) => {
    const colors = {
      green: "bg-green-600 text-white shadow-lg",
      purple: "bg-purple-600 text-white shadow-lg",
      orange: "bg-orange-600 text-white shadow-lg",
      cyan: "bg-cyan-600 text-white shadow-lg",
      yellow: "bg-yellow-600 text-white shadow-lg",
      blue: "bg-blue-600 text-white shadow-lg",
    };
    return colors[color] || colors.green;
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
              <Swords className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-400">
                Permum Suga
              </h1>
              <p className="text-xs text-slate-400">Dota 2 Community</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    isActive
                      ? getActiveColor(item.color)
                      : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="flex items-center gap-3">
            {/* User Menu */}
            {userName && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700 transition-colors"
                >
                  {registeredPlayers?.[userName]?.avatar ? (
                    <img
                      src={registeredPlayers[userName].avatar}
                      alt={userName}
                      className="w-6 h-6 rounded-full border border-slate-600"
                    />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-sm text-white font-medium hidden sm:block max-w-[120px] truncate">
                    {userName}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-700">
                      <div className="flex items-center gap-3">
                        {registeredPlayers?.[userName]?.avatar && (
                          <img
                            src={registeredPlayers[userName].avatar}
                            alt={userName}
                            className="w-12 h-12 rounded-full border-2 border-slate-600"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate">{userName}</p>
                          {registeredPlayers?.[userName] ? (
                            <div className="space-y-1">
                              <p className="text-slate-400 text-xs mt-0.5">
                                {registeredPlayers[userName].rank ? (
                                  <span className="text-yellow-400">
                                    Rank: {typeof registeredPlayers[userName].rank === 'number'
                                      ? `${Math.floor(registeredPlayers[userName].rank / 10)}` // OpenDota Rank Tier
                                      : registeredPlayers[userName].rank.charAt(0).toUpperCase() + registeredPlayers[userName].rank.slice(1) // Manual Rank String
                                    }
                                    {registeredPlayers[userName].mmr && ` • MMR: ${typeof registeredPlayers[userName].mmr === 'number' ? registeredPlayers[userName].mmr.toLocaleString() : parseInt(registeredPlayers[userName].mmr, 10).toLocaleString()}`}
                                  </span>
                                ) : (
                                  "Community Member"
                                )}
                              </p>
                              {/* Additional Profile Fields */}
                              {registeredPlayers[userName].role && (
                                <p className="text-slate-400 text-xs">
                                  Role: <span className="text-white">{registeredPlayers[userName].role.charAt(0).toUpperCase() + registeredPlayers[userName].role.slice(1)}</span>
                                </p>
                              )}
                              {registeredPlayers[userName].phone && (
                                <p className="text-slate-400 text-xs">
                                  Phone: <span className="text-white">{registeredPlayers[userName].phone}</span>
                                </p>
                              )}
                              {registeredPlayers[userName].preferredHeroes && (
                                <p className="text-slate-400 text-xs truncate max-w-[200px]">
                                  Heroes: <span className="text-white">{registeredPlayers[userName].preferredHeroes}</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-slate-400 text-xs mt-0.5">Community Member</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Steam Profile Link Section */}
                    <div className="p-3">
                      <UserProfile
                        userName={userName}
                        scheduleData={scheduleData}
                        updateSchedule={updateSchedule}
                        compact={true}
                      />
                    </div>

                    <div className="border-t border-slate-700">
                      <button
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-600/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-slate-800 mt-2 pt-4">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                      isActive
                        ? getActiveColor(item.color)
                        : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}
