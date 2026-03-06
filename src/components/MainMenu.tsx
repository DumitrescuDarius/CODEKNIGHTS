"use client";

import React from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

const navLinks = [
  { label: "Practice", href: "/practice" },
  { label: "Contests", href: "/contests" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Discuss", href: "/discuss" },
];

const CPP_KEYWORDS = new Set<string>([
  "#include",
  "using",
  "namespace",
  "std",
  "return",
  "for",
  "while",
  "if",
  "else",
  "switch",
  "case",
  "break",
  "continue",
]);

const CPP_TYPES = new Set<string>([
  "int",
  "long",
  "void",
  "auto",
  "bool",
  "true",
  "false",
  "unordered_map",
  "vector",
]);

const isNumberToken = (token: string) => /^\d+$/.test(token);
const isVariableToken = (token: string) => /^[a-zA-Z_]\w*$/.test(token);

const renderCppToken = (token: string, key: string): React.ReactNode => {
  if (!token) return null;

  if (CPP_KEYWORDS.has(token)) {
    return (
      <span key={key} className="tok-keyword">
        {token}
      </span>
    );
  }

  if (CPP_TYPES.has(token)) {
    return (
      <span key={key} className="tok-type">
        {token}
      </span>
    );
  }

  if (isNumberToken(token)) {
    return (
      <span key={key} className="tok-number">
        {token}
      </span>
    );
  }

  if (isVariableToken(token)) {
    return (
      <span key={key} className="tok-variable">
        {token}
      </span>
    );
  }

  return <span key={key}>{token}</span>;
};

const highlightCppLine = (line: string, lineIndex: number): React.ReactNode => {
  const nodes: React.ReactNode[] = [];
  const commentIndex = line.indexOf("//");

  let codePart = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.slice(commentIndex) : "";

  // Simplified string handling: look for "..."
  const stringRegex = /"([^"\\]|\\.)*"/g;
  let lastIndex = 0;
  let stringMatch;
  let nodeIndex = 0;

  while ((stringMatch = stringRegex.exec(codePart)) !== null) {
    // Process everything before the string
    const beforeStr = codePart.slice(lastIndex, stringMatch.index);
    nodes.push(...highlightCodePart(beforeStr, lineIndex, nodeIndex));
    nodeIndex += beforeStr.length;

    // Process the string itself
    nodes.push(
      <span key={`${lineIndex}-s-${stringMatch.index}`} className="tok-string">
        {stringMatch[0]}
      </span>
    );
    lastIndex = stringRegex.lastIndex;
  }

  // Process anything remaining after the last string
  const afterStr = codePart.slice(lastIndex);
  nodes.push(...highlightCodePart(afterStr, lineIndex, nodeIndex));

  if (commentPart) {
    nodes.push(
      <span key={`${lineIndex}-c`} className="tok-comment">
        {commentPart}
      </span>
    );
  }

  return nodes;
};

