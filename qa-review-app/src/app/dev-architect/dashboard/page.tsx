"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Code2, FileText, MessageSquare, TrendingUp } from "lucide-react";

export default function DevArchitectDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [reviews, setReviews] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalReviews: 0,
        technicalReviews: 0,
        architectureIssues: 0,
        commentsProvided: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!authLoading && user) {
                try {
                    const response = await fetch('/api/dev-architect/dashboard');
                    if (response.ok) {
                        const data = await response.json();
                        setReviews(data.reviews || []);
                        setStats(data.stats);
                    }
                } catch (error) {
                    console.error("Error loading Dev Architect dashboard:", error);
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dev Architect Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Review technical aspects and provide architectural guidance</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalReviews}</p>
                            </div>
                            <FileText className="h-12 w-12 text-teal-600 dark:text-teal-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Technical Reviews</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.technicalReviews}</p>
                            </div>
                            <Code2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Architecture Issues</p>
                                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{stats.architectureIssues}</p>
                            </div>
                            <TrendingUp className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Comments Provided</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.commentsProvided}</p>
                            </div>
                            <MessageSquare className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-6 mb-8">
                    <div className="flex items-start gap-4">
                        <Code2 className="h-6 w-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-semibold text-teal-900 dark:text-teal-100 mb-2">Your Role as Dev Architect</h3>
                            <p className="text-sm text-teal-800 dark:text-teal-200">
                                You have read-only access to all reviews. Focus on providing technical and architectural feedback
                                on completed reviews. Your insights help improve code quality and system design.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8 transition-colors duration-200">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                            href="/admin/reports"
                            className="p-4 border-2 border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-center"
                        >
                            <TrendingUp className="h-8 w-8 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">View Reports</p>
                        </Link>

                        <div className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">All Reviews</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current Page</p>
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">All Reviews</h2>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 text-sm bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 rounded-md">
                                All
                            </button>
                            <button className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                Completed
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        {reviews.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No reviews available</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Reviews will appear here once they are created</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map((review: any) => (
                                    <div key={review.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">{review.project?.name || 'Unknown Project'}</h3>
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${review.status === 'SUBMITTED' ? 'bg-green-600 text-white' :
                                                        review.status === 'SCHEDULED' ? 'bg-blue-600 text-white' :
                                                            'bg-yellow-400 text-gray-900'
                                                        }`}>
                                                        {review.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                    Form: {review.form?.title || 'Unknown Form'}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Reviewer: {review.reviewer?.name || 'Unknown'}
                                                </p>
                                                {review.submittedDate && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                        Submitted: {format(new Date(review.submittedDate), 'MMM d, yyyy')}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {review.status === 'SUBMITTED' && (
                                                    <Link
                                                        href={`/reviews/${review.id}/view`}
                                                        className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm font-medium text-center transition-colors"
                                                    >
                                                        View & Comment
                                                    </Link>
                                                )}
                                                <Link
                                                    href={`/admin/reports/project/${review.projectId}`}
                                                    className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm font-medium text-center transition-colors"
                                                >
                                                    Project Report
                                                </Link>
                                                {review.status !== 'SUBMITTED' && (
                                                    <span className="px-4 py-2 bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rounded-md text-sm text-center">
                                                        Not Available
                                                    </span>
                                                )}
                                            </div>
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
