import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Expects a JSON file with an array of problems: 
// [ { title, description, difficulty, testCases: [{input, output}], hiddenTestCases: [{input, output}] }, ... ]
async function seed() {
  const dataPath = process.argv[2];
  if (!dataPath) {
    console.error('Please provide a path to the JSON problems file.');
    process.exit(1);
  }

  const absolutePath = path.resolve(dataPath);
  const rawData = fs.readFileSync(absolutePath, 'utf-8');
  const problems = JSON.parse(rawData);

  console.log(`Seeding ${problems.length} problems...`);

  for (const p of problems) {
    try {
      await prisma.question.upsert({
        where: { title: p.title },
        update: {
          description: p.description,
          difficulty: p.difficulty || 'Medium',
          restrictions: p.restrictions || '',
          idealComplexity: p.idealComplexity || '',
          testCases: JSON.stringify(p.testCases || []),
          hiddenTestCases: JSON.stringify(p.hiddenTestCases || []),
          brokenCode: p.brokenCode ? (typeof p.brokenCode === 'object' ? JSON.stringify(p.brokenCode) : p.brokenCode) : null,
        },
        create: {
          title: p.title,
          description: p.description,
          difficulty: p.difficulty || 'Medium',
          restrictions: p.restrictions || '',
          idealComplexity: p.idealComplexity || '',
          testCases: JSON.stringify(p.testCases || []),
          hiddenTestCases: JSON.stringify(p.hiddenTestCases || []),
          brokenCode: p.brokenCode ? (typeof p.brokenCode === 'object' ? JSON.stringify(p.brokenCode) : p.brokenCode) : null,
        },
      });
      console.log(`Upserted: ${p.title}`);
    } catch (e) {
      console.error(`Failed to upsert ${p.title}:`, e);
    }
  }

  await prisma.$disconnect();
  console.log('Seeding complete.');
}

seed();
