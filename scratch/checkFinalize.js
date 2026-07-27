const fs = require('fs');
const content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/ProblemWindow.tsx', 'utf8');

const regex = /handleFinalize/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const start = Math.max(0, match.index - 100);
  const end = Math.min(content.length, match.index + 500);
  console.log(content.substring(start, end));
  console.log("---");
}
