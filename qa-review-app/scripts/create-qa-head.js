require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'qahead@test.com';
    const name = 'QA Head Test User';
    const roles = JSON.stringify(['QA_HEAD']);

    console.log(`Creating test QA_HEAD user: ${email}...`);

    try {
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: '$2a$10$cw/7jS5.k.z.Q.q.q.q.q.q.q.q.q.q.q.q.q.q.q.q.q.q.q.q',
                roles,
            },
        });
        console.log('User created successfully:', user.email);
    } catch (e) {
        if (e.code === 'P2002') {
            console.log('User already exists, updating roles...');
            await prisma.user.update({
                where: { email },
                data: { roles }
            });
            console.log('User updated successfully.');
        } else {
            console.error('ERROR MESSAGE:', e.message);
            console.error('FULL ERROR:', e);
            throw e;
        }
    }
}

main().catch(err => {
    console.error('CATCH ERROR:', err.message);
    process.exit(1);
}).finally(() => prisma.$disconnect());
