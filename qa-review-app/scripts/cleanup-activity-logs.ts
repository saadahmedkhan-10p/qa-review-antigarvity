import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const retentionDays = args[0] ? parseInt(args[0], 10) : 40;

    if (isNaN(retentionDays) || retentionDays < 1) {
        console.error('Error: Please provide a valid positive number of retention days.');
        console.log('Usage: npx tsx scripts/cleanup-activity-logs.ts [days]');
        console.log('Example: npx tsx scripts/cleanup-activity-logs.ts 40');
        process.exit(1);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(`🧹 Cleaning up activity logs older than ${retentionDays} days (before ${cutoffDate.toISOString()})...`);

    const totalLogsBefore = await prisma.activityLog.count();
    console.log(`📊 Total activity logs in DB before cleanup: ${totalLogsBefore}`);

    const result = await prisma.activityLog.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
    });

    const totalLogsAfter = await prisma.activityLog.count();

    console.log(`✅ Successfully deleted ${result.count} activity log(s) older than ${retentionDays} days.`);
    console.log(`📊 Total activity logs remaining in DB: ${totalLogsAfter}`);
}

main()
    .catch((e) => {
        console.error('Failed to cleanup activity logs:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
