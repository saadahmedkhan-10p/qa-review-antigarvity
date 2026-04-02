const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

const rolesList = [
    "ADMIN",
    "QA_HEAD",
    "QA_MANAGER",
    "QA_ARCHITECT",
    "REVIEW_LEAD",
    "REVIEWER",
    "PM",
    "DEV_ARCHITECT",
    "CONTACT_PERSON",
    "DIRECTOR"
];

async function main() {
    console.log('🌱 Starting dummy user creation for all roles...');

    const password = await hash('password123', 12);

    for (const role of rolesList) {
        const email = `${role.toLowerCase().replace('_', '.')}@example.com`;
        
        await prisma.user.upsert({
            where: { email },
            update: {
                roles: JSON.stringify([role]),
                password
            },
            create: {
                email,
                name: `${role.replace('_', ' ')} Dummy`,
                roles: JSON.stringify([role]),
                password
            }
        });
        
        console.log(`👤 Created/Updated user: ${email} with role: ${role}`);
    }

    console.log('🎉 Dummy user seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
