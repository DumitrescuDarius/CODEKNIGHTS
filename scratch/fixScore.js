const fs = require('fs');
let code = fs.readFileSync('src/app/api/duels/submit/route.ts', 'utf8');

code = code.replace('const ZERO_SCORE = 999999;', 'const ZERO_SCORE = 0;');

const oldLogic = `            const hostScore = updatedDuel.hostPenalty ?? ZERO_SCORE;
            const guestScore = updatedDuel.guestPenalty ?? ZERO_SCORE;
            const isClose = Math.abs(hostScore - guestScore) < 0.0001;
            isDraw = isClose;
            hostWon = !isClose && hostScore < guestScore;`;

const newLogic = `            const hostScore = updatedDuel.hostPenalty ?? ZERO_SCORE;
            const guestScore = updatedDuel.guestPenalty ?? ZERO_SCORE;
            const isClose = Math.abs(hostScore - guestScore) < 0.0001;
            
            if (isClose) {
                if (hostScore === 0) {
                    isDraw = true;
                } else {
                    const hostTime = updatedDuel.hostSolveTime ?? 9999999;
                    const guestTime = updatedDuel.guestSolveTime ?? 9999999;
                    if (hostTime === guestTime) {
                        isDraw = true;
                    } else {
                        isDraw = false;
                        hostWon = hostTime < guestTime;
                    }
                }
            } else {
                isDraw = false;
                // HIGHER IS BETTER: The score passed from the frontend is calculated dynamically based on tests passed.
                hostWon = hostScore > guestScore;
            }`;

if (code.includes(oldLogic)) {
    code = code.replace(oldLogic, newLogic);
    fs.writeFileSync('src/app/api/duels/submit/route.ts', code);
    console.log('done');
} else {
    console.log('Failed to find oldLogic');
}
