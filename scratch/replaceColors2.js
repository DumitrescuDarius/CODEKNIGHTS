const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /#bd93f9/g, var: 'var(--color-purple)' },
  { regex: /#38bdf8/g, var: 'var(--color-blue)' },
  { regex: /#ffd700/g, var: 'var(--color-gold)' },
  { regex: /#ffaa00/g, var: 'var(--color-orange)' },
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
console.log('Done replacing more colors');