const highlightCodePart = (
  part: string,
  lineIndex: number,
  startNodeIndex: number
): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const regex = /(\s+|[^\w_]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIndex = startNodeIndex;

  while ((match = regex.exec(part)) !== null) {
    if (match.index > lastIndex) {
      const token = part.slice(lastIndex, match.index);
      nodes.push(renderCppToken(token, `${lineIndex}-t${tokenIndex++}`));
    }

    if (match[0]) {
      nodes.push(<span key={`${lineIndex}-d${tokenIndex++}`}>{match[0]}</span>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < part.length) {
    const token = part.slice(lastIndex);
    nodes.push(renderCppToken(token, `${lineIndex}-t${tokenIndex++}`));
  }

  return nodes;
};

export const MainMenu: React.FC = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = React.useState(false);
  const [code, setCode] = React.useState(
    `#include <bits/stdc++.h>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n, target;
  cin >> n >> target;
  vector<int> a(n);
  for (int i = 0; i < n; i++) cin >> a[i];

  unordered_map<int,int> idx;
  for (int i = 0; i < n; i++) {
    int need = target - a[i];
    if (idx.count(need)) {
      cout << idx[need] << " " << i << "\\n";
      return 0;
    }
    idx[a[i]] = i;
  }
  cout << -1 << "\\n";
}`
  );
  const [activeLine, setActiveLine] = React.useState(0);
  const preRef = React.useRef<HTMLPreElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const selectionRef = React.useRef<{ start: number; end: number } | null>(null);

  const lineCount = React.useMemo(() => code.split("\n").length, [code]);

  React.useLayoutEffect(() => {
    if (selectionRef.current && textareaRef.current) {
      textareaRef.current.selectionStart = selectionRef.current.start;
      textareaRef.current.selectionEnd = selectionRef.current.end;
      selectionRef.current = null;
    }
  }, [code]);

  const handleSelectionChange = (
    e: React.SyntheticEvent<HTMLTextAreaElement | HTMLDivElement>
  ) => {
    const target = e.currentTarget as HTMLTextAreaElement;
    const text = target.value;
    const selectionStart = target.selectionStart;
    const line = text.substring(0, selectionStart).split("\n").length - 1;
    setActiveLine(line);
  };

  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode =
        code.substring(0, start) + "  " + code.substring(end);
      
      selectionRef.current = { start: start + 2, end: start + 2 };
      setCode(newCode);
    }
  };

  return (
    <header className="main-header">
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-left">
            <Link href="/" className="brand">
              <span className="brand-name">EComp</span>
              <span className="brand-beta">beta</span>
            </Link>
          </div>

          <button
            className="nav-toggle"
            aria-label="Toggle navigation"
            onClick={() => setIsOpen((o) => !o)}
          >
            <span />
            <span />
          </button>

          <div className={`nav-right ${isOpen ? "nav-right--open" : ""}`}>
            <ul className="nav-links">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="nav-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="nav-actions">
              {session ? (
                <>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {session.user?.name || session.user?.email}
                  </span>
                  <button className="btn btn-ghost" onClick={() => signOut()}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <button className="btn btn-ghost">Log in</button>
                  </Link>
                  <Link href="/auth/signin">
                    <button className="btn btn-ghost">Sign up</button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="ide" aria-label="Editor">
        <aside className="ide-sidebar" aria-label="Explorer">
          <div className="ide-panel-title">Explorer</div>
          <div className="ide-tree">
            <div className="ide-tree-item ide-tree-item--folder"> problems</div>
            <div className="ide-tree-item ide-tree-item--file">󰌠 two-sum.cpp</div>
            <div className="ide-tree-item ide-tree-item--file">󰌠 dp-knapsack.cpp</div>
            <div className="ide-tree-item ide-tree-item--file">󰌠 graph-dijkstra.cpp</div>
            <div className="ide-tree-item ide-tree-item--folder"> contests</div>
            <div className="ide-tree-item ide-tree-item--file">󰌠 weekly-42.md</div>
          </div>
        </aside>

        <section className="ide-editor" aria-label="Text editor">
          <div className="ide-tabs" role="tablist" aria-label="Files">
            <div className="ide-tab ide-tab--active" role="tab" aria-selected="true">
              󰌠 two-sum.cpp
            </div>
            <div className="ide-tab" role="tab" aria-selected="false">
              󰌠 dp-knapsack.cpp
            </div>
          </div>

          <div className="ide-editor-surface">
            <div className="ide-gutter" aria-hidden="true">
              {Array.from({ length: lineCount }, (_, i) => (
                <div
                  key={i}
                  className={`ide-line-number ${
                    i === activeLine ? "ide-line-number--active" : ""
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            <div className="ide-code-wrapper">
              <pre
                ref={preRef}
                className="ide-code ide-code--highlight"
                aria-hidden="true"
              >
                {code.split("\n").map((line, i) => {
                  const leadingSpaces = line.match(/^ */)?.[0].length || 0;
                  const indentLevels = Math.floor(leadingSpaces / 2);

                  return (
                    <div
                      key={i}
                      className={`ide-line ${
                        i === activeLine ? "ide-line--active" : ""
                      }`}
                    >
                      {indentLevels > 0 && (
                        <div className="ide-indent-guides" aria-hidden="true">
                          {Array.from({ length: indentLevels }).map((_, j) => (
                            <div key={j} className="ide-indent-guide" />
                          ))}
                        </div>
                      )}
                      {highlightCppLine(line, i)}
                      {line === "" ? " " : null}
                    </div>
                  );
                })}
              </pre>
              <textarea
                ref={textareaRef}
                className="ide-code ide-code--input"
                aria-label="Code editor"
                spellCheck={false}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  handleSelectionChange(e);
                }}
                onKeyDown={handleKeyDown}
                onSelect={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                onClick={handleSelectionChange}
                onScroll={syncScroll}
              />
            </div>
          </div>

          <div className="ide-status" aria-label="Status bar">
            <div className="ide-status-left">󰑋 Ready</div>
            <div className="ide-status-right">Ln {activeLine + 1}, Col 5 · C++ · UTF-8</div>
          </div>
        </section>
      </main>
    </header>
  );
};

export default MainMenu;
