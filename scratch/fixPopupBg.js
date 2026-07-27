const fs = require('fs');
let content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/BattleWindow.tsx', 'utf8');

// Fix 1: The hoveredOption tooltip popup background
content = content.replace(
  /background: 'var\(--panel-bg\)',\s*border: `1px solid \$\{hoveredOption\?\.color\}`/,
  "background: 'var(--header-bg)',\n                      backdropFilter: 'blur(10px)',\n                      border: `1px solid ${hoveredOption?.color}`"
);

// Fix 2: The full screen overlay for radial bubbles
// They said "there is no color to the blurry background" for "picking gamemode".
// So let's change `rgba(0, 0, 0, 0.25)` to a tinted color or `var(--panel-bg-hover)` which adapts to theme.
content = content.replace(
  /background: 'rgba\(0, 0, 0, 0\.25\)',\s*backdropFilter: 'blur\(3px\)'/,
  "background: 'var(--panel-bg-hover)',\n                backdropFilter: 'blur(5px)'"
);

fs.writeFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/BattleWindow.tsx', content);
console.log("Fixed popup styles!");
