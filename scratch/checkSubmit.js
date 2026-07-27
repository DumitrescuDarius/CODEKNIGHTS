const fs = require('fs');
const content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/ProblemWindow.tsx', 'utf8');

const regex = /submit/gi;
let match;
while ((match = regex.exec(content)) !== null) {
  const start = Math.max(0, match.index - 50);
  const end = Math.min(content.length, match.index + 100);
  console.log(content.substring(start, end));
  console.log("---");
}
