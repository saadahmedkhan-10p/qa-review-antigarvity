import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'qahead@test.com';
    const name = 'QA Head Test User';
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    const roles = JSON.stringify(['QA_HEAD']);

    console.log(`Creating test QA_HEAD user: ${email}...`);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            roles,
            name,
        },
        create: {
            email,
            name,
            password: hashedPassword,
            roles,
        },
    });

    console.log('User created/updated successfully:', user.email);
    console.log('Password set to:', password);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
