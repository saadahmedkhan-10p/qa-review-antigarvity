const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestReviews() {
    try {
        // Get existing projects and users
        const projects = await prisma.project.findMany({
            include: {
                reviewer: true
            }
        });

        if (projects.length === 0) {
            console.log('No projects found. Please run the main seed first.');
            return;
        }

        // Get a form to use
        const form = await prisma.form.findFirst();
        if (!form) {
            console.log('No forms found. Please create a form first.');
            return;
        }

        const statuses = ['PENDING', 'SCHEDULED', 'SUBMITTED', 'DEFERRED', 'ON_HOLD', 'PROJECT_ENDED'];

        console.log('Creating test reviews with different statuses...');

        for (let i = 0; i < statuses.length; i++) {
            const status = statuses[i];
            const project = projects[i % projects.length];

            // Check if review already exists for this project
            const existingReview = await prisma.review.findFirst({
                where: {
                    projectId: project.id,
                    status: status
                }
            });

            if (existingReview) {
                console.log(`Review with status ${status} already exists for project ${project.name}`);
                continue;
            }

            const reviewData = {
                projectId: project.id,
                reviewerId: project.reviewerId,
                formId: form.id,
                status: status,
                scheduledDate: status === 'SCHEDULED' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null, // 7 days from now
                submittedDate: status === 'SUBMITTED' ? new Date() : null,
                answers: status === 'SUBMITTED' ? JSON.stringify({
                    'q1': 'Test answer for ' + status,
                    'q2': 'Another test answer'
                }) : null
            };

            const review = await prisma.review.create({
                data: reviewData
            });

            console.log(`✓ Created ${status} review for project: ${project.name}`);
        }

        console.log('\n✅ Test reviews created successfully!');

        // Show summary
        const reviewCounts = await prisma.review.groupBy({
            by: ['status'],
            _count: true
        });

        console.log('\nReview counts by status:');
        reviewCounts.forEach(({ status, _count }) => {
            console.log(`  ${status}: ${_count}`);
        });

    } catch (error) {
        console.error('Error creating test reviews:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addTestReviews();
