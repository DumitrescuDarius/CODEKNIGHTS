const fs = require('fs'); 
let data = fs.readFileSync('problems.json', 'utf8'); 
let out = ''; 
let inString = false; 
let escape = false; 
for (let i = 0; i < data.length; i++) { 
  const c = data[i]; 
  if (c === '\\' && !escape) { 
    escape = true; 
    out += c; 
    continue; 
  } 
  if (c === '"' && !escape) { 
    inString = !inString; 
  } 
  if (c === '\n' && inString) { 
    out += '\\n'; 
  } else if (c === '\r' && inString) { 
    // skip
  } else { 
    out += c; 
  } 
  escape = false; 
} 
fs.writeFileSync('problems.json.fixed', out);
