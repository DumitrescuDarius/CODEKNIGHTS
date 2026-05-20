"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { loader } from "@monaco-editor/react";
import { Settings, Code, Trophy, ArrowLeft, ArrowRight, X, Sword, User, LogOut, ChevronRight, Users, RotateCcw, Wand2, Target, Play, Database, Maximize2, Minimize2, LogIn, AlertCircle } from "lucide-react";
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
import { AgentWindow } from "./windows/AgentWindow";
import { Transition } from "framer-motion";

declare global {
  interface Window {
    ck_current_code: string;
  }
}

type ResizeSession = {
  leftFlexIdx: number;
  rightFlexIdx: number;
  startClientX: number;
  startLeftWidth: number;
  pairPixelWidth: number;
  pairFlex: number;
  minLeftPx: number;
  minRightPx: number;
};

function readMinWidthPx(el: HTMLElement): number {
  const raw = getComputedStyle(el).minWidth;
  const px = parseFloat(raw);
  return Number.isFinite(px) && px > 0 ? px : 352;
}

interface TestDetail {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

interface CompileError {
  line: number;
  column: number;
  message: string;
}

interface CodeAnalysisScores {
  efficiency: number;
  readability: number;
  maintainability: number;
  security: number;
}

interface CodeAnalysis {
  timeComplexity?: string;
  spaceComplexity?: string;
  complexityExplanation?: string;
  meetsComplexityRequirements?: boolean | null;
  scores?: CodeAnalysisScores;
  feedback?: string;
  error?: string;
  details?: string;
  quotaExceeded?: boolean;
}

interface Duel {
  id: string;
  pin: string;
  status: "WAITING" | "ACTIVE" | "FINISHED";
  question: Question;
  players: { id: string; name: string; image?: string }[];
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
  const { data: session } = useSession();
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
  const [adminError, setAdminError] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [testResults, setTestResults] = useState<{ passed: number, total: number, details: TestDetail[] } | null>(null);
  const [totalPenalty, setTotalPenalty] = useState<number | null>(null);
  const [wrongAttemptCount, setWrongAttemptCount] = useState(0);

  const complexityToScore = (complexity: string) => {
    const c = complexity.toLowerCase().replace(/\s/g, '');
    if (c === "o(1)") return 0;
    if (c === "o(logn)") return 1;
    if (c === "o(n)") return 2;
    if (c === "o(nlogn)") return 3;
    if (c === "o(n^2)") return 4;
    if (c === "o(n^3)") return 5;
    return 0; // Default
  };

  const calculatePenalty = useCallback((timeSeconds: number, wrongAttempts: number, compScores: CodeAnalysisScores | undefined) => {
      const timePenalty = timeSeconds;
      const waPenalty = wrongAttempts * 50;
      const complexityPenalty = (compScores ? (compScores.efficiency + compScores.readability + compScores.maintainability + compScores.security) : 0) * 1;

      return timePenalty + waPenalty + complexityPenalty;
  }, []);
  const retryProblem = useCallback(() => {
    setTestResults(null);
    setWrongAttemptCount(0);
    setTotalPenalty(null);
    setSolveTime(null);
    setBattleStartTime(Date.now());
  }, []);
  
  const [isTesting, setIsTesting] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({ battlesWon: 0, battlesTotal: 0 });
  const [showQuitConfirmation, setShowQuitConfirmation] = useState(false);
  const [showCancelDuel, setShowCancelDuel] = useState(false);
  const [battleStartTime, setBattleStartTime] = useState<number | null>(null);
  const [solveTime, setSolveTime] = useState<string | null>(null);
  const [hoveredWindow, setHoveredWindow] = useState<WindowId | null>(null);
  const [activeWindow, setActiveWindow] = useState<WindowId>("editor");
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  const [compileErrors, setCompileErrors] = useState<CompileError[]>([]);
  const [maximizedWindow, setMaximizedWindow] = useState<WindowId | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [uiLang, setUiLang] = useState<SupportedLanguage>("en");
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeDuel, setActiveDuel] = useState<Duel | null>(null);
  const activeDuelRef = useRef<Duel | null>(null);
  
  useEffect(() => {
    activeDuelRef.current = activeDuel;
  }, [activeDuel]);

  const [duelPin, setDuelPin] = useState<string>("");
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>("snappy");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [showWrongAnswerPopup, setShowWrongAnswerPopup] = useState(false);
  const [showRatingChangePopup, setShowRatingChangePopup] = useState<{ amount: number, isWin: boolean } | null>(null);
  const lastFinishedDuelId = useRef<string | null>(null);

