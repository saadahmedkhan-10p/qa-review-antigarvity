"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getLeadProjects } from "@/app/actions/lead";
import { format } from "date-fns";
import { getUsers } from "@/app/actions/admin";
import Link from "next/link";
import { FolderKanban, FileText, BarChart3, CheckCircle2, Clock, Calendar, AlertCircle, XCircle } from "lucide-react";
import { useMemo } from "react";

export default function LeadDashboard() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState<'ALL' | 'MANUAL' | 'AUTOMATION_WEB' | 'AUTOMATION_MOBILE' | 'API' | 'DESKTOP'>('ALL');

    useEffect(() => {
        async function loadData() {
            if (user) {
                // Get the actual user from database by email
                const users = await getUsers();
                const dbUser = users.find((u: any) => u.email === user.email);

                if (dbUser) {
                    const projectData = await getLeadProjects(dbUser.id);
                    setProjects(projectData);
                }
                setLoading(false);
            }
        }
        loadData();
    }, [user]);

    const stats = useMemo(() => {
        const filteredProjects = projects.filter(p => activeType === 'ALL' || p.type === activeType);
        const allReviews = filteredProjects.flatMap(p => p.reviews || []);

        return {
            total: allReviews.length,
            submitted: allReviews.filter(r => r.status === 'SUBMITTED').length,
            scheduled: allReviews.filter(r => r.status === 'SCHEDULED').length,
            pending: allReviews.filter(r => r.status === 'PENDING').length,
            deferred: allReviews.filter(r => r.status === 'DEFERRED').length,
            projectEnded: allReviews.filter(r => r.status === 'PROJECT_ENDED' || r.status === 'ON_HOLD').length
        };
    }, [projects, activeType]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex items-center justify-center transition-colors duration-200">
                <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Review Lead Dashboard</h1>

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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Reviews</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Submitted</p>
                        <p className="text-2xl font-black text-green-600 dark:text-green-400 mt-1">{stats.submitted}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Scheduled</p>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{stats.scheduled}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Pending</p>
                        <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">{stats.pending}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Deferred</p>
                        <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{stats.deferred}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project Ended</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.projectEnded}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8 transition-colors duration-200">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border-2 border-cyan-200 dark:border-cyan-800 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-center">
                            <FolderKanban className="h-8 w-8 text-cyan-600 dark:text-cyan-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">My Projects</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current Page</p>
                        </div>

                        <Link
                            href="/reviewer/dashboard"
                            className="p-4 border-2 border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-center"
                        >
                            <FileText className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">My Reviews</p>
                        </Link>

                    </div>
                </div>

                {projects.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center transition-colors duration-200">
                        <p className="text-gray-600 dark:text-gray-400">No projects assigned yet.</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Contact your admin to assign you to projects.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {projects
                            .filter((p: any) => activeType === 'ALL' || p.type === activeType)
                            .map((project) => (
                                <div key={project.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{project.name}</h2>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Review Cycle</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reviewer</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Secondary Reviewer</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Health</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Scheduled</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {project.reviews.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No reviews initiated yet.</td>
                                                    </tr>
                                                ) : (
                                                    project.reviews.map((review: any) => (
                                                        <tr key={review.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{review.form.title}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{review.reviewer.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{review.secondaryReviewer?.name || 'N/A'}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-tight ${review.status === 'NOT_COMPLETED' ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' :
                                                                    review.healthStatus === 'On Track' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                                        review.healthStatus === 'Slightly Challenged' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                            review.healthStatus === 'Extremely Challenged' || review.healthStatus === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                                    }`}>
                                                                    {review.status === 'NOT_COMPLETED' ? '-' : (review.healthStatus || 'N/A')}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${review.status === 'SUBMITTED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                                    review.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                        review.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                            review.status === 'DEFERRED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                                                review.status === 'ON_HOLD' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                                                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                                    }`}>
                                                                    {review.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                {review.scheduledDate ? format(new Date(review.scheduledDate), 'MMM d, yyyy') : '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                {review.submittedDate ? format(new Date(review.submittedDate), 'MMM d, yyyy') : '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                {review.status === 'SUBMITTED' && (
                                                                    <Link
                                                                        href={`/reviews/${review.id}/view`}
                                                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium"
                                                                    >
                                                                        View Details
                                                                    </Link>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
