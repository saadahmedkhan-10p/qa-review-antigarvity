"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { MessageSquare, Send, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { getRoleLabel, canCommentOnReviews, Role } from "@/types/roles";

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        roles: string;
    };
}

interface CommentsListProps {
    reviewId: string;
}

export default function CommentsList({ reviewId }: CommentsListProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");
    const [mentionIndex, setMentionIndex] = useState(-1);

    const canComment = user?.roles ? canCommentOnReviews(user.roles as Role[]) : false;

    useEffect(() => {
        fetchComments();
        fetchUsers();
    }, [reviewId]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Error fetching users for mentions:", error);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await fetch(`/api/reviews/${reviewId}/comments`);
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
            toast.error("Failed to load comments");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newComment.trim()) {
            toast.error("Please enter a comment");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/reviews/${reviewId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment })
            });

            if (response.ok) {
                const comment = await response.json();
                setComments([comment, ...comments]);
                setNewComment("");
                toast.success("Comment added successfully");
            } else {
                toast.error("Failed to add comment");
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getUserRoles = (rolesString: string) => {
        try {
            const roles = JSON.parse(rolesString);
            return roles.map((r: string) => getRoleLabel(r as any)).join(", ");
        } catch {
            return "User";
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
            <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Comments ({comments.length})
                </h3>
            </div>

            {/* Add Comment Form */}
            {user && (
                <form onSubmit={handleSubmit} className="mb-6">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="relative">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setNewComment(value);

                                        // Detect @ for mentions
                                        const lastAt = value.lastIndexOf("@");
                                        if (lastAt !== -1 && lastAt >= value.length - 20) {
                                            const query = value.substring(lastAt + 1).split(/\s/)[0];
                                            if (!value.substring(lastAt + 1).includes(" ")) {
                                                setMentionFilter(query);
                                                setShowMentions(true);
                                                return;
                                            }
                                        }
                                        setShowMentions(false);
                                    }}
                                    placeholder="Add a comment... (Use @ to mention someone)"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                    rows={3}
                                    disabled={isSubmitting}
                                />
                                
                                {showMentions && (
                                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                                        <div className="p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mention User</span>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {(() => {
                                                const filteredUsers = users
                                                    .filter(u => 
                                                        (u.name?.toLowerCase() || "").includes(mentionFilter.toLowerCase()) || 
                                                        (u.email?.toLowerCase() || "").includes(mentionFilter.toLowerCase())
                                                    )
                                                    .slice(0, 10);
                                                
                                                if (filteredUsers.length === 0) {
                                                    return (
                                                        <div className="p-4 text-center">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">No users match "{mentionFilter}"</p>
                                                            <p className="text-[10px] text-gray-400 mt-1">Available: {users.length} users</p>
                                                        </div>
                                                    );
                                                }

                                                return filteredUsers.map((u, i) => (
                                                    <button
                                                        key={u.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const lastAt = newComment.lastIndexOf("@");
                                                            const before = newComment.substring(0, lastAt);
                                                            const after = newComment.substring(lastAt).split(/\s/)[0];
                                                            const rest = newComment.substring(lastAt + after.length);
                                                            setNewComment(`${before}@${u.email.split('@')[0]} ${rest}`);
                                                            setShowMentions(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex flex-col transition-colors border-b last:border-0 dark:border-gray-700"
                                                    >
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{u.name}</span>
                                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">{u.email}</span>
                                                    </button>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newComment.trim()}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isSubmitting || !newComment.trim()
                                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                        }`}
                                >
                                    <Send className="h-4 w-4" />
                                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {/* Comments List */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No comments yet. Be the first to comment!</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                    {comment.user.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {comment.user.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {getUserRoles(comment.user.roles)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </div>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                    {comment.content.split(/(@[a-zA-Z0-9._-]+)/g).map((part, index) => {
                                        if (part.startsWith('@')) {
                                            return (
                                                <span key={index} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer">
                                                    {part}
                                                </span>
                                            );
                                        }
                                        return part;
                                    })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