  useEffect(() => {
    if (showRatingChangePopup) {
      const timer = setTimeout(() => setShowRatingChangePopup(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [showRatingChangePopup]);

  const [showWaitingPopup, setShowWaitingPopup] = useState(false);
  const [showOpponentFoundPopup, setShowOpponentFoundPopup] = useState(false);

  useEffect(() => {
    if (showLimitWarning) {
      const timer = setTimeout(() => setShowLimitWarning(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showLimitWarning]);

  useEffect(() => {
    if (showWrongAnswerPopup) {
      const timer = setTimeout(() => setShowWrongAnswerPopup(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showWrongAnswerPopup]);

  // showWaitingPopup does NOT auto-hide because we need the PIN to stay visible.
  // It is manually cleared when an opponent is found or duel is cancelled.

  useEffect(() => {
    if (showOpponentFoundPopup) {
      const timer = setTimeout(() => setShowOpponentFoundPopup(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showOpponentFoundPopup]);

  useEffect(() => {
    const saved = localStorage.getItem('animationSpeed') as AnimationSpeed;
    if (saved) setAnimationSpeed(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('animationSpeed', animationSpeed);
  }, [animationSpeed]);

  const getTransition = (): Transition => {
    if (animationSpeed === "none") return { type: "tween", duration: 0 };
    if (animationSpeed === "smooth") return { type: "spring", stiffness: 120, damping: 25, mass: 1 };
    if (animationSpeed === "bouncy") return { type: "spring", stiffness: 500, damping: 20, mass: 1 };
    if (animationSpeed === "elastic") return { type: "spring", stiffness: 400, damping: 10, mass: 1 };
    if (animationSpeed === "dramatic") return { type: "spring", stiffness: 60, damping: 25, mass: 1.5 };
    if (animationSpeed === "snappy") return { type: "spring", stiffness: 350, damping: 25, mass: 1 };
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
    return { type: "spring", stiffness: 350, damping: 25, mass: 1 };
  };

  const t = useCallback((key: TranslationKey): string => {
    return (TRANSLATIONS[uiLang] as Record<string, string>)[key] || (TRANSLATIONS["en"] as Record<string, string>)[key] || key;
  }, [uiLang]);

  const analyzeCode = useCallback(async (currentCode: string, currentLang: string, question: Question | null) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    const isProblem = Boolean(question);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentCode,
          language: currentLang,
          analyzeContext: isProblem ? "problem" : "general",
          problemTitle: question?.title ?? "",
          problemDescription: question?.description ?? "",
          problemRestrictions: question?.restrictions ?? "",
          problemDifficulty: question?.difficulty ?? "",
        }),
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setAnalysis(data as CodeAnalysis);
      } else {
        setAnalysis({
          error: typeof data.error === "string" ? data.error : "Analysis failed",
          details: typeof data.details === "string" ? data.details : undefined,
          quotaExceeded: res.status === 429,
        });
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      setAnalysis({
        error: err instanceof Error ? err.message : "Failed to connect to analysis service.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const analyzeProblemComplexity = useCallback(() => {
    if (!activeQuestion) return;
    analyzeCode(code, lang, activeQuestion);
  }, [activeQuestion, code, lang, analyzeCode]);

  const workspaceRef = useRef<HTMLElement>(null);
  const resizeSessionRef = useRef<ResizeSession | null>(null);
  const terminalResizingRef = useRef<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vimModeRef = useRef<any>(null);
  const vimStatusBarRef = useRef<HTMLDivElement>(null);
  const ignoreHoverRef = useRef(false);

  const navLinks = useMemo(() => {
    const links = [
      { label: t("battle"), id: "battle" as WindowId, icon: <Sword size={16} /> },
      { label: t("agent"), id: "agent" as WindowId, icon: <Wand2 size={16} /> },
      { label: t("friends"), id: "friends" as WindowId, icon: <Users size={16} /> },
    ];
    
    if (!session) {
      return links.filter(link => link.id === "battle");
    }
    
    return links;
  }, [t, session]);

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
            battlesTotal: data.battlesTotal || 0,
            rating: data.rating || 1000,
            dailyWins: data.dailyWins || {}
          });
          // Update session-like data for children that depend on it
          if (session.user) {
            (session.user as any).rating = data.rating;
            (session.user as any).dailyWins = data.dailyWins;
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, [session]);

  const createDuel = useCallback(async () => {
    try {
      const res = await fetch("/api/duels", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName: isGuest ? guestName : undefined })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.pin) {
          setDuelPin(data.pin);
          setActiveDuel(data);
        } else {
          console.error(data.error || "Failed to create duel");
        }
      } else {
        console.error(data.error || "Failed to create duel");
      }
    } catch (err) {
      console.error(err);
    }
  }, [isGuest, guestName]);

  const joinDuel = useCallback(async (pin: string) => {
    try {
      const res = await fetch("/api/duels/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, guestName: isGuest ? guestName : undefined })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.id) {
          setShowOpponentFoundPopup(true);
          setShowWaitingPopup(false);
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
  }, [isGuest, guestName]);

  const pollDuel = useCallback(async () => {
    if (!activeDuel || activeDuel.status === "FINISHED") return;
    try {
      const res = await fetch(`/api/duels/poll?pin=${activeDuel.pin}`);
      if (res.ok) {
        const data = await res.json();
        
        // If the component state was cleared (surrender) while this fetch was in flight, 
        // ignore the result to prevent re-opening the window.
        if (activeDuelRef.current === null) return;

        if (data.id) {
          // Merge partial polled data with the existing full duel object
          const updatedDuel = { ...activeDuel, ...data };
          
          console.log("[MainMenu] Polled duel data:", updatedDuel);
          if (updatedDuel.status === "FINISHED" && lastFinishedDuelId.current !== updatedDuel.id) {
            lastFinishedDuelId.current = updatedDuel.id;
            const userId = session?.user ? (session.user as any).id : "guest";
            const isHost = updatedDuel.hostId === userId;
            const change = isHost ? updatedDuel.hostRatingChange : updatedDuel.guestRatingChange;
            console.log("[MainMenu] Duel finished. userId:", userId, "isHost:", isHost, "change:", change);
            if (change !== null && change !== undefined) {
              // Always show popup if change is not 0
              if (change !== 0) {
                  setShowRatingChangePopup({ amount: change, isWin: change > 0 });
              }
              fetchUserStats();
            }
          }

          if (activeDuel && activeDuel.status !== 'ACTIVE' && updatedDuel.status === 'ACTIVE') {
            setShowOpponentFoundPopup(true);
            setShowWaitingPopup(false);
          }
          setActiveDuel(updatedDuel);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeDuel, session, fetchUserStats]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (activeDuel && activeDuel.status !== "FINISHED") {
      interval = setInterval(pollDuel, 200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDuel, pollDuel]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (activeDuel && (activeDuel.status === "ACTIVE" || activeDuel.status === "WAITING") && !solveTime) {
      const difficultyTimeLimits: Record<string, number> = {
        "Easy": 8 * 60,
        "Medium": 12 * 60,
        "Hard": 18 * 60
      };
      const limit = difficultyTimeLimits[activeDuel.question?.difficulty] || 8 * 60;
      const startTime = new Date(activeDuel.createdAt).getTime();

      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = limit - elapsed;
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
  }, [activeDuel, solveTime]);




  useEffect(() => {
    const savedLang = localStorage.getItem("ck-lang") as Language;
    if (savedLang) setLang(savedLang);
    const savedCode = localStorage.getItem("ck-code");
    if (savedCode) setCode(savedCode);
    const savedWindows = JSON.parse(localStorage.getItem("ck-windows") || '["editor"]');
    const savedTheme = localStorage.getItem("ck-theme-idx");
    const savedFlexes = JSON.parse(localStorage.getItem("ck-flexes") || '[]');
    const savedFontSize = localStorage.getItem("ck-font-size");
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    const savedFontFamily = localStorage.getItem("ck-font-family");
    if (savedFontFamily) setFontFamily(savedFontFamily);
    const savedTermFontSize = localStorage.getItem("ck-term-font-size");
    if (savedTermFontSize) setTerminalFontSize(parseInt(savedTermFontSize));
    const savedVim = localStorage.getItem("ck-vim") === "true";
    setVimMode(savedVim);
    const savedTermHeight = localStorage.getItem("ck-term-height");
    if (savedTermHeight) setTerminalHeight(parseInt(savedTermHeight));
    const savedStdin = localStorage.getItem("ck-stdin");
    if (savedStdin) setStdin(savedStdin);
    const savedActiveQuestion = localStorage.getItem("ck-active-question");
    if (savedActiveQuestion) {
        try {
            setActiveQuestion(JSON.parse(savedActiveQuestion));
        } catch (e) {
            console.error("Failed to parse active question:", e);
            localStorage.removeItem("ck-active-question");
        }
    }

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
      localStorage.setItem("ck-active-question", JSON.stringify(activeQuestion));
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(monaco.languages as any).cppRegistered) {
        monaco.languages.registerCompletionItemProvider('cpp', {
          provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
            return { suggestions: CPP_STL.map(item => ({ label: item, kind: monaco.languages.CompletionItemKind.Keyword, insertText: item, range })) };
          }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const img = new window.Image();
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
        // If run succeeded (no compile errors), trigger local Big-O analysis so terminal shows Time/Space
        if (!data.compileErrors) {
          try {
            analyzeCode(code, lang, activeQuestion ?? null);
          } catch (err) {
            console.error('Failed to run analysis after execution', err);
          }
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setTerminalOutput(data.error || `Server returned ${res.status}: ${res.statusText}`);
      }
    } catch (err: unknown) {
      console.error("Fetch Error:", err);
      setTerminalOutput(`Network Error: ${err instanceof Error ? err.message : "Failed to connect to execution server."}`);
    } finally {
      setIsRunning(false);
    }
  }, [code, lang, stdin, analyzeCode, activeQuestion]);

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
    setWrongAttemptCount(0); // Reset
    
    // If it's a duel, use createdAt as the start time, otherwise now.
    const startTime = activeDuel ? new Date(activeDuel.createdAt).getTime() : Date.now();
    setBattleStartTime(startTime);
    
    setSolveTime(null);
    
    if (maximizedWindow === "battle") setMaximizedWindow(null);

    setOpenWindows(prev => {
      const next = prev.filter(w => w !== "battle");
      if (!next.includes("problem")) next.push("problem");
      if (!next.includes("editor")) next.unshift("editor");
      
      setWindowFlexes(next.map(w => w === "editor" ? 1.5 : 1));
      return next;
    });
  }, [questions, maximizedWindow, activeDuel]);

  useEffect(() => {
    if (activeDuel?.status === "ACTIVE" && !activeQuestion) {
      startBattle(activeDuel.question);
    }
  }, [activeDuel, activeQuestion, startBattle]);

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
          const isCorrect = data.output?.trimEnd() === tc.output?.trimEnd();
          if (isCorrect) passed++;

          details.push({ input: tc.input, expected: tc.output, actual: data.output, passed: isCorrect });
        }
      }
      
      setTestResults({ passed, total: allTests.length, details });
      if (passed === allTests.length) {
        // Penalty calculation
        const time = Math.floor((Date.now() - (battleStartTime || Date.now())) / 1000);

        const totalPenalty = calculatePenalty(
            time, 
            wrongAttemptCount, 
            analysis?.scores, 
            analysis?.timeComplexity, 
            activeQuestion?.idealComplexity
        );
        setTotalPenalty(totalPenalty);

        const mins = Math.floor(time / 60);
        const secs = time % 60;
        const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
        setSolveTime(formatted);

        analyzeCode(code, lang, activeQuestion);
        fetchUserStats();

        if (activeDuel && activeDuel.status === "ACTIVE") {
          const totalComplexity = analysis?.scores ? 
            (analysis.scores.efficiency + analysis.scores.readability + analysis.scores.maintainability + analysis.scores.security) : 0;
          
          await fetch("/api/duels/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                duelId: activeDuel.id, 
                solveTime: time * 1000,
                complexityScore: totalComplexity,
                totalPenalty: totalPenalty
            })
          });
        }
      } else {
        setWrongAttemptCount(prev => prev + 1); // Increment on fail
        setShowWrongAnswerPopup(true);
      }
    } catch (err: unknown) {
      setTerminalOutput(`Network Error: ${err instanceof Error ? err.message : "Failed to connect to execution server."}`);
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
    } catch (err: unknown) {
      console.error("Fetch Error:", err);
      setTerminalOutput(`Network Error: ${err instanceof Error ? err.message : "Failed to connect to execution server."}`);
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
    const session = resizeSessionRef.current;
    if (session) {
      const deltaX = e.clientX - session.startClientX;
      const targetLeftPx = session.startLeftWidth + deltaX;
      const { pairPixelWidth, pairFlex, leftFlexIdx, rightFlexIdx, minLeftPx, minRightPx } = session;
      let maxLeftPx = pairPixelWidth - minRightPx;
      let minL = minLeftPx;
      if (maxLeftPx < minL) {
        maxLeftPx = minL;
      }
      const clampedLeftPx = Math.max(minL, Math.min(maxLeftPx, targetLeftPx));
      const ratio = pairPixelWidth > 0 ? clampedLeftPx / pairPixelWidth : 0.5;
      const newLeftFlex = ratio * pairFlex;

      window.requestAnimationFrame(() => {
        setWindowFlexes(prev => {
          if (
            leftFlexIdx < 0 ||
            rightFlexIdx < 0 ||
            leftFlexIdx >= prev.length ||
            rightFlexIdx >= prev.length
          ) {
            return prev;
          }
          const next = [...prev];
          next[leftFlexIdx] = newLeftFlex;
          next[rightFlexIdx] = pairFlex - newLeftFlex;
          return next;
        });
      });
    }

    if (terminalResizingRef.current) {
      const movementY = e.movementY;
      window.requestAnimationFrame(() => {
        setTerminalHeight(prev => Math.max(40, Math.min(window.innerHeight * 0.8, prev - movementY)));
        if (editorRef.current && openWindows.includes("editor")) {
          editorRef.current.layout();
        }
      });
    }
  }, [openWindows]);

  const [guestId, setGuestId] = useState<string | null>(null);

  const handlePlayAsGuest = useCallback(() => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const name = `Guest Knight ${randomId}`;
    setGuestName(name);
    setIsGuest(true);
    setGuestId(`guest_${Date.now()}_${randomId}`);
  }, []);

  const stopResizing = useCallback(() => {
    resizeSessionRef.current = null;
    terminalResizingRef.current = false;
    setIsDragging(false);
    document.body.style.cursor = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
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

  const startResizing = (e: React.MouseEvent, leftFlexIdx: number, rightFlexIdx: number) => {
    e.preventDefault();
    if (leftFlexIdx < 0 || rightFlexIdx < 0) return;
    const target = e.currentTarget as HTMLElement;
    const left = target.previousElementSibling as HTMLElement | null;
    const right = target.nextElementSibling as HTMLElement | null;
    if (!left || !right) return;

    const lr = left.getBoundingClientRect();
    const rr = right.getBoundingClientRect();
    const startLeftWidth = lr.width;
    const pairPixelWidth = lr.width + rr.width;
    const pairFlex = windowFlexes[leftFlexIdx] + windowFlexes[rightFlexIdx];
    if (pairFlex <= 0 || pairPixelWidth <= 0) return;

    const minLeftPx = readMinWidthPx(left);
    const minRightPx = readMinWidthPx(right);

    resizeSessionRef.current = {
      leftFlexIdx,
      rightFlexIdx,
      startClientX: e.clientX,
      startLeftWidth,
      pairPixelWidth,
      pairFlex,
      minLeftPx,
      minRightPx,
    };
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
    console.log("[MainMenu] toggleWindow called for:", id);
    
    // Check if we should allow closing (confirmation)
    if (id === "problem" && activeQuestion) {
      const allPassed = testResults?.passed === testResults?.total && testResults?.total > 0;
      const isDuel = !!activeDuel;
      const isDuelFinished = activeDuel?.status === "FINISHED";

      // If duel is active and not finished, apply restrictions
      if (isDuel && !isDuelFinished) {
        if (allPassed && activeDuel.status === "ACTIVE") {
            alert("Cannot leave the battle after submitting a solution!");
            return;
        }
        if (!allPassed) {
            setShowQuitConfirmation(true);
            return;
        }
      }
      // If it's not a duel or duel is finished, allow closing (continue to setOpenWindows)
    }

    if (id === "battle" && activeDuel && activeDuel.status === "WAITING") {
      setShowCancelDuel(true);
      return;
    }

    setOpenWindows(prev => {
      const isClosing = prev.includes(id);
      if (isClosing) {
        if (id === "editor") return prev;

        // If we are closing problem window, clear state
        if (id === "problem") {
            setActiveQuestion(null);
            setTestResults(null);
        }

        const idx = prev.indexOf(id);
        setWindowFlexes(flexes => {
          const next = [...flexes];
          if (idx !== -1 && next.length > idx) {
            next.splice(idx, 1);
          }
          return next;
        });
        if (maximizedWindow === id) setMaximizedWindow(null);
        if (activeWindow === id) setActiveWindow("editor");
        if (id === "profile") setViewingUserId(null);
        const nextWindows = prev.filter(w => w !== id);
        // Safety: always ensure editor is there
        if (!nextWindows.includes("editor")) nextWindows.unshift("editor");
        return nextWindows;
      } else {
        if (prev.includes(id)) return prev;
        
        if (prev.length >= 4) {
          setShowLimitWarning(true);
          return prev;
        }
        setWindowFlexes(flexes => [...flexes, 1]);
        if (maximizedWindow) setMaximizedWindow(null);
        setActiveWindow(id);
        const nextWindows = [...prev, id];
        if (!nextWindows.includes("editor")) nextWindows.unshift("editor");
        return nextWindows;
      }
    });
  }, [activeQuestion, testResults, activeDuel, maximizedWindow, activeWindow, setMaximizedWindow, setActiveWindow, setOpenWindows, setWindowFlexes, setViewingUserId, setActiveQuestion, setTestResults, setShowQuitConfirmation, setShowCancelDuel, setShowLimitWarning]);

  const moveWindow = (id: WindowId, direction: 'left' | 'right') => {
    ignoreHoverRef.current = true;
    setIsReordering(true);
    setOpenWindows(prev => {
      const index = prev.indexOf(id);
      if (index === -1) return prev;
      const next = [...prev];
      if (direction === 'left' && index > 0) {
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        // Also swap flexes
        setWindowFlexes(f => {
          const nf = [...f];
          if (nf.length > index) {
            [nf[index-1], nf[index]] = [nf[index], nf[index-1]];
          }
          return nf;
        });
      } else if (direction === 'right' && index < next.length - 1) {
        [next[index + 1], next[index]] = [next[index], next[index + 1]];
        // Also swap flexes
        setWindowFlexes(f => {
          const nf = [...f];
          if (nf.length > index + 1) {
            [nf[index+1], nf[index]] = [nf[index], nf[index+1]];
          }
          return nf;
        });
      }
      return next;
    });
    setTimeout(() => setIsReordering(false), 300);
  };

  const handleDrop = (targetId: WindowId) => {
    if (!draggedWindow || draggedWindow === targetId) return;
    ignoreHoverRef.current = true;
    setIsReordering(true);
    setActiveWindow(draggedWindow);
    setOpenWindows(prev => {
      const oldIndex = prev.indexOf(draggedWindow);
      const newIndex = prev.indexOf(targetId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = [...prev];
      [next[oldIndex], next[newIndex]] = [next[newIndex], next[oldIndex]];
      
      setWindowFlexes(f => {
        const nf = [...f];
        if (nf.length > Math.max(oldIndex, newIndex)) {
          [nf[oldIndex], nf[newIndex]] = [nf[newIndex], nf[oldIndex]];
        }
        return nf;
      });
      
      return next;
    });
    setDraggedWindow(null);
    setTimeout(() => setIsReordering(false), 300);
  };

  const toggleMaximize = useCallback((id: WindowId) => {
    setMaximizedWindow(prev => prev === id ? null : id);
    setActiveWindow(id);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focusing an input or textarea (unless Alt is pressed)
      const isInput = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";
      if (isInput && !e.altKey && !e.ctrlKey && e.key !== "Escape") {
        return;
      }

      // Alt + ' to run code
      if (e.altKey && (e.key === "'" || e.key === "Enter")) {
        e.preventDefault();
        runCode();
        return;
      }

      // Alt + Number to toggle windows
      if (e.altKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const num = parseInt(e.key);
        const allIds: WindowId[] = ["editor", "battle", "tournaments", "friends", "problem", "profile", "settings", "admin"];
        const id = allIds[num - 1];
        if (id) {
          toggleWindow(id);
        }
        return;
      }

      // Determine which window we are targeting: prioritize activeWindow, then hovered, then last opened
      const targetWindow = (openWindows.includes(activeWindow) ? activeWindow : null) 
                           || hoveredWindow 
                           || (openWindows.length > 0 ? openWindows[openWindows.length - 1] : null);

      // Alt + W to close current/last window
      if (e.altKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (maximizedWindow) {
          if (maximizedWindow !== "editor") toggleWindow(maximizedWindow);
          else setMaximizedWindow(null);
        } else if (targetWindow && targetWindow !== "editor") {
          toggleWindow(targetWindow);
        } else if (openWindows.length > 1) {
          const last = openWindows[openWindows.length - 1];
          if (last !== "editor") toggleWindow(last);
          else toggleWindow(openWindows[openWindows.length - 2]);
        }
        return;
      }

      // Alt + M to toggle maximize
      if (e.altKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        if (targetWindow) toggleMaximize(targetWindow);
        return;
      }

      // Alt + S for settings
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        toggleWindow("settings");
        return;
      }

      // Alt + B for battle
      if (e.altKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleWindow("battle");
        return;
      }

      // Alt + Shift + Arrow keys to move windows
      if (e.altKey && e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        if (targetWindow) {
          e.preventDefault();
          moveWindow(targetWindow, e.key === "ArrowLeft" ? "left" : "right");
        }
        return;
      }

      // Alt + Arrow keys to cycle focus (and prevent default navigation)
      if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        const currentIndex = openWindows.indexOf(activeWindow);
        const direction = e.key === "ArrowLeft" ? -1 : 1;
        const nextIndex = (currentIndex + direction + openWindows.length) % openWindows.length;
        setActiveWindow(openWindows[nextIndex]);
        return;
      }
      
      if (vimMode && e.key === "Escape") {
        const vimState = editorRef.current?.vimState;
        if (vimState) {
          if (vimState.mode === 'normal') {
            editorRef.current?.focus();
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [vimMode, runCode, openWindows, maximizedWindow, hoveredWindow, activeWindow, toggleWindow, toggleMaximize]);

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
            analysis={analysis}
            isAnalyzing={isAnalyzing}
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
            handleCancelDuel={async () => { 
                const currentDuel = activeDuel;
                setActiveDuel(null); 
                setDuelPin(""); 
                setShowCancelDuel(false); 
                setShowWaitingPopup(false);
                if (maximizedWindow === "battle") setMaximizedWindow(null);

                if (currentDuel) {
                    try {
                      await fetch("/api/duels/submit", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ duelId: currentDuel.id, surrender: true })
                      });
                    } catch (err) {
                        console.error("Failed to terminate duel:", err);
                    }
                }
            }}
            setShowWaitingPopup={setShowWaitingPopup}
            timeLeft={timeLeft}
          />
        );
      case "agent":
        return (
          <AgentWindow t={t} lang={lang} setLang={setLang} code={code} setCode={setCode} isBattleActive={!!activeDuel && activeDuel.status === 'ACTIVE'} />
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
        const currentUserId = session?.user ? (session.user as any).id : "guest";
        console.log("[MainMenu] ProblemWindow timeLeft:", timeLeft);
        return (
          <ProblemWindow
            userId={currentUserId}
            activeQuestion={activeQuestion}
            testResults={testResults}
            totalPenalty={totalPenalty}
            wrongAttemptCount={wrongAttemptCount}
            calculatePenalty={calculatePenalty}
            analysis={analysis}
            retryProblem={retryProblem}
            showQuitConfirmation={showQuitConfirmation}
            setShowQuitConfirmation={setShowQuitConfirmation}
            handleQuitBattle={async () => {
              const currentDuel = activeDuel;
              const isDuelActive = activeDuel?.status === "ACTIVE";

              // Optimistically clear all battle-related state IMMEDIATELY
              // to prevent pollDuel or effects from re-opening the window.
              setActiveQuestion(null);
              setTestResults(null);
              setAnalysis(null);
              setActiveDuel(null);
              setDuelPin("");
              setShowQuitConfirmation(false);
              if (maximizedWindow === "problem") setMaximizedWindow(null);

              setOpenWindows(prev => {
                const next = prev.filter(w => w !== "problem");
                if (!next.includes("editor")) next.unshift("editor");
                return next;
              });

              // Then handle the network request in the background
              if (currentDuel && isDuelActive) {
                try {
                  await fetch("/api/duels/submit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ duelId: currentDuel.id, surrender: true })
                  });
                } catch (err) {
                  console.error("Failed to surrender:", err);
                }
              }
            }}
            runTests={runTests}
            isTesting={isTesting}
            setStdin={setStdin}
            setShowTerminal={setShowTerminal}
            setTerminalOutput={setTerminalOutput}
            solveTime={solveTime}
            lang={lang}
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
                return next;
              });
            }}
            runSingleTest={runSingleTest}
            t={t}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            onAnalyzeComplexity={analyzeProblemComplexity}
            activeDuel={activeDuel}
            timeLeft={timeLeft}
            setActiveDuel={setActiveDuel}
            setDuelPin={setDuelPin}
          />
        );
      case "profile":
        return <ProfileWindow session={session} userId={viewingUserId ?? undefined} t={t} />;
      case "leaderboard": return <div style={{ padding: '1.5rem' }}><h2>Global</h2><div style={{ marginTop: '1rem' }}>1. tourist (3842)</div></div>;
      case "friends": return <FriendsWindow t={t} openProfile={(id: string) => { setViewingUserId(id); toggleWindow("profile"); }} />;
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

