const fs = require('fs');
let content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/BattleWindow.tsx', 'utf8');

content = content.replace(
  /background: 'rgba\(20, 20, 30, 0\.95\)'/g,
  "background: 'var(--panel-bg)'"
);

fs.writeFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/BattleWindow.tsx', content);
