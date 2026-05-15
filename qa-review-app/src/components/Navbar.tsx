"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { Role, getRoleLabel, canViewReports, getDashboardPath, ROLE_CONFIG } from "@/types/roles";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface NavDropdownProps {
    label: string;
    children: React.ReactNode;
    isActive: boolean;
}

function NavDropdown({ label, children, isActive }: NavDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
            >
                {label}
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50">
                    <div className="py-1" role="menu">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}

interface NavDropdownItemProps {
    href: string;
    isActive: boolean;
    children: React.ReactNode;
    onClick?: () => void;
}

function NavDropdownItem({ href, isActive, children }: NavDropdownItemProps) {
    return (
        <Link
            href={href}
            className={`block px-4 py-2 text-sm transition-colors ${isActive
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            role="menuitem"
        >
            {children}
        </Link>
    );
}

export default function Navbar() {
    const { user, logout, isAdmin, isManagement, isExecutive, isReviewStaff } = useAuth();
    const pathname = usePathname();

    if (!user || pathname === "/") return null;

    const roles = Array.isArray(user.roles) ? user.roles : [];

    // Helper to check if path is active
    const isPathActive = (path: string) => pathname.includes(path);

    // Check if any Manual-related path is active
    const isManualActive = isPathActive('/admin/projects') || isPathActive('/admin/reviews') ||
        isPathActive('/admin/forms') || isPathActive('/admin/users') ||
        isPathActive('/admin/reports') || isPathActive('/admin/activity-logs') ||
        isPathActive('/qa-manager') || isPathActive('/qa-architect') || isPathActive('/lead') ||
        isPathActive('/reviewer') || isPathActive('/pm') || isPathActive('/dev-architect') || isPathActive('/director');

    // For now Automation mirrors Manual - this can be customized later
    const isAutomationActive = isManualActive;

    return (
        <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-200 print:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center min-w-0">
                        <Link
                            href={getDashboardPath(roles)}
                            className="flex-shrink-0 flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                            <img src="/logo.png" alt="QA Review Logo" className="h-10 w-10" />
                            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 hidden md:block">QA Review</span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4 overflow-hidden">
                            {/* Management Navigation */}
                            {isManagement && (
                                <>
                                    <Link href="/admin/projects" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${isPathActive('/admin/projects') ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                        Projects
                                    </Link>
                                    <Link href="/admin/reviews" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${isPathActive('/admin/reviews') ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                        Reviews
                                    </Link>
                                    <Link href="/admin/forms" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${isPathActive('/admin/forms') ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                        Forms
                                    </Link>
                                    {(isAdmin || roles.includes("QA_HEAD")) && (
                                        <Link href="/admin/users" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${isPathActive('/admin/users') ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                            Users
                                        </Link>
                                    )}
                                    <Link href="/admin/reports" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${isPathActive('/admin/reports') ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                        Reports
                                    </Link>
                                    {isAdmin && (
                                        <>
                                            <Link href="/admin/activity-logs" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${isPathActive('/admin/activity-logs') ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                                Activity Logs
                                            </Link>
                                            <Link href="/admin/settings" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${isPathActive('/admin/settings') ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                                Settings
                                            </Link>
                                        </>
                                    )}
                                </>
                            )}

                            {/* Role Dashboards - Non-Management */}
                            {!isManagement && roles.map((role: Role) => {
                                const roleConfig = ROLE_CONFIG[role];
                                if (!roleConfig || role === 'GUEST' || !roleConfig.dashboardPath || roleConfig.dashboardPath === '/') return null;
                                
                                // Skip roles that are part of management as they are handled above
                                if (["ADMIN", "QA_HEAD", "QA_MANAGER", "QA_ARCHITECT"].includes(role)) return null;

                                return (
                                    <Link
                                        key={role}
                                        href={roleConfig.dashboardPath}
                                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${pathname.startsWith(roleConfig.dashboardPath) ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                    >
                                        {roleConfig.label} Dashboard
                                    </Link>
                                );
                            })}

                            {!isManagement && canViewReports(roles) && (
                                <Link href="/admin/reports" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${isPathActive('/admin/reports') ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                    Reports
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-4">
                        <NotificationBell />
                        <ThemeToggle />
                        <div className="hidden lg:flex flex-col items-end leading-tight mr-2">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                {user.name}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                {Array.isArray(roles) ? roles.map((r: Role) => getRoleLabel(r)).join(', ') : getRoleLabel(roles as any)}
                            </span>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors whitespace-nowrap"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
