"use client";

import { useState } from "react";
import { updateProject } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface EditProjectFormProps {
    id: string;
    project: any;
    leads: any[];
    reviewers: any[];
    contactPersons: any[];
    pms: any[];
    devArchitects: any[];
}

export function EditProjectForm({
    id,
    project,
    leads,
    reviewers,
    contactPersons,
    pms,
    devArchitects
}: EditProjectFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const result = await updateProject(id, data);
            
            if (result.success) {
                toast.success("Project updated successfully!");
                router.push("/admin/projects");
                router.refresh(); // Ensure the projects list is fresh
            } else {
                setError(result.error || "Failed to update project.");
                toast.error(result.error || "Failed to update project.");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
            toast.error("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700 dark:text-red-300 font-bold">
                                {error}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Name</label>
                <input
                    name="name"
                    defaultValue={project.name}
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                    name="description"
                    defaultValue={project.description || ""}
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Type</label>
                <select
                    name="type"
                    defaultValue={project.type || "MANUAL"}
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="MANUAL">MANUAL</option>
                    <option value="AUTOMATION_WEB">WEB AUTO</option>
                    <option value="AUTOMATION_MOBILE">MOB AUTO</option>
                    <option value="API">API AUTO</option>
                    <option value="DESKTOP">DESKTOP</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Review Lead</label>
                <select
                    name="leadId"
                    defaultValue={project.leadId || ""}
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    {leads.map((u: any) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reviewer (Primary)</label>
                <select
                    name="reviewerId"
                    defaultValue={project.reviewerId || ""}
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    {reviewers.map((u: any) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Secondary Reviewer (Optional)</label>
                <select
                    name="secondaryReviewerId"
                    defaultValue={project.secondaryReviewerId || ""}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">-- None --</option>
                    {reviewers.map((u: any) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">QA Contact Person</label>
                <select
                    name="contactPersonId"
                    defaultValue={project.contactPersonId || ""}
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    {contactPersons.map((c: any) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Manager (Optional)</label>
                <select
                    name="pmId"
                    defaultValue={project.pmId || ""}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">-- None --</option>
                    {pms.map((u: any) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dev Architect (Optional)</label>
                <select
                    name="devArchitectId"
                    defaultValue={project.devArchitectId || ""}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">-- None --</option>
                    {devArchitects.map((u: any) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 font-medium shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                            Updating...
                        </span>
                    ) : "Update Project"}
                </button>
                <Link
                    href="/admin/projects"
                    className="flex-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 py-3 px-6 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium text-center transition-colors"
                >
                    Cancel
                </Link>
            </div>
        </form>
    );
}
