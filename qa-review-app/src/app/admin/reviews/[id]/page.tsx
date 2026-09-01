"use client";

import { use, useEffect, useState } from "react";
import { getReview } from "@/app/actions/review";
import { updateReview } from "@/app/actions/admin";
import { generateAIAnalysis } from "@/app/actions/ai";
import { getUserSession } from "@/app/actions/auth";
import CommentsList from "@/components/comments/CommentsList";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [user, setUser] = useState<any>(null);
    const [review, setReview] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, any>>({});

    // Summary state including followUpComment
    const [summary, setSummary] = useState({
        healthStatus: "On Track",
        observations: "",
        recommendedActions: "",
        followUpComment: "",
        deferredReason: "",
        endedReason: "",
        onHoldReason: "",
        notCompletedReason: "",
        aiAnalysis: "",
        status: "PENDING"
    });

    const [loading, setLoading] = useState(true);
    const [generatingAI, setGeneratingAI] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [reviewData, sessionData] = await Promise.all([
                    getReview(id),
                    getUserSession()
                ]);

                setReview(reviewData);
                if (sessionData && sessionData.user) {
                    setUser(sessionData.user);
                }

                if (reviewData) {
                    setSummary({
                        healthStatus: reviewData.healthStatus || "On Track",
                        observations: reviewData.observations || "",
                        recommendedActions: reviewData.recommendedActions || "",
                        followUpComment: reviewData.followUpComment || "",
                        deferredReason: reviewData.deferredReason || "",
                        endedReason: reviewData.endedReason || "",
                        onHoldReason: reviewData.onHoldReason || "",
                        notCompletedReason: reviewData.notCompletedReason || "",
                        aiAnalysis: reviewData.aiAnalysis || "",
                        status: reviewData.status || "PENDING"
                    });

                    if (reviewData.answers) {
                        try {
                            setAnswers(typeof reviewData.answers === 'string' ? JSON.parse(reviewData.answers) : reviewData.answers);
                        } catch (e) {
                            console.error("Failed to parse answers:", e);
                            setAnswers({});
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading admin review data:", error);
                toast.error("Failed to load review data. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
        </div>
    );

    if (!review) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 font-medium">Review not found</p>
            </div>
        </div>
    );

    let rawQuestions = [];
    try {
        rawQuestions = typeof review.form?.questions === 'string' 
            ? JSON.parse(review.form.questions || "[]") 
            : (review.form?.questions || []);
    } catch (e) {
        console.error("Failed to parse form questions:", e);
    }
    let sections: any[] = [];
    if (rawQuestions.length > 0) {
        if (rawQuestions[0].questions || rawQuestions[0].items) {
            sections = rawQuestions;
        } else {
            sections = [{ id: "general", title: "General", questions: rawQuestions }];
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const finalSummary = {
                ...summary,
                deferredReason: summary.status === 'DEFERRED' ? (summary.deferredReason || summary.followUpComment || summary.observations || null) : summary.deferredReason,
                onHoldReason: summary.status === 'ON_HOLD' ? (summary.onHoldReason || summary.followUpComment || summary.observations || null) : summary.onHoldReason,
                endedReason: summary.status === 'PROJECT_ENDED' ? (summary.endedReason || summary.followUpComment || summary.observations || null) : summary.endedReason,
                notCompletedReason: summary.status === 'NOT_COMPLETED' ? (summary.notCompletedReason || summary.followUpComment || summary.observations || null) : summary.notCompletedReason,
            };

            await updateReview(review.id, answers, finalSummary);
            toast.success("Review updated successfully!");
            router.push("/admin/reviews"); // Redirect to reviews list
        } catch (error) {
            toast.error("Failed to update review");
            console.error(error);
        }
    };

    const handleAnswerChange = (qId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [qId]: value }));
        
        // Sync with summary fields if these are the magic health questions
        if (qId === 'health-status') {
            setSummary(prev => ({ ...prev, healthStatus: value }));
        } else if (qId === 'health-observations') {
            setSummary(prev => ({ ...prev, observations: value }));
        }
    };

    const handleCheckboxChange = (qId: string, option: string, checked: boolean) => {
        const current = answers[qId] || [];
        if (checked) {
            handleAnswerChange(qId, [...current, option]);
        } else {
            handleAnswerChange(qId, current.filter((o: string) => o !== option));
        }
    };

    const handleGenerateAI = async () => {
        setGeneratingAI(true);
        try {
            const result = await generateAIAnalysis(review.id);
            // The action now returns { error } instead of throwing in production,
            // so we check for the error property first.
            if (result.error) {
                toast.error(result.error);
                console.error("AI analysis error:", result.error);
            } else {
                setSummary(prev => ({ ...prev, aiAnalysis: result.analysis || "" }));
                toast.success("AI Analysis generated!");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to generate AI analysis");
            console.error(error);
        } finally {
            setGeneratingAI(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 border-b dark:border-gray-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Edit Review: {review.form.title}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Project:</span> {review.project.name}
                        </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest border border-blue-200 dark:border-blue-700/50 shadow-sm">
                        Admin Mode
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12 pb-24">

                    {/* Review Information — Fixed auto-filled section */}
                    <div className="bg-indigo-50/70 dark:bg-indigo-900/20 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6 flex items-center gap-3">
                            <span className="w-1.5 h-7 bg-indigo-400 dark:bg-indigo-500 rounded-full"></span>
                            Review Information
                            <span className="ml-auto text-xs font-semibold px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800">Auto-filled</span>
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Project Name */}
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-2">Project Name</div>
                                <div className="w-full border-2 border-indigo-100 dark:border-indigo-800/60 rounded-xl p-4 text-gray-900 dark:text-white bg-white dark:bg-gray-900 font-semibold">
                                    {review.project.name}
                                </div>
                            </div>
                            {/* QA Contact Person */}
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-2">QA Contact Person</div>
                                <div className="w-full border-2 border-indigo-100 dark:border-indigo-800/60 rounded-xl p-4 text-gray-900 dark:text-white bg-white dark:bg-gray-900 font-semibold">
                                    {review.project.contactPerson?.name || <span className="text-gray-400 font-normal italic">Not assigned</span>}
                                </div>
                            </div>
                            {/* Primary Reviewer */}
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-2">Primary Reviewer</div>
                                <div className="w-full border-2 border-indigo-100 dark:border-indigo-800/60 rounded-xl p-4 text-gray-900 dark:text-white bg-white dark:bg-gray-900 font-semibold">
                                    {review.reviewer?.name || review.project.reviewer?.name || <span className="text-gray-400 font-normal italic">Not assigned</span>}
                                </div>
                            </div>
                            {/* Secondary Reviewer */}
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-2">Secondary Reviewer</div>
                                <div className="w-full border-2 border-indigo-100 dark:border-indigo-800/60 rounded-xl p-4 text-gray-900 dark:text-white bg-white dark:bg-gray-900 font-semibold">
                                    {review.secondaryReviewer?.name || review.project.secondaryReviewer?.name || <span className="text-gray-400 font-normal italic">Not assigned</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Questionnaire */}
                    <div className="space-y-10">
                        {sections.map((section: any) => (
                            <div key={section.id} className="bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl p-8 border border-gray-200 dark:border-gray-700/60 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-8 flex items-center gap-3">
                                    <span className="w-1.5 h-7 bg-indigo-600 dark:bg-indigo-500 rounded-full"></span>
                                    {section.title}
                                </h2>
                                <div className="space-y-10">
                                    {(section.questions || section.items || []).map((q: any) => (
                                        <div key={q.id}>
                                            <label className="block text-base font-bold text-gray-900 dark:text-gray-100 mb-4 leading-relaxed">
                                                {q.label || q.text}
                                            </label>

                                            {q.type === "text" && (
                                                <textarea
                                                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white dark:bg-gray-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-600 transition-all placeholder-gray-400 font-medium"
                                                    rows={3}
                                                    value={answers[q.id] || ""}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                />
                                            )}

                                            {q.type === "radio" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {q.options.map((opt: string) => (
                                                        <label key={opt} className={`group flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${answers[q.id] === opt ? 'bg-indigo-50 border-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-500 shadow-sm' : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50'} cursor-pointer`}>
                                                            <input
                                                                type="radio"
                                                                name={q.id}
                                                                value={opt}
                                                                checked={answers[q.id] === opt}
                                                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                                className="text-indigo-600 focus:ring-indigo-500 h-5 w-5 dark:bg-gray-900 dark:border-gray-700"
                                                            />
                                                            <span className="text-gray-900 dark:text-gray-100 font-bold">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {q.type === "checkbox" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {q.options.map((opt: string) => (
                                                        <label key={opt} className={`group flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${(answers[q.id] || []).includes(opt) ? 'bg-indigo-50 border-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-500 shadow-sm' : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50'} cursor-pointer`}>
                                                            <input
                                                                type="checkbox"
                                                                value={opt}
                                                                checked={(answers[q.id] || []).includes(opt)}
                                                                onChange={(e) => handleCheckboxChange(q.id, opt, e.target.checked)}
                                                                className="rounded text-indigo-600 focus:ring-indigo-500 h-5 w-5 dark:bg-gray-900 dark:border-gray-700"
                                                            />
                                                            <span className="text-gray-900 dark:text-gray-100 font-bold">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Reason / Explanation — shown if a reason was submitted or if current selection requires one */}
                                            {(() => {
                                                const val = answers[q.id];
                                                const reasonKey = `${q.id}_reason`;
                                                const hasStoredReason = !!answers[reasonKey];

                                                // Check if current selection requires a reason
                                                let requiresReason = false;
                                                if (q.type === 'radio' && q.requireReasonFor && Array.isArray(q.requireReasonFor)) {
                                                    requiresReason = q.requireReasonFor.some((r: string) => r.trim().toLowerCase() === String(val || '').trim().toLowerCase());
                                                } else if (q.type === 'radio' && (q.label || q.text || '').toLowerCase().includes('teghub')) {
                                                    requiresReason = String(val || '').trim().toLowerCase() === 'no';
                                                } else if (q.type === 'checkbox' && q.requireReasonFor && Array.isArray(q.requireReasonFor) && Array.isArray(val)) {
                                                    const lowerReasons = q.requireReasonFor.map((r: string) => r.trim().toLowerCase());
                                                    requiresReason = val.some((v: string) => lowerReasons.includes(String(v).trim().toLowerCase()));
                                                }

                                                if (requiresReason || hasStoredReason) {
                                                    return (
                                                        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-xl space-y-2">
                                                            <label className="block text-sm font-bold text-amber-900 dark:text-amber-200">
                                                                Reason / Explanation {requiresReason && <span className="text-red-500">*</span>}
                                                            </label>
                                                            <textarea
                                                                rows={3}
                                                                className="w-full p-3 border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder-gray-400 resize-none"
                                                                placeholder="Reason / explanation provided by the reviewer..."
                                                                value={answers[reasonKey] || ""}
                                                                onChange={(e) => handleAnswerChange(reasonKey, e.target.value)}
                                                            />
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary Section */}
                    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl p-8 shadow-2xl border-4 border-indigo-700 dark:border-indigo-900/50 space-y-8">
                        <h2 className="text-2xl font-black flex items-center gap-3">
                            <span className="p-2 bg-indigo-500 rounded-lg text-white">📋</span>
                            Review Results
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-black uppercase tracking-widest text-black dark:text-white mb-3">Review Status</label>
                                <select
                                    required
                                    className="w-full p-4 border-2 border-blue-200 dark:border-blue-900 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white font-bold text-lg focus:ring-4 focus:ring-blue-500/50 transition-all outline-none"
                                    value={summary.status}
                                    onChange={(e) => setSummary(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="PENDING">PENDING</option>
                                    <option value="SCHEDULED">SCHEDULED</option>
                                    <option value="SUBMITTED">SUBMITTED</option>
                                    <option value="DEFERRED">DEFERRED</option>
                                    <option value="ON_HOLD">ON HOLD</option>
                                    <option value="PROJECT_ENDED">PROJECT ENDED</option>
                                    <option value="NOT_COMPLETED">NOT COMPLETED</option>
                                </select>

                                {/* Conditional Reason Fields */}
                                {summary.status === 'DEFERRED' && (
                                    <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl space-y-2 animate-in fade-in duration-200">
                                        <label className="block text-xs font-black uppercase tracking-wider text-orange-900 dark:text-orange-200">
                                            Deferred Reason <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={3}
                                            required
                                            className="w-full p-3 border border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none placeholder-gray-400"
                                            placeholder="Provide the reason for deferring this review..."
                                            value={summary.deferredReason}
                                            onChange={(e) => setSummary(prev => ({ ...prev, deferredReason: e.target.value }))}
                                        />
                                    </div>
                                )}

                                {summary.status === 'ON_HOLD' && (
                                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl space-y-2 animate-in fade-in duration-200">
                                        <label className="block text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-200">
                                            On Hold Reason <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={3}
                                            required
                                            className="w-full p-3 border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none placeholder-gray-400"
                                            placeholder="Provide the reason for putting this review on hold..."
                                            value={summary.onHoldReason}
                                            onChange={(e) => setSummary(prev => ({ ...prev, onHoldReason: e.target.value }))}
                                        />
                                    </div>
                                )}

                                {summary.status === 'PROJECT_ENDED' && (
                                    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-xl space-y-2 animate-in fade-in duration-200">
                                        <label className="block text-xs font-black uppercase tracking-wider text-gray-900 dark:text-gray-200">
                                            Project Ended Reason <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={3}
                                            required
                                            className="w-full p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-gray-500 outline-none placeholder-gray-400"
                                            placeholder="Provide the reason why this project has ended..."
                                            value={summary.endedReason}
                                            onChange={(e) => setSummary(prev => ({ ...prev, endedReason: e.target.value }))}
                                        />
                                    </div>
                                )}

                                {summary.status === 'NOT_COMPLETED' && (
                                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl space-y-2 animate-in fade-in duration-200">
                                        <label className="block text-xs font-black uppercase tracking-wider text-red-900 dark:text-red-200">
                                            Not Completed Reason <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={3}
                                            required
                                            className="w-full p-3 border border-red-300 dark:border-red-700 bg-white dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none placeholder-gray-400"
                                            placeholder="Provide the reason why this review was not completed on time..."
                                            value={summary.notCompletedReason}
                                            onChange={(e) => setSummary(prev => ({ ...prev, notCompletedReason: e.target.value }))}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-black uppercase tracking-widest text-black dark:text-white mb-3">Observations (Summary)</label>
                                <textarea
                                    rows={4}
                                    className="w-full p-4 border-2 border-indigo-200 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white font-medium focus:ring-4 focus:ring-indigo-500/50 transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Key findings from this review..."
                                    value={summary.observations}
                                    onChange={(e) => setSummary(prev => ({ ...prev, observations: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-black uppercase tracking-widest text-black dark:text-white mb-3">Recommended Actions (Reviewer)</label>
                            <textarea
                                rows={3}
                                className="w-full p-4 border-2 border-indigo-200 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white font-medium focus:ring-4 focus:ring-indigo-500/50 transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="Reviewer's recommended actions..."
                                value={summary.recommendedActions}
                                onChange={(e) => setSummary(prev => ({ ...prev, recommendedActions: e.target.value }))}
                            />
                        </div>                        {user?.roles && (user.roles.includes('ADMIN') || user.roles.includes('QA_HEAD')) && (
                            <div>
                                <label className="block text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">AI Analysis (Structured)</label>
                                
                                {(() => {
                                    try {
                                        if (!summary.aiAnalysis) return null;
                                        const analysis = JSON.parse(summary.aiAnalysis);
                                        if (analysis && typeof analysis === 'object' && (analysis.summary || analysis.riskLevel)) {
                                            return (
                                                <div className="mb-4 p-6 bg-indigo-50/30 dark:bg-indigo-900/20 rounded-2xl border-2 border-indigo-100 dark:border-indigo-800/50">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                                String(analysis.riskLevel) === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                                                String(analysis.riskLevel) === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                                                                String(analysis.riskLevel) === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                            }`}>
                                                                {typeof analysis.riskLevel === 'string' ? analysis.riskLevel : 'ANALYZED'} RISK
                                                            </span>
                                                            {analysis.riskScore !== undefined && (
                                                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                                                    Score: {analysis.riskScore}/10
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setSummary(prev => ({ ...prev, aiAnalysis: "" }))}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                            title="Clear Analysis"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    
                                                    <p className="text-gray-800 dark:text-gray-200 font-bold mb-4 leading-relaxed">
                                                        {(typeof analysis.summary === 'string' ? analysis.summary : JSON.stringify(analysis.summary))
                                                            .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
                                                            .trim()}
                                                    </p>
                                                    
                                                    {analysis.observations && Array.isArray(analysis.observations) && analysis.observations.length > 0 && (
                                                        <div className="mb-4">
                                                            <h4 className="text-[10px] font-black uppercase text-indigo-500 mb-2">Key Observations</h4>
                                                            <ul className="space-y-1">
                                                                {analysis.observations.map((obs: any, idx: number) => (
                                                                    <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex gap-2">
                                                                        <span className="text-indigo-400">•</span> {typeof obs === 'string' ? obs : JSON.stringify(obs)}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
 
                                                    {analysis.actionItems && Array.isArray(analysis.actionItems) && analysis.actionItems.length > 0 && (
                                                        <div>
                                                            <h4 className="text-[10px] font-black uppercase text-emerald-500 mb-2">Recommended Actions</h4>
                                                            <ul className="space-y-1">
                                                                {analysis.actionItems.map((item: any, idx: number) => (
                                                                    <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex gap-2">
                                                                        <span className="text-emerald-400">→</span> {typeof item === 'string' ? item : JSON.stringify(item)}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                    } catch (e) {
                                        // Not JSON, just show textarea
                                    }
                                    return null;
                                })()}
 
                                <div className="relative group">
                                    <textarea
                                        rows={4}
                                        className="w-full p-4 border-2 border-indigo-200 dark:border-indigo-900/5 bg-indigo-50/10 dark:bg-indigo-900/5 rounded-xl text-gray-900 dark:text-white font-medium focus:ring-4 focus:ring-indigo-500/50 transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500 text-xs font-mono"
                                        placeholder="AI generated feedback or external analysis summary (JSON supported)..."
                                        value={summary.aiAnalysis}
                                        onChange={(e) => setSummary(prev => ({ ...prev, aiAnalysis: e.target.value }))}
                                    />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded">RAW JSON/TEXT</span>
                                    </div>
                                </div>
                                
                                <div className="mt-3 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleGenerateAI}
                                        disabled={generatingAI}
                                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 transform hover:-translate-y-0.5"
                                    >
                                        {generatingAI ? (
                                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                                        ) : (
                                            <span className="text-lg">✨</span>
                                        )}
                                        {generatingAI ? "AI is thinking..." : "Generate AI Analysis"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Admin/Head Only Section */}
                        {user?.roles && (user.roles.includes('ADMIN') || user.roles.includes('QA_HEAD') || user.roles.includes('DIRECTOR')) && (
                            <div>
                                <label className="block text-sm font-black uppercase tracking-widest text-black dark:text-white mb-3">Follow-up Comment</label>
                                <textarea
                                    rows={2}
                                    className="w-full p-4 border-2 border-indigo-200 dark:border-gray-600 bg-indigo-50/10 dark:bg-indigo-900/10 rounded-xl text-gray-900 dark:text-white font-medium focus:ring-4 focus:ring-indigo-500/50 transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Admin follow-up comments..."
                                    value={summary.followUpComment}
                                    onChange={(e) => setSummary(prev => ({ ...prev, followUpComment: e.target.value }))}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-8 mb-12">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-xl hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                        >
                            <span>Update Review</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </form>

                <div className="mt-12">
                    <CommentsList reviewId={id} />
                </div>
            </div >
        </div >
    );
}
