const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function exportAll() {
  const db = new PrismaClient({
    datasources: { db: { url: 'postgresql://root:rootpassword@127.0.0.1:5433/codeknights?schema=public' } }
  });

  try {
    const data = {
      users: await db.user.findMany(),
      questions: await db.question.findMany(),
      accounts: await db.account.findMany(),
      sessions: await db.session.findMany(),
      verificationTokens: await db.verificationToken.findMany(),
      friendRequests: await db.friendRequest.findMany(),
      aiPrompts: await db.aiPrompt.findMany(),
      duels: await db.duel.findMany(),
      submissions: await db.submission.findMany(),
    };
    fs.writeFileSync('db_dump.json', JSON.stringify(data, null, 2));
    console.log("Export complete!");
  } catch(e) {
    console.error(e);
  } finally {
    await db.$disconnect();
  }
}
exportAll();
