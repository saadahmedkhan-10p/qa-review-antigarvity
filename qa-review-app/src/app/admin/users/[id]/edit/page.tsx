import { getUsers, updateUser } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const users = await getUsers();

    const user = users.find((u: any) => u.id === id);

    if (!user) {
        redirect("/admin/users");
    }

    async function handleUpdate(formData: FormData) {
        "use server";
        await updateUser(id, formData);
        redirect("/admin/users");
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Edit User</h1>
                    <Link href="/admin/users" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        ← Back to Users
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow transition-colors duration-200">
                    <form action={handleUpdate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                            <input
                                name="name"
                                defaultValue={user.name}
                                required
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                name="email"
                                type="email"
                                defaultValue={user.email}
                                required
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Roles (Hold Ctrl/Cmd to select multiple)</label>
                            <select
                                name="roles"
                                multiple
                                defaultValue={typeof user.roles === 'string' ? JSON.parse(user.roles || "[]") : (user.roles || [])}
                                required
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-gray-900 dark:text-white dark:bg-gray-700 h-48 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="ADMIN">Admin</option>
                                <option value="QA_HEAD">QA Head</option>
                                <option value="QA_MANAGER">QA Manager</option>
                                <option value="QA_ARCHITECT">QA Architect</option>
                                <option value="REVIEW_LEAD">Review Lead</option>
                                <option value="REVIEWER">Reviewer</option>
                                <option value="PM">Project Manager</option>
                                <option value="DEV_ARCHITECT">Dev Architect</option>
                                <option value="DIRECTOR">Director</option>
                                <option value="CONTACT_PERSON">Contact Person</option>
                            </select>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Select one or more roles. Users can have multiple roles.
                            </p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 font-medium shadow-lg transition-transform transform hover:scale-105"
                            >
                                Update User
                            </button>
                            <Link
                                href="/admin/users"
                                className="flex-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 py-3 px-6 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium text-center transition-colors"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
