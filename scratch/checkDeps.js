const fs = require('fs');
const content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/MainMenu.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\s*let interval: NodeJS\.Timeout/g;
let match;
if ((match = regex.exec(content)) !== null) {
  const start = match.index;
  const end = content.indexOf('},', start) + 100;
  console.log(content.substring(start, end));
}
