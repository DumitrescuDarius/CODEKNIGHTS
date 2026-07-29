const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const qs = await prisma.question.findMany({ where: { brokenCode: { not: null } } });
    
    for (let q of qs) {
        let changed = false;
        
        let tests = JSON.parse(q.testCases || "[]");
        let hidden = JSON.parse(q.hiddenTestCases || "[]");
        
        for (let t of tests) {
            if (t.expected !== undefined) {
                t.output = t.expected;
                delete t.expected;
                changed = true;
            }
        }
        
        for (let t of hidden) {
            if (t.expected !== undefined) {
                t.output = t.expected;
                delete t.expected;
                changed = true;
            }
        }
        
        if (changed) {
            await prisma.question.update({
                where: { id: q.id },
                data: {
                    testCases: JSON.stringify(tests),
                    hiddenTestCases: JSON.stringify(hidden)
                }
            });
            console.log('Fixed expected -> output for', q.title);
        }
    }
}
run();
