import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const bhProblems = [
    {
      title: "BugHunter: Broken Addition",
      description: "Fix the function so it adds a and b.",
      difficulty: "PYTHON",
      testCases: JSON.stringify([{ input: "2 3", output: "5" }, { input: "10 5", output: "15" }]),
      hiddenTestCases: JSON.stringify([{ input: "0 0", output: "0" }]),
      brokenCode: JSON.stringify({ python: "def solve(a, b):\n    # Fix this logic\n    return a - b\n\nimport sys\nfor line in sys.stdin:\n    a, b = map(int, line.split())\n    print(solve(a, b))" })
    },
    {
      title: "BugHunter: Broken Multiply",
      description: "Fix the function so it multiplies a and b.",
      difficulty: "PYTHON",
      testCases: JSON.stringify([{ input: "2 3", output: "6" }]),
      hiddenTestCases: JSON.stringify([{ input: "0 5", output: "0" }]),
      brokenCode: JSON.stringify({ python: "def solve(a, b):\n    return a + b\n\nimport sys\nfor line in sys.stdin:\n    a, b = map(int, line.split())\n    print(solve(a, b))" })
    },
    {
      title: "BugHunter: Reverse String (Broken)",
      description: "Fix the function to correctly reverse the input string.",
      difficulty: "PYTHON",
      testCases: JSON.stringify([{ input: "hello", output: "olleh" }]),
      hiddenTestCases: JSON.stringify([{ input: "world", output: "dlrow" }]),
      brokenCode: JSON.stringify({ python: "def solve(s):\n    return s\n\nimport sys\nfor line in sys.stdin:\n    print(solve(line.strip()))" })
    },
    {
      title: "BugHunter: Find Maximum (Broken)",
      description: "Fix the function to return the maximum of two numbers.",
      difficulty: "PYTHON",
      testCases: JSON.stringify([{ input: "5 10", output: "10" }]),
      hiddenTestCases: JSON.stringify([{ input: "20 5", output: "20" }]),
      brokenCode: JSON.stringify({ python: "def solve(a, b):\n    return min(a, b)\n\nimport sys\nfor line in sys.stdin:\n    a, b = map(int, line.split())\n    print(solve(a, b))" })
    },
    {
      title: "BugHunter: Is Even? (Broken)",
      description: "Return True if even, False if odd. The code is broken.",
      difficulty: "PYTHON",
      testCases: JSON.stringify([{ input: "4", output: "True" }, { input: "5", output: "False" }]),
      hiddenTestCases: JSON.stringify([{ input: "0", output: "True" }]),
      brokenCode: JSON.stringify({ python: "def solve(n):\n    return n % 2 != 0\n\nimport sys\nfor line in sys.stdin:\n    print(solve(int(line.strip())))" })
    }
  ];

  const hbProblems = [
    {
      title: "HackBounty: Simple Subtraction",
      description: "Subtract b from a.",
      difficulty: "PYTHON",
      testCases: JSON.stringify([{ input: "5 2", output: "3" }]),
      hiddenTestCases: JSON.stringify([{ input: "10 10", output: "0" }]),
      referenceCode: JSON.stringify({ python: "def solve(a, b):\n    return a - b\n\nimport sys\nfor line in sys.stdin:\n    a, b = map(int, line.split())\n    print(solve(a, b))" })
    },
    {
      title: "HackBounty: String Length",
      description: "Return the length of the string.",
      difficulty: "PYTHON",
      testCases: JSON.stringify([{ input: "hello", output: "5" }]),
      hiddenTestCases: JSON.stringify([{ input: "world", output: "5" }]),
      referenceCode: JSON.stringify({ python: "def solve(s):\n    return len(s)\n\nimport sys\nfor line in sys.stdin:\n    print(solve(line.strip()))" })
    },
    {
      title: "HackBounty: Square Number",
      description: "Return the square of n.",
      difficulty: "PYTHON",
      testCases: JSON.stringify([{ input: "4", output: "16" }]),
      hiddenTestCases: JSON.stringify([{ input: "5", output: "25" }]),
      referenceCode: JSON.stringify({ python: "def solve(n):\n    return n * n\n\nimport sys\nfor line in sys.stdin:\n    print(solve(int(line.strip())))" })
    },
    {
      title: "HackBounty: Count Vowels",
      description: "Count the number of vowels in a string (a,e,i,o,u).",
      difficulty: "PYTHON",
      testCases: JSON.stringify([{ input: "hello", output: "2" }]),
      hiddenTestCases: JSON.stringify([{ input: "world", output: "1" }]),
      referenceCode: JSON.stringify({ python: "def solve(s):\n    return sum(1 for c in s if c in \"aeiou\")\n\nimport sys\nfor line in sys.stdin:\n    print(solve(line.strip()))" })
    },
    {
      title: "HackBounty: Sum Array",
      description: "Sum the array of space separated numbers.",
      difficulty: "PYTHON",
      testCases: JSON.stringify([{ input: "1 2 3", output: "6" }]),
      hiddenTestCases: JSON.stringify([{ input: "5 5", output: "10" }]),
      referenceCode: JSON.stringify({ python: "def solve(arr):\n    return sum(arr)\n\nimport sys\nfor line in sys.stdin:\n    print(solve(list(map(int, line.split()))))" })
    }
  ];

  for (const p of [...bhProblems, ...hbProblems]) {
    await prisma.question.upsert({
      where: { title: p.title },
      update: p,
      create: p
    });
  }
  console.log("Done");
}

main().catch(console.error).finally(() => prisma.$disconnect());

