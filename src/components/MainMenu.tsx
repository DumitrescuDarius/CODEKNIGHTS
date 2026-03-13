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
import { TournamentWindow } from "./windows/TournamentWindow";
import { FriendsWindow } from "./windows/FriendsWindow";

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
    if (animationSpeed === "smooth") return { type: "spring", stiffness: 400, damping: 50, mass: 1 };
    if (animationSpeed === "bouncy") return { type: "spring", stiffness: 500, damping: 20, mass: 1 };
    if (animationSpeed === "elastic") return { type: "spring", stiffness: 400, damping: 10, mass: 1 };
    if (animationSpeed === "dramatic") return { type: "spring", stiffness: 60, damping: 25, mass: 1.5 };
    if (animationSpeed === "snappy") return { type: "spring", stiffness: 1000, damping: 60, mass: 1 };
    if (animationSpeed === "jello") return { type: "spring", stiffness: 500, damping: 8, mass: 1 };
    if (animationSpeed === "lazy") return { type: "spring", stiffness: 120, damping: 40, mass: 1.5 };
    if (animationSpeed === "ghost") return { type: "spring", stiffness: 300, damping: 40, mass: 1 };
    if (animationSpeed === "teleport") return { type: "spring", stiffness: 2000, damping: 120, mass: 1 };
    if (animationSpeed === "boing") return { type: "spring", stiffness: 800, damping: 15, mass: 1.2 };
    if (animationSpeed === "float") return { type: "spring", stiffness: 60, damping: 20, mass: 1 };
    if (animationSpeed === "erased") return { type: "tween", ease: "easeInOut", duration: 0.4 };
    if (animationSpeed === "flip") return { type: "spring", stiffness: 350, damping: 25, mass: 1 };
    if (animationSpeed === "glitch") return { type: "spring", stiffness: 1000, damping: 12, mass: 0.5 };
    if (animationSpeed === "swapVertical") return { type: "spring", stiffness: 450, damping: 30, mass: 1 };
    if (animationSpeed === "six seven") return { type: "spring", stiffness: 150, damping: 5, mass: 1 };
    return { type: "spring", stiffness: 500, damping: 40, mass: 1 };
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

  const navLinks = useMemo(() => {
    const links = [
      { label: t("battle"), id: "battle" as WindowId, icon: <Sword size={16} /> },
      { label: t("tournaments"), id: "tournaments" as WindowId, icon: <Trophy size={16} /> },
      { label: t("friends"), id: "friends" as WindowId, icon: <Users size={16} /> },
    ];
    
    if (!session) {
      return links.filter(link => link.id === "battle");
    }
    
    return links;
  }, [t, session, isGuest]);

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
    if (!finalWindows.includes("editor")) finalWindows.unshift("editor");
    setOpenWindows(finalWindows);
    
    if (savedFlexes.length === finalWindows.length) setWindowFlexes(savedFlexes);
    else setWindowFlexes(finalWindows.map(() => 1));
    
    setTimeout(() => setIsLoaded(true), 800);
  }, []);

  // PERSISTENCE EFFECT
  useEffect(() => {
    if (!isLoaded) return;
    
    const timeout = setTimeout(() => {
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
    }, 500);

    return () => clearTimeout(timeout);
  }, [lang, code, openWindows, windowFlexes, themeIndex, fontSize, fontFamily, terminalFontSize, vimMode, terminalHeight, stdin, isLoaded, uiLang]);

  // CSS VARIABLES EFFECT
  useEffect(() => {
    if (!isLoaded) return;
    
    const theme = THEMES[themeIndex];
    const root = document.documentElement;
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--line', theme.line);
    root.style.setProperty('--window-bg', theme.bg);

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "122, 162, 247";
    };
    root.style.setProperty('--accent-rgb', hexToRgb(theme.accent));

    const isLightTheme = theme.light;
    root.style.setProperty('--text', isLightTheme ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)');
    root.style.setProperty('--text-muted', isLightTheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)');
    root.style.setProperty('--header-bg', isLightTheme ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)');
  }, [themeIndex, isLoaded]);

  // MONACO THEME EFFECT
  useEffect(() => {
    if (!isLoaded) return;
    
    const theme = THEMES[themeIndex];
    const isLightTheme = theme.light;

    loader.init().then(monaco => {
      // Register C++ completion provider once
      if (!(monaco.languages as any).cppRegistered) {
        monaco.languages.registerCompletionItemProvider('cpp', {
          provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
            return { suggestions: CPP_STL.map(item => ({ label: item, kind: monaco.languages.CompletionItemKind.Keyword, insertText: item, range })) };
          }
        });
        (monaco.languages as any).cppRegistered = true;
      }

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
  }, [themeIndex, isLoaded]);

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
        const data = await res.json().catch(() => ({}));
        setTerminalOutput(data.error || `Server returned ${res.status}: ${res.statusText}`);
      }
    } catch (err: any) {
      setTerminalOutput(`Network Error: ${err.message || "Failed to connect to execution server."}`);
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
    
    setOpenWindows(prev => {
      if (!prev.includes("admin")) {
        setWindowFlexes(f => [...f, 1]);
        return [...prev, "admin"];
      }
      return prev;
    });
  }, []);

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
    
    if (maximizedWindow === "battle") setMaximizedWindow(null);

    setOpenWindows(prev => {
      let next = prev.filter(w => w !== "battle");
      if (!next.includes("problem")) next.push("problem");
      if (!next.includes("editor")) next.unshift("editor");
      
      setWindowFlexes(next.map(w => w === "editor" ? 1.5 : 1));
      return next;
    });
  }, [questions, maximizedWindow]);

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
          if (data.compileErrors) {
            setCompileErrors(data.compileErrors);
            setTerminalOutput(`Compilation Error:\n${data.error}`);
            setIsTesting(false);
            return;
          }
          const isCorrect = data.output?.trim() === tc.output?.trim();
          if (isCorrect) passed++;
          details.push({ input: tc.input, expected: tc.output, actual: data.output, passed: isCorrect });
        }
      }
      
      setTestResults({ passed, total: allTests.length, details });
      if (passed === allTests.length) {
        const time = Math.floor((Date.now() - (battleStartTime || Date.now())) / 1000);
        const mins = Math.floor(time / 60);
        const secs = time % 60;
        const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
        setSolveTime(formatted);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);

        analyzeCode(code, lang, activeQuestion.description);
        fetchUserStats();

        if (activeDuel && activeDuel.status === "ACTIVE") {
          await fetch("/api/duels/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ duelId: activeDuel.id, solveTime: time * 1000 })
          });
        }
      }
    } catch (err: any) {
      setTerminalOutput(`Network Error: ${err.message || "Failed to connect to execution server."}`);
      console.error(err);
    } finally {
      setIsTesting(false);
    }
  }, [activeQuestion, code, lang, battleStartTime, analyzeCode, fetchUserStats, activeDuel]);

  const runSingleTest = useCallback(async (input: string, index: number) => {
    setIsRunning(true);
    setShowTerminal(true);
    setTerminalOutput(`Running Example ${index + 1}...`);
    try {
      const res = await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, language: lang, stdin: input }) });
      if (res.ok) {
        const data = await res.json();
        setTerminalOutput(data.error ? `Error:\n${data.error}` : data.output || "Program finished with no output.");
      } else {
        const data = await res.json().catch(() => ({}));
        setTerminalOutput(data.error || `Server returned ${res.status}: ${res.statusText}`);
      }
    } catch (err: any) {
      setTerminalOutput(`Network Error: ${err.message || "Failed to connect to execution server."}`);
    } finally {
      setIsRunning(false);
    }
  }, [code, lang]);

  const handleRevert = () => {
    if (confirm("Revert to default code for this language?")) {
      setCode(LANG_CONFIG[lang].defaultCode);
    }
  };

  const handleBeautify = async () => {
    // Basic beautify logic or call an API
    console.log("Beautify requested");
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (resizingRef.current !== null) {
      const index = resizingRef.current;
      const movementX = e.movementX;
      
      setWindowFlexes(prev => {
        const next = [...prev];
        const totalFlex = next[index] + next[index + 1];
        const factor = 0.002;
        const change = movementX * factor;
        
        const newLeftFlex = Math.max(0.2, Math.min(totalFlex - 0.2, next[index] + change));
        const newRightFlex = totalFlex - newLeftFlex;
        
        next[index] = newLeftFlex;
        next[index + 1] = newRightFlex;
        return next;
      });
    }

    if (terminalResizingRef.current) {
      const movementY = e.movementY;
      window.requestAnimationFrame(() => {
        setTerminalHeight(prev => Math.max(40, Math.min(window.innerHeight * 0.8, prev - movementY)));
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
    document.body.style.cursor = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isDragging, handleMouseMove, stopResizing]);

  const startResizing = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    resizingRef.current = index;
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
  };

  const startTerminalResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    terminalResizingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = 'ns-resize';
  }, []);

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

    setOpenWindows(prev => {
      const isClosing = prev.includes(id);
      if (isClosing) {
        if (id === "editor") return prev;
        const idx = prev.indexOf(id);
        setWindowFlexes(flexes => {
          const next = [...flexes];
          if (idx !== -1 && next.length > idx) {
            next.splice(idx, 1);
          }
          return next;
        });
        if (maximizedWindow === id) setMaximizedWindow(null);
        const nextWindows = prev.filter(w => w !== id);
        // Safety: always ensure editor is there
        if (!nextWindows.includes("editor")) nextWindows.unshift("editor");
        return nextWindows;
      } else {
        setWindowFlexes(flexes => [...flexes, 1]);
        if (maximizedWindow) setMaximizedWindow(null);
        const nextWindows = [...prev, id];
        if (!nextWindows.includes("editor")) nextWindows.unshift("editor");
        return nextWindows;
      }
    });
  }, [activeQuestion, testResults, activeDuel, maximizedWindow]);

  const moveWindow = (id: WindowId, direction: 'left' | 'right') => {
    ignoreHoverRef.current = true;
    setIsReordering(true);
    setOpenWindows(prev => {
      const index = prev.indexOf(id);
      if (index === -1) return prev;
      const next = [...prev];
      if (direction === 'left' && index > 0) {
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
      } else if (direction === 'right' && index < next.length - 1) {
        [next[index + 1], next[index]] = [next[index], next[index + 1]];
      }
      return next;
    });
    setTimeout(() => setIsReordering(false), 300);
  };

  const handleDrop = (targetId: WindowId) => {
    if (!draggedWindow || draggedWindow === targetId) return;
    ignoreHoverRef.current = true;
    setIsReordering(true);
    setOpenWindows(prev => {
      const oldIndex = prev.indexOf(draggedWindow);
      const newIndex = prev.indexOf(targetId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = [...prev];
      [next[oldIndex], next[newIndex]] = [next[newIndex], next[oldIndex]];
      return next;
    });
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
  }, [vimMode, runCode]);

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
            isResizing={isDragging}
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
              
              setOpenWindows(prev => {
                const idx = prev.indexOf("battle");
                if (idx !== -1) {
                  setWindowFlexes(flexes => {
                    const next = [...flexes];
                    next.splice(idx, 1);
                    return next;
                  });
                  const nextWindows = prev.filter(w => w !== "battle");
                  if (!nextWindows.includes("editor")) nextWindows.unshift("editor");
                  return nextWindows;
                }
                return prev;
              });
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

              setOpenWindows(prev => {
                const idx = prev.indexOf("problem");
                if (idx !== -1) {
                  setWindowFlexes(flexes => {
                    const next = [...flexes];
                    next.splice(idx, 1);
                    return next;
                  });
                  const nextWindows = prev.filter(w => w !== "problem");
                  if (!nextWindows.includes("editor")) nextWindows.unshift("editor");
                  return nextWindows;
                }
                return prev;
              });
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
              setOpenWindows(prev => {
                const next = prev.filter(w => w !== "problem");
                if (!next.includes("battle")) next.push("battle");
                if (!next.includes("editor")) next.unshift("editor");
                // windowFlexes stays the same length as we replaced problem with battle
                return next;
              });
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
      case "tournaments":
        return <TournamentWindow questions={questions} t={t} isAdmin={!!session?.user?.isAdmin} />;
      case "leaderboard": return <div style={{ padding: '1.5rem' }}><h2>Global</h2><div style={{ marginTop: '1rem' }}>1. tourist (3842)</div></div>;
      case "friends": return <FriendsWindow t={t} />;
      default: return null;
    }
  };

  const renderedWindows = openWindows
    .filter(id => {
      // Only allow certain windows if not logged in
      if (!session) {
        return ["editor", "settings", "battle", "problem"].includes(id);
      }
      return true;
    })
    .filter(id => (maximizedWindow && openWindows.includes(maximizedWindow)) ? id === maximizedWindow : true);

  return (
    <div className="main-header">
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
          <Link href="/" className="brand" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <div 
              style={{ 
                height: '40px', 
                width: '48px',
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
            <span style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>CODE<span style={{ color: 'var(--accent)' }}>KNIGHTS</span></span>
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
        <AnimatePresence>
          {renderedWindows.map((id, idx) => {
            const navItem = navLinks.find(l => l.id === id);
            let icon = navItem?.icon;
            if (id === 'editor') icon = <Code size={16} />;
            if (id === 'settings') icon = <Settings size={16} />;
            if (id === 'battle') icon = <Sword size={16} />;
            if (id === 'friends') icon = <Users size={16} />;
            if (id === 'problem') icon = <Target size={16} />;
            if (id === 'admin') icon = <Database size={16} />;
            
            const isMax = id === maximizedWindow;
            const originalIdx = openWindows.indexOf(id);

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
                    ) : (animationSpeed === "six seven" ? (idx % 2 === 0 ? [-10, 10, -10] : [10, -10, 10]) : 0),
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
                    layout: (isReordering && animationSpeed === "six seven") ? { type: "spring", stiffness: 500, damping: 40, mass: 1 } : getTransition(),
                    scale: { duration: animationSpeed === "none" ? 0 : 0.1 },
                    opacity: { duration: animationSpeed === "none" ? 0 : 0.1 },
                    y: (animationSpeed === "six seven" && !isReordering) ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : { duration: 0.1 }
                  }}
                  className={`twm-window ${draggedWindow === id ? 'twm-window--dragging' : ''}`}
                  style={{ flex: isMax ? 1 : (windowFlexes[originalIdx] || 1) }}
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
                    <motion.div 
                      layout={animationSpeed !== "none" && !isDragging}
                      transition={getTransition()}
                      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
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
                        {!isMax && renderedWindows.length > 1 && (
                          <>
                            <button className="twm-btn" onClick={() => moveWindow(id, 'left')}><ArrowLeft size={14} /></button>
                            <button className="twm-btn" onClick={() => moveWindow(id, 'right')}><ArrowRight size={14} /></button>
                          </>
                        )}
                        {id !== 'editor' && <button className="twm-btn" onClick={() => toggleWindow(id)}><X size={14} /></button>}
                      </div>
                    </motion.div>
                  </div>
                  <div className="twm-content" style={{ overflow: 'hidden' }}>
                    <motion.div 
                      layout={animationSpeed !== "none" && !isDragging}
                      transition={getTransition()}
                      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                      {renderWindowContent(id)}
                    </motion.div>
                  </div>
                </motion.section>
                {!maximizedWindow && idx < renderedWindows.length - 1 && (
                  <motion.div 
                    key={`resizer-${id}-${renderedWindows[idx+1]}`}
                    layout={animationSpeed !== "none" && !isDragging}
                    transition={getTransition()}
                    className="twm-resizer" 
                    onMouseDown={(e) => startResizing(e, idx)} 
                  />
                )}
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MainMenu;
