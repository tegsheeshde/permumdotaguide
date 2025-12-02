import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import Header from "./components/Header";
import Polls from "./components/Polls";
import Draft from "./components/Draft";
import Schedule from "./components/Schedule";
import Guide from "./components/Guide";
import PlayerList from "./components/PlayerList";
import Statistics from "./components/Statistics";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home"); // 'home', 'draft', 'schedule', 'players', 'statistics', or 'guide'
  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || ""
  );
  const [showNameModal, setShowNameModal] = useState(
    !localStorage.getItem("userName")
  );

  // Schedule Maker State (Kept in App.jsx as it's shared with Header)
  const [scheduleData, setScheduleData] = useState({
    availability: {}, // { playerName: { 'Monday-08:00': true, ... } }
    preferences: {}, // { playerName: { lan: true, ranked: true } }
    playerStats: {}, // { playerName: { steamId, mmr, rank, etc } }
  });

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
      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}dota.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-linear-to-br from-slate-950/25 via-slate-900/35 to-slate-950/30"></div>
      </div>

      {/* Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full border-2 border-slate-700 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Welcome!
            </h2>
            <p className="text-slate-300 mb-6">
              Enter your name to participate in polls
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
        {currentPage === "home" && (
          <Polls userName={userName} setShowNameModal={setShowNameModal} />
        )}

        {currentPage === "schedule" && (
          <Schedule
            scheduleData={scheduleData}
            updateSchedule={updateSchedule}
            userName={userName}
            setShowNameModal={setShowNameModal}
          />
        )}

        {currentPage === "draft" && <Draft />}

        {currentPage === "players" && <PlayerList />}

        {currentPage === "statistics" && <Statistics />}

        {currentPage === "guide" && <Guide />}
      </div>
    </div>
  );
}
