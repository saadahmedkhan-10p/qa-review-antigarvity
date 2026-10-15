"use client";

import { useState, useMemo, useCallback } from "react";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label
} from 'recharts';
import { Download, FileText } from "lucide-react";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import Link from "next/link";
import { format, parseISO, subMonths, addMonths, isSameMonth, startOfMonth, endOfMonth } from "date-fns";
import { useRef } from "react";
import toast from "react-hot-toast";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

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

const TYPE_LABELS = {
    'ALL': 'ALL',
    'MANUAL': 'MANUAL',
    'AUTOMATION_WEB': 'WEB AUTO',
    'AUTOMATION_MOBILE': 'MOB AUTO',
    'API': 'API AUTO',
    'DESKTOP': 'DESKTOP'
};

export default function MonthlyReportView({ reviews }: MonthlyReportViewProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Default to MANUAL if type is missing or invalid, consistent with other pages
    const projectType = (searchParams.get("type")?.toUpperCase() || 'MANUAL') as 'MANUAL' | 'AUTOMATION_WEB' | 'AUTOMATION_MOBILE' | 'API' | 'DESKTOP';

    const [currentDate, setCurrentDate] = useState(new Date());
    const activeType = ((searchParams.get("type") as any) || 'ALL') as 'ALL' | 'MANUAL' | 'AUTOMATION_WEB' | 'AUTOMATION_MOBILE' | 'API' | 'DESKTOP';
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    // Question Insights filter state
    const [selectedQId, setSelectedQId] = useState<string>('');
    const [selectedAnswer, setSelectedAnswer] = useState<string>('ALL');

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const handleTypeChange = (type: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (type === 'ALL') {
            params.delete('type');
        } else {
            params.set('type', type);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    // Filter reviews for the selected month and project type
    const monthReviews = useMemo(() => {
        return reviews.filter(r => {
            const reviewDate = r.scheduledDate || r.submittedDate || r.createdAt;
            if (!reviewDate) return false;
            try {
                const isMonthMatch = isSameMonth(parseISO(reviewDate), currentDate);
                const isTypeMatch = activeType === 'ALL' || (r.project?.type || 'MANUAL') === activeType;
                return isMonthMatch && isTypeMatch;
            } catch (e) {
                return false;
            }
        });
    }, [reviews, currentDate, activeType]);


    // ── Question Insights: extract all unique questions from this month's submitted reviews ──
    const allQuestionsMap = useMemo(() => {
        // Map of qId → { label, options: Set<string>, sectionTitle? }
        const map = new Map<string, { label: string; options: Set<string>; sectionTitle?: string }>();

        const extractQuestions = (items: any[], sectionTitle?: string) => {
            if (!Array.isArray(items)) return;
            items.forEach(item => {
                // Section / group node
                if (item.title && item.questions) {
                    extractQuestions(item.questions, item.title);
                    return;
                }
                if (item.id && item.label && item.type) {
                    if (!map.has(item.id)) {
                        map.set(item.id, { label: item.label, options: new Set(), sectionTitle });
                    }
                    // Collect all possible option values
                    (item.options || []).forEach((opt: any) => {
                        const val = typeof opt === 'string' ? opt : (opt.label || opt.value || String(opt));
                        map.get(item.id)!.options.add(val);
                    });
                }
            });
        };

        const submitted = monthReviews.filter(r => r.status === 'SUBMITTED');
        submitted.forEach(r => {
            let questions: any[] = [];
            try {
                questions = typeof r.form?.questions === 'string'
                    ? JSON.parse(r.form.questions || '[]')
                    : (r.form?.questions || []);
            } catch {}
            extractQuestions(questions);
        });

        return map;
    }, [monthReviews]);

    // ── Question Insights: filtered results based on selected question & answer ──
    const questionFilterResults = useMemo(() => {
        if (!selectedQId) return [];
        const submitted = monthReviews.filter(r => r.status === 'SUBMITTED');

        return submitted.map(r => {
            let answers: Record<string, any> = {};
            try {
                answers = typeof r.answers === 'string'
                    ? JSON.parse(r.answers || '{}')
                    : (r.answers || {});
            } catch {}

            const rawAnswer = answers[selectedQId];
            const answer = rawAnswer !== undefined && rawAnswer !== null ? String(rawAnswer) : null;
            const reason = answers[`${selectedQId}_reason`]
                ? String(answers[`${selectedQId}_reason`])
                : null;

            // Apply answer filter
            if (selectedAnswer !== 'ALL') {
                if (!answer || answer.toLowerCase() !== selectedAnswer.toLowerCase()) return null;
            }

            return {
                projectName: r.project?.name || 'Unknown',
                reviewId: r.id,
                reviewer: r.reviewer?.name || r.secondaryReviewer?.name || '—',
                answer,
                reason,
            };
        }).filter(Boolean) as Array<{
            projectName: string;
            reviewId: string;
            reviewer: string;
            answer: string | null;
            reason: string | null;
        }>;
    }, [monthReviews, selectedQId, selectedAnswer]);

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
            // DEFERRED and PROJECT_ENDED are always counted regardless of healthStatus
            if (r.status === 'DEFERRED') {
                counts['Deferred']++;
                details.deferred.push(r);
                return;
            }
            if (r.status === 'PROJECT_ENDED') {
                counts['Ended']++;
                details.ended.push(r);
                return;
            }
            // Skip statuses that haven't had a review submitted yet
            if (r.status !== 'SUBMITTED') return;
            if (r.status === 'NOT_COMPLETED') return;

            // Only use explicitly set health status; don't default unsubmitted to On Track
            const health = r.healthStatus || 'On Track';

            if (counts.hasOwnProperty(health)) {
                counts[health as keyof typeof counts]++;
            } else {
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
        const fileName = `${activeType}_REPORT_${format(currentDate, 'MMMM_yyyy')}`;
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-4 dark:border-gray-700 gap-3">
                    <div>
                        <div className="flex items-center gap-4 print:hidden">
                            <Link href={`/admin/reports${activeType !== 'ALL' ? `?type=${activeType}` : ''}`} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                Reports
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-bold text-gray-800 dark:text-white">Monthly Report</span>
                        </div>
                        <h1 className="text-lg font-bold uppercase text-gray-800 dark:text-white leading-tight">
                            {TYPE_LABELS[activeType]} QA REVIEW REPORT | <span className="text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600">{format(currentDate, 'MMMM yyyy')}</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap print:hidden ml-auto">
                        {/* Type Filter Toggle */}
                        <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl shadow-inner transition-colors">
                            <button
                                onClick={() => handleTypeChange('ALL')}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${activeType === 'ALL'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                ALL
                            </button>
                            <button
                                onClick={() => handleTypeChange('MANUAL')}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${activeType === 'MANUAL'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                MANUAL
                            </button>
                            <button
                                onClick={() => handleTypeChange('AUTOMATION_WEB')}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${activeType === 'AUTOMATION_WEB'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                WEB AUTO
                            </button>
                            <button
                                onClick={() => handleTypeChange('AUTOMATION_MOBILE')}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${activeType === 'AUTOMATION_MOBILE'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                MOB AUTO
                            </button>
                            <button
                                onClick={() => handleTypeChange('API')}
                                className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${activeType === 'API'
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                API AUTO
                            </button>
                            <button
                                onClick={() => handleTypeChange('DESKTOP')}
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

                        <button
                            onClick={exportPDF}
                            title="Download PDF"
                            className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-gray-600 dark:text-gray-300 hover:text-white transition-all shadow-inner flex-shrink-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                            </svg>
                        </button>
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
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden print:overflow-visible border border-gray-200 dark:border-gray-700 print-table-container">
                        <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 font-bold text-gray-700 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600 print-section-header">
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
                                        cx="40%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
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
                                        formatter={(value: number, name: string) => {
                                            const total = chartData.reduce((s, d) => s + d.value, 0);
                                            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                                            return [`${value} (${pct}%)`, name];
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="middle"
                                        align="right"
                                        layout="vertical"
                                        iconType="circle"
                                        formatter={(value) => {
                                            const item = chartData.find(d => d.name === value);
                                            const count = item ? item.value : 0;
                                            const total = chartData.reduce((s, d) => s + d.value, 0);
                                            const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
                                            return <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{value} ({count} · {pct}%)</span>;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Middle Section: Challenged & Ended Projects */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Challenged Projects */}
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden print:overflow-visible print-table-container">
                        <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600 print-section-header">
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
                                                    {r.project?.name || 'Unknown Project'}
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
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden print:overflow-visible print-table-container">
                        <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600 print-section-header">
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
                                                    {r.project?.name || 'Unknown Project'}
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
                <div className="mb-8 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden print:overflow-visible print-table-container">
                    <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600 print-section-header">
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
                                                {r.project?.name || 'Unknown Project'}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{r.deferredReason || r.followUpComment || r.observations || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Detailed Challenged Projects (Bottom Table) */}
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden print:overflow-visible bg-white dark:bg-gray-800 print-table-container print-detailed-table-container">
                    <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold text-gray-800 dark:text-white border-b border-gray-300 dark:border-gray-600 print-section-header">
                        Challenged Projects Details
                    </div>
                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-sm table-fixed">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                                <tr>
                                    <th className="text-left px-3 py-3 font-bold text-gray-700 dark:text-gray-300 w-[18%]">ProjectName</th>
                                    <th className="text-left px-3 py-3 font-bold text-gray-700 dark:text-gray-300 w-[12%]">Overall Health</th>
                                    <th className="text-left px-3 py-3 font-bold text-gray-700 dark:text-gray-300 w-[18%]">Observations</th>
                                    <th className="text-left px-3 py-3 font-bold text-gray-700 dark:text-gray-300 w-[22%]">AI Analysis</th>
                                    <th className="text-left px-3 py-3 font-bold text-gray-700 dark:text-gray-300 w-[17%]">Recommended Actions</th>
                                    <th className="text-left px-3 py-3 font-bold text-gray-700 dark:text-gray-300 w-[13%]">Follow up Comment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {stats.details.challenged.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No details available</td></tr>
                                ) : (
                                    stats.details.challenged.map((r, i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-3 py-3 text-indigo-600 dark:text-indigo-400 font-medium align-top break-words">
                                                <Link href={`/admin/reviews/${r.id}`} className="hover:underline">
                                                    {r.project?.name || 'Unknown Project'}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-3 text-gray-700 dark:text-gray-300 align-top break-words">{r.healthStatus}</td>
                                            <td className="px-3 py-3 text-gray-600 dark:text-gray-300 align-top whitespace-pre-line break-words">{r.observations || '-'}</td>                                            <td className="px-3 py-3 text-indigo-600 dark:text-indigo-400 align-top whitespace-pre-line font-medium bg-indigo-50/20 dark:bg-indigo-900/10 break-words">
                                                {(() => {
                                                    if (!r.aiAnalysis) {
                                                        return (
                                                            <Link href={`/admin/reviews/${r.id}`} className="text-xs text-indigo-500 hover:underline inline-flex items-center gap-1 font-semibold" title="Open review to generate AI analysis">
                                                                <span>Generate AI Analysis</span>
                                                                <span>→</span>
                                                            </Link>
                                                        );
                                                    }
                                                    let analysis: any = null;
                                                    try {
                                                        analysis = JSON.parse(r.aiAnalysis);
                                                    } catch (e) {
                                                        return <span className="text-xs">{r.aiAnalysis}</span>;
                                                    }

                                                    if (analysis && typeof analysis === 'object') {
                                                        const cleanSummary = (typeof analysis.summary === 'string' ? analysis.summary : JSON.stringify(analysis.summary || ''))
                                                            .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
                                                            .trim();

                                                        if (!cleanSummary && (!analysis.observations || analysis.observations.length === 0) && (!analysis.actionItems || analysis.actionItems.length === 0)) {
                                                            return (
                                                                <Link href={`/admin/reviews/${r.id}`} className="text-xs text-indigo-500 hover:underline inline-flex items-center gap-1 font-semibold" title="Generate fresh AI analysis">
                                                                    <span>Generate AI Analysis</span>
                                                                    <span>✨</span>
                                                                </Link>
                                                            );
                                                        }

                                                        return (
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`text-[10px] font-black uppercase tracking-tighter w-fit px-1.5 py-0.5 rounded ${
                                                                    analysis.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                                                    analysis.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                                                                    analysis.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                                                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                                }`}>
                                                                    {typeof analysis.riskLevel === 'string' ? analysis.riskLevel : 'ANALYZED'} {analysis.riskScore !== undefined ? `(${analysis.riskScore}/10)` : ''}
                                                                </span>
                                                                {cleanSummary && (
                                                                    <span className="text-xs text-gray-800 dark:text-gray-200" title={cleanSummary}>
                                                                        {cleanSummary}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    return <span className="text-xs">{r.aiAnalysis}</span>;
                                                })()}
                                            </td>
                                            <td className="px-3 py-3 text-gray-600 dark:text-gray-300 align-top whitespace-pre-line break-words">
                                                {(() => {
                                                    if (r.recommendedActions) return r.recommendedActions;
                                                    if (r.aiAnalysis) {
                                                        try {
                                                            const analysis = JSON.parse(r.aiAnalysis);
                                                            if (analysis?.actionItems && Array.isArray(analysis.actionItems) && analysis.actionItems.length > 0) {
                                                                return (
                                                                    <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-700 dark:text-gray-300">
                                                                        {analysis.actionItems.map((item: string, idx: number) => (
                                                                            <li key={idx}>{item}</li>
                                                                        ))}
                                                                    </ul>
                                                                );
                                                            }
                                                        } catch (e) {}
                                                    }
                                                    return '-';
                                                })()}
                                            </td>
                                            <td className="px-3 py-3 text-gray-600 dark:text-gray-300 align-top whitespace-pre-line break-words">{r.followUpComment || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Question Insights Panel ─────────────────────────────────── */}
                <div className="mt-10 border border-violet-200 dark:border-violet-700/50 rounded-xl overflow-hidden print:hidden">
                    {/* Header */}
                    <div className="bg-violet-600 dark:bg-violet-800 px-5 py-3 flex items-center gap-3">
                        <svg className="w-5 h-5 text-violet-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-bold text-white text-sm tracking-wide">Question Insights — Filter by Any Question</span>
                    </div>

                    {/* Filters Row */}
                    <div className="bg-violet-50 dark:bg-violet-900/20 px-5 py-4 border-b border-violet-200 dark:border-violet-700/40 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                        {/* Question selector */}
                        <div className="flex-1 min-w-0">
                            <label className="block text-xs font-bold text-violet-700 dark:text-violet-300 mb-1.5 uppercase tracking-wider">
                                Select Question
                            </label>
                            <select
                                value={selectedQId}
                                onChange={e => { setSelectedQId(e.target.value); setSelectedAnswer('ALL'); }}
                                className="w-full bg-white dark:bg-gray-800 border border-violet-300 dark:border-violet-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            >
                                <option value="">— Choose a question —</option>
                                {Array.from(allQuestionsMap.entries()).map(([qId, q]) => (
                                    <option key={qId} value={qId}>
                                        {q.sectionTitle ? `[${q.sectionTitle}] ` : ''}{q.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Answer filter */}
                        <div className="w-full sm:w-48 shrink-0">
                            <label className="block text-xs font-bold text-violet-700 dark:text-violet-300 mb-1.5 uppercase tracking-wider">
                                Filter by Answer
                            </label>
                            <select
                                value={selectedAnswer}
                                onChange={e => setSelectedAnswer(e.target.value)}
                                disabled={!selectedQId}
                                className="w-full bg-white dark:bg-gray-800 border border-violet-300 dark:border-violet-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                            >
                                <option value="ALL">All Answers</option>
                                {selectedQId && allQuestionsMap.has(selectedQId) &&
                                    Array.from(allQuestionsMap.get(selectedQId)!.options).map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))
                                }
                            </select>
                        </div>

                        {/* Result count badge */}
                        {selectedQId && (
                            <div className="shrink-0 bg-violet-600 text-white text-xs font-bold px-3 py-2 rounded-lg self-end whitespace-nowrap">
                                {questionFilterResults.length} project{questionFilterResults.length !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>

                    {/* Results table */}
                    {!selectedQId ? (
                        <div className="px-5 py-10 text-center text-gray-400 dark:text-gray-500 text-sm bg-white dark:bg-gray-800">
                            Select a question above to see how each project answered it in {format(currentDate, 'MMMM yyyy')}.
                        </div>
                    ) : questionFilterResults.length === 0 ? (
                        <div className="px-5 py-10 text-center text-gray-400 dark:text-gray-500 text-sm bg-white dark:bg-gray-800">
                            No submitted reviews matched the selected filters for {format(currentDate, 'MMMM yyyy')}.
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="text-left px-4 py-2.5 font-bold text-gray-700 dark:text-gray-300 w-[35%]">Project</th>
                                        <th className="text-left px-4 py-2.5 font-bold text-gray-700 dark:text-gray-300 w-[20%]">Reviewer</th>
                                        <th className="text-left px-4 py-2.5 font-bold text-gray-700 dark:text-gray-300 w-[15%]">Answer</th>
                                        <th className="text-left px-4 py-2.5 font-bold text-gray-700 dark:text-gray-300">Reason / Detail</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {questionFilterResults.map((row, i) => {
                                        const ans = row.answer?.toLowerCase();
                                        const isYes = ans === 'yes';
                                        const isNo = ans === 'no';
                                        return (
                                            <tr key={i} className={`${isYes ? 'bg-green-50/30 dark:bg-green-900/10' : isNo ? 'bg-red-50/30 dark:bg-red-900/10' : ''} hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors`}>
                                                <td className="px-4 py-2.5 font-medium">
                                                    <Link href={`/admin/reviews/${row.reviewId}`} className="text-violet-600 dark:text-violet-400 hover:underline">
                                                        {row.projectName}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{row.reviewer}</td>
                                                <td className="px-4 py-2.5">
                                                    {row.answer ? (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                                            isYes ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                                                            isNo  ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                                                                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                        }`}>
                                                            {isYes ? '✅ ' : isNo ? '❌ ' : ''}{row.answer}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-sm">
                                                    {row.reason || '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
