"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getReviewerProjects, updateReviewStatus } from "@/app/actions/reviewer";
import { format } from "date-fns";
import Link from "next/link";
import toast from "react-hot-toast";

type ProjectWithReviews = any;

export default function ReviewerDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [projects, setProjects] = useState<ProjectWithReviews[]>([]);
    const [loading, setLoading] = useState(true);

    // State for staged actions (status, reason, date) per review
    const [stagedActions, setStagedActions] = useState<Record<string, { status: string, reason?: string, date?: string }>>({});
    const [activeType, setActiveType] = useState<'ALL' | 'MANUAL' | 'AUTOMATION_WEB' | 'AUTOMATION_MOBILE' | 'API' | 'DESKTOP'>('ALL');

    const loadData = async () => {
        if (!authLoading && user?.id) {
            try {
                // Use the ID from auth context directly
                const projectData = await getReviewerProjects(user.id);
                setProjects(projectData);
            } catch (error) {
                console.error("Error loading reviewer data:", error);
            } finally {
                setLoading(false);
            }
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user, authLoading]);

    const handleStagedChange = (reviewId: string, updates: any) => {
        setStagedActions(prev => ({
            ...prev,
            [reviewId]: { ...prev[reviewId], ...updates }
        }));
    };

    const handleConfirmAction = async (reviewId: string) => {
        const action = stagedActions[reviewId];
        if (!action) return;

        const { status, reason, date } = action;

        if (status === 'SCHEDULED' && !date) {
            toast.error("Please select a date for scheduling");
            return;
        }
        if (['DEFERRED', 'ON_HOLD', 'PROJECT_ENDED'].includes(status) && !reason?.trim()) {
            toast.error("Please provide a reason/comment");
            return;
        }

        try {
            await updateReviewStatus(reviewId, status, {
                reason,
                date: date ? new Date(date) : undefined
            });
            toast.success(`Review updated to ${status.replace('_', ' ')}`);

            setStagedActions(prev => {
                const next = { ...prev };
                delete next[reviewId];
                return next;
            });
            await loadData();
        } catch (error) {
            toast.error("Failed to update review");
            console.error(error);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const allReviews = projects.flatMap((project: any) =>
        project.reviews.map((review: any) => ({
            ...review,
            projectName: project.name,
            projectType: project.type,
            projectDescription: project.description,
            leadName: project.lead?.name || 'N/A',
            contactName: project.contactPerson?.name || 'N/A'
        }))
    );

    const pendingReviews = allReviews.filter((r: any) =>
        ["PENDING", "SCHEDULED"].includes(r.status?.toUpperCase()) &&
        (activeType === 'ALL' || r.projectType === activeType)
    );
    const completedReviews = allReviews.filter((r: any) =>
        ["SUBMITTED", "DEFERRED", "ON_HOLD", "PROJECT_ENDED"].includes(r.status?.toUpperCase()) &&
        (activeType === 'ALL' || r.projectType === activeType)
    );

    const projectsWithNoReviews = projects.filter((p: any) => {
        const hasActiveReview = p.reviews.some((r: any) => ["PENDING", "SCHEDULED"].includes(r.status?.toUpperCase()));
        return !hasActiveReview && (activeType === 'ALL' || p.type === activeType);
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Reviewer Dashboard</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Manage and conduct your assigned QA reviews</p>
                    </div>

                    <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl shadow-inner transition-colors">
                        <button
                            onClick={() => setActiveType('ALL')}
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${activeType === 'ALL'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                        >
                            ALL
                        </button>
                        <button
                            onClick={() => setActiveType('MANUAL')}
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${activeType === 'MANUAL'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                        >
                            MANUAL
                        </button>
                        <button
                            onClick={() => setActiveType('AUTOMATION_WEB')}
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${activeType === 'AUTOMATION_WEB'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                        >
                            WEB AUTO
                        </button>
                        <button
                            onClick={() => setActiveType('AUTOMATION_MOBILE')}
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${activeType === 'AUTOMATION_MOBILE'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                        >
                            MOB AUTO
                        </button>
                        <button
                            onClick={() => setActiveType('API')}
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${activeType === 'API'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                        >
                            API
                        </button>
                        <button
                            onClick={() => setActiveType('DESKTOP')}
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${activeType === 'DESKTOP'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                        >
                            DESKTOP
                        </button>
                    </div>
                </div>

                <div className="space-y-12">
                    {/* Assigned Projects Section - AT TOP */}
                    {projectsWithNoReviews.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700/50 transition-colors">
                            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                                <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Assigned Projects ({projectsWithNoReviews.length})</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                                    <thead className="bg-gray-50/30 dark:bg-gray-800/20">
                                        <tr>
                                            <th className="px-8 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-500 uppercase tracking-widest">Project</th>
                                            <th className="px-8 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-500 uppercase tracking-widest">Lead / QA Contact</th>
                                            <th className="px-8 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-500 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                        {projectsWithNoReviews.map((project: any) => (
                                            <tr key={project.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-base font-bold text-gray-900 dark:text-white">{project.name}</div>
                                                        {project.secondaryReviewerId === user.id && (
                                                            <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-black rounded uppercase">Secondary</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{project.type}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-300">L: {project.lead?.name || 'N/A'}</div>
                                                    <div className="text-sm text-gray-700 dark:text-gray-500">QC: {project.contactPerson?.name || 'N/A'}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="px-3 py-1 text-[10px] rounded-full font-black uppercase tracking-wider bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                                                        Awaiting Review Cycle
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Pending Reviews Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700/50 transition-colors">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                            <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Pending Reviews ({pendingReviews.length})</h2>
                        </div>
                        <div className="overflow-x-auto">
                            {pendingReviews.length === 0 ? (
                                <p className="p-12 text-gray-400 dark:text-gray-500 text-center text-lg font-medium italic">No pending reviews. Good job!</p>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                                    <thead className="bg-gray-50/30 dark:bg-gray-800/20">
                                        <tr>
                                            <th className="px-8 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-500 uppercase tracking-widest">Project / Form</th>
                                            <th className="px-8 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-500 uppercase tracking-widest">Lead / QA Contact</th>
                                            <th className="px-8 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-500 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-500 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                        {pendingReviews.map((review: any) => {
                                            const staged = stagedActions[review.id];
                                            const currentStatus = staged?.status || review.status;
                                            const isScheduled = review.status === 'SCHEDULED';
                                            const isPending = review.status === 'PENDING';
                                            // Identify if the user is the primary or secondary reviewer
                                            const isPrimary = review.reviewerId === user.id;
                                            const isSecondary = review.secondaryReviewerId === user.id;
                                            const allowStatusChange = isPending && isPrimary;

                                            return (
                                                <tr key={review.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-base font-bold text-gray-900 dark:text-white">{review.projectName}</div>
                                                            {isSecondary && (
                                                                <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-black rounded uppercase">Secondary</span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">{review.form.title}</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="text-sm font-medium text-gray-800 dark:text-gray-300">L: {review.leadName}</div>
                                                        <div className="text-sm text-gray-700 dark:text-gray-500">QC: {review.contactName}</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-3 py-1 text-xs rounded-full font-black uppercase tracking-wider ${isScheduled ? 'bg-blue-200 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300' :
                                                            'bg-amber-200 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300'
                                                            }`}>
                                                            {review.status}
                                                        </span>
                                                        {review.scheduledDate && (
                                                            <div className="text-[10px] mt-1 text-gray-700 dark:text-gray-400 font-bold uppercase tracking-tight">SCHEDULED FOR: {format(new Date(review.scheduledDate), 'MMM d, yyyy')}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-3 max-w-[240px]">

                                                            {/* Status selector only if PENDING */}
                                                            {allowStatusChange ? (
                                                                <div className="flex items-center gap-2">
                                                                    <select
                                                                        value={currentStatus}
                                                                        onChange={(e) => handleStagedChange(review.id, { status: e.target.value })}
                                                                        className="flex-1 text-xs font-bold border-2 border-gray-300 dark:border-gray-700 rounded-xl p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                                                                    >
                                                                        <option value="PENDING">-- SELECT STATUS --</option>
                                                                        <option value="SCHEDULED">Schedule Review</option>
                                                                        <option value="DEFERRED">Defer</option>
                                                                        <option value="ON_HOLD">Hold</option>
                                                                        <option value="PROJECT_ENDED">End Project</option>
                                                                    </select>

                                                                    {staged && staged.status !== 'PENDING' && (
                                                                        <button
                                                                            onClick={() => handleConfirmAction(review.id)}
                                                                            className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg shadow-lg shadow-green-500/20 transition-all font-black flex-shrink-0"
                                                                            title="Confirm Status Change"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                isPending && (
                                                                    <div className="text-[10px] text-gray-700 dark:text-gray-400 font-bold uppercase tracking-tight bg-gray-200 dark:bg-gray-800 p-2 rounded-lg">
                                                                        Lifecycle managed by primary reviewer
                                                                    </div>
                                                                )
                                                            )}
                                                            {/* Inline Inputs for Lifecycle actions */}
                                                            {currentStatus === 'SCHEDULED' && staged && (
                                                                <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                                                                    <label className="text-[10px] font-black text-blue-600 uppercase mb-1 block">Pick Review Date</label>
                                                                    <input
                                                                        type="date"
                                                                        className="w-full text-xs font-bold border-2 border-blue-200 dark:border-blue-900/50 rounded-xl p-2 bg-blue-100/30 dark:bg-blue-900/20 text-blue-950 dark:text-blue-100 focus:border-blue-500 outline-none"
                                                                        onChange={(e) => handleStagedChange(review.id, { date: e.target.value })}
                                                                    />
                                                                </div>
                                                            )}
                                                            {['DEFERRED', 'ON_HOLD', 'PROJECT_ENDED'].includes(currentStatus) && staged && (
                                                                <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                                                                    <label className="text-[10px] font-black text-amber-600 uppercase mb-1 block">Provide Reason</label>
                                                                    <textarea
                                                                        rows={2}
                                                                        placeholder="Explain the reason for this move..."
                                                                        className="w-full text-[10px] font-bold border-2 border-amber-200 dark:border-amber-900/50 rounded-xl p-2 bg-amber-100/30 dark:bg-amber-900/20 text-amber-950 dark:text-amber-100 focus:border-amber-500 outline-none"
                                                                        onChange={(e) => handleStagedChange(review.id, { reason: e.target.value })}
                                                                    />
                                                                </div>
                                                            )}

                                                            {/* Conduct Button (Only active if SCHEDULED) */}
                                                            {isScheduled ? (
                                                                <Link
                                                                    href={`/reviews/${review.id}/conduct`}
                                                                    className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-black text-center text-xs hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                                                                >
                                                                    <span>CONDUCT REVIEW</span>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                                    </svg>
                                                                </Link>
                                                            ) : (
                                                                <div className="bg-gray-200 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 px-4 py-2.5 rounded-xl font-black text-center text-xs flex items-center justify-center gap-2 cursor-not-allowed border-2 border-dashed border-gray-300 dark:border-gray-600">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                    </svg>
                                                                    <span>AWAITING SCHEDULE</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Completed Reviews Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700/50 transition-colors">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                            <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Completed & Terminal ({completedReviews.length})</h2>
                        </div>
                        <div className="overflow-x-auto">
                            {completedReviews.length === 0 ? (
                                <p className="p-12 text-gray-400 dark:text-gray-500 text-center text-lg font-medium italic">No completed reviews yet.</p>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                                    <thead className="bg-gray-50/30 dark:bg-gray-800/20">
                                        <tr>
                                            <th className="px-8 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-500 uppercase tracking-widest">Project / Date</th>
                                            <th className="px-8 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-500 uppercase tracking-widest max-w-[200px]">Reason / Comment</th>
                                            <th className="px-8 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-500 uppercase tracking-widest">Status / Outcome</th>
                                            <th className="px-8 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-500 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                        {completedReviews.map((review: any) => (
                                            <tr key={review.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="text-base font-bold text-gray-900 dark:text-white">{review.projectName}</div>
                                                    <div className="flex flex-col gap-0.5 mt-1">
                                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight">
                                                            SCH: {review.scheduledDate ? format(new Date(review.scheduledDate), 'MMM d, yyyy') : 'N/A'}
                                                        </div>
                                                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-tight">
                                                            SUB: {review.submittedDate ? format(new Date(review.submittedDate), 'MMM d, yyyy') : 'N/A'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-400 italic max-w-xs break-words">
                                                        {review.status === 'DEFERRED' ? (review.deferredReason || 'No reason provided') :
                                                            review.status === 'ON_HOLD' ? (review.onHoldReason || 'No reason provided') :
                                                                review.status === 'PROJECT_ENDED' ? (review.endedReason || 'No reason provided') :
                                                                    review.observations ? (review.observations.substring(0, 100) + (review.observations.length > 100 ? '...' : '')) : '-'}
                                                    </div>
                                                    <div className="text-xs text-gray-700 dark:text-gray-500 mt-1">QC: {review.contactName}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-2 items-start">
                                                        <span className={`px-3 py-1 text-[10px] rounded-full font-black uppercase tracking-wider ${review.status === 'SUBMITTED' ? 'bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-300' :
                                                            review.status === 'DEFERRED' ? 'bg-orange-200 text-orange-900 dark:bg-orange-900/40 dark:text-orange-300' :
                                                                review.status === 'ON_HOLD' ? 'bg-purple-200 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300' :
                                                                    'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300'
                                                            }`}>
                                                            {review.status?.replace('_', ' ')}
                                                        </span>
                                                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${review.healthStatus === 'On Track' ? 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900/20 dark:text-green-400' :
                                                            review.healthStatus === 'Slightly Challenged' ? 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                                                review.healthStatus === 'Critical' ? 'bg-red-100 text-red-900 border-red-300 dark:bg-red-900/20 dark:text-red-400' :
                                                                    'bg-red-200 text-red-950 border-red-400 dark:bg-red-900/40 dark:text-red-300'
                                                            }`}>
                                                            {review.healthStatus}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Link
                                                        href={`/reviews/${review.id}/conduct`}
                                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 font-black text-sm tracking-tight flex items-center gap-1 group"
                                                    >
                                                        VIEW DETAILS
                                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
