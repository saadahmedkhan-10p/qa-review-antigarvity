"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/withAuth";

// H-04 / Auth matrix: leadId is derived from session to prevent IDOR
export async function getLeadProjects() {
    const caller = await requireRole("REVIEW_LEAD", "ADMIN", "QA_HEAD");
    const leadId = caller.id;
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
