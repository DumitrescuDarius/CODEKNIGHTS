const fs = require('fs');
let content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/MainMenu.tsx', 'utf8');

const oldLogic = `      const isHostLocal = activeDuel.hostId === currentUserId;
      const opponentFinalized = isHostLocal ? (activeDuel as any).guestFinalized : (activeDuel as any).hostFinalized;
      const opponentSolveTimeMs = isHostLocal ? activeDuel.guestSolveTime : activeDuel.hostSolveTime;
      
      let deadline: number;
      if (activeDuel.phase === "BREAKING" && activeDuel.phaseEndsAt) {
          deadline = new Date(activeDuel.phaseEndsAt).getTime() - clockOffset;
      } else {
          if (opponentFinalized) {
              const solveTimeMs = opponentSolveTimeMs || (Date.now() - new Date(activeDuel.startedAt || activeDuel.createdAt || Date.now()).getTime());
              const opponentSecs = Math.floor(solveTimeMs / 1000);
              limit = Math.min(limit, opponentSecs + 120);
              if (!hasNotifiedTwoMins && (Date.now() - new Date(activeDuel.startedAt || activeDuel.createdAt || Date.now()).getTime()) < limit * 1000) {
                  setShowOpponentFinishedWarning(true);
                  setHasNotifiedTwoMins(true);
              }
          }`;

const newLogic = `      const isHostLocal = activeDuel.hostId === currentUserId;
      const hostFinalized = (activeDuel as any).hostFinalized;
      const guestFinalized = (activeDuel as any).guestFinalized;
      const anyFinalized = hostFinalized || guestFinalized;
      const finalizedSolveTimeMs = hostFinalized ? activeDuel.hostSolveTime : activeDuel.guestSolveTime;
      
      let deadline: number;
      if (activeDuel.phase === "BREAKING" && activeDuel.phaseEndsAt) {
          deadline = new Date(activeDuel.phaseEndsAt).getTime() - clockOffset;
      } else {
          if (anyFinalized) {
              const solveTimeMs = finalizedSolveTimeMs || (Date.now() - new Date(activeDuel.startedAt || activeDuel.createdAt || Date.now()).getTime());
              const finalizedSecs = Math.floor(solveTimeMs / 1000);
              limit = Math.min(limit, finalizedSecs + 120);
              
              const opponentFinalized = isHostLocal ? guestFinalized : hostFinalized;
              if (opponentFinalized && !hasNotifiedTwoMins && (Date.now() - new Date(activeDuel.startedAt || activeDuel.createdAt || Date.now()).getTime()) < limit * 1000) {
                  setShowOpponentFinishedWarning(true);
                  setHasNotifiedTwoMins(true);
              }
          }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/MainMenu.tsx', content);
console.log("Replaced timer logic!");
