"use client";

import React, { useEffect, useMemo } from "react";
import Editor, { useMonaco, loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { Terminal as TerminalIcon, X } from "lucide-react";
import { Language } from "../../types";

loader.config({ monaco });
import { LANG_CONFIG } from "../../constants/languages";
import { TranslationKey } from "../../constants/translations";
import { registerAutocompletes } from "../../lib/monacoAutocomplete";

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
  analysis?: {
    timeComplexity?: string;
    spaceComplexity?: string;
    complexityExplanation?: string;
  } | null;
  isAnalyzing?: boolean;
  tabSize: number;
  insertSpaces: boolean;
  setFontSize: (size: number) => void;
  setTerminalFontSize: (size: number) => void;
}

export const EditorWindow: React.FC<EditorWindowProps> = React.memo(({
  lang, setLang, code, setCode, fontSize, fontFamily, isRunning, runCode,
  showTerminal, setShowTerminal, terminalHeight, startTerminalResizing,
  stdin, setStdin, terminalOutput, terminalFontSize, vimMode,
  vimStatusBarRef, editorRef, langSelectorOpen, setLangSelectorOpen,
  cursorPos, setCursorPos, compileErrors, t, isResizing, analysis, isAnalyzing,
  tabSize, insertSpaces, setFontSize, setTerminalFontSize
}) => {
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      const completionRegistration = registerAutocompletes(monaco);
      return () => {
        completionRegistration.dispose();
      };
    }
  }, [monaco]);

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
    snippetSuggestions: "inline" as const,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: "on" as const,
    autoClosingBrackets: "always" as const, 
    autoClosingQuotes: "always" as const, 
    autoClosingOvertype: "always" as const, 
    autoSurround: "languageDefined" as const, 
    bracketPairColorization: { enabled: true }, 
    wordBasedSuggestions: "currentDocument" as const, 
    wordBasedSuggestionsOnlySameLanguage: true,
    tabSize: tabSize,
    insertSpaces: insertSpaces,
    detectIndentation: false
  }), [fontSize, fontFamily, isResizing, tabSize, insertSpaces]);

  useEffect(() => {
    if (!isResizing && editorRef.current) {
      setTimeout(() => editorRef.current.layout(), 100);
    }
  }, [isResizing, editorRef]);

  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) editorRef.current.layout();
    };
    window.addEventListener('resize', handleResize);
    
    // Also use ResizeObserver if available for the container
    let resizeObserver: ResizeObserver | null = null;
    const editorContainer = document.querySelector('.twm-workspace');
    if (editorContainer && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (editorRef.current) editorRef.current.layout();
      });
      resizeObserver.observe(editorContainer);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [editorRef]);

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

  const emittedValues = React.useRef(new Set<string>());

  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (emittedValues.current.has(code)) {
        // This is an echo from a state update we initiated. Ignore it.
        emittedValues.current.delete(code);
      } else {
        // This is a genuine external update (e.g. format, revert).
        if (model && model.getValue() !== code) {
          editorRef.current.setValue(code);
        }
      }
    }
  }, [code, editorRef]);

  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        model.updateOptions({
          tabSize: tabSize,
          insertSpaces: insertSpaces
        });
      }
    }
  }, [tabSize, insertSpaces, editorRef, lang]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative', background: 'var(--bg)' }}>
        <Editor
          height="100%"
          language={lang}
          theme="dynamic-theme"
          defaultValue={code}
          onChange={(val) => {
            const newValue = val || "";
            emittedValues.current.add(newValue);
            if (emittedValues.current.size > 20) {
              const iterator = emittedValues.current.values();
              emittedValues.current.delete(iterator.next().value);
            }
            setCode(newValue);
          }}
          onMount={(editor) => { 
            editorRef.current = editor; 
            editor.onDidChangeCursorPosition((e: any) => {
              setCursorPos({ ln: e.position.lineNumber, col: e.position.column });
            });

            // Initialize model options
            const model = editor.getModel();
            if (model) {
              model.updateOptions({
                tabSize: tabSize,
                insertSpaces: insertSpaces
              });
            }

            // Ensure any future models also get updated options
            editor.onDidChangeModel(() => {
              const m = editor.getModel();
              if (m) {
                m.updateOptions({
                  tabSize: tabSize,
                  insertSpaces: insertSpaces
                });
              }
            });

            // Force layout calculation multiple times to handle animations and initial rendering
            setTimeout(() => editor.layout(), 50);
            setTimeout(() => editor.layout(), 200);
            setTimeout(() => editor.layout(), 500);
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
              {t("terminalLabel")}
            </div>
            <button onClick={() => setShowTerminal(false)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={12} /></button>
          </div>
          <div className="terminal-split">
            <div className="terminal-section">
              <div className="terminal-label">{t("stdin")}</div>
              <textarea className="terminal-input" style={{ fontSize: `${terminalFontSize}px`, fontFamily: fontFamily }} placeholder={t("stdin") || "Input..."} value={stdin} onChange={(e) => setStdin(e.target.value)} />
            </div>
            <div className="terminal-section">
              <div className="terminal-label">{t("stdout")}</div>
              <div className="terminal-output" style={{ fontSize: `${terminalFontSize}px`, fontFamily: fontFamily, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ flex: 1, overflowY: 'auto' }}>{terminalOutput}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="ide-status">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', paddingRight: '1rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ln {cursorPos.ln}, Col {cursorPos.col}</span>
          </div>
          {vimMode && <div className="vim-status-bar" ref={vimStatusBarRef} style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }} />}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => setShowTerminal(!showTerminal)} className="twm-btn" style={{ color: showTerminal ? 'var(--accent)' : 'inherit' }} title={t("toggleTerminal")}>
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
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t("utf8")}</span>
        </div>
      </div>
    </div>
  );
});

EditorWindow.displayName = "EditorWindow";
