export const registerAutocompletes = (monaco: any) => {
  const languages = ["c", "cpp", "python", "java"];

  const disposables = languages.map((lang) => {
    return monaco.languages.registerCompletionItemProvider(lang, {
      triggerCharacters: [".", ":"],
      provideCompletionItems: (model: any, position: any, context: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const lineContent = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // 1. Get standard static suggestions
        let suggestions: any[] = [];
        if (lang === "cpp" || lang === "c") {
          suggestions = getCppSuggestions(monaco, range, lineContent, lang === "c");
        } else if (lang === "python") {
          suggestions = getPythonSuggestions(monaco, range, lineContent);
        } else if (lang === "java") {
          suggestions = getJavaSuggestions(monaco, range, lineContent);
        }

        // 2. Dynamically parse declared variables in the active document
        const isStdTrigger = lineContent.endsWith("std::") || lineContent.endsWith("::");
        const isDotTrigger = lineContent.endsWith(".");

        // Only add local variables if we are not actively triggering members via std:: or dot
        if (!isStdTrigger && !isDotTrigger) {
          const rawCode = model.getValue();
          const cleanedCode = cleanCodeForParsing(rawCode, lang);
          let localVars: string[] = [];

          if (lang === "cpp" || lang === "c") {
            localVars = getDeclaredVariablesCpp(cleanedCode);
          } else if (lang === "python") {
            localVars = getDeclaredVariablesPython(cleanedCode);
          } else if (lang === "java") {
            localVars = getDeclaredVariablesJava(cleanedCode);
          }

          const localSuggestions = localVars.map((v) => ({
            label: v,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: v,
            detail: "Local Variable / Function",
            range,
          }));

          suggestions = [...suggestions, ...localSuggestions];
        }

        return { suggestions };
      },
    });
  });

  return {
    dispose: () => {
      disposables.forEach((d) => {
        try {
          d.dispose();
        } catch (e) {
          console.error("Failed to dispose monaco completion item provider:", e);
        }
      });
    }
  };
};

// Clean comments and strings from code to prevent false parsing
const cleanCodeForParsing = (code: string, lang: string): string => {
  if (lang === "python") {
    code = code.replace(/#.*$/gm, ""); // strip line comments
    code = code.replace(/'''[\s\S]*?'''/g, ""); // strip docstrings
    code = code.replace(/"""[\s\S]*?"""/g, "");
  } else {
    code = code.replace(/\/\/.*$/gm, ""); // strip line comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, ""); // strip block comments
  }
  // Strip string literals
  code = code.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, "");
  code = code.replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, "");
  return code;
};

