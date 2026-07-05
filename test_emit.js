const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Emitter connected");
  socket.emit("invite_duel", { targetId: "test-target", hostName: "Test", pin: "123456" });
  setTimeout(() => process.exit(0), 1000);
});
