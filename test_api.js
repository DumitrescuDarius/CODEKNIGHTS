const http = require("http");

const data = JSON.stringify({
  userId: "user_123", // any ID
  difficulties: ["Easy", "Medium", "PYTHON"],
  numProblems: 1,
  totalTime: 10,
  gameMode: "CODEKNIGHTS",
  demoMode: false,
});

const req = http.request({
  hostname: "localhost",
  port: 3000,
  path: "/api/duels",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
}, (res) => {
  let body = "";
  res.on("data", (chunk) => body += chunk);
  res.on("end", () => console.log(res.statusCode, body));
});

req.on("error", console.error);
req.write(data);
req.end();

