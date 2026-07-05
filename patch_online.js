const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace('const parsedUrl = parse(req.url, true);', `const parsedUrl = parse(req.url, true);
      
      if (parsedUrl.pathname === '/api/socket_online') {
         res.setHeader('Content-Type', 'application/json');
         res.end(JSON.stringify(Array.from(global.onlineUsers || [])));
         return;
      }`);

fs.writeFileSync('server.js', code);
