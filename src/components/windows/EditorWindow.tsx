"use client";

import React, { useEffect, useMemo } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Terminal as TerminalIcon, X } from "lucide-react";
import { Language } from "../../types";
import { LANG_CONFIG } from "../../constants/languages";
import { TranslationKey } from "../../constants/translations";

interface EditorWindowProps {
  lang: Language;
  setLang: (lang: Language) => void;
  code: string;
  setCode: (val: string) => void;
  fontSize: number;
  fontFamily: string;
  isRunning: boolean;
  runCode: () => void;
  showTerminal: boolean;
  setShowTerminal: (val: boolean) => void;
  terminalHeight: number;
  startTerminalResizing: (e: React.MouseEvent) => void;
  stdin: string;
  setStdin: (val: string) => void;
  terminalOutput: string;
  terminalFontSize: number;
  vimMode: boolean;
  vimStatusBarRef: React.RefObject<HTMLDivElement>;
  editorRef: React.MutableRefObject<any>;
  langSelectorOpen: boolean;
  setLangSelectorOpen: (val: boolean) => void;
  cursorPos: { ln: number; col: number };
  setCursorPos: (pos: { ln: number; col: number }) => void;
  compileErrors: any[];
  t: (key: TranslationKey) => string;
  isResizing: boolean;
}

export const EditorWindow: React.FC<EditorWindowProps> = React.memo(({
  lang, setLang, code, setCode, fontSize, fontFamily, isRunning, runCode,
  showTerminal, setShowTerminal, terminalHeight, startTerminalResizing,
  stdin, setStdin, terminalOutput, terminalFontSize, vimMode,
  vimStatusBarRef, editorRef, langSelectorOpen, setLangSelectorOpen,
  cursorPos, setCursorPos, compileErrors, t, isResizing
}) => {
  const monaco = useMonaco();

  const editorOptions = useMemo(() => ({
    fontSize: fontSize, 
    fontFamily: fontFamily, 
    minimap: { enabled: false }, 
    automaticLayout: true, 
    padding: { top: 0 }, 
    scrollBeyondLastLine: false, 
    roundedSelection: false, 
    fixedOverflowWidgets: false, 
    stickyScroll: { enabled: false },
    cursorSmoothCaretAnimation: "off" as const, 
    smoothScrolling: true, 
    suggest: { 
      showWords: true, 
      preview: true, 
      showIcons: true, 
      snippetsPreventQuickSuggestions: false, 
      insertMode: 'replace' as const, 
      localityBonus: true, 
      shareSuggestSelections: true 
    }, 
    quickSuggestions: { other: true, comments: true, strings: true }, 
    parameterHints: { enabled: true }, 
    formatOnType: true, 
    tabCompletion: "on" as const, 
    autoClosingBrackets: "always" as const, 
    autoClosingQuotes: "always" as const, 
    autoClosingOvertype: "always" as const, 
    autoSurround: "languageDefined" as const, 
    bracketPairColorization: { enabled: true }, 
    wordBasedSuggestions: "allDocuments" as const, 
    wordBasedSuggestionsOnlySameLanguage: false 
  }), [fontSize, fontFamily, isResizing]);

  useEffect(() => {
    if (!isResizing && editorRef.current) {
      setTimeout(() => editorRef.current.layout(), 100);
    }
  }, [isResizing, editorRef]);

  useEffect(() => {
    if (monaco && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const markers = compileErrors.map(err => ({
          startLineNumber: err.line,
          startColumn: err.column,
          endLineNumber: err.line,
          endColumn: err.column + 1,
          message: err.message,
          severity: monaco.MarkerSeverity.Error,
        }));
        monaco.editor.setModelMarkers(model, "owner", markers);
      }
    }
  }, [compileErrors, monaco, editorRef, lang]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative', background: 'var(--bg)' }}>
        <Editor
          height="100%"
          language={lang}
          theme="dynamic-theme"
          value={code}
          onChange={(val) => setCode(val || "")}
          onMount={(editor) => { 
            editorRef.current = editor; 
            editor.onDidChangeCursorPosition((e: any) => {
              setCursorPos({ ln: e.position.lineNumber, col: e.position.column });
            });
            // Force layout calculation
            setTimeout(() => editor.layout(), 50);
          }}
          options={editorOptions}
        />
      </div>
      
      {showTerminal && (
        <div className="terminal-panel" style={{ height: terminalHeight }}>
          <div className="terminal-resizer" onMouseDown={(e) => startTerminalResizing(e)} />
          <div className="terminal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TerminalIcon size={12} />
              Terminal
            </div>
            <button onClick={() => setShowTerminal(false)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={12} /></button>
          </div>
          <div className="terminal-split">
            <div className="terminal-section">
              <div className="terminal-label">Stdin</div>
              <textarea className="terminal-input" style={{ fontSize: `${terminalFontSize}px`, fontFamily: fontFamily }} placeholder="Input..." value={stdin} onChange={(e) => setStdin(e.target.value)} />
            </div>
            <div className="terminal-section">
              <div className="terminal-label">Stdout</div>
              <div className="terminal-output" style={{ fontSize: `${terminalFontSize}px`, fontFamily: fontFamily }}>{terminalOutput}</div>
            </div>
          </div>
        </div>
      )}

      <div className="ide-status">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingRight: '1rem', borderRight: '1px solid var(--line)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ln {cursorPos.ln}, Col {cursorPos.col}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{fontSize}px</span>
          </div>
          {vimMode && <div ref={vimStatusBarRef} style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }} />}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => setShowTerminal(!showTerminal)} className="twm-btn" style={{ color: showTerminal ? 'var(--accent)' : 'inherit' }} title="Toggle Terminal">
            <TerminalIcon size={14} />
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setLangSelectorOpen(!langSelectorOpen)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.75rem' }}>{LANG_CONFIG[lang].label} ▾</button>
            {langSelectorOpen && (
              <div style={{ position: 'absolute', bottom: '2rem', right: 0, background: 'var(--bg)', border: '1px solid var(--line)', padding: '0.4rem', borderRadius: '0.4rem', zIndex: 100, minWidth: '100px' }}>
                {(["c", "cpp", "python", "java"] as Language[]).map(l => (
                  <div key={l} onClick={() => { setLang(l); setCode(LANG_CONFIG[l].defaultCode); setLangSelectorOpen(false); }} style={{ padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.75rem' }}>{LANG_CONFIG[l].label}</div>
                ))}
              </div>
            )}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>UTF-8</span>
        </div>
      </div>
    </div>
  );
});

EditorWindow.displayName = "EditorWindow";
