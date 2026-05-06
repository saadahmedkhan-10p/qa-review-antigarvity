"use client";

import { useActionState, useEffect, useState, Suspense } from "react";
import { loginAction } from "@/app/actions/auth";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { getDashboardPath, Role } from "@/types/roles";
import Image from "next/image";
import Link from "next/link";
import logoImg from "@/assets/logo.png";
const heroImg = "/login_hero.jpg";
import { LoadingButton } from "@/components/LoadingComponents";
import { useFormStatus } from "react-dom";
import { User, Key, Check } from "lucide-react";

const SSO_ERROR_MESSAGES: Record<string, string> = {
  not_provisioned: "Your Microsoft account is not provisioned in this app. Please contact an administrator.",
  sso_state_mismatch: "Sign-in session expired or invalid. Please try again.",
  sso_session_expired: "Sign-in session expired. Please try again.",
  sso_token_invalid: "We couldn't verify your Microsoft sign-in. Please try again.",
  sso_idp_error: "Microsoft sign-in was cancelled or failed.",
  sso_missing_params: "Sign-in response was incomplete. Please try again.",
};

const ssoEnabled = process.env.NEXT_PUBLIC_SSO_MICROSOFT_ENABLED === "true";

const initialState = {
  error: "",
  success: false,
  roles: [] as string[],
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <LoadingButton
      type="submit"
      loading={pending}
      className="w-full bg-[#007bff] hover:bg-[#0069d9] text-white py-3 rounded-md font-bold transition-all shadow-lg active:scale-[0.98]"
    >
      Login
    </LoadingButton>
  );
}

function LoginContent() {
  // @ts-ignore
  const [state, formAction] = useActionState(loginAction, initialState);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.success) {
      login("").then(() => {
        const roles = (state.roles || []) as Role[];
        const dashboardPath = getDashboardPath(roles);
        router.push(dashboardPath);
      });
    }
  }, [state, login, router]);

  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (errorCode && SSO_ERROR_MESSAGES[errorCode]) {
      toast.error(SSO_ERROR_MESSAGES[errorCode]);
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-gray-900 overflow-hidden font-sans">
      {/* Left Column: Hero Section */}
      <div suppressHydrationWarning className="relative hidden md:flex md:w-[65%] lg:w-[70%] h-full min-h-screen bg-black items-center justify-center overflow-hidden">
        <Image
          src={heroImg}
          alt="Digital Tree Hero"
          fill
          className="object-cover"
          priority
        />

        {/* Hero Content Overlays */}
        <div className="relative z-10 p-12 w-full max-w-4xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20">
              {/*<span className="text-white font-black text-4xl tracking-tighter">10Pearls</span>*/}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-[#4ade80] text-5xl font-black mb-2 tracking-wide uppercase font-mono">
              {/*CREATIVE <br /> CONVERGENCE*/}
            </h2>
            <p className="text-white/80 text-xl font-medium tracking-[0.2em] uppercase">
              {/*WHERE CODE MEETS CANVAS*/}
            </p>
          </div>

          <div className="mt-24">
            <span className="text-white/40 text-sm font-bold tracking-widest uppercase bg-white/5 border border-white/10 px-4 py-2 rounded-full">
              {/*TOM Jan */}
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex-1 bg-[#f3f4f6] dark:bg-gray-950 flex flex-col items-center justify-center p-8 md:p-12 lg:p-16 relative">
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
            <p className="text-gray-500 dark:text-gray-400 text-center font-medium pr-12 pl-12">
              Driving growth through digital technology
            </p>
          </div>

          {ssoEnabled && (
            <>
              <a
                href="/api/auth/sso/microsoft/start"
                className="w-full flex items-center justify-center gap-4 bg-[#2f2f2f] hover:bg-[#1f1f1f] text-white py-3 px-4 rounded-lg font-bold transition-colors mb-8 shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 23 23">
                  <path fill="#f25022" d="M0 0h11v11H0z" />
                  <path fill="#7fba00" d="M12 0h11v11H12z" />
                  <path fill="#00a4ef" d="M0 12h11v11H0z" />
                  <path fill="#ffb900" d="M12 12h11v11H12z" />
                </svg>
                Sign in with Microsoft
              </a>

              <div className="relative flex items-center mb-8">
                <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase">OR</span>
                <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
              </div>
            </>
          )}

          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-[#007bff] transition-colors" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-12 pr-4 py-4 bg-[#eef2f7] dark:bg-gray-900 border-none rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#007bff] transition-all placeholder:text-gray-500 font-medium"
                  placeholder="Username"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400 group-focus-within:text-[#007bff] transition-colors" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  className="block w-full pl-12 pr-4 py-4 bg-[#eef2f7] dark:bg-gray-900 border-none rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#007bff] transition-all placeholder:text-gray-500 font-medium"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 peer-checked:bg-[#007bff] peer-checked:border-[#007bff] transition-all"></div>
                  <Check className="absolute h-3.3 w-3.3 text-white scale-0 peer-checked:scale-100 transition-transform" />
                </div>
                <span className="text-sm font-bold text-[#007bff] select-none">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="ml-auto text-sm font-bold text-[#007bff] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {state?.error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-bold text-center border border-red-100 dark:border-red-900/30">
                {state.error}
              </div>
            )}

            <SubmitButton />
          </form>

          <div className="mt-8 text-center">
            <span className="text-gray-400 text-[10px] font-bold tracking-wider uppercase">
              Pulse 6.0.2501.1
            </span>
          </div>
        </div>

        {/* Subtle decorative elements for the right panel */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl -z-10 -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-200 dark:bg-gray-800/10 rounded-full blur-3xl -z-10 -ml-24 -mb-24" />
        
        {/* Footer Links */}
        <div className="absolute bottom-4 w-full flex justify-center gap-6 text-xs text-gray-500 font-medium">
          <Link href="/documentation" className="hover:text-blue-600 transition-colors">Documentation</Link>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <Link href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <Link href="#" className="hover:text-blue-600 transition-colors">Support</Link>
        </div>
      </div>
    </div >
  );
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-white dark:bg-gray-900" />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

