import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking manual projects with assigned review leads...');

    const manualProjectsWithLead = await prisma.project.findMany({
        where: {
            type: 'MANUAL',
            leadId: {
                not: null
            }
        },
        include: {
            lead: true
        }
    });

    console.log(`📊 Found ${manualProjectsWithLead.length} manual project(s) with assigned Review Leads:`);
    manualProjectsWithLead.forEach(p => {
        console.log(` - ${p.name} (Current Lead: ${p.lead?.name || p.leadId})`);
    });

    if (manualProjectsWithLead.length === 0) {
        console.log('✅ No manual projects have review leads assigned.');
        return;
    }

    const result = await prisma.project.updateMany({
        where: {
            type: 'MANUAL',
            leadId: {
                not: null
            }
        },
        data: {
            leadId: null
        }
    });

    console.log(`\n🎉 Successfully removed review leads from ${result.count} manual project(s)!`);
}

main()
    .catch((e) => {
        console.error('Failed to update manual projects:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
