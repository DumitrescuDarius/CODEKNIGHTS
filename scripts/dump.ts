import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const q = await prisma.question.findMany();
  fs.writeFileSync('neon_dump.json', JSON.stringify(q));
  console.log(`Dumped ${q.length} questions`);
}

main().then(() => process.exit(0)).catch(console.error);
