"use client";

import { createReviewCycle } from "@/app/actions/admin";
import { useState } from "react";
import toast from "react-hot-toast";

interface CreateReviewCycleFormProps {
    forms: any[]; // Using any to match the loose typing in the original page, but could be specific type
}

export function CreateReviewCycleForm({ forms }: CreateReviewCycleFormProps) {
    const [targetNewOnly, setTargetNewOnly] = useState(false);
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(formData: FormData) {
        const formId = formData.get("formId") as string;
        if (!formId) {
            toast.error("Please select a form");
            return;
        }

        setIsPending(true);
        try {
            await createReviewCycle(formId, targetNewOnly);
            toast.success("Review cycle initiated and invites sent successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to initiate review cycle");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Initiate Review Cycle</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select a form to start a new review cycle for all projects.</p>
            <form action={handleSubmit} className="space-y-4">
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Review Form</label>
                        <select
                            name="formId"
                            required
                            disabled={isPending}
                            onChange={(e) => {
                                const selectedForm = forms.find(f => f.id === e.target.value);
                                if (selectedForm?.isSprint0) {
                                    setTargetNewOnly(true);
                                }
                            }}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                        >
                            <option value="">Select a form...</option>
                            {forms.map((f: any) => <option key={f.id} value={f.id}>{f.title}{f.isSprint0 ? ' (Sprint 0)' : ''}</option>)}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-[42px]"
                    >
                        {isPending ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Sending...
                            </>
                        ) : (
                            "Send Invites"
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="targetNewOnly"
                        checked={targetNewOnly}
                        onChange={(e) => setTargetNewOnly(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="targetNewOnly" className="text-sm text-gray-600 dark:text-gray-400">
                        Only target projects with no previous reviews (Target Sprint 0)
                    </label>
                </div>
            </form>
        </div>
    );
}
