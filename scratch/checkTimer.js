const fs = require('fs');
const content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/MainMenu.tsx', 'utf8');

const regex = /Math\.max\([^,]*,\s*(.*timeLeft.*)\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(content.substring(match.index - 100, match.index + 100));
}
