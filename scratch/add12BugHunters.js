const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const problems = [
    // --- C PROBLEMS ---
    {
      title: "The Peasant's Toll",
      description: "The Royal Tax Collector computes the toll for peasants crossing the bridge. A silver coin is worth 100 copper. The code calculates the average toll in copper per peasant, but the fractional part is missing! Fix the C code.",
      difficulty: "C",
      brokenCode: JSON.stringify({
        c: `#include <stdio.h>\n\nfloat calculate_average(int total_copper, int peasants) {\n    if (peasants == 0) return 0.0;\n    float avg = total_copper / peasants;\n    return avg;\n}\n\nint main() {\n    int c, p;\n    if (scanf("%d %d", &c, &p) != 2) return 0;\n    printf("%.2f\\n", calculate_average(c, p));\n    return 0;\n}`
      }),
      referenceCode: JSON.stringify({
        c: `#include <stdio.h>\n\nfloat calculate_average(int total_copper, int peasants) {\n    if (peasants == 0) return 0.0;\n    float avg = (float)total_copper / peasants;\n    return avg;\n}\n\nint main() {\n    int c, p;\n    if (scanf("%d %d", &c, &p) != 2) return 0;\n    printf("%.2f\\n", calculate_average(c, p));\n    return 0;\n}`
      }),
      testCases: JSON.stringify([
        { input: "150 2", expected: "75.00" },
        { input: "151 2", expected: "75.50" }, // Bug happens here
        { input: "10 3", expected: "3.33" },
        { input: "0 5", expected: "0.00" },
        { input: "100 0", expected: "0.00" },
        { input: "500 7", expected: "71.43" },
        { input: "1 2", expected: "0.50" },
        { input: "99 10", expected: "9.90" },
        { input: "1000 33", expected: "30.30" },
        { input: "12345 100", expected: "123.45" }
      ]),
      hiddenTestCases: JSON.stringify([])
    },
    {
      title: "The Jester's Riddle",
      description: "The Court Jester encrypts his riddles by reversing the words. But his C program occasionally spits out garbage characters at the end! Fix the string reversal logic.",
      difficulty: "C",
      brokenCode: JSON.stringify({
        c: `#include <stdio.h>\n#include <string.h>\n\nvoid reverse(char* str) {\n    int len = strlen(str);\n    char temp[100];\n    for (int i = 0; i < len; i++) {\n        temp[i] = str[len - 1 - i];\n    }\n    strcpy(str, temp);\n}\n\nint main() {\n    char str[100];\n    if (scanf("%99s", str) != 1) return 0;\n    reverse(str);\n    printf("%s\\n", str);\n    return 0;\n}`
      }),
      referenceCode: JSON.stringify({
        c: `#include <stdio.h>\n#include <string.h>\n\nvoid reverse(char* str) {\n    int len = strlen(str);\n    char temp[100];\n    for (int i = 0; i < len; i++) {\n        temp[i] = str[len - 1 - i];\n    }\n    temp[len] = '\\0';\n    strcpy(str, temp);\n}\n\nint main() {\n    char str[100];\n    if (scanf("%99s", str) != 1) return 0;\n    reverse(str);\n    printf("%s\\n", str);\n    return 0;\n}`
      }),
      testCases: JSON.stringify([
        { input: "castle", expected: "eltsac" },
        { input: "king", expected: "gnik" },
        { input: "sword", expected: "drows" },
        { input: "a", expected: "a" },
        { input: "bb", expected: "bb" },
        { input: "jester", expected: "retsej" },
        { input: "kingdom", expected: "modgnik" },
        { input: "peasant", expected: "tnasaep" },
        { input: "dragon", expected: "nogard" },
        { input: "knight", expected: "thgink" }
      ]),
      hiddenTestCases: JSON.stringify([])
    },
    {
      title: "The Guard's Patrol",
      description: "The Royal Guard creates an array of patrol checkpoints. But the C function that returns the array causes a segmentation fault or memory corruption! Fix the memory allocation.",
      difficulty: "C",
      brokenCode: JSON.stringify({
        c: `#include <stdio.h>\n#include <stdlib.h>\n\nint* create_patrol(int n) {\n    int arr[100];\n    for (int i = 0; i < n; i++) {\n        arr[i] = i + 1;\n    }\n    return arr;\n}\n\nint main() {\n    int n;\n    if (scanf("%d", &n) != 1) return 0;\n    int* patrol = create_patrol(n);\n    for (int i = 0; i < n; i++) {\n        printf("%d ", patrol[i]);\n    }\n    printf("\\n");\n    return 0;\n}`
      }),
      referenceCode: JSON.stringify({
        c: `#include <stdio.h>\n#include <stdlib.h>\n\nint* create_patrol(int n) {\n    int* arr = (int*)malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        arr[i] = i + 1;\n    }\n    return arr;\n}\n\nint main() {\n    int n;\n    if (scanf("%d", &n) != 1) return 0;\n    int* patrol = create_patrol(n);\n    for (int i = 0; i < n; i++) {\n        printf("%d ", patrol[i]);\n    }\n    printf("\\n");\n    free(patrol);\n    return 0;\n}`
      }),
      testCases: JSON.stringify([
        { input: "3", expected: "1 2 3 " },
        { input: "5", expected: "1 2 3 4 5 " },
        { input: "1", expected: "1 " },
        { input: "10", expected: "1 2 3 4 5 6 7 8 9 10 " },
        { input: "2", expected: "1 2 " },
        { input: "4", expected: "1 2 3 4 " },
        { input: "6", expected: "1 2 3 4 5 6 " },
        { input: "7", expected: "1 2 3 4 5 6 7 " },
        { input: "8", expected: "1 2 3 4 5 6 7 8 " },
        { input: "9", expected: "1 2 3 4 5 6 7 8 9 " }
      ]),
      hiddenTestCases: JSON.stringify([])
    },

    // --- CPP PROBLEMS ---
    {
      title: "The Dragon's Breath",
      description: "A C++ program tracks the Dragon's fire blasts. It filters out blasts below a certain temperature using iterators, but it sometimes crashes or behaves unpredictably! Fix the iterator invalidation bug.",
      difficulty: "CPP",
      brokenCode: JSON.stringify({
        cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint main() {\n    int n, min_temp;\n    if (!(cin >> n >> min_temp)) return 0;\n    vector<int> blasts(n);\n    for (int i = 0; i < n; i++) cin >> blasts[i];\n    \n    for (auto it = blasts.begin(); it != blasts.end(); it++) {\n        if (*it < min_temp) {\n            blasts.erase(it);\n        }\n    }\n    \n    for (int b : blasts) cout << b << " ";\n    cout << "\\n";\n    return 0;\n}`
      }),
      referenceCode: JSON.stringify({
        cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint main() {\n    int n, min_temp;\n    if (!(cin >> n >> min_temp)) return 0;\n    vector<int> blasts(n);\n    for (int i = 0; i < n; i++) cin >> blasts[i];\n    \n    for (auto it = blasts.begin(); it != blasts.end(); ) {\n        if (*it < min_temp) {\n            it = blasts.erase(it);\n        } else {\n            it++;\n        }\n    }\n    \n    for (int b : blasts) cout << b << " ";\n    cout << "\\n";\n    return 0;\n}`
      }),
      testCases: JSON.stringify([
        { input: "5 100\n50 150 40 120 10", expected: "150 120 " },
        { input: "3 50\n10 20 30", expected: "" },
        { input: "4 10\n20 30 40 50", expected: "20 30 40 50 " },
        { input: "6 5\n1 6 2 7 3 8", expected: "6 7 8 " },
        { input: "2 100\n100 100", expected: "100 100 " },
        { input: "5 50\n50 49 50 49 50", expected: "50 50 50 " },
        { input: "3 10\n10 10 9", expected: "10 10 " },
        { input: "4 20\n10 15 5 0", expected: "" },
        { input: "1 50\n60", expected: "60 " },
        { input: "7 30\n20 40 25 35 15 45 10", expected: "40 35 45 " }
      ]),
      hiddenTestCases: JSON.stringify([])
    },
    {
      title: "The Archer's Range",
      description: "The Archer needs to sort targets by distance. His C++ custom comparator occasionally causes a segmentation fault because it doesn't meet the strict weak ordering requirement (it returns true for equal elements). Fix the sorting logic.",
      difficulty: "CPP",
      brokenCode: JSON.stringify({
        cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nbool compareTargets(int a, int b) {\n    return a <= b;\n}\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> targets(n);\n    for (int i = 0; i < n; i++) cin >> targets[i];\n    \n    sort(targets.begin(), targets.end(), compareTargets);\n    \n    for (int t : targets) cout << t << " ";\n    cout << "\\n";\n    return 0;\n}`
      }),
      referenceCode: JSON.stringify({
        cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nbool compareTargets(int a, int b) {\n    return a < b;\n}\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> targets(n);\n    for (int i = 0; i < n; i++) cin >> targets[i];\n    \n    sort(targets.begin(), targets.end(), compareTargets);\n    \n    for (int t : targets) cout << t << " ";\n    cout << "\\n";\n    return 0;\n}`
      }),
      testCases: JSON.stringify([
        { input: "5\n5 2 4 1 3", expected: "1 2 3 4 5 " },
        { input: "3\n10 10 10", expected: "10 10 10 " },
        { input: "6\n9 3 9 3 9 3", expected: "3 3 3 9 9 9 " },
        { input: "1\n42", expected: "42 " },
        { input: "4\n1 2 3 4", expected: "1 2 3 4 " },
        { input: "4\n4 3 2 1", expected: "1 2 3 4 " },
        { input: "7\n5 5 1 1 3 3 2", expected: "1 1 2 3 3 5 5 " },
        { input: "5\n0 0 0 0 0", expected: "0 0 0 0 0 " },
        { input: "2\n100 50", expected: "50 100 " },
        { input: "8\n8 7 6 5 4 3 2 1", expected: "1 2 3 4 5 6 7 8 " }
      ]),
      hiddenTestCases: JSON.stringify([])
    },
    {
      title: "The Siege Tower's Ladder",
      description: "The soldiers climb the siege tower ladder. A C++ program counts total steps taken by all soldiers, but the total is unpredictable and massive! Fix the uninitialized variable.",
      difficulty: "CPP",
      brokenCode: JSON.stringify({
        cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    long long total_steps;\n    for (int i = 0; i < n; i++) {\n        int steps;\n        cin >> steps;\n        total_steps += steps;\n    }\n    cout << total_steps << "\\n";\n    return 0;\n}`
      }),
      referenceCode: JSON.stringify({
        cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    long long total_steps = 0;\n    for (int i = 0; i < n; i++) {\n        int steps;\n        cin >> steps;\n        total_steps += steps;\n    }\n    cout << total_steps << "\\n";\n    return 0;\n}`
      }),
      testCases: JSON.stringify([
        { input: "3\n10 20 30", expected: "60" },
        { input: "1\n50", expected: "50" },
        { input: "5\n1 1 1 1 1", expected: "5" },
        { input: "2\n100 100", expected: "200" },
        { input: "4\n0 0 0 0", expected: "0" },
        { input: "6\n5 10 15 20 25 30", expected: "105" },
        { input: "3\n99 99 99", expected: "297" },
        { input: "2\n500 500", expected: "1000" },
        { input: "1\n0", expected: "0" },
        { input: "5\n1000 2000 3000 4000 5000", expected: "15000" }
      ]),
      hiddenTestCases: JSON.stringify([])
    },

    // --- JAVA PROBLEMS ---
    {
      title: "The Squire's Inventory",
      description: "The Squire compares weapon IDs in Java. He uses Integer objects, but it says IDs don't match for large numbers even when they are equal! Fix the object equality check.",
      difficulty: "JAVA",
      brokenCode: JSON.stringify({
        java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        Integer id1 = sc.nextInt();\n        Integer id2 = sc.nextInt();\n        \n        if (id1 == id2) {\n            System.out.println("Match");\n        } else {\n            System.out.println("Mismatch");\n        }\n    }\n}`
      }),
      referenceCode: JSON.stringify({
        java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        Integer id1 = sc.nextInt();\n        Integer id2 = sc.nextInt();\n        \n        if (id1.equals(id2)) {\n            System.out.println("Match");\n        } else {\n            System.out.println("Mismatch");\n        }\n    }\n}`
      }),
      testCases: JSON.stringify([
        { input: "100 100", expected: "Match" }, // Works in Java due to caching!
        { input: "1000 1000", expected: "Match" }, // Fails with ==
        { input: "50 51", expected: "Mismatch" },
        { input: "9999 9999", expected: "Match" },
        { input: "10 10", expected: "Match" },
        { input: "128 128", expected: "Match" },
        { input: "127 127", expected: "Match" },
        { input: "50000 50000", expected: "Match" },
        { input: "0 0", expected: "Match" },
        { input: "1000 1001", expected: "Mismatch" }
      ]),
      hiddenTestCases: JSON.stringify([])
    },
    {
      title: "The King's Banquet",
      description: "The King is finalizing his guest list. A Java program removes guests who canceled, but modifying the ArrayList while iterating over it causes a ConcurrentModificationException! Fix it.",
      difficulty: "JAVA",
      brokenCode: JSON.stringify({
        java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        List<String> guests = new ArrayList<>();\n        for (int i = 0; i < n; i++) guests.add(sc.next());\n        String canceled = sc.next();\n        \n        for (String g : guests) {\n            if (g.equals(canceled)) {\n                guests.remove(g);\n            }\n        }\n        \n        System.out.println(guests.size());\n    }\n}`
      }),
      referenceCode: JSON.stringify({
        java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        List<String> guests = new ArrayList<>();\n        for (int i = 0; i < n; i++) guests.add(sc.next());\n        String canceled = sc.next();\n        \n        guests.removeIf(g -> g.equals(canceled));\n        \n        System.out.println(guests.size());\n    }\n}`
      }),
      testCases: JSON.stringify([
        { input: "3 Arthur Lancelot Merlin Merlin", expected: "2" },
        { input: "4 A B C D E", expected: "4" },
        { input: "5 Bob Bob Alice Bob Bob Bob", expected: "1" },
        { input: "1 King King", expected: "0" },
        { input: "2 Queen Knight Joker", expected: "2" },
        { input: "6 A B C A B C A", expected: "4" },
        { input: "3 x y z x", expected: "2" },
        { input: "5 a b c d e f", expected: "5" },
        { input: "4 a a a a a", expected: "0" },
        { input: "3 1 2 3 2", expected: "2" }
      ]),
      hiddenTestCases: JSON.stringify([])
    },
    {
      title: "The Moat's Depth",
      description: "The architect needs to calculate average depth. His Java function returns an int instead of a double, truncating the result. Fix the average depth calculation.",
      difficulty: "JAVA",
      brokenCode: JSON.stringify({
        java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int sum = 0;\n        for (int i = 0; i < n; i++) {\n            sum += sc.nextInt();\n        }\n        \n        double average = sum / n;\n        System.out.printf("%.2f\\n", average);\n    }\n}`
      }),
      referenceCode: JSON.stringify({
        java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int sum = 0;\n        for (int i = 0; i < n; i++) {\n            sum += sc.nextInt();\n        }\n        \n        double average = (double) sum / n;\n        System.out.printf("%.2f\\n", average);\n    }\n}`
      }),
      testCases: JSON.stringify([
        { input: "3 5 5 6", expected: "5.33" },
        { input: "2 10 11", expected: "10.50" },
        { input: "4 1 1 1 2", expected: "1.25" },
        { input: "5 0 0 0 0 0", expected: "0.00" },
        { input: "1 42", expected: "42.00" },
        { input: "3 10 20 30", expected: "20.00" },
        { input: "2 99 100", expected: "99.50" },
        { input: "4 3 3 3 4", expected: "3.25" },
        { input: "10 1 2 3 4 5 6 7 8 9 10", expected: "5.50" },
        { input: "2 1 2", expected: "1.50" }
      ]),
      hiddenTestCases: JSON.stringify([])
    },

    // --- PYTHON PROBLEMS ---
    {
      title: "The Wizard's Spellbook",
      description: "The Wizard's spell-adding function uses a default mutable argument `def add_spell(spell, book=[])`. He notices that previous spells magically appear in new empty books! Fix the default argument.",
      difficulty: "PYTHON",
      brokenCode: JSON.stringify({
        python: `import sys\n\ndef add_spell(spell, book=[]):\n    book.append(spell)\n    return book\n\ndef solve():\n    input_data = sys.stdin.read().split()\n    if not input_data: return\n    n = int(input_data[0])\n    \n    b1 = add_spell(input_data[1])\n    b2 = add_spell(input_data[2])\n    \n    print(len(b1) + len(b2))\n\nsolve()`
      }),
      referenceCode: JSON.stringify({
        python: `import sys\n\ndef add_spell(spell, book=None):\n    if book is None: book = []\n    book.append(spell)\n    return book\n\ndef solve():\n    input_data = sys.stdin.read().split()\n    if not input_data: return\n    n = int(input_data[0])\n    \n    b1 = add_spell(input_data[1])\n    b2 = add_spell(input_data[2])\n    \n    print(len(b1) + len(b2))\n\nsolve()`
      }),
      testCases: JSON.stringify([
        { input: "2 Fireball Iceblock", expected: "2" }, // If broken, b1 becomes ['Fireball', 'Iceblock'] and b2 is the same list. len is 2+2=4!
        { input: "2 Heal Curse", expected: "2" },
        { input: "2 A B", expected: "2" },
        { input: "2 X Y", expected: "2" },
        { input: "2 Foo Bar", expected: "2" },
        { input: "2 Shield Sword", expected: "2" },
        { input: "2 Magic Mana", expected: "2" },
        { input: "2 Spell Cast", expected: "2" },
        { input: "2 One Two", expected: "2" },
        { input: "2 Red Blue", expected: "2" }
      ]),
      hiddenTestCases: JSON.stringify([])
    },
    {
      title: "The Merchant's Coin",
      description: "A Python script updates the Merchant's inventory dictionary while iterating over its keys, causing a `RuntimeError: dictionary changed size during iteration`. Fix it by iterating over a list of keys instead.",
      difficulty: "PYTHON",
      brokenCode: JSON.stringify({
        python: `import sys\n\ndef solve():\n    input_data = sys.stdin.read().split()\n    if not input_data: return\n    n = int(input_data[0])\n    \n    inventory = {}\n    for i in range(n):\n        inventory[input_data[i+1]] = 1\n        \n    for item in inventory:\n        if item == "cursed_coin":\n            del inventory[item]\n            \n    print(len(inventory))\n\nsolve()`
      }),
      referenceCode: JSON.stringify({
        python: `import sys\n\ndef solve():\n    input_data = sys.stdin.read().split()\n    if not input_data: return\n    n = int(input_data[0])\n    \n    inventory = {}\n    for i in range(n):\n        inventory[input_data[i+1]] = 1\n        \n    for item in list(inventory.keys()):\n        if item == "cursed_coin":\n            del inventory[item]\n            \n    print(len(inventory))\n\nsolve()`
      }),
      testCases: JSON.stringify([
        { input: "3 apple bread cursed_coin", expected: "2" },
        { input: "1 cursed_coin", expected: "0" },
        { input: "4 sword shield potion cursed_coin", expected: "3" },
        { input: "2 apple bread", expected: "2" },
        { input: "5 a b cursed_coin c d", expected: "4" },
        { input: "1 apple", expected: "1" },
        { input: "3 cursed_coin x y", expected: "2" },
        { input: "6 1 2 3 cursed_coin 4 5", expected: "5" },
        { input: "2 cursed_coin cursed_coin", expected: "0" },
        { input: "4 cursed_coin a cursed_coin b", expected: "2" }
      ]),
      hiddenTestCases: JSON.stringify([])
    },
    {
      title: "The Queen's Crown",
      description: "The royal jeweler tries to swap jewels in the Queen's crown using a Python tuple. But tuples are immutable, and attempting to assign to one causes a TypeError! Fix the code by using a list.",
      difficulty: "PYTHON",
      brokenCode: JSON.stringify({
        python: `import sys\n\ndef solve():\n    input_data = sys.stdin.read().split()\n    if not input_data: return\n    \n    crown = (input_data[0], input_data[1], input_data[2])\n    crown[1] = "Diamond"\n    \n    print(crown[0], crown[1], crown[2])\n\nsolve()`
      }),
      referenceCode: JSON.stringify({
        python: `import sys\n\ndef solve():\n    input_data = sys.stdin.read().split()\n    if not input_data: return\n    \n    crown = [input_data[0], input_data[1], input_data[2]]\n    crown[1] = "Diamond"\n    \n    print(crown[0], crown[1], crown[2])\n\nsolve()`
      }),
      testCases: JSON.stringify([
        { input: "Ruby Emerald Sapphire", expected: "Ruby Diamond Sapphire" },
        { input: "Gold Iron Silver", expected: "Gold Diamond Silver" },
        { input: "A B C", expected: "A Diamond C" },
        { input: "Rock Paper Scissors", expected: "Rock Diamond Scissors" },
        { input: "Red Green Blue", expected: "Red Diamond Blue" },
        { input: "One Two Three", expected: "One Diamond Three" },
        { input: "X Y Z", expected: "X Diamond Z" },
        { input: "Diamond Diamond Diamond", expected: "Diamond Diamond Diamond" },
        { input: "First Second Third", expected: "First Diamond Third" },
        { input: "Apple Banana Cherry", expected: "Apple Diamond Cherry" }
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
    console.log("Created BugHunter: ", p.title);
  }
}
run();
