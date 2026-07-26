const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function importAll() {
  const db = new PrismaClient(); // connects to Neon using .env
  
  try {
    const data = JSON.parse(fs.readFileSync('db_dump.json'));

    console.log("Cleaning new DB...");
    await db.submission.deleteMany();
    await db.duel.deleteMany();
    await db.friendRequest.deleteMany();
    await db.aiPrompt.deleteMany();
    await db.session.deleteMany();
    await db.account.deleteMany();
    await db.verificationToken.deleteMany();
    await db.user.deleteMany();
    await db.question.deleteMany();

    const importSequential = async (items, table, modifyFn) => {
      if (!items || items.length === 0) return;
      for (const item of items) {
        if (modifyFn) modifyFn(item);
        console.log(`Inserting into ${table}...`);
        await db[table].create({ data: item });
      }
    };

    console.log("Inserting users...");
    await importSequential(data.users, 'user', u => {
      if (u.createdAt) u.createdAt = new Date(u.createdAt);
      if (u.emailVerified) u.emailVerified = new Date(u.emailVerified);
    });
    console.log(`Migrated ${data.users.length} users.`);

    console.log("Inserting questions...");
    await importSequential(data.questions, 'question', q => {
      if (q.createdAt) q.createdAt = new Date(q.createdAt);
      if (q.updatedAt) q.updatedAt = new Date(q.updatedAt);
    });
    console.log(`Migrated ${data.questions.length} questions.`);

    console.log("Inserting verificationTokens...");
    await importSequential(data.verificationTokens, 'verificationToken', t => {
      if (t.expires) t.expires = new Date(t.expires);
    });

    console.log("Inserting accounts...");
    await importSequential(data.accounts, 'account', null);

    console.log("Inserting sessions...");
    await importSequential(data.sessions, 'session', s => {
      if (s.expires) s.expires = new Date(s.expires);
    });

    console.log("Inserting friendRequests...");
    await importSequential(data.friendRequests, 'friendRequest', f => {
      if (f.createdAt) f.createdAt = new Date(f.createdAt);
    });

    console.log("Inserting aiPrompts...");
    await importSequential(data.aiPrompts, 'aiPrompt', a => {
      if (a.createdAt) a.createdAt = new Date(a.createdAt);
    });

    console.log("Inserting duels...");
    await importSequential(data.duels, 'duel', d => {
      if (d.hostLastActive) d.hostLastActive = new Date(d.hostLastActive);
      if (d.guestLastActive) d.guestLastActive = new Date(d.guestLastActive);
      if (d.phaseEndsAt) d.phaseEndsAt = new Date(d.phaseEndsAt);
    });
    console.log(`Migrated ${data.duels.length} duels.`);

    console.log("Inserting submissions...");
    await importSequential(data.submissions, 'submission', s => {
      if (s.createdAt) s.createdAt = new Date(s.createdAt);
    });
    console.log(`Migrated ${data.submissions.length} submissions.`);

    console.log("Migration complete!");
  } catch(e) {
    console.error(e);
  } finally {
    await db.$disconnect();
  }
}

importAll();
