"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { LoadingButton } from "./LoadingComponents";

export type Question = {
    id: string;
    type: "text" | "radio" | "checkbox";
    label: string;
    options?: string[];
};

export type Section = {
    id: string;
    title: string;
    questions: Question[];
};

interface FormEditorProps {
    initialTitle?: string;
    initialQuestions?: any[];
    initialProjectType?: string | null;
    onSubmit: (title: string, questions: Section[], projectType: string | null) => Promise<void>;
    submitLabel: string;
    isEditing?: boolean;
}

// Default Project Health section that gets added to every form
const PROJECT_HEALTH_SECTION: Section = {
    id: 'project-health',
    title: 'Project Health',
    questions: [
        {
            id: 'health-status',
            type: 'radio',
            label: 'Overall Project Health Status',
            options: ['On Track', 'Slightly Challenged', 'Extremely Challenged', 'Critical']
        },
        {
            id: 'health-observations',
            type: 'text',
            label: 'Observations'
        }
    ]
};

export function FormEditor({
    initialTitle = "",
    initialQuestions = [],
    initialProjectType = null,
    onSubmit,
    submitLabel,
    isEditing = false
}: FormEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [projectType, setProjectType] = useState<string | null>(initialProjectType);
    // Initialize sections. If initialQuestions is flat (legacy), wrap in a default section.
    // If it has sections (detected by check), use as is.
    const [sections, setSections] = useState<Section[]>(() => {
        if (initialQuestions.length === 0) return [];

        const isNested = initialQuestions[0].questions || initialQuestions[0].items;
        if (isNested) {
            // Map seed data style (items, text) to our style (questions, label) if needed, or just pass through if matches
            return initialQuestions.map(s => ({
                id: s.id,
                title: s.title,
                questions: s.questions || s.items?.map((i: any) => ({
                    ...i,
                    label: i.label || i.text // Handle 'text' from seed
                })) || []
            }));
        }

        // Wrap flat questions
        return [{
            id: Date.now().toString(),
            title: "General",
            questions: initialQuestions as Question[]
        }];
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialTitle) setTitle(initialTitle);
        // Re-run initialization logic if props change (simplified)
    }, [initialTitle, initialQuestions]);

    const addSection = () => {
        setSections([...sections, { id: Date.now().toString(), title: "New Section", questions: [] }]);
    };

    const removeSection = (sectionId: string) => {
        setSections(sections.filter(s => s.id !== sectionId));
    };

    const updateSectionTitle = (sectionId: string, newTitle: string) => {
        setSections(sections.map(s => s.id === sectionId ? { ...s, title: newTitle } : s));
    };

    const addQuestion = (sectionId: string, type: "text" | "radio" | "checkbox") => {
        const newQuestion: Question = { id: Date.now().toString(), type, label: "", options: [] };
        setSections(sections.map(s =>
            s.id === sectionId ? { ...s, questions: [...s.questions, newQuestion] } : s
        ));
    };

    const updateQuestion = (sectionId: string, qId: string, field: keyof Question, value: any) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => q.id === qId ? { ...q, [field]: value } : q)
            };
        }));
    };

    const removeQuestion = (sectionId: string, qId: string) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return { ...s, questions: s.questions.filter(q => q.id !== qId) };
        }));
    };

    const addOption = (sectionId: string, qId: string) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => q.id === qId ? { ...q, options: [...(q.options || []), ""] } : q)
            };
        }));
    };

    const updateOption = (sectionId: string, qId: string, idx: number, value: string) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => {
                    if (q.id === qId && q.options) {
                        const newOptions = [...q.options];
                        newOptions[idx] = value;
                        return { ...q, options: newOptions };
                    }
                    return q;
                })
            };
        }));
    };

    const removeOption = (sectionId: string, qId: string, idx: number) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => {
                    if (q.id === qId && q.options) {
                        return { ...q, options: q.options.filter((_, i) => i !== idx) };
                    }
                    return q;
                })
            };
        }));
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("Please enter a form title");
            return;
        }
        if (sections.length === 0) {
            toast.error("Please add at least one section");
            return;
        }

        let hasQuestions = false;
        for (const s of sections) {
            if (!s.title.trim()) {
                toast.error("All sections must have a title");
                return;
            }
            if (s.questions.length > 0) hasQuestions = true;

            for (const q of s.questions) {
                if (!q.label.trim()) {
                    toast.error(`Question in section "${s.title}" is missing a label`);
                    return;
                }
                if ((q.type === "radio" || q.type === "checkbox") && (!q.options || q.options.length < 2)) {
                    toast.error(`Question "${q.label}" must have at least 2 options`);
                    return;
                }
            }
        }

        if (!hasQuestions) {
            toast.error("Please add at least one question to the form");
            return;
        }

        // Append the Project Health section at the end
        const finalSections = [...sections, PROJECT_HEALTH_SECTION];

        setIsSubmitting(true);
        try {
            await onSubmit(title, finalSections, projectType);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6 transition-colors duration-200">
            {isEditing && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                                Warning: Modifying questions in a form that has already been used for reviews will change how those reviews are displayed. Proceed with caution.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <div className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Form Title *</div>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Monthly QA Review"
                    />
                </div>
                <div>
                    <div className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Project Type *</div>
                    <select
                        value={projectType || ""}
                        onChange={(e) => setProjectType(e.target.value || null)}
                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">All Project Types</option>
                        <option value="MANUAL">MANUAL</option>
                        <option value="AUTOMATION_WEB">WEB AUTO</option>
                        <option value="AUTOMATION_MOBILE">MOB AUTO</option>
                        <option value="API">API AUTO</option>
                        <option value="DESKTOP">DESKTOP</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Determines which projects this form applies to.</p>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Form Sections</h2>
                    <button
                        onClick={addSection}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                    >
                        + Add Section
                    </button>
                </div>

                <div className="space-y-8">
                    {sections.map((section, sIndex) => (
                        <div key={section.id} className="border border-gray-300 dark:border-gray-600 rounded-lg p-5 bg-gray-50 dark:bg-gray-800">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 mr-4">
                                    <div className="block text-xs uppercase font-bold text-gray-800 dark:text-gray-300 mb-1">Section Title</div>
                                    <input
                                        value={section.title}
                                        onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                        className="block w-full border-b border-gray-300 dark:border-gray-600 bg-transparent py-1 text-lg font-medium text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-0"
                                        placeholder="Section Name"
                                    />
                                </div>
                                <button onClick={() => removeSection(section.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm">
                                    Remove Section
                                </button>
                            </div>

                            <div className="space-y-4 mb-4">
                                {section.questions.map((q, qIndex) => (
                                    <div key={q.id} className="border border-gray-200 dark:border-gray-700 p-4 rounded-md bg-white dark:bg-gray-900/50">
                                        <div className="flex justify-between mb-3">
                                            <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">Question {qIndex + 1} ({q.type})</span>
                                            <button onClick={() => removeQuestion(section.id, q.id)} className="text-red-500 text-xs hover:text-red-700 dark:hover:text-red-400">Remove</button>
                                        </div>
                                        <input
                                            value={q.label}
                                            onChange={(e) => updateQuestion(section.id, q.id, "label", e.target.value)}
                                            className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 mb-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="Enter question text here..."
                                        />

                                        {(q.type === "radio" || q.type === "checkbox") && (
                                            <div className="ml-4 space-y-2">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Options:</p>
                                                {q.options?.map((opt, idx) => (
                                                    <div key={idx} className="flex gap-2">
                                                        <input
                                                            value={opt}
                                                            onChange={(e) => updateOption(section.id, q.id, idx, e.target.value)}
                                                            className="block flex-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-1.5 text-xs text-gray-900 dark:text-white dark:bg-gray-700"
                                                            placeholder={`Option ${idx + 1}`}
                                                        />
                                                        <button
                                                            onClick={() => removeOption(section.id, q.id, idx)}
                                                            className="text-red-500 text-xs px-1"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                                <button onClick={() => addOption(section.id, q.id)} className="text-indigo-600 dark:text-indigo-400 text-xs hover:underline">+ Add Option</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <span className="text-sm text-gray-700 dark:text-gray-300 self-center mr-2 font-medium">Add Question:</span>
                                <button onClick={() => addQuestion(section.id, "text")} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors shadow-sm">Text</button>
                                <button onClick={() => addQuestion(section.id, "radio")} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors shadow-sm">Radio</button>
                                <button onClick={() => addQuestion(section.id, "checkbox")} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors shadow-sm">Checkbox</button>
                            </div>
                        </div>
                    ))}

                    {sections.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                            No sections yet. Click "Add Section" to start building your form.
                        </div>
                    )}
                </div>

                {/* Default Project Health Section (Read Only) */}
                <div className="border border-indigo-200 dark:border-indigo-900/50 rounded-lg p-5 bg-indigo-50 dark:bg-indigo-900/20">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 mr-4">
                            <div className="block text-xs uppercase font-bold !text-gray-900 dark:!text-white mb-1">Default Section (Auto-added)</div>
                            <input
                                disabled
                                value={PROJECT_HEALTH_SECTION.title}
                                className="block w-full border-b border-indigo-200 dark:border-indigo-800 bg-transparent py-1 text-lg font-medium !text-gray-900 dark:!text-white !opacity-100 cursor-not-allowed"
                            />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">Read Only</span>
                    </div>

                    <div className="space-y-4 mb-4">
                        {PROJECT_HEALTH_SECTION.questions.map((q, qIndex) => (
                            <div key={q.id} className="border border-indigo-200 dark:border-indigo-800 p-4 rounded-md bg-white dark:bg-gray-900">
                                <div className="flex justify-between mb-3">
                                    <span className="font-bold !text-gray-900 dark:!text-white text-sm">Question {qIndex + 1} ({q.type})</span>
                                </div>
                                <input
                                    disabled
                                    value={q.label}
                                    className="block w-full border border-indigo-200 dark:border-indigo-800 rounded-md shadow-sm p-3 mb-3 text-sm !text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-800 cursor-not-allowed font-medium !opacity-100"
                                />
                                {(q.type === "radio") && (
                                    <div className="ml-4 space-y-2">
                                        <p className="text-xs !text-gray-900 dark:!text-white mb-1 font-bold">Options:</p>
                                        {q.options?.map((opt, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    disabled
                                                    value={opt}
                                                    className="block flex-1 border border-indigo-200 dark:border-indigo-800 rounded-md shadow-sm p-1.5 text-xs !text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-800 cursor-not-allowed !opacity-100"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex gap-4">
                <LoadingButton
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    className="flex-1 bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 font-bold shadow-lg transition-transform transform hover:scale-105"
                >
                    {submitLabel}
                </LoadingButton>
                <Link href="/admin/forms" className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 p-3 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium text-center">
                    Cancel
                </Link>
            </div>
        </div>
    );
}

