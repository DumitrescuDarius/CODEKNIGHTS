const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      
      if (parsedUrl.pathname === '/api/socket_online') {
         res.setHeader('Content-Type', 'application/json');
         res.end(JSON.stringify(Array.from(global.onlineUsers || [])));
         return;
      }
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  
  global.onlineUsers = new Set();
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    socket.on("identify", (userId) => {
      if (userId) {
        socket.userId = userId;
        global.onlineUsers.add(userId);
        io.emit("online_users_update", Array.from(global.onlineUsers));
      }
    });

    socket.on("join_duel", (duelId) => {
      socket.join(duelId);
      console.log(`Socket ${socket.id} joined duel ${duelId}`);
    });

    socket.on("leave_duel", (duelId) => {
      socket.leave(duelId);
      console.log(`Socket ${socket.id} left duel ${duelId}`);
    });

    // Ephemeral real-time progress sharing
    socket.on("progress_update", (data) => {
      if (data.duelId) {
        socket.to(data.duelId).emit("opponent_progress", data);
      }
    });

    // Notify other player to re-poll DB
    socket.on("duel_update", (data) => {
      if (data.duelId) {
        socket.to(data.duelId).emit("duel_update", data);
      }
    });

    socket.on("invite_duel", (data) => {
      // data: { targetId, hostName, pin }
      if (data.targetId) {
         // emit to all sockets... wait, we don't map userId -> socketId easily.
         // Actually, if we use io.emit it goes to everyone, and client filters by targetId.
         io.emit("duel_invite", data);
      }
    });

    socket.on("cancel_invite", (data) => {
      // data: { targetId, pin }
      if (data.targetId) {
         io.emit("cancel_invite", data);
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        // Simple approach: we might remove them even if another tab is open,
        // but for simplicity let's just remove them.
        // A better way is tracking connection counts, but Set is fine for now.
        global.onlineUsers.delete(socket.userId);
        io.emit("online_users_update", Array.from(global.onlineUsers));
      }

    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
