import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Restoring Admin User...')
    const password = await bcrypt.hash('admin123', 10)

    const user = await prisma.user.upsert({
        where: { email: 'admin@ryancrm.com' },
        update: {
            password,
            role: 'ADMIN',
            name: 'Super Admin'
        },
        create: {
            email: 'admin@ryancrm.com',
            name: 'Super Admin',
            password,
            role: 'ADMIN'
        }
    })

    console.log(`Admin User Restored: ${user.email} (${user.role})`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
