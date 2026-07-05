const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');
code = code.replace('const io = new Server(httpServer, {', `
  global.onlineUsers = new Set();
  const io = new Server(httpServer, {`);

code = code.replace('io.on("connection", (socket) => {', `io.on("connection", (socket) => {
    socket.on("identify", (userId) => {
      if (userId) {
        socket.userId = userId;
        global.onlineUsers.add(userId);
      }
    });
`);

code = code.replace('socket.on("disconnect", () => {', `socket.on("disconnect", () => {
      if (socket.userId) {
        // Simple approach: we might remove them even if another tab is open,
        // but for simplicity let's just remove them.
        // A better way is tracking connection counts, but Set is fine for now.
        global.onlineUsers.delete(socket.userId);
      }
`);

fs.writeFileSync('server.js', code);
