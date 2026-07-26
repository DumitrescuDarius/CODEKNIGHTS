const { PrismaClient } = require('@prisma/client');
async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://root:rootpassword@127.0.0.1:5433/codeknights?schema=public'
      }
    }
  });
  const q = await prisma.question.findFirst({where: {title: 'BugHunter: Broken Multiply'}});
  console.log(q);
  await prisma.$disconnect();
}
main();