  // Keep per-window min-width adaptive so many windows won't tile off-screen.
  useEffect(() => {
    try {
      const el = workspaceRef.current;
      if (!el) return;
      const count = Math.max(1, renderedWindows.length);
      // Set CSS variable used by styles to compute minimum window width.
      // This makes each window shrink proportionally so they stay within viewport.
      el.style.setProperty('--twm-window-min-width', `min(22rem, calc(100% / ${count}))`);
    } catch (err) {
      // silent
    }
  }, [renderedWindows.length]);

  return (
    <div className="main-header">
      <AnimatePresence>
        {showRatingChangePopup && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            style={{
              position: 'fixed',
              top: '80px',
              left: '50%',
              zIndex: 1000,
              background: showRatingChangePopup.isWin ? 'rgba(80, 250, 123, 0.1)' : 'rgba(255, 85, 85, 0.1)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${showRatingChangePopup.isWin ? '#50fa7b' : '#ff5555'}`,
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              color: showRatingChangePopup.isWin ? '#50fa7b' : '#ff5555',
              fontWeight: 900,
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: `0 0 30px ${showRatingChangePopup.isWin ? 'rgba(80, 250, 123, 0.2)' : 'rgba(255, 85, 85, 0.2)'}`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            {showRatingChangePopup.isWin ? <Trophy size={24} /> : <AlertCircle size={24} />}
            <span>Rating {showRatingChangePopup.isWin ? 'Increased' : 'Decreased'} {showRatingChangePopup.amount > 0 ? '+' : ''}{showRatingChangePopup.amount}</span>
          </motion.div>
        )}

        {(showLimitWarning || showWrongAnswerPopup || showWaitingPopup || showOpponentFoundPopup) && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: -20 }}
            style={{
              position: 'fixed',
              top: '1rem',
              right: '1rem',
              zIndex: 9999,
              background: 'var(--bg)',
              border: `1px solid ${showWrongAnswerPopup ? '#ff5555' : (showWaitingPopup ? 'var(--text-muted)' : (showOpponentFoundPopup ? '#50fa7b' : 'var(--accent)'))}`,
              padding: '0.75rem 1rem',
              borderRadius: '0.4rem',
              color: showWrongAnswerPopup ? '#ff5555' : 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            <AlertCircle size={18} color={showWrongAnswerPopup ? '#ff5555' : (showWaitingPopup ? 'var(--text-muted)' : (showOpponentFoundPopup ? '#50fa7b' : 'var(--accent)'))} />
            {showWrongAnswerPopup ? "Wrong Answer! Check your logic." : (showWaitingPopup ? `Waiting for opponent... PIN: ${activeDuel?.pin || ''}` : (showOpponentFoundPopup ? "Opponent found!" : "Maximum of 4 windows allowed."))}
          </motion.div>
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
            <span style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', textTransform: 'uppercase' }}>CODE<span style={{ color: 'var(--accent)' }}>KNIGHTS</span></span>
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
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isGuest ? guestName : (session?.user?.username || session?.user?.name)}</span>
                  {session?.user?.image ? (
                    <Image src={session.user.image} alt="Profile" width={24} height={24} unoptimized style={{ borderRadius: '50%', border: '1px solid var(--line)' }} />
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
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{isGuest ? guestName : (session?.user?.username || session?.user?.name)}</div>
                          {!isGuest && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session?.user?.email}</div>}
                        </div>

                        {!isGuest && (
                          <>
                            <button onClick={() => { toggleWindow("profile"); setIsProfileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: 'none', color: 'inherit', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={14} /><span style={{ fontSize: '0.85rem' }}>{t("profileOverview")}</span></div>
                              <ChevronRight size={12} />
                            </button>

                            {session?.user?.isAdmin && (
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
            ) : <button className="btn" onClick={() => signIn()} style={{ background: 'var(--text)', color: 'var(--bg)', border: 'none', fontWeight: 700, padding: '0.4rem 0.8rem', cursor: 'pointer', borderRadius: '0.4rem' }}>{t("signIn")}</button>}
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
            const rwIdx = renderedWindows.indexOf(id);
            const canReorder = !isMax && renderedWindows.length > 1;
            const canMoveLeft = canReorder && rwIdx > 0;
            const canMoveRight = canReorder && rwIdx < renderedWindows.length - 1;

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
                  className={`twm-window ${draggedWindow === id ? 'twm-window--dragging' : ''} ${activeWindow === id ? 'twm-window--active' : ''}`}
                  style={{ flex: isMax ? 1 : (windowFlexes[originalIdx] || 1) }}
                  onMouseDown={() => setActiveWindow(id)}
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
                        {id === 'problem' && activeQuestion && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderLeft: '1px solid var(--line)', paddingLeft: '1rem' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); runTests(); }} 
                              disabled={isTesting || (testResults?.passed === testResults?.total && testResults?.total > 0)} 
                              style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '0.2rem', padding: '0.1rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: (isTesting || (testResults?.passed === testResults?.total && testResults?.total > 0)) ? 'default' : 'pointer', fontSize: '0.7rem', fontWeight: 700, opacity: (isTesting || (testResults?.passed === testResults?.total && testResults?.total > 0)) ? 0.7 : 1 }}>
                              {isTesting ? "..." : ((testResults?.passed === testResults?.total && testResults?.total > 0) ? "SUBMITTED" : "SUBMIT")}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="twm-window-actions">
                        <button type="button" className="twm-btn" onClick={() => toggleMaximize(id)} title={isMax ? "Restore" : "Maximize"}>
                          {isMax ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                        <button
                          type="button"
                          className="twm-btn"
                          disabled={!canMoveLeft}
                          onClick={() => moveWindow(id, "left")}
                          title="Move left"
                        >
                          <ArrowLeft size={14} />
                        </button>
                        <button
                          type="button"
                          className="twm-btn"
                          disabled={!canMoveRight}
                          onClick={() => moveWindow(id, "right")}
                          title="Move right"
                        >
                          <ArrowRight size={14} />
                        </button>
                        <button
                          type="button"
                          className="twm-btn"
                          disabled={id === "editor"}
                          onClick={() => toggleWindow(id)}
                          title={id === "editor" ? "Editor cannot be closed" : "Close"}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </motion.div>
                  </div>
                  <div className="twm-content" style={{ overflow: 'hidden', pointerEvents: (isDragging || isReordering) ? 'none' : 'auto' }}>
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
                    onMouseDown={(e) => {
                      const rightId = renderedWindows[idx + 1];
                      if (rightId === undefined) return;
                      startResizing(e, openWindows.indexOf(id), openWindows.indexOf(rightId));
                    }}
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
