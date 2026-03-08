"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { loader } from "@monaco-editor/react";
import { Settings, Code, Trophy, MessageSquare, ArrowLeft, ArrowRight, X, Sword, User, LogOut, ChevronRight, Users, RotateCcw, Wand2, Target, Play } from "lucide-react";
import { initVimMode } from "monaco-vim";
import { motion, AnimatePresence } from "framer-motion";

import { Language, WindowId, UserStats, Question } from "../types";
import { THEMES } from "../constants/themes";
import { FONTS } from "../constants/fonts";
import { LANG_CONFIG, CPP_STL } from "../constants/languages";

import { EditorWindow } from "./windows/EditorWindow";
import { SettingsWindow } from "./windows/SettingsWindow";
import { BattleWindow } from "./windows/BattleWindow";
import { ProblemWindow } from "./windows/ProblemWindow";
import { ProfileWindow } from "./windows/ProfileWindow";

const DEFAULT_QUESTION: Question = {
  id: "default",
  title: "Sum of Two Integers",
  difficulty: "Easy",
  description: "Write a program that reads pairs of integers from standard input and prints their sum to standard output.\n\nInput: Pairs of integers a and b.\nOutput: The sum of each pair on a new line.",
  testCases: JSON.stringify([
    { input: "5 7", output: "12" },
    { input: "10 -2", output: "8" },
    { input: "0 0", output: "0" }
  ])
};

