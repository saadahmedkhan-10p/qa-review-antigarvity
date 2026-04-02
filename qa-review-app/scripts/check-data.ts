const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
    console.log('Checking database counts...');

    const counts = {
        users: await prisma.user.count(),
        projects: await prisma.project.count(),
        reviews: await prisma.review.count(),
        comments: await prisma.comment.count(),
        activityLogs: await prisma.activityLog.count(),
    };

    console.log('Database Counts:', counts);

    // Check a sample review to see dates and relation
    const sampleReview = await prisma.review.findFirst();
    if (sampleReview) {
        console.log('Sample Review:', sampleReview);

        const project = await prisma.project.findUnique({
            where: { id: sampleReview.projectId }
        });
        console.log('Related Project:', project);
    } else {
        console.log('No reviews found!');
    }
}

checkData()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
