"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, FileText, Clock, CheckCircle2 } from "lucide-react";

export default function PMDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeReviews: 0,
        completedReviews: 0,
        pendingReviews: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState<'ALL' | 'MANUAL' | 'AUTOMATION_WEB' | 'AUTOMATION_MOBILE' | 'API' | 'DESKTOP'>('ALL');

    useEffect(() => {
        async function loadData() {
            if (!authLoading && user) {
                try {
                    const response = await fetch('/api/pm/dashboard');
                    if (response.ok) {
                        const data = await response.json();
                        setProjects(data.projects || []);
                        setStats(data.stats);
                    }
                } catch (error) {
                    console.error("Error loading PM dashboard:", error);
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
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
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Project Manager Dashboard</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">View project reviews and provide feedback</p>
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
                            API AUTO
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalProjects}</p>
                            </div>
                            <FolderKanban className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Reviews</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.activeReviews}</p>
                            </div>
                            <FileText className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.pendingReviews}</p>
                            </div>
                            <Clock className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.completedReviews}</p>
                            </div>
                            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8 transition-colors duration-200">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                            href="/admin/reports"
                            className="p-4 border-2 border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-center"
                        >
                            <FileText className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">View Reports</p>
                        </Link>

                        <div className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                            <FolderKanban className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">My Projects</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current Page</p>
                        </div>
                    </div>
                </div>

                {/* Projects List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">My Projects</h2>
                    </div>
                    <div className="p-6">
                        {projects.length === 0 ? (
                            <div className="text-center py-12">
                                <FolderKanban className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No projects assigned yet</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Contact your admin to get assigned to projects</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {projects
                                    .filter((p: any) => activeType === 'ALL' || p.type === activeType)
                                    .map((project: any) => (
                                        <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${project.status === 'CLOSED'
                                                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        }`}>
                                                        {project.status || 'ACTIVE'}
                                                    </span>
                                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                                        {project.reviews?.length || 0} Reviews
                                                    </span>
                                                </div>
                                            </div>

                                            {project.reviews && project.reviews.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Reviews:</h4>
                                                    <div className="space-y-2">
                                                        {project.reviews.map((review: any) => (
                                                            <div key={review.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{review.form?.title || 'Review'}</p>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                        Reviewer: {review.reviewer?.name || 'Unknown'}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${review.status === 'SUBMITTED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
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
                                                                            className="text-sm text-orange-600 dark:text-orange-400 hover:underline font-medium"
                                                                        >
                                                                            View & Comment
                                                                        </Link>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
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
