import { getProjects, getUsers, getForms, getContactPersonUsers, closeProject, reopenProject } from "@/app/actions/admin";
import { sendProjectInvites } from "@/app/actions/invite";
import Link from "next/link";
import { ProjectsTable } from "@/components/ProjectsTable";
import { CreateProjectForm } from "@/components/CreateProjectForm";
import { CreateReviewCycleForm } from "@/components/CreateReviewCycleForm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardPath } from "@/types/roles";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ type?: string }>;
}

export default async function AdminProjectsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const typeFilter = ['MANUAL', 'AUTOMATION_WEB', 'AUTOMATION_MOBILE', 'API', 'DESKTOP'].includes(params.type || '') ? params.type : 'ALL';

    const session = await getSession();
    const user = session?.user;
    const roles = (user?.roles as string[]) || [];
    const isAdmin = roles.includes("ADMIN");
    const isQAHead = roles.includes("QA_HEAD");

    // Redirect non-authorized users (e.g. Leads) back to their dashboard
    if (!isAdmin && !isQAHead) {
        return redirect(getDashboardPath(roles as any));
    }

    const canCreate = (isAdmin || isQAHead || roles.length === 0);

    const projects = await getProjects();
    const users = await getUsers();
    const forms = await getForms();
    const contactPersons = await getContactPersonUsers();

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

    // Page title based on type filter
    const pageTitle = 'Project Management';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{pageTitle}</h1>

                    <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl shadow-inner transition-colors">
                        <Link
                            href="/admin/projects?type=ALL"
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${typeFilter === 'ALL'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            ALL
                        </Link>
                        <Link
                            href="/admin/projects?type=MANUAL"
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${typeFilter === 'MANUAL'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            MANUAL
                        </Link>
                        <Link
                            href="/admin/projects?type=AUTOMATION_WEB"
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${typeFilter === 'AUTOMATION_WEB'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            WEB AUTO
                        </Link>
                        <Link
                            href="/admin/projects?type=AUTOMATION_MOBILE"
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${typeFilter === 'AUTOMATION_MOBILE'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            MOBILE AUTO
                        </Link>
                        <Link
                            href="/admin/projects?type=API"
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${typeFilter === 'API'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            API AUTO
                        </Link>
                        <Link
                            href="/admin/projects?type=DESKTOP"
                            className={`px-6 py-2 text-sm font-black rounded-lg transition-all ${typeFilter === 'DESKTOP'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            DESKTOP
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <ProjectsTable
                        projects={projects}
                        onInvite={sendProjectInvites}
                        onClose={closeProject}
                        onReopen={reopenProject}
                        initialTypeFilter={typeFilter as any}
                    />

                    {canCreate && (
                        <div className="space-y-8">
                            {/* Start Review Cycle */}
                            <CreateReviewCycleForm forms={forms} />

                            {/* Create Project Form */}
                            <CreateProjectForm
                                leads={leads}
                                reviewers={reviewers}
                                contactPersons={contactPersons}
                                pms={pms}
                                devArchitects={devArchitects}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
