const fs = require('fs');
let content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/BattleWindow.tsx', 'utf8');

content = content.replace(/\$\{themeColor\}33/g, 'color-mix(in srgb, ${themeColor} 20%, transparent)');
content = content.replace(/\$\{themeColor\}22/g, 'color-mix(in srgb, ${themeColor} 15%, transparent)');
content = content.replace(/\$\{themeColor\}66/g, 'color-mix(in srgb, ${themeColor} 40%, transparent)');
content = content.replace(/\$\{themeColor\}10/g, 'color-mix(in srgb, ${themeColor} 5%, transparent)');

fs.writeFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/BattleWindow.tsx', content);
console.log("Fixed!");
