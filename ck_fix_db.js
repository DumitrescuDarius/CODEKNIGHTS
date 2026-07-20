const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  await prisma.question.upsert({
    where: { title: "Palindrome Checker (Hack Bounty)" },
    update: {
      referenceCode: JSON.stringify({
        "cpp": "#include <iostream>\n#include <string>\n#include <algorithm>\n#include <cctype>\n\nusing namespace std;\n\nbool solve(string s) {\n    string filtered = \"\";\n    for (char c : s) {\n        if (isalnum(c)) {\n            filtered += tolower(c);\n        }\n    }\n    string reversed = filtered;\n    reverse(reversed.begin(), reversed.end());\n    return filtered == reversed;\n}\n\nint main() {\n    string s;\n    if (getline(cin, s)) {\n        cout << (solve(s) ? \"True\" : \"False\") << endl;\n    }\n    return 0;\n}"
      }),
      difficulty: "Medium"
    },
    create: {
      title: "Palindrome Checker (Hack Bounty)",
      description: "A palindrome reads the same forwards and backwards. The provided reference code is an algorithm that tries to check if a string is a palindrome. However, it's vulnerable to edge cases or logic flaws!\n\nYour goal in the BREAKING phase is to introduce a subtle logic bug that makes it fail on specific inputs without breaking syntax, or to find an input edge case it fails on.\n\nThen, in the FIXING phase, you will receive your opponent's sabotaged code and must fix the bugs they introduced!",
      difficulty: "Medium",
      testCases: JSON.stringify([
        { input: "A man, a plan, a canal: Panama", output: "True" },
        { input: "race a car", output: "False" }
      ]),
      hiddenTestCases: JSON.stringify([]),
      referenceCode: JSON.stringify({
        "cpp": "#include <iostream>\n#include <string>\n#include <algorithm>\n#include <cctype>\n\nusing namespace std;\n\nbool solve(string s) {\n    string filtered = \"\";\n    for (char c : s) {\n        if (isalnum(c)) {\n            filtered += tolower(c);\n        }\n    }\n    string reversed = filtered;\n    reverse(reversed.begin(), reversed.end());\n    return filtered == reversed;\n}\n\nint main() {\n    string s;\n    if (getline(cin, s)) {\n        cout << (solve(s) ? \"True\" : \"False\") << endl;\n    }\n    return 0;\n}"
      }),
      timeLimit: 5000,
      memoryLimit: 256
    }
  });
  console.log("Upserted HackBounty question with CPP referenceCode.");
}
fix().finally(() => prisma.$disconnect());
