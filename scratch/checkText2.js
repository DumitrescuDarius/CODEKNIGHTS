const fs = require('fs');
const content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/BattleWindow.tsx', 'utf8');

const regex = /var\(--text-on-color\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const start = Math.max(0, match.index - 80);
  const end = Math.min(content.length, match.index + 80);
  console.log(content.substring(start, end));
  console.log("---");
}
