import { NextResponse } from "next/server";

// Deterministic Big-O heuristic analyzer (no AI).
const DEFAULT_ANALYSIS = {
  timeComplexity: "O(1)",
  spaceComplexity: "O(1)",
  complexityExplanation: "Heuristic-based estimate: no loops detected.",
  meetsComplexityRequirements: null as boolean | null,
  scores: { efficiency: 70, readability: 70, maintainability: 70, security: 70 },
  feedback: "Deterministic heuristic analysis applied (no AI used).",
};

function stripStringsAndComments(src: string) {
  let out = "";
  const len = src.length;
  let i = 0;
  while (i < len) {
    const ch = src[i];
    // skip single-line comments
    if (ch === "/" && src[i + 1] === "/") {
      i += 2;
      while (i < len && src[i] !== "\n") i++;
      continue;
    }
    // skip multi-line comments
    if (ch === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < len && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    // skip strings
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      out += ' ';
      i++;
      while (i < len) {
        if (src[i] === "\\") {
          i += 2;
        } else if (src[i] === quote) {
          i++;
          break;
        } else {
          i++;
        }
      }
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function estimateComplexity(code: string) {
  const cleaned = stripStringsAndComments(code);

  // Detect sorts -> likely O(n log n)
  const hasSort = /\b(sort|\.sort)\s*\(/i.test(cleaned);
  if (hasSort) {
    // space: likely O(n) when using auxiliary arrays, else O(1)
  }

  // Scan for loops and compute max nesting depth using token scanning, ignoring semicolons inside headers.
  let maxNesting = 0;
  let currentLoopDepth = 0;
  type LoopContext =
    | { type: 'loop'; expectsBrace: boolean; bodyStarted: boolean }
    | { type: 'loop-brace' }
    | { type: 'block' };
  const stack: LoopContext[] = [];
  let parenDepth = 0;
  let i = 0;
  const len = cleaned.length;

  const isWordBoundary = (text: string, pos: number) => {
    const ch = text[pos];
    return ch === undefined || /[^\w$]/.test(ch);
  };

  const pushLoop = (expectsBrace: boolean) => {
    stack.push({ type: 'loop', expectsBrace, bodyStarted: false });
    currentLoopDepth += 1;
    if (currentLoopDepth > maxNesting) maxNesting = currentLoopDepth;
  };

  while (i < len) {
    const ch = cleaned[i];
    if (ch === '(') {
      parenDepth++;
      i++;
      continue;
    }
    if (ch === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      i++;
      continue;
    }

    const remaining = cleaned.slice(i);
    const loopMatch = /^(for|while|do|foreach)\b/i.exec(remaining);
    if (loopMatch) {
      const keyword = loopMatch[1].toLowerCase();
      const endIndex = i + keyword.length;
      if (i === 0 || isWordBoundary(cleaned, i - 1)) {
        if (keyword === 'do') {
          let j = endIndex;
          while (j < len && /\s/.test(cleaned[j])) j++;
          const expectsBrace = cleaned[j] === '{';
          if (stack.length > 0) {
            const top = stack[stack.length - 1];
            if (top.type === 'loop' && !top.expectsBrace && !top.bodyStarted) {
              top.bodyStarted = true;
            }
          }
          pushLoop(expectsBrace);
          i = endIndex;
          continue;
        }

        let j = endIndex;
        while (j < len && /\s/.test(cleaned[j])) j++;
        if (cleaned[j] === '(') {
          let depth = 1;
          j++;
          while (j < len && depth > 0) {
            if (cleaned[j] === '(') depth++;
            else if (cleaned[j] === ')') depth--;
            j++;
          }
        }
        while (j < len && /\s/.test(cleaned[j])) j++;
        const expectsBrace = cleaned[j] === '{';
        if (stack.length > 0) {
          const top = stack[stack.length - 1];
          if (top.type === 'loop' && !top.expectsBrace && !top.bodyStarted) {
            top.bodyStarted = true;
          }
        }
        pushLoop(expectsBrace);
        i = endIndex;
        continue;
      }
    }

    const methodLoopMatch = /^\.(forEach|map|reduce)\b/.exec(remaining);
    if (methodLoopMatch) {
      if (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type === 'loop' && !top.expectsBrace && !top.bodyStarted) {
          top.bodyStarted = true;
        }
      }
      pushLoop(true);
      i += methodLoopMatch[0].length;
      continue;
    }

    if (ch === '{') {
      if (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type === 'loop' && top.expectsBrace && !top.bodyStarted) {
          stack[stack.length - 1] = { type: 'loop-brace' };
          i++;
          continue;
        }
      }
      stack.push({ type: 'block' });
      i++;
      continue;
    }

    if (ch === '}') {
      if (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type === 'block') {
          stack.pop();
          i++;
          continue;
        }
        if (top.type === 'loop-brace') {
          stack.pop();
          currentLoopDepth = Math.max(0, currentLoopDepth - 1);
          i++;
          continue;
        }
      }
      i++;
      continue;
    }

    if (ch === ';' && parenDepth === 0) {
      if (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type === 'loop' && !top.expectsBrace) {
          stack.pop();
          currentLoopDepth = Math.max(0, currentLoopDepth - 1);
          while (stack.length > 0) {
            const next = stack[stack.length - 1];
            if (next.type === 'loop' && !next.expectsBrace && next.bodyStarted) {
              stack.pop();
              currentLoopDepth = Math.max(0, currentLoopDepth - 1);
              continue;
            }
            break;
          }
        }
      }
    }

    i++;
  }

  // Simple recursion detection for languages with function declarations (best-effort)
  let isRecursive = false;
  try {
    const funcMatch = cleaned.match(/function\s+(\w+)\s*\(|(\w+)\s*=\s*function\s*\(/);
    if (funcMatch && funcMatch[1]) {
      const name = funcMatch[1];
      const callRegex = new RegExp(`\\b${name}\\s*\\(`, "g");
      const calls = (cleaned.match(callRegex) || []).length;
      if (calls > 1) isRecursive = true;
    }
  } catch (e) {
    isRecursive = false;
  }

  // Heuristic for time complexity
  let time = "O(1)";
  if (isRecursive && maxNesting >= 1) {
    time = "O(n^2)";
  } else if (isRecursive) {
    time = "O(n)";
  } else if (maxNesting >= 3) time = `O(n^${maxNesting})`;
  else if (maxNesting === 2) time = "O(n^2)";
  else if (maxNesting === 1) time = "O(n)";
  else if (hasSort) time = "O(n log n)";

  // Heuristic space complexity detection
  const hasArrayAlloc = /\bnew\s+Array\b|\[\s*\]|\.push\s*\(|\bconcat\s*\(|\bslice\s*\(|\bvector\s*<|\bstd::vector\s*<|\bdeque\s*<|\bstd::deque\s*<|\bstd::array\s*<|\bnew\s+[^\s]+\s*\[|\bmalloc\s*\(/i.test(cleaned);
  const space = hasArrayAlloc ? "O(n)" : "O(1)";

  // Explanation
  const explanationParts: string[] = [];
  if (maxNesting > 0) explanationParts.push(`Detected up to ${maxNesting} nested loop${maxNesting > 1 ? "s" : ""}, heuristic assumes linear iteration per loop.`);
  if (hasSort) explanationParts.push("Detected sort operation, which typically implies O(n log n) time.");
  if (isRecursive) explanationParts.push("Detected potential recursion; recursion depth is unknown so estimate is conservative.");
  if (explanationParts.length === 0) explanationParts.push("No loops, sorting, or obvious recursion detected.");

  return {
    timeComplexity: time,
    spaceComplexity: space,
    complexityExplanation: explanationParts.join(" "),
    meetsComplexityRequirements: null,
    scores: { efficiency: 75, readability: 75, maintainability: 75, security: 75 },
    feedback: "Heuristic Big-O estimate generated without external AI.",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { code } = body;
    if (!code || typeof code !== "string") return NextResponse.json({ error: "No code provided" }, { status: 400 });

    const analysis = estimateComplexity(code);
    const merged = { ...DEFAULT_ANALYSIS, ...analysis };
    return NextResponse.json(merged);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to analyze code", details: message }, { status: 500 });
  }
}
