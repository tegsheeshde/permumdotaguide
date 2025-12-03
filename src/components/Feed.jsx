import { useState, useEffect, useRef } from "react";
import { Image, Send, Trash2, ThumbsUp, Heart, Smile, Angry, Users, MessageCircle, Skull, Flame, PartyPopper, Brain, Eye, Ghost, Trophy, Reply } from "lucide-react";
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
  updateDoc,
} from "firebase/firestore";
import { sendFeedPostToDiscord } from "../utils/discord";
import { setupForegroundMessageListener, showLocalNotification, areNotificationsEnabled } from "../notifications";

const REACTIONS = [
  { id: "like", icon: ThumbsUp, label: "Like", color: "text-blue-500", emoji: "👍" },
  { id: "love", icon: Heart, label: "Love", color: "text-red-500", emoji: "❤️" },
  { id: "haha", icon: Smile, label: "Haha", color: "text-yellow-500", emoji: "😂" },
  { id: "angry", icon: Angry, label: "Angry", color: "text-orange-500", emoji: "😡" },
  { id: "gg", icon: Trophy, label: "GG", color: "text-yellow-400", emoji: "🏆" },
  { id: "toxic", icon: Skull, label: "Toxic", color: "text-green-500", emoji: "☠️" },
  { id: "fire", icon: Flame, label: "Fire", color: "text-orange-400", emoji: "🔥" },
  { id: "party", icon: PartyPopper, label: "Party", color: "text-pink-500", emoji: "🎉" },
  { id: "bigbrain", icon: Brain, label: "Big Brain", color: "text-purple-400", emoji: "🧠" },
  { id: "watching", icon: Eye, label: "Watching", color: "text-slate-400", emoji: "👀" },
  { id: "noob", icon: Ghost, label: "Noob", color: "text-gray-400", emoji: "👻" },
];

const FUNNY_PLACEHOLDERS = [
  "What tilted you today?",
  "What is your problem?",
  "Shut up and just send your meme",
  "Don't feed... your thoughts here",
  "Who ruined your MMR today?",
  "Share your suffering...",
  "Report or compliment? You decide",
  "GG EZ or gg no re?",
  "Carry or feeder? Post it here",
  "Did someone pick your hero?",
  "Blame your team here",
  "Post your copium",
  "Which role got flamed today?",
  "Mid or feed?",
  "Another jungle LC story?",
  "Who bought shadow amulet?",
  "Share your PTSD moment",
  "Did you get fountain camped?",
  "Tell us about the intentional feeder",
  "Toxic or just passionate?",
];

