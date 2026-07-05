const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected, emitting...");
  socket.emit("invite_duel", {
    targetId: "02dd61e6-2342-4b2a-a9f8-b3ab113f8983", // I need an actual user ID
    hostName: "Test",
    pin: "999999"
  });
  setTimeout(() => process.exit(0), 1000);
});
