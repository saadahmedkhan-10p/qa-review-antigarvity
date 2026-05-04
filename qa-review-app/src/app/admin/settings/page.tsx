"use client";

import { useEffect, useState } from "react";
import { getSetting, updateSetting } from "@/app/actions/settings";
import toast from "react-hot-toast";
import { Settings, Key, Save, Lock } from "lucide-react";

export default function AdminSettingsPage() {
    const [apiKey, setApiKey] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getSetting("OPENAI_API_KEY")
            .then(val => {
                if (val) setApiKey(val);
                setLoading(false);
            })
            .catch(() => {
                toast.error("Failed to load settings");
                setLoading(false);
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateSetting("OPENAI_API_KEY", apiKey);
            toast.success("Settings saved successfully!");
        } catch (error) {
            toast.error("Failed to save settings");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
                        <Settings className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">System Settings</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Configure global parameters and API integrations</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Key className="h-5 w-5 text-indigo-500" />
                            AI Integration (OpenAI)
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This key is used for generating AI analysis on challenged projects.</p>
                    </div>

                    <form onSubmit={handleSave} className="p-8 space-y-8">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
                                OpenAI API Key
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    type="password"
                                    placeholder="sk-..."
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-600 transition-all outline-none"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                            </div>
                            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                                Key is encrypted at rest and never shared with client-side code except for this admin panel.
                            </p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform hover:-translate-y-1 active:scale-95"
                            >
                                {saving ? (
                                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                                ) : (
                                    <Save className="h-5 w-5" />
                                )}
                                {saving ? "Saving..." : "Save Settings"}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 p-6 rounded-3xl">
                        <h3 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2 mb-2">
                            <span className="text-xl">💡</span>
                            Usage Tip
                        </h3>
                        <p className="text-sm text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                            Once the key is saved, the "Generate AI Analysis" button will become available on the Review Conduct page for projects marked as challenged.
                        </p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 p-6 rounded-3xl">
                        <h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 mb-2">
                            <span className="text-xl">🔒</span>
                            Security
                        </h3>
                        <p className="text-sm text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                            Only users with the <span className="font-bold">ADMIN</span> role can access this page and view/modify the API configuration.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
