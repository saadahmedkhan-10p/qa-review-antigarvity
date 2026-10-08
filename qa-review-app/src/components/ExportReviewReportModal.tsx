"use client";

import { useState, useEffect, useMemo } from "react";
import { Download, FileText, CheckSquare, Square, Search, X, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import {
    getExportableProjects,
    getLastSubmittedReviewsForProjects,
    ExportableProject,
    ProjectCategory
} from "@/app/actions/export-report";
import { generateDetailedReviewsPDF } from "@/lib/pdfReportGenerator";

export function ExportReviewReportModal() {
    const { user } = useAuth();
    const isAdmin = user?.roles ? (user.roles.includes("ADMIN") || user.roles.includes("QA_HEAD")) : false;

    const [isOpen, setIsOpen] = useState(false);
    const [category, setCategory] = useState<ProjectCategory>("MANUAL");
    const [projects, setProjects] = useState<ExportableProject[]>([]);
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Fetch projects whenever category or modal state changes
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        setLoadingProjects(true);
        setSelectedProjectIds([]);
        setSearchTerm("");

        getExportableProjects(category)
            .then((data) => {
                if (isMounted) {
                    setProjects(data);
                    // Pre-select all projects that have a submitted review
                    const availableIds = data.filter((p) => p.hasSubmittedReview).map((p) => p.id);
                    setSelectedProjectIds(availableIds);
                }
            })
            .catch((err) => {
                console.error("Error loading projects for export:", err);
                toast.error("Failed to load projects.");
            })
            .finally(() => {
                if (isMounted) setLoadingProjects(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, category]);

    // Only render for ADMIN or QA_HEAD
    if (!isAdmin) return null;

    const filteredProjects = useMemo(() => {
        return projects.filter((p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
        );
    }, [projects, searchTerm]);

    const availableProjects = useMemo(() => {
        return filteredProjects.filter((p) => p.hasSubmittedReview);
    }, [filteredProjects]);

    const isAllSelected =
        availableProjects.length > 0 &&
        availableProjects.every((p) => selectedProjectIds.includes(p.id));

    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            // Deselect visible available projects
            setSelectedProjectIds((prev) =>
                prev.filter((id) => !availableProjects.some((p) => p.id === id))
            );
        } else {
            // Select all visible available projects
            const visibleAvailableIds = availableProjects.map((p) => p.id);
            setSelectedProjectIds((prev) => Array.from(new Set([...prev, ...visibleAvailableIds])));
        }
    };

    const handleToggleProject = (projectId: string) => {
        setSelectedProjectIds((prev) =>
            prev.includes(projectId)
                ? prev.filter((id) => id !== projectId)
                : [...prev, projectId]
        );
    };

    const handleExport = async () => {
        if (selectedProjectIds.length === 0) {
            toast.error("Please select at least one project with a submitted review.");
            return;
        }

        try {
            setGeneratingPdf(true);
            toast.loading("Fetching latest review details...", { id: "export-pdf-toast" });

            const reviewsData = await getLastSubmittedReviewsForProjects(selectedProjectIds);

            if (!reviewsData || reviewsData.length === 0) {
                toast.error("No submitted reviews found for the selected projects.", { id: "export-pdf-toast" });
                return;
            }

            toast.loading(`Generating PDF report for ${reviewsData.length} project(s)...`, { id: "export-pdf-toast" });

            generateDetailedReviewsPDF(reviewsData as any, category);

            toast.success(`Successfully exported PDF for ${reviewsData.length} project(s)!`, {
                id: "export-pdf-toast"
            });
            setIsOpen(false);
        } catch (error: any) {
            console.error("PDF generation error:", error);
            toast.error(error.message || "Failed to generate PDF.", { id: "export-pdf-toast" });
        } finally {
            setGeneratingPdf(false);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg transition-all shadow-md hover:shadow-indigo-500/25 text-sm font-bold whitespace-nowrap active:scale-95"
            >
                <Download className="h-4 w-4" />
                <span>Export Detailed Report (PDF)</span>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-r from-gray-50 to-indigo-50/30 dark:from-gray-800 dark:to-indigo-950/20 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                                        Export Last Submitted Reviews
                                    </h2>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 ml-9">
                                    Generates a complete multi-project report with observations, action items, and full questionnaire answers.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Category Selector Tabs */}
                        <div className="px-6 pt-5 pb-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                Step 1: Select Review Category
                            </label>
                            <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setCategory("MANUAL")}
                                    className={`py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                        category === "MANUAL"
                                            ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                    }`}
                                >
                                    <span>Manual QA Reviews</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCategory("AUTOMATION")}
                                    className={`py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                        category === "AUTOMATION"
                                            ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                    }`}
                                >
                                    <span>Automation QA Reviews</span>
                                </button>
                            </div>
                        </div>

                        {/* Project Selection Area */}
                        <div className="px-6 py-2 flex-1 overflow-hidden flex flex-col min-h-[260px]">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Step 2: Choose Projects ({selectedProjectIds.length} Selected)
                                </label>
                                {availableProjects.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleToggleSelectAll}
                                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                    >
                                        {isAllSelected ? (
                                            <>
                                                <Square className="h-3.5 w-3.5" /> Deselect All
                                            </>
                                        ) : (
                                            <>
                                                <CheckSquare className="h-3.5 w-3.5" /> Select All ({availableProjects.length})
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Search Filter */}
                            <div className="relative mb-3">
                                <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search project name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            {/* Projects List */}
                            <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-700/60 bg-gray-50/30 dark:bg-gray-900/20">
                                {loadingProjects ? (
                                    <div className="py-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                        <span className="text-xs">Loading {category.toLowerCase()} projects...</span>
                                    </div>
                                ) : filteredProjects.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-xs">
                                        No projects found matching &quot;{searchTerm}&quot;.
                                    </div>
                                ) : (
                                    filteredProjects.map((p) => {
                                        const isSelected = selectedProjectIds.includes(p.id);
                                        const isDisabled = !p.hasSubmittedReview;

                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => {
                                                    if (!isDisabled) handleToggleProject(p.id);
                                                }}
                                                className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                                                    isDisabled
                                                        ? "opacity-50 cursor-not-allowed bg-gray-100/50 dark:bg-gray-800/20"
                                                        : "cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                                                } ${isSelected ? "bg-indigo-50/70 dark:bg-indigo-900/30" : ""}`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <input
                                                        type="checkbox"
                                                        disabled={isDisabled}
                                                        checked={isSelected}
                                                        onChange={() => handleToggleProject(p.id)}
                                                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300 dark:border-gray-600 dark:bg-gray-900 disabled:opacity-40"
                                                    />
                                                    <div className="truncate">
                                                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                            {p.name}
                                                        </div>
                                                        <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                                                            <span className="font-medium">Lead:</span> {p.leadName || "N/A"}
                                                            <span>•</span>
                                                            <span className="font-medium">Reviewer:</span> {p.reviewerName || "N/A"}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 text-right">
                                                    {p.hasSubmittedReview ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                                            Submitted: {p.lastSubmittedDate ? new Date(p.lastSubmittedDate).toLocaleDateString() : "Yes"}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                            No submitted review
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
                            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0" />
                                <span>Includes Observations, Action Items & Full Questionnaire per project.</span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    disabled={generatingPdf}
                                    className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleExport}
                                    disabled={generatingPdf || selectedProjectIds.length === 0}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-extrabold shadow-md transition-all flex items-center gap-2 active:scale-95"
                                >
                                    {generatingPdf ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Generating PDF...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4" />
                                            <span>Export {selectedProjectIds.length} Review(s)</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
