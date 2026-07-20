const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const qs = await prisma.question.findMany({ select: { title: true, inputFormat: true, outputFormat: true } });
  console.log(qs.filter(q => q.inputFormat).slice(0, 5));
}
check().finally(() => prisma.$disconnect());
