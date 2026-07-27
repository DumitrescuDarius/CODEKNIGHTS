const fs = require('fs');

const path = 'src/components/windows/ProblemWindow.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/color:\s*'rgba\(255,255,255,0\.[5-9]\)'/g, "color: 'var(--text-muted)'");
content = content.replace(/color:\s*'rgba\(255,255,255,0\.8\)'/g, "color: 'var(--text)'"); // Just to be sure

fs.writeFileSync(path, content);
console.log('Replaced rgba text in ProblemWindow');
