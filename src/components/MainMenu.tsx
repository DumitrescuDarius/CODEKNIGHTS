"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { loader } from "@monaco-editor/react";
import { Settings, Code, Trophy, ArrowLeft, ArrowRight, X, Sword, User, LogOut, ChevronRight, Users, RotateCcw, Wand2, Target, Play, Database, Maximize2, Minimize2, LogIn, AlertCircle, Flame, BookOpen, Github, Shield, FileText, StickyNote, Brain, MessageSquare, Crown, Check, Send, Flag } from "lucide-react";
import { Tour, TourStep } from "./Tour";
import { initVimMode } from "monaco-vim";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { Language, WindowId, UserStats, Question, SupportedLanguage, AnimationSpeed } from "../types";
import { THEMES } from "../constants/themes";
import { FONTS } from "../constants/fonts";
import { LANG_CONFIG, CPP_STL } from "../constants/languages";
import beautify from "js-beautify";
import { TRANSLATIONS, TranslationKey } from "../constants/translations";

import { EditorWindow } from "./windows/EditorWindow";
import { DefaultAvatar } from "./DefaultAvatar";
import { SettingsWindow } from "./windows/SettingsWindow";
import { BattleWindow } from "./windows/BattleWindow";
import { ProblemWindow } from "./windows/ProblemWindow";
import { ProfileWindow } from "./windows/ProfileWindow";
import { AdminWindow } from "./windows/AdminWindow";
import { NotesWindow } from "./windows/NotesWindow";
import { TournamentWindow } from "./windows/TournamentWindow";
import { LegalWindow } from "./windows/LegalWindow";
import { FriendsWindow } from "./windows/FriendsWindow";
import { AgentWindow } from "./windows/AgentWindow";
import { RoyalWindow } from "./windows/RoyalWindow";
import { TutorialWindow } from "./windows/TutorialWindow";
import FeedbackWindow from "./windows/FeedbackWindow";
import { LeaderboardWindow } from "./windows/LeaderboardWindow";
import { Transition } from "framer-motion";

