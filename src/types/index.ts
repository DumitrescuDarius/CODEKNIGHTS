export type Language = "c" | "cpp" | "python" | "java";
export type SupportedLanguage = "en" | "ro" | "fr" | "de" | "hi" | "ru" | "hu" | "es" | "it" | "zh" | "ja" | "pt";
export type WindowId = "editor" | "practice" | "tournaments" | "leaderboard" | "settings" | "battle" | "friends" | "profile" | "problem" | "admin" | "agent" | "tutorial" | "notes" | "feedback" | "privacy" | "terms" | "royal" | `profile_${string}`;
export type AnimationSpeed = "none";

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
  problemId?: number;
  title: string;
  description: string;
  restrictions?: string;
  difficulty: string;
  testCases: string | any[];
  hiddenTestCases?: string | any[];
  idealComplexity?: string;
  timeLimit?: number;
  memoryLimit?: number;
  brokenCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserStats {
  battlesWon: number;
  battlesTotal: number;
  rating?: number;
  dailyWins?: any;
  currentStreak?: number;
}

export interface Match {
  id: string;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  questionId: string;
  nextMatchId: string | null;
}

export interface Tournament {
  id: string;
  title: string;
  participants: string[];
  matches: Match[];
  status: "DRAFT" | "ACTIVE" | "FINISHED";
}

export interface User {
  id: string;
  name?: string | null;
  username?: string | null;
  image?: string | null;
  battlesWon: number;
  battlesTotal: number;
  rating?: number;
  rank?: string;
  dailyWins?: any;
  isRoyal?: boolean;
}
