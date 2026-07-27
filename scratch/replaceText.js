const fs = require('fs');

const path = 'src/components/windows/ProblemWindow.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/color:\s*'#fff'/g, "color: 'var(--text)'");
content = content.replace(/color:\s*'#000'/g, "color: 'var(--text-on-color)'");

fs.writeFileSync(path, content);
console.log('Replaced in ProblemWindow');
