import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Checking / adding "meetingLink" column to "Review" table in PostgreSQL...');
    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "meetingLink" TEXT;
        `);
        console.log('✅ Column "meetingLink" added successfully (or already exists).');
    } catch (error) {
        console.error('❌ Failed to add "meetingLink" column:', error);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
