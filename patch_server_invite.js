const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace(
  'if (data.targetId && global.onlineUsers && global.onlineUsers.has(data.targetId)) {',
  'if (data.targetId) {'
);

fs.writeFileSync('server.js', code);
