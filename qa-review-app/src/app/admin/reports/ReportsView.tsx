"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, Eye } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { TableSearch } from "@/components/TableSearch";
import { Pagination } from "@/components/Pagination";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { useTableSort } from "@/hooks/useTableSort";
import { useTableSearch } from "@/hooks/useTableSearch";
import { SortIcon } from "@/components/table/SortIcon";
import { ColumnFilter } from "@/components/table/ColumnFilter";

interface Review {
    id: string;
    status: string;
    healthStatus: string | null;
    submittedDate: string | null;
    scheduledDate: string | null;
    createdAt: string;
    updatedAt: string;
    observations: string | null;
    deferredReason: string | null;
    endedReason: string | null;
    onHoldReason: string | null;
    notCompletedReason: string | null;
    followUpComment: string | null;
    aiAnalysis: string | null;
    project: {
        id: string;
        name: string;
        type?: string;
    };
    reviewer: {
        name: string;
    } | null;
    form: {
        title: string;
    };
}

const COLORS = {
    'SUBMITTED': '#059669', // green-600
    'SCHEDULED': '#4F46E5', // indigo-600
    'PENDING': '#CA8A04',   // yellow-600
    'DEFERRED': '#DC2626',  // red-600
    'ON_HOLD': '#9333EA',   // purple-500
    'PROJECT_ENDED': '#4B5563', // gray-600
};

