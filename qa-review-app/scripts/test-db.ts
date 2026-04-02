import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Testing database connection...')
    try {
        const result = await prisma.$queryRaw`SELECT 1 as result`
        console.log('Connection successful:', result)

        const count = await prisma.user.count()
        console.log('User count:', count)
    } catch (error) {
        console.error('Connection failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
