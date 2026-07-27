const fs = require('fs');
const content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/BattleWindow.tsx', 'utf8');
const matches = content.match(/activePath === ['"][a-z]+['"]/g);
console.log(matches);
