import { Language } from "../types";

export const CPP_STL = ["vector", "string", "map", "set", "unordered_map", "unordered_set", "queue", "deque", "stack", "priority_queue", "pair", "algorithm", "iostream", "iomanip", "cmath", "bitset", "limits", "numeric", "sort", "reverse", "min", "max", "lower_bound", "upper_bound", "push_back", "pop_back", "size", "empty", "begin", "end", "insert", "erase", "find", "count", "long long", "long double", "std", "cin", "cout", "endl", "printf", "scanf", "ios::sync_with_stdio", "cin.tie", "nullptr", "main"];

export const LANG_CONFIG: Record<Language, { label: string; defaultCode: string }> = {
  "c": { label: "C", defaultCode: `#include <stdio.h>\n\nint main() {\n    int a, b;\n    while(scanf("%d %d", &a, &b) != EOF) {\n        printf("%d\\n", a + b);\n    }\n    return 0;\n}` },
  "cpp": { label: "C++", defaultCode: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    while(cin >> a >> b) {\n        cout << a + b << endl;\n    }\n    return 0;\n}` },
  "python": { label: "Python", defaultCode: `import sys\nfor line in sys.stdin:\n    try:\n        a, b = map(int, line.split())\n        print(a + b)\n    except:\n        pass` },
  "java": { label: "Java", defaultCode: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        while(sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(a + b);\n        }\n    }\n}` }
};
