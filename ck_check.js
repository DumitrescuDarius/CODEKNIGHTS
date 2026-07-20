const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const qs = await prisma.question.findMany({
    where: { referenceCode: { not: null } }
  });
  console.log('HackBounty questions:', qs.map(q => q.title));
  
  const allQs = await prisma.question.findMany({ select: { title: true, referenceCode: true } });
  console.log('Any with referenceCode:', allQs.filter(q => q.referenceCode).map(q => q.title));
}
check().finally(() => prisma.$disconnect());
