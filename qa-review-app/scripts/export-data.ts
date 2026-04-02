const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
    console.log('Starting data export...');

    const data = {
        users: await prisma.user.findMany(),
        contactPersons: await prisma.contactPerson.findMany(),
        forms: await prisma.form.findMany(),
        projects: await prisma.project.findMany(),
        reviews: await prisma.review.findMany(),
        comments: await prisma.comment.findMany(),
        activityLogs: await prisma.activityLog.findMany(),
    };

    fs.writeFileSync(
        path.join(process.cwd(), 'data_dump.json'),
        JSON.stringify(data, null, 2)
    );

    console.log('Data exported to data_dump.json');
}

exportData()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
