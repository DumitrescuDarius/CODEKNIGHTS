const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace('socket.on("disconnect", () => {', `socket.on("invite_duel", (data) => {
      // data: { targetId, hostName, pin }
      if (data.targetId && global.onlineUsers && global.onlineUsers.has(data.targetId)) {
         // emit to all sockets... wait, we don't map userId -> socketId easily.
         // Actually, if we use io.emit it goes to everyone, and client filters by targetId.
         io.emit("duel_invite", data);
      }
    });

    socket.on("disconnect", () => {`);

fs.writeFileSync('server.js', code);
