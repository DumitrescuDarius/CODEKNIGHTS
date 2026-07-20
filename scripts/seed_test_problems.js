const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding test problems...");

  // BugHunter problem
  const bugHunterCode = {
    python: "def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i, len(nums)): # Bug is here, should be i+1\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []"
  };

  await prisma.question.create({
    data: {
      problemId: 9001,
      title: "[BH] Two Sum with a Bug",
      description: "Find the indices of the two numbers that add up to the target. There is a bug in the provided python code. Fix it!",
      restrictions: "O(n^2) is fine.",
      difficulty: "PYTHON",
      testCases: JSON.stringify([
        { input: "[2, 7, 11, 15]\n9", output: "[0, 1]", isPublic: true },
        { input: "[3, 2, 4]\n6", output: "[1, 2]", isPublic: true }
      ]),
      hiddenTestCases: JSON.stringify([
        { input: "[3, 3]\n6", output: "[0, 1]" }
      ]),
      brokenCode: JSON.stringify(bugHunterCode)
    }
  });

  // HackBounty problem 1
  const hackBountyCode1 = {
    python: "def is_palindrome(s):\n    return s == s[::-1]"
  };

  await prisma.question.create({
    data: {
      problemId: 9002,
      title: "[HB] Valid Palindrome",
      description: "Return true if the string is a palindrome. Break this working code so it fails on edge cases!",
      restrictions: "Time limit 1s",
      difficulty: "PYTHON",
      testCases: JSON.stringify([
        { input: "racecar", output: "True", isPublic: true },
        { input: "hello", output: "False", isPublic: true }
      ]),
      hiddenTestCases: JSON.stringify([
        { input: "a", output: "True" },
        { input: "ab", output: "False" }
      ]),
      referenceCode: JSON.stringify(hackBountyCode1)
    }
  });

  // HackBounty problem 2
  const hackBountyCode2 = {
    python: "def factorial(n):\n    if n == 0: return 1\n    return n * factorial(n - 1)"
  };

  await prisma.question.create({
    data: {
      problemId: 9003,
      title: "[HB] Factorial",
      description: "Return the factorial of n. Break this working recursive solution!",
      restrictions: "Time limit 1s",
      difficulty: "PYTHON",
      testCases: JSON.stringify([
        { input: "5", output: "120", isPublic: true },
        { input: "3", output: "6", isPublic: true }
      ]),
      hiddenTestCases: JSON.stringify([
        { input: "0", output: "1" },
        { input: "1", output: "1" }
      ]),
      referenceCode: JSON.stringify(hackBountyCode2)
    }
  });

  console.log("Seeded test problems successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
