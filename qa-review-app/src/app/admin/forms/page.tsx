"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { getForms, deleteForm } from "@/app/actions/admin";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import toast from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { format } from "date-fns";

export const dynamic = "force-dynamic";


function FormsListContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const typeFilter = searchParams.get('type');

    const isAdmin = user?.roles?.includes("ADMIN");
    const isQAHead = user?.roles?.includes("QA_HEAD");
    const canCreateOrDelete = isAdmin && !isQAHead; // Explicitly: Admin can, but not if they are ONLY QA_HEAD (though Admin usually overrides). Actually if someone has both, we might want to allow. But let's stick to simple: only full ADMIN can create/delete.

    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; formId: string; formTitle: string }>({
        isOpen: false,
        formId: "",
        formTitle: ""
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadForms();
        setCurrentPage(1); // Reset to page 1 when typeFilter changes
    }, [typeFilter]);

    const loadForms = async () => {
        try {
            const data = await getForms();
            // Filter forms by projectType if type param is provided
            const filteredData = typeFilter && ['MANUAL', 'AUTOMATION_WEB', 'AUTOMATION_MOBILE', 'API', 'DESKTOP'].includes(typeFilter)
                ? data.filter((form: any) => form.projectType === typeFilter || !form.projectType)
                : data;
            setForms(filteredData);
        } catch (error) {
            toast.error("Failed to load forms");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            const formData = new FormData();
            formData.append("id", deleteModal.formId);
            await deleteForm(formData);
            toast.success("Form deleted successfully!");
            setDeleteModal({ isOpen: false, formId: "", formTitle: "" });
            loadForms();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete form");
        }
    };

    // Dynamic page title based on type filter
    const pageTitle = typeFilter === 'MANUAL' ? 'Manual Review Forms' :
        typeFilter === 'AUTOMATION_WEB' ? 'Web Auto Review Forms' :
            typeFilter === 'AUTOMATION_MOBILE' ? 'Mobile Auto Review Forms' :
                typeFilter === 'API' ? 'API Review Forms' :
                    typeFilter === 'DESKTOP' ? 'Desktop Review Forms' :
                        'Review Forms';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading forms...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{pageTitle}</h1>
                    <div className="flex items-center gap-4">
                        {canCreateOrDelete && (
                            <Link
                                href={`/admin/forms/create${typeFilter ? `?type=${typeFilter}` : ''}`}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 font-medium shadow-lg transition-transform transform hover:scale-105"
                            >
                                + Create New Form
                            </Link>
                        )}
                        <Link
                            href="/admin/reports"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    {forms.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">No forms created yet</p>
                            <Link
                                href={`/admin/forms/create${typeFilter ? `?type=${typeFilter}` : ''}`}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                            >
                                Create your first form →
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Form Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Questions</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {forms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((form) => {
                                        const questions = JSON.parse(form.questions || "[]");
                                        return (
                                            <tr key={form.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        {form.title}
                                                        {(form as any).isSprint0 && (
                                                            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                                                SPRINT 0
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded ${form.projectType === 'AUTOMATION_WEB'
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                        : form.projectType === 'AUTOMATION_MOBILE'
                                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                                            : form.projectType === 'API'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                : form.projectType === 'DESKTOP'
                                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                                    : form.projectType === 'MANUAL'
                                                                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                                                        }`}>
                                                        {form.projectType === 'AUTOMATION_WEB' ? 'WEB AUTO' :
                                                            form.projectType === 'AUTOMATION_MOBILE' ? 'MOB AUTO' :
                                                                form.projectType === 'API' ? 'API AUTO' :
                                                                    form.projectType || 'ALL'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{questions.length} questions</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {format(new Date(form.createdAt), 'MMM d, yyyy')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/admin/forms/${form.id}/edit`}
                                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 inline-flex items-center justify-center transition-colors"
                                                            title="Edit form"
                                                        >
                                                            <Pencil className="h-5 w-5" />
                                                        </Link>
                                                        {canCreateOrDelete && (
                                                            <button
                                                                onClick={() => setDeleteModal({ isOpen: true, formId: form.id, formTitle: form.title })}
                                                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 inline-flex items-center justify-center transition-colors"
                                                                title="Delete form"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <Pagination
                        totalItems={forms.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                title="Delete Form?"
                message={`Are you sure you want to delete "${deleteModal.formTitle}"? This action cannot be undone. Forms that are in use cannot be deleted.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ isOpen: false, formId: "", formTitle: "" })}
            />
        </div>
    );
}

export default function FormsListPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        }>
            <FormsListContent />
        </Suspense>
    );
}
