const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Please provide an email address: node set-admin.js email@example.com')
    process.exit(1)
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
    })
    console.log(`User ${user.email} is now an admin. Please restart your dev server or log out and back in to see the changes.`)
  } catch (err) {
    console.error(`Error: User with email ${email} not found.`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
