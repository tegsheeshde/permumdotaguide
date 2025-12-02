import { useState, useEffect, useRef } from "react";
import { Image, Send, Trash2, ThumbsUp, Heart, Smile, Angry, Users, MessageCircle } from "lucide-react";
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

const REACTIONS = [
  { id: "like", icon: ThumbsUp, label: "Like", color: "text-blue-500" },
  { id: "love", icon: Heart, label: "Love", color: "text-red-500" },
  { id: "haha", icon: Smile, label: "Haha", color: "text-yellow-500" },
  { id: "angry", icon: Angry, label: "Angry", color: "text-orange-500" },
];

export default function Feed({ userName, setShowNameModal }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ content: "", imageUrl: "", videoUrl: "", type: "text" });
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showReactions, setShowReactions] = useState(null);
  const [commentText, setCommentText] = useState({});
  const postsEndRef = useRef(null);

  // Load posts from Firestore
  useEffect(() => {
    const postsCollectionRef = collection(db, "feed-posts");
    const postsQuery = query(
      postsCollectionRef,
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const loadedPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(loadedPosts);
        setIsLoadingPosts(false);
      },
      (error) => {
        console.error("Error loading posts:", error);
        setIsLoadingPosts(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Create post
  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!userName) {
      setShowNameModal(true);
      return;
    }

    if (!newPost.content.trim() && !newPost.imageUrl.trim() && !newPost.videoUrl.trim()) {
      return;
    }

    setIsSending(true);

    try {
      const postsCollectionRef = collection(db, "feed-posts");

      // Auto-convert Imgur links to direct links
      const imageUrl = newPost.imageUrl.trim() ? getImgurDirectLink(newPost.imageUrl.trim()) : "";

      await addDoc(postsCollectionRef, {
        content: newPost.content.trim(),
        imageUrl: imageUrl,
        videoUrl: newPost.videoUrl.trim(),
        type: imageUrl ? "image" : newPost.videoUrl ? "video" : "text",
        userName: userName,
        timestamp: serverTimestamp(),
        reactions: {},
        comments: [],
      });

      setNewPost({ content: "", imageUrl: "", videoUrl: "", type: "text" });
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
      setShowReactions(null);
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
          <textarea
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            placeholder={userName ? "What's on your mind?" : "Enter your name to post..."}
            disabled={!userName || isSending}
            className="w-full px-4 py-3 bg-slate-900/50 text-white rounded-lg border-2 border-slate-700 focus:border-purple-500 focus:outline-none disabled:opacity-50 resize-none"
            rows="3"
            maxLength={1000}
          />

          <div className="flex gap-2">
            <input
              type="text"
              value={newPost.imageUrl}
              onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value, videoUrl: "" })}
              placeholder="Imgur URL (e.g., https://imgur.com/abc or https://i.imgur.com/abc.jpg)"
              disabled={!userName || isSending || newPost.videoUrl}
              className="flex-1 px-4 py-2 bg-slate-900/50 text-white rounded-lg border-2 border-slate-700 focus:border-purple-500 focus:outline-none disabled:opacity-50 text-sm"
            />
            <input
              type="text"
              value={newPost.videoUrl}
              onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value, imageUrl: "" })}
              placeholder="YouTube URL (e.g., https://youtube.com/watch?v=abc)"
              disabled={!userName || isSending || newPost.imageUrl}
              className="flex-1 px-4 py-2 bg-slate-900/50 text-white rounded-lg border-2 border-slate-700 focus:border-purple-500 focus:outline-none disabled:opacity-50 text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex gap-2 text-slate-400 text-sm items-center">
                <Image className="w-4 h-4" />
                <span>Paste image URL (from Imgur, Discord, etc.)</span>
              </div>
              <p className="text-xs text-slate-500">
                Upload images to <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">Imgur</a> first, then paste the link here
              </p>
            </div>
            <button
              type="submit"
              disabled={!userName || isSending || (!newPost.content.trim() && !newPost.imageUrl && !newPost.videoUrl)}
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
                  <p className="text-white mb-3 whitespace-pre-wrap wrap-break-word">{post.content}</p>
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

                {/* Reaction Summary */}
                {reactionSummary && (
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700/50">
                    {Object.entries(reactionSummary).map(([reactionType, count]) => {
                      const reaction = REACTIONS.find((r) => r.id === reactionType);
                      if (!reaction) return null;
                      const Icon = reaction.icon;
                      return (
                        <div key={reactionType} className="flex items-center gap-1 text-sm">
                          <Icon className={`w-4 h-4 ${reaction.color}`} />
                          <span className="text-slate-400">{count}</span>
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
                      <div className="absolute bottom-full left-0 mb-2 flex gap-2 p-2 bg-slate-900 rounded-lg border border-slate-700 shadow-xl z-10">
                        {REACTIONS.map((reaction) => {
                          const Icon = reaction.icon;
                          const hasReaction = userReactions.includes(reaction.id);
                          return (
                            <button
                              key={reaction.id}
                              onClick={() => handleReaction(post.id, reaction.id)}
                              className={`p-2 rounded-lg hover:bg-slate-800 transition-all transform hover:scale-110 ${
                                hasReaction ? "bg-slate-800" : ""
                              }`}
                              title={reaction.label}
                            >
                              <Icon className={`w-6 h-6 ${reaction.color}`} />
                            </button>
                          );
                        })}
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
                  {post.comments?.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {comment.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 bg-slate-900/50 rounded-lg p-3">
                        <p className="text-cyan-400 font-semibold text-sm">{comment.userName}</p>
                        <p className="text-white text-sm mt-1">{comment.text}</p>
                        <p className="text-slate-500 text-xs mt-1">{formatTime(comment.timestamp)}</p>
                      </div>
                    </div>
                  ))}

                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText[post.id] || ""}
                      onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                      placeholder={userName ? "Write a comment..." : "Enter your name to comment"}
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
