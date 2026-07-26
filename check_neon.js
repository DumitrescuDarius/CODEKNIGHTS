const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function check() {
  const db = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_RCXa42AGzeLr@ep-twilight-truth-ay73y5o2.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  });
  const problems = await db.question.findMany();
  console.log(`Found ${problems.length} problems in Neon DB.`);
  if (problems.length > 0) {
    console.log("Sample problems:");
    problems.slice(0, 5).forEach(p => console.log(`- ${p.title} (ID: ${p.problemId})`));
  }
  await db.$disconnect();
}
check();
