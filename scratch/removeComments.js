const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const qs = await prisma.question.findMany({ where: { brokenCode: { not: null }, difficulty: { in: ['C', 'CPP', 'JAVA'] } } });
    
    for (let q of qs) {
        let broken = JSON.parse(q.brokenCode);
        const lang = q.difficulty.toLowerCase();
        
        if (broken[lang]) {
            let code = broken[lang];
            // Remove single line comments
            code = code.replace(/\/\/.*$/gm, '');
            // Remove multi-line comments
            code = code.replace(/\/\*[\s\S]*?\*\//g, '');
            
            broken[lang] = code;
            await prisma.question.update({
                where: { id: q.id },
                data: { brokenCode: JSON.stringify(broken) }
            });
            console.log('Removed comments for', q.title);
        }
    }
}
run();
