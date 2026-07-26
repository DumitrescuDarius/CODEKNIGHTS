const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://root:rootpassword@127.0.0.1:5433/codeknights?schema=public"
      }
    }
  });

  try {
    const questions = await prisma.question.findMany();
    console.log(`Found ${questions.length} questions in old DB.`);
    
    const exportData = questions.map(q => {
      // Create a copy of the question and remove generated fields
      const { id, createdAt, updatedAt, ...rest } = q;
      
      // Parse JSON strings back to objects so they can be properly processed by seed-problems.ts or createMany
      if (typeof rest.testCases === 'string') {
        try { rest.testCases = JSON.parse(rest.testCases); } catch(e) {}
      }
      if (typeof rest.hiddenTestCases === 'string' && rest.hiddenTestCases) {
        try { rest.hiddenTestCases = JSON.parse(rest.hiddenTestCases); } catch(e) {}
      }
      
      return rest;
    });

    fs.writeFileSync('old_problems.json', JSON.stringify(exportData, null, 2));
    console.log('Successfully dumped to old_problems.json');
  } catch (err) {
    console.error("Error dumping from old db:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
