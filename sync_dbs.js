const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
  // 1. Connect to old DB
  const oldDb = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://root:rootpassword@127.0.0.1:5433/codeknights?schema=public"
      }
    }
  });

  // 2. Connect to new DB directly to bypass pgBouncer limits
  const newDb = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_RCXa42AGzeLr@ep-twilight-truth-ay73y5o2.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  });

  try {
    const oldQuestions = await oldDb.question.findMany();
    console.log(`Found ${oldQuestions.length} questions in old DB.`);

    const exportData = oldQuestions.map(q => ({
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      restrictions: q.restrictions,
      inputFormat: q.inputFormat,
      outputFormat: q.outputFormat,
      testCases: q.testCases,
      hiddenTestCases: q.hiddenTestCases,
      timeLimit: q.timeLimit,
      memoryLimit: q.memoryLimit,
      ratingRequired: q.ratingRequired,
      isPremium: q.isPremium
    }));

    // Delete existing questions in new DB
    const deleted = await newDb.question.deleteMany();
    console.log(`Deleted ${deleted.count} questions from new DB (the seed ones).`);

    // Insert old questions into new DB
    await newDb.question.createMany({
      data: exportData
    });
    
    console.log(`Successfully migrated ${exportData.length} questions to the new DB!`);
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

main();
