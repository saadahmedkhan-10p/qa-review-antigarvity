"use client";

import { deleteUser } from "@/app/actions/admin";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ConfirmationModal } from "./ConfirmationModal";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

export function DeleteUserButton({ userId, userName, isProtected }: { userId: string, userName: string, isProtected: boolean }) {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isAdmin = user?.roles?.includes("ADMIN");
    const isQAHead = user?.roles?.includes("QA_HEAD");

    // QA Head cannot delete users
    if (isQAHead && !isAdmin) {
        return null;
    }

    const handleDeleteClick = () => {
        if (isProtected) return;
        setIsModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        setIsModalOpen(false);
        setIsDeleting(true);

        try {
            const result = await deleteUser(userId);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success(`${userName} deleted successfully`);
                setTimeout(() => window.location.reload(), 1000); // Delay reload to show toast
            }
        } catch (e) {
            console.error("Error deleting user:", e);
            toast.error("An error occurred while deleting the user");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                onClick={handleDeleteClick}
                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 inline-flex items-center justify-center"
                disabled={isProtected || isDeleting}
                type="button"
                title={isProtected ? "Protected user" : "Delete user"}
            >
                <Trash2 className="h-5 w-5" />
            </button>

            <ConfirmationModal
                isOpen={isModalOpen}
                title={`Delete ${userName}?`}
                message="Are you sure you want to delete this user? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsModalOpen(false)}
            />
        </>
    );
}

