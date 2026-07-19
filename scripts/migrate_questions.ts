import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';

async function migrate() {
  const localPrisma = new PrismaClient(); // uses DATABASE_URL from .env
  
  const neonClient = new Client({
    connectionString: "postgresql://neondb_owner:npg_amNy2uqAfUO4@ep-orange-sea-a4zgq3z7-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  console.log("Connecting to neon db...");
  await neonClient.connect();
  
  console.log("Fetching questions from neon db...");
  const res = await neonClient.query('SELECT * FROM "Question"');
  const oldQuestions = res.rows;
  console.log(`Found ${oldQuestions.length} questions.`);

  console.log("Deleting current local questions...");
  await localPrisma.question.deleteMany();

  console.log("Inserting questions into local db...");
  let count = 0;
  for (const q of oldQuestions) {
    try {
      await localPrisma.question.create({
        data: q
      });
      count++;
    } catch (err) {
      console.error(`Failed to insert ${q.title}:`, err);
    }
  }
  
  console.log(`Successfully migrated ${count} questions.`);
  await localPrisma.$disconnect();
  await neonClient.end();
}

migrate().catch(console.error);
