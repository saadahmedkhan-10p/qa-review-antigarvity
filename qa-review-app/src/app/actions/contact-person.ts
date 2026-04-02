"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getContactPersonDashboardData() {
    const session = await getSession();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    // Fetch projects assigned to this contact person
    const projects = await prisma.project.findMany({
        where: {
            contactPersonId: userId
        },
        include: {
            lead: true,
            reviewer: true,
            reviews: {
                include: {
                    form: true,
                    reviewer: true
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            }
        }
    });

    return {
        projects,
        user: session.user
    };
}
