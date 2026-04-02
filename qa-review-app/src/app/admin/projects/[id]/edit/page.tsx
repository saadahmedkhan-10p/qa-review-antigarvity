import { getProjects, getUsers, updateProject, getContactPersonUsers } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const projects = await getProjects();
    const users = await getUsers();
    const contactPersons = await getContactPersonUsers();

    const project = projects.find((p: any) => p.id === id);

    if (!project) {
        redirect("/admin/projects");
    }

    // Filter users by roles (stored as JSON string arrays)
    const leads = users.filter((u: any) => {
        try {
            const roles = JSON.parse(u.roles);
            return roles.includes("REVIEW_LEAD");
        } catch {
            return false;
        }
    });

    const reviewers = users.filter((u: any) => {
        try {
            const roles = JSON.parse(u.roles);
            return roles.includes("REVIEWER") || roles.includes("REVIEW_LEAD");
        } catch {
            return false;
        }
    });

    // Contacts filtering removed as we now use ContactPerson entity

    const pms = users.filter((u: any) => {
        try {
            const roles = JSON.parse(u.roles);
            return roles.includes("PM");
        } catch {
            return false;
        }
    });

    const devArchitects = users.filter((u: any) => {
        try {
            const roles = JSON.parse(u.roles);
            return roles.includes("DEV_ARCHITECT");
        } catch {
            return false;
        }
    });

    async function handleUpdate(formData: FormData) {
        "use server";
        await updateProject(id, formData);
        redirect("/admin/projects");
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Edit Project</h1>
                    <Link href="/admin/projects" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        ← Back to Projects
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow transition-colors duration-200">
                    <form action={handleUpdate} className="space-y-6">
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
                                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 font-medium shadow-lg transition-transform transform hover:scale-105"
                            >
                                Update Project
                            </button>
                            <Link
                                href="/admin/projects"
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
