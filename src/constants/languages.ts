import { Language } from "../types";

export const CPP_STL = ["vector", "string", "map", "set", "unordered_map", "unordered_set", "queue", "deque", "stack", "priority_queue", "pair", "algorithm", "iostream", "iomanip", "cmath", "bitset", "limits", "numeric", "sort", "reverse", "min", "max", "lower_bound", "upper_bound", "push_back", "pop_back", "size", "empty", "begin", "end", "insert", "erase", "find", "count", "long long", "long double", "std", "cin", "cout", "endl", "printf", "scanf", "ios::sync_with_stdio", "cin.tie", "nullptr", "main"];

export const LANG_CONFIG: Record<Language, { label: string; defaultCode: string }> = {
  "c": { label: "C", defaultCode: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}` },
  "cpp": { label: "C++", defaultCode: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}` },
  "python": { label: "Python", defaultCode: `print("Hello, World!")` },
  "java": { label: "Java", defaultCode: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}` }
};
