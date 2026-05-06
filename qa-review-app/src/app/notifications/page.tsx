"use client";

import { useState, useEffect } from "react";
import { Bell, Check, ExternalLink, Calendar, Info, AlertTriangle, MessageSquare } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Notification {
    id: string;
    type: string;
    message: string;
    link: string | null;
    read: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications?id=${id}`, {
                method: "PATCH",
            });
            if (res.ok) {
                setNotifications(prev => 
                    prev.map(n => n.id === id ? { ...n, read: true } : n)
                );
            }
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch("/api/notifications?all=true", {
                method: "PATCH",
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "MENTION":
                return <MessageSquare className="h-5 w-5 text-blue-400" />;
            case "AI_ALERT":
                return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case "ASSIGNMENT":
                return <Calendar className="h-5 w-5 text-indigo-500" />;
            default:
                return <Info className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Activity History</h1>
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Manage your notifications and system alerts</p>
                    </div>
                    
                    {notifications.some(n => !n.read) && (
                        <button
                            onClick={markAllAsRead}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                        >
                            <Check className="h-4 w-4" />
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-indigo-100/20 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="h-8 w-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Syncing alerts...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="h-20 w-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Bell className="h-10 w-10 text-gray-200 dark:text-gray-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">All caught up!</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">No new activity reported. We'll alert you when something important happens.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {notifications.map((notification) => (
                                <div 
                                    key={notification.id}
                                    className={`p-6 transition-all duration-200 group relative ${
                                        !notification.read 
                                            ? "bg-indigo-50/20 dark:bg-indigo-900/10" 
                                            : "opacity-80 hover:opacity-100"
                                    }`}
                                >
                                    <div className="flex gap-5">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                                            !notification.read 
                                                ? "bg-white dark:bg-gray-700 border-2 border-indigo-100 dark:border-indigo-600" 
                                                : "bg-gray-50 dark:bg-gray-700/50 border border-transparent"
                                        }`}>
                                            {getIcon(notification.type)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className={`text-base ${
                                                        !notification.read 
                                                            ? "text-gray-900 dark:text-white font-bold" 
                                                            : "text-gray-600 dark:text-gray-400"
                                                    }`}>
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                        </span>
                                                        <span className="h-1 w-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                                                        <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                                                            {notification.type.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {notification.link && (
                                                        <Link
                                                            href={notification.link}
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="h-10 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                        >
                                                            View Details
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Link>
                                                    )}
                                                    {!notification.read && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="h-10 w-10 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center transition-all"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {!notification.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="mt-8 text-center">
                    <Link 
                        href="/" 
                        className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </main>
        </div>
    );
}