const MainMenu: React.FC = () => {
  const { data: session, update } = useSession();
  const [lang, setLang] = useState<Language>("cpp");
  const [code, setCode] = useState(LANG_CONFIG["cpp"].defaultCode);
  const [openWindows, setOpenWindows] = useState<WindowId[]>(["editor"]);
  const [windowFlexes, setWindowFlexes] = useState<number[]>([]);
  const [themeIndex, setThemeIndex] = useState(0);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState(FONTS[0].value);
  const [terminalFontSize, setTerminalFontSize] = useState(13);
  const [vimMode, setVimMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [draggedWindow, setDraggedWindow] = useState<WindowId | null>(null);
  const [langSelectorOpen, setLangSelectorOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const [stdin, setStdin] = useState<string>("");
  const [terminalOutput, setTerminalOutput] = useState<string>("Welcome to Code Knights terminal.\nProvide input and click RUN.");
  const [isRunning, setIsRunning] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(180);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState({ title: "", description: "", difficulty: "Easy", testCases: [{ input: "", output: "" }] });
  const [isAdminView, setIsAdminView] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [testResults, setTestResults] = useState<{ passed: number, total: number, details: any[] } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({ battlesWon: 0, battlesTotal: 0 });
  const [showQuitConfirmation, setShowQuitConfirmation] = useState(false);
  const [battleStartTime, setBattleStartTime] = useState<number | null>(null);
  const [solveTime, setSolveTime] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hoveredWindow, setHoveredWindow] = useState<WindowId | null>(null);
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  const [compileErrors, setCompileErrors] = useState<any[]>([]);

  const workspaceRef = useRef<HTMLElement>(null);
  const resizingRef = useRef<number | null>(null);
  const terminalResizingRef = useRef<boolean>(false);
  const editorRef = useRef<any>(null);
  const vimModeRef = useRef<any>(null);
  const vimStatusBarRef = useRef<HTMLDivElement>(null);

  const navLinks = useMemo(() => [
    { label: "Battle", id: "battle" as WindowId, icon: <Sword size={16} /> },
    { label: "Contests", id: "contests" as WindowId, icon: <Trophy size={16} /> },
    { label: "Discuss", id: "discuss" as WindowId, icon: <MessageSquare size={16} /> },
    { label: "Friends", id: "friends" as WindowId, icon: <Users size={16} /> },
  ], []);

  useEffect(() => {
    // Expose current code for the "Run Example" feature in ProblemWindow
    (window as any).ck_current_code = code;
  }, [code]);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/questions");
      const data = await res.json();
      if (Array.isArray(data)) setQuestions(data);
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    }
  }, []);

  const fetchUserStats = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data) {
        setUserStats({
          battlesWon: data.battlesWon || 0,
          battlesTotal: data.battlesTotal || 0
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, [session]);

  useEffect(() => {
    const savedLang = localStorage.getItem("ck-lang") as Language;
    const savedCode = localStorage.getItem("ck-code");
    const savedWindows = JSON.parse(localStorage.getItem("ck-windows") || '["editor"]');
    const savedTheme = localStorage.getItem("ck-theme-idx");
    const savedFlexes = JSON.parse(localStorage.getItem("ck-flexes") || '[]');
    const savedFontSize = localStorage.getItem("ck-font-size");
    const savedFontFamily = localStorage.getItem("ck-font-family");
    const savedTermFontSize = localStorage.getItem("ck-term-font-size");
    const savedVim = localStorage.getItem("ck-vim") === "true";
    const savedTermHeight = localStorage.getItem("ck-term-height");
    const savedStdin = localStorage.getItem("ck-stdin");

    const tIdx = savedTheme !== null ? parseInt(savedTheme) : 0;
    setThemeIndex(tIdx);
    
    if (savedLang && LANG_CONFIG[savedLang]) setLang(savedLang);
    if (savedCode) setCode(savedCode);
    if (savedWindows) setOpenWindows(savedWindows.filter((w: string) => w !== "terminal" && w !== "results"));
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    if (savedFontFamily) setFontFamily(savedFontFamily);
    if (savedTermFontSize) setTerminalFontSize(parseInt(savedTermFontSize));
    if (savedTermHeight) setTerminalHeight(parseInt(savedTermHeight));
    if (savedStdin) setStdin(savedStdin);
    setVimMode(savedVim);
    
    if (savedFlexes.length === savedWindows.length) setWindowFlexes(savedFlexes);
    else setWindowFlexes(openWindows.map(() => 1));
    
    setTimeout(() => setIsLoaded(true), 800);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("ck-lang", lang);
      localStorage.setItem("ck-code", code);
      localStorage.setItem("ck-windows", JSON.stringify(openWindows));
      localStorage.setItem("ck-flexes", JSON.stringify(windowFlexes));
      localStorage.setItem("ck-theme-idx", themeIndex.toString());
      localStorage.setItem("ck-font-size", fontSize.toString());
      localStorage.setItem("ck-font-family", fontFamily);
      localStorage.setItem("ck-term-font-size", terminalFontSize.toString());
      localStorage.setItem("ck-vim", vimMode.toString());
      localStorage.setItem("ck-term-height", terminalHeight.toString());
      localStorage.setItem("ck-stdin", stdin);
      
      const theme = THEMES[themeIndex];
      const root = document.documentElement;
      root.style.setProperty('--bg', theme.bg);
      root.style.setProperty('--accent', theme.accent);
      root.style.setProperty('--line', theme.line);
      root.style.setProperty('--window-bg', theme.bg);
      
      const isLightTheme = theme.light;
      root.style.setProperty('--text', isLightTheme ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)');
      root.style.setProperty('--text-muted', isLightTheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)');
      root.style.setProperty('--header-bg', isLightTheme ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)');

      loader.init().then(monaco => {
        monaco.languages.registerCompletionItemProvider('cpp', {
          provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
            return { suggestions: CPP_STL.map(item => ({ label: item, kind: monaco.languages.CompletionItemKind.Keyword, insertText: item, range })) };
          }
        });

        monaco.editor.defineTheme('dynamic-theme', {
          base: isLightTheme ? 'vs' : 'vs-dark',
          inherit: true,
          rules: theme.rules,
          colors: {
            'editor.background': '#00000000',
            'editor.lineHighlightBackground': isLightTheme ? '#0000000a' : '#ffffff0a',
            'editorCursor.foreground': isLightTheme ? '#000000' : '#ffffff',
            'editor.selectionBackground': theme.accent + '66',
            'editor.selectionHighlightBackground': theme.accent + '33',
            'editorLineNumber.foreground': isLightTheme ? '#00000059' : '#ffffff59',
          }
        });
        monaco.editor.setTheme('dynamic-theme');
      });
    }
  }, [lang, code, openWindows, windowFlexes, themeIndex, fontSize, fontFamily, terminalFontSize, vimMode, terminalHeight, stdin, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      fetchQuestions();
      fetchUserStats();
    }
  }, [isLoaded, fetchQuestions, fetchUserStats]);

  useEffect(() => {
    if (editorRef.current) {
      if (vimMode) {
        if (!vimModeRef.current) vimModeRef.current = initVimMode(editorRef.current, vimStatusBarRef.current);
      } else {
        if (vimModeRef.current) {
          vimModeRef.current.dispose();
          vimModeRef.current = null;
        }
      }
    }
  }, [vimMode, isLoaded]);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setShowTerminal(true);
    setCompileErrors([]);
    setTerminalOutput("Compiling and running...\n");
    try {
      const res = await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, language: lang, stdin }) });
      const data = await res.json();
      if (data.compileErrors) setCompileErrors(data.compileErrors);
      setTerminalOutput(data.error ? `Error:\n${data.error}` : data.output || "Program finished with no output.");
    } catch (err) {
      setTerminalOutput("Failed to connect to execution server.");
    } finally {
      setIsRunning(false);
    }
  }, [code, lang, stdin]);

  const handleAddQuestion = async () => {
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      });
      if (res.ok) {
        setNewQuestion({ title: "", description: "", difficulty: "Easy", testCases: [{ input: "", output: "" }] });
        fetchQuestions();
        setIsAdminView(false);
      }
    } catch (err) {
      console.error("Failed to add question:", err);
    }
  };

  const startBattle = useCallback((question?: any) => {
    const q = question || (questions.length > 0 ? questions[Math.floor(Math.random() * questions.length)] : DEFAULT_QUESTION);
    if (!q) return;
    
    setActiveQuestion(q);
    setTestResults(null);
    setBattleStartTime(Date.now());
    setSolveTime(null);
    
    // Close battle/results window and ensure problem/editor are open
    let newWindows = openWindows.filter(w => w !== "battle");
    
    if (!newWindows.includes("problem")) {
      newWindows.push("problem");
    }
    if (!newWindows.includes("editor")) {
      newWindows.push("editor");
    }
    
    setOpenWindows(newWindows);
    setWindowFlexes(newWindows.map((w) => w === "editor" ? 1.5 : 1));
  }, [questions, openWindows]);

  const runTests = useCallback(async () => {
    if (!activeQuestion) return;
    setIsTesting(true);
    setShowTerminal(true);
    setTestResults(null);
    setCompileErrors([]);
    
    try {
      const testCases = typeof activeQuestion.testCases === 'string' 
        ? JSON.parse(activeQuestion.testCases) 
        : activeQuestion.testCases;
        
      let passed = 0;
      const details = [];

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        setTerminalOutput(`Running Test Case ${i + 1}/${testCases.length}...`);
        
        const res = await fetch("/api/run", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ code, language: lang, stdin: tc.input }) 
        });
        const data = await res.json();
        
        if (data.compileErrors && i === 0) setCompileErrors(data.compileErrors);
        
        const actual = (data.output || "").trim();
        const expected = (tc.output || "").trim();
        const isPassed = actual === expected && !data.error;
        
        if (isPassed) passed++;
        details.push({ input: tc.input, expected, actual, passed: isPassed, error: data.error });
      }

      const allPassed = passed === testCases.length;
      setTestResults({ passed, total: testCases.length, details });
      setTerminalOutput(`Test Results: ${passed}/${testCases.length} Passed\n\n` + 
        details.map((d, i) => `Test ${i+1}: ${d.passed ? "✅ PASSED" : "❌ FAILED"}${d.error ? ` (Error: ${d.error})` : ""}`).join("\n"));

      if (allPassed && battleStartTime) {
        const duration = Date.now() - battleStartTime;
        const mins = Math.floor(duration / 60000);
        const secs = ((duration % 60000) / 1000).toFixed(0);
        setSolveTime(`${mins}:${secs.padStart(2, '0')}`);
        
        // Trigger celebration
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }

      // Record submission to database
      if (session) {
        await fetch("/api/user/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: activeQuestion.id,
            code,
            language: lang,
            status: allPassed ? "PASSED" : "FAILED"
          })
        });
        fetchUserStats();
        // @ts-ignore
        if (typeof update === 'function') update(); // Refresh next-auth session if available
      }
    } catch (err) {
      console.error(err);
      setTerminalOutput("Failed to run tests.");
    } finally {
      setIsTesting(false);
    }
  }, [activeQuestion, code, lang, battleStartTime, session, fetchUserStats, update]);

  const handleRevert = useCallback(() => {
    if (confirm("Reset code to default? All current changes will be lost.")) {
      setCode(LANG_CONFIG[lang].defaultCode);
    }
  }, [lang]);

  const handleBeautify = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.trigger('source', 'editor.action.formatDocument');
    }
  }, []);

  const runSingleTest = useCallback(async (testInput: string, testIndex: number) => {
    setStdin(testInput);
    setShowTerminal(true);
    setCompileErrors([]);
    setTerminalOutput(`Running Example ${testIndex + 1}...\n`);
    try {
      const res = await fetch("/api/run", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ code, language: lang, stdin: testInput }) 
      });
      const data = await res.json();
      if (data.compileErrors) setCompileErrors(data.compileErrors);
      setTerminalOutput(data.error ? `Error:\n${data.error}` : data.output || "Program finished with no output.");
    } catch (err) {
      setTerminalOutput("Failed to connect to execution server.");
    }
  }, [code, lang, setStdin]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + ' to run code
      if (e.altKey && e.key === "'") {
        e.preventDefault();
        runCode();
      }
      
      // Alt + Enter to run tests (submit) when in battle
      if (e.altKey && e.key === "Enter" && activeQuestion) {
        e.preventDefault();
        runTests();
      }

      // Alt + q to quit current hovering window
      if (e.altKey && e.key === "q" && hoveredWindow) {
        e.preventDefault();
        toggleWindow(hoveredWindow);
      }

      // Explicitly disable Alt+1
      if (e.altKey && e.key === "1") {
        e.preventDefault();
      }

      if (vimMode && e.key === "Escape") {
        const vimState = editorRef.current?.vimState;
        if (vimState) {
          if (vimState.mode === 'normal') {
            // In normal mode, Esc kicks you out of the editor (blur)
            editorRef.current?.focus(); // Just to be sure we have ref
            document.activeElement instanceof HTMLElement && document.activeElement.blur();
          } else {
            // In insert/visual mode, Esc returns to normal mode (handled by monaco-vim)
            // We do nothing and let it propagate to the editor
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [vimMode, activeQuestion, hoveredWindow, runCode, runTests]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (resizingRef.current !== null && workspaceRef.current) {
      const idx = resizingRef.current;
      const rect = workspaceRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const totalWidth = rect.width;
      const totalFlex = windowFlexes.reduce((a, b) => a + b, 0);
      const flexPerPx = totalFlex / totalWidth;
      const currentFlexBefore = windowFlexes.slice(0, idx + 1).reduce((a, b) => a + b, 0);
      const targetFlexBefore = relativeX * flexPerPx;
      const delta = targetFlexBefore - currentFlexBefore;
      const newFlexes = [...windowFlexes];
      if (newFlexes[idx] + delta > 0.1 && newFlexes[idx+1] - delta > 0.1) {
        newFlexes[idx] += delta;
        newFlexes[idx+1] -= delta;
        setWindowFlexes(newFlexes);
      }
    } else if (terminalResizingRef.current) {
      const deltaY = e.movementY;
      setTerminalHeight(h => Math.max(40, Math.min(window.innerHeight * 0.8, h - deltaY)));
    }
  }, [windowFlexes]);

  const stopResizing = useCallback(() => {
    resizingRef.current = null;
    terminalResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = '';
  }, [handleMouseMove]);

  const startResizing = (index: number) => {
    resizingRef.current = index;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  };

  const startTerminalResizing = useCallback(() => {
    terminalResizingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'ns-resize';
  }, [handleMouseMove, stopResizing]);

  const toggleWindow = useCallback((id: WindowId) => {
    if (id === "problem" && activeQuestion) {
      const allPassed = testResults?.passed === testResults?.total && testResults?.total > 0;
      if (!allPassed) {
        setShowQuitConfirmation(true);
        return;
      } else {
        setActiveQuestion(null);
        setTestResults(null);
      }
    }

    if (openWindows.includes(id)) {
      if (id === "editor") return;
      const idx = openWindows.indexOf(id);
      setOpenWindows(openWindows.filter(w => w !== id));
      const newFlexes = [...windowFlexes];
      newFlexes.splice(idx, 1);
      setWindowFlexes(newFlexes);
    } else {
      setOpenWindows([...openWindows, id]);
      setWindowFlexes([...windowFlexes, 1]);
    }
  }, [openWindows, windowFlexes, activeQuestion, testResults]);

  const moveWindow = (id: WindowId, direction: 'left' | 'right') => {
    const index = openWindows.indexOf(id);
    const newWindows = [...openWindows];
    const newFlexes = [...windowFlexes];
    if (direction === 'left' && index > 0) {
      [newWindows[index - 1], newWindows[index]] = [newWindows[index], newWindows[index - 1]];
      [newFlexes[index - 1], newFlexes[index]] = [newFlexes[index], newFlexes[index - 1]];
    } else if (direction === 'right' && index < openWindows.length - 1) {
      [newWindows[index + 1], newWindows[index]] = [newWindows[index], newWindows[index + 1]];
      [newFlexes[index + 1], newFlexes[index]] = [newFlexes[index], newFlexes[index + 1]];
    }
    setOpenWindows(newWindows);
    setWindowFlexes(newFlexes);
  };

  const handleDrop = (targetId: WindowId) => {
    if (!draggedWindow || draggedWindow === targetId) return;
    const oldIndex = openWindows.indexOf(draggedWindow);
    const newIndex = openWindows.indexOf(targetId);
    const newWindows = [...openWindows];
    const newFlexes = [...windowFlexes];
    [newWindows[oldIndex], newWindows[newIndex]] = [newWindows[newIndex], newWindows[oldIndex]];
    [newFlexes[oldIndex], newFlexes[newIndex]] = [newFlexes[newIndex], newFlexes[oldIndex]];
    setOpenWindows(newWindows);
    setWindowFlexes(newFlexes);
    setDraggedWindow(null);
  };

  const renderWindowContent = (id: WindowId) => {
    switch (id) {
      case "editor":
        return (
          <EditorWindow 
            lang={lang} setLang={setLang} code={code} setCode={setCode} fontSize={fontSize} fontFamily={fontFamily}
            isRunning={isRunning} runCode={runCode} showTerminal={showTerminal} setShowTerminal={setShowTerminal}
            terminalHeight={terminalHeight} startTerminalResizing={startTerminalResizing} stdin={stdin}
            setStdin={setStdin} terminalOutput={terminalOutput} terminalFontSize={terminalFontSize}
            vimMode={vimMode} vimStatusBarRef={vimStatusBarRef} editorRef={editorRef}
            langSelectorOpen={langSelectorOpen} setLangSelectorOpen={setLangSelectorOpen}
            cursorPos={cursorPos} setCursorPos={setCursorPos}
            compileErrors={compileErrors}
          />
        );
      case "settings":
        return (
          <SettingsWindow 
            themeIndex={themeIndex} setThemeIndex={setThemeIndex} fontFamily={fontFamily} setFontFamily={setFontFamily}
            fontSize={fontSize} setFontSize={setFontSize} terminalFontSize={terminalFontSize} 
            setTerminalFontSize={setTerminalFontSize} vimMode={vimMode} setVimMode={setVimMode}
          />
        );
      case "battle":
        return (
          <BattleWindow 
            isAdmin={!!(session?.user as any)?.isAdmin} isAdminView={isAdminView} setIsAdminView={setIsAdminView}
            newQuestion={newQuestion} setNewQuestion={setNewQuestion} handleAddQuestion={handleAddQuestion}
            startBattle={startBattle} questions={questions}
          />
        );
      case "problem":
        return (
          <ProblemWindow 
            activeQuestion={activeQuestion} testResults={testResults} showQuitConfirmation={showQuitConfirmation}
            setShowQuitConfirmation={setShowQuitConfirmation} handleQuitBattle={() => { setActiveQuestion(null); setTestResults(null); setShowQuitConfirmation(false); setOpenWindows(openWindows.filter(w => w !== "problem")); }}
            runTests={runTests} isTesting={isTesting} setStdin={setStdin} setShowTerminal={setShowTerminal}
            setTerminalOutput={setTerminalOutput} solveTime={solveTime} lang={lang}
            startNewBattle={() => { setActiveQuestion(null); setTestResults(null); setOpenWindows(prev => prev.filter(w => w !== "problem").concat("battle")); }}
            runSingleTest={runSingleTest}
          />
        );
      case "profile":
        return <ProfileWindow session={session} userStats={userStats} />;
      case "contests": return <div style={{ padding: '1.5rem' }}><h2>Upcoming</h2><div style={{ marginTop: '1rem', border: '1px solid var(--line)', padding: '1rem' }}>Weekly Contest 42</div></div>;
      case "leaderboard": return <div style={{ padding: '1.5rem' }}><h2>Global</h2><div style={{ marginTop: '1rem' }}>1. tourist (3842)</div></div>;
      case "discuss": return <div style={{ padding: '1.5rem' }}><h2>Discussion</h2><div style={{ marginTop: '1rem' }}>How to learn DP?</div></div>;
      case "friends": return <div style={{ padding: '1.5rem' }}><h2>Friends</h2><p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>You have no friends yet.</p></div>;
      default: return null;
    }
  };

  return (
    <div className="main-header" onMouseMove={handleMouseMove} onMouseUp={stopResizing}>
      <AnimatePresence>
        {showCelebration && (
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
            {/* Theme Colored Sprinkles */}
            {Array.from({ length: 100 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: '50vw', y: '50vh', scale: 0, opacity: 1 }}
                animate={{ x: `${Math.random() * 100}vw`, y: `${Math.random() * 100}vh`, scale: Math.random() * 1.5, opacity: 0, rotate: Math.random() * 720 }}
                transition={{ duration: 2 + Math.random() * 3, ease: [0.23, 1, 0.32, 1], delay: Math.random() * 0.5 }}
                style={{ position: 'absolute', width: Math.random() * 10 + 5 + 'px', height: Math.random() * 5 + 2 + 'px', background: 'var(--accent)', borderRadius: '2px', boxShadow: '0 0 10px var(--accent)' }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className={`loading-overlay ${isLoaded ? "loading-overlay--hidden" : ""}`}>
        <div className="loading-spinner" />
        <div><span style={{ color: 'var(--accent)' }}>CODE</span>&nbsp;KNIGHTS</div>
      </div>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span style={{ fontWeight: 600, fontSize: '1.2rem' }}><span style={{ color: 'var(--accent)' }}>Code</span> Knights</span>
          </Link>
          <ul className="nav-links">
            {navLinks.map(link => {
              const isDisabled = link.id === "battle" && activeQuestion;
              return (
                <li key={link.id}>
                  <button 
                    onClick={() => !isDisabled && toggleWindow(link.id)} 
                    className={`nav-link ${openWindows.includes(link.id) ? "nav-link--active" : ""}`} 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', 
                      cursor: isDisabled ? 'not-allowed' : 'pointer', font: 'inherit', 
                      color: openWindows.includes(link.id) ? 'var(--accent)' : 'inherit',
                      opacity: isDisabled ? 0.5 : 1
                    }}
                    title={isDisabled ? "Finish your current battle first" : ""}
                  >
                    {link.icon} {link.label}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="nav-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => toggleWindow("settings")} style={{ background: 'transparent', border: 'none', color: '#f1fa8c', cursor: 'pointer', padding: '0.4rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: openWindows.includes("settings") ? 1 : 0.7 }} title="Settings"><Settings size={20} /></button>
            {session ? (
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0.4rem', borderRadius: '0.3rem' }}
                  className="btn-ghost"
                >
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{(session.user as any).username || session.user?.name}</span>
                  {session.user?.image ? (
                    <img src={session.user.image} alt="Profile" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--line)' }} />
                  ) : (
                    <User size={20} />
                  )}
                </button>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <>
                      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} onClick={() => setIsProfileMenuOpen(false)} />
                      <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }} style={{ position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0, width: '240px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '0.6rem', zIndex: 100, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--line)', marginBottom: '0.25rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{(session.user as any).username || session.user.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user.email}</div>
                        </div>
                        <button onClick={() => { toggleWindow("profile"); setIsProfileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: 'none', color: 'inherit', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={14} /><span style={{ fontSize: '0.85rem' }}>Profile Overview</span></div>
                          <ChevronRight size={12} />
                        </button>
                        <Link href="/settings/profile" onClick={() => setIsProfileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', textDecoration: 'none', color: 'inherit', background: 'rgba(255,255,255,0.02)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={14} /><span style={{ fontSize: '0.85rem' }}>Configure Profile</span></div>
                          <ChevronRight size={12} />
                        </Link>
                        <button onClick={() => signOut()} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: 'none', color: '#ff5555', background: 'rgba(255, 85, 85, 0.05)', cursor: 'pointer', textAlign: 'left' }}>
                          <LogOut size={14} /><span style={{ fontSize: '0.85rem' }}>Sign Out</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : <button className="btn btn-ghost" onClick={() => signIn()}>Sign In</button>}
          </div>
        </div>
      </nav>

      <main className="twm-workspace" ref={workspaceRef}>
        <AnimatePresence initial={true}>
          {openWindows.map((id, idx) => {
            const navItem = navLinks.find(l => l.id === id);
            let icon = navItem?.icon;
            if (id === 'editor') icon = <Code size={16} />;
            if (id === 'settings') icon = <Settings size={16} />;
            if (id === 'battle') icon = <Sword size={16} />;
            if (id === 'friends') icon = <Users size={16} />;
            if (id === 'problem') icon = <Target size={16} />;
            
            return (
              <React.Fragment key={id}>
                <motion.section 
                  key={id}
                  initial={{ opacity: 0, scale: 0.95, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.2 }, scale: { duration: 0.2 }, x: { duration: 0.2 }, exit: { duration: 0 } }}
                  className={`twm-window ${draggedWindow === id ? 'twm-window--dragging' : ''}`}
                  style={{ flex: windowFlexes[idx] || 1 }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(id)}
                  onMouseEnter={() => setHoveredWindow(id)}
                  onMouseLeave={() => setHoveredWindow(prev => prev === id ? null : prev)}
                >
                  <div className="twm-window-header" draggable onDragStart={() => setDraggedWindow(id)} onDragEnd={() => setDraggedWindow(null)} style={{ cursor: 'grab' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className="twm-window-title" style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--accent)' }}>{icon}</span> {id}
                      </span>
                      {id === 'editor' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderLeft: '1px solid var(--line)', paddingLeft: '1rem' }}>
                          <button onClick={(e) => { e.stopPropagation(); runCode(); }} disabled={isRunning} style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '0.2rem', padding: '0.1rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: isRunning ? 'wait' : 'pointer', fontSize: '0.7rem', fontWeight: 700, opacity: isRunning ? 0.7 : 1, marginRight: '0.5rem' }}>
                            <Play size={10} fill="currentColor" /> {isRunning ? "..." : "RUN"}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleRevert(); }} className="twm-btn" title="Revert to original code" style={{ padding: '0.1rem 0.3rem' }}><RotateCcw size={12} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleBeautify(); }} className="twm-btn" title="Beautify code (Format)" style={{ padding: '0.1rem 0.3rem' }}><Wand2 size={12} /></button>
                        </div>
                      )}
                    </div>
                    <div className="twm-window-actions">
                      {openWindows.length > 1 && (
                        <>
                          <button className="twm-btn" onClick={() => moveWindow(id, 'left')}><ArrowLeft size={14} /></button>
                          <button className="twm-btn" onClick={() => moveWindow(id, 'right')}><ArrowRight size={14} /></button>
                        </>
                      )}
                      <button className="twm-btn" onClick={() => toggleWindow(id)}><X size={14} /></button>
                    </div>
                  </div>
                  <div className="twm-content">
                  {renderWindowContent(id)}
                  </div>                </motion.section>
                {idx < openWindows.length - 1 && <div className="twm-resizer" onMouseDown={() => startResizing(idx)} />}
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MainMenu;
