"use client";

import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Github, LogIn, Sword, Target, Trophy, MessageSquare, X } from "lucide-react";

const THEMES = [
  { name: "Ayu Mirage", bg: "#1f2430", accent: "#ffcc66", line: "rgba(112, 122, 138, 0.1)", light: false },
  { name: "Catppuccin", bg: "#1e1e2e", accent: "#cba6f7", line: "rgba(205, 214, 244, 0.1)", light: false },
  { name: "Cyberpunk", bg: "#000000", accent: "#fdf500", line: "rgba(255, 0, 255, 0.2)", light: false },
  { name: "Dark Side", bg: "#000000", accent: "#ff79c6", line: "rgba(255, 121, 198, 0.15)", light: false },
  { name: "Deep Black", bg: "#000000", accent: "#7aa2f7", line: "rgba(255,255,255,0.1)", light: false },
  { name: "Dracula", bg: "#282a36", accent: "#bd93f9", line: "rgba(248, 248, 242, 0.1)", light: false },
  { name: "Everforest", bg: "#2d353b", accent: "#a7c080", line: "rgba(211, 198, 170, 0.1)", light: false },
  { name: "Gruvbox", bg: "#282828", accent: "#fabd2f", line: "rgba(235, 219, 178, 0.1)", light: false },
  { name: "Latte", bg: "#eff1f5", accent: "#8839ef", line: "rgba(76, 79, 105, 0.1)", light: true },
  { name: "Monokai", bg: "#272822", accent: "#a6e22e", line: "rgba(255,255,255,0.1)", light: false },
  { name: "Night Owl", bg: "#011627", accent: "#82aaff", line: "rgba(127, 219, 202, 0.1)", light: false },
  { name: "Nord", bg: "#2e3440", accent: "#88c0d0", line: "rgba(255,255,255,0.05)", light: false },
  { name: "One Dark", bg: "#282c34", accent: "#61afef", line: "rgba(171, 178, 191, 0.1)", light: false },
  { name: "Pure Light", bg: "#ffffff", accent: "#3b82f6", line: "rgba(0,0,0,0.1)", light: true },
  { name: "Rose Pine", bg: "#191724", accent: "#ebbcba", line: "rgba(156, 141, 203, 0.1)", light: false },
  { name: "Sakura", bg: "#fff5f7", accent: "#ff79c6", line: "rgba(255, 121, 198, 0.2)", light: true },
  { name: "Solarized", bg: "#002b36", accent: "#268bd2", line: "rgba(147, 161, 161, 0.1)", light: false },
  { name: "Tokyo Night", bg: "#1a1b26", accent: "#7aa2f7", line: "rgba(169, 177, 214, 0.1)", light: false },
];

export default function SignIn() {
  const [theme, setTheme] = useState(THEMES[0]);

  useEffect(() => {
    const savedThemeIdx = localStorage.getItem("ck-theme-idx");
    const tIdx = savedThemeIdx !== null ? parseInt(savedThemeIdx) : 0;
    const activeTheme = THEMES[tIdx] || THEMES[0];
    
    setTheme(activeTheme);
    const root = document.documentElement;
    root.style.setProperty('--bg', activeTheme.bg);
    root.style.setProperty('--accent', activeTheme.accent);
    root.style.setProperty('--line', activeTheme.line);
    root.style.setProperty('--window-bg', activeTheme.bg);
    
    // Add RGB version of accent for transparent backgrounds
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "122, 162, 247";
    };
    root.style.setProperty('--accent-rgb', hexToRgb(activeTheme.accent));

    const isLightTheme = activeTheme.light;
    root.style.setProperty('--text', isLightTheme ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)');
    root.style.setProperty('--text-muted', isLightTheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)');
    root.style.setProperty('--header-bg', isLightTheme ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)');
  }, []);

  return (
    <div className="main-header" style={{ padding: 'var(--gap)', height: '100dvh', width: '100vw', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', gap: 'var(--gap)', background: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: 0, textDecoration: 'none', color: 'inherit' }}>
            <div 
              style={{ 
                height: '24px', 
                width: '28px',
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
          <div className="nav-actions">
            <Link href="/" className="btn btn-ghost" style={{ fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <LogIn size={14} style={{ transform: 'rotate(180deg)' }} /> BACK
            </Link>
          </div>
        </div>
      </nav>

      <main className="twm-workspace">
        <AnimatePresence>
          {/* Rules Window */}
          <motion.section 
            key="rules-window"
            initial={{ opacity: 0, scale: 0.95, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="twm-window"
            style={{ flex: 0.8 }}
          >
            <div className="twm-window-header">
              <span className="twm-window-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={14} color="var(--accent)" /> Arena Rules
              </span>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'auto', flex: 1 }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Knight's Honor</div>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>Every duel is a test of skill and integrity. Maintain the code of conduct at all times.</p>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Ranking System</div>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>Rise from Beginner Peasant to Grandmaster through glorious victories in the arena.</p>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Join 4,200+ knights competing today.</p>
              </div>
            </div>
          </motion.section>

          <div className="twm-resizer" />

          {/* Sign In Window */}
          <motion.section 
            key="signin-window"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="twm-window"
            style={{ flex: 1.5 }}
          >
            <div className="twm-window-header">
              <span className="twm-window-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogIn size={14} color="var(--accent)" /> Authentication Required
              </span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflow: 'auto' }}>
              <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <div style={{ marginBottom: '2.5rem' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>Access the Arena</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to track your progress, earn ranks, and climb the global leaderboard.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => signIn("github", { callbackUrl: "/" })}
                    className="btn"
                    style={{ 
                      height: '48px', 
                      background: 'var(--text)', 
                      color: 'var(--bg)', 
                      border: 'none', 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.75rem',
                      cursor: 'pointer',
                      borderRadius: '0.4rem'
                    }}
                  >
                    <Github size={20} /> SIGN IN WITH GITHUB
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="btn"
                    style={{ 
                      height: '48px', 
                      background: 'rgba(255,255,255,0.02)', 
                      color: 'var(--text)', 
                      border: '1px solid var(--line)', 
                      fontWeight: 600, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.75rem',
                      cursor: 'pointer',
                      borderRadius: '0.4rem'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    SIGN IN WITH GOOGLE
                  </motion.button>
                </div>

                <div style={{ marginTop: '3rem', borderTop: '1px solid var(--line)', paddingTop: '1.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    By continuing, you agree to our <span style={{ color: 'var(--accent)' }}>Terms of Service</span> and <span style={{ color: 'var(--accent)' }}>Privacy Policy</span>.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          <div className="twm-resizer" />

          {/* Benefits Window */}
          <motion.section 
            key="benefits-window"
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="twm-window"
            style={{ flex: 1 }}
          >
            <div className="twm-window-header">
              <span className="twm-window-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sword size={14} color="var(--accent)" /> Why Join?
              </span>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'auto', flex: 1 }}>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <Target size={16} color="var(--accent)" />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Real-time Duels</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Challenge others in head-to-head algorithm battles.</p>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <Shield size={16} color="var(--accent)" />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Secure Runtime</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Execute C++, Python, and Java in a protected environment.</p>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <Trophy size={16} color="var(--accent)" />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Earn Your Glory</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unlock rewards and titles as you climb the ranks.</p>
              </div>
            </div>
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  );
}
