const { PrismaClient } = require('@prisma/client');

async function migrateAll() {
  const oldDb = new PrismaClient({
    datasources: { db: { url: 'postgresql://root:rootpassword@127.0.0.1:5433/codeknights?schema=public' } }
  });
  const newDb = new PrismaClient({
    datasources: { db: { url: 'postgresql://neondb_owner:npg_RCXa42AGzeLr@ep-twilight-truth-ay73y5o2-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true' } }
  });

  try {
    console.log("Cleaning new DB...");
    // Delete in reverse order of relations
    await newDb.submission.deleteMany();
    await newDb.duel.deleteMany();
    await newDb.friendRequest.deleteMany();
    await newDb.aiPrompt.deleteMany();
    await newDb.session.deleteMany();
    await newDb.account.deleteMany();
    await newDb.verificationToken.deleteMany();
    await newDb.user.deleteMany();
    await newDb.question.deleteMany();

    console.log("Fetching from old DB...");
    const users = await oldDb.user.findMany();
    const questions = await oldDb.question.findMany();
    const accounts = await oldDb.account.findMany();
    const sessions = await oldDb.session.findMany();
    const verificationTokens = await oldDb.verificationToken.findMany();
    const friendRequests = await oldDb.friendRequest.findMany();
    const aiPrompts = await oldDb.aiPrompt.findMany();
    const duels = await oldDb.duel.findMany();
    const submissions = await oldDb.submission.findMany();

    console.log("Inserting into new DB...");
    
    // 1. Independent models
    await newDb.user.createMany({ data: users });
    console.log(`Migrated ${users.length} users.`);

    // Questions might have JSON strings which createMany accepts directly
    for (const q of questions) {
      await newDb.question.create({ data: q });
    }
    console.log(`Migrated ${questions.length} questions.`);

    await newDb.verificationToken.createMany({ data: verificationTokens });
    
    // 2. Dependent models
    await newDb.account.createMany({ data: accounts });
    await newDb.session.createMany({ data: sessions });
    await newDb.friendRequest.createMany({ data: friendRequests });
    await newDb.aiPrompt.createMany({ data: aiPrompts });
    
    // 3. Deeply dependent models
    for (const d of duels) {
      await newDb.duel.create({ data: d });
    }
    console.log(`Migrated ${duels.length} duels.`);

    for (const s of submissions) {
      await newDb.submission.create({ data: s });
    }
    console.log(`Migrated ${submissions.length} submissions.`);

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

migrateAll();
