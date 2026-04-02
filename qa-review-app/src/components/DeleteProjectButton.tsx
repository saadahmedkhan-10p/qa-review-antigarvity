"use client";

import { deleteProject } from "@/app/actions/admin";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ConfirmationModal } from "./ConfirmationModal";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

export function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isAdmin = user?.roles?.includes("ADMIN");
    const isQAHead = user?.roles?.includes("QA_HEAD");

    // QA Head cannot delete projects
    if (isQAHead && !isAdmin) {
        return null;
    }

    const handleDeleteClick = () => {
        setIsModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        setIsModalOpen(false);
        setIsDeleting(true);

        try {
            await deleteProject(projectId);
            toast.success(`${projectName} deleted successfully`);
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            console.error("Error deleting project:", e);
            toast.error("Failed to delete project");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                onClick={handleDeleteClick}
                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 inline-flex items-center justify-center"
                disabled={isDeleting}
                title="Delete project"
            >
                <Trash2 className="h-5 w-5" />
            </button>

            <ConfirmationModal
                isOpen={isModalOpen}
                title={`Delete ${projectName}?`}
                message="This will also delete all associated reviews. This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsModalOpen(false)}
            />
        </>
    );
}

