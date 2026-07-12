export const registerAutocompletes = (monaco: any) => {
  const languages = ["c", "cpp", "python", "java"];

  const disposables = languages.map((lang) => {
    return monaco.languages.registerCompletionItemProvider(lang, {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        let suggestions: any[] = [];

        if (lang === "cpp" || lang === "c") {
          suggestions = getCppSuggestions(monaco, range, lang === "c");
        } else if (lang === "python") {
          suggestions = getPythonSuggestions(monaco, range);
        } else if (lang === "java") {
          suggestions = getJavaSuggestions(monaco, range);
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

const getCppSuggestions = (monaco: any, range: any, isC: boolean) => {
  const common = [
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
  ];

  if (isC) {
    return [
      ...common,
      {
        label: "#include <stdio.h>",
        kind: monaco.languages.CompletionItemKind.Module,
        insertText: "#include <stdio.h>\n",
        detail: "Standard Input and Output Library",
        range,
      },
      {
        label: "#include <stdlib.h>",
        kind: monaco.languages.CompletionItemKind.Module,
        insertText: "#include <stdlib.h>\n",
        detail: "Standard Utility Library",
        range,
      },
      {
        label: "#include <string.h>",
        kind: monaco.languages.CompletionItemKind.Module,
        insertText: "#include <string.h>\n",
        detail: "C String Library",
        range,
      },
      {
        label: "#include <math.h>",
        kind: monaco.languages.CompletionItemKind.Module,
        insertText: "#include <math.h>\n",
        detail: "C Math Library",
        range,
      },
      {
        label: "printf",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'printf("${1:%d}\\n", ${2:var});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'printf(const char *format, ...)',
        range,
      },
      {
        label: "scanf",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'scanf("${1:%d}", &${2:var});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'scanf(const char *format, ...)',
        range,
      },
    ];
  }

  return [
    ...common,
    {
      label: "#include <iostream>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <iostream>\n",
      detail: "Standard Input/Output Streams Library",
      range,
    },
    {
      label: "#include <vector>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <vector>\n",
      detail: "Standard Vector Sequence Container",
      range,
    },
    {
      label: "#include <string>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <string>\n",
      detail: "Standard String Class",
      range,
    },
    {
      label: "#include <algorithm>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <algorithm>\n",
      detail: "Standard Algorithms Library",
      range,
    },
    {
      label: "#include <map>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <map>\n",
      detail: "Ordered Key-Value Map Container",
      range,
    },
    {
      label: "#include <unordered_map>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <unordered_map>\n",
      detail: "Hash Map Container",
      range,
    },
    {
      label: "#include <set>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <set>\n",
      detail: "Ordered Set Container",
      range,
    },
    {
      label: "#include <unordered_set>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <unordered_set>\n",
      detail: "Hash Set Container",
      range,
    },
    {
      label: "#include <queue>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <queue>\n",
      detail: "Queue and Priority Queue Headers",
      range,
    },
    {
      label: "#include <stack>",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "#include <stack>\n",
      detail: "Stack Container Adapter",
      range,
    },
    {
      label: "std::cout",
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: "std::cout << ${1:value} << std::endl;",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "std::ostream std::cout",
      range,
    },
    {
      label: "std::cin",
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: "std::cin >> ${1:var};",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "std::istream std::cin",
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
      detail: "void std::sort(RandomIt first, RandomIt last)",
      range,
    },
    {
      label: "std::min",
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: "std::min(${1:a}, ${2:b})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "const T& std::min(const T& a, const T& b)",
      range,
    },
    {
      label: "std::max",
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: "std::max(${1:a}, ${2:b})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "const T& std::max(const T& a, const T& b)",
      range,
    },
    {
      label: "std::map",
      kind: monaco.languages.CompletionItemKind.Class,
      insertText: "std::map<${1:key_t}, ${2:val_t}> ${3:mp};",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "std::map<Key, T>",
      range,
    },
    {
      label: "std::unordered_map",
      kind: monaco.languages.CompletionItemKind.Class,
      insertText: "std::unordered_map<${1:key_t}, ${2:val_t}> ${3:ump};",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "std::unordered_map<Key, T>",
      range,
    },
  ];
};

const getPythonSuggestions = (monaco: any, range: any) => {
  return [
    {
      label: "def",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "def ${1:func_name}(${2:args}):\n\t$0",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "define function",
      range,
    },
    {
      label: "class",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "class ${1:ClassName}:\n\tdef __init__(self):\n\t\t$0",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "class definition",
      range,
    },
    {
      label: "print",
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: "print(${1:value})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "print(value, ..., sep=' ', end='\\n')",
      range,
    },
    {
      label: "import math",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "import math\n",
      detail: "Mathematical Functions",
      range,
    },
    {
      label: "import sys",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "import sys\n",
      detail: "System Parameters and Functions",
      range,
    },
    {
      label: "import collections",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "import collections\n",
      detail: "Container Datatypes",
      range,
    },
    {
      label: "import itertools",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "import itertools\n",
      detail: "Functions creating iterators for efficient looping",
      range,
    },
    {
      label: "import heapq",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "import heapq\n",
      detail: "Heap Queue Algorithm (Binary Heap)",
      range,
    },
    {
      label: "import bisect",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "import bisect\n",
      detail: "Array Bisection Algorithm (Binary Search)",
      range,
    },
    {
      label: "math.sqrt",
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: "math.sqrt(${1:n})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "math.sqrt(x) -> float",
      range,
    },
    {
      label: "math.pow",
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: "math.pow(${1:x}, ${2:y})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "math.pow(x, y) -> float",
      range,
    },
    {
      label: "collections.defaultdict",
      kind: monaco.languages.CompletionItemKind.Class,
      insertText: "collections.defaultdict(${1:list})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "defaultdict(default_factory[, ...])",
      range,
    },
    {
      label: "collections.Counter",
      kind: monaco.languages.CompletionItemKind.Class,
      insertText: "collections.Counter(${1:iterable})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "Counter(iterable_or_mapping)",
      range,
    },
    {
      label: "collections.deque",
      kind: monaco.languages.CompletionItemKind.Class,
      insertText: "collections.deque()",
      detail: "deque([iterable[, maxlen]])",
      range,
    },
  ];
};

const getJavaSuggestions = (monaco: any, range: any) => {
  return [
    {
      label: "System.out.println",
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: "System.out.println(${1:value});",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "void System.out.println(String x)",
      range,
    },
    {
      label: "public static void main",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "public static void main(String[] args) {\n\t$0\n}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "main method snippet",
      range,
    },
    {
      label: "import java.util.Scanner",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "import java.util.Scanner;\n",
      detail: "java.util.Scanner",
      range,
    },
    {
      label: "import java.util.ArrayList",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "import java.util.ArrayList;\n",
      detail: "java.util.ArrayList",
      range,
    },
    {
      label: "import java.util.HashMap",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "import java.util.HashMap;\n",
      detail: "java.util.HashMap",
      range,
    },
    {
      label: "import java.util.Arrays",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "import java.util.Arrays;\n",
      detail: "java.util.Arrays",
      range,
    },
    {
      label: "import java.util.Collections",
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: "import java.util.Collections;\n",
      detail: "java.util.Collections",
      range,
    },
    {
      label: "Scanner.new",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "Scanner scanner = new Scanner(System.in);",
      detail: "Scanner instantiation",
      range,
    },
    {
      label: "ArrayList.new",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "ArrayList<${1:Integer}> ${2:list} = new ArrayList<>();",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "ArrayList instantiation",
      range,
    },
    {
      label: "HashMap.new",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "HashMap<${1:String}, ${2:Integer}> ${3:map} = new HashMap<>();",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "HashMap instantiation",
      range,
    },
  ];
};
