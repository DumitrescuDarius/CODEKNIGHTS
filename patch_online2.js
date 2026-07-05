const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace('global.onlineUsers.add(userId);', `global.onlineUsers.add(userId);
        io.emit("online_users_update", Array.from(global.onlineUsers));`);

code = code.replace('global.onlineUsers.delete(socket.userId);', `global.onlineUsers.delete(socket.userId);
        io.emit("online_users_update", Array.from(global.onlineUsers));`);

fs.writeFileSync('server.js', code);
