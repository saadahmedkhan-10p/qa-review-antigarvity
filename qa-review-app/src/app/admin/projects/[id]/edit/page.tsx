import { getProjects, getUsers, getContactPersonUsers } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EditProjectForm } from "@/components/EditProjectForm";

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
            const roles = typeof u.roles === 'string' ? JSON.parse(u.roles || "[]") : (u.roles || []);
            return Array.isArray(roles) && roles.includes("REVIEW_LEAD");
        } catch {
            return false;
        }
    });

    const reviewers = users.filter((u: any) => {
        try {
            const roles = typeof u.roles === 'string' ? JSON.parse(u.roles || "[]") : (u.roles || []);
            return Array.isArray(roles) && (roles.includes("REVIEWER") || roles.includes("REVIEW_LEAD"));
        } catch {
            return false;
        }
    });

    const pms = users.filter((u: any) => {
        try {
            const roles = typeof u.roles === 'string' ? JSON.parse(u.roles || "[]") : (u.roles || []);
            return Array.isArray(roles) && roles.includes("PM");
        } catch {
            return false;
        }
    });

    const devArchitects = users.filter((u: any) => {
        try {
            const roles = typeof u.roles === 'string' ? JSON.parse(u.roles || "[]") : (u.roles || []);
            return Array.isArray(roles) && roles.includes("DEV_ARCHITECT");
        } catch {
            return false;
        }
    });

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
                    <EditProjectForm 
                        id={id}
                        project={project}
                        leads={leads}
                        reviewers={reviewers}
                        contactPersons={contactPersons}
                        pms={pms}
                        devArchitects={devArchitects}
                    />
                </div>
            </div>
        </div>
    );
}
