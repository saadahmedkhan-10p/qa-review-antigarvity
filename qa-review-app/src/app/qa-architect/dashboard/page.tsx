"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, BarChart3, Shield, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";

export default function QAArchitectDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState({
        totalForms: 0,
        activeForms: 0,
        totalReviews: 0,
        qualityScore: 0,
        standardsCompliance: 0,
        criticalIssues: 0
    });
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState<'ALL' | 'MANUAL' | 'AUTOMATION_WEB' | 'AUTOMATION_MOBILE' | 'API' | 'DESKTOP'>('ALL');

    useEffect(() => {
        async function loadData() {
            if (!authLoading && user) {
                try {
                    const response = await fetch('/api/qa-architect/dashboard');
                    if (response.ok) {
                        const data = await response.json();
                        setStats(data.stats);
                        setForms(data.forms || []);
                    }
                } catch (error) {
                    console.error("Error loading QA Architect dashboard:", error);
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">QA Architect Dashboard</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Define QA standards and oversee quality processes</p>
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
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Forms</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalForms}</p>
                            </div>
                            <FileText className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Forms</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.activeForms}</p>
                            </div>
                            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalReviews}</p>
                            </div>
                            <BarChart3 className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Quality Score</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.qualityScore}%</p>
                            </div>
                            <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Standards Compliance</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.standardsCompliance}%</p>
                            </div>
                            <TrendingUp className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Critical Issues</p>
                                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.criticalIssues}</p>
                            </div>
                            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8 transition-colors duration-200">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Link
                            href="/admin/forms"
                            className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
                        >
                            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">Manage Forms</p>
                        </Link>

                        {(user?.roles?.includes("ADMIN") || !user?.roles?.includes("QA_HEAD")) && (
                            <Link
                                href="/admin/forms/create"
                                className="p-4 border-2 border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-center"
                            >
                                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                                <p className="font-medium text-gray-900 dark:text-white">Create New Form</p>
                            </Link>
                        )}

                        <Link
                            href="/admin/reports"
                            className="p-4 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-center"
                        >
                            <BarChart3 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                            <p className="font-medium text-gray-900 dark:text-white">View Analytics</p>
                        </Link>
                    </div>
                </div>

                {/* Review Forms */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Review Forms</h2>
                    </div>
                    <div className="p-6">
                        {forms.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No forms created yet</p>
                                {(user?.roles?.includes("ADMIN") || !user?.roles?.includes("QA_HEAD")) && (
                                    <Link
                                        href="/admin/forms/create"
                                        className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Create your first form
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {forms
                                    .filter((f: any) => activeType === 'ALL' || f.type === activeType)
                                    .map((form: any) => (
                                        <div
                                            key={form.id}
                                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-900 dark:text-white">{form.title}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {(() => {
                                                            const qs = typeof form.questions === 'string' ? JSON.parse(form.questions || "[]") : (form.questions || []);
                                                            return qs.length;
                                                        })()} questions
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${form.isActive
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {form.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="mt-4 flex gap-2">
                                                <Link
                                                    href={`/admin/forms/${form.id}/edit`}
                                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    Edit
                                                </Link>
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
