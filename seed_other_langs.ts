import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const problems = [
    // CPP BugHunter Problems
    {
      title: "BugHunter (CPP): Broken Addition",
      description: "Fix the function so it adds a and b.",
      difficulty: "CPP",
      testCases: JSON.stringify([{ input: "2 3", output: "5" }, { input: "10 5", output: "15" }]),
      hiddenTestCases: JSON.stringify([{ input: "0 0", output: "0" }]),
      brokenCode: JSON.stringify({ cpp: "#include <iostream>\nusing namespace std;\n\nint solve(int a, int b) {\n    return a - b; // Fix this\n}\n\nint main() {\n    int a, b;\n    while (cin >> a >> b) {\n        cout << solve(a, b) << endl;\n    }\n    return 0;\n}" })
    },
    {
      title: "BugHunter (CPP): Is Even?",
      description: "Return 1 if even, 0 if odd. The code is broken.",
      difficulty: "CPP",
      testCases: JSON.stringify([{ input: "4", output: "1" }, { input: "5", output: "0" }]),
      hiddenTestCases: JSON.stringify([{ input: "0", output: "1" }]),
      brokenCode: JSON.stringify({ cpp: "#include <iostream>\nusing namespace std;\n\nint solve(int n) {\n    return n % 2 != 0; // Fix this\n}\n\nint main() {\n    int n;\n    while (cin >> n) {\n        cout << solve(n) << endl;\n    }\n    return 0;\n}" })
    },
    // JAVA BugHunter Problems
    {
      title: "BugHunter (JAVA): Broken Multiply",
      description: "Fix the function so it multiplies a and b.",
      difficulty: "JAVA",
      testCases: JSON.stringify([{ input: "2 3", output: "6" }]),
      hiddenTestCases: JSON.stringify([{ input: "0 5", output: "0" }]),
      brokenCode: JSON.stringify({ java: "import java.util.Scanner;\n\npublic class Solution {\n    public static int solve(int a, int b) {\n        return a + b; // Fix this\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        while (sc.hasNextInt()) {\n            System.out.println(solve(sc.nextInt(), sc.nextInt()));\n        }\n    }\n}" })
    },
    {
      title: "BugHunter (JAVA): Find Maximum",
      description: "Fix the function to return the maximum of two numbers.",
      difficulty: "JAVA",
      testCases: JSON.stringify([{ input: "5 10", output: "10" }]),
      hiddenTestCases: JSON.stringify([{ input: "20 5", output: "20" }]),
      brokenCode: JSON.stringify({ java: "import java.util.Scanner;\n\npublic class Solution {\n    public static int solve(int a, int b) {\n        return Math.min(a, b); // Fix this\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        while (sc.hasNextInt()) {\n            System.out.println(solve(sc.nextInt(), sc.nextInt()));\n        }\n    }\n}" })
    },
    // C BugHunter Problems
    {
      title: "BugHunter (C): String Length",
      description: "Return the length of the string.",
      difficulty: "C",
      testCases: JSON.stringify([{ input: "hello", output: "5" }]),
      hiddenTestCases: JSON.stringify([{ input: "world", output: "5" }]),
      brokenCode: JSON.stringify({ c: "#include <stdio.h>\n#include <string.h>\n\nint solve(char* s) {\n    return 0; // Fix this\n}\n\nint main() {\n    char s[100];\n    if (scanf(\"%s\", s) == 1) {\n        printf(\"%d\\n\", solve(s));\n    }\n    return 0;\n}" })
    },
    {
      title: "BugHunter (C): Sum Array",
      description: "Sum the 3 space separated numbers.",
      difficulty: "C",
      testCases: JSON.stringify([{ input: "1 2 3", output: "6" }]),
      hiddenTestCases: JSON.stringify([{ input: "5 5 5", output: "15" }]),
      brokenCode: JSON.stringify({ c: "#include <stdio.h>\n\nint solve(int a, int b, int c) {\n    return a * b * c; // Fix this\n}\n\nint main() {\n    int a, b, c;\n    if (scanf(\"%d %d %d\", &a, &b, &c) == 3) {\n        printf(\"%d\\n\", solve(a, b, c));\n    }\n    return 0;\n}" })
    }
  ];

  let maxIdResult = await prisma.question.aggregate({ _max: { problemId: true } });
  let nextId = (maxIdResult._max.problemId || 0) + 1;

  for (const p of problems) {
    const existing = await prisma.question.findUnique({ where: { title: p.title } });
    if (!existing) {
      await prisma.question.create({
        data: { ...p, problemId: nextId }
      });
      console.log(`Created problem "${p.title}" with problemId ${nextId}`);
      nextId++;
    } else {
      await prisma.question.update({
        where: { id: existing.id },
        data: p
      });
      console.log(`Updated problem "${p.title}"`);
    }
  }
  console.log("Done");
}

main().catch(console.error).finally(() => prisma.$disconnect());

