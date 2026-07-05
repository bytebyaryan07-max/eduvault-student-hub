import React, { useState, useEffect } from "react";
import { MessageSquare, Star, Send, Trash2, Calendar, User } from "lucide-react";
import { Comment, UserProfile } from "../types";
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

interface CommentsSectionProps {
  resourceId: string;
  currentUser: UserProfile | null;
}

export default function CommentsSection({ resourceId, currentUser }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments from Firestore
  const fetchComments = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "resources", resourceId, "comments"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const commentsList: Comment[] = [];
      querySnapshot.forEach((doc) => {
        commentsList.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(commentsList);
    } catch (err) {
      console.error("Error fetching comments from Firestore:", err);
      // Local fallback comments for system-seed resources if cloud has none yet
      if (resourceId.startsWith("res-")) {
        setComments([
          {
            id: "comment-1",
            resourceId,
            userId: "system-seed-user-1",
            userName: "Rohan Gupta",
            text: "This is exactly what was asked in last year's papers! Thanks a lot for uploading.",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            rating: 5
          },
          {
            id: "comment-2",
            resourceId,
            userId: "system-seed-user-2",
            userName: "Aditi Roy",
            text: "Very clean notes. Found a small typo in Page 2, but overall highly recommended for finals.",
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            rating: 4
          }
        ]);
      } else {
        setComments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [resourceId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setSubmitting(true);
    try {
      const commentData = {
        resourceId,
        userId: currentUser.id,
        userName: currentUser.displayName,
        text: newComment,
        createdAt: new Date().toISOString(),
        rating: rating
      };

      if (auth.currentUser && !auth.currentUser.isAnonymous) {
        const docRef = await addDoc(collection(db, "resources", resourceId, "comments"), commentData);
        setComments((prev) => [{ id: docRef.id, ...commentData } as Comment, ...prev]);
      } else {
        // Guest mode fallback
        const mockComment: Comment = {
          id: "local-" + Math.random().toString(),
          resourceId,
          userId: currentUser.id,
          userName: currentUser.displayName,
          text: newComment,
          createdAt: new Date().toISOString(),
          rating: rating
        };
        setComments((prev) => [mockComment, ...prev]);
        alert("Review added successfully to your session! Log in with Google to share it with the community.");
      }
      setNewComment("");
      setRating(5);
    } catch (err) {
      console.error("Error adding comment to Firestore:", err);
      alert("Failed to submit review. Using local session mode instead.");
      // Session fallback addition
      const mockComment: Comment = {
        id: "local-" + Math.random().toString(),
        resourceId,
        userId: currentUser.id,
        userName: currentUser.displayName,
        text: newComment,
        createdAt: new Date().toISOString(),
        rating: rating
      };
      setComments((prev) => [mockComment, ...prev]);
      setNewComment("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;

    try {
      await deleteDoc(doc(db, "resources", resourceId, "comments", commentId));
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
      // Fallback
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-indigo-600" />
        <h3 className="text-base font-bold text-gray-900">Student Reviews & Discussions</h3>
      </div>

      {/* Review Form */}
      {currentUser ? (
        <form onSubmit={handleAddComment} className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Write a Review</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 mr-1">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-0.5 text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star className="w-4 h-4" fill={star <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Help other students! Share what you liked, found useful, or potential improvements..."
            rows={3}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white resize-none"
            required
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Send className="w-3 h-3" />
              <span>{submitting ? "Posting..." : "Post Review"}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500">
            Please log in or setup your student profile to contribute reviews.
          </p>
        </div>
      )}

      {/* List comments */}
      {loading && comments.length === 0 ? (
        <div className="space-y-2">
          <div className="h-10 bg-gray-50 rounded animate-pulse" />
          <div className="h-10 bg-gray-50 rounded animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white border border-gray-100 rounded-xl p-4 flex gap-3 hover:border-gray-150 transition-all">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {comment.userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{comment.userName}</h4>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(comment.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {comment.rating && (
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: comment.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3" fill="currentColor" />
                        ))}
                      </div>
                    )}
                    {currentUser && currentUser.id === comment.userId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-gray-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                        title="Delete review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-2 leading-relaxed">{comment.text}</p>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400">No reviews yet. Be the first to rate and share your thoughts!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
