"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Download, FileText, Calendar, User, CheckCircle, Clock, AlertCircle } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/types/roles";

interface ProjectReportViewProps {
    project: any;
}

export default function ProjectReportView({ project }: ProjectReportViewProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');

    // Data processing for charts
    const statusData = [
        { name: 'Submitted', value: project.reviews.filter((r: any) => r.status === 'SUBMITTED').length, color: '#059669' },
        { name: 'Pending', value: project.reviews.filter((r: any) => r.status === 'PENDING').length, color: '#CA8A04' },
        { name: 'Scheduled', value: project.reviews.filter((r: any) => r.status === 'SCHEDULED').length, color: '#2563EB' },
    ].filter(d => d.value > 0);

    const reviewsByReviewer = project.reviews.reduce((acc: any, review: any) => {
        const name = review.reviewer.name;
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {});

    const reviewerData = Object.entries(reviewsByReviewer).map(([name, count]) => ({
        name,
        reviews: count
    }));

    const exportPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text(`Project Report: ${project.name}`, 14, 22);

        // Project Info
        doc.setFontSize(12);
        doc.text(`Lead: ${project.lead?.name || 'N/A'}`, 14, 32);
        doc.text(`QA Contact: ${project.contact?.name || 'N/A'}`, 14, 38);
        doc.text(`Total Reviews: ${project.reviews.length}`, 14, 44);

        // Reviews Table
        const tableData = project.reviews.map((r: any) => [
            r.form.title,
            r.reviewer.name,
            r.status,
            r.submittedDate ? format(new Date(r.submittedDate), 'MMM d, yyyy') : '-'
        ]);

        autoTable(doc, {
            head: [['Form', 'Reviewer', 'Status', 'Submitted Date']],
            body: tableData,
            startY: 50,
        });

        doc.save(`${project.name}_report.pdf`);
    };

    const exportExcel = () => {
        const wb = XLSX.utils.book_new();

        // Project Info Sheet
        const projectInfo = [
            ['Project Name', project.name],
            ['Description', project.description],
            ['Lead', project.lead?.name],
            ['QA Contact', project.contact?.name],
            ['Total Reviews', project.reviews.length],
            ['Created At', format(new Date(project.createdAt), 'MMM d, yyyy')]
        ];
        const wsInfo = XLSX.utils.aoa_to_sheet(projectInfo);
        XLSX.utils.book_append_sheet(wb, wsInfo, "Project Info");

        // Reviews Sheet
        const reviewsData = project.reviews.map((r: any) => ({
            Form: r.form.title,
            Reviewer: r.reviewer.name,
            Status: r.status,
            ScheduledDate: r.scheduledDate ? format(new Date(r.scheduledDate), 'MMM d, yyyy') : '-',
            SubmittedDate: r.submittedDate ? format(new Date(r.submittedDate), 'MMM d, yyyy') : '-',
            Score: r.score || 'N/A'
        }));
        const wsReviews = XLSX.utils.json_to_sheet(reviewsData);
        XLSX.utils.book_append_sheet(wb, wsReviews, "Reviews");

        XLSX.writeFile(wb, `${project.name}_report.xlsx`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/admin/reports" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                Reports
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="text-sm text-gray-900 dark:text-white">Project Report</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={exportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                        >
                            <FileText className="h-4 w-4" />
                            Export PDF
                        </button>
                        <button
                            onClick={exportExcel}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                        >
                            <Download className="h-4 w-4" />
                            Export Excel
                        </button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Reviews</h3>
                            <FileText className="h-5 w-5 text-indigo-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{project.reviews.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Completion Rate</h3>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {project.reviews.length > 0
                                ? Math.round((project.reviews.filter((r: any) => r.status === 'SUBMITTED').length / project.reviews.length) * 100)
                                : 0}%
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Review Lead</h3>
                            <User className="h-5 w-5 text-blue-500" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white truncate" title={project.lead?.name}>
                            {project.lead?.name || 'Unassigned'}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Created</h3>
                            <Calendar className="h-5 w-5 text-purple-500" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {format(new Date(project.createdAt), 'MMM d, yyyy')}
                        </p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Status Distribution */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Review Status Distribution</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Reviews by Reviewer */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Reviews by Reviewer</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reviewerData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                    <XAxis dataKey="name" stroke="#6B7280" />
                                    <YAxis stroke="#6B7280" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }}
                                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    />
                                    <Bar dataKey="reviews" fill="#6366F1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Detailed Reviews List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Form</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reviewer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Health</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Scheduled</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {project.reviews.map((review: any) => (
                                    <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {review.form.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {review.reviewer.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase tracking-tight ${review.status === 'NOT_COMPLETED' ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' :
                                                review.healthStatus === 'On Track' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    review.healthStatus === 'Slightly Challenged' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        review.healthStatus === 'Extremely Challenged' || review.healthStatus === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400'
                                                }`}>
                                                {review.status === 'NOT_COMPLETED' ? '-' : (review.healthStatus || 'N/A')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${review.status === 'SUBMITTED' ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                                                review.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    review.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        review.status === 'DEFERRED' ? 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200' :
                                                            review.status === 'ON_HOLD' ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400' :
                                                                'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700 dark:text-gray-300'
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
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {(() => {
                                                const roles = (user?.roles || []) as Role[];
                                                const isDirector = roles.includes('DIRECTOR');
                                                const isAdminOrHead = roles.some(r => ['ADMIN', 'QA_HEAD', 'QA_MANAGER'].includes(r));
                                                const viewHref = isDirector && !isAdminOrHead 
                                                    ? `/reviews/${review.id}/view` 
                                                    : `/admin/reviews/${review.id}`;

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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
