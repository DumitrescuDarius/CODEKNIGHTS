const fs = require('fs');
const content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/BattleWindow.tsx', 'utf8');
const regex = /(?:popup|modal|dialog|card).{0,100}background/gi;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(content.substring(Math.max(0, match.index - 50), Math.min(content.length, match.index + 100)));
}
