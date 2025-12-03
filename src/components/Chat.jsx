import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Trash2, Users, Gamepad2, Home, AlertCircle, ExternalLink } from "lucide-react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  where,
  getDocs,
} from "firebase/firestore";
import { usePresence } from "../hooks/usePresence";
import { sendChatToDiscord } from "../utils/discord";
import DiscordStatus from "./DiscordStatus";

/**
 * Chat Component - Optimized for Firebase Free Tier
 * Features:
 * - Message pagination (loads only recent 50 messages)
 * - Auto-cleanup of old messages (7 days)
 * - Efficient real-time listeners
 * - Detaches listeners when component unmounts
 */
export default function Chat({ userName, setShowNameModal }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const messagesEndRef = useRef(null);

  const { onlineUsers, error: presenceError } = usePresence(userName);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Cleanup messages older than 7 days
  const cleanupOldMessages = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const messagesCollectionRef = collection(db, "chat-messages");
      const oldMessagesQuery = query(
        messagesCollectionRef,
        where("timestamp", "<", sevenDaysAgo)
      );

      const snapshot = await getDocs(oldMessagesQuery);
      const deletePromises = snapshot.docs.map((document) =>
        deleteDoc(doc(db, "chat-messages", document.id))
      );

      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error cleaning up old messages:", error);
    }
  };

  // Load messages with pagination (last 50 messages only to save reads)
  useEffect(() => {
    const messagesCollectionRef = collection(db, "chat-messages");
    const messagesQuery = query(
      messagesCollectionRef,
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const loadedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Reverse to show oldest first
        setMessages(loadedMessages.reverse());
        setIsLoadingMessages(false);
        setTimeout(scrollToBottom, 100);
      },
      (error) => {
        console.error("Error loading messages:", error);
        setIsLoadingMessages(false);
      }
    );

    // Cleanup old messages (older than 7 days) to save storage
    cleanupOldMessages();

    // Detach listener on unmount to save resources
    return () => unsubscribe();
  }, []);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!userName) {
      setShowNameModal(true);
      return;
    }

    if (!newMessage.trim()) return;

    setIsSending(true);

    try {
      const messageText = newMessage.trim();
      const messagesCollectionRef = collection(db, "chat-messages");

      await addDoc(messagesCollectionRef, {
        text: messageText,
        userName: userName,
        timestamp: serverTimestamp(),
        source: 'app', // Mark source to prevent bot echoing
      });

      // Send to Discord (async, don't await)
      sendChatToDiscord(userName, messageText).catch(err =>
        console.warn('Discord sync failed:', err)
      );

      setNewMessage("");
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Зурвас илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setIsSending(false);
    }
  };

  // Delete message (only own messages)
  const handleDeleteMessage = async (messageId, messageUserName) => {
    if (messageUserName !== userName) {
      alert("Та зөвхөн өөрийн зурвасыг устгах боломжтой!");
      return;
    }

    if (!confirm("Энэ зурвасыг устгах уу?")) return;

    try {
      await deleteDoc(doc(db, "chat-messages", messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Зурвас устгахад алдаа гарлаа.");
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      // Show time for messages within 24 hours
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      // Show date for older messages
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Get online users count and details
  const getOnlineUsersCount = () => {
    return Object.values(onlineUsers).filter(
      (user) => user.state === "online" || user.state === "away"
    ).length;
  };

  const getOnlineUsersList = () => {
    return Object.entries(onlineUsers)
      .filter(([, user]) => user.state === "online" || user.state === "away")
      .map(([name, user]) => ({ name, ...user }));
  };

  // Get status icon and color
  const getStatusDisplay = (user) => {
    if (!user) return { icon: "offline", color: "bg-slate-500", label: "Offline" };

    if (user.gameStatus === "in-game") {
      return { icon: "gamepad", color: "text-red-500", label: "In Game" };
    }

    if (user.gameStatus === "in-lobby") {
      return { icon: "home", color: "text-yellow-500", label: "In Lobby" };
    }

    if (user.state === "online") {
      return { icon: "online", color: "bg-green-500", label: "Online" };
    }

    if (user.state === "away") {
      return { icon: "away", color: "bg-yellow-500", label: "Away" };
    }

    return { icon: "offline", color: "bg-slate-500", label: "Offline" };
  };

  // Render status indicator
  const StatusIndicator = ({ status, className = "" }) => {
    if (status.icon === "gamepad") {
      return <Gamepad2 className={`${status.color} ${className}`} />;
    }
    if (status.icon === "home") {
      return <Home className={`${status.color} ${className}`} />;
    }
    // For online, away, offline - use filled circle (dot)
    return <div className={`rounded-full ${status.color} ${className}`} />;
  };

  return (
    <div className="space-y-4 px-2 sm:px-0 h-full flex flex-col">
      {/* Chat Header */}
      <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-slate-700/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-green-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Permum Chat</h2>
              <p className="text-slate-400 text-sm">
                Dota 2 toxic community
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowOnlineUsers(!showOnlineUsers)}
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
            title="View online users"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 font-semibold">
              {getOnlineUsersCount()} online
            </span>
          </button>
        </div>

        {/* Online Users Dropdown */}
        {showOnlineUsers && (
          <div className="mt-4 p-3 bg-slate-900/70 rounded-lg border border-slate-700/50">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Online Users ({getOnlineUsersCount()})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getOnlineUsersList().length > 0 ? (
                getOnlineUsersList().map((user) => {
                  const status = getStatusDisplay(user);
                  return (
                    <div
                      key={user.name}
                      className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <StatusIndicator status={status} className="w-3 h-3" />
                        <span className="text-white text-sm font-medium">
                          {user.name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {status.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-400 text-sm text-center py-2">
                  No users online
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Discord Status Integration */}
      <DiscordStatus />

      {/* Presence Error Banner */}
      {presenceError && (
        <div className="bg-yellow-900/50 border-2 border-yellow-600/50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-yellow-400 font-semibold text-sm mb-1">
              Real-Time Presence Not Enabled
            </h3>
            <p className="text-yellow-200/90 text-sm mb-3">
              {presenceError === "PERMISSION_DENIED"
                ? "Firebase Realtime Database permissions need to be configured."
                : "Firebase Realtime Database needs to be enabled to show online status."}
            </p>
            <div className="space-y-2 text-xs text-yellow-200/80">
              <p className="font-semibold">Quick Fix (2 minutes):</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to Firebase Console → Realtime Database</li>
                <li>Click "Create Database"</li>
                <li>Choose "Start in test mode"</li>
                <li>Click "Enable"</li>
                <li>Refresh this page</li>
              </ol>
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-yellow-400 hover:text-yellow-300 font-medium mt-2"
              >
                Open Firebase Console
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border-2 border-slate-700/50 flex flex-col flex-1 min-h-0 max-h-[640px]">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 mt-4">Зурвас уншиж байна...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Одоогоор зурвас алга</p>
                <p className="text-slate-500 text-sm mt-2">
                  Эхлээд та ямар нэг зүйл бичээрэй!
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isOwnMessage = message.userName === userName;
                const userStatus = onlineUsers[message.userName];
                const status = getStatusDisplay(userStatus);
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] sm:max-w-[60%] rounded-lg p-3 ${
                        isOwnMessage
                          ? "bg-green-600/20 border border-green-600/30"
                          : "bg-slate-700/50 border border-slate-600/30"
                      }`}
                    >
                      {/* Username and Time */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <StatusIndicator status={status} className="w-2.5 h-2.5" title={status.label} />
                          <span
                            className={`text-xs font-semibold ${
                              isOwnMessage ? "text-green-400" : "text-cyan-400"
                            }`}
                          >
                            {message.userName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            {formatTime(message.timestamp)}
                          </span>
                          {isOwnMessage && (
                            <button
                              onClick={() =>
                                handleDeleteMessage(
                                  message.id,
                                  message.userName
                                )
                              }
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Зурвас устгах"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Message Text */}
                      <p className="text-white text-sm wrap-break-word">
                        {message.text}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-slate-700/50 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                userName
                  ? "Write letters..."
                  : "Чатлахын тулд нэрээ оруулна уу..."
              }
              disabled={!userName || isSending}
              className="flex-1 px-4 py-3 bg-slate-900/50 text-white rounded-lg border-2 border-slate-700 focus:border-green-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!userName || !newMessage.trim() || isSending}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-2">
            {newMessage.length}/500 тэмдэгт • Бидний чат 7 хоногийн дараа автоматаар устана
          </p>
        </div>
      </div>
    </div>
  );
}
