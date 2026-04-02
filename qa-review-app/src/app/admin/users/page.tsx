import { getUsers, getProjects } from "@/app/actions/admin";
import { UsersTable } from "@/components/UsersTable";
import { CreateUserForm } from "@/components/CreateUserForm";
import Link from "next/link";
import { Users } from "lucide-react";

import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
    const session = await getSession();
    const user = session?.user;
    const roles = (user?.roles as string[]) || [];
    const isAdmin = roles.includes("ADMIN");
    const isQAHead = roles.includes("QA_HEAD");
    const canCreate = isAdmin || isQAHead || roles.length === 0;

    const users = await getUsers();
    const projects = await getProjects();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">User Management</h1>
                    {canCreate && (
                        <Link
                            href="/admin/users/bulk-invite"
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <Users className="h-5 w-5" />
                            Bulk Invite
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* User List with Search */}
                    <UsersTable users={users} projects={projects} />

                    {/* Create User Form */}
                    {canCreate && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-fit transition-colors duration-200">
                            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Add User</h2>
                            <CreateUserForm projects={projects} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
