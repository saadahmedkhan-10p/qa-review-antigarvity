"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
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

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.read).length);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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
                setUnreadCount(prev => Math.max(0, prev - 1));
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
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900 animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] px-1.5 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 transition-colors relative group ${
                                            !notification.read 
                                                ? "bg-indigo-50/30 dark:bg-indigo-900/10" 
                                                : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                                                !notification.read ? "bg-indigo-600" : "bg-transparent"
                                            }`} />
                                            <div className="flex-1 space-y-1">
                                                <p className={`text-sm ${
                                                    !notification.read 
                                                        ? "text-gray-900 dark:text-white font-semibold" 
                                                        : "text-gray-600 dark:text-gray-400"
                                                }`}>
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        {notification.link && (
                                                            <Link
                                                                href={notification.link}
                                                                onClick={() => markAsRead(notification.id)}
                                                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 hover:underline"
                                                            >
                                                                View <ExternalLink className="h-2 w-2" />
                                                            </Link>
                                                        )}
                                                        {!notification.read && (
                                                            <button
                                                                onClick={() => markAsRead(notification.id)}
                                                                className="text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex items-center gap-0.5"
                                                                title="Mark as read"
                                                            >
                                                                <Check className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-center bg-gray-50/50 dark:bg-gray-800/50">
                        <Link
                            href="/notifications"
                            className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            View all activity
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
