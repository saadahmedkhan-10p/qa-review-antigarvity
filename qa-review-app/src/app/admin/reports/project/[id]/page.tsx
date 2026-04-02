import { prisma } from "@/lib/prisma";
import ProjectReportView from "./ProjectReportView";
import { notFound } from "next/navigation";

export default async function ProjectReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            reviews: {
                include: {
                    reviewer: true,
                    form: true
                },
                orderBy: {
                    submittedDate: 'desc'
                }
            },
            lead: true,
            contactPerson: true
        }
    });

    if (!project) {
        notFound();
    }

    // Serialize dates for client component
    const serializedProject = {
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        reviews: project.reviews.map(r => ({
            ...r,
            scheduledDate: r.scheduledDate?.toISOString() || null,
            submittedDate: r.submittedDate?.toISOString() || null,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString()
        }))
    };

    return <ProjectReportView project={serializedProject} />;
}
