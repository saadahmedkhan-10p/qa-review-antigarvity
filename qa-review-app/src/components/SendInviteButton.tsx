"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";

export function SendInviteButton({ projectId, projectName, onInvite }: {
    projectId: string;
    projectName: string;
    onInvite: (projectId: string) => Promise<{ success?: boolean; count?: number; error?: string }>;
}) {
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        setIsSending(true);
        try {
            const result = await onInvite(projectId);
            if (result.error) {
                toast.error(result.error);
            } else if (result.success) {
                toast.success(`Review invitation(s) sent for ${projectName}`);
            }
        } catch (e) {
            console.error("Error sending invites:", e);
            toast.error("Failed to send invites");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <button
            onClick={handleSend}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 disabled:opacity-50 transition-colors p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 inline-flex items-center justify-center"
            disabled={isSending}
            title="Send review invitations to reviewer"
        >
            <Mail className="h-5 w-5" />
        </button>
    );
}

