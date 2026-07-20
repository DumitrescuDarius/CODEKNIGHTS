const http = require("http");

// We need a valid userId to not fail foreign key constraints
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }

  const data = JSON.stringify({
    userId: user.id,
    difficulties: ["Easy"],
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
    res.on("end", () => console.log("CK response:", res.statusCode, body));
  });

  req.on("error", console.error);
  req.write(data);
  req.end();
}
main();

