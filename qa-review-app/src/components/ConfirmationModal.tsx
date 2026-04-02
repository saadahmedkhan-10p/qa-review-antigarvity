"use client";

import { useEffect, useRef } from "react";

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    confirmButtonClass?: string;
    children?: React.ReactNode;
}

export function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", confirmButtonClass = "bg-red-600 hover:bg-red-700 focus:ring-red-500", children }: ConfirmationModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div
                ref={modalRef}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6 transform transition-all scale-100"
                role="dialog"
                aria-modal="true"
            >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 break-words whitespace-normal">{message}</p>
                {children}
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
