"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload, FileText, Check, AlertCircle, X, Users, Download } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Role, getAllRoles, getRoleLabel } from "@/types/roles";

interface ParsedUser {
    email: string;
    name: string;
    roles: string[];
    status: 'pending' | 'valid' | 'invalid';
    error?: string;
}

export default function BulkInvitePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'csv' | 'manual'>('csv');
    const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
    const [manualInput, setManualInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // CSV Template for download
    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,email,name,roles\njohn@example.com,John Doe,REVIEWER\njane@example.com,Jane Smith,QA_MANAGER|REVIEWER";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "user_invite_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const validateUser = (user: any): ParsedUser => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validRoles = getAllRoles();

        const email = user.email?.trim();
        const name = user.name?.trim() || email?.split('@')[0] || "Unknown";

        let roles: string[] = ["REVIEWER"];
        if (user.roles) {
            // Handle roles separated by | or , or ;
            const rawRoles = user.roles.split(/[|,;]/).map((r: string) => r.trim().toUpperCase());
            const validatedRoles = rawRoles.filter((r: string) => validRoles.includes(r as Role));
            if (validatedRoles.length > 0) {
                roles = validatedRoles;
            }
        }

        if (!email || !emailRegex.test(email)) {
            return { email, name, roles, status: 'invalid', error: 'Invalid email format' };
        }

        return { email, name, roles, status: 'valid' };
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const users = results.data
                    .filter((row: any) => row.email) // Skip empty rows
                    .map(validateUser);
                setParsedUsers(users);
                toast.success(`Parsed ${users.length} users from CSV`);
            },
            error: (error) => {
                toast.error(`Failed to parse CSV: ${error.message}`);
            }
        });
    };

    const handleManualParse = () => {
        const lines = manualInput.split('\n').filter(line => line.trim());
        const users = lines.map(line => {
            // Expected format: email, name, roles
            const parts = line.split(',').map(p => p.trim());
            const email = parts[0];
            const name = parts[1];
            const roles = parts[2];
            return validateUser({ email, name, roles });
        });
        setParsedUsers(users);
        if (users.length > 0) {
            toast.success(`Parsed ${users.length} users from text`);
        }
    };

    const removeUser = (index: number) => {
        const newUsers = [...parsedUsers];
        newUsers.splice(index, 1);
        setParsedUsers(newUsers);
    };

    const handleSubmit = async () => {
        const validUsers = parsedUsers.filter(u => u.status === 'valid');
        if (validUsers.length === 0) {
            toast.error("No valid users to invite");
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch('/api/users/bulk-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: validUsers })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Successfully invited ${data.invitedCount} users`);
                router.push('/admin/users');
            } else {
                toast.error(data.error || "Failed to send invites");
            }
        } catch (error) {
            console.error("Bulk invite error:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                            <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            Bulk User Invite
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Invite multiple users at once via CSV or manual entry
                        </p>
                    </div>
                    <Link
                        href="/admin/users"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-2"
                    >
                        <X className="h-4 w-4" /> Cancel
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-colors duration-200">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('csv')}
                            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${activeTab === 'csv'
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Upload className="h-5 w-5" />
                                CSV Upload
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${activeTab === 'manual'
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <FileText className="h-5 w-5" />
                                Manual Entry
                            </div>
                        </button>
                    </div>

                    <div className="p-8">
                        {activeTab === 'csv' ? (
                            <div className="space-y-6">
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Drag and drop your CSV file here
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                        or click to browse from your computer
                                    </p>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="csv-upload"
                                    />
                                    <label
                                        htmlFor="csv-upload"
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-colors"
                                    >
                                        Select File
                                    </label>
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        onClick={downloadTemplate}
                                        className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download CSV Template
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Enter users (one per line)
                                    </label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        Format: email, name, roles (optional)
                                    </p>
                                    <textarea
                                        value={manualInput}
                                        onChange={(e) => setManualInput(e.target.value)}
                                        className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder={`john@example.com, John Doe, REVIEWER\njane@example.com, Jane Smith, QA_MANAGER`}
                                    />
                                </div>
                                <button
                                    onClick={handleManualParse}
                                    className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
                                >
                                    Parse Entries
                                </button>
                            </div>
                        )}

                        {/* Preview Table */}
                        {parsedUsers.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                                    <span>Preview ({parsedUsers.length} users)</span>
                                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                        {parsedUsers.filter(u => u.status === 'valid').length} valid
                                    </span>
                                </h3>
                                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Roles</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {parsedUsers.map((user, index) => (
                                                <tr key={index} className={user.status === 'invalid' ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {user.status === 'valid' ? (
                                                            <Check className="h-5 w-5 text-green-500" />
                                                        ) : (
                                                            <div className="flex items-center text-red-500" title={user.error}>
                                                                <AlertCircle className="h-5 w-5 mr-1" />
                                                                <span className="text-xs">{user.error}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        {user.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {user.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.roles.map((role, i) => (
                                                                <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                                                                    {getRoleLabel(role as Role)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => removeUser(index)}
                                                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                                                        >
                                                            <X className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 px-8 py-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={isProcessing || parsedUsers.filter(u => u.status === 'valid').length === 0}
                            className={`flex items-center gap-2 px-6 py-3 rounded-md text-white font-medium shadow-sm transition-colors ${isProcessing || parsedUsers.filter(u => u.status === 'valid').length === 0
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Users className="h-5 w-5" />
                                    Invite {parsedUsers.filter(u => u.status === 'valid').length} Users
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
