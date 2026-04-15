"use server";

import { getCurrentUser as getCurrentUserBase, logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
    return await getCurrentUserBase();
}

export async function logoutAction() {
    await logout();
    redirect("/");
}
