const fs = require('fs');
const path = 'src/components/windows/BattleWindow.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replacements
content = content.replace(/color:\s*'#fff'/g, "color: 'var(--text)'");
content = content.replace(/color:\s*'#000'/g, "color: 'var(--text-on-color)'");

content = content.replace(/color:\s*'rgba\(255,255,255,0\.07\)'/g, "color: 'var(--panel-border)'");
content = content.replace(/border:\s*'1px solid rgba\(255,255,255,0\.2\)'/g, "border: '1px solid var(--panel-border)'");

content = content.replace(/background:\s*'rgba\(0,0,0,0\.[23]\)'/g, "background: 'var(--panel-bg)'");

// There's a dynamic one: `color: (activePath === "codeknights" || activePath === "bughunter" || activePath === "hackbounty") ? '#000' : 'var(--text-muted)'`
// Replace it:
content = content.replace(/\? '#000' :/g, "? 'var(--text-on-color)' :");

fs.writeFileSync(path, content);
console.log('Done BattleWindow');
