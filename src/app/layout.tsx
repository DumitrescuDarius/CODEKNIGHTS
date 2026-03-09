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
        <link rel="icon" id="dynamic-favicon" href="/assets/logo_white.png" />
        <link rel="stylesheet" href="https://www.nerdfonts.com/assets/css/webfont.css" />
        <link href="https://fonts.googleapis.com/css2?family=VT323&family=Courier+Prime&family=Space+Mono&family=IBM+Plex+Mono:ital,wght@0,400;0,700;1,400&family=Inconsolata:wght@400;700&family=Ubuntu+Mono:ital,wght@0,400;0,700;1,400&family=Share+Tech+Mono&family=Nova+Mono&family=B612+Mono:ital,wght@0,400;0,700;1,400&family=Major+Mono+Display&family=JetBrains+Mono:ital,wght@0,400;0,700;1,400&family=Fira+Code:wght@400;700&family=Roboto+Mono:ital,wght@0,400;0,700;1,400&family=Source+Code+Pro:ital,wght@0,400;0,700;1,400&family=Anonymous+Pro:ital,wght@0,400;0,700;1,400&family=Cousine:ital,wght@0,400;0,700;1,400&family=Monofett&family=Overpass+Mono:wght@400;700&family=Oxygen+Mono&family=PT+Mono&family=Red+Hat+Mono:ital,wght@0,400;0,700;1,400&family=Syne+Mono&family=Ubuntu+Sans+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
