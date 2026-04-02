import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Adding mock data for screenshots...');

    const password = await hash('password123', 12);

    // 1. Ensure Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin User',
            roles: JSON.stringify(['ADMIN']),
            password,
        },
    });

    // 2. Create a Reviewer
    const reviewer = await prisma.user.upsert({
        where: { email: 'reviewer@example.com' },
        update: {},
        create: {
            email: 'reviewer@example.com',
            name: 'John Reviewer',
            roles: JSON.stringify(['REVIEWER']),
            password,
        },
    });

    // 3. Create a Lead
    const lead = await prisma.user.upsert({
        where: { email: 'lead@example.com' },
        update: {},
        create: {
            email: 'lead@example.com',
            name: 'Sarah Lead',
            roles: JSON.stringify(['REVIEW_LEAD']),
            password,
        },
    });

    // 4. Create a Project
    const project = await prisma.project.create({
        data: {
            name: 'Mobile App Phoenix',
            description: 'Next-gen mobile banking app',
            type: 'AUTOMATION_MOBILE',
            leadId: lead.id,
            reviewerId: reviewer.id,
            status: 'ACTIVE',
        },
    });

    // 5. Create a Form
    const form = await prisma.form.create({
        data: {
            title: 'Mobile QA Standards V1',
            projectType: 'AUTOMATION_MOBILE',
            questions: JSON.stringify([
                { id: 'q1', type: 'text', label: 'Performance score?' },
                { id: 'q2', type: 'select', label: 'UI consistency', options: ['High', 'Medium', 'Low'] }
            ]),
        },
    });

    // 6. Create a Review
    await prisma.review.create({
        data: {
            projectId: project.id,
            reviewerId: reviewer.id,
            formId: form.id,
            status: 'SUBMITTED',
            healthStatus: 'On Track',
            observations: 'The app is performing exceptionally well on iOS. Flutter integration is smooth.',
            recommendedActions: 'Proceed with Android beta testing.',
            answers: JSON.stringify({ q1: '95/100', q2: 'High' }),
            submittedDate: new Date(),
        },
    });

    console.log('✅ Mock data created!');
}

main().finally(() => prisma.$disconnect());
