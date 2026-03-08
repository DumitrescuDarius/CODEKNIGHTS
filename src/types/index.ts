export type Language = "c" | "cpp" | "python" | "java";
export type WindowId = "editor" | "practice" | "contests" | "leaderboard" | "discuss" | "settings" | "battle" | "friends" | "profile" | "problem";

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
  difficulty: string;
  testCases: string | any[];
}

export interface UserStats {
  battlesWon: number;
  battlesTotal: number;
}
