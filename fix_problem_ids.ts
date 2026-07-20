import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const problemsWithoutId = await prisma.question.findMany({
    where: { problemId: null }
  });

  if (problemsWithoutId.length === 0) {
    console.log("No problems missing problemId.");
    return;
  }

  const maxIdResult = await prisma.question.aggregate({
    _max: { problemId: true }
  });

  let nextId = (maxIdResult._max.problemId || 0) + 1;

  for (const p of problemsWithoutId) {
    await prisma.question.update({
      where: { id: p.id },
      data: { problemId: nextId }
    });
    console.log(`Updated problem "${p.title}" with problemId ${nextId}`);
    nextId++;
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

