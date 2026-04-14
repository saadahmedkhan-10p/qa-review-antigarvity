"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { getForm, updateForm } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FormEditor, Question, Section } from "@/components/FormEditor";

export default function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState<any[]>([]);
    const [projectType, setProjectType] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadForm();
    }, [id]);

    const loadForm = async () => {
        try {
            const form = await getForm(id);
            if (!form) {
                toast.error("Form not found");
                router.push("/admin/forms");
                return;
            }
            setTitle(form.title);
            setProjectType(form.projectType || null);
            // Filter out the Project Health section from initial questions (if present) 
            // since it gets auto-appended on save
            const parsedQuestions = JSON.parse(form.questions);
            const filteredQuestions = parsedQuestions.filter((s: any) => s.id !== 'project-health');
            setQuestions(filteredQuestions);
        } catch (error) {
            toast.error("Failed to load form");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (updatedTitle: string, updatedQuestions: Section[], updatedProjectType: string | null) => {
        try {
            await updateForm(id, updatedTitle, updatedQuestions, updatedProjectType);
            toast.success("Form updated successfully!");
            router.push("/admin/forms");
        } catch (error) {
            toast.error("Failed to update form");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading form...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Edit Review Form</h1>
                    <Link href="/admin/forms" className="text-indigo-600 dark:text-indigo-400 hover:underline">← Back to Forms</Link>
                </div>

                <FormEditor
                    initialTitle={title}
                    initialQuestions={questions}
                    initialProjectType={projectType}
                    onSubmit={handleUpdate}
                    submitLabel="Update Form"
                    isEditing={true}
                />
            </div>
        </div>
    );
}
