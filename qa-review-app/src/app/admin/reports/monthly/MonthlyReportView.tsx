"use client";

import { useState, useMemo } from "react";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label
} from 'recharts';
import { Download, FileText } from "lucide-react";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import Link from "next/link";
import { format, parseISO, subMonths, addMonths, isSameMonth, startOfMonth, endOfMonth } from "date-fns";
import { useRef } from "react";
import toast from "react-hot-toast";

import { useSearchParams } from "next/navigation";

interface MonthlyReportViewProps {
    reviews: any[];
}

const COLORS = {
    'On Track': '#10B981', // green-500
    'Slightly Challenged': '#F59E0B', // amber-500
    'Extremely Challenged': '#F97316', // orange-500
    'Critical': '#EF4444', // red-500
    'Ended': '#6B7280', // gray-500
    'Deferred': '#3B82F6', // blue-500 (using blue for deferred to differentiate from critical)
    'On Hold': '#A855F7', // purple-500
};

export default function MonthlyReportView({ reviews }: MonthlyReportViewProps) {
    const searchParams = useSearchParams();
    // Default to MANUAL if type is missing or invalid, consistent with other pages
    const projectType = (searchParams.get("type")?.toUpperCase() || 'MANUAL') as 'MANUAL' | 'AUTOMATION_WEB' | 'AUTOMATION_MOBILE' | 'API' | 'DESKTOP';

    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeType, setActiveType] = useState<'ALL' | 'MANUAL' | 'AUTOMATION_WEB' | 'AUTOMATION_MOBILE' | 'API' | 'DESKTOP'>((searchParams.get("type") as any) || 'ALL');
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    // Filter reviews for the selected month and project type
    const monthReviews = useMemo(() => {
        return reviews.filter(r => {
            const isMonthMatch = isSameMonth(parseISO(r.createdAt), currentDate);
            if (activeType !== 'ALL' && (r.project.type || 'MANUAL') !== activeType) return false;
            return isMonthMatch;
        });
    }, [reviews, currentDate, activeType]);

    // Aggregate Data
    const stats = useMemo(() => {
        const counts = {
            'On Track': 0,
            'Slightly Challenged': 0,
            'Extremely Challenged': 0,
            'Critical': 0,
            'Ended': 0,
            'Deferred': 0,
            'On Hold': 0
        };

        const details = {
            challenged: [] as any[],
            ended: [] as any[],
            deferred: [] as any[],
            onTrack: [] as any[]
        };

        monthReviews.forEach(r => {
            // Determine effective health status
            // If status is DEFERRED or PROJECT_ENDED or NOT_COMPLETED, map to health status equivalent if not set
            let health = r.healthStatus || 'On Track';
            if (r.status === 'DEFERRED') health = 'Deferred';
            if (r.status === 'PROJECT_ENDED') health = 'Ended';
            if (r.status === 'NOT_COMPLETED') return; // Exclude from health counts entirely

            if (counts.hasOwnProperty(health)) {
                counts[health as keyof typeof counts]++;
            } else {
                // Fallback for unexpected values
                counts['On Track']++;
            }

            // Categorize for tables
            if (health === 'Slightly Challenged' || health === 'Extremely Challenged' || health === 'Critical') {
                details.challenged.push(r);
            } else if (health === 'Ended') {
                details.ended.push(r);
            } else if (health === 'Deferred') {
                details.deferred.push(r);
            } else if (health === 'On Track') {
                details.onTrack.push(r);
            }
        });

        return { counts, details, total: monthReviews.length };
    }, [monthReviews]);

    // Chart Data
    const chartData = Object.entries(stats.counts)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({ name, value }));

    const exportPDF = () => {
        // Save current title
        const originalTitle = document.title;

        // Set specific filename for "Save as PDF"
        // Format: CATEGORY_REPORT_MONTH (e.g. WEB_REPORT_January_2025)
        const fileName = `${projectType}_REPORT_${format(currentDate, 'MMMM_yyyy')}`;
        document.title = fileName;

        // Trigger print
        window.print();

        // Restore title after a delay to ensure browser captures it
        setTimeout(() => {
            document.title = originalTitle;
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div ref={reportRef} className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4 dark:border-gray-700">
                    <div>
                        <div className="flex items-center gap-4 mb-2 print:hidden">
                            <Link href={`/admin/reports?type=${projectType}`} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                Reports
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-bold text-gray-800 dark:text-white">Monthly Report</span>
                        </div>
                        <h1 className="text-2xl font-bold uppercase text-gray-800 dark:text-white">
                            {activeType === 'ALL' ? 'ALL' : activeType === 'API' ? 'API AUTO' : activeType} PROJECT QA REVIEW REPORT | <span className="text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600">{format(currentDate, 'MMMM yyyy')}</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 print:hidden">
                        {/* Type Filter Toggle */}
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
                                className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${activeType === 'API'
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

                        {/* Date Picker */}
                        <MonthYearPicker
                            selectedMonth={currentDate.getMonth()}
                            selectedYear={currentDate.getFullYear()}
                            onChange={(m, y) => {
                                const newDate = new Date(currentDate);
                                newDate.setMonth(m);
                                newDate.setFullYear(y);
                                setCurrentDate(newDate);
                            }}
                        />

                        <div className="flex gap-2">
                            <button onClick={exportPDF} className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1.5 transition-colors shadow-sm text-xs" title="Print / Save as PDF">
                                <FileText className="h-4 w-4" />
                                <span className="font-bold">Print / Save PDF</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        Total Projects <span className="text-3xl border-l-2 border-gray-300 dark:border-gray-600 pl-3 ml-2 text-indigo-600 dark:text-indigo-400">{stats.total}</span>
                    </h2>
                </div>

                {/* Top Section: Counts and Chart */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Projects Count Table */}
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 font-bold text-gray-700 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                            Projects count
                        </div>
                        <table className="w-full">
                            <thead className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <tr>
                                    <th className="text-left px-4 py-2 font-semibold text-gray-600 dark:text-gray-300">Health Status</th>
                                    <th className="text-right px-4 py-2 font-semibold text-gray-600 dark:text-gray-300">Sum of Count</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                                {Object.entries(stats.counts).map(([status, count], i) => (
                                    <tr key={status} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
                                        <td className="px-4 py-2 border-b dark:border-gray-700">{status}</td>
                                        <td className="px-4 py-2 text-right border-b dark:border-gray-700 font-bold text-indigo-600 dark:text-indigo-400">{count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Overall Status Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <h3 className="text-center font-bold text-gray-700 dark:text-gray-300 mb-2">Overall Project Status</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="55%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ value }) => value}
                                        labelLine={true}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[entry.name as keyof typeof COLORS] || '#999'}
                                                style={{ outline: 'none' }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', color: '#FFF', border: 'none', borderRadius: '8px' }}
                                        itemStyle={{ color: '#E5E7EB' }}
                                    />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Middle Section: Challenged & Ended Projects */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Challenged Projects */}
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                        <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600">
                            Challenged Projects
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <tr>
                                    <th className="text-left px-4 py-2 font-bold text-gray-700 dark:text-gray-300">ProjectName</th>
                                    <th className="text-left px-4 py-2 font-bold text-gray-700 dark:text-gray-300">Overall Health</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800">
                                {stats.details.challenged.length === 0 ? (
                                    <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">No challenged projects</td></tr>
                                ) : (
                                    stats.details.challenged.map((r, i) => (
                                        <tr key={i} className="border-b dark:border-gray-700">
                                            <td className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium">
                                                <Link href={`/admin/reviews/${r.id}`} className="hover:underline">
                                                    {r.project.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{r.healthStatus}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Ended Projects */}
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                        <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600">
                            Ended Projects
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <tr>
                                    <th className="text-left px-4 py-2 font-bold text-gray-700 dark:text-gray-300">ProjectName</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800">
                                {stats.details.ended.length === 0 ? (
                                    <tr><td className="px-4 py-8 text-center text-gray-500">No ended projects</td></tr>
                                ) : (
                                    stats.details.ended.map((r, i) => (
                                        <tr key={i} className="border-b dark:border-gray-700">
                                            <td className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium">
                                                <Link href={`/admin/reviews/${r.id}`} className="hover:underline">
                                                    {r.project.name}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Deferred Projects */}
                <div className="mb-8 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600">
                        Deferred Projects
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                            <tr>
                                <th className="text-left px-4 py-2 font-bold text-gray-700 dark:text-gray-300 w-1/3">ProjectName</th>
                                <th className="text-left px-4 py-2 font-bold text-gray-700 dark:text-gray-300">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800">
                            {stats.details.deferred.length === 0 ? (
                                <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">No deferred projects</td></tr>
                            ) : (
                                stats.details.deferred.map((r, i) => (
                                    <tr key={i} className="border-b dark:border-gray-700">
                                        <td className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium">
                                            <Link href={`/admin/reviews/${r.id}`} className="hover:underline">
                                                {r.project.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{r.deferredReason || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Detailed Challenged Projects (Bottom Table) */}
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                    <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600">
                        Challenged Projects Details
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                                <tr>
                                    <th className="text-left px-4 py-3 font-bold text-gray-700 dark:text-gray-300 w-1/5">ProjectName</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-700 dark:text-gray-300 w-1/6">Overall Health</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-700 dark:text-gray-300 w-1/5">Observations</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-700 dark:text-gray-300 w-1/5">AI Analysis</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-700 dark:text-gray-300 w-1/5">Recommended Actions</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-700 dark:text-gray-300 w-1/5">Follow up Comment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {stats.details.challenged.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No details available</td></tr>
                                ) : (
                                    stats.details.challenged.map((r, i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-medium align-top">
                                                <Link href={`/admin/reviews/${r.id}`} className="hover:underline">
                                                    {r.project.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 align-top">{r.healthStatus}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 align-top whitespace-pre-line">{r.observations || '-'}</td>
                                            <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 align-top whitespace-pre-line font-medium bg-indigo-50/20 dark:bg-indigo-900/10">{r.aiAnalysis || '-'}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 align-top whitespace-pre-line">{r.recommendedActions || '-'}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 align-top whitespace-pre-line">{r.followUpComment || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
