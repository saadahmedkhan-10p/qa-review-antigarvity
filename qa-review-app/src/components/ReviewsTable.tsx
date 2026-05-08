"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TableSearch } from "@/components/TableSearch";
import { Filter, Eye, Calendar, Pencil } from "lucide-react";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { format, isSameMonth, parseISO } from "date-fns";
import { Pagination } from "@/components/Pagination";
import { useTableSort } from "@/hooks/useTableSort";
import { useTableSearch } from "@/hooks/useTableSearch";
import { SortIcon } from "@/components/table/SortIcon";
import { ColumnFilter } from "@/components/table/ColumnFilter";
import { markReviewAsNotCompleted } from "@/app/actions/admin";
import { useAuth } from "@/context/AuthContext";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { Clock } from "lucide-react";
import toast from "react-hot-toast";

interface Review {
    id: string;
    status: string;
    submittedDate: string | null;
    scheduledDate: string | null;
    project: {
        name: string;
        type?: string;
    };
    reviewer: {
        name: string;
    };
    healthStatus: string | null;
    createdAt: string;
}

export function ReviewsTable({ reviews, initialType = 'ALL' }: { reviews: Review[], initialType?: 'ALL' | 'MANUAL' | 'AUTOMATION_WEB' | 'AUTOMATION_MOBILE' | 'API' | 'DESKTOP' }) {
    const { user } = useAuth();
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isAdmin = userRoles.includes("ADMIN");
    const isQAHead = userRoles.includes("QA_HEAD");
    const canMarkNotCompleted = isAdmin || isQAHead;

    const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'PENDING' | 'SCHEDULED' | 'DEFERRED' | 'ON_HOLD' | 'PROJECT_ENDED' | 'NOT_COMPLETED'>('ALL');
    const [activeType, setActiveType] = useState<'ALL' | 'MANUAL' | 'AUTOMATION_WEB' | 'AUTOMATION_MOBILE' | 'API' | 'DESKTOP'>(initialType as any);

    const [notCompletedModal, setNotCompletedModal] = useState<{ isOpen: boolean; reviewId: string; projectName: string; reason: string }>({
        isOpen: false,
        reviewId: "",
        projectName: "",
        reason: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const baseFilteredReviews = useMemo(() => {
        return reviews.filter((review) => {
            const matchesStatus = statusFilter === 'ALL' || review.status === statusFilter;
            const matchesType = activeType === 'ALL' || review.project.type === activeType;
            const matchesDate = isSameMonth(parseISO(review.createdAt), new Date(selectedYear, selectedMonth));

            return matchesStatus && matchesType && matchesDate;
        });
    }, [reviews, statusFilter, activeType, selectedMonth, selectedYear]);

    // Apply column filters
    const { filteredData: columnFilteredReviews, searchFilters, handleSearch } = useTableSearch(baseFilteredReviews);

    // Apply sorting
    const { sortedData, sortConfig, handleSort } = useTableSort(columnFilteredReviews);

    const paginatedReviews = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(start, start + itemsPerPage);
    }, [sortedData, currentPage]);

    // Reset to page 1 when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [statusFilter, activeType, selectedMonth, selectedYear, searchFilters]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUBMITTED':
                return 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200';
            case 'SCHEDULED':
                return 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
            case 'DEFERRED':
                return 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200';
            case 'ON_HOLD':
                return 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900 dark:text-purple-200';
            case 'PROJECT_ENDED':
                return 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700 dark:text-gray-300';
            case 'NOT_COMPLETED':
                return 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/40 dark:text-orange-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const handleMarkNotCompleted = async () => {
        if (!notCompletedModal.reason.trim()) {
            toast.error("Please provide a reason");
            return;
        }

        setIsSubmitting(true);
        try {
            await markReviewAsNotCompleted(notCompletedModal.reviewId, notCompletedModal.reason);
            toast.success("Review marked as not completed");
            setNotCompletedModal({ isOpen: false, reviewId: "", projectName: "", reason: "" });
        } catch (error: any) {
            toast.error(error.message || "Failed to update review");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                        All Reviews ({columnFilteredReviews.length})
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                        {/* Type Filter Toggle */}
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                            {(['ALL', 'MANUAL', 'AUTOMATION_WEB', 'AUTOMATION_MOBILE', 'API', 'DESKTOP'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setActiveType(type)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeType === type
                                        ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                        }`}
                                >
                                    {type === 'AUTOMATION_WEB' ? 'WEB AUTO' :
                                        type === 'AUTOMATION_MOBILE' ? 'MOB AUTO' :
                                            type === 'API' ? 'API AUTO' :
                                                type}
                                </button>
                            ))}
                        </div>

                        {/* Date Picker */}
                        <MonthYearPicker
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                            onChange={(m, y) => {
                                setSelectedMonth(m);
                                setSelectedYear(y);
                            }}
                        />

                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="SUBMITTED">Submitted</option>
                                <option value="PENDING">Pending</option>
                                <option value="SCHEDULED">Scheduled</option>
                                <option value="DEFERRED">Deferred</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="PROJECT_ENDED">Project Ended</option>
                                <option value="NOT_COMPLETED">Not Completed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Removed global search in favor of column inputs */}

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
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('createdAt')}
                                >
                                    <div className="flex items-center">
                                        Date <SortIcon direction={sortConfig.key === 'createdAt' ? sortConfig.direction : null} active={sortConfig.key === 'createdAt'} />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
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
                                    <ColumnFilter value={searchFilters['healthStatus']} onChange={(val) => handleSearch('healthStatus', val)} placeholder="Search..." />
                                </th>
                                <th className="px-6 py-2">
                                    <ColumnFilter value={searchFilters['status']} onChange={(val) => handleSearch('status', val)} placeholder="Search..." />
                                </th>
                                <th className="px-6 py-2">
                                    {/* Date search is complex, skipping strict input for now or could use a date string match */}
                                </th>
                                <th className="px-6 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedReviews.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-lg">
                                        No reviews found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                paginatedReviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {review.project.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {review.reviewer.name}
                                        </td>
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
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${review.status === 'SUBMITTED' ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200' :
                                                review.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200' :
                                                    review.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200' :
                                                        review.status === 'DEFERRED' ? 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200' :
                                                            review.status === 'ON_HOLD' ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900 dark:text-purple-200' :
                                                                review.status === 'PROJECT_ENDED' ? 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700 dark:text-gray-300' :
                                                                    'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {review.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {review.status === 'SUBMITTED' ? (
                                                <div className="flex flex-col gap-1">
                                                    {review.scheduledDate && (
                                                        <span title="Scheduled Date" className="flex items-center gap-1 text-[10px] text-gray-400">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(review.scheduledDate), 'MMM d, yyyy')}
                                                        </span>
                                                    )}
                                                    {review.submittedDate && (
                                                        <span title="Submitted Date" className="font-medium text-gray-900 dark:text-gray-200">
                                                            {format(new Date(review.submittedDate), 'MMM d, yyyy')}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : review.status === 'SCHEDULED' && review.scheduledDate ? (
                                                <span title="Scheduled Date" className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(review.scheduledDate), 'MMM d, yyyy')}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-4">
                                                <Link
                                                    href={`/admin/reviews/${review.id}`}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 inline-flex items-center gap-1"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    Manage
                                                </Link>
                                                {canMarkNotCompleted && review.status !== 'SUBMITTED' && review.status !== 'NOT_COMPLETED' && review.status !== 'PROJECT_ENDED' && (
                                                    <button
                                                        onClick={() => setNotCompletedModal({ isOpen: true, reviewId: review.id, projectName: review.project.name, reason: "" })}
                                                        className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 inline-flex items-center gap-1"
                                                        title="Mark as Not Completed on Time"
                                                    >
                                                        <Clock className="h-4 w-4" />
                                                        Mark Overdue
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <Pagination
                        totalItems={sortedData.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* Not Completed Reason Modal */}
            <ConfirmationModal
                isOpen={notCompletedModal.isOpen}
                title="Mark Review as Not Completed"
                message={`Please provide a reason why the review for "${notCompletedModal.projectName}" was not completed on time. This will lock the review and prevent further submissions.`}
                onConfirm={handleMarkNotCompleted}
                onCancel={() => setNotCompletedModal({ ...notCompletedModal, isOpen: false })}
                confirmText={isSubmitting ? "Updating..." : "Confirm Overdue"}
                confirmButtonClass="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
            >
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reason for Non-Completion
                    </label>
                    <textarea
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                        placeholder="e.g., Reviewer unavailable, Project access issues..."
                        value={notCompletedModal.reason}
                        onChange={(e) => setNotCompletedModal({ ...notCompletedModal, reason: e.target.value })}
                        disabled={isSubmitting}
                    />
                </div>
            </ConfirmationModal>
        </div>
    );
}
