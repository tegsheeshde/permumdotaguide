import { useState } from "react";
import { createPortal } from "react-dom";
import { Edit2, Save, X, Phone, Mail, MapPin, Shield, Sword, Target } from "lucide-react";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * ProfileManager Component
 * Manages user profile including MMR, role, rank, and contact information
 */
export default function ProfileManager({ userName, onProfileUpdate, triggerClassName }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    mmr: "",
    role: "",
    rank: "",
    phone: "",
    email: "",
    location: "",
    preferredHeroes: "",
    playstyle: "",
  });

  // Dota 2 Ranking System
  const ranks = [
    { value: "herald", label: "Herald", color: "text-gray-400", mmr: "0-769" },
    { value: "guardian", label: "Guardian", color: "text-green-400", mmr: "770-1539" },
    { value: "crusader", label: "Crusader", color: "text-yellow-400", mmr: "1540-2309" },
    { value: "archon", label: "Archon", color: "text-orange-400", mmr: "2310-3079" },
    { value: "legend", label: "Legend", color: "text-purple-400", mmr: "3080-3849" },
    { value: "ancient", label: "Ancient", color: "text-cyan-400", mmr: "3850-4619" },
    { value: "divine", label: "Divine", color: "text-blue-400", mmr: "4620-5420" },
    { value: "immortal", label: "Immortal", color: "text-red-400", mmr: "5420+" },
  ];

  const roles = [
    { value: "carry", label: "Carry (Position 1)", icon: Sword },
    { value: "mid", label: "Mid (Position 2)", icon: Target },
    { value: "offlane", label: "Offlane (Position 3)", icon: Shield },
    { value: "support", label: "Support (Position 4)", icon: Target },
    { value: "hard-support", label: "Hard Support (Position 5)", icon: Shield },
  ];

  const playstyles = [
    "Aggressive",
    "Defensive",
    "Farming",
    "Ganking",
    "Pushing",
    "Team Fighter",
    "Split Pusher",
    "Initiator",
  ];

  // Calculate rank based on MMR
  const calculateRank = (mmr) => {
    const mmrNum = parseInt(mmr);
    if (isNaN(mmrNum)) return "";

    if (mmrNum >= 5420) return "immortal";
    if (mmrNum >= 4620) return "divine";
    if (mmrNum >= 3850) return "ancient";
    if (mmrNum >= 3080) return "legend";
    if (mmrNum >= 2310) return "archon";
    if (mmrNum >= 1540) return "crusader";
    if (mmrNum >= 770) return "guardian";
    return "herald";
  };

  const handleMmrChange = (value) => {
    setProfile(prev => ({
      ...prev,
      mmr: value,
      rank: calculateRank(value)
    }));
  };

  const loadProfile = async () => {
    try {
      const profileRef = doc(db, "user-profiles", userName);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        setProfile(profileSnap.data());
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const saveProfile = async () => {
    if (!userName) return;

    setIsSaving(true);
    try {
      // 1. Save to user-profiles collection (individual doc)
      const profileRef = doc(db, "user-profiles", userName);
      const profileData = {
        ...profile,
        userName,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(profileRef, profileData);

      // 2. Sync to app-data/players document (central list)
      const playersRef = doc(db, "app-data", "players");
      const playersSnap = await getDoc(playersRef);
      
      if (playersSnap.exists()) {
        const currentPlayers = playersSnap.data().list || {};
        const currentPlayer = currentPlayers[userName] || {};
        
        const updatedPlayers = {
          ...currentPlayers,
          [userName]: {
            ...currentPlayer,
            ...profile, // Overwrite with new profile data (mmr, role, etc)
            lastUpdated: new Date().toISOString(),
          }
        };
        
        await setDoc(playersRef, { list: updatedPlayers }, { merge: true });
      }

      if (onProfileUpdate) {
        onProfileUpdate(profileData);
      }

      alert("Profile saved successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    loadProfile();
    setIsEditing(true);
  };

  const getRankInfo = () => {
    return ranks.find(r => r.value === profile.rank) || ranks[0];
  };

  if (!isEditing) {
    return (
      <button
        onClick={handleEdit}
        className={`flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors ${triggerClassName || 'w-full'}`}
      >
        <Edit2 className="w-4 h-4" />
        <span>Edit Profile Details</span>
      </button>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full border-2 border-slate-700 shadow-2xl my-8 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Profile Details</h2>
          <button
            onClick={() => setIsEditing(false)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* MMR and Rank Section */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Game Stats</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* MMR Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  MMR (Match Making Rating)
                </label>
                <input
                  type="number"
                  value={profile.mmr}
                  onChange={(e) => handleMmrChange(e.target.value)}
                  placeholder="Enter your MMR"
                  className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Auto-calculated Rank Display */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rank (Auto-calculated)
                </label>
                <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-600">
                  {profile.rank ? (
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${getRankInfo().color}`}>
                        {getRankInfo().label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {getRankInfo().mmr}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500">Enter MMR first</span>
                  )}
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Primary Role
              </label>
              <select
                value={profile.role}
                onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
              >
                <option value="">Select your main role</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Heroes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Preferred Heroes (comma separated)
              </label>
              <input
                type="text"
                value={profile.preferredHeroes}
                onChange={(e) => setProfile(prev => ({ ...prev, preferredHeroes: e.target.value }))}
                placeholder="e.g., Anti-Mage, Invoker, Crystal Maiden"
                className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>

            <div className="space-y-4">
              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+976 xxxx xxxx"
                  className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Rank Reference Guide */}
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm font-semibold mb-2">Dota 2 Rank Reference:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {ranks.map((rank) => (
                <div key={rank.value} className="flex flex-col">
                  <span className={rank.color + " font-bold"}>{rank.label}</span>
                  <span className="text-slate-400">{rank.mmr}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              onClick={saveProfile}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
