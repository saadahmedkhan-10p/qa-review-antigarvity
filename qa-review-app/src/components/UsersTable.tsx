"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { DeleteUserButton } from "@/components/DeleteUserButton";
import { TableSearch } from "@/components/TableSearch";
import { Pencil } from "lucide-react";
import { Role, getRoleBadgeColor, getRoleLabel, getAllRoles } from "@/types/roles";
import { Pagination } from "@/components/Pagination";
import { useTableSort } from "@/hooks/useTableSort";
import { useTableSearch } from "@/hooks/useTableSearch";
import { SortIcon } from "@/components/table/SortIcon";
import { ColumnFilter } from "@/components/table/ColumnFilter";

interface User {
    id: string;
    name: string;
    email: string;
    roles: string | unknown; // Prisma Json column returns JsonValue; component handles both string and array
}

interface Project {
    id: string;
    reviewerId?: string | null;
    secondaryReviewerId?: string | null;
    leadId?: string | null;
}

export function UsersTable({ users, projects = [] }: { users: User[]; projects?: Project[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("ALL");
    const [projectCountFilter, setProjectCountFilter] = useState<string>("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Calculate project counts for each user
    const getUserProjectCounts = (userId: string) => {
        return {
            reviewer: projects.filter(p => p.reviewerId === userId).length,
            secondaryReviewer: projects.filter(p => p.secondaryReviewerId === userId).length,
            lead: projects.filter(p => p.leadId === userId).length
        };
    };

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch =
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesRole = true;
            if (roleFilter !== "ALL") {
                try {
                    const rolesRaw = user.roles;
                    const rolesArray: string[] = typeof rolesRaw === 'string' ? JSON.parse(rolesRaw) : (rolesRaw as string[]);
                    matchesRole = rolesArray.includes(roleFilter);
                } catch {
                    matchesRole = false;
                }
            }

            let matchesProjectCount = true;
            if (projectCountFilter !== "ALL") {
                const counts = getUserProjectCounts(user.id);
                const totalProjects = counts.reviewer + counts.secondaryReviewer + counts.lead;

                switch (projectCountFilter) {
                    case "0":
                        matchesProjectCount = totalProjects === 0;
                        break;
                    case "1-2":
                        matchesProjectCount = totalProjects >= 1 && totalProjects <= 2;
                        break;
                    case "3-5":
                        matchesProjectCount = totalProjects >= 3 && totalProjects <= 5;
                        break;
                    case "6+":
                        matchesProjectCount = totalProjects >= 6;
                        break;
                }
            }

            return matchesSearch && matchesRole && matchesProjectCount;
        });
    }, [users, searchQuery, roleFilter, projectCountFilter]);

    // Apply column filters
    const { filteredData: columnFilteredUsers, searchFilters, handleSearch } = useTableSearch(filteredUsers);

    // Apply sorting
    const { sortedData, sortConfig, handleSort } = useTableSort(columnFilteredUsers);

    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(start, start + itemsPerPage);
    }, [sortedData, currentPage]);

    // Reset to page 1 when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, roleFilter, projectCountFilter]);

    return (
        <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                    All Users ({filteredUsers.length})
                </h2>
            </div>

            <div className="mb-4 flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                    <TableSearch placeholder="Search by name or email..." onSearch={setSearchQuery} />
                </div>
                <div className="min-w-[150px]">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="ALL">All Roles</option>
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
                </div>
                <div className="min-w-[150px]">
                    <select
                        value={projectCountFilter}
                        onChange={(e) => setProjectCountFilter(e.target.value)}
                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="ALL">All Project Counts</option>
                        <option value="0">0 Projects</option>
                        <option value="1-2">1-2 Projects</option>
                        <option value="3-5">3-5 Projects</option>
                        <option value="6+">6+ Projects</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                {filteredUsers.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 dark:text-gray-400">No users found</p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center">
                                        Name
                                        <SortIcon direction={sortConfig.key === 'name' ? sortConfig.direction : null} active={sortConfig.key === 'name'} />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Projects
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('email')}
                                >
                                    <div className="flex items-center">
                                        Email
                                        <SortIcon direction={sortConfig.key === 'email' ? sortConfig.direction : null} active={sortConfig.key === 'email'} />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            {/* Search Row */}
                            <tr className="bg-gray-50 dark:bg-gray-700">
                                <th className="px-6 py-2">
                                    <ColumnFilter
                                        value={searchFilters['name']}
                                        onChange={(val) => handleSearch('name', val)}
                                        placeholder="Search name..."
                                    />
                                </th>
                                <th className="px-6 py-2"></th>
                                <th className="px-6 py-2">
                                    <ColumnFilter
                                        value={searchFilters['email']}
                                        onChange={(val) => handleSearch('email', val)}
                                        placeholder="Search email..."
                                    />
                                </th>
                                <th className="px-6 py-2"></th>
                                <th className="px-6 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedUsers.map((user) => {
                                const projectCounts = getUserProjectCounts(user.id);
                                const totalProjects = projectCounts.reviewer + projectCounts.secondaryReviewer + projectCounts.lead;

                                return (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {totalProjects > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    {projectCounts.reviewer > 0 && (
                                                        <span className="text-xs">Reviewer - ({projectCounts.reviewer})</span>
                                                    )}
                                                    {projectCounts.secondaryReviewer > 0 && (
                                                        <span className="text-xs">Secondary - ({projectCounts.secondaryReviewer})</span>
                                                    )}
                                                    {projectCounts.lead > 0 && (
                                                        <span className="text-xs">Lead - ({projectCounts.lead})</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex flex-wrap gap-1">
                                                {(() => {
                                                    try {
                                                        const rolesRaw = user.roles;
                                                        const rolesArray = (typeof rolesRaw === 'string' ? JSON.parse(rolesRaw || "[]") : (rolesRaw || [])) as string[];

                                                        return rolesArray.map((role: string) => {
                                                            const label = getRoleLabel(role as Role);
                                                            const badgeClasses = getRoleBadgeColor(role as Role);

                                                            return (
                                                                <span
                                                                    key={role}
                                                                    className={`px-2 py-0.5 mr-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClasses}`}
                                                                >
                                                                    {label}
                                                                </span>
                                                            );
                                                        });
                                                    } catch (e) {
                                                        return null;
                                                    }
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/users/${user.id}/edit`}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 inline-flex items-center justify-center transition-colors"
                                                    title="Edit user"
                                                >
                                                    <Pencil className="h-5 w-5" />
                                                </Link>
                                                <DeleteUserButton
                                                    userId={user.id}
                                                    userName={user.name}
                                                    isProtected={(() => { 
                                                        const r = user.roles; 
                                                        const arr = typeof r === 'string' ? JSON.parse(r || '[]') : (r || []); 
                                                        return Array.isArray(arr) && arr.includes('ADMIN'); 
                                                    })()}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                <Pagination
                    totalItems={filteredUsers.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
}
