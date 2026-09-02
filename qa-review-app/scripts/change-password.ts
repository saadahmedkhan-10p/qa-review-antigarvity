import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const email = args[0];
    const newPassword = args[1];

    if (!email || !newPassword) {
        console.log('Usage: npx tsx scripts/change-password.ts <email> <newPassword>');
        console.log('Example: npx tsx scripts/change-password.ts admin@example.com "NewStrongPassword123!"');
        
        // List all admin users to help the user identify their admin email
        const adminUsers = await prisma.user.findMany({
            where: {
                roles: {
                    contains: 'ADMIN'
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                roles: true
            }
        });

        console.log('\nFound Admin Users:');
        adminUsers.forEach(u => console.log(` - ${u.name} (${u.email}) [Roles: ${u.roles}]`));
        process.exit(1);
    }

    if (newPassword.length < 8) {
        console.error('Error: Password should be at least 8 characters long.');
        process.exit(1);
    }

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error(`Error: User with email "${email}" not found.`);
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpiry: null
        }
    });

    console.log(`✅ Successfully updated password for user: ${user.email} (${user.name})`);
}

main()
    .catch((e) => {
        console.error('Failed to change password:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
