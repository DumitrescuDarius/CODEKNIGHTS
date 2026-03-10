"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { loader } from "@monaco-editor/react";
import { Settings, Code, Trophy, MessageSquare, ArrowLeft, ArrowRight, X, Sword, User, LogOut, ChevronRight, Users, RotateCcw, Wand2, Target, Play, Terminal, Database, Maximize2, Minimize2, LogIn } from "lucide-react";
import { initVimMode } from "monaco-vim";
import { motion, AnimatePresence } from "framer-motion";

import { Language, WindowId, UserStats, Question, SupportedLanguage, AnimationSpeed } from "../types";
import { THEMES } from "../constants/themes";
import { FONTS } from "../constants/fonts";
import { LANG_CONFIG, CPP_STL } from "../constants/languages";
import { TRANSLATIONS, TranslationKey } from "../constants/translations";

import { EditorWindow } from "./windows/EditorWindow";
import { SettingsWindow } from "./windows/SettingsWindow";
import { BattleWindow } from "./windows/BattleWindow";
import { ProblemWindow } from "./windows/ProblemWindow";
import { ProfileWindow } from "./windows/ProfileWindow";
import { AdminWindow } from "./windows/AdminWindow";
import { ContestWindow } from "./windows/ContestWindow";

declare global {
  interface Window {
    ck_current_code: string;
  }
}

