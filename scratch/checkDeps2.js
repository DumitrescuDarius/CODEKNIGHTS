const fs = require('fs');
const content = fs.readFileSync('C:/Programming/Projects/fix/CODEKNIGHTS/src/components/MainMenu.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\s*let interval: NodeJS\.Timeout \| undefined;\s*if \(activeDuel && activeDuel\.status === "ACTIVE"\)/g;
let match;
if ((match = regex.exec(content)) !== null) {
  const start = match.index;
  const end = content.indexOf('}, [', start) + 50;
  console.log(content.substring(start, end));
}
