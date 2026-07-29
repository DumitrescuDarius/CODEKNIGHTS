const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const titles = [
        "The Peasant's Toll", "The Jester's Riddle", "The Guard's Patrol", 
        "The Dragon's Breath", "The Archer's Range", "The Siege Tower's Ladder", 
        "The Squire's Inventory", "The King's Banquet", "The Moat's Depth", 
        "The Wizard's Spellbook", "The Merchant's Coin", "The Queen's Crown"
    ];
    const qs = await prisma.question.findMany({ where: { title: { in: titles } } });
    for (let q of qs) {
        let tests = JSON.parse(q.testCases);
        let hidden = q.hiddenTestCases ? JSON.parse(q.hiddenTestCases) : [];
        if (hidden.length === 0 && tests.length > 5) {
            hidden = tests.splice(5);
            await prisma.question.update({
                where: { id: q.id },
                data: {
                    testCases: JSON.stringify(tests),
                    hiddenTestCases: JSON.stringify(hidden)
                }
            });
            console.log('Updated', q.title);
        }
    }
}
run();
