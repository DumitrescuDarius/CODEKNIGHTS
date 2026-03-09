const { PrismaClient } = require("@prisma/client");
const readline = require("readline");

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

const ask = (query) => new Promise((resolve) => rl.question(`${colors.cyan}${query}${colors.reset} `, resolve));

async function main() {
  console.clear();
  console.log(`${colors.bright}${colors.magenta}=== CODE KNIGHTS PROBLEM CREATOR ===${colors.reset}\n`);

  try {
    const title = await ask("Problem Title:");
    if (!title) throw new Error("Title is required");

    console.log(`\n${colors.yellow}Description (Type 'END' on a new line to finish):${colors.reset}`);
    let description = "";
    
    // Manual line-by-line collection for multi-line description
    const lines = [];
    while (true) {
      const line = await ask(">");
      if (line === "END") break;
      lines.push(line);
    }
    description = lines.join("\n");

    if (!description) throw new Error("Description is required");

    console.log(`\n${colors.cyan}Difficulty:${colors.reset}`);
    console.log("1. Easy\n2. Medium\n3. Hard");
    const diffChoice = await ask("Choice (1-3) [Default: Easy]:");
    const difficulty = diffChoice === "2" ? "Medium" : diffChoice === "3" ? "Hard" : "Easy";

    const testCases = [];
    console.log(`\n${colors.magenta}--- Public Test Cases ---${colors.reset}`);
    while (true) {
      const input = await ask(`Test Case ${testCases.length + 1} Input:`);
      const output = await ask(`Test Case ${testCases.length + 1} Output:`);
      testCases.push({ input, output });
      const more = await ask("Add another public test case? (y/N):");
      if (more.toLowerCase() !== "y") break;
    }

    const hiddenTestCases = [];
    console.log(`\n${colors.magenta}--- Hidden Test Cases ---${colors.reset}`);
    const wantHidden = await ask("Add hidden test cases? (y/N):");
    if (wantHidden.toLowerCase() === "y") {
      while (true) {
        const input = await ask(`Hidden Case ${hiddenTestCases.length + 1} Input:`);
        const output = await ask(`Hidden Case ${hiddenTestCases.length + 1} Output:`);
        hiddenTestCases.push({ input, output });
        const more = await ask("Add another hidden test case? (y/N):");
        if (more.toLowerCase() !== "y") break;
      }
    }

    console.log(`\n${colors.yellow}--- Summary ---${colors.reset}`);
    console.log(`${colors.bright}Title:${colors.reset} ${title}`);
    console.log(`${colors.bright}Difficulty:${colors.reset} ${difficulty}`);
    console.log(`${colors.bright}Public Tests:${colors.reset} ${testCases.length}`);
    console.log(`${colors.bright}Hidden Tests:${colors.reset} ${hiddenTestCases.length}`);

    const confirm = await ask(`\n${colors.green}Save to database? (y/N):${colors.reset}`);
    if (confirm.toLowerCase() === "y") {
      const question = await prisma.question.create({
        data: {
          title,
          description,
          difficulty,
          testCases: JSON.stringify(testCases),
          hiddenTestCases: JSON.stringify(hiddenTestCases),
        },
      });
      console.log(`\n${colors.green}${colors.bright}✔ Problem successfully added! ID: ${question.id}${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}Operation cancelled.${colors.reset}`);
    }
  } catch (err) {
    console.error(`\n${colors.red}${colors.bright}Error: ${err.message}${colors.reset}`);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();
