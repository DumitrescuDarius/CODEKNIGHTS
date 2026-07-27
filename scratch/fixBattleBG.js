const fs = require('fs');

const path = 'src/components/windows/BattleWindow.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace dark gray backgrounds with CSS variables
content = content.replace(/background:\s*'rgba\(30,\s*30,\s*40,\s*0\.6\)'/g, "background: 'var(--panel-bg)'");
content = content.replace(/background:\s*'rgba\(30,\s*30,\s*40,\s*0\.95\)'/g, "background: 'var(--panel-bg)'");
content = content.replace(/background:\s*'#24292e'/g, "background: 'var(--panel-bg)'");

// Also check for any other black backgrounds
// There might be a hardcoded black background somewhere
// E.g. 'black' or '#000'
content = content.replace(/background:\s*'#000000'/ig, "background: 'var(--panel-bg)'");
content = content.replace(/background:\s*'#000'/ig, "background: 'var(--panel-bg)'");

fs.writeFileSync(path, content);
console.log('Fixed BattleWindow backgrounds');
