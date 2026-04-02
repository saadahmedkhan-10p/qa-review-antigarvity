"use server";

import { prisma } from "@/lib/prisma";

export async function getLeadProjects(leadId: string) {
    return await prisma.project.findMany({
        where: { leadId: leadId },
        include: {
            reviews: {
                include: {
                    form: true,
                    reviewer: true,
                    secondaryReviewer: true
                }
            }
        }
    });
}
