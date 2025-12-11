import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import Header from "./components/Header";
import Draft from "./components/Draft";
import ScheduleWithPolls from "./components/ScheduleWithPolls";
import Guide from "./components/Guide";
import PlayerList from "./components/PlayerList";
import Statistics from "./components/Statistics";
import Dashboard from "./components/Dashboard";
import MatchEntry from "./components/MatchEntry";
import Chat from "./components/Chat";
import Feed from "./components/Feed";
import AIAssistant from "./components/AIAssistant";
import NotificationPrompt from "./components/NotificationPrompt";
import VersionChecker from "./components/VersionChecker";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  const [currentPage, setCurrentPage] = useState("feed"); // 'home', 'draft', 'schedule', 'players', 'chat', 'statistics', 'dashboard', 'matchentry', 'feed', 'guide', or 'ai'
  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || ""
  );
  const [showNameModal, setShowNameModal] = useState(
    !localStorage.getItem("userName")
  );
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Background images array
  const backgroundImages = [
    "backgrounds/dotawallpapers.com-dota-2-anime-girl-windranger-3840x2626.jpg",
    "backgrounds/dotawallpapers.com-drow-ranger-dota-2-nude-fan-art-3840x2702.jpg",
    "backgrounds/dotawallpapers.com-drow-ranger-nude-art-from-dota-2-2064x2064.jpg",
    "backgrounds/dotawallpapers.com-hot-marci-model-in-a-golden-dress-fan-art-4k-3840x2626.jpg",
    "backgrounds/dotawallpapers.com-lanaya-facesitting-fan-art-2560x1766.jpg",
    "backgrounds/dotawallpapers.com-lanaya-ganking-bdsm-dota-2-game-art-1824x1248.jpg",
    "backgrounds/dotawallpapers.com-little-devil-marci-sexy-wallpaper-4k-3888x2656.jpg",
    "backgrounds/dotawallpapers.com-marci-at-the-pool-fan-art-5000x3426.jpg",
    "backgrounds/dotawallpapers.com-marci-with-drow-ranger-cute-fan-art-1600x1131.jpg",
    "backgrounds/dotawallpapers.com-templar-assassin-facesitting-1856x1280.jpg",
    "backgrounds/dotawallpapers.com-wei-the-anti-mage-from-dota-2-3d-image-3840x2160.jpg",
    "backgrounds/dotawallpapers.com-windranger-nude-art-from-dota-2-3840x2626.jpg",
    "backgrounds/dotawallpapers.com-windranger-topless-nice-boobs-fan-art-3840x2626.jpg",
  ];

  // Schedule Maker State (Kept in App.jsx as it's shared with Header)
  const [scheduleData, setScheduleData] = useState({
    availability: {}, // { playerName: { 'Monday-08:00': true, ... } }
    preferences: {}, // { playerName: { lan: true, ranked: true } }
    playerStats: {}, // { playerName: { steamId, mmr, rank, etc } }
  });

  // Auto-rotate background images every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 10000); // Change every 10 seconds

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  // Load and sync schedule data from Firebase
  useEffect(() => {
    const scheduleRef = doc(db, "app-data", "schedule");

    const unsubscribe = onSnapshot(
      scheduleRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const newData = {
            availability: data.availability || {},
            preferences: data.preferences || {},
            playerStats: data.playerStats || {},
          };
          setScheduleData(newData);
        } else {
          const initialSchedule = {
            availability: {},
            preferences: {},
            playerStats: {},
          };
          setDoc(scheduleRef, initialSchedule);
          setScheduleData(initialSchedule);
        }
      },
      (error) => {
        console.error("Error loading schedule:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSchedule = async (updates) => {
    const scheduleRef = doc(db, "app-data", "schedule");
    try {
      await updateDoc(scheduleRef, updates);
    } catch (error) {
      console.error("Error updating schedule:", error);
      // If document doesn't exist, create it with setDoc
      if (error.code === "not-found") {
        await setDoc(scheduleRef, {
          availability: scheduleData.availability || {},
          preferences: scheduleData.preferences || {},
          playerStats: scheduleData.playerStats || {},
          ...updates,
        });
      }
    }
  };

  const handleNameSubmit = (name) => {
    if (name.trim()) {
      setUserName(name.trim());
      localStorage.setItem("userName", name.trim());
      setShowNameModal(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userName");
    setUserName("");
    setShowNameModal(true);
    setCurrentPage("home");
  };

  return (
    <div className="min-h-screen relative">
      <Analytics />
      {/* Auto-rotating Background Images with Overlay */}
      <div className="fixed inset-0 z-0">
        {/* Background images with fade transition */}
        {backgroundImages.map((image, index) => (
          <div
            key={image}
            className="absolute inset-0 transition-opacity duration-2000 ease-in-out"
            style={{
              backgroundImage: `url(${import.meta.env.BASE_URL}${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
              opacity: currentBgIndex === index ? 1 : 0,
              zIndex: currentBgIndex === index ? 1 : 0,
            }}
          />
        ))}
        {/* Overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-slate-950/40 via-slate-900/50 to-slate-950/40 z-10"></div>
      </div>

      {/* Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full border-2 border-slate-700 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Welcome!
            </h2>
            <p className="text-slate-300 mb-6">
              Write your name noob
            </p>
            <input
              type="text"
              placeholder="Your name (e.g., ProPlayer123)"
              className="w-full p-3 sm:p-4 bg-slate-900 text-white rounded-lg border-2 border-slate-600 focus:border-green-500 focus:outline-none mb-4 text-base sm:text-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleNameSubmit(e.target.value);
                }
              }}
              autoFocus
            />
            <button
              onClick={(e) => {
                const input = e.target.previousElementSibling;
                handleNameSubmit(input.value);
              }}
              className="w-full py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors duration-200 text-base sm:text-lg"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Header with Navigation */}
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        userName={userName}
        scheduleData={scheduleData}
        updateSchedule={updateSchedule}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8 py-6">
        {currentPage === "chat" && (
          <Chat userName={userName} setShowNameModal={setShowNameModal} />
        )}

        {(currentPage === "home" || currentPage === "schedule") && (
          <ScheduleWithPolls
            scheduleData={scheduleData}
            updateSchedule={updateSchedule}
            userName={userName}
            setShowNameModal={setShowNameModal}
          />
        )}

        {currentPage === "draft" && <Draft />}

        {currentPage === "players" && <PlayerList userName={userName} />}

        {currentPage === "dashboard" && <Dashboard />}

        {currentPage === "matchentry" && <MatchEntry />}

        {currentPage === "statistics" && <Statistics />}

        {currentPage === "feed" && (
          <Feed userName={userName} setShowNameModal={setShowNameModal} />
        )}

        {currentPage === "guide" && <Guide />}

        {currentPage === "ai" && (
          <AIAssistant userName={userName} scheduleData={scheduleData} />
        )}
      </div>

      {/* Notification Prompt */}
      <NotificationPrompt />

      {/* Version Checker - Auto-update notification */}
      <VersionChecker />
    </div>
  );
}

