const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const question = await prisma.question.findFirst();

    const duel = await prisma.duel.create({
      data: {
        pin,
        questionId: question.id,
        status: "WAITING",
        hostId: user.id,
        gameMode: "CODEKNIGHTS",
        expiresAt: new Date(Date.now() + 10 * 60000 + 5 * 60000),
        numProblems: 1,
        totalTime: 10,
        difficulty: "Easy",
        unrated: false,
        questionIds: [question.id],
      }
    });
    console.log("Success!", duel);
  } catch (err) {
    console.error("PRISMA ERROR:", err);
  }
}
main();

