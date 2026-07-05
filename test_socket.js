const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected to socket server");
});

socket.on("duel_invite", (data) => {
  console.log("RECEIVED INVITATION:", data);
});

socket.on("disconnect", () => {
  console.log("Disconnected");
});
