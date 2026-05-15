"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

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
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700"
                role="dialog"
                aria-modal="true"
            >
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">{title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed font-medium">{message}</p>
                {children}
                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-2.5 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all font-black shadow-lg shadow-red-500/20 ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
