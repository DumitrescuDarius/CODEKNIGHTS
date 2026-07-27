const fs = require('fs');
const content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/MainMenu.tsx', 'utf8');

const regex = /setTimeLeft/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const start = Math.max(0, match.index - 200);
  const end = Math.min(content.length, match.index + 200);
  console.log(`Found at index ${match.index}:`);
  console.log(content.substring(start, end));
  console.log('---');
}
