const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst();
    console.log('USER:', JSON.stringify(user, null, 2));
}

main().finally(() => prisma.$disconnect());
