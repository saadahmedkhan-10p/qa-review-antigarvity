"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Users, FolderKanban, FileText, TrendingUp } from "lucide-react";

export default function QAManagerDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalReviews: 0,
        pendingReviews: 0,
        completedReviews: 0,
        totalReviewers: 0,
        activeForms: 0
    });
    const [recentReviews, setRecentReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState<'ALL' | 'MANUAL' | 'AUTOMATION_WEB' | 'AUTOMATION_MOBILE' | 'API' | 'DESKTOP'>('ALL');

    useEffect(() => {
        async function loadData() {
            if (!authLoading && user) {
                try {
                    // Fetch dashboard data
                    const response = await fetch('/api/qa-manager/dashboard');
                    if (response.ok) {
                        const data = await response.json();
                        setStats(data.stats);
                        setRecentReviews(data.recentReviews || []);
                    }
                } catch (error) {
                    console.error("Error loading QA Manager dashboard:", error);
                } finally {
                    setLoading(false);
                }
            } else if (!authLoading) {
                setLoading(false);
            }
        }
        loadData();
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                {/* Header and Filter */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">QA Manager Dashboard</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage all QA operations and oversee review processes</p>
                    </div>

                    <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl shadow-inner transition-colors">
                        <button
                            onClick={() => setActiveType('ALL')}
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${activeType === 'ALL'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            ALL
                        </button>
                        <button
                            onClick={() => setActiveType('MANUAL')}
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${activeType === 'MANUAL'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            MANUAL
                        </button>
                        <button
                            onClick={() => setActiveType('AUTOMATION_WEB')}
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${activeType === 'AUTOMATION_WEB'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            WEB AUTO
                        </button>
                        <button
                            onClick={() => setActiveType('AUTOMATION_MOBILE')}
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${activeType === 'AUTOMATION_MOBILE'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            MOB AUTO
                        </button>
                        <button
                            onClick={() => setActiveType('API')}
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${activeType === 'API'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            API
                        </button>
                        <button
                            onClick={() => setActiveType('DESKTOP')}
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${activeType === 'DESKTOP'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            DESKTOP
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalProjects}</p>
                            </div>
                            <FolderKanban className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalReviews}</p>
                            </div>
                            <FileText className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Reviews</p>
                                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.pendingReviews}</p>
                            </div>
                            <TrendingUp className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Completed Reviews</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.completedReviews}</p>
                            </div>
                            <BarChart3 className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Reviewers</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalReviewers}</p>
                            </div>
                            <Users className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Forms</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.activeForms}</p>
                            </div>
                            <FileText className="h-12 w-12 text-cyan-600 dark:text-cyan-400" />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8 transition-colors duration-200">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link
                            href="/admin/projects"
                            className="p-4 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-center"
                        >
                            <FolderKanban className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">Manage Projects</p>
                        </Link>

                        <Link
                            href="/admin/reports"
                            className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
                        >
                            <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">View Reports</p>
                        </Link>

                        <Link
                            href="/admin/forms"
                            className="p-4 border-2 border-cyan-200 dark:border-cyan-800 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors text-center"
                        >
                            <FileText className="h-8 w-8 text-cyan-600 dark:text-cyan-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">Manage Forms</p>
                        </Link>

                        <Link
                            href="/admin/users"
                            className="p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-center"
                        >
                            <Users className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">View Users</p>
                        </Link>
                    </div>
                </div>

                {/* Recent Reviews */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Reviews</h2>
                    </div>
                    <div className="p-6">
                        {recentReviews.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No recent reviews</p>
                        ) : (
                            <div className="space-y-4">
                                {recentReviews
                                    .filter((r: any) => activeType === 'ALL' || r.project?.type === activeType)
                                    .slice(0, 5).map((review: any) => (
                                        <div key={review.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">{review.project?.name || 'Unknown Project'}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{review.form?.title || 'Unknown Form'}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${review.status === 'SUBMITTED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    review.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        review.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                            review.status === 'DEFERRED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                                review.status === 'ON_HOLD' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {review.status}
                                                </span>
                                                {review.status === 'SUBMITTED' && (
                                                    <Link
                                                        href={`/reviews/${review.id}/view`}
                                                        className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
                                                    >
                                                        View Details
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
