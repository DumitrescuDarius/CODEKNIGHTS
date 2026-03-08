import "../styles/main-menu.css";
import type { ReactNode } from "react";
import { AuthProvider } from "../components/providers/AuthProvider";

export const metadata = {
  title: "CodeKnights - Competitive Coding",
  description: "Practice competitive programming, join contests, and climb the leaderboard.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://www.nerdfonts.com/assets/css/webfont.css" />
        <link href="https://fonts.googleapis.com/css2?family=VT323&family=Courier+Prime&family=Space+Mono&family=IBM+Plex+Mono&family=Inconsolata&family=Ubuntu+Mono&family=Share+Tech+Mono&family=Nova+Mono&family=B612+Mono&family=Major+Mono+Display&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
