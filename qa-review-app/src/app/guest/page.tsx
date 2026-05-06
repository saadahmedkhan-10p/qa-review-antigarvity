"use client";

import { useAuth } from "@/context/AuthContext";
import { LogOut, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function GuestPage() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800 text-center animate-in fade-in zoom-in duration-500">
                <div className="h-20 w-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Welcome, {user?.name || "Guest"}!</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">
                    Your account has been successfully provisioned. However, you currently have <strong>Guest</strong> access. 
                    Please contact an administrator to be assigned a specific role (Reviewer, Lead, or Manager).
                </p>

                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 text-left">
                        <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest block mb-1">Your Details</span>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{user?.email}</p>
                        <p className="text-xs text-gray-400 mt-1">Provider: Microsoft SSO</p>
                    </div>

                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl font-black hover:opacity-90 transition-all active:scale-95 shadow-lg"
                    >
                        <LogOut className="h-5 w-5" />
                        Log Out
                    </button>


                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">QA Review System v1.0</p>
                </div>
            </div>
        </div>
    );
}
