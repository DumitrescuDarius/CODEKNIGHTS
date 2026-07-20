const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const allQs = await prisma.question.findMany({ select: { title: true, referenceCode: true } });
  console.log('All questions:', allQs.map(q => q.title));
}
check().finally(() => prisma.$disconnect());
