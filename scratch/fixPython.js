const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const qs = await prisma.question.findMany({ where: { brokenCode: { not: null }, difficulty: 'PYTHON' } });
    
    for (let q of qs) {
        let broken = JSON.parse(q.brokenCode);
        if (broken.python) {
            let code = broken.python;
            // Remove comments
            code = code.replace(/#.*$/gm, '');
            
            // Replace sys.stdin.read().split() boilerplate
            if (code.includes('import sys')) {
                code = code.replace(/import sys\n/g, '');
                
                let newBoilerplate = `def get_input():\n    tokens = []\n    try:\n        while True:\n            tokens.extend(input().split())\n    except EOFError:\n        pass\n    return tokens\n\n`;
                
                // If it uses sys.stdin.read().split(), we replace it
                if (code.includes('sys.stdin.read().split()')) {
                    // we need to insert the def get_input() at the top
                    code = newBoilerplate + code;
                    code = code.replace(/sys\.stdin\.read\(\)\.split\(\)/g, 'get_input()');
                }
            }
            
            broken.python = code;
            await prisma.question.update({
                where: { id: q.id },
                data: { brokenCode: JSON.stringify(broken) }
            });
            console.log('Updated python code for', q.title);
        }
    }
}
run();
