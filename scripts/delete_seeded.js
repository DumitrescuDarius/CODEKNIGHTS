const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Deleting seeded problems...");
  await prisma.question.deleteMany({
    where: {
      problemId: {
        in: [9001, 9002, 9003]
      }
    }
  });
  console.log("Deleted seeded problems!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
