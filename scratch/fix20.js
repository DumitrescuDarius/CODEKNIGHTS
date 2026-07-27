const fs = require('fs');
let content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/BattleWindow.tsx', 'utf8');

const regex = /background: 'rgba\(20, 20, 25, 0\.95\)'/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const start = Math.max(0, match.index - 50);
  const end = Math.min(content.length, match.index + 100);
  console.log(content.substring(start, end));
  console.log("---");
}
content = content.replace(
  /background: 'rgba\(20, 20, 25, 0\.95\)'/g,
  "background: 'var(--panel-bg)'"
);

fs.writeFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/BattleWindow.tsx', content);
console.log("Fixed!");
