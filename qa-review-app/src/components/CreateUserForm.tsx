"use client";

import { createUser } from "@/app/actions/admin";
import { useState, useRef } from "react";
import toast from "react-hot-toast";

interface Project {
    id: string;
    name: string;
}

export function CreateUserForm({ projects }: { projects: Project[] }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsPending(true);
        try {
            await createUser(formData);
            toast.success("User created and email sent successfully");
            formRef.current?.reset();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to create user. Please try again.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <form ref={formRef} action={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                    name="name"
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="John Doe"
                    disabled={isPending}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                    name="email"
                    type="email"
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="john@example.com"
                    disabled={isPending}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Roles (Hold Ctrl/Cmd to select multiple)</label>
                <select
                    name="roles"
                    multiple
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 h-48 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isPending}
                >
                    <option value="ADMIN">Admin</option>
                    <option value="QA_HEAD">QA Head</option>
                    <option value="QA_MANAGER">QA Manager</option>
                    <option value="QA_ARCHITECT">QA Architect</option>
                    <option value="REVIEW_LEAD">Review Lead</option>
                    <option value="REVIEWER">Reviewer</option>
                    <option value="PM">Project Manager</option>
                    <option value="CONTACT_PERSON">Contact Person</option>
                    <option value="DIRECTOR">Director</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select one or more roles. Users can have multiple roles.
                </p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign to Projects (Optional)
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-40 overflow-y-auto bg-white dark:bg-gray-700">
                    {projects.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No projects available</p>
                    ) : (
                        projects.map((project) => (
                            <label key={project.id} className="flex items-center space-x-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="projectIds"
                                    value={project.id}
                                    className="rounded border-gray-300 dark:border-gray-500 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-600"
                                    disabled={isPending}
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-200">{project.name}</span>
                            </label>
                        ))
                    )}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    User will be assigned to selected projects based on their role
                </p>
            </div>
            <button
                type="submit"
                disabled={isPending}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${isPending ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
            >
                {isPending ? 'Creating...' : 'Create User'}
            </button>
        </form>
    );
}
