const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting dummy review cycle creation...');

    // Find the reviewer user
    const reviewer = await prisma.user.findUnique({
        where: { email: 'reviewer@example.com' }
    });
    
    // Find pm
    const pm = await prisma.user.findUnique({
        where: { email: 'pm@example.com' }
    });

    if (!reviewer) {
        console.error('Reviewer not found. Run seed script first.');
        return;
    }

    // Upsert dummy project
    const project = await prisma.project.upsert({
        where: { name: 'E-commerce Redesign QA' },
        update: {
            reviewerId: reviewer.id,
            pmId: pm ? pm.id : undefined,
            type: 'AUTOMATION_WEB'
        },
        create: {
            name: 'E-commerce Redesign QA',
            description: 'Automated testing for the upcoming storefront overhaul.',
            type: 'AUTOMATION_WEB',
            reviewerId: reviewer.id,
            pmId: pm ? pm.id : undefined,
            status: 'ACTIVE'
        }
    });

    // Upsert dummy form
    const form = await prisma.form.create({
        data: {
            title: 'Standard Web Automation Checklist',
            questions: JSON.stringify([
                { id: '1', type: 'text', label: 'Verify login flow correctness', options: [] },
                { id: '2', type: 'checkbox', label: 'Are test cases covering > 80% coverage?', options: [] }
            ]),
            projectType: 'AUTOMATION_WEB',
            isActive: true
        }
    });

    // Create the PENDING review
    const review = await prisma.review.create({
        data: {
            projectId: project.id,
            reviewerId: reviewer.id,
            formId: form.id,
            status: 'PENDING',
            healthStatus: 'On Track'
        }
    });

    console.log(`✅ Created pending review cycle for project: ${project.name}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
