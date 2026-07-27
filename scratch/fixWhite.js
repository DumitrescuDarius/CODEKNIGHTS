const fs = require('fs');
let content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/ProblemWindow.tsx', 'utf8');

// Replace #fff for the score display
content = content.replace(
  /\? 'var\(--color-green\)' : '#fff'\)/g,
  "? 'var(--color-green)' : 'var(--text)')"
);

// Replace #fff for the linear gradient
content = content.replace(
  /background: 'linear-gradient\(135deg, var\(--accent\) 0%, #fff 100%\)'/g,
  "background: 'linear-gradient(135deg, var(--accent) 0%, var(--text) 100%)'"
);

fs.writeFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/ProblemWindow.tsx', content);
