const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
  const db = new PrismaClient(); // connects to Neon using .env
  try {
    const deleted = await db.question.deleteMany();
    console.log(`Deleted ${deleted.count} questions from Neon DB.`);
  } catch (err) {
    console.error(err);
  } finally {
    await db.$disconnect();
  }
}
main();
