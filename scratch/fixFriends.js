const fs = require('fs');
let content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/FriendsWindow.tsx', 'utf8');

content = content.replace(/\$\{themeColor\}22/g, 'color-mix(in srgb, ${themeColor} 15%, transparent)');

fs.writeFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/FriendsWindow.tsx', content);
console.log("Fixed FriendsWindow!");
