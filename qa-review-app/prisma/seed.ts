import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting minimal database seed...');

    // 1. Clean up existing data
    await prisma.activityLog.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.review.deleteMany();
    await prisma.project.deleteMany();
    await prisma.form.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Cleaned up existing data across all tables');

    // 2. Create Single Admin User
    const password = await hash('password123', 12);

    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@example.com',
            name: 'Admin User',
            roles: JSON.stringify(['ADMIN']),
            password,
        },
    });

    console.log(`👤 Created primary admin user: ${adminUser.email}`);
    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
