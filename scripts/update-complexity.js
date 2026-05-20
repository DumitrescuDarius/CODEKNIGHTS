const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateComplexities() {
  try {
    await prisma.question.updateMany({
      data: {
        idealComplexity: "O(1)"
      }
    });
    console.log("Updated all questions to idealComplexity O(1)");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

updateComplexities();