// Parse declared variables in C++ / C
const getDeclaredVariablesCpp = (code: string): string[] => {
  const variables: Set<string> = new Set();
  let match;

  // 1. Basic types: int, double, float, char, bool, long long, string, auto, size_t
  const basicRegex = /\b(?:int|double|float|char|bool|string|auto|size_t|long\s+long)\s+([a-zA-Z_]\w*)\b/g;
  while ((match = basicRegex.exec(code)) !== null) {
    if (match[1]) variables.add(match[1]);
  }

  // 2. STL Container types: vector<int> vec, map<int, int> mp, etc.
  const containerRegex = /\b(?:vector|map|unordered_map|set|unordered_set|stack|queue|priority_queue|list|deque|pair)\s*<[^>]+>\s+([a-zA-Z_]\w*)\b/g;
  while ((match = containerRegex.exec(code)) !== null) {
    if (match[1]) variables.add(match[1]);
  }

  // 3. Pointers: Node* curr, TreeNode* root
  const pointerRegex = /\b([a-zA-Z_]\w*)\s*\*\s*([a-zA-Z_]\w*)\b/g;
  const keywords = ["int", "double", "float", "char", "bool", "void", "return", "const", "class", "struct", "delete", "new", "long"];
  while ((match = pointerRegex.exec(code)) !== null) {
    if (match[2] && !keywords.includes(match[1]) && !keywords.includes(match[2])) {
      variables.add(match[2]);
    }
  }

  // 4. Custom structures / Class instances: MyClass obj;
  const classInstanceRegex = /\b([A-Z][a-zA-Z0-9_]*)\s+([a-zA-Z_]\w*)\b/g;
  while ((match = classInstanceRegex.exec(code)) !== null) {
    if (match[2] && !keywords.includes(match[2])) {
      variables.add(match[2]);
    }
  }

  // 5. Function signatures (except main)
  const funcRegex = /\b(?:int|double|float|char|bool|void|string|auto)\s+([a-zA-Z_]\w*)\s*\(/g;
  while ((match = funcRegex.exec(code)) !== null) {
    if (match[1] && match[1] !== "main") {
      variables.add(match[1]);
    }
  }

  return Array.from(variables);
};

// Parse declared variables in Python
const getDeclaredVariablesPython = (code: string): string[] => {
  const variables: Set<string> = new Set();
  let match;

  // 1. Assignments: var_name = value
  const assignRegex = /^\s*([a-zA-Z_]\w*)\s*=\s*[^=]/gm;
  while ((match = assignRegex.exec(code)) !== null) {
    if (match[1]) variables.add(match[1]);
  }

  // 2. Function definitions: def func_name(
  const funcRegex = /^\s*def\s+([a-zA-Z_]\w*)\s*\(/gm;
  while ((match = funcRegex.exec(code)) !== null) {
    if (match[1]) variables.add(match[1]);
  }

  return Array.from(variables);
};

// Parse declared variables in Java
const getDeclaredVariablesJava = (code: string): string[] => {
  const variables: Set<string> = new Set();
  let match;

  // 1. Basic types
  const basicRegex = /\b(?:int|double|float|char|boolean|String|long|short|byte)\s+([a-zA-Z_]\w*)\b/g;
  while ((match = basicRegex.exec(code)) !== null) {
    if (match[1]) variables.add(match[1]);
  }

  // 2. Classes / Generics
  const genericRegex = /\b(?:List|ArrayList|LinkedList|Map|HashMap|Set|HashSet|Queue|Stack|PriorityQueue|Scanner|[A-Z]\w*)\s*(?:<[^>]+>)?\s+([a-zA-Z_]\w*)\b/g;
  const keywords = ["String", "System", "Math", "Arrays", "Collections", "Class", "Interface", "Object"];
  while ((match = genericRegex.exec(code)) !== null) {
    if (match[1] && !keywords.includes(match[1])) {
      variables.add(match[1]);
    }
  }

  // 3. Methods
  const methodRegex = /\b(?:public|private|protected|static|final|\s+)\s+(?:void|int|double|String|boolean|char)\s+([a-zA-Z_]\w*)\s*\(/g;
  while ((match = methodRegex.exec(code)) !== null) {
    if (match[1] && match[1] !== "main") {
      variables.add(match[1]);
    }
  }

  return Array.from(variables);
};

// C++ STL / C standard library completions
const getCppSuggestions = (monaco: any, range: any, lineContent: string, isC: boolean) => {
  const isStdTrigger = lineContent.endsWith("std::") || lineContent.endsWith("::");

  if (isStdTrigger) {
    if (isC) return [];
    return [
      {
        label: "vector",
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: "vector<${1:int}> ${2:vec};",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::vector<T>",
        documentation: "Dynamic contiguous array container from the STL.",
        range
      },
      {
        label: "string",
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: "string ${1:str};",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::string",
        documentation: "Standard string container for character sequences.",
        range
      },
      {
        label: "cout",
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: "cout << ${1:value} << endl;",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::cout",
        documentation: "Standard output stream.",
        range
      },
      {
        label: "cin",
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: "cin >> ${1:var};",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::cin",
        documentation: "Standard input stream.",
        range
      },
      {
        label: "endl",
        kind: monaco.languages.CompletionItemKind.Constant,
        insertText: "endl",
        detail: "std::endl",
        documentation: "Writes a newline character and flushes the stream buffer.",
        range
      },
      {
        label: "sort",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: "sort(${1:vec}.begin(), ${1:vec}.end());",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::sort(first, last)",
        documentation: "Sorts range [first, last) in O(N log N) ascending order.",
        range
      },
      {
        label: "stable_sort",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: "stable_sort(${1:vec}.begin(), ${1:vec}.end());",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::stable_sort(first, last)",
        documentation: "Sorts range preserving the relative order of equal elements.",
        range
      },
      {
        label: "min",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: "min(${1:a}, ${2:b})",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::min(a, b)",
        documentation: "Returns the smaller of two values.",
        range
      },
      {
        label: "max",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: "max(${1:a}, ${2:b})",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::max(a, b)",
        documentation: "Returns the larger of two values.",
        range
      },
      {
        label: "map",
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: "map<${1:key_t}, ${2:val_t}> ${3:mp};",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::map<Key, T>",
        documentation: "Sorted key-value associative container (balanced red-black tree).",
        range
      },
      {
        label: "unordered_map",
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: "unordered_map<${1:key_t}, ${2:val_t}> ${3:ump};",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::unordered_map<Key, T>",
        documentation: "Unordered hash-based key-value map. Average complexity: O(1).",
        range
      },
      {
        label: "set",
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: "set<${1:int}> ${2:st};",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::set<T>",
        documentation: "Sorted unique elements container (balanced tree).",
        range
      },
      {
        label: "unordered_set",
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: "unordered_set<${1:int}> ${2:ust};",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::unordered_set<T>",
        documentation: "Unordered hash-based unique elements set. Average O(1).",
        range
      },
      {
        label: "pair",
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: "pair<${1:int}, ${2:int}> ${3:p};",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::pair<T1, T2>",
        documentation: "Simple container coupling two values.",
        range
      },
      {
        label: "make_pair",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: "make_pair(${1:a}, ${2:b})",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::make_pair(a, b)",
        documentation: "Creates a std::pair object with type deduction.",
        range
      },
      {
        label: "queue",
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: "queue<${1:int}> ${2:q};",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::queue<T>",
        documentation: "FIFO (First-in, First-out) queue container adapter.",
        range
      },
      {
        label: "stack",
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: "stack<${1:int}> ${2:s};",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::stack<T>",
        documentation: "LIFO (Last-in, First-out) stack container adapter.",
        range
      },
      {
        label: "priority_queue",
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: "priority_queue<${1:int}> ${2:pq};",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::priority_queue<T>",
        documentation: "Max-heap container adapter. Priority order retrieval.",
        range
      },
      {
        label: "binary_search",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: "binary_search(${1:vec}.begin(), ${1:vec}.end(), ${2:val})",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "bool std::binary_search(first, last, val)",
        documentation: "Checks if element exists in sorted range. O(log N).",
        range
      },
      {
        label: "lower_bound",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: "lower_bound(${1:vec}.begin(), ${1:vec}.end(), ${2:val})",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::lower_bound(first, last, val)",
        documentation: "Returns iterator to first element >= val in sorted range. O(log N).",
        range
      },
      {
        label: "upper_bound",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: "upper_bound(${1:vec}.begin(), ${1:vec}.end(), ${2:val})",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "std::upper_bound(first, last, val)",
        documentation: "Returns iterator to first element > val in sorted range. O(log N).",
        range
      },
      {
        label: "next_permutation",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: "next_permutation(${1:vec}.begin(), ${1:vec}.end())",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "bool std::next_permutation(first, last)",
        documentation: "Transforms range into lexicographically next permutation.",
        range
      },
      {
        label: "accumulate",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: "accumulate(${1:vec}.begin(), ${1:vec}.end(), ${2:0})",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "T std::accumulate(first, last, init)",
        documentation: "Computes sum of range plus an initial value.",
        range
      },
    ];
  }

  if (lineContent.endsWith(".")) {
    return [
      {
        label: "size",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "size()",
        detail: "size_type size() const",
        documentation: "Returns the number of elements in the container.",
        range
      },
      {
        label: "empty",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "empty()",
        detail: "bool empty() const",
        documentation: "Checks if the container is empty.",
        range
      },
      {
        label: "push_back",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "push_back(${1:value})",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "void push_back(const T& value)",
        documentation: "Appends elements to the end of container.",
        range
      },
      {
        label: "pop_back",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "pop_back()",
        detail: "void pop_back()",
        documentation: "Removes the last element.",
        range
      },
      {
        label: "clear",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "clear()",
        detail: "void clear()",
        documentation: "Removes all elements.",
        range
      },
      {
        label: "begin",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "begin()",
        detail: "iterator begin()",
        documentation: "Returns iterator to the start.",
        range
      },
      {
        label: "end",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "end()",
        detail: "iterator end()",
        documentation: "Returns iterator to the end.",
        range
      },
      {
        label: "insert",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "insert(${1:pos}, ${2:val})",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "iterator insert(pos, val)",
        documentation: "Inserts elements at specified position.",
        range
      },
      {
        label: "erase",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "erase(${1:pos})",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "iterator erase(pos)",
        documentation: "Erases elements at specified positions.",
        range
      },
      {
        label: "front",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "front()",
        detail: "T& front()",
        documentation: "Accesses the first element.",
        range
      },
      {
        label: "back",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "back()",
        detail: "T& back()",
        documentation: "Accesses the last element.",
        range
      },
      {
        label: "push",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "push(${1:value})",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "void push(value)",
        documentation: "Pushes element into stack/queue adapter.",
        range
      },
      {
        label: "pop",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "pop()",
        detail: "void pop()",
        documentation: "Pops element from stack/queue adapter.",
        range
      },
      {
        label: "top",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "top()",
        detail: "T& top()",
        documentation: "Accesses the top element of a stack/priority_queue.",
        range
      },
      {
        label: "substr",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "substr(${1:pos}, ${2:len})",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "string substr(pos, len) const",
        documentation: "Returns a substring of a standard string.",
        range
      },
      {
        label: "find",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "find(${1:val})",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "size_type find(val) const",
        documentation: "Finds element or substring.",
        range
      },
    ];
  }

  const keywords = [
    { label: "int", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "int ", range },
    { label: "double", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "double ", range },
    { label: "float", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "float ", range },
    { label: "char", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "char ", range },
    { label: "bool", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "bool ", range },
    { label: "void", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "void ", range },
    { label: "long long", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "long long ", range },
    { label: "const", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "const ", range },
    { label: "struct", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "struct ${1:Name} {\n\t$0\n};", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "class", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "class ${1:Name} {\npublic:\n\t$0\n};", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "public", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "public:\n", range },
    { label: "private", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "private:\n", range },
    { label: "return", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "return $0;", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "nullptr", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "nullptr", range },
    { label: "auto", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "auto ", range },
    { label: "sizeof", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "sizeof($1)", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "using namespace std", kind: monaco.languages.CompletionItemKind.Snippet, insertText: "using namespace std;\n", range },
  ];

  const controlFlow = [
    {
      label: "if",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "if (${1:condition}) {\n\t$0\n}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "if statement",
      range,
    },
    {
      label: "for",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n\t$0\n}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "for loop",
      range,
    },
    {
      label: "while",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "while (${1:condition}) {\n\t$0\n}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "while loop",
      range,
    },
    {
      label: "switch",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "switch (${1:expression}) {\n\tcase ${2:value}:\n\t\t$0\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "switch statement",
      range,
    },
  ];

  if (isC) {
    return [
      ...keywords,
      ...controlFlow,
      {
        label: "#include <stdio.h>",
        kind: monaco.languages.CompletionItemKind.Module,
        insertText: "#include <stdio.h>\n",
        detail: "stdio.h",
        documentation: "Standard Input and Output Library.",
        range,
      },
      {
        label: "#include <stdlib.h>",
        kind: monaco.languages.CompletionItemKind.Module,
        insertText: "#include <stdlib.h>\n",
        detail: "stdlib.h",
        documentation: "Standard Utility Library.",
        range,
      },
      {
        label: "#include <string.h>",
        kind: monaco.languages.CompletionItemKind.Module,
        insertText: "#include <string.h>\n",
        detail: "string.h",
        documentation: "C String utilities library.",
        range,
      },
      {
        label: "#include <math.h>",
        kind: monaco.languages.CompletionItemKind.Module,
        insertText: "#include <math.h>\n",
        detail: "math.h",
        documentation: "C Mathematical Functions library.",
        range,
      },
      {
        label: "printf",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'printf("${1:%d}\\n", ${2:var});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'printf(format, ...)',
        range,
      },
      {
        label: "scanf",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'scanf("${1:%d}", &${2:var});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'scanf(format, ...)',
        range,
      },
    ];
  }

  return [
    ...keywords,
    ...controlFlow,
    {
      label: "#include <iostream>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <iostream>\n",
      detail: "iostream",
      documentation: "Standard streams library.",
      range,
    },
    {
      label: "#include <vector>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <vector>\n",
      detail: "vector",
      documentation: "STL dynamic array vector library.",
      range,
    },
    {
      label: "#include <string>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <string>\n",
      detail: "string",
      documentation: "STL String class library.",
      range,
    },
    {
      label: "#include <algorithm>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <algorithm>\n",
      detail: "algorithm",
      documentation: "STL algorithms library (sort, search, min, max, bounds).",
      range,
    },
    {
      label: "#include <map>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <map>\n",
      detail: "map",
      documentation: "STL map & multimap containers.",
      range,
    },
    {
      label: "#include <unordered_map>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <unordered_map>\n",
      detail: "unordered_map",
      documentation: "STL hashed unordered_map container.",
      range,
    },
    {
      label: "#include <set>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <set>\n",
      detail: "set",
      documentation: "STL set & multiset containers.",
      range,
    },
    {
      label: "#include <unordered_set>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <unordered_set>\n",
      detail: "unordered_set",
      documentation: "STL hashed unordered_set container.",
      range,
    },
    {
      label: "#include <cmath>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <cmath>\n",
      detail: "cmath",
      documentation: "C++ mathematical functions.",
      range,
    },
    {
      label: "std::cout",
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: "std::cout << ${1:value} << std::endl;",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "std::cout",
      range,
    },
    {
      label: "std::cin",
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: "std::cin >> ${1:var};",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "std::cin",
      range,
    },
    {
      label: "std::vector",
      kind: monaco.languages.CompletionItemKind.Class,
      insertText: "std::vector<${1:int}> ${2:vec};",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "std::vector<T>",
      range,
    },
    {
      label: "std::string",
      kind: monaco.languages.CompletionItemKind.Class,
      insertText: "std::string ${1:str};",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "std::string",
      range,
    },
    {
      label: "std::sort",
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: "std::sort(${1:vec}.begin(), ${1:vec}.end());",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "std::sort(first, last)",
      range,
    },
  ];
};

// Python Autocompletions
const getPythonSuggestions = (monaco: any, range: any, lineContent: string) => {
  if (lineContent.endsWith("math.")) {
    return [
      { label: "sqrt", kind: monaco.languages.CompletionItemKind.Function, insertText: "sqrt(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "math.sqrt(x) -> float", range },
      { label: "pow", kind: monaco.languages.CompletionItemKind.Function, insertText: "pow(${1:x}, ${2:y})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "math.pow(x, y) -> float", range },
      { label: "ceil", kind: monaco.languages.CompletionItemKind.Function, insertText: "ceil(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "math.ceil(x) -> int", range },
      { label: "floor", kind: monaco.languages.CompletionItemKind.Function, insertText: "floor(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "math.floor(x) -> int", range },
      { label: "gcd", kind: monaco.languages.CompletionItemKind.Function, insertText: "gcd(${1:a}, ${2:b})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "math.gcd(a, b) -> int", range },
      { label: "log", kind: monaco.languages.CompletionItemKind.Function, insertText: "log(${1:x}[, ${2:base}])", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "math.log(x[, base])", range },
      { label: "log2", kind: monaco.languages.CompletionItemKind.Function, insertText: "log2(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "math.log2(x) -> float", range },
      { label: "log10", kind: monaco.languages.CompletionItemKind.Function, insertText: "log10(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "math.log10(x) -> float", range },
      { label: "factorial", kind: monaco.languages.CompletionItemKind.Function, insertText: "factorial(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "math.factorial(x) -> int", range },
      { label: "pi", kind: monaco.languages.CompletionItemKind.Constant, insertText: "pi", detail: "3.141592653589793", range },
      { label: "e", kind: monaco.languages.CompletionItemKind.Constant, insertText: "e", detail: "2.718281828459045", range },
      { label: "inf", kind: monaco.languages.CompletionItemKind.Constant, insertText: "inf", detail: "Positive infinity", range },
    ];
  }

  if (lineContent.endsWith("collections.")) {
    return [
      { label: "defaultdict", kind: monaco.languages.CompletionItemKind.Class, insertText: "defaultdict(${1:type})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "collections.defaultdict(default_factory)", range },
      { label: "Counter", kind: monaco.languages.CompletionItemKind.Class, insertText: "Counter(${1:iterable})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "collections.Counter(iterable_or_mapping)", range },
      { label: "deque", kind: monaco.languages.CompletionItemKind.Class, insertText: "deque(${1:iterable})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "collections.deque(iterable, maxlen)", range },
      { label: "namedtuple", kind: monaco.languages.CompletionItemKind.Class, insertText: "namedtuple('${1:Name}', [${2:fields}])", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "collections.namedtuple(typename, field_names)", range },
    ];
  }

  if (lineContent.endsWith("heapq.")) {
    return [
      { label: "heappush", kind: monaco.languages.CompletionItemKind.Function, insertText: "heappush(${1:heap}, ${2:item})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "heapq.heappush(heap, item)", range },
      { label: "heappop", kind: monaco.languages.CompletionItemKind.Function, insertText: "heappop(${1:heap})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "heapq.heappop(heap)", range },
      { label: "heapify", kind: monaco.languages.CompletionItemKind.Function, insertText: "heapify(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "heapq.heapify(x)", range },
      { label: "heappushpop", kind: monaco.languages.CompletionItemKind.Function, insertText: "heappushpop(${1:heap}, ${2:item})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "heapq.heappushpop(heap, item)", range },
      { label: "nlargest", kind: monaco.languages.CompletionItemKind.Function, insertText: "nlargest(${1:n}, ${2:iterable})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "heapq.nlargest(n, iterable)", range },
      { label: "nsmallest", kind: monaco.languages.CompletionItemKind.Function, insertText: "nsmallest(${1:n}, ${2:iterable})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "heapq.nsmallest(n, iterable)", range },
    ];
  }

  if (lineContent.endsWith("bisect.")) {
    return [
      { label: "bisect_left", kind: monaco.languages.CompletionItemKind.Function, insertText: "bisect_left(${1:a}, ${2:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "bisect.bisect_left(a, x)", range },
      { label: "bisect_right", kind: monaco.languages.CompletionItemKind.Function, insertText: "bisect_right(${1:a}, ${2:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "bisect.bisect_right(a, x)", range },
      { label: "insort_left", kind: monaco.languages.CompletionItemKind.Function, insertText: "insort_left(${1:a}, ${2:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "bisect.insort_left(a, x)", range },
      { label: "insort_right", kind: monaco.languages.CompletionItemKind.Function, insertText: "insort_right(${1:a}, ${2:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "bisect.insort_right(a, x)", range },
    ];
  }

  if (lineContent.endsWith("itertools.")) {
    return [
      { label: "permutations", kind: monaco.languages.CompletionItemKind.Function, insertText: "permutations(${1:iterable})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "itertools.permutations(iterable[, r])", range },
      { label: "combinations", kind: monaco.languages.CompletionItemKind.Function, insertText: "combinations(${1:iterable}, ${2:r})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "itertools.combinations(iterable, r)", range },
      { label: "accumulate", kind: monaco.languages.CompletionItemKind.Function, insertText: "accumulate(${1:iterable})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "itertools.accumulate(iterable[, func])", range },
      { label: "chain", kind: monaco.languages.CompletionItemKind.Function, insertText: "chain(${1:iterables})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "itertools.chain(*iterables)", range },
      { label: "cycle", kind: monaco.languages.CompletionItemKind.Function, insertText: "cycle(${1:iterable})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "itertools.cycle(iterable)", range },
    ];
  }

  if (lineContent.endsWith(".")) {
    return [
      { label: "append", kind: monaco.languages.CompletionItemKind.Method, insertText: "append(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "list.append(x)", range },
      { label: "extend", kind: monaco.languages.CompletionItemKind.Method, insertText: "extend(${1:iterable})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "list.extend(iterable)", range },
      { label: "insert", kind: monaco.languages.CompletionItemKind.Method, insertText: "insert(${1:i}, ${2:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "list.insert(i, x)", range },
      { label: "remove", kind: monaco.languages.CompletionItemKind.Method, insertText: "remove(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "list/set.remove(x)", range },
      { label: "pop", kind: monaco.languages.CompletionItemKind.Method, insertText: "pop(${1:index})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "list/dict/set.pop()", range },
      { label: "clear", kind: monaco.languages.CompletionItemKind.Method, insertText: "clear()", detail: "list/dict/set.clear()", range },
      { label: "index", kind: monaco.languages.CompletionItemKind.Method, insertText: "index(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "list.index(x)", range },
      { label: "count", kind: monaco.languages.CompletionItemKind.Method, insertText: "count(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "list.count(x)", range },
      { label: "sort", kind: monaco.languages.CompletionItemKind.Method, insertText: "sort()", detail: "list.sort(key=None, reverse=False)", range },
      { label: "reverse", kind: monaco.languages.CompletionItemKind.Method, insertText: "reverse()", detail: "list.reverse()", range },
      { label: "get", kind: monaco.languages.CompletionItemKind.Method, insertText: "get(${1:key}[, ${2:default}])", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "dict.get(key[, default])", range },
      { label: "keys", kind: monaco.languages.CompletionItemKind.Method, insertText: "keys()", detail: "dict.keys()", range },
      { label: "values", kind: monaco.languages.CompletionItemKind.Method, insertText: "values()", detail: "dict.values()", range },
      { label: "items", kind: monaco.languages.CompletionItemKind.Method, insertText: "items()", detail: "dict.items()", range },
      { label: "add", kind: monaco.languages.CompletionItemKind.Method, insertText: "add(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "set.add(x)", range },
      { label: "update", kind: monaco.languages.CompletionItemKind.Method, insertText: "update(${1:other})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "dict/set.update(other)", range },
      { label: "join", kind: monaco.languages.CompletionItemKind.Method, insertText: "join(${1:iterable})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "str.join(iterable)", range },
      { label: "split", kind: monaco.languages.CompletionItemKind.Method, insertText: "split(${1:sep})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "str.split(sep=None, maxsplit=-1)", range },
      { label: "strip", kind: monaco.languages.CompletionItemKind.Method, insertText: "strip()", detail: "str.strip()", range },
      { label: "replace", kind: monaco.languages.CompletionItemKind.Method, insertText: "replace(${1:old}, ${2:new})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "str.replace(old, new[, count])", range },
    ];
  }

  return [
    { label: "def", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "def ${1:func_name}(${2:args}):\n\t$0", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "class", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "class ${1:ClassName}:\n\tdef __init__(self):\n\t\t$0", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "print", kind: monaco.languages.CompletionItemKind.Function, insertText: "print(${1:value})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "len", kind: monaco.languages.CompletionItemKind.Function, insertText: "len(${1:item})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "range", kind: monaco.languages.CompletionItemKind.Function, insertText: "range(${1:n})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "enumerate", kind: monaco.languages.CompletionItemKind.Function, insertText: "enumerate(${1:iterable})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "zip", kind: monaco.languages.CompletionItemKind.Function, insertText: "zip(${1:iterables})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "sorted", kind: monaco.languages.CompletionItemKind.Function, insertText: "sorted(${1:iterable})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "isinstance", kind: monaco.languages.CompletionItemKind.Function, insertText: "isinstance(${1:obj}, ${2:class_or_tuple})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "list", kind: monaco.languages.CompletionItemKind.Class, insertText: "list()", range },
    { label: "dict", kind: monaco.languages.CompletionItemKind.Class, insertText: "dict()", range },
    { label: "set", kind: monaco.languages.CompletionItemKind.Class, insertText: "set()", range },
    { label: "tuple", kind: monaco.languages.CompletionItemKind.Class, insertText: "tuple()", range },
    { label: "import math", kind: monaco.languages.CompletionItemKind.Module, insertText: "import math\n", range },
    { label: "import sys", kind: monaco.languages.CompletionItemKind.Module, insertText: "import sys\n", range },
    { label: "import collections", kind: monaco.languages.CompletionItemKind.Module, insertText: "import collections\n", range },
    { label: "import itertools", kind: monaco.languages.CompletionItemKind.Module, insertText: "import itertools\n", range },
    { label: "import heapq", kind: monaco.languages.CompletionItemKind.Module, insertText: "import heapq\n", range },
    { label: "import bisect", kind: monaco.languages.CompletionItemKind.Module, insertText: "import bisect\n", range },
  ];
};

// Java Autocompletions
const getJavaSuggestions = (monaco: any, range: any, lineContent: string) => {
  if (lineContent.endsWith("System.out.")) {
    return [
      { label: "println", kind: monaco.languages.CompletionItemKind.Method, insertText: "println(${1:value});", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "void println(String x)", range },
      { label: "print", kind: monaco.languages.CompletionItemKind.Method, insertText: "print(${1:value});", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "void print(String x)", range },
    ];
  }

  if (lineContent.endsWith("System.")) {
    return [
      { label: "out", kind: monaco.languages.CompletionItemKind.Field, insertText: "out.", detail: "PrintStream System.out", range },
      { label: "err", kind: monaco.languages.CompletionItemKind.Field, insertText: "err.", detail: "PrintStream System.err", range },
      { label: "currentTimeMillis", kind: monaco.languages.CompletionItemKind.Method, insertText: "currentTimeMillis()", detail: "long System.currentTimeMillis()", range },
      { label: "nanoTime", kind: monaco.languages.CompletionItemKind.Method, insertText: "nanoTime()", detail: "long System.nanoTime()", range },
    ];
  }

  if (lineContent.endsWith("Math.")) {
    return [
      { label: "abs", kind: monaco.languages.CompletionItemKind.Method, insertText: "abs(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "Math.abs(x)", range },
      { label: "max", kind: monaco.languages.CompletionItemKind.Method, insertText: "max(${1:a}, ${2:b})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "Math.max(a, b)", range },
      { label: "min", kind: monaco.languages.CompletionItemKind.Method, insertText: "min(${1:a}, ${2:b})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "Math.min(a, b)", range },
      { label: "pow", kind: monaco.languages.CompletionItemKind.Method, insertText: "pow(${1:x}, ${2:y})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "Math.pow(x, y)", range },
      { label: "sqrt", kind: monaco.languages.CompletionItemKind.Method, insertText: "sqrt(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "Math.sqrt(x)", range },
      { label: "ceil", kind: monaco.languages.CompletionItemKind.Method, insertText: "ceil(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "Math.ceil(x)", range },
      { label: "floor", kind: monaco.languages.CompletionItemKind.Method, insertText: "floor(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "Math.floor(x)", range },
      { label: "round", kind: monaco.languages.CompletionItemKind.Method, insertText: "round(${1:x})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "Math.round(x)", range },
      { label: "PI", kind: monaco.languages.CompletionItemKind.Constant, insertText: "PI", detail: "double Math.PI", range },
    ];
  }

  if (lineContent.endsWith("Arrays.")) {
    return [
      { label: "sort", kind: monaco.languages.CompletionItemKind.Method, insertText: "sort(${1:array});", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "void Arrays.sort(T[] a)", range },
      { label: "binarySearch", kind: monaco.languages.CompletionItemKind.Method, insertText: "binarySearch(${1:array}, ${2:key})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "int Arrays.binarySearch(T[] a, T key)", range },
      { label: "toString", kind: monaco.languages.CompletionItemKind.Method, insertText: "toString(${1:array})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "String Arrays.toString(T[] a)", range },
      { label: "fill", kind: monaco.languages.CompletionItemKind.Method, insertText: "fill(${1:array}, ${2:value});", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "void Arrays.fill(T[] a, T val)", range },
      { label: "copyOf", kind: monaco.languages.CompletionItemKind.Method, insertText: "copyOf(${1:array}, ${2:newLength})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "T[] Arrays.copyOf(T[] original, int newLength)", range },
    ];
  }

  if (lineContent.endsWith("Collections.")) {
    return [
      { label: "sort", kind: monaco.languages.CompletionItemKind.Method, insertText: "sort(${1:list});", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "void Collections.sort(List<T> list)", range },
      { label: "reverse", kind: monaco.languages.CompletionItemKind.Method, insertText: "reverse(${1:list});", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "void Collections.reverse(List<?> list)", range },
      { label: "shuffle", kind: monaco.languages.CompletionItemKind.Method, insertText: "shuffle(${1:list});", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "void Collections.shuffle(List<?> list)", range },
      { label: "max", kind: monaco.languages.CompletionItemKind.Method, insertText: "max(${1:coll})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "T Collections.max(Collection<? extends T> coll)", range },
      { label: "min", kind: monaco.languages.CompletionItemKind.Method, insertText: "min(${1:coll})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "T Collections.min(Collection<? extends T> coll)", range },
    ];
  }

  if (lineContent.endsWith(".")) {
    return [
      { label: "length", kind: monaco.languages.CompletionItemKind.Method, insertText: "length()", detail: "int String.length()", range },
      { label: "charAt", kind: monaco.languages.CompletionItemKind.Method, insertText: "charAt(${1:index})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "char String.charAt(int index)", range },
      { label: "substring", kind: monaco.languages.CompletionItemKind.Method, insertText: "substring(${1:beginIndex}[, ${2:endIndex}])", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "String String.substring(int beginIndex)", range },
      { label: "contains", kind: monaco.languages.CompletionItemKind.Method, insertText: "contains(${1:s})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "boolean String/Collection.contains(Object o)", range },
      { label: "equals", kind: monaco.languages.CompletionItemKind.Method, insertText: "equals(${1:obj})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "boolean Object.equals(Object obj)", range },
      { label: "toLowerCase", kind: monaco.languages.CompletionItemKind.Method, insertText: "toLowerCase()", detail: "String String.toLowerCase()", range },
      { label: "toUpperCase", kind: monaco.languages.CompletionItemKind.Method, insertText: "toUpperCase()", detail: "String String.toUpperCase()", range },
      { label: "split", kind: monaco.languages.CompletionItemKind.Method, insertText: "split(${1:regex})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "String[] String.split(String regex)", range },
      { label: "add", kind: monaco.languages.CompletionItemKind.Method, insertText: "add(${1:element})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "boolean Collection.add(E e)", range },
      { label: "get", kind: monaco.languages.CompletionItemKind.Method, insertText: "get(${1:keyOrIndex})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "E List/Map.get(Object keyOrIndex)", range },
      { label: "put", kind: monaco.languages.CompletionItemKind.Method, insertText: "put(${1:key}, ${2:value})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "V Map.put(K key, V value)", range },
      { label: "remove", kind: monaco.languages.CompletionItemKind.Method, insertText: "remove(${1:indexOrObject})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "boolean Collection.remove(Object o)", range },
      { label: "size", kind: monaco.languages.CompletionItemKind.Method, insertText: "size()", detail: "int Collection/Map.size()", range },
      { label: "isEmpty", kind: monaco.languages.CompletionItemKind.Method, insertText: "isEmpty()", detail: "boolean Collection/Map.isEmpty()", range },
      { label: "containsKey", kind: monaco.languages.CompletionItemKind.Method, insertText: "containsKey(${1:key})", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "boolean Map.containsKey(Object key)", range },
    ];
  }

  return [
    { label: "public", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "public ", range },
    { label: "private", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "private ", range },
    { label: "protected", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "protected ", range },
    { label: "class", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "class ${1:ClassName} {\n\t$0\n}", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "interface", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "interface ${1:InterfaceName} {\n\t$0\n}", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "extends", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "extends ", range },
    { label: "implements", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "implements ", range },
    { label: "static", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "static ", range },
    { label: "final", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "final ", range },
    { label: "void", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "void ", range },
    { label: "int", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "int ", range },
    { label: "double", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "double ", range },
    { label: "boolean", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "boolean ", range },
    { label: "char", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "char ", range },
    { label: "new", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "new ", range },
    { label: "return", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "return $0;", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "System.out.println", kind: monaco.languages.CompletionItemKind.Method, insertText: "System.out.println(${1:value});", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "public static void main", kind: monaco.languages.CompletionItemKind.Snippet, insertText: "public static void main(String[] args) {\n\t$0\n}", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "import java.util.Scanner", kind: monaco.languages.CompletionItemKind.Module, insertText: "import java.util.Scanner;\n", range },
    { label: "import java.util.ArrayList", kind: monaco.languages.CompletionItemKind.Module, insertText: "import java.util.ArrayList;\n", range },
    { label: "import java.util.HashMap", kind: monaco.languages.CompletionItemKind.Module, insertText: "import java.util.HashMap;\n", range },
    { label: "import java.util.Arrays", kind: monaco.languages.CompletionItemKind.Module, insertText: "import java.util.Arrays;\n", range },
    { label: "import java.util.Collections", kind: monaco.languages.CompletionItemKind.Module, insertText: "import java.util.Collections;\n", range },
    { label: "Scanner.new", kind: monaco.languages.CompletionItemKind.Snippet, insertText: "Scanner scanner = new Scanner(System.in);", range },
    { label: "ArrayList.new", kind: monaco.languages.CompletionItemKind.Snippet, insertText: "ArrayList<${1:Integer}> ${2:list} = new ArrayList<>();", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
    { label: "HashMap.new", kind: monaco.languages.CompletionItemKind.Snippet, insertText: "HashMap<${1:String}, ${2:Integer}> ${3:map} = new HashMap<>();", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
  ];
};
