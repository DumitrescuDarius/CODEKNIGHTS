const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const problems = [
    {
      title: "The Alchemist's Potion Mix",
      description: "The Kingdom's Grand Alchemist needs to prepare a batch of potions for the siege. He wrote a Python script to filter out potions that exceed the target power, but some of the powerful potions keep slipping into the mix and blowing up the cauldron! Find and fix the bug.",
      difficulty: "PYTHON",
      brokenCode: JSON.stringify({
        python: `def mix_potions(potions, target_power):\n    for p in potions:\n        if p > target_power:\n            potions.remove(p)\n    return sum(potions)\n\nimport sys\ninput_data = sys.stdin.read().split()\nif not input_data: exit()\nn = int(input_data[0])\ntarget = int(input_data[1])\npotions = [int(x) for x in input_data[2:2+n]]\nprint(mix_potions(potions, target))`
      }),
      referenceCode: JSON.stringify({
        python: `def mix_potions(potions, target_power):\n    filtered = [p for p in potions if p <= target_power]\n    return sum(filtered)\n\nimport sys\ninput_data = sys.stdin.read().split()\nif not input_data: exit()\nn = int(input_data[0])\ntarget = int(input_data[1])\npotions = [int(x) for x in input_data[2:2+n]]\nprint(mix_potions(potions, target))`
      }),
      testCases: JSON.stringify([
        { input: "5 10\n5 15 12 8 3", expected: "16" }, // 15 and 12 are adjacent! remove(15) skips 12.
        { input: "3 5\n10 10 10", expected: "0" },
        { input: "4 20\n25 30 5 10", expected: "15" },
        { input: "6 100\n101 102 103 50 50 104", expected: "100" },
        { input: "2 10\n1 2", expected: "3" },
        { input: "5 50\n60 70 80 90 100", expected: "0" },
        { input: "3 10\n11 10 12", expected: "10" },
        { input: "4 15\n16 16 16 10", expected: "10" },
        { input: "7 5\n10 10 1 10 10 2 10", expected: "3" },
        { input: "5 0\n1 2 3 4 5", expected: "0" }
      ]),
      hiddenTestCases: JSON.stringify([])
    },
    {
      title: "The Castle Wall Defense",
      description: "To defend against the incoming horde, the castle architect calculates the total defense points of the walls. The defense point of a wall segment is the square of its height. However, for massive walls, the system seems to report negative or totally incorrect defense points! Fix the C++ code.",
      difficulty: "CPP",
      brokenCode: JSON.stringify({
        cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nlong long calculate_defense(int n, vector<int>& walls) {\n    long long total = 0;\n    for(int i = 0; i < n; i++) {\n        total += walls[i] * walls[i];\n    }\n    return total;\n}\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> walls(n);\n    for(int i=0; i<n; i++) cin >> walls[i];\n    cout << calculate_defense(n, walls) << "\\n";\n    return 0;\n}`
      }),
      referenceCode: JSON.stringify({
        cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nlong long calculate_defense(int n, vector<int>& walls) {\n    long long total = 0;\n    for(int i = 0; i < n; i++) {\n        total += (long long)walls[i] * walls[i];\n    }\n    return total;\n}\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> walls(n);\n    for(int i=0; i<n; i++) cin >> walls[i];\n    cout << calculate_defense(n, walls) << "\\n";\n    return 0;\n}`
      }),
      testCases: JSON.stringify([
        { input: "3\n2 3 4", expected: "29" },
        { input: "2\n100000 100000", expected: "20000000000" }, 
        { input: "5\n10 20 30 40 50", expected: "5500" },
        { input: "4\n50000 50000 50000 50000", expected: "10000000000" },
        { input: "1\n0", expected: "0" },
        { input: "2\n200000 200000", expected: "80000000000" },
        { input: "3\n0 100000 0", expected: "10000000000" },
        { input: "10\n1000 1000 1000 1000 1000 1000 1000 1000 1000 1000", expected: "10000000" },
        { input: "2\n300000 300000", expected: "180000000000" },
        { input: "1\n1", expected: "1" }
      ]),
      hiddenTestCases: JSON.stringify([])
    },
    {
      title: "The Knight's Tour",
      description: "The Royal Guard is tracking a rogue knight's movements. They wrote a Java program to check if the target destination matches the reported destination. But the system keeps saying 'Mismatch' even when the names are identical! Find and fix the Java bug.",
      difficulty: "JAVA",
      brokenCode: JSON.stringify({
        java: `import java.util.Scanner;\n\npublic class Main {\n    public static boolean checkDestination(String actual, String reported) {\n        return actual == reported;\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String actual = new String(sc.next());\n        String reported = new String(sc.next());\n        \n        if (checkDestination(actual, reported)) {\n            System.out.println("Match");\n        } else {\n            System.out.println("Mismatch");\n        }\n    }\n}`
      }),
      referenceCode: JSON.stringify({
        java: `import java.util.Scanner;\n\npublic class Main {\n    public static boolean checkDestination(String actual, String reported) {\n        return actual.equals(reported);\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String actual = new String(sc.next());\n        String reported = new String(sc.next());\n        \n        if (checkDestination(actual, reported)) {\n            System.out.println("Match");\n        } else {\n            System.out.println("Mismatch");\n        }\n    }\n}`
      }),
      testCases: JSON.stringify([
        { input: "Camelot Camelot", expected: "Match" },
        { input: "Avalon Avalon", expected: "Match" },
        { input: "Camelot Avalon", expected: "Mismatch" },
        { input: "York York", expected: "Match" },
        { input: "London Paris", expected: "Mismatch" },
        { input: "A A", expected: "Match" },
        { input: "B C", expected: "Mismatch" },
        { input: "King King", expected: "Match" },
        { input: "Queen King", expected: "Mismatch" },
        { input: "Castle Castle", expected: "Match" }
      ]),
      hiddenTestCases: JSON.stringify([])
    },
    {
      title: "The Messenger's Cipher",
      description: "The Kingdom's scouts use a simple Caesar cipher to encrypt their messages. But the C decryption function produces strange, unreadable symbols when decoding! Fix the C code so it properly decrypts the messages.",
      difficulty: "C",
      brokenCode: JSON.stringify({
        c: `#include <stdio.h>\n#include <string.h>\n\nvoid decrypt(char* str, int shift) {\n    for(int i = 0; i < strlen(str); i++) {\n        int val = str[i] - 'a';\n        val = (val - shift) % 26;\n        str[i] = val + 'a';\n    }\n}\n\nint main() {\n    char str[100];\n    int shift;\n    if (scanf("%99s %d", str, &shift) != 2) return 0;\n    decrypt(str, shift);\n    printf("%s\\n", str);\n    return 0;\n}`
      }),
      referenceCode: JSON.stringify({
        c: `#include <stdio.h>\n#include <string.h>\n\nvoid decrypt(char* str, int shift) {\n    for(int i = 0; i < strlen(str); i++) {\n        int val = str[i] - 'a';\n        val = (val - shift) % 26;\n        if (val < 0) val += 26;\n        str[i] = val + 'a';\n    }\n}\n\nint main() {\n    char str[100];\n    int shift;\n    if (scanf("%99s %d", str, &shift) != 2) return 0;\n    decrypt(str, shift);\n    printf("%s\\n", str);\n    return 0;\n}`
      }),
      testCases: JSON.stringify([
        { input: "def 3", expected: "abc" },
        { input: "abc 3", expected: "xyz" }, 
        { input: "xyz 1", expected: "wxy" },
        { input: "bcd 5", expected: "wxy" },
        { input: "xubbe 16", expected: "hello" },
        { input: "fidbco 5", expected: "axwyzj" }, 
        { input: "a 1", expected: "z" },
        { input: "z 25", expected: "a" },
        { input: "voovxf 21", expected: "attack" },
        { input: "bcdclqc 24", expected: "defense" }
      ]),
      hiddenTestCases: JSON.stringify([])
    }
  ];
  
  let maxId = await prisma.question.aggregate({ _max: { problemId: true } });
  let nextId = (maxId._max.problemId || 1000) + 1;

  for (const p of problems) {
    if (!p.title) continue; 
    await prisma.question.create({
      data: {
        problemId: nextId++,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        brokenCode: p.brokenCode,
        referenceCode: p.referenceCode,
        testCases: p.testCases,
        hiddenTestCases: p.hiddenTestCases,
        
      }
    });
    console.log("Created", p.title);
  }
}
run();
