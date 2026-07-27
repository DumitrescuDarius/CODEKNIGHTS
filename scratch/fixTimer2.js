const fs = require('fs');
let content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/MainMenu.tsx', 'utf8');

const regex = /const opponentFinalized = isHostLocal \? \(activeDuel as any\)\.guestFinalized : \(activeDuel as any\)\.hostFinalized;[\s\S]*?if \(!hasNotifiedTwoMins[\s\S]*?\}\s*\}/;

const match = content.match(regex);
if (match) {
  console.log("Found match!");
  const newLogic = `const hostFinalized = (activeDuel as any).hostFinalized;
      const guestFinalized = (activeDuel as any).guestFinalized;
      const opponentFinalized = isHostLocal ? guestFinalized : hostFinalized;
      const anyFinalized = hostFinalized || guestFinalized;
      
      let finalizedSolveTimeMs = null;
      if (hostFinalized && guestFinalized) {
          finalizedSolveTimeMs = Math.min(activeDuel.hostSolveTime || Infinity, activeDuel.guestSolveTime || Infinity);
      } else if (hostFinalized) {
          finalizedSolveTimeMs = activeDuel.hostSolveTime;
      } else if (guestFinalized) {
          finalizedSolveTimeMs = activeDuel.guestSolveTime;
      }
      
      let deadline: number;
      if (activeDuel.phase === "BREAKING" && activeDuel.phaseEndsAt) {
          deadline = new Date(activeDuel.phaseEndsAt).getTime() - clockOffset;
      } else {
          if (anyFinalized) {
              const solveTimeMs = finalizedSolveTimeMs || (Date.now() - new Date(activeDuel.startedAt || activeDuel.createdAt || Date.now()).getTime());
              const finalizedSecs = Math.floor(solveTimeMs / 1000);
              limit = Math.min(limit, finalizedSecs + 120);
              if (opponentFinalized && !hasNotifiedTwoMins && (Date.now() - new Date(activeDuel.startedAt || activeDuel.createdAt || Date.now()).getTime()) < limit * 1000) {
                  setShowOpponentFinishedWarning(true);
                  setHasNotifiedTwoMins(true);
              }
          }`;

  content = content.replace(regex, newLogic);
  fs.writeFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/MainMenu.tsx', content);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find regex!");
}
