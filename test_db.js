const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const duels = await prisma.duel.findMany({
    include: {
      host: true,
      guest: true,
      question: true
    }
  });
  console.log("All duels count:", duels.length);
  const waitingDuels = duels.filter(d => d.status === 'WAITING');
  console.log("Waiting duels:", JSON.stringify(waitingDuels, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
