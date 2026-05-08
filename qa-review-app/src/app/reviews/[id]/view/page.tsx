"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CommentsList from "@/components/comments/CommentsList";

export default function ViewReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [review, setReview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function loadReview() {
            try {
                console.log('Fetching review:', id);
                const response = await fetch(`/api/reviews/${id}`);
                console.log('Response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('Review data received:', data.id);
                    setReview(data);
                } else {
                    const errorData = await response.json();
                    console.error("Failed to load review:", response.status, errorData);
                    alert(`Failed to load review: ${errorData.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.error("Error loading review:", error);
                alert(`Error loading review: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        }
        loadReview();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading review...</p>
                </div>
            </div>
        );
    }

    if (!review) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400">Review not found</p>
                    <Link href="/reviewer/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    let questionsData = [];
    try {
        questionsData = typeof review.form?.questions === 'string' 
            ? JSON.parse(review.form.questions || "[]") 
            : (review.form?.questions || []);
    } catch (e) {
        console.error("Failed to parse form questions:", e);
    }
    const answers = typeof review.answers === 'string' ? JSON.parse(review.answers || "{}") : (review.answers || {});

    // Flatten questions from sections structure or flat structure
    // Handling: [{title: "Section", questions: [...]}] OR [{id: "q1", label: "..."}]
    const allQuestions = questionsData.flatMap((item: any) => {
        if (item.questions && Array.isArray(item.questions)) return item.questions;
        if (item.items && Array.isArray(item.items)) return item.items;
        return [item];
    });

    console.log('Parsed questions:', {
        sectionsCount: questionsData.length,
        totalQuestions: allQuestions.length,
        sampleQuestion: allQuestions[0]
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 transition-colors duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{review.form?.title || 'Unknown Form'}</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Project: {review.project?.name || 'Unknown Project'}</p>
                        </div>
                        <span className="px-4 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-semibold">
                            {review.status}
                        </span>
                    </div>

                    {/* Project & Review Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Reviewer</h3>
                            <p className="text-gray-900 dark:text-white mt-1">{review.reviewer?.name || 'Unassigned'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Secondary Reviewer</h3>
                            <p className="text-gray-900 dark:text-white mt-1">{review.secondaryReviewer?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Review Lead</h3>
                            <p className="text-gray-900 dark:text-white mt-1">{review.project?.lead?.name || 'Not assigned'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">QA Contact</h3>
                            <p className="text-gray-900 dark:text-white mt-1">{review.project?.contactPerson?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Submitted Date</h3>
                            <p className="text-gray-900 dark:text-white mt-1">
                                {review.submittedDate ? new Date(review.submittedDate).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Review Info & Results */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 transition-colors duration-200">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                        <span className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">📊</span>
                        Review Summary
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Overall Health</h3>
                            <p className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                {review.status === 'NOT_COMPLETED' ? '-' : (
                                    <>
                                        {review.healthStatus === 'On Track' ? '✅' :
                                            review.healthStatus === 'Slightly Challenged' ? '⚠️' :
                                                review.healthStatus === 'Extremely Challenged' ? '🚨' :
                                                    review.healthStatus === 'Critical' ? '🚨' : '❓'}
                                        {review.healthStatus || 'Not set'}
                                    </>
                                )}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Review Status</h3>
                            <p className="text-xl font-black text-gray-900 dark:text-white uppercase">
                                {review.status}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Key Observations</h3>
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <p className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap">{review.observations || 'No observations provided'}</p>
                            </div>
                        </div>

                        {review.aiAnalysis && (
                            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-4 flex items-center gap-2">
                                    <span className="p-1 bg-indigo-100 dark:bg-indigo-900/50 rounded-md">✨</span>
                                    AI Analysis Assessment
                                </h3>
                                <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/50">
                                    {(() => {
                                        try {
                                            const analysis = JSON.parse(review.aiAnalysis);
                                            if (analysis && typeof analysis === 'object' && (analysis.riskLevel || analysis.summary)) {
                                                return (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                                                                analysis.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                                                analysis.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                                                                analysis.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                                                'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                            }`}>
                                                                {analysis.riskLevel || 'ANALYZED'}
                                                            </div>
                                                            {analysis.riskScore !== undefined && (
                                                                <div className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                                                    Risk Score: <span className="text-gray-900 dark:text-white">{analysis.riskScore}/10</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap leading-relaxed font-medium">
                                                            {analysis.summary}
                                                        </p>
                                                        {analysis.observations && Array.isArray(analysis.observations) && analysis.observations.length > 0 && (
                                                            <div className="mt-4">
                                                                <h4 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-2">Key Observations</h4>
                                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                                                    {analysis.observations.map((obs: string, idx: number) => (
                                                                        <li key={idx}>{obs}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {analysis.actionItems && Array.isArray(analysis.actionItems) && analysis.actionItems.length > 0 && (
                                                            <div className="mt-4">
                                                                <h4 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-2">Recommended Steps</h4>
                                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                                                    {analysis.actionItems.map((item: string, idx: number) => (
                                                                        <li key={idx}>{item}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                        } catch (e) {
                                            // Not JSON or malformed, render as plain text
                                        }
                                        return <p className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{review.aiAnalysis}</p>;
                                    })()}
                                </div>
                            </div>
                        )}

                        {review.recommendedActions && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Recommended Actions</h3>
                                <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-900/50">
                                    <p className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap">{review.recommendedActions}</p>
                                </div>
                            </div>
                        )}

                        {review.followUpComment && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Follow-up Comment (Admin)</h3>
                                <div className="bg-amber-50/30 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100/50 dark:border-amber-900/50">
                                    <p className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap">{review.followUpComment}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Review Answers */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 transition-colors duration-200">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Review Responses</h2>

                    <div className="space-y-6">
                        {allQuestions.map((q: any, index: number) => (
                            <div key={q.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 rounded-full flex items-center justify-center font-semibold text-sm">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{q.label}</h3>

                                        {q.type === "text" && (
                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                <p className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap">{typeof answers[q.id] === 'string' ? answers[q.id] : (answers[q.id] ? JSON.stringify(answers[q.id]) : 'No answer provided')}</p>
                                            </div>
                                        )}

                                        {q.type === "radio" && (
                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                <p className="text-gray-900 dark:text-gray-200 font-medium">{typeof answers[q.id] === 'string' ? answers[q.id] : (answers[q.id] ? JSON.stringify(answers[q.id]) : 'No answer provided')}</p>
                                            </div>
                                        )}

                                        {q.type === "checkbox" && (
                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                {Array.isArray(answers[q.id]) && answers[q.id].length > 0 ? (
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {answers[q.id].map((answer: any, i: number) => (
                                                            <li key={i} className="text-gray-900 dark:text-gray-200">{typeof answer === 'string' ? answer : JSON.stringify(answer)}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-gray-500 dark:text-gray-400">
                                                        {typeof answers[q.id] === 'string' ? answers[q.id] : 'No answers selected'}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comments Section */}
                <CommentsList reviewId={id} />

                {/* Actions */}
                <div className="mt-6 flex justify-between">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-500 transition"
                    >
                        ← Back
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 transition"
                    >
                        🖨️ Print Review
                    </button>
                </div>
            </div>
        </div>
    );
}
