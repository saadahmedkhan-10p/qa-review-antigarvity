"use client";

import { use, useEffect, useState } from "react";
import { getReview } from "@/app/actions/review";
import { updateReview } from "@/app/actions/admin";
import { getUserSession } from "@/app/actions/auth";
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
        onHoldReason: ""
    });

    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadData = async () => {
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
                    onHoldReason: reviewData.onHoldReason || ""
                });

                if (reviewData.answers) {
                    setAnswers(typeof reviewData.answers === 'string' ? JSON.parse(reviewData.answers) : reviewData.answers);
                }
            }
            setLoading(false);
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

    const rawQuestions = typeof review.form.questions === 'string' ? JSON.parse(review.form.questions || "[]") : (review.form.questions || []);
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
            await updateReview(review.id, answers, summary);
            toast.success("Review updated successfully!");
            router.push("/admin/reviews"); // Redirect to reviews list (or reports?)
        } catch (error) {
            toast.error("Failed to update review");
            console.error(error);
        }
    };

    const handleAnswerChange = (qId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [qId]: value }));
    };

    const handleCheckboxChange = (qId: string, option: string, checked: boolean) => {
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
                                <label className="block text-sm font-black uppercase tracking-widest text-black dark:text-white mb-3">Health Status</label>
                                <select
                                    required
                                    className="w-full p-4 border-2 border-indigo-200 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white font-bold text-lg focus:ring-4 focus:ring-indigo-500/50 transition-all outline-none"
                                    value={summary.healthStatus}
                                    onChange={(e) => setSummary(prev => ({ ...prev, healthStatus: e.target.value }))}
                                >
                                    <option value="On Track">On Track</option>
                                    <option value="Slightly Challenged">Slightly Challenged</option>
                                    <option value="Extremely Challenged">Extremely Challenged</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-black uppercase tracking-widest text-black dark:text-white mb-3">Observations</label>
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
                        </div>

                        {/* Admin/Head Only Section */}
                        {user?.roles && (JSON.parse(user.roles).includes('ADMIN') || JSON.parse(user.roles).includes('QA_HEAD')) && (
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

                    <div className="flex justify-end pt-8">
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
            </div >
        </div >
    );
}
