import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const roles: string[] = Array.isArray(session.user.roles)
            ? session.user.roles
            : [];
        const isAdminOrHead = roles.includes("ADMIN") || roles.includes("QA_HEAD");
        const isReviewer = roles.includes("REVIEWER");
        const isLead = roles.includes("REVIEW_LEAD");

        // C-06: Filter data by the caller's role — never dump the full DB

        // Projects: admins see all; reviewers/leads see only their own
        const projects = await prisma.project.findMany({
            where: isAdminOrHead
                ? {}
                : isReviewer
                ? { OR: [{ reviewerId: userId }, { secondaryReviewerId: userId }] }
                : isLead
                ? { leadId: userId }
                : { id: "no-match" }, // unknown role: no results
            select: {
                id: true,
                name: true,
                lead: { select: { name: true } },
                contactPerson: { select: { name: true } },
            },
        });

        // Reviews: admins see all; reviewers see their own; leads see their projects' reviews
        const reviews = await prisma.review.findMany({
            where: isAdminOrHead
                ? {}
                : isReviewer
                ? { OR: [{ reviewerId: userId }, { secondaryReviewerId: userId }] }
                : isLead
                ? { project: { leadId: userId } }
                : { id: "no-match" },
            select: {
                id: true,
                status: true,
                project: { select: { name: true } },
                form: { select: { title: true } },
                reviewer: { select: { name: true } },
            },
        });

        // Users: only admins / QA heads see the directory
        const users = isAdminOrHead
            ? await prisma.user.findMany({
                  select: { id: true, name: true, email: true },
                  take: 200,
              })
            : [];

        // Forms: only admins / QA heads see all forms
        const forms = isAdminOrHead
            ? await prisma.form.findMany({
                  select: { id: true, title: true, isActive: true },
                  take: 100,
              })
            : [];

        const searchData = [
            ...projects.map((p) => ({
                type: "project" as const,
                id: p.id,
                title: p.name,
                subtitle: `Lead: ${p.lead?.name || "Unassigned"} • Contact: ${p.contactPerson?.name || "Unassigned"}`,
                url: `/admin/projects`,
            })),
            ...reviews.map((r) => ({
                type: "review" as const,
                id: r.id,
                title: `${r.project.name} - ${r.form.title}`,
                subtitle: `Reviewer: ${r.reviewer.name} • Status: ${r.status}`,
                url:
                    r.status === "SUBMITTED"
                        ? `/reviews/${r.id}/view`
                        : `/reviews/${r.id}/conduct`,
            })),
            ...users.map((u) => ({
                type: "user" as const,
                id: u.id,
                title: u.name,
                subtitle: u.email,
                url: `/admin/users`,
            })),
            ...forms.map((f) => ({
                type: "form" as const,
                id: f.id,
                title: f.title,
                subtitle: f.isActive ? "Active" : "Inactive",
                url: `/admin/forms`,
            })),
        ];

        return NextResponse.json(searchData);
    } catch (error) {
        console.error("Error fetching search data:", error);
        return NextResponse.json(
            { error: "Failed to fetch search data" },
            { status: 500 }
        );
    }
}
