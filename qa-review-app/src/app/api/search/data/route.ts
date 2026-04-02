import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all searchable data
        const [projects, reviews, users, forms] = await Promise.all([
            prisma.project.findMany({
                include: {
                    lead: true,
                    contactPerson: true
                }
            }),
            prisma.review.findMany({
                include: {
                    project: true,
                    form: true,
                    reviewer: true
                }
            }),
            prisma.user.findMany(),
            prisma.form.findMany()
        ]);

        // Transform data into search results
        const searchData = [
            // Projects
            ...projects.map(p => ({
                type: 'project' as const,
                id: p.id,
                title: p.name,
                subtitle: `Lead: ${p.lead?.name || 'Unassigned'} • Contact: ${p.contactPerson?.name || 'Unassigned'}`,
                url: `/admin/projects`
            })),

            // Reviews
            ...reviews.map(r => ({
                type: 'review' as const,
                id: r.id,
                title: `${r.project.name} - ${r.form.title}`,
                subtitle: `Reviewer: ${r.reviewer.name} • Status: ${r.status}`,
                url: r.status === 'SUBMITTED' ? `/reviews/${r.id}/view` : `/reviews/${r.id}/conduct`
            })),

            // Users
            ...users.map(u => ({
                type: 'user' as const,
                id: u.id,
                title: u.name,
                subtitle: u.email,
                url: `/admin/users`
            })),

            // Forms
            ...forms.map(f => ({
                type: 'form' as const,
                id: f.id,
                title: f.title,
                subtitle: f.isActive ? 'Active' : 'Inactive',
                url: `/admin/forms`
            }))
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