const DEFAULT_QUESTION: Question = {
  id: "default",
  title: "Sum of Two Integers",
  difficulty: "Easy",
  description: "Write a program that reads pairs of integers from standard input and prints their sum to standard output.\n\nInput: Pairs of integers **a** and **b**.\nOutput: The sum of each pair on a new line.",
  restrictions: "Time complexity ==O(1)== per pair.",
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
  const [windowFlexes, setWindowFlexes] = useState<number[]>([1]);
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
  const [newQuestion, setNewQuestion] = useState<{ id?: string; title: string; description: string; restrictions: string; difficulty: string; testCases: { input: string; output: string }[]; hiddenTestCases: { input: string; output: string }[] }>({ 
    title: "", 
    description: "", 
    restrictions: "",
    difficulty: "Easy", 
    testCases: [{ input: "", output: "" }], 
    hiddenTestCases: [] 
  });
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [testResults, setTestResults] = useState<{ passed: number, total: number, details: any[] } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({ battlesWon: 0, battlesTotal: 0 });
  const [showQuitConfirmation, setShowQuitConfirmation] = useState(false);
  const [showCancelDuel, setShowCancelDuel] = useState(false);
  const [battleStartTime, setBattleStartTime] = useState<number | null>(null);
  const [solveTime, setSolveTime] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hoveredWindow, setHoveredWindow] = useState<WindowId | null>(null);
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  const [compileErrors, setCompileErrors] = useState<any[]>([]);
  const [maximizedWindow, setMaximizedWindow] = useState<WindowId | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [uiLang, setUiLang] = useState<SupportedLanguage>("en");
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeDuel, setActiveDuel] = useState<any | null>(null);
  const [duelPin, setDuelPin] = useState<string>("");
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>("snappy");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('animationSpeed') as AnimationSpeed;
    if (saved) setAnimationSpeed(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('animationSpeed', animationSpeed);
  }, [animationSpeed]);

  const getTransition = (): any => {
    if (animationSpeed === "none") return { type: "tween", duration: 0 };
    if (animationSpeed === "smooth") return { type: "spring", stiffness: 300, damping: 40, mass: 1 };
    if (animationSpeed === "bouncy") return { type: "spring", stiffness: 600, damping: 15, mass: 1 };
    if (animationSpeed === "elastic") return { type: "spring", stiffness: 400, damping: 8, mass: 1.2 };
    if (animationSpeed === "dramatic") return { type: "spring", stiffness: 50, damping: 25, mass: 2 };
    if (animationSpeed === "snappy") return { type: "spring", stiffness: 1000, damping: 50, mass: 1 };
    if (animationSpeed === "jello") return { type: "spring", stiffness: 500, damping: 5, mass: 1 };
    if (animationSpeed === "lazy") return { type: "spring", stiffness: 100, damping: 40, mass: 3 };
    if (animationSpeed === "ghost") return { type: "spring", stiffness: 300, damping: 30, mass: 1 };
    if (animationSpeed === "teleport") return { type: "spring", stiffness: 2000, damping: 100, mass: 1 };
    if (animationSpeed === "boing") return { type: "spring", stiffness: 800, damping: 10, mass: 1.5 };
    if (animationSpeed === "float") return { type: "spring", stiffness: 40, damping: 15, mass: 1 };
    if (animationSpeed === "erased") return { type: "tween", ease: "easeInOut", duration: 0.4 };
    if (animationSpeed === "flip") return { type: "spring", stiffness: 300, damping: 20, mass: 1 };
    if (animationSpeed === "glitch") return { type: "spring", stiffness: 1000, damping: 10, mass: 0.5 };
    if (animationSpeed === "swapVertical") return { type: "spring", stiffness: 400, damping: 25, mass: 1 };
    return { type: "spring", stiffness: 500, damping: 30, mass: 1 };
  };

  const t = useCallback((key: TranslationKey): string => {
    return (TRANSLATIONS[uiLang] as any)[key] || (TRANSLATIONS["en"] as any)[key] || key;
  }, [uiLang]);

  const analyzeCode = useCallback(async (currentCode: string, currentLang: string, description: string) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    console.log("Frontend: Starting AI Analysis...");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: currentCode, language: currentLang, problemDescription: description })
      });
      const data = await res.json();
      console.log("Frontend: AI Analysis Response received", data);
      if (!data.error) {
        setAnalysis(data);
      } else {
        console.error("Frontend: AI Analysis Error", data.error);
      }
    } catch (err) {
      console.error("Frontend: Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const workspaceRef = useRef<HTMLElement>(null);
  const resizingRef = useRef<number | null>(null);
  const terminalResizingRef = useRef<boolean>(false);
  const editorRef = useRef<any>(null);
  const vimModeRef = useRef<any>(null);
  const vimStatusBarRef = useRef<HTMLDivElement>(null);
  const ignoreHoverRef = useRef(false);

  const navLinks = useMemo(() => [
    { label: t("battle"), id: "battle" as WindowId, icon: <Sword size={16} /> },
    { label: t("contests"), id: "contests" as WindowId, icon: <Trophy size={16} /> },
    { label: t("discuss"), id: "discuss" as WindowId, icon: <MessageSquare size={16} /> },
    { label: t("friends"), id: "friends" as WindowId, icon: <Users size={16} /> },
  ], [t]);

  useEffect(() => {
    // Expose current code for the "Run Example" feature in ProblemWindow
    window.ck_current_code = code;
  }, [code]);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/questions");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setQuestions(data);
      }
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    }
  }, []);

  const fetchUserStats = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setUserStats({
            battlesWon: data.battlesWon || 0,
            battlesTotal: data.battlesTotal || 0
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, [session]);

  const createDuel = useCallback(async () => {
    try {
      const res = await fetch("/api/duels", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        if (data.pin) {
          setDuelPin(data.pin);
          setActiveDuel(data);
        } else {
          alert(data.error || "Failed to create duel");
        }
      } else {
        alert(data.error || "Failed to create duel");
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const joinDuel = useCallback(async (pin: string) => {
    try {
      const res = await fetch("/api/duels/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.id) {
          setActiveDuel(data);
        } else {
          alert(data.error || "Failed to join duel");
        }
      } else {
        alert(data.error || "Failed to join duel");
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const pollDuel = useCallback(async () => {
    if (!activeDuel || activeDuel.status === "FINISHED") return;
    try {
      const res = await fetch(`/api/duels?pin=${activeDuel.pin}`);
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          setActiveDuel(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeDuel]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (activeDuel && activeDuel.status !== "FINISHED") {
      interval = setInterval(pollDuel, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDuel, pollDuel]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (activeDuel && activeDuel.status === "ACTIVE" && battleStartTime && !solveTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - battleStartTime) / 1000);
        const remaining = 180 - elapsed; // 3 minutes
        if (remaining <= 0) {
          setTimeLeft(0);
          clearInterval(interval);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    } else {
      setTimeLeft(null);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDuel, battleStartTime, solveTime]);

  useEffect(() => {
    if (activeDuel?.status === "ACTIVE" && !activeQuestion) {
      startBattle(activeDuel.question);
    }
  }, [activeDuel, activeQuestion]);

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
    
    const finalWindows = savedWindows.filter((w: string) => w !== "terminal" && w !== "results");
    setOpenWindows(finalWindows);
    
    if (savedFlexes.length === finalWindows.length) setWindowFlexes(savedFlexes);
    else setWindowFlexes(finalWindows.map(() => 1));
    
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
      localStorage.setItem("ck-ui-lang", uiLang);
      
      const theme = THEMES[themeIndex];
      const root = document.documentElement;
      root.style.setProperty('--bg', theme.bg);
      root.style.setProperty('--accent', theme.accent);
      root.style.setProperty('--line', theme.line);
      root.style.setProperty('--window-bg', theme.bg);

      // Add RGB version of accent for transparent backgrounds
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "122, 162, 247";
      };
      root.style.setProperty('--accent-rgb', hexToRgb(theme.accent));

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
  }, [lang, code, openWindows, windowFlexes, themeIndex, fontSize, fontFamily, terminalFontSize, vimMode, terminalHeight, stdin, isLoaded, uiLang]);

  useEffect(() => {
    if (isLoaded) {
      // Update dynamic favicon
      const theme = THEMES[themeIndex];
      const img = new Image();
      img.src = '/assets/logo_white.png';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Force a very wide aspect ratio for the favicon
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Draw tinted version
        ctx.fillStyle = theme.accent;
        ctx.fillRect(0, 0, 256, 128);
        ctx.globalCompositeOperation = 'destination-in';
        
        // Draw it to fill the width more aggressively
        ctx.drawImage(img, 0, 0, 256, 128);
        
        const link = document.getElementById('dynamic-favicon') as HTMLLinkElement;
        if (link) {
          link.href = canvas.toDataURL("image/png");
        }
      };
    }
  }, [themeIndex, isLoaded]);

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

  useEffect(() => {
    if (isDragging || draggedWindow) {
      document.body.classList.add('resizing');
    } else {
      document.body.classList.remove('resizing');
    }
  }, [isDragging, draggedWindow]);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setShowTerminal(true);
    setCompileErrors([]);
    setTerminalOutput("Compiling and running...\n");
    try {
      const res = await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, language: lang, stdin }) });
      if (res.ok) {
        const data = await res.json();
        if (data.compileErrors) setCompileErrors(data.compileErrors);
        setTerminalOutput(data.error ? `Error:\n${data.error}` : data.output || "Program finished with no output.");
      } else {
        const data = await res.json();
        setTerminalOutput(data.error || "Failed to run code.");
      }
    } catch (err) {
      setTerminalOutput("Failed to connect to execution server.");
    } finally {
      setIsRunning(false);
    }
  }, [code, lang, stdin]);

  const handleAddQuestion = async () => {
    setAdminError(null);
    if (!newQuestion.title || !newQuestion.description) {
      setAdminError("Title and description are required.");
      return;
    }

    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      });
      if (res.ok) {
        setNewQuestion({ 
          title: "", 
          description: "", 
          restrictions: "",
          difficulty: "Easy", 
          testCases: [{ input: "", output: "" }], 
          hiddenTestCases: [] 
        });
        fetchQuestions();
        setIsAdminView(false);
        alert("Question published successfully!");
      } else {
        const data = await res.json();
        setAdminError(data.details || data.error || "Failed to add question.");
      }
    } catch (err) {
      console.error("Failed to add question:", err);
      setAdminError("A server error occurred while publishing.");
    }
  };

  const handleUpdateQuestion = async () => {
    setAdminError(null);
    if (!newQuestion.id || !newQuestion.title || !newQuestion.description) {
      setAdminError("ID, title and description are required.");
      return;
    }

    try {
      const res = await fetch("/api/admin/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      });
      if (res.ok) {
        setNewQuestion({ 
          title: "", 
          description: "", 
          restrictions: "",
          difficulty: "Easy", 
          testCases: [{ input: "", output: "" }], 
          hiddenTestCases: [] 
        });
        fetchQuestions();
        alert("Question updated successfully!");
      } else {
        const data = await res.json();
        setAdminError(data.details || data.error || "Failed to update question.");
      }
    } catch (err) {
      console.error("Failed to update question:", err);
      setAdminError("A server error occurred while updating.");
    }
  };

  const onEditQuestion = useCallback((q: Question) => {
    setNewQuestion({
      id: q.id,
      title: q.title,
      description: q.description,
      restrictions: q.restrictions || "",
      difficulty: q.difficulty,
      testCases: typeof q.testCases === 'string' ? JSON.parse(q.testCases) : q.testCases,
      hiddenTestCases: q.hiddenTestCases ? (typeof q.hiddenTestCases === 'string' ? JSON.parse(q.hiddenTestCases) : q.hiddenTestCases) : []
    });
    
    if (!openWindows.includes("admin")) {
      setOpenWindows(prev => [...prev, "admin"]);
      setWindowFlexes(prev => [...prev, 1]);
    }
  }, [openWindows]);

  const handleDeleteQuestion = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this question? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/questions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchQuestions();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete question.");
      }
    } catch (err) {
      console.error("Failed to delete question:", err);
    }
  }, [fetchQuestions]);

  const startBattle = useCallback((question?: Question) => {
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
      const publicTests = typeof activeQuestion.testCases === 'string' 
        ? JSON.parse(activeQuestion.testCases) 
        : activeQuestion.testCases;
      
      const hiddenTests = activeQuestion.hiddenTestCases 
        ? (typeof activeQuestion.hiddenTestCases === 'string' ? JSON.parse(activeQuestion.hiddenTestCases) : activeQuestion.hiddenTestCases)
        : [];

      const allTests = [...publicTests, ...hiddenTests];
        
      let passed = 0;
      const details = [];

      for (let i = 0; i < allTests.length; i++) {
        const tc = allTests[i];
        setTerminalOutput(`Running Test Case ${i + 1}/${allTests.length}...`);
        
        const res = await fetch("/api/run", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ code, language: lang, stdin: tc.input }) 
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.compileErrors && i === 0) setCompileErrors(data.compileErrors);
          
          const actual = (data.output || "").trim();
          const expected = (tc.output || "").trim();
          const isPassed = actual === expected && !data.error;
          
          if (isPassed) passed++;
          details.push({ input: tc.input, expected, actual, passed: isPassed, error: data.error, isHidden: i >= publicTests.length });
        } else {
          details.push({ input: tc.input, expected: tc.output, actual: "", passed: false, error: "Server error", isHidden: i >= publicTests.length });
        }
      }

      const allPassed = passed === allTests.length;
      setTestResults({ passed, total: allTests.length, details });
      setTerminalOutput(`Test Results: ${passed}/${allTests.length} Passed\n\n` + 
        details.filter(d => !d.isHidden).map((d, i) => `Test ${i+1}: ${d.passed ? "✅ PASSED" : "❌ FAILED"}${d.error ? ` (Error: ${d.error})` : ""}`).join("\n") +
        (hiddenTests.length > 0 ? `\n\n(+ ${hiddenTests.length} Hidden Tests)` : ""));

      if (allPassed && battleStartTime) {
        const duration = Date.now() - battleStartTime;
        const mins = Math.floor(duration / 60000);
        const secs = ((duration % 60000) / 1000).toFixed(0);
        setSolveTime(`${mins}:${secs.padStart(2, '0')}`);
        
        // Trigger celebration
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);

        // If in a duel, submit the result
        if (activeDuel) {
          await fetch("/api/duels/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ duelId: activeDuel.id, solveTime: duration })
          });
        }

        // Trigger AI Analysis
        analyzeCode(code, lang, activeQuestion.description);
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
        if (update) update(); // Refresh next-auth session if available
      }
    } catch (err) {
      console.error(err);
      setTerminalOutput("Failed to run tests.");
    } finally {
      setIsTesting(false);
    }
  }, [activeQuestion, code, lang, battleStartTime, session, fetchUserStats, update, analyzeCode, activeDuel]);

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
      if (res.ok) {
        const data = await res.json();
        if (data.compileErrors) setCompileErrors(data.compileErrors);
        setTerminalOutput(data.error ? `Error:\n${data.error}` : data.output || "Program finished with no output.");
      } else {
        const data = await res.json();
        setTerminalOutput(data.error || "Failed to run test.");
      }
    } catch (err) {
      setTerminalOutput("Failed to connect to execution server.");
    }
  }, [code, lang, setStdin]);

  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    ignoreHoverRef.current = false;
    if (resizingRef.current !== null && workspaceRef.current) {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const idx = resizingRef.current;
        if (idx === null || !workspaceRef.current) return;
        
        const rect = workspaceRef.current.getBoundingClientRect();
        
        setWindowFlexes(prev => {
          const totalWidth = rect.width;
          const totalFlex = prev.reduce((a, b) => a + b, 0);
          const totalGapsWidth = (prev.length - 1) * 12;
          const availableFlexWidth = totalWidth - totalGapsWidth;
          
          if (availableFlexWidth <= 0) return prev;
          const flexPerPx = totalFlex / availableFlexWidth;
          const relativeX = e.clientX - rect.left;
          const marginsBefore = idx * 12 + 6;
          const flexSpaceBefore = relativeX - marginsBefore;
          const currentFlexBefore = prev.slice(0, idx + 1).reduce((a, b) => a + b, 0);
          const targetFlexBefore = flexSpaceBefore * flexPerPx;
          const delta = targetFlexBefore - currentFlexBefore;
          
          const newFlexes = [...prev];
          if (newFlexes[idx] + delta > 0.1 && newFlexes[idx+1] - delta > 0.1) {
            newFlexes[idx] += delta;
            newFlexes[idx+1] -= delta;
            return newFlexes;
          }
          return prev;
        });

        if (editorRef.current && openWindows.includes("editor")) {
          editorRef.current.layout();
        }
      });
    } else if (terminalResizingRef.current) {
      if (rafRef.current) return;
      
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const deltaY = e.movementY;
        setTerminalHeight(prev => Math.max(40, Math.min(window.innerHeight * 0.8, prev - deltaY)));
        if (editorRef.current && openWindows.includes("editor")) editorRef.current.layout();
      });
    }
  }, [openWindows]);

  const handlePlayAsGuest = useCallback(() => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const name = `Guest Knight ${randomId}`;
    setGuestName(name);
    setIsGuest(true);
  }, []);

  const stopResizing = useCallback(() => {
    resizingRef.current = null;
    terminalResizingRef.current = false;
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = '';
  }, [handleMouseMove]);

  const startResizing = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    resizingRef.current = index;
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  };

  const startTerminalResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    terminalResizingRef.current = true;
    setIsDragging(true);
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

    if (id === "battle" && activeDuel && activeDuel.status === "WAITING") {
      setShowCancelDuel(true);
      return;
    }

    if (openWindows.includes(id)) {
      if (id === "editor") return;
      if (maximizedWindow === id) setMaximizedWindow(null);
      const idx = openWindows.indexOf(id);
      setOpenWindows(openWindows.filter(w => w !== id));
      const newFlexes = [...windowFlexes];
      newFlexes.splice(idx, 1);
      setWindowFlexes(newFlexes);
    } else {
      setOpenWindows([...openWindows, id]);
      setWindowFlexes([...windowFlexes, 1]);
    }
  }, [openWindows, windowFlexes, activeQuestion, testResults, activeDuel, maximizedWindow]);

  const moveWindow = (id: WindowId, direction: 'left' | 'right') => {
    ignoreHoverRef.current = true;
    setIsReordering(true);
    const index = openWindows.indexOf(id);
    const newWindows = [...openWindows];
    if (direction === 'left' && index > 0) {
      [newWindows[index - 1], newWindows[index]] = [newWindows[index], newWindows[index - 1]];
    } else if (direction === 'right' && index < openWindows.length - 1) {
      [newWindows[index + 1], newWindows[index]] = [newWindows[index], newWindows[index + 1]];
    }
    setOpenWindows(newWindows);
    // windowFlexes stays exactly as it is, so the sizes stay fixed to the positions
    setTimeout(() => setIsReordering(false), 300);
  };

  const handleDrop = (targetId: WindowId) => {
    if (!draggedWindow || draggedWindow === targetId) return;
    ignoreHoverRef.current = true;
    setIsReordering(true);
    const oldIndex = openWindows.indexOf(draggedWindow);
    const newIndex = openWindows.indexOf(targetId);
    const newWindows = [...openWindows];
    [newWindows[oldIndex], newWindows[newIndex]] = [newWindows[newIndex], newWindows[oldIndex]];
    setOpenWindows(newWindows);
    // windowFlexes stays exactly as it is
    setDraggedWindow(null);
    setTimeout(() => setIsReordering(false), 300);
  };

  const toggleMaximize = useCallback((id: WindowId) => {
    setMaximizedWindow(prev => prev === id ? null : id);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept Enter if focusing an input or textarea
      if (e.key === "Enter" && !e.altKey && (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA")) {
        return;
      }

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

      // Alt + t to toggle terminal
      if (e.altKey && e.key === "t") {
        e.preventDefault();
        setShowTerminal(prev => !prev);
      }

      // Explicitly disable Alt+1
      if (e.altKey && e.key === "1") {
        e.preventDefault();
      }

      // Alt + Left/Right to change focus
      if (e.altKey && !e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        const currentIndex = hoveredWindow ? openWindows.indexOf(hoveredWindow) : 0;
        let nextIndex = e.key === "ArrowLeft" ? currentIndex - 1 : currentIndex + 1;
        if (nextIndex < 0) nextIndex = openWindows.length - 1;
        if (nextIndex >= openWindows.length) nextIndex = 0;
        setHoveredWindow(openWindows[nextIndex]);
      }

      // Shift + Alt + Left/Right to swap windows
      if (e.altKey && e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        if (hoveredWindow) {
          moveWindow(hoveredWindow, e.key === "ArrowLeft" ? "left" : "right");
        }
      }

      // Shift + Alt + Up to maximize window
      if (e.altKey && e.shiftKey && e.key === "ArrowUp") {
        e.preventDefault();
        if (hoveredWindow) {
          toggleMaximize(hoveredWindow);
        }
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
  }, [vimMode, activeQuestion, hoveredWindow, runCode, runTests, openWindows, moveWindow, toggleWindow, maximizedWindow]);

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
            t={t}
          />
        );
      case "settings":
        return (
          <SettingsWindow 
            themeIndex={themeIndex} setThemeIndex={setThemeIndex} fontFamily={fontFamily} setFontFamily={setFontFamily}
            fontSize={fontSize} setFontSize={setFontSize} terminalFontSize={terminalFontSize} 
            setTerminalFontSize={setTerminalFontSize} vimMode={vimMode} setVimMode={setVimMode}
            uiLang={uiLang} setUiLang={setUiLang}
            animationSpeed={animationSpeed} setAnimationSpeed={setAnimationSpeed}
            t={t}
          />
        );

      case "battle":
        return (
          <BattleWindow 
            startBattle={startBattle} questions={questions}
            session={session} isGuest={isGuest} handlePlayAsGuest={handlePlayAsGuest}
            t={t} onDeleteQuestion={handleDeleteQuestion} onEditQuestion={onEditQuestion}
            createDuel={createDuel} joinDuel={joinDuel} activeDuel={activeDuel}
            setActiveDuel={setActiveDuel} setDuelPin={setDuelPin}
            showCancelDuel={showCancelDuel} setShowCancelDuel={setShowCancelDuel}
            handleCancelDuel={() => { 
              setActiveDuel(null); 
              setDuelPin(""); 
              setShowCancelDuel(false); 
              if (maximizedWindow === "battle") setMaximizedWindow(null);
              const idx = openWindows.indexOf("battle");
              if (idx !== -1) {
                setOpenWindows(openWindows.filter(w => w !== "battle")); 
                setWindowFlexes(prev => {
                  const next = [...prev];
                  next.splice(idx, 1);
                  return next;
                });
              }
            }}
          />
        );
      case "admin":
        return (
          <AdminWindow 
            newQuestion={newQuestion} setNewQuestion={setNewQuestion} 
            handleAddQuestion={handleAddQuestion} handleUpdateQuestion={handleUpdateQuestion}
            t={t} error={adminError} setError={setAdminError}
            questions={questions} onDeleteQuestion={handleDeleteQuestion}
          />
        );
      case "problem":
        return (
          <ProblemWindow 
            activeQuestion={activeQuestion} testResults={testResults} showQuitConfirmation={showQuitConfirmation}
            setShowQuitConfirmation={setShowQuitConfirmation} 
            handleQuitBattle={async () => {
              if (activeDuel && activeDuel.status === "ACTIVE") {
                try {
                  await fetch("/api/duels/submit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ duelId: activeDuel.id, surrender: true })
                  });
                  // After surrendering, the status will become FINISHED.
                  // We'll let the polling or the next fetch update the UI.
                  // But for immediate feedback, we can just close the confirmation.
                  setShowQuitConfirmation(false);
                  return;
                } catch (err) {
                  console.error("Failed to surrender:", err);
                }
              }

              setActiveQuestion(null);
              setTestResults(null);
              setAnalysis(null);
              setActiveDuel(null);
              setDuelPin("");
              setShowQuitConfirmation(false);
              if (maximizedWindow === "problem") setMaximizedWindow(null);
              const idx = openWindows.indexOf("problem");
              if (idx !== -1) {
                setOpenWindows(openWindows.filter(w => w !== "problem"));
                setWindowFlexes(prev => {
                  const next = [...prev];
                  next.splice(idx, 1);
                  return next;
                });
              }
            }}

            runTests={runTests} isTesting={isTesting} setStdin={setStdin} setShowTerminal={setShowTerminal}
            setTerminalOutput={setTerminalOutput} solveTime={solveTime} lang={lang}
            startNewBattle={() => { 
              setActiveQuestion(null); 
              setTestResults(null); 
              setAnalysis(null); 
              setActiveDuel(null);
              setDuelPin("");
              if (maximizedWindow === "problem") setMaximizedWindow(null);
              setOpenWindows(prev => prev.filter(w => w !== "problem").concat("battle"));
              // windowFlexes stays the same length as we replaced one with another
            }}
            runSingleTest={runSingleTest}
            t={t}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            activeDuel={activeDuel}
            timeLeft={timeLeft}
            setActiveDuel={setActiveDuel}
            setDuelPin={setDuelPin}
          />
        );
      case "profile":
        return <ProfileWindow session={session} userStats={userStats} t={t} />;
      case "contests":
        return <ContestWindow questions={questions} t={t} isAdmin={!!session?.user?.isAdmin} />;
      case "leaderboard": return <div style={{ padding: '1.5rem' }}><h2>Global</h2><div style={{ marginTop: '1rem' }}>1. tourist (3842)</div></div>;
      case "discuss": return <div style={{ padding: '1.5rem' }}><h2>Discussion</h2><div style={{ marginTop: '1rem' }}>How to learn DP?</div></div>;
      case "friends": return <div style={{ padding: '1.5rem' }}><h2>Friends</h2><p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>You have no friends yet.</p></div>;
      default: return null;
    }
  };

  return (
    <div className="main-header" onMouseMove={(e) => handleMouseMove(e as any)} onMouseUp={() => stopResizing()}>
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
          <Link href="/" className="brand" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div 
              style={{ 
                height: '40px', 
                width: '60px',
                backgroundColor: 'var(--accent)',
                WebkitMaskImage: 'url(/assets/logo_white.png)',
                maskImage: 'url(/assets/logo_white.png)',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                filter: 'drop-shadow(0 0 10px var(--accent))'
              }}
            />
            <span style={{ fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.02em' }}><span style={{ color: 'var(--accent)' }}>Code</span> Knights</span>
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
            {(session || isGuest) ? (
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0.4rem', borderRadius: '0.3rem' }}
                  className="btn-ghost"
                >
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isGuest ? guestName : ((session?.user as any)?.username || session?.user?.name)}</span>
                  {session?.user?.image ? (
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
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{isGuest ? guestName : ((session?.user as any)?.username || session?.user?.name)}</div>
                          {!isGuest && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session?.user?.email}</div>}
                        </div>

                        {!isGuest && (
                          <>
                            <button onClick={() => { toggleWindow("profile"); setIsProfileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: 'none', color: 'inherit', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={14} /><span style={{ fontSize: '0.85rem' }}>{t("profileOverview")}</span></div>
                              <ChevronRight size={12} />
                            </button>

                            {(session?.user as any)?.isAdmin && (
                              <button onClick={() => { toggleWindow("admin"); setIsProfileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: 'none', color: 'var(--accent)', background: 'rgba(122, 162, 247, 0.05)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Database size={14} /><span style={{ fontSize: '0.85rem' }}>{t("admin")}</span></div>
                                <ChevronRight size={12} />
                              </button>
                            )}

                            <Link href="/settings/profile" onClick={() => setIsProfileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', textDecoration: 'none', color: 'inherit', background: 'rgba(255,255,255,0.02)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={14} /><span style={{ fontSize: '0.85rem' }}>{t("configureProfile")}</span></div>
                              <ChevronRight size={12} />
                            </Link>
                            </>
                            )}

                            {isGuest && (
                            <button onClick={() => signIn()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: 'none', color: 'inherit', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><LogIn size={14} /><span style={{ fontSize: '0.85rem' }}>{t("signIn")}</span></div>
                            <ChevronRight size={12} />
                            </button>
                            )}

                            <button onClick={() => isGuest ? setIsGuest(false) : signOut()} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: 'none', color: '#ff5555', background: 'rgba(255, 85, 85, 0.05)', cursor: 'pointer', textAlign: 'left' }}>
                            <LogOut size={14} /><span style={{ fontSize: '0.85rem' }}>{isGuest ? t("exitGuest") : t("signOut")}</span>
                            </button>                      </motion.div>
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
          {openWindows
            .filter(id => (maximizedWindow && openWindows.includes(maximizedWindow)) ? id === maximizedWindow : true)
            .map((id, idx) => {
            const navItem = navLinks.find(l => l.id === id);
            let icon = navItem?.icon;
            if (id === 'editor') icon = <Code size={16} />;
            if (id === 'settings') icon = <Settings size={16} />;
            if (id === 'battle') icon = <Sword size={16} />;
            if (id === 'friends') icon = <Users size={16} />;
            if (id === 'problem') icon = <Target size={16} />;
            if (id === 'admin') icon = <Database size={16} />;
            
            const isMax = id === maximizedWindow;

            return (
              <React.Fragment key={id}>
                <motion.section 
                  key={id}
                  layout={animationSpeed !== "none" && !isDragging}
                  initial={
                    animationSpeed === "none" ? false : 
                    animationSpeed === "erased" ? { clipPath: 'inset(0% 100% 0% 0%)', opacity: 0 } :
                    animationSpeed === "flip" ? { rotateY: 90, opacity: 0 } :
                    animationSpeed === "glitch" ? { x: 50, skewX: 20, opacity: 0 } :
                    { opacity: 0, scale: 0.95 }
                  }
                  animate={{ 
                    opacity: (animationSpeed === "ghost" && isReordering) ? 0.4 : 1, 
                    scale: isReordering ? (animationSpeed === "boing" ? 1.1 : 0.98) : 1,
                    rotate: isReordering ? (animationSpeed === "jello" ? 2 : (animationSpeed === "boing" ? -2 : 0)) : 0,
                    rotateY: 0,
                    x: 0,
                    skewX: 0,
                    clipPath: 'inset(0% 0% 0% 0%)',
                    y: isReordering ? (
                      animationSpeed === "float" ? -20 : 
                      animationSpeed === "swapVertical" ? (id.length % 2 === 0 ? -150 : 150) : 0
                    ) : 0,
                    zIndex: draggedWindow === id ? 50 : 1,
                    boxShadow: isReordering ? "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)" : "none"
                  }}
                  exit={
                    animationSpeed === "none" ? { opacity: 0 } : 
                    animationSpeed === "erased" ? { clipPath: 'inset(0% 0% 0% 100%)', opacity: 0 } :
                    animationSpeed === "flip" ? { rotateY: -90, opacity: 0 } :
                    animationSpeed === "glitch" ? { x: -50, skewX: -20, opacity: 0 } :
                    { opacity: 0, scale: 0.95 }
                  }
                  transition={{ 
                    layout: getTransition(),
                    scale: { duration: animationSpeed === "none" ? 0 : 0.1 },
                    opacity: { duration: animationSpeed === "none" ? 0 : 0.1 }
                  }}
                  className={`twm-window ${draggedWindow === id ? 'twm-window--dragging' : ''}`}
                  style={{ flex: isMax ? 1 : (windowFlexes[idx] || 1) }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(id)}
                  onMouseEnter={() => {
                    if (!ignoreHoverRef.current) setHoveredWindow(id);
                  }}
                  onMouseLeave={() => {
                    if (!ignoreHoverRef.current) setHoveredWindow(prev => prev === id ? null : prev);
                  }}
                >
                  <div className="twm-window-header" draggable={!isMax} onDragStart={() => setDraggedWindow(id)} onDragEnd={() => setDraggedWindow(null)} style={{ cursor: isMax ? 'default' : 'grab' }}>
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
                      {!(id === 'editor' && openWindows.length === 1) && (
                        <button className="twm-btn" onClick={() => toggleMaximize(id)} title={isMax ? "Restore" : "Maximize"}>
                          {isMax ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                      )}
                      {!isMax && openWindows.length > 1 && (
                        <>
                          <button className="twm-btn" onClick={() => moveWindow(id, 'left')}><ArrowLeft size={14} /></button>
                          <button className="twm-btn" onClick={() => moveWindow(id, 'right')}><ArrowRight size={14} /></button>
                        </>
                      )}
                      {id !== 'editor' && <button className="twm-btn" onClick={() => toggleWindow(id)}><X size={14} /></button>}
                    </div>
                  </div>
                  <div className="twm-content" style={{ overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {renderWindowContent(id)}
                    </div>
                  </div>
                </motion.section>
                {!maximizedWindow && idx < openWindows.length - 1 && <div className="twm-resizer" onMouseDown={(e) => startResizing(e, idx)} />}
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MainMenu;
