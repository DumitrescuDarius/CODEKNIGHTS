const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const availableDuels = await prisma.duel.findMany({
    where: {
      status: 'WAITING',
      pin: { startsWith: 'QM-' },
      expiresAt: { gt: now },
      guestId: null
    },
    include: {
      host: true,
      question: true
    }
  });
  console.log("Current server time:", now.toISOString());
  console.log("Found available duels count:", availableDuels.length);
  console.log("Duels details:", JSON.stringify(availableDuels, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
