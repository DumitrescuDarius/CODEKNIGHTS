const fs = require('fs');

const path = 'src/app/api/duels/submit/route.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Change ZERO_SCORE from 0 to 999999
content = content.replace(/const ZERO_SCORE = 0;/g, "const ZERO_SCORE = 999999;");

// 2. Change hostWon logic
content = content.replace(/hostWon = !isClose && hostScore > guestScore;/g, "hostWon = !isClose && hostScore < guestScore;");

// 3. Ensure solveTime is saved when finalize is true
content = content.replace(/if \(solveTime !== undefined && solveTime !== null\) updateData\.hostSolveTime = solveTime;/g, 
  "if (solveTime !== undefined && solveTime !== null) updateData.hostSolveTime = solveTime;\n        else if (duel.hostSolveTime === null) updateData.hostSolveTime = elapsed;");

content = content.replace(/if \(solveTime !== undefined && solveTime !== null\) updateData\.guestSolveTime = solveTime;/g, 
  "if (solveTime !== undefined && solveTime !== null) updateData.guestSolveTime = solveTime;\n        else if (duel.guestSolveTime === null) updateData.guestSolveTime = elapsed;");

// 4. In the `else` block for progressive updates, if it's a penalty, we should update if it's LESS, not greater.
// Wait, but totalPenalty might be progressively worsening? progressive updates don't send totalPenalty usually. 
// But let's fix it anyway to <
content = content.replace(/if \(totalPenalty > currentPenalty\) {/g, "if (totalPenalty < currentPenalty) {");

fs.writeFileSync(path, content);
console.log('Fixed submit route logic.');
