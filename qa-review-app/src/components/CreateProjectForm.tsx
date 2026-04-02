"use client";

import { createProject } from "@/app/actions/admin";
import { useState, useRef } from "react";
import toast from "react-hot-toast";

interface User {
    id: string;
    name: string;
}

interface CreateProjectFormProps {
    leads: User[];
    reviewers: User[];
    contactPersons: User[];
    pms: User[];
    devArchitects: User[];
}

export function CreateProjectForm({ leads, reviewers, contactPersons, pms, devArchitects }: CreateProjectFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsPending(true);
        try {
            await createProject(formData);
            toast.success("Project created successfully");
            formRef.current?.reset();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create project");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Add Project</h2>
            <form ref={formRef} action={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Name</label>
                    <input
                        name="name"
                        required
                        disabled={isPending}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                        name="description"
                        disabled={isPending}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Type</label>
                    <select
                        name="type"
                        required
                        disabled={isPending}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    >
                        <option value="MANUAL">MANUAL</option>
                        <option value="AUTOMATION_WEB">WEB AUTO</option>
                        <option value="AUTOMATION_MOBILE">MOB AUTO</option>
                        <option value="API">API AUTO</option>
                        <option value="DESKTOP">DESKTOP</option>

                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Review Lead (Optional)</label>
                    <select
                        name="leadId"
                        disabled={isPending}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    >
                        <option value="">-- None --</option>
                        {leads.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reviewer (Primary) (Optional)</label>
                    <select
                        name="reviewerId"
                        disabled={isPending}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    >
                        <option value="">-- None --</option>
                        {reviewers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Secondary Reviewer (Optional)</label>
                    <select
                        name="secondaryReviewerId"
                        disabled={isPending}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    >
                        <option value="">-- None --</option>
                        {reviewers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">QA Contact Person</label>
                    <select
                        name="contactPersonId"
                        required
                        disabled={isPending}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    >
                        {contactPersons.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Manager (Optional)</label>
                    <select
                        name="pmId"
                        disabled={isPending}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    >
                        <option value="">-- None --</option>
                        {pms.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dev Architect (Optional)</label>
                    <select
                        name="devArchitectId"
                        disabled={isPending}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    >
                        <option value="">-- None --</option>
                        {devArchitects.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? 'Creating...' : 'Create Project'}
                </button>
            </form>
        </div>
    );
}
