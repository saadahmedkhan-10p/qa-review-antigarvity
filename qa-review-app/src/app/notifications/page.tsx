"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Bell, Check, ExternalLink, Calendar, AlertTriangle,
    MessageSquare, AtSign, UserCheck, ClipboardList, Info
} from "lucide-react";
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

type FilterTab = "ALL" | "UNREAD" | "COMMENTS" | "ALERTS" | "ASSIGNMENTS";

const TABS: { id: FilterTab; label: string }[] = [
    { id: "ALL",         label: "All" },
    { id: "UNREAD",      label: "Unread" },
    { id: "COMMENTS",    label: "Comments & Mentions" },
    { id: "ALERTS",      label: "AI Alerts" },
    { id: "ASSIGNMENTS", label: "Assignments" },
];

function getIcon(type: string) {
    switch (type) {
        case "MENTION":          return <AtSign        className="h-5 w-5 text-blue-400" />;
        case "COMMENT":          return <MessageSquare className="h-5 w-5 text-sky-400" />;
        case "AI_ALERT":         return <AlertTriangle className="h-5 w-5 text-amber-500" />;
        case "REVIEW_ASSIGNED":  return <UserCheck     className="h-5 w-5 text-indigo-500" />;
        case "REVIEW_SUBMITTED": return <ClipboardList className="h-5 w-5 text-green-500" />;
        case "REVIEW_SCHEDULED": return <Calendar      className="h-5 w-5 text-violet-500" />;
        case "ASSIGNMENT":       return <UserCheck     className="h-5 w-5 text-indigo-500" />;
        default:                 return <Info          className="h-5 w-5 text-gray-400" />;
    }
}

function getTypeBadgeColor(type: string) {
    switch (type) {
        case "MENTION":          return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
        case "COMMENT":          return "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20";
        case "AI_ALERT":         return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20";
        case "REVIEW_ASSIGNED":  return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20";
        case "REVIEW_SUBMITTED": return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
        case "REVIEW_SCHEDULED": return "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20";
        default:                 return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800";
    }
}

function formatType(type: string) {
    return type.replace(/_/g, " ");
}

function matchesTab(type: string, tab: FilterTab): boolean {
    if (tab === "ALL")         return true;
    if (tab === "COMMENTS")    return type === "COMMENT" || type === "MENTION";
    if (tab === "ALERTS")      return type === "AI_ALERT";
    if (tab === "ASSIGNMENTS") return type === "REVIEW_ASSIGNED" || type === "REVIEW_SCHEDULED" || type === "REVIEW_SUBMITTED" || type === "ASSIGNMENT";
    return false; // UNREAD handled separately
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications?all=true");
            if (res.ok) {
                setNotifications(await res.json());
            }
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications?id=${id}`, { method: "PATCH" });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            }
        } catch (err) { console.error("Error marking read:", err); }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch("/api/notifications?all=true", { method: "PATCH" });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }
        } catch (err) { console.error("Error marking all read:", err); }
    };

    const filtered = useMemo(() => {
        if (activeTab === "UNREAD") return notifications.filter(n => !n.read);
        return notifications.filter(n => matchesTab(n.type, activeTab));
    }, [notifications, activeTab]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const tabCount = (tab: FilterTab) => {
        if (tab === "ALL")    return notifications.length;
        if (tab === "UNREAD") return unreadCount;
        return notifications.filter(n => matchesTab(n.type, tab)).length;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                            Notifications
                        </h1>
                        <p className="text-base text-gray-500 dark:text-gray-400">
                            Your activity feed — all events in one place
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                        >
                            <Check className="h-4 w-4" />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 p-1 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm mb-6 overflow-x-auto">
                    {TABS.map(tab => {
                        const count = tabCount(tab.id);
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                            >
                                {tab.label}
                                {count > 0 && (
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                        isActive
                                            ? "bg-white/20 text-white"
                                            : tab.id === "UNREAD"
                                                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* List */}
                <div className="bg-white dark:bg-gray-800/60 rounded-3xl shadow-xl shadow-indigo-100/10 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="p-16 text-center">
                            <div className="h-8 w-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading notifications…</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="h-20 w-20 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Bell className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">All caught up!</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm">
                                {activeTab === "UNREAD"
                                    ? "No unread notifications right now."
                                    : "Nothing here yet. We'll alert you when something happens."}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                            {filtered.map(n => (
                                <div
                                    key={n.id}
                                    className={`p-5 relative transition-all duration-200 group ${
                                        !n.read
                                            ? "bg-indigo-50/30 dark:bg-indigo-900/10 hover:bg-indigo-50/50"
                                            : "hover:bg-gray-50 dark:hover:bg-gray-700/30 opacity-80 hover:opacity-100"
                                    }`}
                                >
                                    {/* Unread stripe */}
                                    {!n.read && (
                                        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-indigo-500 rounded-r-full" />
                                    )}

                                    <div className="flex gap-4">
                                        {/* Icon */}
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                            !n.read
                                                ? "bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600"
                                                : "bg-gray-100 dark:bg-gray-700/50"
                                        }`}>
                                            {getIcon(n.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug ${
                                                !n.read
                                                    ? "text-gray-900 dark:text-white font-semibold"
                                                    : "text-gray-600 dark:text-gray-400"
                                            }`}>
                                                {n.message}
                                            </p>

                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                </span>
                                                <span className="h-1 w-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${getTypeBadgeColor(n.type)}`}>
                                                    {formatType(n.type)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {n.link && (
                                                <Link
                                                    href={n.link}
                                                    onClick={() => !n.read && markAsRead(n.id)}
                                                    className="h-9 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-600 hover:text-white transition-all"
                                                >
                                                    View <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            )}
                                            {!n.read && (
                                                <button
                                                    onClick={() => markAsRead(n.id)}
                                                    title="Mark as read"
                                                    className="h-9 w-9 rounded-lg border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center transition-all"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="text-sm font-bold text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </main>
        </div>
    );
}
