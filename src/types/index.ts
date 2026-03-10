export type Language = "c" | "cpp" | "python" | "java";
export type SupportedLanguage = "en" | "ro" | "fr" | "de" | "hi" | "ru" | "hu" | "es" | "it" | "zh" | "ja" | "pt";
export type WindowId = "editor" | "practice" | "contests" | "leaderboard" | "discuss" | "settings" | "battle" | "friends" | "profile" | "problem" | "admin";
export type AnimationSpeed = "fast" | "smooth" | "none" | "bouncy" | "elastic" | "dramatic" | "snappy" | "jello" | "lazy" | "ghost" | "teleport" | "boing" | "float" | "erased" | "flip" | "glitch" | "swapVertical";

export interface Theme {
  name: string;
  bg: string;
  accent: string;
  line: string;
  light: boolean;
  rules: { token: string; foreground: string }[];
}

export interface Font {
  name: string;
  value: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  restrictions?: string;
  difficulty: string;
  testCases: string | any[];
  hiddenTestCases?: string | any[];
}

export interface UserStats {
  battlesWon: number;
  battlesTotal: number;
}

export interface Match {
  id: string;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  questionId: string;
  nextMatchId: string | null;
}

export interface Contest {
  id: string;
  title: string;
  participants: string[];
  matches: Match[];
  status: "DRAFT" | "ACTIVE" | "FINISHED";
}
