"use client";

import { useActionState, useEffect } from "react";
import { requestPasswordReset } from "@/app/actions/auth";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import logoImg from "@/assets/logo.png";
import { LoadingButton } from "@/components/LoadingComponents";
import { useFormStatus } from "react-dom";
import { Mail, ArrowLeft } from "lucide-react";

interface ResetState {
    error?: string;
    success?: boolean;
    message?: string;
}

const initialState: ResetState = {
    error: "",
    success: false,
    message: "",
};

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <LoadingButton
            type="submit"
            loading={pending}
            className="w-full bg-[#007bff] hover:bg-[#0069d9] text-white py-3 rounded-md font-bold transition-all shadow-lg active:scale-[0.98]"
        >
            Send Reset Link
        </LoadingButton>
    );
}

export default function ForgotPasswordPage() {
    // @ts-ignore
    const [state, formAction] = useActionState(requestPasswordReset, initialState);

    useEffect(() => {
        if (state?.error) {
            toast.error(state.error);
        }
        if (state?.success && state?.message) {
            toast.success(state.message);
        }
    }, [state]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f4f6] dark:bg-gray-950 p-8 md:p-12 lg:p-16 relative font-sans">
            <div className="w-full max-w-[400px]">
                {/* Header Logo & Text */}
                <div className="flex flex-col items-center mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Image
                            src={logoImg}
                            alt="QA Review Logo"
                            width={120}
                            height={120}
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-2">
                        Forgot Password?
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-center font-medium">
                        Enter your email and we'll send you a link to reset your password.
                    </p>
                </div>

                <form action={formAction} className="space-y-6 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl">
                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#007bff] transition-colors" />
                            </div>
                            <input
                                name="email"
                                type="email"
                                required
                                className="block w-full pl-12 pr-4 py-4 bg-[#eef2f7] dark:bg-gray-800 border-none rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#007bff] transition-all placeholder:text-gray-500 font-medium"
                                placeholder="Email Address"
                            />
                        </div>
                    </div>

                    {state?.message && state?.success && (
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm font-bold text-center border border-green-100 dark:border-green-900/30">
                            {state.message}
                        </div>
                    )}

                    <SubmitButton />

                    <div className="text-center mt-6">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-[#007bff] transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Login
                        </Link>
                    </div>
                </form>

                <div className="mt-8 text-center">
                    <span className="text-gray-400 text-[10px] font-bold tracking-wider uppercase">
                        Pulse 6.0.2501.1
                    </span>
                </div>
            </div>

            {/* Subtle decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl -z-10 -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-200 dark:bg-gray-800/10 rounded-full blur-3xl -z-10 -ml-24 -mb-24" />
        </div>
    );
}
