const fs = require('fs');

const path = 'src/components/windows/ProblemWindow.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace p color
content = content.replace(/color:\s*'rgba\(255,255,255,0\.85\)'/g, "color: 'var(--text)'");

// Replace pre background
content = content.replace(/background:\s*'rgba\(0,0,0,0\.4\)'/g, "background: 'var(--panel-bg)'");

// Also replace input/output boxes
content = content.replace(/background:\s*'rgba\(0,0,0,0\.3\)'/g, "background: 'var(--panel-bg)'");
content = content.replace(/color:\s*'rgba\(255,255,255,0\.5\)'/g, "color: 'var(--text-muted)'");

// And ol if it exists
content = content.replace(/ol\({children, \.\.\.props}: any\) {[\s\S]*?}/, (match) => {
    return match.replace(/color:\s*'rgba\(255,255,255,0\.85\)'/g, "color: 'var(--text)'");
});

fs.writeFileSync(path, content);
console.log('Replaced more in ProblemWindow');