export default function Feed({ userName, setShowNameModal }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ content: "", imageUrl: "", videoUrl: "", gifUrl: "", type: "text" });
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showReactions, setShowReactions] = useState(null);
  const [showCommentReactions, setShowCommentReactions] = useState(null);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionCursorPos, setMentionCursorPos] = useState(null);
  const [placeholder, setPlaceholder] = useState(FUNNY_PLACEHOLDERS[0]);
  const postsEndRef = useRef(null);

  // Get random placeholder
  const getRandomPlaceholder = () => {
    const randomIndex = Math.floor(Math.random() * FUNNY_PLACEHOLDERS.length);
    return FUNNY_PLACEHOLDERS[randomIndex];
  };

  // Get unique users from posts for mention suggestions
  const getAvailableUsers = () => {
    const users = new Set();
    posts.forEach(post => {
      users.add(post.userName);
      post.comments?.forEach(comment => {
        users.add(comment.userName);
      });
    });
    return Array.from(users).filter(u => u !== userName); // Exclude self
  };

  // Parse text and highlight mentions
  const parseMentions = (text) => {
    if (!text) return text;

    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-cyan-400 font-semibold bg-cyan-400/10 px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Handle text input for mentions
  const handleTextChange = (value, field = 'content') => {
    if (field === 'content') {
      setNewPost({ ...newPost, content: value });
    }

    // Check for @ symbol to trigger mention dropdown
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = value.substring(lastAtIndex + 1);
      const hasSpace = textAfterAt.includes(' ');

      if (!hasSpace && textAfterAt.length <= 20) {
        setShowMentionDropdown(true);
        setMentionSearch(textAfterAt.toLowerCase());
        setMentionCursorPos(lastAtIndex);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  // Insert mention into text
  const insertMention = (username) => {
    const beforeMention = newPost.content.substring(0, mentionCursorPos);
    const afterMention = newPost.content.substring(mentionCursorPos + mentionSearch.length + 1);
    const newContent = `${beforeMention}@${username} ${afterMention}`;

    setNewPost({ ...newPost, content: newContent });
    setShowMentionDropdown(false);
    setMentionSearch("");
  };

  // Set random placeholder on mount
  useEffect(() => {
    setPlaceholder(getRandomPlaceholder());
  }, []);

  // Setup notification listener
  useEffect(() => {
    // Setup foreground message listener for feed notifications
    setupForegroundMessageListener((payload) => {
      console.log('[Feed] Received notification:', payload);

      // Handle different notification types
      if (payload.data?.type === 'feed') {
        // You can add custom handling here
        console.log('[Feed] New feed post notification');
      }
    });
  }, []);

  // Load posts from Firestore
  useEffect(() => {
    const postsCollectionRef = collection(db, "feed-posts");
    const postsQuery = query(
      postsCollectionRef,
      orderBy("timestamp", "desc"),
      limit(50)
    );

    let previousPostCount = 0;

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const loadedPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Check if there's a new post (not initial load)
        if (previousPostCount > 0 && loadedPosts.length > previousPostCount) {
          const newPost = loadedPosts[0]; // Latest post

          // Show notification if it's not from current user and notifications are enabled
          if (newPost.userName !== userName && areNotificationsEnabled()) {
            const postPreview = newPost.content
              ? newPost.content.substring(0, 50) + (newPost.content.length > 50 ? '...' : '')
              : 'Posted new content';

            showLocalNotification(
              `${newPost.userName} posted in feed`,
              postPreview,
              { type: 'feed', postId: newPost.id }
            );
          }
        }

        previousPostCount = loadedPosts.length;
        setPosts(loadedPosts);
        setIsLoadingPosts(false);
      },
      (error) => {
        console.error("Error loading posts:", error);
        setIsLoadingPosts(false);
      }
    );

    return () => unsubscribe();
  }, [userName]);

  // Create post
  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!userName) {
      setShowNameModal(true);
      return;
    }

    if (!newPost.content.trim() && !newPost.imageUrl.trim() && !newPost.videoUrl.trim() && !newPost.gifUrl.trim()) {
      return;
    }

    setIsSending(true);

    try {
      const postsCollectionRef = collection(db, "feed-posts");

      // Auto-convert Imgur links to direct links
      const imageUrl = newPost.imageUrl.trim() ? getImgurDirectLink(newPost.imageUrl.trim()) : "";
      const gifUrl = newPost.gifUrl.trim();

      const postData = {
        content: newPost.content.trim(),
        imageUrl: imageUrl,
        videoUrl: newPost.videoUrl.trim(),
        gifUrl: gifUrl,
        type: gifUrl ? "gif" : imageUrl ? "image" : newPost.videoUrl ? "video" : "text",
        userName: userName,
        timestamp: serverTimestamp(),
        reactions: {},
        comments: [],
      };

      await addDoc(postsCollectionRef, postData);

      // Send to Discord (async, don't await)
      sendFeedPostToDiscord(userName, postData).catch(err =>
        console.warn('Discord sync failed:', err)
      );

      setNewPost({ content: "", imageUrl: "", videoUrl: "", gifUrl: "", type: "text" });
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Toggle reaction
  const handleReaction = async (postId, reactionType) => {
    if (!userName) {
      setShowNameModal(true);
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const reactions = post.reactions || {};
    const userReactions = reactions[userName] || [];

    let updatedUserReactions;
    if (userReactions.includes(reactionType)) {
      // Remove reaction
      updatedUserReactions = userReactions.filter((r) => r !== reactionType);
    } else {
      // Add reaction (can have multiple)
      updatedUserReactions = [...userReactions, reactionType];
    }

    const updatedReactions = {
      ...reactions,
      [userName]: updatedUserReactions,
    };

    // Clean up empty arrays
    if (updatedUserReactions.length === 0) {
      delete updatedReactions[userName];
    }

    try {
      const postRef = doc(db, "feed-posts", postId);
      await updateDoc(postRef, { reactions: updatedReactions });
      // Don't close picker - allow multiple reactions
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  };

  // Add comment
  const handleAddComment = async (postId) => {
    if (!userName) {
      setShowNameModal(true);
      return;
    }

    const text = commentText[postId]?.trim();
    if (!text) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const newComment = {
      id: Date.now(),
      userName: userName,
      text: text,
      timestamp: new Date().toISOString(),
    };

    const updatedComments = [...(post.comments || []), newComment];

    try {
      const postRef = doc(db, "feed-posts", postId);
      await updateDoc(postRef, { comments: updatedComments });
      setCommentText({ ...commentText, [postId]: "" });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Handle reply to comment
  const handleReplyToComment = (postId, commentUserName) => {
    if (!userName) {
      setShowNameModal(true);
      return;
    }

    // Auto-fill comment box with @mention
    const mention = `@${commentUserName} `;
    setCommentText({ ...commentText, [postId]: mention });

    // Focus on comment input
    const commentInput = document.querySelector(`input[data-post-id="${postId}"]`);
    if (commentInput) {
      commentInput.focus();
      // Move cursor to end
      setTimeout(() => {
        commentInput.setSelectionRange(mention.length, mention.length);
      }, 0);
    }
  };

  // Handle comment reaction
  const handleCommentReaction = async (postId, commentId, reactionType) => {
    if (!userName) {
      setShowNameModal(true);
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const updatedComments = post.comments.map((comment) => {
      if (comment.id === commentId) {
        const reactions = comment.reactions || {};
        const userReactions = reactions[userName] || [];

        let updatedUserReactions;
        if (userReactions.includes(reactionType)) {
          // Remove reaction
          updatedUserReactions = userReactions.filter((r) => r !== reactionType);
        } else {
          // Add reaction (can have multiple)
          updatedUserReactions = [...userReactions, reactionType];
        }

        const updatedReactions = {
          ...reactions,
          [userName]: updatedUserReactions,
        };

        // Clean up empty arrays
        if (updatedUserReactions.length === 0) {
          delete updatedReactions[userName];
        }

        return { ...comment, reactions: updatedReactions };
      }
      return comment;
    });

    try {
      const postRef = doc(db, "feed-posts", postId);
      await updateDoc(postRef, { comments: updatedComments });
      // Don't close picker - allow multiple reactions
    } catch (error) {
      console.error("Error updating comment reaction:", error);
    }
  };

  // Delete post
  const handleDeletePost = async (postId, postUserName) => {
    if (postUserName !== userName) {
      alert("You can only delete your own posts!");
      return;
    }

    if (!confirm("Delete this post?")) return;

    try {
      await deleteDoc(doc(db, "feed-posts", postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post.");
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Get reaction summary
  const getReactionSummary = (reactions) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;

    const counts = {};
    Object.values(reactions).forEach((userReactions) => {
      userReactions.forEach((reaction) => {
        counts[reaction] = (counts[reaction] || 0) + 1;
      });
    });

    return counts;
  };

  // Get users who reacted with a specific reaction type
  const getUsersWhoReacted = (reactions, reactionType) => {
    if (!reactions) return [];

    const users = [];
    Object.entries(reactions).forEach(([username, userReactions]) => {
      if (userReactions.includes(reactionType)) {
        users.push(username);
      }
    });

    return users;
  };

  // Handle long press for mobile
  const handleTouchStart = (reactionKey) => {
    const timer = setTimeout(() => {
      setHoveredReaction(reactionKey);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    // Keep tooltip visible for a bit after touch
    setTimeout(() => {
      setHoveredReaction(null);
    }, 2000);
  };

  // Extract YouTube ID
  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Convert Imgur album/gallery links to direct image links
  const getImgurDirectLink = (url) => {
    if (!url) return url;

    // If already a direct link, return as is
    if (url.includes('i.imgur.com')) return url;

    // Convert imgur.com/abc to i.imgur.com/abc.jpg
    const imgurMatch = url.match(/imgur\.com\/([a-zA-Z0-9]+)$/);
    if (imgurMatch) {
      return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
    }

    // Convert imgur.com/a/abc (album) - extract first image
    const albumMatch = url.match(/imgur\.com\/a\/([a-zA-Z0-9]+)/);
    if (albumMatch) {
      // Try common extensions
      return `https://i.imgur.com/${albumMatch[1]}.jpg`;
    }

    return url;
  };

  return (
    <div className="space-y-4 px-2 sm:px-0 max-w-3xl mx-auto">
      {/* Feed Header */}
      <div className="bg-linear-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-slate-700/50">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Community Feed</h2>
            <p className="text-slate-400 text-sm">Share memes, videos, and interact</p>
          </div>
        </div>
      </div>

      {/* Create Post */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-slate-700/50">
        <form onSubmit={handleCreatePost} className="space-y-3">
          <div className="relative">
            <textarea
              value={newPost.content}
              onChange={(e) => handleTextChange(e.target.value)}
              onFocus={() => setPlaceholder(getRandomPlaceholder())}
              placeholder={userName ? `${placeholder} (Use @ to mention)` : "Enter your name to post..."}
              disabled={!userName || isSending}
              className="w-full px-4 py-3 bg-slate-900/50 text-white rounded-lg border-2 border-slate-700 focus:border-purple-500 focus:outline-none disabled:opacity-50 resize-none"
              rows="3"
              maxLength={1000}
            />

            {/* Mention Autocomplete Dropdown */}
            {showMentionDropdown && (
              <div className="absolute z-10 mt-1 w-64 bg-slate-900 border-2 border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {getAvailableUsers()
                  .filter(user => user.toLowerCase().includes(mentionSearch))
                  .slice(0, 5)
                  .map((user) => (
                    <button
                      key={user}
                      type="button"
                      onClick={() => insertMention(user)}
                      className="w-full px-4 py-2 text-left text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                        {user.charAt(0).toUpperCase()}
                      </div>
                      <span>@{user}</span>
                    </button>
                  ))}
                {getAvailableUsers().filter(user => user.toLowerCase().includes(mentionSearch)).length === 0 && (
                  <div className="px-4 py-2 text-slate-400 text-sm">No users found</div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newPost.imageUrl}
                onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value, videoUrl: "", gifUrl: "" })}
                placeholder="Direct Image URL (i.imgur.com/image.jpg or right-click → Copy image address)"
                disabled={!userName || isSending || newPost.videoUrl || newPost.gifUrl}
                className="flex-1 px-4 py-2 bg-slate-900/50 text-white rounded-lg border-2 border-slate-700 focus:border-purple-500 focus:outline-none disabled:opacity-50 text-sm"
              />
              <input
                type="text"
                value={newPost.videoUrl}
                onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value, imageUrl: "", gifUrl: "" })}
                placeholder="YouTube URL"
                disabled={!userName || isSending || newPost.imageUrl || newPost.gifUrl}
                className="flex-1 px-4 py-2 bg-slate-900/50 text-white rounded-lg border-2 border-slate-700 focus:border-purple-500 focus:outline-none disabled:opacity-50 text-sm"
              />
            </div>
            <input
              type="text"
              value={newPost.gifUrl}
              onChange={(e) => setNewPost({ ...newPost, gifUrl: e.target.value, imageUrl: "", videoUrl: "" })}
              placeholder="GIF URL (Tenor, Giphy, or direct .gif link)"
              disabled={!userName || isSending || newPost.imageUrl || newPost.videoUrl}
              className="w-full px-4 py-2 bg-slate-900/50 text-white rounded-lg border-2 border-slate-700 focus:border-purple-500 focus:outline-none disabled:opacity-50 text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex gap-2 text-slate-400 text-sm items-center">
                <Image className="w-4 h-4" />
                <span>Share images, videos, or GIFs</span>
              </div>
              <p className="text-xs text-slate-500">
                Images: <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">Upload to Imgur</a> then right-click image → "Copy image address" |
                GIFs: <a href="https://tenor.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline ml-1">Tenor</a> or <a href="https://giphy.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline ml-1">Giphy</a>
              </p>
            </div>
            <button
              type="submit"
              disabled={!userName || isSending || (!newPost.content.trim() && !newPost.imageUrl && !newPost.videoUrl && !newPost.gifUrl)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? "Posting..." : "Post"}
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {isLoadingPosts ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 mt-4">Loading posts...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-xl border-2 border-slate-700/50">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No posts yet</p>
            <p className="text-slate-500 text-sm mt-2">Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => {
            const reactionSummary = getReactionSummary(post.reactions);
            const userReactions = post.reactions?.[userName] || [];
            const youtubeId = post.videoUrl ? getYouTubeId(post.videoUrl) : null;

            return (
              <div key={post.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-slate-700/50">
                {/* Post Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                      {post.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{post.userName}</p>
                      <p className="text-slate-400 text-xs">{formatTime(post.timestamp)}</p>
                    </div>
                  </div>
                  {post.userName === userName && (
                    <button
                      onClick={() => handleDeletePost(post.id, post.userName)}
                      className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Post Content */}
                {post.content && (
                  <p className="text-white mb-3 whitespace-pre-wrap wrap-break-word">
                    {parseMentions(post.content)}
                  </p>
                )}

                {/* Post Image */}
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full rounded-lg mb-3 max-h-96 object-cover border border-slate-700"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}

                {/* Post Video (YouTube) */}
                {youtubeId && (
                  <div className="relative pb-[56.25%] mb-3 rounded-lg overflow-hidden border border-slate-700">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title="YouTube video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Post GIF */}
                {post.gifUrl && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-slate-700 bg-slate-900/50">
                    <img
                      src={post.gifUrl}
                      alt="GIF"
                      className="w-full max-h-96 object-contain"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML = `<div class="p-4 text-center text-red-400 text-sm">Failed to load GIF</div>`;
                      }}
                    />
                  </div>
                )}

                {/* Reaction Summary */}
                {reactionSummary && (
                  <div className="flex items-center gap-1.5 mb-3 pb-3 border-b border-slate-700/50 flex-wrap">
                    {Object.entries(reactionSummary).map(([reactionType, count]) => {
                      const reaction = REACTIONS.find((r) => r.id === reactionType);
                      if (!reaction) return null;
                      const usersWhoReacted = getUsersWhoReacted(post.reactions, reactionType);
                      const reactionKey = `${post.id}-${reactionType}`;

                      return (
                        <div
                          key={reactionType}
                          className="relative inline-flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-full border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer select-none"
                          onMouseEnter={() => setHoveredReaction(reactionKey)}
                          onMouseLeave={() => setHoveredReaction(null)}
                          onTouchStart={() => handleTouchStart(reactionKey)}
                          onTouchEnd={handleTouchEnd}
                        >
                          <span className="text-base">{reaction.emoji}</span>
                          <span className="text-slate-300 text-xs font-semibold">{count}</span>

                          {/* Tooltip showing who reacted */}
                          {hoveredReaction === reactionKey && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border-2 border-slate-700 rounded-lg shadow-xl z-30 whitespace-nowrap pointer-events-none">
                              <div className="text-xs font-semibold text-slate-400 mb-1">{reaction.label}</div>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {usersWhoReacted.map((user, idx) => (
                                  <div key={idx} className="text-sm text-white">
                                    {user === userName ? 'You' : user}
                                  </div>
                                ))}
                              </div>
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-700"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700/50">
                  <div className="relative">
                    <button
                      onClick={() => setShowReactions(showReactions === post.id ? null : post.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300"
                    >
                      <ThumbsUp className={`w-5 h-5 ${userReactions.length > 0 ? "text-blue-500 fill-blue-500" : ""}`} />
                      <span className="text-sm">React</span>
                    </button>

                    {/* Reactions Picker */}
                    {showReactions === post.id && (
                      <div className="absolute bottom-full left-0 mb-2 bg-slate-900 rounded-lg border-2 border-slate-700 shadow-xl z-20 min-w-[280px] sm:max-w-none">
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3">
                          {REACTIONS.map((reaction) => {
                            const hasReaction = userReactions.includes(reaction.id);
                            return (
                              <button
                                key={reaction.id}
                                onClick={() => handleReaction(post.id, reaction.id)}
                                className={`group relative p-2 rounded-lg hover:bg-slate-800 transition-all transform hover:scale-110 active:scale-95 ${
                                  hasReaction ? "bg-slate-800 ring-2 ring-cyan-400" : ""
                                }`}
                                title={reaction.label}
                              >
                                <span className="text-xl sm:text-2xl">{reaction.emoji}</span>
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white bg-slate-800 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                  {reaction.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="border-t border-slate-700 p-2">
                          <button
                            onClick={() => setShowReactions(null)}
                            className="w-full px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors font-semibold"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">Comment</span>
                    {post.comments?.length > 0 && (
                      <span className="text-xs text-slate-400">({post.comments.length})</span>
                    )}
                  </button>
                </div>

                {/* Comments Section */}
                <div className="space-y-3">
                  {post.comments?.map((comment) => {
                    const commentReactionSummary = getReactionSummary(comment.reactions);
                    const userCommentReactions = comment.reactions?.[userName] || [];
                    const commentReactionId = `${post.id}-${comment.id}`;

                    return (
                      <div key={comment.id} className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {comment.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 bg-slate-900/50 rounded-lg p-3">
                          <p className="text-cyan-400 font-semibold text-sm">{comment.userName}</p>
                          <p className="text-white text-sm mt-1">{parseMentions(comment.text)}</p>

                          {/* Comment Reaction Summary */}
                          {commentReactionSummary && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              {Object.entries(commentReactionSummary).map(([reactionType, count]) => {
                                const reaction = REACTIONS.find((r) => r.id === reactionType);
                                if (!reaction) return null;
                                const usersWhoReacted = getUsersWhoReacted(comment.reactions, reactionType);
                                const commentReactionKey = `${post.id}-${comment.id}-${reactionType}`;

                                return (
                                  <div
                                    key={reactionType}
                                    className="relative inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-800/50 rounded-full border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer select-none"
                                    onMouseEnter={() => setHoveredReaction(commentReactionKey)}
                                    onMouseLeave={() => setHoveredReaction(null)}
                                    onTouchStart={() => handleTouchStart(commentReactionKey)}
                                    onTouchEnd={handleTouchEnd}
                                  >
                                    <span className="text-xs">{reaction.emoji}</span>
                                    <span className="text-slate-300 text-xs font-semibold">{count}</span>

                                    {/* Tooltip showing who reacted */}
                                    {hoveredReaction === commentReactionKey && (
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-900 border-2 border-slate-700 rounded-lg shadow-xl z-30 whitespace-nowrap pointer-events-none">
                                        <div className="text-xs font-semibold text-slate-400 mb-1">{reaction.label}</div>
                                        <div className="space-y-0.5 max-h-24 overflow-y-auto">
                                          {usersWhoReacted.map((user, idx) => (
                                            <div key={idx} className="text-xs text-white">
                                              {user === userName ? 'You' : user}
                                            </div>
                                          ))}
                                        </div>
                                        {/* Arrow */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-700"></div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-slate-500 text-xs">{formatTime(comment.timestamp)}</p>

                            {/* React Button for Comments */}
                            <div className="relative">
                              <button
                                onClick={() => setShowCommentReactions(showCommentReactions === commentReactionId ? null : commentReactionId)}
                                className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors text-xs font-semibold"
                              >
                                <ThumbsUp className={`w-3 h-3 ${userCommentReactions.length > 0 ? "text-cyan-400 fill-cyan-400" : ""}`} />
                                <span>React</span>
                              </button>

                              {/* Comment Reactions Picker */}
                              {showCommentReactions === commentReactionId && (
                                <div className="absolute bottom-full left-0 mb-2 bg-slate-900 rounded-lg border-2 border-slate-700 shadow-xl z-20 min-w-60 sm:max-w-none">
                                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 p-2">
                                    {REACTIONS.map((reaction) => {
                                      const hasReaction = userCommentReactions.includes(reaction.id);
                                      return (
                                        <button
                                          key={reaction.id}
                                          onClick={() => handleCommentReaction(post.id, comment.id, reaction.id)}
                                          className={`group relative p-1 rounded-lg hover:bg-slate-800 transition-all transform hover:scale-110 active:scale-95 ${
                                            hasReaction ? "bg-slate-800 ring-2 ring-cyan-400" : ""
                                          }`}
                                          title={reaction.label}
                                        >
                                          <span className="text-lg">{reaction.emoji}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="border-t border-slate-700 p-1.5">
                                    <button
                                      onClick={() => setShowCommentReactions(null)}
                                      className="w-full px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg transition-colors font-semibold"
                                    >
                                      Done
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleReplyToComment(post.id, comment.userName)}
                              className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors text-xs font-semibold"
                            >
                              <Reply className="w-3 h-3" />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      data-post-id={post.id}
                      value={commentText[post.id] || ""}
                      onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                      placeholder={userName ? "Write a comment... (Use @ to mention)" : "Enter your name to comment"}
                      disabled={!userName}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-slate-900/50 text-white rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none disabled:opacity-50 text-sm"
                      maxLength={500}
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!userName || !commentText[post.id]?.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div ref={postsEndRef} />
    </div>
  );
}
