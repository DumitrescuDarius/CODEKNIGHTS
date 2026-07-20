const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const ck = await prisma.question.count({
    where: { brokenCode: null, referenceCode: null }
  });
  console.log("CK fallback questions:", ck);

  const bh = await prisma.question.count({
    where: { brokenCode: { not: null } }
  });
  console.log("BH fallback questions:", bh);

  const hb = await prisma.question.count({
    where: { referenceCode: { not: null } }
  });
  console.log("HB fallback questions:", hb);
}
main();

