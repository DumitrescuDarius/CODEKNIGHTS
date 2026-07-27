const fs = require('fs');
const content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/windows/ProblemWindow.tsx', 'utf8');

console.log("Match 1:");
console.log(content.substring(30000, 30500));
console.log("Match 2:");
console.log(content.substring(34000, 34500));
