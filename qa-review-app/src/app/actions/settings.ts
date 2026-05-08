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
        create: { id: key, key, value }
    });

    revalidatePath("/admin/settings");
    return { success: true };
}

export async function updateSettings(settings: Record<string, string>) {
    await requireRole("ADMIN");
    
    const updates = Object.entries(settings).map(([key, value]) => 
        prisma.systemSettings.upsert({
            where: { key },
            update: { value },
            create: { id: key, key, value }
        })
    );

    await prisma.$transaction(updates);

    revalidatePath("/admin/settings");
    return { success: true };
}
