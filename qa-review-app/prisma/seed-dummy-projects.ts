import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding 4 dummy projects for testing...');

    const reviewer = await prisma.user.findUnique({
        where: { email: 'reviewer@example.com' }
    });

    if (!reviewer) {
        console.error('❌ Reviewer user not found. Please run regular seed first.');
        return;
    }

    const allUsers = await prisma.user.findMany();
    
    const lead = allUsers.find(u => {
        const roles = typeof u.roles === 'string' ? JSON.parse(u.roles) : u.roles;
        return Array.isArray(roles) && roles.includes('REVIEW_LEAD');
    });

    const contact = allUsers.find(u => {
        const roles = typeof u.roles === 'string' ? JSON.parse(u.roles) : u.roles;
        return Array.isArray(roles) && roles.includes('CONTACT_PERSON');
    });

    const form = await prisma.form.findFirst();

    if (!lead || !contact || !form) {
        console.error('❌ Required data (Lead, Contact, or Form) not found.');
        return;
    }

    const dummyProjects = [
        { name: 'Test Project: Schedule Flow', description: 'Testing the Scheduled status lifecycle.' },
        { name: 'Test Project: Defer Flow', description: 'Testing the Deferred status transition.' },
        { name: 'Test Project: Hold Flow', description: 'Testing the On Hold status logic.' },
        { name: 'Test Project: End Flow', description: 'Testing the Project Ended state.' },
    ];

    for (const pData of dummyProjects) {
        const project = await prisma.project.create({
            data: {
                name: pData.name,
                description: pData.description,
                leadId: lead.id,
                reviewerId: reviewer.id,
                contactPersonId: contact.id
            }
        });

        await prisma.review.create({
            data: {
                projectId: project.id,
                formId: form.id,
                reviewerId: reviewer.id,
                status: 'PENDING',
                answers: '{}'
            }
        });
        console.log(`✅ Created ${pData.name}`);
    }

    console.log('🎉 Dummy seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
