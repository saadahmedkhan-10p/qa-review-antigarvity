"use client";

import { createReviewCycle } from "@/app/actions/admin";
import { useState } from "react";
import toast from "react-hot-toast";

interface CreateReviewCycleFormProps {
    forms: any[]; // Using any to match the loose typing in the original page, but could be specific type
}

export function CreateReviewCycleForm({ forms }: CreateReviewCycleFormProps) {
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(formData: FormData) {
        const formId = formData.get("formId") as string;
        if (!formId) {
            toast.error("Please select a form");
            return;
        }

        setIsPending(true);
        try {
            await createReviewCycle(formId, false);
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
                            id="form"
                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        >
                            <option value="">Select a form</option>
                            {forms.map((f: any) => <option key={f.id} value={f.id}>{f.title}</option>)}
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
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select a form to evaluate the project baseline.
                </p>
            </form>
        </div>
    );
}
