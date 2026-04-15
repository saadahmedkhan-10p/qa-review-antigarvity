"use client";

import { useEffect, useState } from "react";
import { Activity, Filter, Download, Search, Calendar } from "lucide-react";
import Link from "next/link";

interface ActivityLog {
    id: string;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    action: string;
    entity: string | null;
    entityId: string | null;
    projectId: string | null;
    projectName: string | null;
    details: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
}

interface Project {
    id: string;
    name: string;
}

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        entity: '',
        projectId: '',
        startDate: '',
        endDate: '',
        search: '',
    });
    const [page, setPage] = useState(0);
    const limit = 50;

    // Authorization check - redirect non-admin users
    useEffect(() => {
        async function checkAuth() {
            try {
                const response = await fetch('/api/user');
                if (response.ok) {
                    const user = await response.json();
                    const roles = Array.isArray(user?.roles) ? user.roles : [];
                    const isAdmin = roles.includes('ADMIN');

                    if (!isAdmin) {
                        // Redirect non-admin users (including QA Head)
                        window.location.href = '/admin/reports';
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                window.location.href = '/admin/reports';
            }
        }

        checkAuth();
    }, []);

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        loadLogs();
    }, [page, filters]);

    async function loadProjects() {
        try {
            const response = await fetch('/api/admin/projects/list');
            if (response.ok) {
                const data = await response.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    async function loadLogs() {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: (page * limit).toString(),
            });

            if (filters.action) params.append('action', filters.action);
            if (filters.entity) params.append('entity', filters.entity);
            if (filters.projectId) params.append('projectId', filters.projectId);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await fetch(`/api/admin/activity-logs?${params}`);
            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs);
                setTotal(data.total);
            }
        } catch (error) {
            console.error('Error loading activity logs:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredLogs = logs.filter(log => {
        if (!filters.search) return true;
        const searchLower = filters.search.toLowerCase();
        return (
            log.userName?.toLowerCase().includes(searchLower) ||
            log.userEmail?.toLowerCase().includes(searchLower) ||
            log.action.toLowerCase().includes(searchLower) ||
            log.entity?.toLowerCase().includes(searchLower) ||
            log.projectName?.toLowerCase().includes(searchLower)
        );
    });

    const exportToCSV = () => {
        const headers = ['Date', 'User', 'Email', 'Action', 'Entity', 'Project', 'Details'];
        const rows = filteredLogs.map(log => [
            new Date(log.createdAt).toLocaleString(),
            log.userName || 'System',
            log.userEmail || '',
            log.action,
            log.entity || '',
            log.projectName || '',
            log.details ? JSON.stringify(JSON.parse(log.details)) : '',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell?.replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const getActionColor = (action: string) => {
        if (action.startsWith('CREATE')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        if (action.startsWith('UPDATE')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        if (action.startsWith('DELETE')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        if (action === 'LOGIN') return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                                <Activity className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                Activity Logs
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Monitor all user actions and system events
                            </p>
                        </div>
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Download className="h-5 w-5" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 transition-colors duration-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    placeholder="User, email, action, project..."
                                    className="pl-10 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white dark:bg-gray-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Project
                            </label>
                            <select
                                value={filters.projectId}
                                onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white dark:bg-gray-700"
                            >
                                <option value="">All Projects</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Action
                            </label>
                            <select
                                value={filters.action}
                                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white dark:bg-gray-700"
                            >
                                <option value="">All Actions</option>
                                <option value="LOGIN">Login</option>
                                <option value="CREATE_PROJECT">Create Project</option>
                                <option value="UPDATE_PROJECT">Update Project</option>
                                <option value="DELETE_PROJECT">Delete Project</option>
                                <option value="CREATE_REVIEW">Create Review</option>
                                <option value="SUBMIT_REVIEW">Submit Review</option>
                                <option value="CREATE_USER">Create User</option>
                                <option value="DELETE_USER">Delete User</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Entity
                            </label>
                            <select
                                value={filters.entity}
                                onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white dark:bg-gray-700"
                            >
                                <option value="">All Entities</option>
                                <option value="Project">Project</option>
                                <option value="Review">Review</option>
                                <option value="User">User</option>
                                <option value="Comment">Comment</option>
                                <option value="Form">Form</option>
                                <option value="ContactPerson">Contact Person</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white dark:bg-gray-700"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white dark:bg-gray-700"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Activities</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{total}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Filtered Results</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{filteredLogs.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Current Page</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{page + 1}</p>
                    </div>
                </div>

                {/* Activity Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Action
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Project
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Entity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Details
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                                            <p className="text-gray-600 dark:text-gray-400">Loading activity logs...</p>
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500 dark:text-gray-400">No activity logs found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {log.userName || 'System'}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {log.userEmail}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {log.projectName || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {log.entity || '-'}
                                                {log.entityId && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        ID: {log.entityId.substring(0, 8)}...
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {log.details ? (
                                                    <details className="cursor-pointer">
                                                        <summary className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                                            View details
                                                        </summary>
                                                        <div className="mt-2 text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded max-w-md">
                                                            {(() => {
                                                                try {
                                                                    // Handle both string and object types for log.details
                                                                    const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                                                                    
                                                                    if (details.changes && typeof details.changes === 'object') {
                                                                        const changes = details.changes;
                                                                        if (Object.keys(changes).length === 0) {
                                                                            return <div className="text-gray-500 dark:text-gray-400">No changes detected</div>;
                                                                        }
                                                                        return (
                                                                            <div className="space-y-2">
                                                                                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Changes:</div>
                                                                                {Object.entries(changes).map(([key, value]: [string, any]) => (
                                                                                    <div key={key} className="border-l-2 border-indigo-500 pl-2">
                                                                                        <div className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
                                                                                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                                                                                        </div>
                                                                                        {value && typeof value === 'object' && 'from' in value && 'to' in value ? (
                                                                                            <div className="ml-2 text-gray-600 dark:text-gray-400">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <span className="text-red-600 dark:text-red-400">From:</span>
                                                                                                    <span className="font-mono">{typeof value.from === 'object' ? JSON.stringify(value.from) : String(value.from || '(empty)')}</span>
                                                                                                </div>
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <span className="text-green-600 dark:text-green-400">To:</span>
                                                                                                    <span className="font-mono">{typeof value.to === 'object' ? JSON.stringify(value.to) : String(value.to || '(empty)')}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="ml-2 text-gray-600 dark:text-gray-400">
                                                                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <div className="space-y-1">
                                                                            {Object.entries(details).map(([key, value]) => (
                                                                                <div key={key}>
                                                                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                                                        {key}:
                                                                                    </span>{' '}
                                                                                    <span className="text-gray-600 dark:text-gray-400">
                                                                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                } catch (e) {
                                                                    return <pre className="whitespace-pre-wrap">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</pre>;
                                                                }
                                                            })()}
                                                        </div>
                                                    </details>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && total > limit && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} results
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(Math.max(0, page - 1))}
                                    disabled={page === 0}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={(page + 1) * limit >= total}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
