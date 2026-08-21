"use client";

import { use, useEffect, useState } from "react";
import { getReview, submitReview } from "@/app/actions/review";
import CommentsList from "@/components/comments/CommentsList";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/types/roles";
import { Clock } from "lucide-react";

export default function ConductReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [review, setReview] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, any>>({});

    // Summary focused only on the outcome of a conducted review
    const [summary, setSummary] = useState({
        healthStatus: "On Track",
        observations: "",
        recommendedActions: "",
        followUpComment: "",
        aiAnalysis: ""
    });

    const { user: authUser } = useAuth();
    const isAdmin = authUser?.roles ? (authUser.roles.includes("ADMIN") || authUser.roles.includes("QA_HEAD") || authUser.roles.includes("DIRECTOR")) : false;
    const isHead = authUser?.roles ? (authUser.roles.includes("ADMIN") || authUser.roles.includes("QA_HEAD")) : false;

    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        getReview(id).then(data => {
            setReview(data);
            if (data) {
                setSummary({
                    healthStatus: data.healthStatus || "On Track",
                    observations: data.observations || "",
                    recommendedActions: data.recommendedActions || "",
                    followUpComment: data.followUpComment || "",
                    aiAnalysis: data.aiAnalysis || ""
                });

                if (data.answers) {
                    const parsedAnswers = typeof data.answers === 'string' ? JSON.parse(data.answers) : data.answers;
                    // Sync top-level fields into dynamic form answers if not present (Legacy Support)
                    if (data.healthStatus && !parsedAnswers['health-status']) {
                        parsedAnswers['health-status'] = data.healthStatus;
                    }
                    if (data.observations && !parsedAnswers['health-observations']) {
                        parsedAnswers['health-observations'] = data.observations;
                    }
                    setAnswers(parsedAnswers);
                }
            }
            setLoading(false);
        });
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

    // Terminal statuses lock the conduct page
    const isLocked = ["SUBMITTED", "DEFERRED", "ON_HOLD", "PROJECT_ENDED", "NOT_COMPLETED"].includes(review.status);

    // Authorization check: Primary or secondary reviewer (either on the Review record or the current Project assignment)
    const isPrimary = review.reviewerId === authUser?.id;
    const isSecondary = review.secondaryReviewerId === authUser?.id;
    const isProjectPrimary = review.project?.reviewerId === authUser?.id;
    const isProjectSecondary = review.project?.secondaryReviewerId === authUser?.id;

    const canConduct = isPrimary || isSecondary || isProjectPrimary || isProjectSecondary || isAdmin;

    if (!canConduct && !loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 font-bold">Unauthorized</p>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">You are not assigned as a reviewer for this project.</p>
                </div>
            </div>
        );
    }

    const rawQuestions = typeof review.form.questions === 'string' ? JSON.parse(review.form.questions || "[]") : (review.form.questions || []);
    let sections: any[] = [];
    if (rawQuestions.length > 0) {
        if (rawQuestions[0].questions || rawQuestions[0].items) {
            sections = rawQuestions;
        } else {
            sections = [{ id: "general", title: "General", questions: rawQuestions }];
        }
    }

    const isOptionRequiringReason = (q: any, val: any) => {
        if (!val) return false;
        
        // Radio check
        if (q.type === 'radio') {
            const strVal = typeof val === 'string' ? val.trim().toLowerCase() : String(val).toLowerCase();
            if (q.requireReasonFor && Array.isArray(q.requireReasonFor)) {
                if (q.requireReasonFor.some((r: string) => r.trim().toLowerCase() === strVal)) {
                    return true;
                }
            }
            // Fallback for Teghub question if not yet re-saved in form builder
            const label = (q.label || q.text || "").toLowerCase();
            if (label.includes("teghub") && strVal === "no") {
                return true;
            }
        }
        
        // Checkbox check
        if (q.type === 'checkbox' && Array.isArray(val)) {
            if (q.requireReasonFor && Array.isArray(q.requireReasonFor)) {
                const lowerReasons = q.requireReasonFor.map((r: string) => r.trim().toLowerCase());
                if (val.some((v: string) => lowerReasons.includes(String(v).trim().toLowerCase()))) {
                    return true;
                }
            }
        }
        
        return false;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // All questions must be mandatory in form
        const rawQuestions = typeof review.form.questions === 'string' ? JSON.parse(review.form.questions || "[]") : (review.form.questions || []);
        let sections: any[] = [];
        if (rawQuestions.length > 0) {
            if (rawQuestions[0].questions || rawQuestions[0].items) {
                sections = rawQuestions;
            } else {
                sections = [{ id: "general", title: "General", questions: rawQuestions }];
            }
        }
        const allQuestions = sections.flatMap(sec => sec.questions || sec.items || []);
        const unanswered = allQuestions.filter(q => {
            const val = answers[q.id];
            if (q.type === 'checkbox') {
                return !val || !Array.isArray(val) || val.length === 0;
            }
            return val === undefined || val === null || (typeof val === 'string' && val.trim() === "");
        });

        // Check if any selected option requires a reason and whether reason is provided
        const missingReasons = allQuestions.filter(q => {
            const val = answers[q.id];
            if (isOptionRequiringReason(q, val)) {
                const reason = answers[`${q.id}_reason`];
                return !reason || (typeof reason === 'string' && reason.trim() === "");
            }
            return false;
        });

        if (unanswered.length > 0 || missingReasons.length > 0) {
            const errors: string[] = [];
            if (unanswered.length > 0) {
                errors.push(...unanswered.map(q => `"${q.label || q.text}"`));
            }
            if (missingReasons.length > 0) {
                errors.push(...missingReasons.map(q => `Reason for "${q.label || q.text}"`));
            }
            toast.error(`Please complete all mandatory fields: ${errors.join(", ")}`);
            return;
        }

        try {
            const finalSummary = {
                ...summary,
                status: "SUBMITTED"
            };

            await submitReview(review.id, answers, finalSummary);

            toast.success("Review submitted successfully!");
            router.push("/reviewer/dashboard");
        } catch (error) {
            toast.error("Failed to submit review");
            console.error(error);
        }
    };

    const handleAnswerChange = (qId: string, value: any) => {
        if (isLocked) return;
        setAnswers(prev => ({ ...prev, [qId]: value }));

        // Sync with summary fields if these are the magic health questions
        if (qId === 'health-status') {
            setSummary(prev => ({ ...prev, healthStatus: value }));
        } else if (qId === 'health-observations') {
            setSummary(prev => ({ ...prev, observations: value }));
        }
    };

    const handleCheckboxChange = (qId: string, option: string, checked: boolean) => {
        if (isLocked) return;
        const current = answers[qId] || [];
        if (checked) {
            handleAnswerChange(qId, [...current, option]);
        } else {
            handleAnswerChange(qId, current.filter((o: string) => o !== option));
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 border-b dark:border-gray-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{review.form.title}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Project:</span> {review.project.name}
                        </p>
                    </div>
                    {isLocked && (
                        <div className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest border shadow-sm animate-pulse ${review.status === 'NOT_COMPLETED' ? 'bg-orange-50 dark:bg-orange-900/40 text-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-700/50' : 'bg-amber-50 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-700/50'}`}>
                            {review.status.replace("_", " ")} (Read Only)
                        </div>
                    )}
                </div>

                {review.status === 'NOT_COMPLETED' && (
                    <div className="mb-10 p-6 bg-orange-50 border-2 border-orange-200 rounded-2xl dark:bg-orange-900/20 dark:border-orange-800/50">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg text-orange-600 dark:text-orange-400">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-orange-900 dark:text-orange-200">Marked as Not Completed on Time</h3>
                                <p className="mt-1 text-orange-800 dark:text-orange-300 font-medium">
                                    Reason: {review.notCompletedReason || "No reason provided."}
                                </p>
                                <p className="mt-2 text-sm text-orange-700/70 dark:text-orange-400/70 italic">
                                    This review has been locked by administration.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-12 pb-24">

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
                                                {q.label || q.text} <span className="text-red-500">*</span>
                                            </label>

                                            {q.type === "text" && (
                                                <textarea
                                                    disabled={isLocked}
                                                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white dark:bg-gray-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-600 disabled:opacity-40 disabled:bg-gray-100 dark:disabled:bg-gray-900 transition-all placeholder-gray-400 font-medium"
                                                    rows={3}
                                                    value={answers[q.id] || ""}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    placeholder="Type your observations here..."
                                                />
                                            )}

                                            {q.type === "radio" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {q.options.map((opt: string) => (
                                                        <label key={opt} className={`group flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${answers[q.id] === opt ? 'bg-indigo-50 border-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-500 shadow-sm' : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50'} ${!isLocked ? 'cursor-pointer' : ''}`}>
                                                            <input
                                                                disabled={isLocked}
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
                                                        <label key={opt} className={`group flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${(answers[q.id] || []).includes(opt) ? 'bg-indigo-50 border-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-500 shadow-sm' : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50'} ${!isLocked ? 'cursor-pointer' : ''}`}>
                                                            <input
                                                                disabled={isLocked}
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

                                            {/* Conditional Reason / Explanation Textbox */}
                                            {(() => {
                                                if (isOptionRequiringReason(q, answers[q.id])) {
                                                    return (
                                                        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-xl space-y-2 animate-fadeIn">
                                                            <label className="block text-sm font-bold text-amber-900 dark:text-amber-200">
                                                                Reason / Explanation <span className="text-red-500">*</span>
                                                            </label>
                                                            <textarea
                                                                disabled={isLocked}
                                                                rows={3}
                                                                className="w-full p-3 border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder-gray-400 resize-none disabled:opacity-60"
                                                                placeholder="Please provide the mandatory reason / explanation..."
                                                                value={answers[`${q.id}_reason`] || ""}
                                                                onChange={(e) => handleAnswerChange(`${q.id}_reason`, e.target.value)}
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

                    {/* Comments Section */}
                    <div className="mt-16">
                        <CommentsList reviewId={review.id} />
                    </div>

                    {!isLocked && (
                        <div className="flex justify-end pt-12">
                            <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-500 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-xl hover:shadow-green-500/30 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                            >
                                <span>Submit Review</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
