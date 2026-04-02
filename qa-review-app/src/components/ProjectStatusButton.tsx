"use client";

import { useState } from "react";
import { ConfirmationModal } from "./ConfirmationModal";
import toast from "react-hot-toast";
import { Archive, RefreshCw } from "lucide-react";

interface ProjectStatusButtonProps {
    projectId: string;
    projectName: string;
    status: string;
    onClose: (id: string) => Promise<void>;
    onReopen: (id: string) => Promise<void>;
}

export function ProjectStatusButton({ projectId, projectName, status, onClose, onReopen }: ProjectStatusButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isClosed = status === 'CLOSED';
    const action = isClosed ? 'Reopen' : 'Close';

    const handleClick = () => {
        setIsModalOpen(true);
    };

    const handleConfirm = async () => {
        setIsModalOpen(false);
        setIsLoading(true);

        try {
            if (isClosed) {
                await onReopen(projectId);
                toast.success(`${projectName} reopened successfully`);
            } else {
                await onClose(projectId);
                toast.success(`${projectName} closed successfully`);
            }
            // Refresh to show updated status
            setTimeout(() => window.location.reload(), 500);
        } catch (e) {
            console.error(`Error ${action.toLowerCase()}ing project:`, e);
            toast.error(`Failed to ${action.toLowerCase()} project`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handleClick}
                className={`${isClosed
                    ? 'text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20'
                    } disabled:opacity-50 transition-colors p-1 rounded inline-flex items-center justify-center`}
                disabled={isLoading}
                title={`${action} project`}
            >
                {isClosed ? <RefreshCw className="h-5 w-5" /> : <Archive className="h-5 w-5" />}
            </button>

            <ConfirmationModal
                isOpen={isModalOpen}
                title={`${action} ${projectName}?`}
                message={isClosed
                    ? "This will make the project active again and allow new reviews."
                    : "This will mark the project as closed. It will be hidden from default views but can be reopened later."}
                onConfirm={handleConfirm}
                onCancel={() => setIsModalOpen(false)}
                confirmText={`${action} Project`}
                confirmButtonClass={isClosed
                    ? "bg-green-600 hover:bg-green-700 dark:hover:bg-green-500 focus:ring-green-500"
                    : "bg-amber-600 hover:bg-amber-700 dark:hover:bg-amber-500 focus:ring-amber-500"}
            />
        </>
    );
}
