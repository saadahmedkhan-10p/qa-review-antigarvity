"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DeleteProjectButton } from "@/components/DeleteProjectButton";
import { SendInviteButton } from "@/components/SendInviteButton";
import { ProjectStatusButton } from "@/components/ProjectStatusButton";
import { TableSearch } from "@/components/TableSearch";
import { Pencil, Filter, TrendingUp } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { useTableSort } from "@/hooks/useTableSort";
import { useTableSearch } from "@/hooks/useTableSearch";
import { SortIcon } from "@/components/table/SortIcon";
import { ColumnFilter } from "@/components/table/ColumnFilter";

interface Project {
    id: string;
    name: string;
    lead?: { name: string } | null;
    reviewer?: { name: string } | null;
    secondaryReviewer?: { name: string } | null;
    contactPerson?: { name: string } | null;
    status?: string;
}

export function ProjectsTable({ projects, onInvite, onClose, onReopen, initialTypeFilter = 'ALL' }: {
    projects: Project[];
    onInvite: (projectId: string) => Promise<any>;
    onClose: (projectId: string) => Promise<void>;
    onReopen: (projectId: string) => Promise<void>;
    initialTypeFilter?: 'ALL' | 'MANUAL' | 'AUTOMATION_WEB' | 'AUTOMATION_MOBILE' | 'API' | 'DESKTOP';
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            const projectStatus = project.status || 'ACTIVE';
            const matchesStatus = statusFilter === 'ALL' || projectStatus === statusFilter;

            const projectType = (project as any).type || 'MANUAL';
            const matchesType = initialTypeFilter === 'ALL' || projectType === initialTypeFilter;

            return matchesStatus && matchesType;
        });
    }, [projects, statusFilter, initialTypeFilter]);

    // Apply column filters
    const { filteredData: columnFilteredProjects, searchFilters, handleSearch } = useTableSearch(filteredProjects);

    // Apply sorting
    const { sortedData, sortConfig, handleSort } = useTableSort(columnFilteredProjects);

    const paginatedProjects = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(start, start + itemsPerPage);
    }, [sortedData, currentPage]);

    // Reset to page 1 when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, initialTypeFilter]);

    return (
        <div className="md:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Projects ({filteredProjects.length})</h2>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="ACTIVE">Active Only</option>
                            <option value="CLOSED">Closed Only</option>
                            <option value="ALL">All Statuses</option>
                        </select>
                    </div>
                </div>

                {/* Removed global search in favor of column search */}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center">
                                        Name <SortIcon direction={sortConfig.key === 'name' ? sortConfig.direction : null} active={sortConfig.key === 'name'} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center">
                                        Status <SortIcon direction={sortConfig.key === 'status' ? sortConfig.direction : null} active={sortConfig.key === 'status'} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('lead.name')}
                                >
                                    <div className="flex items-center">
                                        Lead <SortIcon direction={sortConfig.key === 'lead.name' ? sortConfig.direction : null} active={sortConfig.key === 'lead.name'} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('reviewer.name')}
                                >
                                    <div className="flex items-center">
                                        Reviewer (P) <SortIcon direction={sortConfig.key === 'reviewer.name' ? sortConfig.direction : null} active={sortConfig.key === 'reviewer.name'} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('secondaryReviewer.name')}
                                >
                                    <div className="flex items-center">
                                        Reviewer (S) <SortIcon direction={sortConfig.key === 'secondaryReviewer.name' ? sortConfig.direction : null} active={sortConfig.key === 'secondaryReviewer.name'} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('contactPerson.name')}
                                >
                                    <div className="flex items-center">
                                        QA Contact <SortIcon direction={sortConfig.key === 'contactPerson.name' ? sortConfig.direction : null} active={sortConfig.key === 'contactPerson.name'} />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-700 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">Actions</th>
                            </tr>
                            {/* Search Row */}
                            <tr className="bg-gray-50 dark:bg-gray-700">
                                <th className="px-6 py-2">
                                    <ColumnFilter value={searchFilters['name']} onChange={(val) => handleSearch('name', val)} placeholder="Search..." />
                                </th>
                                <th className="px-6 py-2">
                                    <ColumnFilter value={searchFilters['status']} onChange={(val) => handleSearch('status', val)} placeholder="Status..." />
                                </th>
                                <th className="px-6 py-2">
                                    <ColumnFilter value={searchFilters['lead.name']} onChange={(val) => handleSearch('lead.name', val)} placeholder="Search Lead..." />
                                </th>
                                <th className="px-6 py-2">
                                    <ColumnFilter value={searchFilters['reviewer.name']} onChange={(val) => handleSearch('reviewer.name', val)} placeholder="Search..." />
                                </th>
                                <th className="px-6 py-2">
                                    <ColumnFilter value={searchFilters['secondaryReviewer.name']} onChange={(val) => handleSearch('secondaryReviewer.name', val)} placeholder="Search..." />
                                </th>
                                <th className="px-6 py-2">
                                    <ColumnFilter value={searchFilters['contactPerson.name']} onChange={(val) => handleSearch('contactPerson.name', val)} placeholder="Search..." />
                                </th>
                                <th className="px-6 py-2 sticky right-0 bg-gray-50 dark:bg-gray-700 z-10"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No projects found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                paginatedProjects.map((project) => (
                                    <tr key={project.id} className={project.status === 'CLOSED' ? 'bg-gray-50 dark:bg-gray-900/50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded truncate max-w-[100px] ${(() => {
                                                    switch ((project as any).type) {
                                                        case 'AUTOMATION_WEB': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
                                                        case 'AUTOMATION_MOBILE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                                                        case 'API': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
                                                        case 'DESKTOP': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
                                                        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
                                                    }
                                                })()}`}>
                                                    {(project as any).type === 'AUTOMATION_WEB' ? 'WEB AUTO' :
                                                        (project as any).type === 'AUTOMATION_MOBILE' ? 'MOB AUTO' :
                                                            (project as any).type === 'API' ? 'API AUTO' :
                                                                (project as any).type || 'MANUAL'}
                                                </span>
                                                <span>{project.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${project.status === 'CLOSED'
                                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                }`}>
                                                {project.status || 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{project.lead?.name || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{project.reviewer?.name || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{project.secondaryReviewer?.name || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{project.contactPerson?.name || '-'}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm sticky right-0 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)] ${project.status === 'CLOSED' ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}`}>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/projects/${project.id}/edit`}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 inline-flex items-center justify-center transition-colors"
                                                    title="Edit project"
                                                >
                                                    <Pencil className="h-5 w-5" />
                                                </Link>
                                                <Link
                                                    href={`/admin/reports/project/${project.id}`}
                                                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 inline-flex items-center justify-center transition-colors"
                                                    title="View project report"
                                                >
                                                    <TrendingUp className="h-5 w-5" />
                                                </Link>
                                                <ProjectStatusButton
                                                    projectId={project.id}
                                                    projectName={project.name}
                                                    status={project.status || 'ACTIVE'}
                                                    onClose={onClose}
                                                    onReopen={onReopen}
                                                />
                                                <SendInviteButton
                                                    projectId={project.id}
                                                    projectName={project.name}
                                                    onInvite={onInvite}
                                                />
                                                <DeleteProjectButton
                                                    projectId={project.id}
                                                    projectName={project.name}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <Pagination
                        totalItems={filteredProjects.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
}
