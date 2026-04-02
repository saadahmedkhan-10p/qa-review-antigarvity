"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDashboardPath, Role } from "@/types/roles";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/");
            } else {
                // Redirect based on role using helper
                const dashboardPath = getDashboardPath(user.roles as Role[]);
                router.push(dashboardPath);
            }
        }
    }, [user, loading, router]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return null;
}
