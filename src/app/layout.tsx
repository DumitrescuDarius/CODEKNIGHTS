import "../styles/main-menu.css";
import type { ReactNode } from "react";
import { AuthProvider } from "../components/providers/AuthProvider";

export const metadata = {
  title: "EComp - Competitive Coding",
  description: "Practice competitive programming, join contests, and climb the leaderboard.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
