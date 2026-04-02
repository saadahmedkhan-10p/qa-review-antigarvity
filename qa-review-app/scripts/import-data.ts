const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importData() {
    console.log('Starting data import...');

    const dataPath = path.join(process.cwd(), 'data_dump.json');
    if (!fs.existsSync(dataPath)) {
        throw new Error('data_dump.json not found');
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // 1. Clean existing data (Order matters for foreign keys)
    console.log('Cleaning existing data...');
    await prisma.activityLog.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.review.deleteMany();
    await prisma.project.deleteMany();
    await prisma.form.deleteMany();
    await prisma.contactPerson.deleteMany();
    await prisma.user.deleteMany();

    // 2. Import data (Order matters for foreign keys)
    console.log('Importing users...');
    for (const user of data.users) {
        await prisma.user.create({ data: user });
    }

    console.log('Importing contact persons...');
    for (const contact of data.contactPersons) {
        await prisma.contactPerson.create({ data: contact });
    }

    console.log('Importing forms...');
    for (const form of data.forms) {
        await prisma.form.create({ data: form });
    }

    console.log('Importing projects...');
    for (const project of data.projects) {
        // Ensure dates are converted back to Date objects
        project.createdAt = new Date(project.createdAt);
        project.updatedAt = new Date(project.updatedAt);
        if (project.closedAt) project.closedAt = new Date(project.closedAt);

        await prisma.project.create({ data: project });
    }

    console.log('Importing reviews...');
    for (const review of data.reviews) {
        review.createdAt = new Date(review.createdAt);
        review.updatedAt = new Date(review.updatedAt);
        if (review.scheduledDate) review.scheduledDate = new Date(review.scheduledDate);
        if (review.submittedDate) review.submittedDate = new Date(review.submittedDate);

        await prisma.review.create({ data: review });
    }

    console.log('Importing comments...');
    for (const comment of data.comments) {
        comment.createdAt = new Date(comment.createdAt);
        comment.updatedAt = new Date(comment.updatedAt);

        await prisma.comment.create({ data: comment });
    }

    console.log('Importing activity logs...');
    for (const log of data.activityLogs) {
        log.createdAt = new Date(log.createdAt);

        await prisma.activityLog.create({ data: log });
    }

    console.log('Data import completed successfully!');
}

importData()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
