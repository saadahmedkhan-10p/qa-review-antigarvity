"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, TrendingUp, FolderKanban, Users, FileText, Download } from "lucide-react";
import * as XLSX from 'xlsx';

export default function DirectorDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalReviews: 0,
        completionRate: 0,
        activeReviewers: 0,
        pendingReviews: 0,
        completedThisMonth: 0
    });
    const [projectSummary, setProjectSummary] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState<'ALL' | 'MANUAL' | 'AUTOMATION_WEB' | 'AUTOMATION_MOBILE' | 'API' | 'DESKTOP'>('ALL');

    useEffect(() => {
        async function loadData() {
            if (!authLoading && user) {
                try {
                    const response = await fetch('/api/director/dashboard');
                    if (response.ok) {
                        const data = await response.json();
                        setStats(data.stats);
                        setProjectSummary(data.projectSummary || []);
                    }
                } catch (error) {
                    console.error("Error loading Director dashboard:", error);
                } finally {
                    setLoading(false);
                }
            } else if (!authLoading) {
                setLoading(false);
            }
        }
        loadData();
    }, [user, authLoading]);

    const exportReport = () => {
        const wb = XLSX.utils.book_new();

        // Summary sheet
        const summaryData = [
            ['QA Operations Executive Report'],
            ['Generated:', new Date().toLocaleString()],
            [''],
            ['Key Metrics'],
            ['Total Projects', stats.totalProjects],
            ['Total Reviews', stats.totalReviews],
            ['Completion Rate', `${stats.completionRate}%`],
            ['Active Reviewers', stats.activeReviewers],
            ['Pending Reviews', stats.pendingReviews],
            ['Completed This Month', stats.completedThisMonth],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

        // Project details sheet
        const projectData = [
            ['Project', 'Total Reviews', 'Completed', 'Pending', 'Status'],
            ...projectSummary.map(p => [
                p.name,
                p.totalReviews,
                p.completed,
                p.pending,
                p.completed === p.totalReviews ? 'Complete' : 'In Progress'
            ])
        ];
        const projectSheet = XLSX.utils.aoa_to_sheet(projectData);
        XLSX.utils.book_append_sheet(wb, projectSheet, 'Projects');

        XLSX.writeFile(wb, `director-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportAnalytics = () => {
        const wb = XLSX.utils.book_new();

        // Analytics overview
        const analyticsData = [
            ['QA Analytics Report'],
            ['Generated:', new Date().toLocaleString()],
            [''],
            ['Performance Metrics'],
            ['Metric', 'Value'],
            ['Total Projects', stats.totalProjects],
            ['Total Reviews', stats.totalReviews],
            ['Overall Completion Rate', `${stats.completionRate}%`],
            ['Active Reviewers', stats.activeReviewers],
            ['Pending Reviews', stats.pendingReviews],
            ['Completed This Month', stats.completedThisMonth],
            [''],
            ['Project Performance'],
            ['Project Name', 'Total Reviews', 'Completed', 'Pending', 'Completion %', 'Status'],
            ...projectSummary.map(p => [
                p.name,
                p.totalReviews,
                p.completed,
                p.pending,
                p.totalReviews > 0 ? `${Math.round((p.completed / p.totalReviews) * 100)}%` : '0%',
                p.completed === p.totalReviews ? 'Complete' : 'In Progress'
            ])
        ];
        const analyticsSheet = XLSX.utils.aoa_to_sheet(analyticsData);
        XLSX.utils.book_append_sheet(wb, analyticsSheet, 'Analytics');

        XLSX.writeFile(wb, `qa-analytics-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                {/* Header and Filter */}
                <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Director Dashboard</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Executive overview of QA operations</p>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl shadow-inner transition-colors">
                            <button
                                onClick={() => setActiveType('ALL')}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${activeType === 'ALL'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                ALL
                            </button>
                            <button
                                onClick={() => setActiveType('MANUAL')}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${activeType === 'MANUAL'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                MANUAL
                            </button>
                            <button
                                onClick={() => setActiveType('AUTOMATION_WEB')}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${activeType === 'AUTOMATION_WEB'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                WEB AUTO
                            </button>
                            <button
                                onClick={() => setActiveType('AUTOMATION_MOBILE')}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${activeType === 'AUTOMATION_MOBILE'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                MOB AUTO
                            </button>
                            <button
                                onClick={() => setActiveType('API')}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${activeType === 'API'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                API
                            </button>
                            <button
                                onClick={() => setActiveType('DESKTOP')}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${activeType === 'DESKTOP'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                DESKTOP
                            </button>
                        </div>

                        <button
                            onClick={exportReport}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                        >
                            <Download className="h-5 w-5" />
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-lg shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-rose-100 text-sm">Total Projects</p>
                                <p className="text-4xl font-bold mt-2">{stats.totalProjects}</p>
                            </div>
                            <FolderKanban className="h-14 w-14 text-rose-200" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Total Reviews</p>
                                <p className="text-4xl font-bold mt-2">{stats.totalReviews}</p>
                            </div>
                            <FileText className="h-14 w-14 text-blue-200" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Completion Rate</p>
                                <p className="text-4xl font-bold mt-2">{stats.completionRate}%</p>
                            </div>
                            <TrendingUp className="h-14 w-14 text-green-200" />
                        </div>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Reviewers</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.activeReviewers}</p>
                            </div>
                            <Users className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Reviews</p>
                                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.pendingReviews}</p>
                            </div>
                            <BarChart3 className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Completed This Month</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.completedThisMonth}</p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8 transition-colors duration-200">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Access</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            href="/admin/reports"
                            className="p-4 border-2 border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-center"
                        >
                            <BarChart3 className="h-8 w-8 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">View All Reports</p>
                        </Link>

                        <Link
                            href="/admin/projects"
                            className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
                        >
                            <FolderKanban className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">View Projects</p>
                        </Link>

                        <button
                            onClick={exportAnalytics}
                            className="p-4 border-2 border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-center"
                        >
                            <Download className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">Export Analytics</p>
                        </button>
                    </div>
                </div>

                {/* Project Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Project Overview</h2>
                    </div>
                    <div className="p-6">
                        {projectSummary.length === 0 ? (
                            <div className="text-center py-12">
                                <FolderKanban className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No projects available</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Project
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Total Reviews
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Completed
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Pending
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {projectSummary
                                            .filter((p: any) => activeType === 'ALL' || p.type === activeType)
                                            .map((project: any) => (
                                                <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white">{project.totalReviews}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">{project.completed}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">{project.pending}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${project.completed === project.totalReviews
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                            }`}>
                                                            {project.completed === project.totalReviews ? 'Complete' : 'In Progress'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
