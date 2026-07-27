const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /#50fa7b/g, var: 'var(--color-green)' },
  { regex: /#ff5555/g, var: 'var(--color-red)' },
  { regex: /#f1fa8c/g, var: 'var(--color-yellow)' },
  { regex: /#8be9fd/g, var: 'var(--color-cyan)' },
  { regex: /#ff79c6/g, var: 'var(--color-pink)' },
  { regex: /#ffb86c/g, var: 'var(--color-orange)' },
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (full.endsWith('.tsx')) {
      let content = fs.readFileSync(full, 'utf8');
      let changed = false;
      for (const r of replacements) {
        if (content.match(r.regex)) {
          content = content.replace(r.regex, r.var);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(full, content);
        console.log(`Updated ${full}`);
      }
    }
  }
}

walk('src/components/windows');
walk('src/components');
console.log('Done');
