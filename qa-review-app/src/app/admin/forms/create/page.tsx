"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { createForm } from "@/app/actions/admin";
import toast from "react-hot-toast";
import { FormEditor, Section } from "@/components/FormEditor";
import { Suspense, useEffect } from "react";

function CreateFormContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const typeParam = searchParams.get('type');

    useEffect(() => {
        if (!loading && user) {
            const isAdmin = user.roles?.includes("ADMIN");
            const isQAHead = user.roles?.includes("QA_HEAD");
            if (isQAHead && !isAdmin) {
                toast.error("You do not have permission to create forms");
                router.push("/admin/forms");
            }
        }
    }, [user, loading, router]);

    const handleCreate = async (title: string, questions: Section[], updatedProjectType: string | null) => {
        try {
            await createForm(title, questions, updatedProjectType);
            toast.success("Form created successfully!");
            router.push(`/admin/forms${updatedProjectType ? `?type=${updatedProjectType}` : ''}`);
        } catch (error) {
            toast.error("Failed to create form");
        }
    };

    const typeLabel = typeParam === 'MANUAL' ? 'MANUAL' :
        typeParam === 'AUTOMATION_WEB' ? 'WEB AUTO' :
            typeParam === 'AUTOMATION_MOBILE' ? 'MOB AUTO' :
                typeParam === 'API' ? 'API AUTO' :
                    typeParam === 'DESKTOP' ? 'DESKTOP' : '';
    const pageTitle = typeLabel ? `Create ${typeLabel} Review Form` : 'Create Review Form';

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{pageTitle}</h1>
                <Link
                    href={`/admin/forms${typeParam ? `?type=${typeParam}` : ''}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                    ← Back to Forms
                </Link>
            </div>

            <FormEditor
                onSubmit={handleCreate}
                submitLabel="Create Form"
                initialProjectType={typeParam}
            />
        </div>
    );
}

export default function CreateFormPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <Suspense fallback={<div>Loading...</div>}>
                <CreateFormContent />
            </Suspense>
        </div>
    );
}