interface ReportsViewProps {
    reviews: Review[];
    pageTitle: string;
    typeFilter?: string;
    initialMonth?: number;
    initialYear?: number;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function ReportsView({ reviews, pageTitle, typeFilter, initialMonth, initialYear }: ReportsViewProps) {
    const { user, isManagement } = useAuth();
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(initialMonth ?? now.getMonth());
    const [selectedYear, setSelectedYear] = useState(initialYear ?? now.getFullYear());
    const [activeType, setActiveType] = useState<'ALL' | 'MANUAL' | 'AUTOMATION_WEB' | 'AUTOMATION_MOBILE' | 'API' | 'DESKTOP'>((typeFilter as any) || 'ALL');
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter reviews by selected month
    const baseFilteredReviews = useMemo(() => {
        return reviews.filter(review => {
            // Filter by type
            const projectType = review.project?.type || 'MANUAL';
            if (activeType !== 'ALL' && projectType !== activeType) return false;

            // Filter by any date available - scheduled, submitted, or created
            const reviewDate = review.scheduledDate || review.submittedDate || review.createdAt;
            if (!reviewDate) return false;

            const date = new Date(reviewDate);
            return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
        });
    }, [reviews, selectedMonth, selectedYear, activeType]);

    // Apply column filters
    const { filteredData: columnFilteredReviews, searchFilters, handleSearch } = useTableSearch(baseFilteredReviews);

    // Apply sorting
    const { sortedData, sortConfig, handleSort } = useTableSort(columnFilteredReviews);

    // Calculate stats for filtered reviews
    const stats = useMemo(() => {
        return {
            totalReviews: baseFilteredReviews.length,
            submittedReviews: baseFilteredReviews.filter(r => r.status === "SUBMITTED").length,
            pendingReviews: baseFilteredReviews.filter(r => r.status === "PENDING").length,
            scheduledReviews: baseFilteredReviews.filter(r => r.status === "SCHEDULED").length,
            deferredReviews: baseFilteredReviews.filter(r => r.status === "DEFERRED").length,
            onHoldReviews: baseFilteredReviews.filter(r => r.status === "ON_HOLD").length,
            endedReviews: baseFilteredReviews.filter(r => r.status === "PROJECT_ENDED").length,
            // Project Health Stats
            onTrack: baseFilteredReviews.filter(r => r.healthStatus === "On Track").length,
            challenged: baseFilteredReviews.filter(r => r.healthStatus === "Slightly Challenged" || r.healthStatus === "Extremely Challenged").length,
            critical: baseFilteredReviews.filter(r => r.healthStatus === "Critical").length,
        };
    }, [baseFilteredReviews]);

    const chartData = useMemo(() => {
        return [
            { name: 'Submitted', value: stats.submittedReviews, color: COLORS.SUBMITTED },
            { name: 'Scheduled', value: stats.scheduledReviews, color: COLORS.SCHEDULED },
            { name: 'Pending', value: stats.pendingReviews, color: COLORS.PENDING },
            { name: 'Deferred', value: stats.deferredReviews, color: COLORS.DEFERRED },
            { name: 'On Hold', value: stats.onHoldReviews, color: COLORS.ON_HOLD },
            { name: 'Ended', value: stats.endedReviews, color: COLORS.PROJECT_ENDED },
        ].filter(item => item.value > 0);
    }, [stats]);

    const healthChartData = useMemo(() => {
        return [
            { name: 'On Track', value: stats.onTrack, color: '#059669' },
            { name: 'Challenged', value: stats.challenged, color: '#D97706' },
            { name: 'Critical', value: stats.critical, color: '#DC2626' },
        ].filter(item => item.value > 0);
    }, [stats]);

    const goToPreviousMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'SUBMITTED':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'SCHEDULED':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'DEFERRED':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'ON_HOLD':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'PROJECT_ENDED':
                return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getHealthBadgeClass = (health: string | null) => {
        switch (health) {
            case 'On Track':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'Slightly Challenged':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'Extremely Challenged':
            case 'Critical':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'Deferred':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white shrink-0 mr-2">{pageTitle}</h1>

                        {/* Filter Type Group */}
                        <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl shadow-inner transition-colors shrink-0">
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
                                API AUTO
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
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <MonthYearPicker
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                            onChange={(m, y) => {
                                setSelectedMonth(m);
                                setSelectedYear(y);
                            }}
                        />

                        <Link
                            href={`/admin/reports/monthly${activeType !== 'ALL' ? `?type=${activeType}` : ''}`}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-semibold whitespace-nowrap"
                        >
                            <Calendar className="h-4 w-4" />
                            Detailed Report
                        </Link>
                    </div>
                </div>

                {/* Removed global search in favor of column search */}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                        <h3 className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Reviews</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalReviews}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                        <h3 className="text-green-600 dark:text-green-500 text-xs font-semibold uppercase tracking-wider mb-2">On Track</h3>
                        <p className="text-3xl font-bold text-green-800 dark:text-green-400">{stats.onTrack}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                        <h3 className="text-orange-600 dark:text-orange-500 text-xs font-semibold uppercase tracking-wider mb-2">Challenged</h3>
                        <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">{stats.challenged}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                        <h3 className="text-red-600 dark:text-red-500 text-xs font-semibold uppercase tracking-wider mb-2">Critical</h3>
                        <p className="text-3xl font-bold text-red-800 dark:text-red-400">{stats.critical}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                        <h3 className="text-yellow-600 dark:text-yellow-500 text-xs font-semibold uppercase tracking-wider mb-2">Pending</h3>
                        <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-400">{stats.pendingReviews}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                        <h3 className="text-indigo-600 dark:text-indigo-500 text-xs font-semibold uppercase tracking-wider mb-2">Scheduled</h3>
                        <p className="text-3xl font-bold text-indigo-800 dark:text-indigo-400">{stats.scheduledReviews}</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Review Status Distribution */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-indigo-500 rounded-full" />
                            Review Status
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#FFF' }}
                                        itemStyle={{ color: '#E5E7EB' }}
                                    />
                                    <Legend
                                        verticalAlign="middle"
                                        align="right"
                                        layout="vertical"
                                        iconType="circle"
                                        formatter={(value) => <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Project Health Distribution */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-green-500 rounded-full" />
                            Project Health
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={healthChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {healthChartData.map((entry, index) => (
                                            <Cell key={`cell-h-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#FFF' }}
                                        itemStyle={{ color: '#E5E7EB' }}
                                    />
                                    <Legend
                                        verticalAlign="middle"
                                        align="right"
                                        layout="vertical"
                                        iconType="circle"
                                        formatter={(value) => <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors duration-200">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Reviews for {MONTHS[selectedMonth]} {selectedYear}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                        onClick={() => handleSort('project.name')}
                                    >
                                        <div className="flex items-center">
                                            Project <SortIcon direction={sortConfig.key === 'project.name' ? sortConfig.direction : null} active={sortConfig.key === 'project.name'} />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                        onClick={() => handleSort('reviewer.name')}
                                    >
                                        <div className="flex items-center">
                                            Reviewer <SortIcon direction={sortConfig.key === 'reviewer.name' ? sortConfig.direction : null} active={sortConfig.key === 'reviewer.name'} />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                        onClick={() => handleSort('form.title')}
                                    >
                                        <div className="flex items-center">
                                            Form <SortIcon direction={sortConfig.key === 'form.title' ? sortConfig.direction : null} active={sortConfig.key === 'form.title'} />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                        onClick={() => handleSort('healthStatus')}
                                    >
                                        <div className="flex items-center">
                                            Health <SortIcon direction={sortConfig.key === 'healthStatus' ? sortConfig.direction : null} active={sortConfig.key === 'healthStatus'} />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center">
                                            Status <SortIcon direction={sortConfig.key === 'status' ? sortConfig.direction : null} active={sortConfig.key === 'status'} />
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Comments</th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                        onClick={() => handleSort('scheduledDate')}
                                    >
                                        <div className="flex items-center">
                                            Scheduled <SortIcon direction={sortConfig.key === 'scheduledDate' ? sortConfig.direction : null} active={sortConfig.key === 'scheduledDate'} />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                        onClick={() => handleSort('submittedDate')}
                                    >
                                        <div className="flex items-center">
                                            Submitted <SortIcon direction={sortConfig.key === 'submittedDate' ? sortConfig.direction : null} active={sortConfig.key === 'submittedDate'} />
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                                {/* Search Row */}
                                <tr className="bg-gray-50 dark:bg-gray-700">
                                    <th className="px-6 py-2">
                                        <ColumnFilter value={searchFilters['project.name']} onChange={(val) => handleSearch('project.name', val)} placeholder="Search..." />
                                    </th>
                                    <th className="px-6 py-2">
                                        <ColumnFilter value={searchFilters['reviewer.name']} onChange={(val) => handleSearch('reviewer.name', val)} placeholder="Search..." />
                                    </th>
                                    <th className="px-6 py-2">
                                        <ColumnFilter value={searchFilters['form.title']} onChange={(val) => handleSearch('form.title', val)} placeholder="Search..." />
                                    </th>
                                    <th className="px-6 py-2">
                                        <ColumnFilter value={searchFilters['healthStatus']} onChange={(val) => handleSearch('healthStatus', val)} placeholder="Search..." />
                                    </th>
                                    <th className="px-6 py-2">
                                        <ColumnFilter value={searchFilters['status']} onChange={(val) => handleSearch('status', val)} placeholder="Search..." />
                                    </th>
                                    <th className="px-6 py-2"></th>
                                    <th className="px-6 py-2"></th>
                                    <th className="px-6 py-2"></th>
                                    <th className="px-6 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {sortedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No reviews found for {MONTHS[selectedMonth]} {selectedYear}
                                        </td>
                                    </tr>
                                ) : (
                                    sortedData
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((review) => (
                                            <tr key={review.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                                                    {review.project ? (
                                                        <Link href={`/admin/reports/project/${review.project.id}`}>
                                                            {review.project.name}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Project Missing</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {review.reviewer?.name || 'Unassigned'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {review.form.title}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase tracking-tight ${review.status === 'NOT_COMPLETED' ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' : getHealthBadgeClass(review.healthStatus)}`}>
                                                        {review.status === 'NOT_COMPLETED' ? '-' : (review.healthStatus || 'N/A')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(review.status)}`}>
                                                        {review.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={review.deferredReason || review.onHoldReason || review.endedReason || review.observations || review.aiAnalysis || ""}>
                                                    {review.deferredReason || review.onHoldReason || review.endedReason || review.observations || review.aiAnalysis || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {review.scheduledDate ? format(new Date(review.scheduledDate), 'MMM d, yyyy') : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {review.submittedDate ? format(new Date(review.submittedDate), 'MMM d, yyyy') : '-'}
                                                </td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {(() => {
                                                        const viewHref = isManagement 
                                                            ? `/admin/reviews/${review.id}`
                                                            : `/reviews/${review.id}/view`;
                                                        
                                                        return (
                                                            <Link
                                                                href={viewHref}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm transform hover:-translate-y-0.5 active:scale-95"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                                <span className="font-bold uppercase tracking-tighter text-[10px]">View Form</span>
                                                            </Link>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        totalItems={sortedData.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
            </div>
        </div>
    );
}