const CodeKnightsLogo = ({ size = 28 }) => (
  <svg 
    viewBox="6 2 88 96" 
    width={size} 
    height={size} 
    fill="none"
  >
    {/* Shield Base */}
    <path 
      d="M50 5 L90 20 V50 C90 80 50 95 50 95 C50 95 10 80 10 50 V20 Z" 
      stroke="var(--text)" 
      strokeWidth="6"
      strokeLinejoin="round"
    />
    
    {/* Pommel */}
    <circle cx="50" cy="22" r="4" fill="var(--accent)" />
    
    {/* Handle */}
    <path 
      d="M50 26 V36" 
      stroke="var(--accent)" 
      strokeWidth="4" 
    />
    
    {/* Crossguard */}
    <path 
      d="M38 36 H62" 
      stroke="var(--accent)" 
      strokeWidth="4" 
      strokeLinecap="round" 
    />
    
    {/* Blade */}
    <path 
      d="M46 38 V70 L50 85 L54 70 V38 Z" 
      fill="var(--accent)" 
    />
    
    {/* Code Brackets */}
    <path 
      d="M32 48 L22 58 L32 68" 
      stroke="var(--text)" 
      strokeWidth="5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M68 48 L78 58 L68 68" 
      stroke="var(--text)" 
      strokeWidth="5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

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

type SubmissionFeedback = {
  message: string;
  color: string;
};

function levenshtein(a: string, b: string): number {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

function getSubmissionFeedback(passed: number, total: number): SubmissionFeedback {
  const percentage = total > 0 ? (passed / total) * 100 : 0;

  if (percentage === 100) return { message: "Perfect! All test cases passed.", color: "#50fa7b" };
  if (percentage > 75) return { message: "Good enough! More than 75% of test cases passed.", color: "#8be9fd" };
  if (percentage > 50) return { message: "Almost there! More than half of the test cases passed.", color: "#f1fa8c" };
  if (percentage > 25) return { message: "Keep improving! A few more test cases need work.", color: "#ffb86c" };
  if (percentage > 0) return { message: "A start! Review the failed test cases and try again.", color: "#ff79c6" };

  return { message: "No test cases passed yet. Check your approach and try again.", color: "#ff5555" };
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
  failedSubmissionsCount?: number;
}

interface Duel {
  id: string;
  pin: string;
  status: "WAITING" | "ACTIVE" | "FINISHED";
  question: Question;
  players: { id: string; name: string; image?: string }[];
  createdAt?: string | Date;
  startedAt?: string | Date;
  hostId?: string;
  guestId?: string;
  hostCodeLength?: number;
  guestCodeLength?: number;
  hostLineCount?: number;
  guestLineCount?: number;
  hostTestsPassed?: number;
  guestTestsPassed?: number;
  hostTestsTotal?: number;
  guestTestsTotal?: number;
  hostLastActive?: string;
  guestLastActive?: string;
  hostSolveTime?: number | null;
  guestSolveTime?: number | null;
  hostPenalty?: number | null;
  guestPenalty?: number | null;
  hostRatingChange?: number | null;
  guestRatingChange?: number | null;
  host?: any;
  guest?: any;
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

const changeCodeIndentation = (
  code: string,
  oldTabSize: number,
  newTabSize: number,
  oldUseSpaces: boolean,
  newUseSpaces: boolean
): string => {
  return code.split('\n').map(line => {
    const match = line.match(/^([ \t]+)/);
    if (!match) return line;
    const leading = match[1];
    const content = line.substring(leading.length);
    
    let indentLevel = 0;
    if (oldUseSpaces) {
      const spacesCount = leading.length;
      indentLevel = Math.round(spacesCount / oldTabSize);
    } else {
      const tabsCount = (leading.match(/\t/g) || []).length;
      const spacesCount = (leading.match(/ /g) || []).length;
      indentLevel = tabsCount + Math.round(spacesCount / oldTabSize);
    }
    
    const newIndent = newUseSpaces 
      ? " ".repeat(indentLevel * newTabSize) 
      : "\t".repeat(indentLevel);
      
    return newIndent + content;
  }).join('\n');
};

const TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="battle-btn"]', title: "The Battle Arena", content: "Click here to create a Quick Match or Duel a friend. This is where the magic happens!", position: "right" },
  { target: '.workspace-selector', title: "Workspaces", content: "You can manage multiple layouts and duels simultaneously using 9 independent workspaces.", position: "bottom" },
  { target: '[data-tour="settings-btn"]', title: "Settings", content: "Customize themes, fonts, vim mode, and interface language to your liking.", position: "bottom" },
  { target: '[data-tour="profile-menu"]', title: "Your Profile", content: "Check your stats, manage your account, or edit your avatar here.", position: "bottom" }
];

const MainMenu: React.FC = () => {
  const { data: session, status, update: updateSession } = useSession();
  const [fullProfile, setFullProfile] = useState<any>(null);
  const isRoyal = !!(session?.user as any)?.isRoyal || !!fullProfile?.isRoyal;
  const maxWindows = isRoyal ? 999 : 5;
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [lang, setLang] = useState<Language>("cpp");
  const [code, setCode] = useState(LANG_CONFIG["cpp"].defaultCode);
  const [openWindows, setOpenWindows] = useState<WindowId[]>(["editor"]);
  const [windowFlexes, setWindowFlexes] = useState<number[]>([1]);
  const [themeIndex, setThemeIndex] = useState(0);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState(FONTS[0].value);
  const [terminalFontSize, setTerminalFontSize] = useState(13);
  const [vimMode, setVimMode] = useState(false);
  const [tabSize, setTabSize] = useState(4);
  const [insertSpaces, setInsertSpaces] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [draggedWindow, setDraggedWindow] = useState<WindowId | null>(null);
  const [langSelectorOpen, setLangSelectorOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const prevTabSizeRef = useRef(tabSize);
  const prevInsertSpacesRef = useRef(insertSpaces);

  useEffect(() => {
    if (!isLoaded) {
      prevTabSizeRef.current = tabSize;
      prevInsertSpacesRef.current = insertSpaces;
      return;
    }

    const sizeChanged = prevTabSizeRef.current !== tabSize;
    const styleChanged = prevInsertSpacesRef.current !== insertSpaces;

    if (sizeChanged || styleChanged) {
      const oldSize = prevTabSizeRef.current;
      const oldStyle = prevInsertSpacesRef.current;
      const newSize = tabSize;
      const newStyle = insertSpaces;

      setCode(prevCode => {
        if (!prevCode) return prevCode;
        return changeCodeIndentation(prevCode, oldSize, newSize, oldStyle, newStyle);
      });
      prevTabSizeRef.current = tabSize;
      prevInsertSpacesRef.current = insertSpaces;
    }
  }, [tabSize, insertSpaces, isLoaded]);

  const [activeWorkspace, setActiveWorkspace] = useState(0);
  const workspacesRef = useRef<{ openWindows: WindowId[], windowFlexes: number[] }[]>(
    Array.from({ length: 9 }, (_, i) => ({
      openWindows: ["editor"],
      windowFlexes: [1]
    }))
  );

  const switchWorkspace = useCallback((index: number) => {
    if (activeWorkspace === index) return;
    
    // Save current workspace state directly
    workspacesRef.current[activeWorkspace] = { 
      openWindows: openWindows, 
      windowFlexes: windowFlexes 
    };
    
    // Load new workspace state
    setActiveWorkspace(index);
    setOpenWindows(workspacesRef.current[index].openWindows);
    setWindowFlexes(workspacesRef.current[index].windowFlexes);
  }, [activeWorkspace, openWindows, windowFlexes]);

  const closeWorkspace = useCallback(() => {
    const isExisting = (i: number) => {
      if (i === activeWorkspace) {
        return openWindows.length > 1 || (openWindows.length === 1 && openWindows[0] !== "editor");
      }
      const ws = workspacesRef.current[i];
      if (!ws) return false;
      return ws.openWindows.length > 1 || (ws.openWindows.length === 1 && ws.openWindows[0] !== "editor");
    };

    let activeCount = 0;
    for (let i = 0; i < 9; i++) {
      if (isExisting(i)) activeCount++;
    }

    if (activeCount <= 1 && isExisting(activeWorkspace)) {
      setShowWorkspaceWarning(true);
      return;
    }

    // Reset the current workspace
    workspacesRef.current[activeWorkspace] = { openWindows: ["editor"], windowFlexes: [1] };
    
    // Find next workspace to switch to
    let nextWorkspace = -1;
    for (let i = 1; i < 9; i++) {
      if (activeWorkspace + i < 9 && isExisting(activeWorkspace + i)) { nextWorkspace = activeWorkspace + i; break; }
      if (activeWorkspace - i >= 0 && isExisting(activeWorkspace - i)) { nextWorkspace = activeWorkspace - i; break; }
    }

    if (nextWorkspace !== -1) {
      // Just call switchWorkspace logic but we know current is already reset
      setActiveWorkspace(nextWorkspace);
      setOpenWindows(workspacesRef.current[nextWorkspace].openWindows);
      setWindowFlexes(workspacesRef.current[nextWorkspace].windowFlexes);
    } else {
      setOpenWindows(["editor"]);
      setWindowFlexes([1]);
    }
  }, [activeWorkspace, openWindows]);
  
  const [stdin, setStdin] = useState<string>("");
  const [terminalOutput, setTerminalOutput] = useState<string>("Welcome to Code Knights terminal.\nProvide input and click RUN.");
  const [isRunning, setIsRunning] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(180);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState<{ id?: string; title: string; description: string; restrictions: string; difficulty: string; testCases: { input: string; output: string }[]; hiddenTestCases: { input: string; output: string }[]; timeLimit: number; memoryLimit: number; brokenCode?: string }>({ 
    title: "", 
    description: "", 
    restrictions: "",
    difficulty: "Easy", 
    testCases: [{ input: "", output: "" }], 
    hiddenTestCases: [],
    timeLimit: 5000,
    memoryLimit: 256,
    brokenCode: ""
  });
  const [adminError, setAdminError] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const problemCodesRef = useRef<Record<string, string>>({});
  const [testResults, setTestResults] = useState<{ passed: number, total: number, details: TestDetail[] } | null>(null);
  const [problemTestResults, setProblemTestResults] = useState<Record<string, { passed: number; total: number; details: any[] }>>({});
  const [problemScores, setProblemScores] = useState<Record<string, number>>({});
  const [problemWrongAttemptCounts, setProblemWrongAttemptCounts] = useState<Record<string, number>>({});
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

  const calculatePenalty = useCallback((
    timeSeconds: number, 
    wrongAttempts: number, 
    compScores: CodeAnalysisScores | undefined,
    actualComp?: string,
    idealComp?: string | null
  ) => {
      const timePenalty = timeSeconds;
      const waPenalty = wrongAttempts * 50;
      
      let extraPenalty = 0;
      if (actualComp && idealComp) {
        if (actualComp.replace(/\s+/g, '') !== idealComp.replace(/\s+/g, '')) {
          extraPenalty = 100;
        }
      }

      return timePenalty + waPenalty + extraPenalty;
  }, []);
  const retryProblem = useCallback(() => {
    setTestResults(null);
    if (activeQuestion) {
      setProblemTestResults(prev => {
        const next = { ...prev };
        delete next[activeQuestion.id];
        return next;
      });
      setProblemScores(prev => {
        const next = { ...prev };
        delete next[activeQuestion.id];
        return next;
      });
    }
    setSubmissionFeedback(null);
    setWrongAttemptCount(activeQuestion ? (problemWrongAttemptCounts[activeQuestion.id] ?? 0) : 0);
    setTotalPenalty(null);
    setSolveTime(null);
    setBattleStartTime(Date.now());
  }, [activeQuestion, problemWrongAttemptCounts]);

  const recordWrongAttempt = useCallback((questionId: string) => {
    setProblemWrongAttemptCounts(prev => {
      const nextCount = (prev[questionId] ?? 0) + 1;
      setWrongAttemptCount(nextCount);
      return { ...prev, [questionId]: nextCount };
    });
  }, []);
  
  const [isTesting, setIsTesting] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({ battlesWon: 0, battlesTotal: 0 });
  const [cachedFriends, setCachedFriends] = useState<any[] | null>(null);
  const [cachedRequests, setCachedRequests] = useState<any[] | null>(null);
  const [cachedLeaderboard, setCachedLeaderboard] = useState<any>(null);
  const [activeGameModeCallback, setActiveGameModeCallback] = useState<((mode: string, isUnrated: boolean) => void) | null>(null);
  const [showGameModeSelection, setShowGameModeSelection] = useState(false);
  const [modalIsUnrated, setModalIsUnrated] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [inviteTargetForConfig, setInviteTargetForConfig] = useState<{ id: string, name: string } | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<{hostName: string, hostId: string, gameMode: string, unrated: boolean, pin: string, problems?: string[]} | null>(null);
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
  const [showQuitConfirmation, setShowQuitConfirmation] = useState(false);
  const [showCancelDuel, setShowCancelDuel] = useState(false);
  const [battleStartTime, setBattleStartTime] = useState<number | null>(null);
  const [solveTime, setSolveTime] = useState<string | null>(null);
  const [hoveredWindow, setHoveredWindow] = useState<WindowId | null>(null);
  const [activeWindow, setActiveWindow] = useState<WindowId>("editor");

  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  const [compileErrors, setCompileErrors] = useState<CompileError[]>([]);
  const [maximizedWindow, setMaximizedWindow] = useState<WindowId | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [uiLang, setUiLang] = useState<SupportedLanguage>("en");
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeDuel, setActiveDuel] = useState<any>(null);
  const activeDuelRef = useRef<any>(null);
  const codeRef = useRef(code);
  const testResultsRef = useRef(testResults);
  
  const lastMaximizedDuelRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeDuel?.status === "FINISHED" && activeDuel.id && lastMaximizedDuelRef.current !== activeDuel.id) {
      if (!openWindows.includes("problem")) {
        setOpenWindows(prev => [...prev, "problem"]);
        setWindowFlexes(prev => [...prev, 1]);
      }
      setMaximizedWindow("problem");
      setActiveWindow("problem");
      lastMaximizedDuelRef.current = activeDuel.id;
    }
  }, [activeDuel, openWindows, setMaximizedWindow, setOpenWindows, setWindowFlexes]);
  const sessionRef = useRef(session);
  const guestIdRef = useRef(guestId);
  const pollDuelRef = useRef<() => void>(() => {});
  const wasSignedInRef = useRef(false);

  const handleSetThemeIndex = (idx: number) => {
    setThemeIndex(idx);
    if (session?.user && !isGuest) {
      fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeIndex: idx })
      }).catch(console.error);
    }
  };

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(async res => {
        if (res.ok) {
          const data = await res.json();
          setCachedLeaderboard(data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (session?.user && !isGuest) {
      if (!wasSignedInRef.current) {
        setOpenWindows(["editor"]);
        setWindowFlexes([1]);
        setMaximizedWindow(null);
        setActiveWindow("editor");
        wasSignedInRef.current = true;
      }

      const dbTheme = (session.user as any).themeIndex;
      if (dbTheme !== undefined && dbTheme !== null) {
        setThemeIndex(dbTheme);
        localStorage.setItem("ck-theme-idx", dbTheme.toString());
      }
      
      const dbUsername = (session.user as any).username;
      if (!dbUsername) {
        setShowUsernamePrompt(true);
      } else {
        setShowUsernamePrompt(false);
      }
    } else {
      wasSignedInRef.current = false;
    }
  }, [session, isGuest]);

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) {
      setUsernameError("Username cannot be empty");
      return;
    }
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setShowUsernamePrompt(false);
        updateSession(); // refresh session to get new username
      } else {
        setUsernameError(data.error || "Failed to update username");
      }
    } catch (e) {
      setUsernameError("An error occurred");
    }
  };
  
  useEffect(() => {
    activeDuelRef.current = activeDuel;
    if (!activeDuel) {
      setOpenWindows(prev => prev.filter(w => w !== 'problem'));
    }
  }, [activeDuel]);

  // Keep refs in sync with latest state for stable interval/socket callbacks
  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => { testResultsRef.current = testResults; }, [testResults]);
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { guestIdRef.current = guestId; }, [guestId]);

  const [duelPin, setDuelPin] = useState<string>("");
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>("none");
  const [windowRadius, setWindowRadius] = useState<string>("0.4rem");
  const [windowGap, setWindowGap] = useState<string>("0.75rem");
  const [windowBorderThickness, setWindowBorderThickness] = useState<string>("1px");
  const [navStyle, setNavStyle] = useState<string>("var(--bg)");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [clockOffset, setClockOffset] = useState<number>(0);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [showWorkspaceWarning, setShowWorkspaceWarning] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<SubmissionFeedback | null>(null);
  const [showAiDisabledWarning, setShowAiDisabledWarning] = useState(false);
  const [showDuelInBattleWarning, setShowDuelInBattleWarning] = useState(false);
  const [showDuelHasUplinkWarning, setShowDuelHasUplinkWarning] = useState(false);
  const [showUplinkPendingWarning, setShowUplinkPendingWarning] = useState(false);
  const [showPinCopiedNotification, setShowPinCopiedNotification] = useState(false);
  const [showRatingChangePopup, setShowRatingChangePopup] = useState<{ amount: number, isWin: boolean } | null>(null);
  const [showSignInOptions, setShowSignInOptions] = useState(false);
  const lastFinishedDuelId = useRef<string | null>(null);

  useEffect(() => {
    const handlePinCopied = () => {
      setShowPinCopiedNotification(true);
    };
    window.addEventListener("pin_copied", handlePinCopied);
    return () => window.removeEventListener("pin_copied", handlePinCopied);
  }, []);

  useEffect(() => {
    if (showPinCopiedNotification) {
      const timer = setTimeout(() => setShowPinCopiedNotification(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showPinCopiedNotification]);

  useEffect(() => {
    if (showRatingChangePopup) {
      const timer = setTimeout(() => setShowRatingChangePopup(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [showRatingChangePopup]);

  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("ck-tutorial-seen");
      if (!seen) {
        setShowWelcomePopup(true);
      }
    }
  }, []);

  const [showWaitingPopup, setShowWaitingPopup] = useState(false);
  const [showInviteSentPopup, setShowInviteSentPopup] = useState(false);
  const [pendingInviteTargetId, setPendingInviteTargetId] = useState<string | null>(null);
  const [showOpponentFoundPopup, setShowOpponentFoundPopup] = useState(false);

  useEffect(() => {
    if (showLimitWarning) {
      const timer = setTimeout(() => setShowLimitWarning(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showLimitWarning]);

  useEffect(() => {
    if (showWorkspaceWarning) {
      const timer = setTimeout(() => setShowWorkspaceWarning(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showWorkspaceWarning]);

  useEffect(() => {
    if (showAiDisabledWarning) {
      const timer = setTimeout(() => setShowAiDisabledWarning(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAiDisabledWarning]);

  useEffect(() => {
    if (showDuelInBattleWarning) {
      const timer = setTimeout(() => setShowDuelInBattleWarning(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showDuelInBattleWarning]);

  useEffect(() => {
    if (showDuelHasUplinkWarning) {
      const timer = setTimeout(() => setShowDuelHasUplinkWarning(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showDuelHasUplinkWarning]);

  useEffect(() => {
    if (showUplinkPendingWarning) {
      const timer = setTimeout(() => setShowUplinkPendingWarning(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showUplinkPendingWarning]);

  useEffect(() => {
    if (submissionFeedback) {
      const timer = setTimeout(() => setSubmissionFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [submissionFeedback]);

  // showWaitingPopup does NOT auto-hide because we need the PIN to stay visible.
  // It is manually cleared when an opponent is found or duel is cancelled.

  useEffect(() => {
    if (showOpponentFoundPopup) {
      const timer = setTimeout(() => setShowOpponentFoundPopup(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showOpponentFoundPopup]);

  useEffect(() => {
    const userId = session?.user ? (session.user as any).id : 'guest';
    const saved = localStorage.getItem(`animationSpeed_${userId}`) as AnimationSpeed;
    if (saved) setAnimationSpeed(saved);
    const savedRadius = localStorage.getItem('windowRadius');
    if (savedRadius) setWindowRadius(savedRadius);
    const savedGap = localStorage.getItem('windowGap');
    if (savedGap) setWindowGap(savedGap);
    const savedBorder = localStorage.getItem('windowBorderThickness');
    if (savedBorder) setWindowBorderThickness(savedBorder);
    const savedNav = localStorage.getItem('navStyle');
    if (savedNav) setNavStyle(savedNav);
  }, [session]);

  const handleSetAnimationSpeed = useCallback((speed: AnimationSpeed) => {
    setAnimationSpeed(speed);
    const userId = session?.user ? (session.user as any).id : 'guest';
    localStorage.setItem(`animationSpeed_${userId}`, speed);
  }, [session]);

  useEffect(() => {
    const userId = session?.user ? (session.user as any).id : 'guest';
    localStorage.setItem(`animationSpeed_${userId}`, animationSpeed);
  }, [animationSpeed, session]);

  const getTransition = (): Transition => {
    return { type: "tween", duration: 0 };
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
      { label: t("notesTitle"), id: "notes" as WindowId, icon: <StickyNote size={16} /> },
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
          setFullProfile(data);
          if (typeof window !== 'undefined' && data.notesData) {
            (window as any).ckNotesCache = data.notesData;
          }
          setUserStats({
            battlesWon: data.battlesWon || 0,
            battlesTotal: data.battlesTotal || 0,
            rating: data.rating || 1000,
            dailyWins: data.dailyWins || {},
            currentStreak: data.currentStreak || 0,
            codeKnightsStreak: data.codeKnightsStreak || 0,
            bugHunterStreak: data.bugHunterStreak || 0,
            hackBountyStreak: data.hackBountyStreak || 0,
            mlMagesStreak: data.mlMagesStreak || 0
          });
          // Update session-like data for children that depend on it
          if (session.user) {
            (session.user as any).rating = data.rating;
            (session.user as any).dailyWins = data.dailyWins;
            (session.user as any).isRoyal = !!data.isRoyal;
            (session.user as any).isAdmin = !!data.isAdmin;
            
            if (data.battlesTotal === 0 && typeof localStorage !== 'undefined' && !localStorage.getItem("hasSeenTutorial")) {
              localStorage.setItem("hasSeenTutorial", "true");
              setOpenWindows(prev => prev.includes("tutorial") ? prev : [...prev, "tutorial"]);
              setActiveWindow("tutorial");
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, [session]);

  const fetchFriendsData = useCallback(async () => {
    if (!session) return;
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch("/api/user/friends"),
        fetch("/api/user/requests")
      ]);
      if (friendsRes.ok) setCachedFriends(await friendsRes.json());
      if (requestsRes.ok) setCachedRequests(await requestsRes.json());
    } catch (err) {
      console.error("Fetch friends error:", err);
    }
  }, [session]);

  useEffect(() => {
    window.addEventListener("friends_update_required", fetchFriendsData);
    return () => window.removeEventListener("friends_update_required", fetchFriendsData);
  }, [fetchFriendsData]);

  useEffect(() => {
    const handleOpenAgent = () => {
      const isDuelActive = activeDuelRef.current && activeDuelRef.current.status === "ACTIVE";
      if (isDuelActive) {
        setShowAiDisabledWarning(true);
        return;
      }
      setOpenWindows(prev => {
        if (!prev.includes("agent")) {
          if (prev.length >= maxWindows) {
            setShowLimitWarning(true);
            return prev;
          }
          setWindowFlexes(f => [...f, 1]);
          setTimeout(() => setActiveWindow("agent"), 0);
          return [...prev, "agent"];
        }
        setTimeout(() => setActiveWindow("agent"), 0);
        return prev;
      });
    };
    window.addEventListener("open_agent_window", handleOpenAgent);
    return () => window.removeEventListener("open_agent_window", handleOpenAgent);
  }, [setShowLimitWarning, maxWindows, setShowAiDisabledWarning]);

  const createDuel = useCallback(async (demoMode: boolean = false, options?: { problems?: string[]; unrated?: boolean; gameMode?: string }) => {
    if (pendingInviteTargetId !== null) {
      setShowUplinkPendingWarning(true);
      return;
    }
    try {
      const res = await fetch("/api/duels", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          guestName: isGuest ? guestName : undefined, 
          demoMode,
          problems: options?.problems,
          unrated: options?.unrated,
          gameMode: options?.gameMode
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.pin) {
          setDuelPin(data.pin);
          if (data.serverTime) setClockOffset(data.serverTime - Date.now());
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
  }, [isGuest, guestName, pendingInviteTargetId]);

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
          setShowInviteSentPopup(false);
          if (data.serverTime) setClockOffset(data.serverTime - Date.now());
          if (isGuest && data.guestId) {
            setGuestId(data.guestId);
          }
          console.log("[CLIENT joinDuel] data.questionIds:", data.questionIds, "questions count:", data.questions?.length);
          setActiveDuel(data);
          socketRef.current?.emit("duel_update", { duelId: data.id });
          const actualStart = new Date(data.startedAt || data.createdAt).getTime() - (data.serverTime ? data.serverTime - Date.now() : clockOffset);
          startBattle(data.question || (data.questions && data.questions[0]), actualStart, data);
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

  const handleInviteDuel = useCallback(async (targetId: string, targetName: string, config?: any) => {
    const inBattle = activeDuel && activeDuel.status === "ACTIVE";
    if (inBattle) {
      setShowDuelInBattleWarning(true);
      return;
    }
    const hasUplink = activeDuel && activeDuel.status === "WAITING";
    if (hasUplink) {
      setShowDuelHasUplinkWarning(true);
      return;
    }

    if (config) {
      const myName = (sessionRef.current?.user as any)?.name || (sessionRef.current?.user as any)?.username || "Knight";
      const myId = (sessionRef.current?.user as any)?.id || guestIdRef.current || "host-id";
      const pin = "INV-" + Math.floor(100000 + Math.random() * 900000).toString();
      
      socketRef.current?.emit("invite_duel", { 
        targetId, 
        hostName: myName, 
        hostId: myId,
        gameMode: config.gameMode || "CODEKNIGHTS", 
        unrated: config.unrated || false, 
        problems: config.problems,
        pin 
      });
      setPendingInviteTargetId(targetId);
      setShowInviteSentPopup(true);
      setDuelPin(pin);
      return;
    }

    setInviteTargetForConfig({ id: targetId, name: targetName });
    setOpenWindows(prev => {
      const next = prev.filter(w => w !== "battle");
      next.unshift("battle");
      setWindowFlexes(next.map(() => 1));
      return next;
    });
    setActiveWindow("battle");
  }, [activeDuel]);

  const sendConfiguredInvite = useCallback((options: { problems?: string[]; unrated?: boolean; gameMode?: string }) => {
    if (!inviteTargetForConfig) return;
    
    handleInviteDuel(inviteTargetForConfig.id, inviteTargetForConfig.name, options);
    setInviteTargetForConfig(null);
  }, [inviteTargetForConfig, handleInviteDuel]);

  const cancelInviteDuel = useCallback(() => {
    if (duelPin) {
      socketRef.current?.emit("cancel_invite", { targetId: pendingInviteTargetId, pin: duelPin });
    }
    setShowInviteSentPopup(false);
    setPendingInviteTargetId(null);
    setDuelPin("");
    setActiveDuel(null);
  }, [pendingInviteTargetId, duelPin]);

  const handleBuyRoyal = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to initiate Stripe Checkout.");
    }
  }, []);

  const pollDuel = useCallback(async () => {
    const currentActiveDuel = activeDuelRef.current;
    if (!currentActiveDuel) return;
    if (currentActiveDuel.status === "FINISHED" && currentActiveDuel.hostRatingChange !== null && currentActiveDuel.hostRatingChange !== undefined) {
      return;
    }
    try {
      const res = await fetch(`/api/duels/poll?pin=${currentActiveDuel.pin}&t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        
        // If the component state was cleared (surrender) while this fetch was in flight, 
        // ignore the result to prevent re-opening the window.
        if (activeDuelRef.current === null) return;

        if (data.id) {
          // Merge partial polled data with the existing full duel object, but preserve live socket stats
          const current = activeDuelRef.current;
          const mergedStatus = (current && current.status === "FINISHED") ? "FINISHED" : data.status;
          const updatedDuel = { 
            ...current, 
            ...data,
            status: mergedStatus,
            hostCodeLength: current.hostCodeLength ?? data.hostCodeLength,
            hostLineCount: current.hostLineCount ?? data.hostLineCount,
            hostTestsPassed: current.hostTestsPassed ?? data.hostTestsPassed,
            hostTestsTotal: current.hostTestsTotal ?? data.hostTestsTotal,
            hostLastActive: current.hostLastActive ?? data.hostLastActive,
            guestCodeLength: current.guestCodeLength ?? data.guestCodeLength,
            guestLineCount: current.guestLineCount ?? data.guestLineCount,
            guestTestsPassed: current.guestTestsPassed ?? data.guestTestsPassed,
            guestTestsTotal: current.guestTestsTotal ?? data.guestTestsTotal,
            guestLastActive: current.guestLastActive ?? data.guestLastActive,
          };
          
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
            window.dispatchEvent(new CustomEvent("duel_update_required", { detail: updatedDuel.id }));
          }
          
          if (updatedDuel.status !== "FINISHED" && currentActiveDuel && currentActiveDuel.status !== 'ACTIVE' && updatedDuel.status === 'ACTIVE') {
            setShowOpponentFoundPopup(true);
            setShowWaitingPopup(false);
            setShowInviteSentPopup(false);
            setPendingInviteTargetId(null);
            const actualStart = new Date(updatedDuel.startedAt || updatedDuel.createdAt).getTime() - (data.serverTime ? data.serverTime - Date.now() : clockOffset);
            startBattle(updatedDuel.question || (updatedDuel.questions && updatedDuel.questions[0]), actualStart, updatedDuel);
          }
          if (data.serverTime) setClockOffset(data.serverTime - Date.now());
          console.log("[CLIENT pollDuel] updatedDuel.questionIds:", updatedDuel.questionIds, "questions count:", updatedDuel.questions?.length);
          setActiveDuel(updatedDuel);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [session, fetchUserStats]);

  useEffect(() => {
    const isDuelActive = activeDuel && activeDuel.status === "ACTIVE";
    if (!isDuelActive) return;

    // 1. Refresh Prevention Warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 2. Auto-surrender via Beacon API on page refresh / close
    const handleUnload = () => {
      const url = "/api/duels/submit";
      const payload = JSON.stringify({ 
        duelId: activeDuel.id, 
        surrender: true, 
        code: code, 
        guestUserId: guestId || undefined 
      });
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    };
    window.addEventListener("unload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
    };
  }, [activeDuel, code, guestId]);

  const socketRef = useRef<Socket | null>(null);

  // Keep pollDuelRef in sync so socket handlers always call the latest version
  useEffect(() => { pollDuelRef.current = pollDuel; }, [pollDuel]);

  useEffect(() => {
    const isDev = process.env.NODE_ENV === "development";
    socketRef.current = io({
      transports: isDev ? ["polling", "websocket"] : ["websocket"], // Prevent HTTP long-polling fallback on Vercel
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 30000,
    });
    
    socketRef.current.on("opponent_progress", (data) => {
      setActiveDuel(prev => {
        if (!prev || prev.id !== data.duelId) return prev;
        const userId = sessionRef.current?.user ? (sessionRef.current.user as any).id : guestIdRef.current;
        const isHost = prev.hostId === userId;
        return {
          ...prev,
          ...(isHost ? {
            guestCodeLength: data.codeLength,
            guestLineCount: data.lineCount,
            guestTestsPassed: data.testsPassed,
            guestTestsTotal: data.testsTotal,
            guestLastActive: new Date().toISOString(),
            guestCode: data.code
          } : {
            hostCodeLength: data.codeLength,
            hostLineCount: data.lineCount,
            hostTestsPassed: data.testsPassed,
            hostTestsTotal: data.testsTotal,
            hostLastActive: new Date().toISOString(),
            hostCode: data.code
          })
        };
      });
    });

    socketRef.current.on("duel_update", () => {
      pollDuelRef.current();
    });

    socketRef.current.on("opponent_surrendered", () => {
      setActiveDuel(prev => {
        if (!prev) return prev;
        const userId = sessionRef.current?.user ? (sessionRef.current.user as any).id : guestIdRef.current;
        const isHost = prev.hostId === userId;
        return {
            ...prev,
            [isHost ? 'guestPenalty' : 'hostPenalty']: 0,
            status: "FINISHED"
        };
      });
      // Allow database to finish updating before polling for Elo changes
      setTimeout(() => pollDuelRef.current(), 500);
    });

    socketRef.current.on("duel_invite", (data) => {
      const userId = sessionRef.current?.user ? (sessionRef.current.user as any).id : (isGuest ? guestIdRef.current : null);
      console.log("RECEIVED duel_invite. targetId:", data.targetId, "my userId:", userId, "data:", data);
      if (userId && data.targetId === userId) {
         setIncomingInvite(data);
      }
    });

    socketRef.current.on("cancel_invite", (data) => {
      setIncomingInvite(prev => prev?.pin === data.pin ? null : prev);
    });

    socketRef.current.on("invite_rejected", (data) => {
      if (duelPin && duelPin === data.pin) {
        alert("Your duel request was rejected.");
        setShowInviteSentPopup(false);
        setPendingInviteTargetId(null);
        setDuelPin("");
        setActiveDuel(null);
      }
    });

    socketRef.current.on("invite_accepted", (data) => {
      const myId = sessionRef.current?.user ? (sessionRef.current.user as any).id : (isGuest ? guestIdRef.current : null);
      if (myId && data.hostId === myId) {
         setDuelPin(data.pin);
         setShowInviteSentPopup(false);
         setPendingInviteTargetId(null);
         
         const actualStart = new Date(data.duel.startedAt || data.duel.createdAt).getTime() - (data.duel.serverTime ? data.duel.serverTime - Date.now() : clockOffset);
         startBattle(data.duel.question || (data.duel.questions && data.duel.questions[0]), actualStart, data.duel);
         setActiveDuel(data.duel);
      }
    });

    socketRef.current.on("online_users_update", (usersArray: string[]) => {
      setOnlineUsers(new Set(usersArray));
    });

    socketRef.current.on("connect", () => {
      const id = activeDuelRef.current?.id;
      if (id) {
        socketRef.current?.emit("join_duel", id);
      }
      
      const userId = sessionRef.current?.user ? (sessionRef.current.user as any).id : (isGuest ? guestIdRef.current : null);
      if (userId) {
        socketRef.current?.emit("identify", userId);
      }
    });

    const handleCustomDuelUpdate = (e: any) => {
      const id = e.detail || activeDuelRef.current?.id;
      if (id) {
        socketRef.current?.emit("duel_update", { duelId: id });
        pollDuelRef.current();
      }
    };
    window.addEventListener("duel_update_required", handleCustomDuelUpdate);

    return () => {
      window.removeEventListener("duel_update_required", handleCustomDuelUpdate);
      socketRef.current?.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUserStats();
      updateSession();
    };
    window.addEventListener("profile_update_required", handleProfileUpdate);
    return () => window.removeEventListener("profile_update_required", handleProfileUpdate);
  }, [fetchUserStats, updateSession]);

  useEffect(() => {
    const id = activeDuel?.id;
    if (id && socketRef.current?.connected) {
      socketRef.current.emit("join_duel", id);
    }
    return () => {
      if (id && socketRef.current?.connected) {
        socketRef.current.emit("leave_duel", id);
      }
    };
  }, [activeDuel?.id]);

  // Fallback polling for WAITING duels to ensure the host starts when a guest joins,
  // especially on platforms where Socket.io WebSockets might be unavailable (e.g. Vercel).
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (activeDuel?.status === "WAITING") {
      interval = setInterval(() => {
        pollDuelRef.current();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDuel?.status]);

  // Send real-time progress updates to the server every 500ms during an active duel.
  // Uses refs for volatile values (code, testResults) to avoid restarting the interval on every keystroke.
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (activeDuel?.status === "ACTIVE") {
      interval = setInterval(() => {
        if (socketRef.current) {
          const currentCode = codeRef.current;
          const currentTestResults = testResultsRef.current;
          
          const currentUserId = sessionRef.current?.user ? (sessionRef.current.user as any).id : guestIdRef.current;
          const isHostLocal = activeDuelRef.current?.hostId === currentUserId;
          const opponentFinalized = isHostLocal ? (activeDuelRef.current as any)?.guestFinalized : (activeDuelRef.current as any)?.hostFinalized;

          const body: any = {
            duelId: activeDuelRef.current?.id,
            codeLength: currentCode.length,
            lineCount: currentCode.split("\n").length,
            testsPassed: currentTestResults?.passed || 0,
            testsTotal: currentTestResults?.total || 0,
          };
          
          // Only transmit full source code over the socket if the opponent is spectating (finalized)
          // This drastically reduces outbound network upload bandwidth.
          if (opponentFinalized) {
             body.code = currentCode;
          }
          
          socketRef.current.emit("progress_update", body);
        }
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDuel?.status]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (activeDuel && activeDuel.status === "ACTIVE") {
      const difficultyTimeLimits: Record<string, number> = {
        "Easy": 8 * 60,
        "Medium": 12 * 60,
        "Hard": 18 * 60
      };
      let limit = activeDuel.totalTime ? activeDuel.totalTime * 60 : (difficultyTimeLimits[activeDuel.question?.difficulty] || 8 * 60);
      
      const currentUserId = session?.user ? (session.user as any).id : guestId;
      const isHostLocal = activeDuel.hostId === currentUserId;
      const opponentFinalized = isHostLocal ? (activeDuel as any).guestFinalized : (activeDuel as any).hostFinalized;
      const opponentSolveTimeMs = isHostLocal ? activeDuel.guestSolveTime : activeDuel.hostSolveTime;
      
      let deadline: number;
      if (activeDuel.phase === "BREAKING" && activeDuel.phaseEndsAt) {
          deadline = new Date(activeDuel.phaseEndsAt).getTime() - clockOffset;
      } else {
          if (opponentFinalized && opponentSolveTimeMs) {
              const opponentSecs = Math.floor(opponentSolveTimeMs / 1000);
              limit = Math.min(limit, opponentSecs + 120);
          }
          const startTime = new Date(activeDuel.startedAt || activeDuel.createdAt || Date.now()).getTime() - clockOffset;
          deadline = startTime + limit * 1000;
      }
      
      let hasTriggeredTransition = false;
      const updateTimeLeft = () => {
        // Calculate from an absolute deadline so delayed intervals, tab throttling,
        // and temporary browser pauses cannot make the clock drift.
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        setTimeLeft(remaining);
        
        if (remaining <= 0 && activeDuel.phase === "BREAKING" && !hasTriggeredTransition) {
           hasTriggeredTransition = true;
           fetch("/api/duels/transition", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ duelId: activeDuel.id, guestUserId: guestId, code: codeRef.current })
           }).then(res => res.json()).then(data => {
              if (data.phase === "FIXING") {
                 // The server transitioned the phase. 
                 // Emit a socket event to sync both clients.
                 socketRef.current?.emit("duel_update", { duelId: activeDuel.id });
              }
           });
        }
        
        return remaining > 0;
      };

      if (updateTimeLeft()) {
        interval = setInterval(() => {
          if (!updateTimeLeft() && interval) clearInterval(interval);
        }, 250);
      }
    } else {
      setTimeLeft(null);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDuel, clockOffset]);

  const [lastProcessedPhase, setLastProcessedPhase] = useState<string | null>(null);

  useEffect(() => {
    if (activeDuel && activeDuel.gameMode === "HACKBOUNTY" && activeDuel.questions && activeDuel.questions.length >= 1) {
       const currentUserId = session?.user ? (session.user as any).id : guestId;
       const isHost = activeDuel.hostId === currentUserId;
       
       if (activeDuel.phase && activeDuel.phase !== lastProcessedPhase) {
           setLastProcessedPhase(activeDuel.phase);
           
           if (activeDuel.phase === "BREAKING") {
               const myQuestion = activeDuel.questions[0];
               setActiveQuestion(myQuestion);
               if (myQuestion?.referenceCode) {
                   try {
                       const refs = JSON.parse(myQuestion.referenceCode);
                       if (refs[lang]) setCode(refs[lang]);
                       else setCode("// No reference code available for this language");
                   } catch(e) {}
               }
           } else if (activeDuel.phase === "FIXING") {
               const oppQuestion = activeDuel.questions[0];
               setActiveQuestion(oppQuestion);
               const oppCode = isHost ? (activeDuel as any).guestSabotagedCode : (activeDuel as any).hostSabotagedCode;
               if (oppCode) {
                   setCode(oppCode);
               }
           }
       }
    }
  }, [activeDuel, lastProcessedPhase, session, guestId, lang, setActiveQuestion, setCode]);
  useEffect(() => {
    const savedLang = localStorage.getItem("ck-lang") as Language;
    if (savedLang) setLang(savedLang);
    const savedCode = localStorage.getItem("ck-code");
    if (savedCode) setCode(savedCode);
    const savedTheme = localStorage.getItem("ck-theme-idx");
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
    
    setOpenWindows(["editor"]);
    setWindowFlexes([1]);
    
    setIsLoaded(true);
  }, []);

  // PERSISTENCE EFFECT
  useEffect(() => {
    if (!isLoaded) return;
    
    const timeout = setTimeout(() => {
      localStorage.setItem("ck-lang", lang);
      localStorage.setItem("ck-code", code);
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
          'editorSuggestWidget.background': theme.bg,
          'editorSuggestWidget.border': theme.accent + '66',
          'editorSuggestWidget.foreground': isLightTheme ? '#000000' : '#ffffff',
          'editorSuggestWidget.selectedBackground': theme.accent + '44',
          'editorSuggestWidget.highlightForeground': theme.accent,
          'editorSuggestWidget.focusHighlightForeground': theme.accent,
        }
      });
      monaco.editor.setTheme('dynamic-theme');
    }).catch(err => {
      // Monaco loader can reject with a cancellation object when the operation
      // is manually canceled by the loader or during fast HMR. Ignore those.
      try {
        if (err && (err.type === 'cancelation' || err.msg === 'operation is manually canceled' || err.name === 'Canceled')) return;
      } catch (e) {
        // ignore
      }
      // Log other errors so they can be investigated
      // eslint-disable-next-line no-console
      console.error('Monaco init error:', err);
    });
  }, [themeIndex, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      // Update dynamic favicon
      const theme = THEMES[themeIndex];
      const svg = `
        <svg viewBox="6 2 88 96" width="100" height="100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <style>
            .text-color { stroke: #FFF; }
            @media (prefers-color-scheme: light) {
              .text-color { stroke: #000; }
            }
          </style>
          <path class="text-color" d="M50 5 L90 20 V50 C90 80 50 95 50 95 C50 95 10 80 10 50 V20 Z" stroke-width="6" stroke-linejoin="round"/>
          <circle cx="50" cy="22" r="4" fill="${theme.accent}" />
          <path d="M50 26 V36" stroke="${theme.accent}" stroke-width="4" />
          <path d="M38 36 H62" stroke="${theme.accent}" stroke-width="4" stroke-linecap="round" />
          <path d="M46 38 V70 L50 85 L54 70 V38 Z" fill="${theme.accent}" />
          <path class="text-color" d="M32 48 L22 58 L32 68" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
          <path class="text-color" d="M68 48 L78 58 L68 68" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `;
      
      const link = document.getElementById('dynamic-favicon') as HTMLLinkElement;
      if (link) {
        link.href = 'data:image/svg+xml;base64,' + btoa(svg);
      }
    }
  }, [themeIndex, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      fetchQuestions();
      fetchUserStats();
      fetchFriendsData();
    }
  }, [isLoaded, fetchQuestions, fetchUserStats, fetchFriendsData]);

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
          hiddenTestCases: [],
          timeLimit: 5000,
          memoryLimit: 256,
          brokenCode: ""
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
          hiddenTestCases: [],
          timeLimit: 5000,
          memoryLimit: 256,
          brokenCode: ""
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
      hiddenTestCases: q.hiddenTestCases ? (typeof q.hiddenTestCases === 'string' ? JSON.parse(q.hiddenTestCases) : q.hiddenTestCases) : [],
      timeLimit: q.timeLimit ?? 5000,
      memoryLimit: q.memoryLimit ?? 256,
      brokenCode: q.brokenCode || ""
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

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const now = ctx.currentTime;
      
      // Play 3 rapid beeps
      for (let i = 0; i < 3; i++) {
        const startTime = now + i * 0.25; // 250ms interval between beeps
        
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.type = 'sine';
        osc2.type = 'triangle';
        
        // Play a pleasant "ding" chord (C5 + E5)
        osc1.frequency.setValueAtTime(523.25, startTime);
        osc2.frequency.setValueAtTime(659.25, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + 0.2);
        osc2.stop(startTime + 0.2);
      }
    } catch (e) {
      console.error("Failed to play notification sound", e);
    }
  };

  const startBattle = useCallback((question?: Question, forceStartTime?: number, overrideDuel?: any) => {
    if (document.visibilityState === 'hidden') {
      playNotificationSound();
    }
    
    const q = question || (questions.length > 0 ? questions[Math.floor(Math.random() * questions.length)] : DEFAULT_QUESTION);
    if (!q) return;
    
    const currentDuel = overrideDuel || activeDuel;
    
    setActiveQuestion(q);
    setTestResults(null);
    setProblemTestResults({});
    setProblemScores({});
    setProblemWrongAttemptCounts({});
    setWrongAttemptCount(0); // Reset
    setActiveQuestionIndex(0);
    problemCodesRef.current = {};
    
    let initialLang = lang;
    let initialCode = "";
    if (currentDuel?.gameMode === "BUGHUNTER" && q.brokenCode) {
      try {
        const parsed = JSON.parse(q.brokenCode);
        const availableLangs = Object.keys(parsed);
        if (availableLangs.length > 0) {
          // If the difficulty matches a language, prioritize it, otherwise pick the first available
          const diffLang = q.difficulty?.toLowerCase();
          if (diffLang && availableLangs.includes(diffLang)) {
            initialLang = diffLang as Language;
          } else {
            initialLang = availableLangs[0] as Language;
          }
          setLang(initialLang);
          initialCode = parsed[initialLang] || "";
        }
      } catch (e) {
        console.error("Failed to parse initial brokenCode", e);
      }
    }
    
    if (!initialCode) {
      initialCode = LANG_CONFIG[initialLang]?.defaultCode || "";
    }
    setCode(initialCode);

    // If it's a duel, use startedAt as the start time, otherwise now.
    const startTime = forceStartTime || (currentDuel ? new Date(currentDuel.startedAt || currentDuel.createdAt || Date.now()).getTime() - clockOffset : Date.now());
    setBattleStartTime(startTime);
    
    setSolveTime(null);
    
    if (maximizedWindow === "battle") setMaximizedWindow(null);

    setOpenWindows(prev => {
      const next = prev.filter(w => w !== "battle" && w !== "agent");
      if (!next.includes("problem")) next.push("problem");
      if (!next.includes("editor")) next.unshift("editor");
      
      setWindowFlexes(next.map(w => w === "editor" ? 1.5 : 1));
      return next;
    });
    setActiveWindow("editor");
  }, [questions, maximizedWindow, activeDuel, lang, setLang]);

  const changeActiveQuestion = useCallback((index: number) => {
    const currentDuel = activeDuel;
    if (!currentDuel || !currentDuel.questions || !currentDuel.questions[index]) return;
    
    // Save current code for current activeQuestion synchronously in ref
    if (activeQuestion) {
      problemCodesRef.current[activeQuestion.id] = code;
    }
    
    // Load new code
    const targetQ = currentDuel.questions[index];
    
    let targetLang = lang;
    let newCode = problemCodesRef.current[targetQ.id];
    
    if (currentDuel.gameMode === "BUGHUNTER" && targetQ.brokenCode) {
      try {
        const parsed = JSON.parse(targetQ.brokenCode);
        const availableLangs = Object.keys(parsed);
        if (availableLangs.length > 0) {
          const diffLang = targetQ.difficulty?.toLowerCase();
          if (diffLang && availableLangs.includes(diffLang)) {
            targetLang = diffLang as Language;
          } else {
            targetLang = availableLangs[0] as Language;
          }
          setLang(targetLang);
          
          if (newCode === undefined) {
             newCode = parsed[targetLang] || "";
          }
        }
      } catch (e) {
        console.error("Failed to parse brokenCode", e);
      }
    }

    if (newCode === undefined) {
      newCode = LANG_CONFIG[targetLang]?.defaultCode || "";
    }
    setCode(newCode);
    
    setActiveQuestionIndex(index);
    setActiveQuestion(targetQ);

    const savedResults = problemTestResults[targetQ.id] || null;
    setTestResults(savedResults);
    setWrongAttemptCount(problemWrongAttemptCounts[targetQ.id] ?? 0);
  }, [activeDuel, activeQuestion, code, lang, problemTestResults, problemWrongAttemptCounts, setLang]);

  const startQuickMatch = useCallback(async (
    mode: 'create' | 'find' = 'find',
    settings?: { problems?: string[]; isRanked?: boolean; gameMode?: string }
  ) => {
    try {
      const res = await fetch('/api/duels/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          guestName: isGuest ? guestName : undefined,
          forceCreate: mode === 'create',
          findOnly: mode === 'find',
          problems: settings?.problems,
          unrated: settings?.isRanked === false,
          gameMode: settings?.gameMode
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          // If returned duel is waiting, show waiting UI; if active, start immediately
          if (data.serverTime) setClockOffset(data.serverTime - Date.now());
          if (isGuest && data.hostId) {
            setGuestId(data.hostId);
          }
          setActiveDuel(data);
          socketRef.current?.emit("duel_update", { duelId: data.id });
          if (data.status === 'ACTIVE') {
            setShowWaitingPopup(false);
            setShowOpponentFoundPopup(true);
            const actualStart = new Date(data.startedAt || data.createdAt).getTime() - (data.serverTime ? data.serverTime - Date.now() : clockOffset);
            startBattle(data.question || (data.questions && data.questions[0]), actualStart, data);
          }
        }
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "No active public match found.");
        throw new Error(data.error || "Quick match failed");
      }
    } catch (err) {
      console.error('Quick match error:', err);
      throw err;
    }
  }, [isGuest, guestName, clockOffset, startBattle]);

  const runTests = useCallback(async () => {
    if (!activeQuestion) return;
    setIsTesting(true);
    setShowTerminal(true);
    setTestResults(null);
    setCompileErrors([]);
    
    try {
      setTerminalOutput("Running tests securely on the server...\nThis might take a few seconds.");

      const res = await fetch("/api/run-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: lang, questionId: activeQuestion.id })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.compileErrors) {
          setCompileErrors(errorData.compileErrors);
          setTerminalOutput(`Compilation Error:\n${errorData.error}`);
        } else {
          setTerminalOutput(`Error: ${errorData.error || 'Failed to run tests'}`);
        }
        recordWrongAttempt(activeQuestion.id);
        setIsTesting(false);
        return;
      }

      const data = await res.json();
      
      if (data.compileErrors) {
        setCompileErrors(data.compileErrors);
        setTerminalOutput(`Compilation Error:\n${data.error}`);
        recordWrongAttempt(activeQuestion.id);
        setIsTesting(false);
        return;
      }

      if (data.error) {
         setTerminalOutput(`Error:\n${data.error}`);
         recordWrongAttempt(activeQuestion.id);
         setIsTesting(false);
         return;
      }

      const { passed, total, details } = data;
      const allTestsLength = total || details.length;
      
      const newResults = { passed, total: allTestsLength, details };
      setTestResults(newResults);
      setSubmissionFeedback(getSubmissionFeedback(passed, allTestsLength));
      if (data.timedOut && data.executionNotice) {
        setTerminalOutput(`${data.executionNotice}\n\nPartial score awarded for ${passed} passed test${passed === 1 ? "" : "s"}.`);
      }

      if (activeQuestion) {
        setProblemTestResults(prev => ({ ...prev, [activeQuestion.id]: newResults }));
        const allTestsPassed = passed === allTestsLength && allTestsLength > 0;
        
        let currentProblemScore = 0;
        if (activeDuel && activeDuel.gameMode === "BUGHUNTER") {
          if (allTestsPassed) {
            let broken = "";
            if (activeQuestion.brokenCode) {
              try {
                const parsed = JSON.parse(activeQuestion.brokenCode);
                broken = parsed[lang] || "";
              } catch (e) {
                console.error("Failed to parse brokenCode", e);
              }
            }
            // Strip whitespace to prevent formatting from penalizing the score
            const brokenClean = broken.replace(/\s+/g, '');
            const codeClean = code.replace(/\s+/g, '');
            const dist = levenshtein(brokenClean, codeClean);
            
            // Base score 1000 + time bonus. Penalize heavily (15 pts) per character diff.
            currentProblemScore = Math.max(0, 1000 + (timeLeft ?? 0) - (dist * 15));
          } else {
            currentProblemScore = 0;
          }
        } else {
          const failedAttempts = (problemWrongAttemptCounts[activeQuestion.id] ?? 0) + (allTestsPassed ? 0 : 1);
          const submissionPenalty = failedAttempts >= 3 ? 100 : failedAttempts >= 1 ? 50 : 0;
          
          const difficultyTimeLimits: Record<string, number> = {
            "Easy": 8 * 60,
            "Medium": 12 * 60,
            "Hard": 18 * 60
          };
          const limit = activeDuel.totalTime ? activeDuel.totalTime * 60 : (difficultyTimeLimits[activeQuestion.difficulty] || 8 * 60);
          const elapsed = Math.max(0, limit - (timeLeft ?? 0));
          const timeFraction = Math.min(1, elapsed / limit);
          const reduction = Math.floor(timeFraction * 20); // 0 to 20 max reduction per test
          
          currentProblemScore = Math.max(0, passed * (50 - reduction) - submissionPenalty);
        }

        setProblemScores(prev => {
          const nextScores = { ...prev, [activeQuestion.id]: currentProblemScore };
          const totalScore = Object.values(nextScores).reduce((sum, v) => sum + v, 0);
          setTotalPenalty(totalScore);

          if (activeDuel && activeDuel.status === "ACTIVE") {
            const time = Math.floor((Date.now() - (battleStartTime || Date.now())) / 1000);
            const totalComplexity = analysis?.scores
              ? (analysis.scores.efficiency + analysis.scores.readability + analysis.scores.maintainability + analysis.scores.security) : 0;

            fetch("/api/duels/submit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  duelId: activeDuel.id,
                  solveTime: time * 1000,
                  complexityScore: totalComplexity,
                  totalPenalty: totalScore,
                  code: code,
                  guestUserId: guestId || undefined
              })
            }).catch(console.error);
          }
          return nextScores;
        });

        if (!allTestsPassed) {
          recordWrongAttempt(activeQuestion.id);
        }
      }

      if (passed === allTestsLength) {
        const time = Math.floor((Date.now() - (battleStartTime || Date.now())) / 1000);
        const mins = Math.floor(time / 60);
        const secs = time % 60;
        const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
        setSolveTime(formatted);

        analyzeCode(code, lang, activeQuestion);
        fetchUserStats();
      } else {
        // Failed test runs are recorded above per problem.
      }
    } catch (err: unknown) {
      setTerminalOutput(`Network Error: ${err instanceof Error ? err.message : "Failed to connect to execution server."}`);
      console.error(err);
    } finally {
      setIsTesting(false);
    }
  }, [activeQuestion, code, lang, battleStartTime, analyzeCode, fetchUserStats, activeDuel, timeLeft, problemWrongAttemptCounts, guestId, recordWrongAttempt]);

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
      if (activeDuel?.gameMode === "BUGHUNTER" && activeQuestion?.brokenCode) {
        try {
          const parsed = JSON.parse(activeQuestion.brokenCode);
          setCode(parsed[lang] || "");
        } catch (e) {
          console.error("Failed to revert to broken code", e);
          setCode(LANG_CONFIG[lang].defaultCode);
        }
      } else {
        setCode(LANG_CONFIG[lang].defaultCode);
      }
    }
  };

  const handleBeautify = async () => {
    try {
      if (lang === "cpp" || lang === "c" || lang === "java") {
        const formatted = beautify.js(code, { indent_size: 4, space_in_empty_paren: true, brace_style: "collapse" });
        setCode(formatted);
      } else {
        if (editorRef.current) {
          editorRef.current.getAction('editor.action.formatDocument')?.run();
        }
      }
    } catch (err) {
      console.error("Beautify failed", err);
    }
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
    
    if (id === "agent") {
      const isDuelActive = activeDuel && activeDuel.status === "ACTIVE";
      if (isDuelActive) {
        setShowAiDisabledWarning(true);
        return;
      }
    }
    
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
      if (activeDuel.pin && activeDuel.pin.startsWith("QM-")) {
        const currentDuel = activeDuel;
        setActiveDuel(null);
        setDuelPin("");
        setShowCancelDuel(false);
        setShowWaitingPopup(false);
        setShowInviteSentPopup(false);
        if (maximizedWindow === "battle") setMaximizedWindow(null);
        if (currentDuel) {
          fetch("/api/duels/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ duelId: currentDuel.id, surrender: true, code: code, guestUserId: guestId || undefined })
          }).catch(err => console.error("Failed to terminate duel:", err));
        }
      } else {
        setShowCancelDuel(true);
        return;
      }
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

        const nextWindows = prev.filter(w => w !== id);
        // Safety: always ensure editor is there
        if (!nextWindows.includes("editor")) nextWindows.unshift("editor");
        return nextWindows;
      } else {
        if (prev.includes(id)) return prev;
        
        if (prev.length >= maxWindows) {
          setShowLimitWarning(true);
          return prev;
        }
        
        const activeIdx = prev.indexOf(activeWindow);
        const insertIdx = activeIdx !== -1 ? activeIdx + 1 : prev.length;

        setWindowFlexes(flexes => {
          const nextFlexes = [...flexes];
          const flexInsertIdx = Math.min(insertIdx, nextFlexes.length);
          nextFlexes.splice(flexInsertIdx, 0, 1);
          return nextFlexes;
        });
        
        if (maximizedWindow) setMaximizedWindow(null);
        setActiveWindow(id);
        
        const nextWindows = [...prev];
        nextWindows.splice(insertIdx, 0, id);
        
        if (!nextWindows.includes("editor")) nextWindows.unshift("editor");
        return nextWindows;
      }
    });
  }, [activeQuestion, testResults, activeDuel, maximizedWindow, activeWindow, setMaximizedWindow, setActiveWindow, setOpenWindows, setWindowFlexes, setActiveQuestion, setTestResults, setShowQuitConfirmation, setShowCancelDuel, setShowLimitWarning, maxWindows, setShowAiDisabledWarning]);

  const openAgentWindow = useCallback(() => {
    const isDuelActive = activeDuel && activeDuel.status === "ACTIVE";
    if (isDuelActive) {
      setShowAiDisabledWarning(true);
      return;
    }
    setOpenWindows(prev => {
      if (prev.includes("agent")) {
        setActiveWindow("agent");
        return prev;
      }
      if (prev.length >= maxWindows) {
        setShowLimitWarning(true);
        return prev;
      }

      const activeIdx = prev.indexOf(activeWindow);
      const insertIdx = activeIdx !== -1 ? activeIdx + 1 : prev.length;

      setWindowFlexes(flexes => {
        const nextFlexes = [...flexes];
        const flexInsertIdx = Math.min(insertIdx, nextFlexes.length);
        nextFlexes.splice(flexInsertIdx, 0, 1);
        return nextFlexes;
      });

      if (maximizedWindow) setMaximizedWindow(null);
      setActiveWindow("agent");
      
      const nextWindows = [...prev];
      nextWindows.splice(insertIdx, 0, "agent");
      
      if (!nextWindows.includes("editor")) nextWindows.unshift("editor");
      return nextWindows;
    });
  }, [activeDuel, maximizedWindow, setOpenWindows, setWindowFlexes, setActiveWindow, setShowLimitWarning, maxWindows, setShowAiDisabledWarning]);

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

      // Alt + Shift + Q to close workspace
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        closeWorkspace();
        return;
      }

      // Alt + 1-9 to switch workspaces
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        switchWorkspace(index);
        return;
      }

      // Alt + ' to run code
      if (e.altKey && (e.key === "'" || e.key === "Enter")) {
        e.preventDefault();
        runCode();
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
  }, [vimMode, runCode, openWindows, maximizedWindow, hoveredWindow, activeWindow, toggleWindow, toggleMaximize, switchWorkspace, closeWorkspace]);

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
            tabSize={tabSize}
            insertSpaces={insertSpaces}
            setFontSize={setFontSize}
            setTerminalFontSize={setTerminalFontSize}
            activeQuestionId={activeQuestion?.id}
            isLangLocked={!!activeDuel && activeDuel.gameMode === "BUGHUNTER"}
          />
        );
      case "settings":
        return (
          <SettingsWindow 
            themeIndex={themeIndex} setThemeIndex={handleSetThemeIndex}
            fontFamily={fontFamily} setFontFamily={setFontFamily}
            fontSize={fontSize} setFontSize={setFontSize}
            terminalFontSize={terminalFontSize} setTerminalFontSize={setTerminalFontSize}
            vimMode={vimMode} setVimMode={setVimMode}
            uiLang={uiLang} setUiLang={setUiLang}
            animationSpeed={animationSpeed} setAnimationSpeed={handleSetAnimationSpeed}
            windowRadius={windowRadius} setWindowRadius={(r) => {
              setWindowRadius(r);
              localStorage.setItem('windowRadius', r);
            }}
            windowGap={windowGap} setWindowGap={(g) => {
              setWindowGap(g);
              localStorage.setItem('windowGap', g);
            }}
            windowBorderThickness={windowBorderThickness} setWindowBorderThickness={(t) => {
              setWindowBorderThickness(t);
              localStorage.setItem('windowBorderThickness', t);
            }}
            navStyle={navStyle} setNavStyle={(n) => {
              setNavStyle(n);
              localStorage.setItem('navStyle', n);
            }}
            tabSize={tabSize} setTabSize={setTabSize}
            insertSpaces={insertSpaces} setInsertSpaces={setInsertSpaces}
            t={t}
          />
        );

      case "battle":
        return (
          <BattleWindow 
            startBattle={startBattle} questions={questions}
            startQuickMatch={startQuickMatch}
            session={session} isGuest={isGuest} handlePlayAsGuest={handlePlayAsGuest} guestId={guestId}
            showSignInOptions={showSignInOptions} setShowSignInOptions={setShowSignInOptions}
            t={t} onDeleteQuestion={handleDeleteQuestion} onEditQuestion={onEditQuestion}
            createDuel={createDuel} joinDuel={joinDuel} activeDuel={activeDuel}
            userStats={userStats}
            inviteTargetForConfig={inviteTargetForConfig}
            sendConfiguredInvite={sendConfiguredInvite}
            cancelConfiguredInvite={() => setInviteTargetForConfig(null)}
            setActiveDuel={setActiveDuel} setDuelPin={setDuelPin}
            showCancelDuel={showCancelDuel} setShowCancelDuel={setShowCancelDuel}
            isWaitingForResponse={pendingInviteTargetId !== null}
            handleCancelDuel={async () => { 
                const currentDuel = activeDuel;
                setActiveDuel(null); 
                setDuelPin(""); 
                setShowCancelDuel(false); 
                setShowWaitingPopup(false);
                setShowInviteSentPopup(false);
                if (maximizedWindow === "battle") setMaximizedWindow(null);

                if (currentDuel) {
                    try {
                      await fetch("/api/duels/submit", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ duelId: currentDuel.id, surrender: true, code: code, guestUserId: guestId || undefined })
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
          <AgentWindow t={t} lang={lang} setLang={setLang} code={code} setCode={setCode} isBattleActive={!!activeDuel && activeDuel.status === 'ACTIVE'} session={session} />
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
      case "notes":
        return (
          <NotesWindow t={t} openAgentWindow={openAgentWindow} setCode={setCode} />
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
            setCode={setCode}
            showQuitConfirmation={showQuitConfirmation}
            setShowQuitConfirmation={setShowQuitConfirmation}
            onOpenUserProfile={(userId) => {
              const winId = `profile_${userId}` as WindowId;
              if (!openWindows.includes(winId)) {
                toggleWindow(winId);
              } else {
                setActiveWindow(winId);
              }
            }}
            handleQuitBattle={async () => {
              const currentDuel = activeDuel;
              const isDuelActive = activeDuel?.status === "ACTIVE";

              if (currentDuel && isDuelActive && socketRef.current) {
                socketRef.current.emit("opponent_surrendered", { duelId: currentDuel.id });
              }

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
                  const res = await fetch("/api/duels/submit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ duelId: currentDuel.id, surrender: true, code: code, guestUserId: guestId || undefined })
                  });
                  const updatedDuel = await res.json();
                  window.dispatchEvent(new CustomEvent("duel_update_required", { detail: currentDuel.id }));

                  const userId = session?.user ? (session.user as any).id : "guest";
                  const isHost = updatedDuel.hostId === userId;
                  const change = isHost ? updatedDuel.hostRatingChange : updatedDuel.guestRatingChange;
                  if (change !== null && change !== undefined && change !== 0) {
                      setShowRatingChangePopup({ amount: change, isWin: change > 0 });
                      fetchUserStats();
                  }
                } catch (err) {
                  console.error("Surrender failed:", err);
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
            isAnalyzing={isAnalyzing}
            onAnalyzeComplexity={analyzeProblemComplexity}
            activeDuel={activeDuel}
            timeLeft={timeLeft}
            setActiveDuel={setActiveDuel}
            setDuelPin={setDuelPin}
            activeQuestionIndex={activeQuestionIndex}
            changeActiveQuestion={changeActiveQuestion}
            problemTestResults={problemTestResults}
            problemScores={problemScores}
            problemWrongAttemptCounts={problemWrongAttemptCounts}
          />
        );
      case "profile":
        return <ProfileWindow 
                 session={session} 
                 userId={undefined} 
                 t={t} 
                 cachedProfile={fullProfile} 
                 onInviteDuel={handleInviteDuel}
                 pendingInviteTargetId={pendingInviteTargetId}
                 onCancelInvite={cancelInviteDuel}
                 addToEditor={(c) => {
                     setCode(c);
                     if (!openWindows.includes("editor")) setOpenWindows(prev => [...prev, "editor"]);
                     setActiveWindow("editor");
                 }}
               />;
      case "tournaments":
        return <TournamentWindow questions={questions} t={t} isAdmin={!!(session?.user as any)?.isAdmin} />;
      case "tutorial":
        return <TutorialWindow t={t} />;
      case "terms": return <LegalWindow type="terms" />;
      case "privacy": return <LegalWindow type="privacy" />;
      case "leaderboard":
        return (
          <LeaderboardWindow 
            t={t} 
            currentUserId={session?.user ? (session.user as any).id : (guestId || undefined)}
            cachedLeaderboard={cachedLeaderboard}
            onUpdateCache={setCachedLeaderboard}
            openProfile={(id: string) => { 
              const winId = `profile_${id}` as WindowId;
              setOpenWindows(prev => {
                if (prev.includes(winId)) {
                  setActiveWindow(winId);
                  return prev;
                }
                if (prev.length >= maxWindows) {
                  setShowLimitWarning(true);
                  return prev;
                }
                const activeIdx = prev.indexOf(activeWindow);
                const insertIdx = activeIdx !== -1 ? activeIdx + 1 : prev.length;

                setWindowFlexes(flexes => {
                  const nextFlexes = [...flexes];
                  const flexInsertIdx = Math.min(insertIdx, nextFlexes.length);
                  nextFlexes.splice(flexInsertIdx, 0, 1);
                  return nextFlexes;
                });

                if (maximizedWindow) setMaximizedWindow(null);
                setActiveWindow(winId);

                const nextWindows = [...prev];
                nextWindows.splice(insertIdx, 0, winId);
                return nextWindows;
              });
            }} 
          />
        );
      case "friends": return (
        <FriendsWindow 
          t={t} 
          openProfile={(id: string) => { 
            const winId = `profile_${id}` as WindowId;
            setOpenWindows(prev => {
              if (prev.includes(winId)) {
                setActiveWindow(winId);
                return prev;
              }
              if (prev.length >= maxWindows) {
                setShowLimitWarning(true);
                return prev;
              }
              const activeIdx = prev.indexOf(activeWindow);
              const insertIdx = activeIdx !== -1 ? activeIdx + 1 : prev.length;

              setWindowFlexes(flexes => {
                const nextFlexes = [...flexes];
                const flexInsertIdx = Math.min(insertIdx, nextFlexes.length);
                nextFlexes.splice(flexInsertIdx, 0, 1);
                return nextFlexes;
              });

              if (maximizedWindow) setMaximizedWindow(null);
              setActiveWindow(winId);

              const nextWindows = [...prev];
              nextWindows.splice(insertIdx, 0, winId);
              return nextWindows;
            });
          }} 
          cachedFriends={cachedFriends || undefined}
          cachedRequests={cachedRequests || undefined}
          onlineUsers={onlineUsers}
          onInviteDuel={handleInviteDuel}
          pendingInviteTargetId={pendingInviteTargetId}
          onCancelInvite={cancelInviteDuel}
        />
      );
      case "feedback":
        return <FeedbackWindow session={session} t={t} />;
      case "royal":
        return (
          <RoyalWindow 
            session={session} 
            t={t} 
            onUpgradeSuccess={async () => {
              // fetchUserStats already fetches /api/user/profile and sets fullProfile — no need to fetch again
              await fetchUserStats();
              if (updateSession) {
                await updateSession();
              }
            }} 
          />
        );
      default: 
        if (id.startsWith("profile_")) {
          const targetId = id.replace("profile_", "");
          const isSelf = targetId === (session?.user as any)?.id;
          return <ProfileWindow 
                   session={session} 
                   userId={targetId} 
                   t={t} 
                   cachedProfile={isSelf ? fullProfile : undefined} 
                   onInviteDuel={handleInviteDuel}
                   pendingInviteTargetId={pendingInviteTargetId}
                   onCancelInvite={cancelInviteDuel}
                   isOnline={onlineUsers.has(targetId)}
                   addToEditor={(c) => {
                       setCode(c);
                       if (!openWindows.includes("editor")) setOpenWindows(prev => [...prev, "editor"]);
                       setActiveWindow("editor");
                   }}
                 />;
        }
        return null;
      }
      };
  const renderedWindows = openWindows
    .filter(id => {
      // Only allow certain windows if not logged in
      if (!session) {
        return ["editor", "settings", "battle", "problem", "privacy", "terms", "feedback", "leaderboard"].includes(id);
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
      const gaps = count - 1;
      // Set CSS variable used by styles to compute minimum window width.
      // This makes each window shrink proportionally so they stay within viewport, accounting for gaps.
      el.style.setProperty('--twm-window-min-width', `min(22rem, calc((100% - var(--gap, 0px) * ${gaps}) / ${count}))`);
    } catch (err) {
      // silent
    }
  }, [renderedWindows.length]);

  return (
    <div className="main-header" style={{ 
      '--window-radius': windowRadius, 
      '--gap': windowGap,
      '--window-border-thickness': windowBorderThickness,
      '--nav-bg': navStyle,
      '--nav-border': navStyle === 'var(--bg)' ? '0px solid transparent' : `var(--window-border-thickness, 1px) solid var(--line)`,
      '--header-margin': '0px',
      '--header-radius': '0px'
    } as React.CSSProperties}>
      <AnimatePresence>
        {showRatingChangePopup && (
          <motion.div
            initial={{ opacity: 0, x: '-50%' }}
            animate={{ opacity: 1, x: '-50%' }}
            exit={{ opacity: 0, x: '-50%' }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '20px',
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
      </AnimatePresence>

      <Tour 
        steps={TOUR_STEPS} 
        isOpen={showWelcomePopup} 
        onClose={() => { 
          setShowWelcomePopup(false); 
          localStorage.setItem("ck-tutorial-seen", "true"); 
        }} 
      />

      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', pointerEvents: 'none' }}>
        <AnimatePresence>
          {[
            showLimitWarning && { id: 'limit', color: 'var(--accent)', content: <span>Maximum of {maxWindows} windows allowed.</span> },
            showWorkspaceWarning && { id: 'workspace', color: '#ff5555', content: <span>You need at least one workspace available.</span> },
            submissionFeedback && { id: 'submission-feedback', color: submissionFeedback.color, content: <span>{submissionFeedback.message}</span> },
            showInviteSentPopup && { id: 'invite', color: 'var(--text-muted)', content: <span>Invite sent! Waiting for response...</span> },
            isAcceptingInvite && { id: 'accepting', color: 'var(--accent)', content: <span>Loading problems...</span> },

            showOpponentFoundPopup && { id: 'opponent', color: '#50fa7b', content: <span>Opponent found!</span> },
            showAiDisabledWarning && { id: 'ai-disabled', color: '#ff5555', content: <span>AI assistance is disabled during active duels!</span> },
            showDuelInBattleWarning && { id: 'duel-in-battle', color: '#ff5555', content: <span>You cannot invite someone to a duel while in a battle!</span> },
            showDuelHasUplinkWarning && { id: 'duel-has-uplink', color: '#ff5555', content: <span>You cannot invite someone to a duel while you have an active matchmaking uplink!</span> },
            showUplinkPendingWarning && { id: 'uplink-pending', color: '#ff5555', content: <span>You cannot generate an uplink while waiting for a duel invite response!</span> },
            showPinCopiedNotification && { id: 'pin-copied', color: '#50fa7b', icon: <Check size={18} color="#50fa7b" />, content: <span>Uplink PIN copied to clipboard!</span> },
            incomingInvite && {
              id: 'incoming',
              color: 'var(--accent)',
              icon: <Sword size={18} color="var(--accent)" />,
              content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span><strong style={{ color: 'var(--accent)' }}>{incomingInvite.hostName}</strong> challenged you to a {incomingInvite.gameMode} ({incomingInvite.unrated ? "Unrated" : "Rated"}) match!</span>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <button 
                      onClick={async () => {
                        if (isAcceptingInvite) return;
                        setIsAcceptingInvite(true);
                        const myId = session?.user ? (session.user as any).id : (isGuest ? guestId : null);
                        try {
                            const res = await fetch("/api/duels", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                hostId: incomingInvite.hostId,
                                guestId: myId,
                                gameMode: incomingInvite.gameMode,
                                unrated: incomingInvite.unrated,
                                problems: incomingInvite.problems
                              })
                            });
                          const data = await res.json();
                          if (res.ok && data.id) {
                            setDuelPin(data.pin);
                            socketRef.current?.emit("accept_invite", { hostId: incomingInvite.hostId, pin: data.pin, duel: data });
                            
                            const actualStart = new Date(data.startedAt || data.createdAt).getTime() - (data.serverTime ? data.serverTime - Date.now() : clockOffset);
                            startBattle(data.question || (data.questions && data.questions[0]), actualStart, data);
                            if (isGuest && data.guestId) {
                               setGuestId(data.guestId);
                            }
                            setActiveDuel(data);

                            setOpenWindows(prev => {
                               const next = prev.filter(w => w !== "battle");
                               if (!next.includes("problem")) next.push("problem");
                               if (!next.includes("editor")) next.unshift("editor");
                               setWindowFlexes(next.map(w => w === "editor" ? 1.5 : 1));
                               return next;
                            });
                            setActiveWindow("editor");
                            setIncomingInvite(null);
                            setIsAcceptingInvite(false);
                          } else {
                            alert(data.error || "Failed to accept challenge.");
                            setIsAcceptingInvite(false);
                          }
                        } catch (err) {
                          console.error(err);
                          alert("Failed to accept challenge.");
                          setIsAcceptingInvite(false);
                        }
                      }} 
                      disabled={isAcceptingInvite}
                      style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '0.2rem', cursor: isAcceptingInvite ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '0.8rem', opacity: isAcceptingInvite ? 0.6 : 1 }}
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => {
                        if (isAcceptingInvite) return;
                        if (incomingInvite) {
                          socketRef.current?.emit("reject_invite", { pin: incomingInvite.pin });
                        }
                        setIncomingInvite(null);
                      }} 
                      disabled={isAcceptingInvite}
                      style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--line)', padding: '0.3rem 0.6rem', borderRadius: '0.2rem', cursor: isAcceptingInvite ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '0.8rem', opacity: isAcceptingInvite ? 0.6 : 1 }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )
            }
          ].filter(Boolean).map((notif: any) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'var(--bg)',
                border: `1px solid ${notif.color}`,
                padding: '1rem',
                borderRadius: '0.4rem',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                fontWeight: 800,
                fontSize: '0.9rem',
                pointerEvents: 'auto'
              }}
            >
              <div style={{ marginTop: '0.1rem' }}>
                {notif.icon || <AlertCircle size={18} color={notif.color} />}
              </div>
              <div>{notif.content}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className={`loading-overlay ${(isLoaded && status !== "loading") ? "loading-overlay--hidden" : ""}`}>
        <div className="loading-spinner" />
        <div><span style={{ color: 'var(--accent)' }}>CODE</span>&nbsp;KNIGHTS</div>
      </div>
      <nav className="nav">
        <div className="nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/" className="brand" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CodeKnightsLogo size={32} />
              <span style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', textTransform: 'uppercase' }}>CODE<span style={{ color: 'var(--accent)' }}>KNIGHTS</span></span>
            </Link>

            {/* Workspace Selector */}
            <div className="workspace-selector" style={{ display: 'flex', gap: '0.75rem', marginLeft: '1.5rem', alignItems: 'center' }}>
               {Array.from({ length: 9 }).map((_, i) => {
                 const ws = workspacesRef.current[i];
                 const isExisting = ws.openWindows.length > 1 || (ws.openWindows.length === 1 && ws.openWindows[0] !== "editor");
                 const isCurrent = activeWorkspace === i;
                 
                 if (!isCurrent && !isExisting) return null;

                 return (
                   <button
                     key={i}
                     onClick={() => switchWorkspace(i)}
                     style={{
                       display: 'flex', alignItems: 'center', justifyContent: 'center',
                       background: 'transparent',
                       color: isCurrent ? 'var(--accent)' : 'var(--text-muted)',
                       border: 'none', cursor: 'pointer',
                       fontSize: '0.9rem', fontWeight: isCurrent ? 900 : 600,
                       transition: 'all 0.2s ease',
                       fontFamily: 'monospace',
                       padding: 0,
                       opacity: isCurrent ? 1 : 0.6
                     }}
                     title={`Workspace ${i + 1} (Alt+${i + 1})`}
                     onMouseEnter={(e) => { if (!isCurrent) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.opacity = '1'; } }}
                     onMouseLeave={(e) => { if (!isCurrent) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0.6'; } }}
                   >
                     {i + 1}
                   </button>
                 );
               })}
            </div>

          </div>
          <ul className="nav-links">
            {navLinks.map(link => {
              const isDisabled = link.id === "battle" && activeDuel && activeDuel.status === "ACTIVE";
              return (
                <li key={link.id}>
                  <button 
                    data-tour={`${link.id}-btn`}
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
            {(session && !isGuest) && (
              <button onClick={() => toggleWindow("agent")} style={{ background: 'transparent', border: 'none', color: '#ffb86c', cursor: 'pointer', padding: '0.4rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: openWindows.includes("agent") ? 1 : 0.7 }} title="Agent"><Brain size={20} /></button>
            )}
            <button onClick={() => toggleWindow("settings")} data-tour="settings-btn" style={{ background: 'transparent', border: 'none', color: '#f1fa8c', cursor: 'pointer', padding: '0.4rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: openWindows.includes("settings") ? 1 : 0.7 }} title="Settings"><Settings size={20} /></button>
            {(session || isGuest) ? (
              <div style={{ position: 'relative' }} data-tour="profile-menu">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0.4rem', borderRadius: '0.3rem' }}
                  className="btn-ghost"
                >
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isGuest ? (guestName || "Guest") : (session?.user?.username || session?.user?.name)}</span>
                  <DefaultAvatar 
                    name={isGuest ? (guestName || "Guest Knight") : (session?.user?.username || session?.user?.name || "Knight")} 
                    size={24} 
                    image={isGuest ? null : session?.user?.image}
                    isRoyal={!!(session?.user as any)?.isRoyal}
                  />
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

                            <button 
                              onClick={() => { toggleWindow("leaderboard"); setIsProfileMenuOpen(false); }} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                padding: '0.5rem 0.75rem', 
                                borderRadius: '0.4rem', 
                                border: 'none', 
                                color: 'inherit', 
                                background: 'rgba(255,255,255,0.02)', 
                                cursor: 'pointer', 
                                textAlign: 'left', 
                                width: '100%',
                                marginTop: '0.25rem'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Trophy size={14} color="var(--accent)" />
                                <span style={{ fontSize: '0.85rem' }}>Leaderboard</span>
                              </div>
                              <ChevronRight size={12} />
                            </button>
                            
                            <button onClick={() => { 
                                if (!openWindows.includes("tutorial")) setOpenWindows(prev => [...prev, "tutorial"]);
                                setActiveWindow("tutorial"); 
                                setIsProfileMenuOpen(false); 
                            }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: 'none', color: 'var(--accent)', background: 'rgba(122, 162, 247, 0.05)', cursor: 'pointer', textAlign: 'left', width: '100%', marginTop: '0.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BookOpen size={14} /><span style={{ fontSize: '0.85rem' }}>{t("tutorial")}</span></div>
                              <ChevronRight size={12} />
                            </button>
                            
                            {session?.user?.isAdmin && (
                              <button onClick={() => { toggleWindow("admin"); setIsProfileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: 'none', color: 'var(--accent)', background: 'rgba(122, 162, 247, 0.05)', cursor: 'pointer', textAlign: 'left', width: '100%', marginTop: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Database size={14} /><span style={{ fontSize: '0.85rem' }}>{t("admin")}</span></div>
                                <ChevronRight size={12} />
                              </button>
                            )}

                             {(session?.user as any)?.isRoyal ? (
                               <button 
                                 onClick={() => { toggleWindow("royal"); setIsProfileMenuOpen(false); }} 
                                 style={{
                                   display: 'flex',
                                   alignItems: 'center',
                                   justifyContent: 'space-between',
                                   padding: '0.5rem 0.75rem',
                                   borderRadius: '0.4rem',
                                   color: '#ffd700',
                                   background: 'rgba(255, 215, 0, 0.08)',
                                   border: '1px solid rgba(255, 215, 0, 0.25)',
                                   marginTop: '0.25rem',
                                   fontWeight: 700,
                                   cursor: 'pointer',
                                   width: '100%',
                                   textAlign: 'left',
                                   boxSizing: 'border-box',
                                 }}
                               >
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                   <Crown size={14} fill="currentColor" />
                                   <span style={{ fontSize: '0.85rem' }}>Royal Member</span>
                                 </div>
                                 <ChevronRight size={12} color="#ffd700" />
                               </button>
                            ) : (
                              <button 
                                onClick={() => { toggleWindow("royal"); setIsProfileMenuOpen(false); }} 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between', 
                                  padding: '0.5rem 0.75rem', 
                                  borderRadius: '0.4rem', 
                                  border: '1px solid rgba(255, 215, 0, 0.3)', 
                                  color: '#120824', 
                                  background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)', 
                                  cursor: 'pointer', 
                                  textAlign: 'left', 
                                  width: '100%', 
                                  marginTop: '0.25rem',
                                  fontWeight: 800,
                                  boxShadow: '0 4px 12px rgba(255, 215, 0, 0.2)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Crown size={14} fill="currentColor" />
                                  <span style={{ fontSize: '0.85rem' }}>Buy Royal</span>
                                </div>
                                <ChevronRight size={12} />
                              </button>
                            )}
                            </>
                            )}

                            {isGuest && (
                              <>
                                <button 
                                  onClick={() => { toggleWindow("leaderboard"); setIsProfileMenuOpen(false); }} 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between', 
                                    padding: '0.5rem 0.75rem', 
                                    borderRadius: '0.4rem', 
                                    border: 'none', 
                                    color: 'inherit', 
                                    background: 'rgba(255,255,255,0.02)', 
                                    cursor: 'pointer', 
                                    textAlign: 'left', 
                                    width: '100%',
                                    marginBottom: '0.25rem'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Trophy size={14} color="var(--accent)" />
                                    <span style={{ fontSize: '0.85rem' }}>Leaderboard</span>
                                  </div>
                                  <ChevronRight size={12} />
                                </button>

                                <button onClick={() => { if (!openWindows.includes("battle")) toggleWindow("battle"); setShowSignInOptions(true); setIsProfileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: 'none', color: 'inherit', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><LogIn size={14} /><span style={{ fontSize: '0.85rem' }}>{t("signIn")}</span></div>
                                  <ChevronRight size={12} />
                                </button>
                              </>
                            )}

                            <button onClick={async () => {
                              if (isGuest) {
                                fetch('/api/auth/guest/delete', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ guestName })
                                }).catch(console.error).finally(() => {
                                  setIsGuest(false);
                                  localStorage.removeItem(`guestName_${guestName}`);
                                  window.location.href = '/';
                                });
                              } else {
                                await signOut({ redirect: false });
                                window.location.href = '/';
                              }
                            }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: 'none', color: '#ff5555', background: 'rgba(255, 85, 85, 0.05)', cursor: 'pointer', textAlign: 'left' }}>
                            <LogOut size={14} /><span style={{ fontSize: '0.85rem' }}>{isGuest ? t("exitGuest") : t("signOut")}</span>
                            </button>                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : <button className="btn" onClick={() => { if (!openWindows.includes("battle")) toggleWindow("battle"); setShowSignInOptions(true); }} style={{ background: 'var(--text)', color: 'var(--bg)', border: 'none', fontWeight: 700, padding: '0.4rem 0.8rem', cursor: 'pointer', borderRadius: '0.4rem' }}>{t("signIn")}</button>}
          </div>
        </div>
      </nav>

      <motion.main className="twm-workspace" ref={workspaceRef} layout={animationSpeed !== "none" && !isDragging} transition={getTransition()}>
        <AnimatePresence>
          {renderedWindows.flatMap((id, idx) => {
            const navItem = navLinks.find(l => l.id === id);
            let icon = navItem?.icon;
            if (id === 'editor') icon = <Code size={16} />;
            if (id === 'settings') icon = <Settings size={16} />;
            if (id === 'battle') icon = <Sword size={16} />;
            if (id === 'friends') icon = <Users size={16} />;
            if (id === 'problem') icon = <Target size={16} />;
            if (id === 'admin') icon = <Database size={16} />;
            if (id === 'tutorial') icon = <BookOpen size={16} />;
            if (id === 'terms') icon = <FileText size={16} />;
            if (id === 'privacy') icon = <Shield size={16} />;
            if (id === 'agent') icon = <Brain size={16} />;
            if (id === 'feedback') icon = <MessageSquare size={16} />;
            if (id === 'royal') icon = <Crown size={16} color="#ffd700" fill="#ffd700" />;
            if (id === 'leaderboard') icon = <Trophy size={16} />;
            if (id.startsWith('profile')) icon = <User size={16} />;
            const rawId = id.startsWith('profile_') ? 'profile' : id;
            const displayId = navItem?.label || (rawId === 'editor' ? t("editorLabel") : rawId === 'admin' ? t("admin") : rawId === 'agent' ? t("agentsTitle") : rawId === 'problem' ? t("problem") : rawId === 'tutorial' ? t("tutorial") : rawId === 'profile' ? t("profileOverview") : rawId === 'tournaments' ? t("tournaments") : rawId === 'leaderboard' ? (t("leaderboardTitle") || "Leaderboard") : rawId === 'royal' ? "Royal Subscription" : rawId);
            const isMax = id === maximizedWindow;
            const originalIdx = openWindows.indexOf(id);
            const rwIdx = renderedWindows.indexOf(id);
            const canReorder = !isMax && renderedWindows.length > 1;
            const canMoveLeft = canReorder && rwIdx > 0;
            const canMoveRight = canReorder && rwIdx < renderedWindows.length - 1;

            const elements = [];
            
            elements.push(
                <motion.section 
                  key={id}
                  layout={animationSpeed !== "none" && !isDragging}
                  initial={false}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    rotate: 0,
                    x: 0,
                    y: 0,
                    clipPath: 'inset(0% 0% 0% 0%)',
                    zIndex: draggedWindow === id ? 50 : 1,
                    boxShadow: isReordering ? "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)" : "none",
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    ...getTransition(),
                    layout: getTransition(),
                    ...(animationSpeed === "none" ? { scale: { duration: 0 }, opacity: { duration: 0 } } : {})
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
                  <div className="twm-window-header" draggable={!isMax} onDragStart={(e) => { setDraggedWindow(id); e.dataTransfer.setData("application/window-id", id); }} onDragEnd={() => setDraggedWindow(null)} style={{ cursor: isMax ? 'default' : 'grab' }}>
                    <motion.div 
                      layout={animationSpeed !== "none" && !isDragging}
                      transition={getTransition()}
                      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="twm-window-title" style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--accent)' }}>{icon}</span> {renderedWindows.length >= 4 ? null : displayId}
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
                              disabled={isTesting || (testResults?.passed === testResults?.total && testResults?.total > 0) || (activeDuel?.gameMode === "HACKBOUNTY" && activeDuel?.phase === "BREAKING")} 
                              style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '0.2rem', padding: '0.1rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: (isTesting || (testResults?.passed === testResults?.total && testResults?.total > 0) || (activeDuel?.gameMode === "HACKBOUNTY" && activeDuel?.phase === "BREAKING")) ? 'default' : 'pointer', fontSize: '0.7rem', fontWeight: 700, opacity: (isTesting || (testResults?.passed === testResults?.total && testResults?.total > 0) || (activeDuel?.gameMode === "HACKBOUNTY" && activeDuel?.phase === "BREAKING")) ? 0.7 : 1 }}>
                              {isTesting ? "..." : ((testResults?.passed === testResults?.total && testResults?.total > 0) ? <><Check size={12} fill="currentColor" /> SUBMITTED</> : (activeDuel?.gameMode === "HACKBOUNTY" && activeDuel?.phase === "BREAKING" ? <><Zap size={10} fill="currentColor" /> BREAKING...</> : <><Send size={10} fill="currentColor" /> SUBMIT</>))}
                            </button>
                          </div>
                        )}
                        {id === 'notes' && (
                          <div id="notes-window-header-portal" style={{ display: 'flex', alignItems: 'center', height: '100%', paddingLeft: '1rem', borderLeft: '1px solid var(--line)' }} onMouseDown={(e) => e.stopPropagation()} />
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {id === 'problem' && activeQuestion && activeDuel && (() => {
                          const isFinished = activeDuel.status === "FINISHED";
                          const allSolved = activeDuel.questions && activeDuel.questions.length > 0 && activeDuel.questions.every((q: any) => {
                            const r = problemTestResults[q.id];
                            return r && r.passed === r.total && r.total > 0;
                          });
                          const ended = isFinished || allSolved;
                          return (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (!ended) { window.dispatchEvent(new Event("request_end_battle")); } 
                              }} 
                              disabled={ended}
                              style={{ background: '#50fa7b', color: '#000', border: 'none', borderRadius: '0.2rem', padding: '0.1rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: ended ? 'default' : 'pointer', fontSize: '0.7rem', fontWeight: 700, opacity: ended ? 0.7 : 1, marginRight: '0.5rem' }}>
                              {ended ? <><Check size={12} fill="currentColor" /> FINISHED</> : <><Flag size={10} fill="currentColor" /> FINISH</>}
                            </button>
                          );
                        })()}
                        <div className="twm-window-actions">
                        <button type="button" className="twm-btn" onClick={() => toggleMaximize(id)} title={isMax ? t("restore" as any) : t("maximize" as any)}>
                          {isMax ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                        <button
                          type="button"
                          className="twm-btn"
                          disabled={!canMoveLeft}
                          onClick={() => moveWindow(id, "left")}
                          title={t("moveLeft" as any)}
                        >
                          <ArrowLeft size={14} />
                        </button>
                        <button
                          type="button"
                          className="twm-btn"
                          disabled={!canMoveRight}
                          onClick={() => moveWindow(id, "right")}
                          title={t("moveRight" as any)}
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
            );

            if (!maximizedWindow && idx < renderedWindows.length - 1) {
              const rightId = renderedWindows[idx + 1];
              if (rightId !== undefined) {
                elements.push(
                  <motion.div 
                    key={`resizer-${idx}`}
                    layout={animationSpeed !== "none" && !isDragging}
                    transition={getTransition()}
                    className="twm-resizer" 
                    onMouseDown={(e) => {
                      startResizing(e, openWindows.indexOf(id), openWindows.indexOf(rightId));
                    }}
                  />
                );
              }
            }
              
            return elements;
          })}
        </AnimatePresence>
      </motion.main>
      
      {/* Game Mode Selection Modal */}
      {showGameModeSelection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem',
        }}>
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '640px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            animation: 'fadeInScale 0.2s ease-out',
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.5rem 0' }}>
                SELECT GAME MODE
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                Choose the arena rules for your upcoming challenge
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
              marginTop: '0.5rem',
            }}>
              {[
                { 
                  id: "CODEKNIGHTS", 
                  title: "CODEKNIGHTS", 
                  desc: "Algorithmic puzzles. Speed and correctness.", 
                  status: "ACTIVE" 
                },
                { 
                  id: "BUGHUNTER", 
                  title: "BUG HUNTER", 
                  desc: "Debugging. Repair failing test suites.", 
                  status: "WIP" 
                },
                { 
                  id: "HACKBOUNTY", 
                  title: "HACK BOUNTY", 
                  desc: "Cybersecurity. Find and exploit vulnerabilities.", 
                  status: "WIP" 
                },
                { 
                  id: "MLMAGES", 
                  title: "ML MAGES", 
                  desc: "Machine Learning. Train optimal AI agents.", 
                  status: "WIP" 
                },
              ].map((mode) => {
                const isActive = mode.status === "ACTIVE";
                return (
                  <div
                    key={mode.id}
                    onClick={() => {
                      if (isActive) {
                        if (activeGameModeCallback) {
                          activeGameModeCallback(mode.id, modalIsUnrated);
                        }
                        setShowGameModeSelection(false);
                        setActiveGameModeCallback(null);
                        setModalIsUnrated(false);
                      } else {
                        alert(`${mode.title} is currently Work In Progress (WIP). Please select CODEKNIGHTS.`);
                      }
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--line)',
                      borderRadius: '0.75rem',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = isActive ? 'var(--accent)' : '#ffaa00';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      e.currentTarget.style.borderColor = 'var(--line)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 800 }}>{mode.title}</strong>
                      <span style={{
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '0.25rem',
                        background: isActive ? 'rgba(80, 250, 123, 0.15)' : 'rgba(255, 170, 0, 0.15)',
                        color: isActive ? '#50fa7b' : '#ffaa00',
                      }}>
                        {mode.status}
                      </span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.3' }}>
                      {mode.desc}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Play Unrated Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--line)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginTop: '0.5rem',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: 'var(--text)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                userSelect: 'none',
              }}>
                <input 
                  type="checkbox" 
                  checked={modalIsUnrated} 
                  onChange={(e) => setModalIsUnrated(e.target.checked)} 
                  style={{ 
                    cursor: 'pointer', 
                    width: '18px', 
                    height: '18px', 
                    accentColor: 'var(--accent)' 
                  }}
                />
                <span style={{ fontWeight: 700 }}>Play Unrated Match</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>(No Rating Changes)</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                onClick={() => {
                  setShowGameModeSelection(false);
                  setActiveGameModeCallback(null);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  color: 'var(--text-muted)',
                  borderRadius: '0.4rem',
                  padding: '0.6rem 1.2rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.color = 'var(--text)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeInScale {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}

      {/* Username Prompt Modal */}
      <AnimatePresence>
        {showUsernamePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: 'var(--bg)', border: '1px solid var(--line)',
                padding: '2rem', borderRadius: '0.8rem', width: '90%', maxWidth: '400px',
                display: 'flex', flexDirection: 'column', gap: '1rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>Welcome to CodeKnights!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Please choose a username for your account. This is how other players will see you.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={newUsername} 
                  onChange={(e) => setNewUsername(e.target.value)} 
                  placeholder="Enter username..."
                  style={{
                    padding: '0.75rem', borderRadius: '0.4rem', border: '1px solid var(--line)',
                    background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontSize: '1rem',
                    outline: 'none', transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--line)'}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveUsername(); }}
                />
                {usernameError && <span style={{ color: '#ff5555', fontSize: '0.8rem' }}>{usernameError}</span>}
              </div>

              <button 
                onClick={handleSaveUsername}
                className="btn"
                style={{
                  background: 'var(--accent)', color: '#000', padding: '0.75rem',
                  borderRadius: '0.4rem', border: 'none', fontWeight: 700, fontSize: '1rem',
                  cursor: 'pointer', marginTop: '0.5rem'
                }}
              >
                Save Username
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.25rem',
        fontSize: '0.65rem',
        color: 'var(--text-muted)'
      }}>
        <a href="https://github.com/DumitrescuDarius/CODEKNIGHTS" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
          <Github size={12} /> GitHub
        </a>
        <button onClick={() => toggleWindow("privacy")} style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
          <Shield size={12} /> Privacy Policy
        </button>
        <button onClick={() => toggleWindow("terms")} style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
          <FileText size={12} /> Terms & Conditions
        </button>
        <button onClick={() => toggleWindow("feedback")} style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
          <MessageSquare size={12} /> Send Feedback
        </button>
      </footer>
    </div>
  );
};

export default MainMenu;
