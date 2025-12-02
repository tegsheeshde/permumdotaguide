import { useState, useEffect } from "react";
import { BarChart3, Plus } from "lucide-react";
import { db } from "../firebase";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";

const defaultPolls = [
  {
    id: 1,
    question: "Playing Dota 2 today?",
    options: ["Yes", "No"],
    votes: [
      { count: 0, voters: [] },
      { count: 0, voters: [] },
    ],
  },
];

export default function Polls({ userName, setShowNameModal }) {
  const [polls, setPolls] = useState([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: "", options: ["", ""] });
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);

  // Load and sync polls from Firebase Firestore
  useEffect(() => {
    const pollsRef = doc(db, "app-data", "polls");

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      pollsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setPolls(docSnap.data().list || []);
        } else {
          // Initialize with default polls if document doesn't exist
          setDoc(pollsRef, { list: defaultPolls });
          setPolls(defaultPolls);
        }
        setIsLoadingPolls(false);
      },
      (error) => {
        console.error("Error loading polls:", error);
        // Fallback to localStorage if Firebase fails
        const savedPolls = localStorage.getItem("polls");
        setPolls(savedPolls ? JSON.parse(savedPolls) : defaultPolls);
        setIsLoadingPolls(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Backup to localStorage
  useEffect(() => {
    if (polls.length > 0) {
      localStorage.setItem("polls", JSON.stringify(polls));
    }
  }, [polls]);

  const handleVote = async (pollId, optionIndex) => {
    if (!userName) {
      setShowNameModal(true);
      return;
    }

    const updatedPolls = polls.map((poll) => {
      if (poll.id === pollId) {
        // Check if user already voted in this poll
        const hasVoted = poll.votes.some((vote) =>
          vote.voters.includes(userName)
        );
        if (hasVoted) {
          return poll;
        }

        const newVotes = [...poll.votes];
        newVotes[optionIndex] = {
          count: newVotes[optionIndex].count + 1,
          voters: [...newVotes[optionIndex].voters, userName],
        };
        return { ...poll, votes: newVotes };
      }
      return poll;
    });

    // Update Firebase
    try {
      const pollsRef = doc(db, "app-data", "polls");
      await updateDoc(pollsRef, { list: updatedPolls });
    } catch (error) {
      console.error("Error updating vote:", error);
      // Fallback to local state if Firebase fails
      setPolls(updatedPolls);
    }
  };

  const handleCreatePoll = async () => {
    if (newPoll.question.trim() && newPoll.options.every((opt) => opt.trim())) {
      const filteredOptions = newPoll.options.filter((opt) => opt.trim());
      const poll = {
        id: Date.now(),
        question: newPoll.question,
        options: filteredOptions,
        votes: filteredOptions.map(() => ({ count: 0, voters: [] })),
      };
      const updatedPolls = [...polls, poll];

      // Update Firebase
      try {
        const pollsRef = doc(db, "app-data", "polls");
        await updateDoc(pollsRef, { list: updatedPolls });
      } catch (error) {
        console.error("Error creating poll:", error);
        // Fallback to local state if Firebase fails
        setPolls(updatedPolls);
      }

      setNewPoll({ question: "", options: ["", ""] });
      setShowCreatePoll(false);
    }
  };

  const addOption = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ""] });
  };

  return (
    <>
      {/* Polls Section */}
      <div className="mb-8 sm:mb-12 bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 border-2 border-slate-700/50 mx-2 sm:mx-0">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 shrink-0" />
            <span>Community Polls</span>
          </h3>
          <button
            onClick={() => setShowCreatePoll(!showCreatePoll)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Poll</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Create Poll Form */}
        {showCreatePoll && (
          <div className="mb-6 p-4 sm:p-6 bg-slate-900/50 rounded-lg border border-slate-700">
            <h4 className="text-base sm:text-lg font-semibold text-white mb-4">
              Create New Poll
            </h4>
            <input
              type="text"
              placeholder="Enter your question (e.g., Playing Dota 2 today?)"
              value={newPoll.question}
              onChange={(e) =>
                setNewPoll({ ...newPoll, question: e.target.value })
              }
              className="w-full p-3 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none mb-4 text-sm sm:text-base"
            />
            <div className="space-y-2 mb-4">
              {newPoll.options.map((option, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...newPoll.options];
                    newOptions[idx] = e.target.value;
                    setNewPoll({ ...newPoll, options: newOptions });
                  }}
                  className="w-full p-2 sm:p-3 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none text-sm sm:text-base"
                />
              ))}
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={addOption}
                className="px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200 text-sm sm:text-base"
              >
                Add Option
              </button>
              <button
                onClick={handleCreatePoll}
                className="px-4 sm:px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-semibold text-sm sm:text-base"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreatePoll(false);
                  setNewPoll({ question: "", options: ["", ""] });
                }}
                className="px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Polls List */}
        {isLoadingPolls ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading polls...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {polls.map((poll) => {
              const totalVotes = poll.votes.reduce(
                (a, b) => a.count + b.count,
                0
              );
              const hasVoted = poll.votes.some((vote) =>
                vote.voters.includes(userName)
              );

              return (
                <div
                  key={poll.id}
                  className="p-4 sm:p-6 bg-slate-900/50 rounded-lg border border-slate-700"
                >
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-4">
                    {poll.question}
                  </h4>
                  <div className="space-y-3">
                    {poll.options.map((option, idx) => {
                      const voteData = poll.votes[idx];
                      const percentage =
                        totalVotes === 0
                          ? 0
                          : Math.round((voteData.count / totalVotes) * 100);
                      const isSelected = voteData.voters.includes(userName);

                      return (
                        <div key={idx} className="relative">
                          <button
                            onClick={() => handleVote(poll.id, idx)}
                            disabled={hasVoted}
                            className={`w-full relative z-10 p-3 sm:p-4 rounded-lg border text-left transition-all duration-200 flex items-center justify-between group ${
                              isSelected
                                ? "border-green-500 bg-green-500/10"
                                : hasVoted
                                ? "border-slate-700 bg-slate-800/50 opacity-75 cursor-default"
                                : "border-slate-700 bg-slate-800 hover:border-green-500/50 hover:bg-slate-700"
                            }`}
                          >
                            <span
                              className={`font-medium text-sm sm:text-base ${
                                isSelected ? "text-green-400" : "text-slate-300"
                              }`}
                            >
                              {option}
                            </span>
                            {hasVoted && (
                              <span className="text-slate-400 text-sm sm:text-base">
                                {percentage}% ({voteData.count})
                              </span>
                            )}
                          </button>
                          {hasVoted && (
                            <div
                              className="absolute top-0 left-0 h-full bg-green-500/10 rounded-lg transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {hasVoted && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <p className="text-xs sm:text-sm text-slate-400">
                        Total votes: {totalVotes}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {poll.votes.map((vote, idx) =>
                          vote.voters.length > 0 ? (
                            <div key={idx} className="text-xs text-slate-500">
                              <span className="text-slate-400 font-medium">
                                {poll.options[idx]}:
                              </span>{" "}
                              {vote.voters.join(", ")}
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
