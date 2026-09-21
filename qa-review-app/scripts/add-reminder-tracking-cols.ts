import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Adding reminder tracking columns to Review table...');

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Review"
        ADD COLUMN IF NOT EXISTS "schedulingReminderSentAt" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "submissionReminderSentAt" TIMESTAMP
    `);

    console.log('✅ Columns "schedulingReminderSentAt" and "submissionReminderSentAt" added (or already exist).');
}

main()
    .catch(err => {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
