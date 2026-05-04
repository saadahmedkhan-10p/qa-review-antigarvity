"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/withAuth";
import { revalidatePath } from "next/cache";

export async function getSetting(key: string) {
    await requireRole("ADMIN");
    const setting = await prisma.systemSettings.findUnique({
        where: { key }
    });
    return setting?.value || null;
}

export async function updateSetting(key: string, value: string) {
    await requireRole("ADMIN");
    
    await prisma.systemSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value }
    });

    revalidatePath("/admin/settings");
    return { success: true };
}
