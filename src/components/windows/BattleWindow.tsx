"use client";

import React, { useState, useEffect } from "react";
import { Question } from "../../types";
import { signIn } from "next-auth/react";
import { LogIn, User, Sword, Shield, Trash2, Users, Plus, Copy, Hash, X, Trophy, Zap, Target, Edit2, Search, Flame, Github, ArrowLeft, Sparkles } from "lucide-react";
import { TranslationKey } from "../../constants/translations";
import { motion, AnimatePresence } from "framer-motion";

const FAKE_PLAYERS = [
  "ShadowKnight", "ByteSlayer", "NullPointer", "CodeWizard", "AlgoPro", 
  "VimMaster", "ReactGod", "O(n)Ninja", "SyntaxTerror", "ScriptKiddie",
  "MergeConflict", "DevOpsGuru", "StackOverflowRep", "BugMagnet", "MemoryLeak"
];

const BUBBLE_OPTIONS = [
  {
    id: "bughunter",
    name: "BUGHUNTER",
    description: "Hunt down hidden bugs in real-time. Gain penalty reduction for clean, compiler-error-free submissions.",
    color: "#50fa7b",
    icon: <i className="nf nf-fa-bug"></i>
  },
  {
    id: "hackbounty",
    name: "HACKBOUNTY",
    description: "High-stakes battles. Win matches within the ideal time complexity constraints to collect bonus rating bounties.",
    color: "#ffb86c",
    icon: <i className="nf nf-fa-coins"></i>
  },
  {
    id: "mlmages",
    name: "MLMAGES",
    description: "Cast code generation spells. Harness AI-powered snippets to solve complex algorithms at lightning speed.",
    color: "#bd93f9",
    icon: <i className="nf nf-fa-hat_wizard"></i>
  },
  {
    id: "codeknights",
    name: "CODEKNIGHTS",
    description: "The ultimate tournament. Face off in a standard bracket format to claim the title of Grand Master.",
    color: "#38bdf8",
    icon: <i className="nf nf-fa-chess_knight"></i>
  }
];

interface BattleWindowProps {
  startBattle: (q?: any) => void;
  startQuickMatch?: () => Promise<void>;
  questions: Question[];
  session: any;
  isGuest: boolean;
  handlePlayAsGuest: () => void;
  t: (key: TranslationKey) => string;
  onDeleteQuestion?: (id: string) => void;
  onEditQuestion?: (q: Question) => void;
  createDuel: () => void;
  joinDuel: (pin: string) => void;
  activeDuel: any;
  setActiveDuel: (val: any) => void;
  setDuelPin: (val: string) => void;
  showCancelDuel: boolean;
  setShowCancelDuel: (val: boolean) => void;
  handleCancelDuel: () => void;
  setShowWaitingPopup: (val: boolean) => void;
  timeLeft: number | null;
  showSignInOptions: boolean;
  setShowSignInOptions: (val: boolean) => void;
  userStats?: any;
}

export const BattleWindow: React.FC<BattleWindowProps> = React.memo(({
  startBattle, startQuickMatch, setShowWaitingPopup, questions, session, isGuest, handlePlayAsGuest, t, onDeleteQuestion, onEditQuestion,
  createDuel, joinDuel, activeDuel, setActiveDuel, setDuelPin, showCancelDuel, setShowCancelDuel, handleCancelDuel, timeLeft, userStats,
  showSignInOptions, setShowSignInOptions
}) => {
  const [joinPin, setJoinPin] = useState("");
  const [showBubbles, setShowBubbles] = useState(false);
  const [selectedBubble, setSelectedBubble] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ck_active_path") || "codeknights";
    }
    return "codeknights";
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isQuickMatchMode, setIsQuickMatchMode] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isQuickMatchMode) {
      interval = setInterval(() => {
        setSearchIndex(prev => (prev + 1) % FAKE_PLAYERS.length);
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isQuickMatchMode]);

  const isAdmin = !!session?.user?.isAdmin;
  const themeColor = activePath === "bughunter" ? "#50fa7b" : activePath === "hackbounty" ? "#ffb86c" : activePath === "mlmages" ? "#bd93f9" : "#38bdf8";

  // Automatically reset if duel finishes
  useEffect(() => {
    if (activeDuel && activeDuel.status === "FINISHED") {
      setActiveDuel(null);
      setDuelPin("");
    }
  }, [activeDuel, setActiveDuel, setDuelPin]);

  if (!session && !isGuest) {
    if (showSignInOptions) {
      return (
        <div 
          style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
        >
          <div 
            style={{ 
              background: 'rgba(122, 162, 247, 0.1)', 
              color: 'var(--accent)', 
              padding: '1.5rem', 
              borderRadius: '50%', 
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LogIn size={56} strokeWidth={2} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text)' }}>
            {t("signIn").toUpperCase()}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '380px', marginBottom: '3rem', lineHeight: 1.5 }}>
            {t("authRequired") === "Autentificare Necesară" 
              ? "Alegeți o metodă de conectare pentru a continua și a vă salva progresul." 
              : "Choose a sign-in method to continue and save your progress."}
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '320px' }}>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%' }}>
              <button 
                onClick={() => signIn("github", { callbackUrl: "/" })}
                title="Sign in with GitHub"
                style={{ 
                  width: '64px',
                  height: '64px', 
                  background: 'var(--text)', 
                  color: 'var(--bg)', 
                  border: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  borderRadius: '0.4rem',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--text-muted)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--text)';
                }}
              >
                <Github size={32} />
              </button>
              
              <button 
                onClick={() => signIn("google", { callbackUrl: "/" })}
                title="Sign in with Google"
                style={{ 
                  width: '64px',
                  height: '64px', 
                  background: 'transparent', 
                  color: 'var(--text)', 
                  border: '1px solid var(--line)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  borderRadius: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
            </div>
            
            <button 
              onClick={() => setShowSignInOptions(false)}
              style={{ 
                marginTop: '1rem',
                background: 'transparent', 
                color: 'var(--text-muted)', 
                border: 'none', 
                padding: '1rem', 
                fontWeight: 700, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem', 
                fontSize: '0.9rem',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ 
          background: 'rgba(122, 162, 247, 0.1)', 
          color: 'var(--accent)', 
          padding: '1.5rem', 
          borderRadius: '50%', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Shield size={56} strokeWidth={2} />
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text)' }}>
          {t("authRequired").toUpperCase()}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '380px', marginBottom: '3rem', lineHeight: 1.5 }}>
          {t("authRequired") === "Autentificare Necesară" 
            ? "Trebuie să fii autentificat sau să joci ca invitat pentru a intra în Arena de Luptă." 
            : "You must be signed in or playing as a guest to enter the Battle Arena."}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '320px' }}>
          <button 
            onClick={() => setShowSignInOptions(true)}
            style={{ 
              background: 'var(--accent)', 
              color: '#000', 
              border: 'none', 
              height: '48px', 
              borderRadius: '0.4rem', 
              fontWeight: 800, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.75rem', 
              fontSize: '1rem',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-hover, #5a8cf5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
            }}
          >
            <LogIn size={20} /> {t("signIn").toUpperCase()}
          </button>
          
          <button 
            onClick={handlePlayAsGuest}
            style={{ 
              background: 'transparent', 
              color: 'var(--text)', 
              border: '1px solid var(--line)', 
              height: '48px', 
              borderRadius: '0.4rem', 
              fontWeight: 700, 
              cursor: 'pointer',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.75rem', 
              fontSize: '1rem',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <User size={20} /> {t("playAsGuest").toUpperCase()}
          </button>
        </div>
      </div>
    );
  }

  if (showCancelDuel) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
        <div style={{ background: 'rgba(255, 85, 85, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '2rem' }}>
          <X size={64} color="#ff5555" />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>{t("cancelDuel")}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '3rem', maxWidth: '400px' }}>
          {t("cancelDuelWarning")}
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', width: '100%', maxWidth: '400px' }}>
          <button 
            onClick={handleCancelDuel}
            style={{ flex: 1, background: 'rgba(255, 85, 85, 0.1)', color: '#ff5555', border: '1px solid rgba(255, 85, 85, 0.3)', padding: '1rem', borderRadius: '0.4rem', fontWeight: 800, cursor: 'pointer' }}
          >
            {t("terminate")}
          </button>
          <button 
            onClick={() => setShowCancelDuel(false)}
            style={{ flex: 1, background: 'var(--line)', border: 'none', color: 'var(--text)', padding: '1rem', borderRadius: '0.4rem', fontWeight: 800, cursor: 'pointer' }}
          >
            {t("maintain")}
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (activeDuel && activeDuel.status === "WAITING" && !isQuickMatchMode) {
    return (
      <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'var(--bg)', border: '1px solid var(--line)',
          padding: '0.2rem 0.6rem', borderRadius: '0.4rem',
          fontSize: '0.85rem', fontWeight: 800,
          color: (timeLeft || 0) < 60 ? '#ff5555' : 'var(--accent)',
          display: 'flex', alignItems: 'center', gap: '0.4rem'
        }}>
          <Zap size={14} /> {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
        </div>
        <div style={{ background: 'rgba(122, 162, 247, 0.1)', color: 'var(--accent)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
          <Users size={48} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '0.05em' }}>{t("waitingForOpponent")}</h2>
        
        <button 
          onClick={() => setShowCancelDuel(true)}
          style={{ 
            marginBottom: '1rem', 
            background: 'rgba(255, 85, 85, 0.1)', 
            border: '1px solid #ff5555', 
            color: '#ff5555', 
            fontWeight: 800, 
            padding: '0.4rem 1rem',
            borderRadius: '0.4rem',
            cursor: 'pointer', 
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ff5555';
            e.currentTarget.style.color = '#000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 85, 85, 0.1)';
            e.currentTarget.style.color = '#ff5555';
          }}
        >
          <X size={14} strokeWidth={3} /> {t("abortUplink") === "ABORT UPLINK" ? "TERMINATE DUEL" : "Terminează Duelul"}
        </button>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '450px', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          {t("duelUplinkMessage")}
        </p>

        <div 
          onClick={() => {
            if (activeDuel?.pin) {
              navigator.clipboard.writeText(activeDuel.pin);
            }
          }}
          title="Click to copy PIN"
          style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid var(--line)', 
            padding: '1.5rem 3rem', 
            borderRadius: '1rem', 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.background = 'rgba(122, 162, 247, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em' }}>{t("duelPin")}</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--accent)', letterSpacing: '0.3em', fontFamily: 'monospace' }}>
            {activeDuel.pin}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 700 }}>
            <Copy size={12} /> {t("clickToCopy")}
          </div>
        </div>
      </div>
    );
  }

  if (isQuickMatchMode && (!activeDuel || activeDuel.status === "WAITING")) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <motion.div
            animate={{ 
              scale: [1, 2, 2.5],
              opacity: [0.8, 0.4, 0],
              borderWidth: ['2px', '4px', '1px']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              borderColor: 'var(--accent)',
              borderStyle: 'solid'
            }}
          />
          <motion.div
            animate={{ 
              scale: [1, 2.5, 3],
              opacity: [0.6, 0.2, 0],
              borderWidth: ['2px', '4px', '1px']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.5
            }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              borderColor: 'var(--accent)',
              borderStyle: 'solid'
            }}
          />
          <Search size={32} color="var(--accent)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '0.1em', color: 'var(--text)' }}>
          SEARCHING FOR OPPONENT
        </h2>
        <div style={{ 
          fontSize: '1rem', 
          color: 'var(--text-muted)', 
          fontFamily: 'monospace', 
          height: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.03)',
          padding: '0.75rem 1.5rem',
          borderRadius: '2rem',
          border: '1px solid var(--line)'
        }}>
          SCANNING: <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{FAKE_PLAYERS[searchIndex]}</span>
        </div>
        <button 
          onClick={() => {
            setIsQuickMatchMode(false);
            if (activeDuel) handleCancelDuel();
          }}
          style={{
            marginTop: '1.5rem', 
            background: 'rgba(255, 85, 85, 0.1)', 
            border: '1px solid #ff5555', 
            color: '#ff5555', 
            fontWeight: 800, 
            padding: '0.6rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: 'pointer', 
            fontSize: '0.8rem',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ff5555';
            e.currentTarget.style.color = '#000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 85, 85, 0.1)';
            e.currentTarget.style.color = '#ff5555';
          }}
        >
          <X size={18} strokeWidth={3} /> TERMINATE SEARCH
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2.5rem 1.5rem', height: '100%', overflow: 'hidden', position: 'relative', containerType: 'inline-size' }}>
      {/* Top Left Path Selector Button */}
      {(!activeDuel || activeDuel.status !== 'ACTIVE') && !isCreating && !isJoining && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowBubbles(!showBubbles);
            if (showBubbles) setSelectedBubble(null);
          }}
          style={{
            position: 'absolute',
            top: '1.25rem',
            left: '1.25rem',
            width: showBubbles ? '38px' : '48px',
            height: showBubbles ? '38px' : '48px',
            borderRadius: '50%',
            background: 'rgba(30, 30, 40, 0.6)',
            border: `1.5px solid ${themeColor}`,
            color: themeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.12s ease',
            zIndex: 110,
            boxShadow: `0 0 10px ${themeColor}33`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = `0 0 15px ${themeColor}66`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = `0 0 10px ${themeColor}33`;
          }}
          title="Select Path"
        >
          {showBubbles ? <X size={16} /> : (
            <span style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center' }}>
              {BUBBLE_OPTIONS.find(o => o.id === activePath)?.icon || <i className="nf nf-fa-chess_knight"></i>}
            </span>
          )}
        </button>
      )}

      {/* Bubble Options Blur Overlay */}
      <AnimatePresence>
        {showBubbles && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(3px)',
                zIndex: 90,
              }}
              onClick={() => {
                setShowBubbles(false);
                setSelectedBubble(null);
              }}
            />

            {/* Radial Bubbles & Details */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
              {BUBBLE_OPTIONS.map((b, idx) => {
                const radius = 120;
                const buttonCenter = { x: 39, y: 39 };
                const angles = [0.05, 0.52, 0.99, 1.47];
                const angle = angles[idx];
                const bubbleX = buttonCenter.x + radius * Math.cos(angle) - 22;
                const bubbleY = buttonCenter.y + radius * Math.sin(angle) - 22;

                return (
                  <motion.button
                    key={b.id}
                    onClick={() => {
                      setSelectedBubble(null);
                      setActivePath(b.id);
                      localStorage.setItem("ck_active_path", b.id);
                      setShowBubbles(false);
                    }}
                    onMouseEnter={() => {
                      setSelectedBubble(b.id);
                    }}
                    onMouseLeave={() => {
                      setSelectedBubble(null);
                    }}
                    whileHover={{ scale: 1.1, boxShadow: `0 0 20px ${b.color}` }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ 
                      opacity: 0, 
                      scale: 0.2, 
                      x: buttonCenter.x - 22 - bubbleX, 
                      y: buttonCenter.y - 22 - bubbleY 
                    }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      x: 0, 
                      y: 0 
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.2, 
                      x: buttonCenter.x - 22 - bubbleX, 
                      y: buttonCenter.y - 22 - bubbleY 
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 280, 
                      damping: 20,
                      delay: idx * 0.015 
                    }}
                    style={{
                      position: 'absolute',
                      left: bubbleX,
                      top: bubbleY,
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(30, 30, 40, 0.95)',
                      border: `2px solid ${b.color}`,
                      color: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      gap: '0.15rem',
                      boxShadow: `0 0 10px ${b.color}22`,
                      transition: 'box-shadow 0.3s ease',
                      pointerEvents: 'auto'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>{b.icon}</span>
                  </motion.button>
                );
              })}

              {/* Selected Bubble Detail Card */}
              {selectedBubble && (() => {
                const hoveredIdx = BUBBLE_OPTIONS.findIndex(b => b.id === selectedBubble);
                const hoveredOption = BUBBLE_OPTIONS[hoveredIdx];
                const radius = 120;
                const buttonCenter = { x: 39, y: 39 };
                const angles = [0.05, 0.52, 0.99, 1.47];
                const angle = angles[hoveredIdx] || 0;
                const bubbleX = buttonCenter.x + radius * Math.cos(angle) - 22;
                const bubbleY = buttonCenter.y + radius * Math.sin(angle) - 22;
                
                return (
                  <motion.div
                    key={selectedBubble}
                    initial={{ opacity: 0, scale: 0.9, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -10 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      left: `${bubbleX + 54}px`,
                      top: `${bubbleY - 20}px`,
                      background: 'rgba(20, 20, 30, 0.95)',
                      border: `1px solid ${hoveredOption?.color}`,
                      borderRadius: '0.8rem',
                      padding: '1rem',
                      maxWidth: '260px',
                      boxShadow: `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px ${hoveredOption?.color}22`,
                      pointerEvents: 'auto',
                      zIndex: 105
                    }}
                  >
                    <h4 style={{ 
                      margin: '0 0 0.5rem 0', 
                      color: hoveredOption?.color,
                      fontSize: '0.9rem',
                      fontWeight: 900,
                      letterSpacing: '0.05em'
                    }}>
                      {hoveredOption?.name}
                    </h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.4 }}>
                      {hoveredOption?.description}
                    </p>
                  </motion.div>
                );
              })()}
            </div>
          </>
        )}
      </AnimatePresence>

      {(isCreating || isJoining) && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div className="loading-spinner" style={{ width: '40px', height: '40px' }} />
          <div style={{ color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.1em' }}>
            {isCreating ? "GENERATING..." : t("joining")}
          </div>
        </div>
      )}
      
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        opacity: (isCreating || isJoining) ? 0 : 1, 
        pointerEvents: (isCreating || isJoining) ? 'none' : 'auto', 
        transition: 'opacity 0.2s ease' 
      }}>
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          {/* Dynamic Header Titles based on path */}
          {activePath === "bughunter" ? (
            <h2 style={{ fontSize: 'clamp(1.8rem, 10cqw, 3.5rem)', fontWeight: 900, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>BUG<span style={{ color: '#50fa7b' }}>HUNTER</span></h2>
          ) : activePath === "hackbounty" ? (
            <h2 style={{ fontSize: 'clamp(1.8rem, 10cqw, 3.5rem)', fontWeight: 900, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>HACK<span style={{ color: '#ffb86c' }}>BOUNTY</span></h2>
          ) : activePath === "mlmages" ? (
            <h2 style={{ fontSize: 'clamp(1.8rem, 10cqw, 3.5rem)', fontWeight: 900, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>ML<span style={{ color: '#bd93f9' }}>MAGES</span></h2>
          ) : (
            <h2 style={{ fontSize: 'clamp(1.8rem, 10cqw, 3.5rem)', fontWeight: 900, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>CODE<span style={{ color: '#38bdf8' }}>KNIGHTS</span></h2>
          )}
          {/* Win streak under the title */}
          {session && (() => {
             const streak = activePath === "codeknights" ? (userStats?.currentStreak || 0) : 0;
             return (
               <div title={`Current Win Streak: ${streak}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: streak > 0 ? '#ffb86c' : 'var(--text-muted)', filter: streak > 0 ? 'drop-shadow(0 0 8px rgba(255, 184, 108, 0.4))' : 'none', background: streak > 0 ? 'rgba(255, 184, 108, 0.1)' : 'rgba(255,255,255,0.05)', padding: '0.5rem 1.25rem', borderRadius: '2rem', border: streak > 0 ? '1px solid rgba(255, 184, 108, 0.2)' : '1px solid var(--line)', marginTop: '0.5rem' }}>
                  <Flame size={20} fill={streak > 0 ? "#ffb86c" : "none"} />
                  <span style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '0.05em' }}>{streak} {t("currentStreak")?.toUpperCase() || "STREAK"}</span>
               </div>
             );
          })()}
        </div>
        
        {/* Unified Setup Controls for All Paths */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', paddingBottom: '1rem' }}>
          {/* Game Mode Description */}
          <div style={{ maxWidth: '600px', margin: '0 auto 0.5rem', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {activePath === "bughunter" 
                ? "Race in a 1v1 challenge to fix broken code as quickly as possible while making the least amount of changes."
                : activePath === "hackbounty"
                ? "Compete 1v1 to inspect given algorithms and secure rating bounties by finding critical edge cases in the code."
                : activePath === "mlmages"
                ? "Engage in a 1v1 machine learning competition to see who can build the model with the better prediction accuracy."
                : "Face off in a 1v1 combat duel to solve complex programming problems faster and write more efficient solutions than your opponent."}
            </p>
          </div>

          {/* Quick Battle Button */}
          <button 
            onClick={async () => {
              if (startQuickMatch) {
                setIsQuickMatchMode(true);
                try {
                  await startQuickMatch();
                } catch (e) {
                  setIsQuickMatchMode(false);
                }
                return;
              }
              startBattle();
            }}
            disabled={isJoining || isCreating}
            style={{ 
              width: '100%', 
              background: themeColor, 
              color: '#000', 
              border: 'none', 
              padding: '1.5rem', 
              borderRadius: '0.4rem', 
              fontWeight: 900, 
              fontSize: '1.1rem', 
              cursor: 'pointer', 
              letterSpacing: '0.1em',
              boxShadow: `0 0 25px ${themeColor}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              transition: 'all 0.2s ease',
              opacity: 1
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <Sword size={22} fill="currentColor" /> {activePath === "bughunter" ? "START DEBUG MATCH" : activePath === "hackbounty" ? "START BOUNTY DUEL" : activePath === "mlmages" ? "START GENERATION MATCH" : t("startQuickBattle").toUpperCase()}
          </button>

          {/* Generate Uplink Button */}
          <button 
            onClick={async () => { 
              setIsCreating(true);
              try {
                await createDuel();
                setShowWaitingPopup(true);
              } catch (e) {
                console.error(e);
              }
              setIsCreating(false);
            }}
            disabled={isCreating || isJoining}
            style={{ 
              width: '100%', 
              background: 'rgba(255,255,255,0.05)', 
              color: themeColor, 
              border: `1px solid ${themeColor}33`, 
              padding: '1.5rem', 
              borderRadius: '0.4rem', 
              fontWeight: 900, 
              fontSize: '1.1rem', 
              cursor: 'pointer', 
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              transition: 'all 0.2s ease',
              opacity: 1
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <Users size={22} /> {isCreating ? "GENERATING..." : t("createUplink").toUpperCase()}
          </button>

          {/* Join Section */}
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Hash size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: themeColor, opacity: 0.7 }} />
              <input 
                type="text" 
                maxLength={6}
                placeholder={t("enterPin")}
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value.toUpperCase())}
                style={{ 
                  width: '100%', 
                  height: '56px', 
                  background: 'rgba(0,0,0,0.3)', 
                  border: '1px solid var(--line)', 
                  borderRadius: '0.4rem', 
                  color: 'inherit', 
                  padding: '0 1rem 0 2.75rem', 
                  outline: 'none', 
                  boxSizing: 'border-box',
                  fontSize: '1rem',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = themeColor}
                onBlur={(e) => e.target.style.borderColor = 'var(--line)'}
              />
            </div>
            <button 
              onClick={async () => {
                if (!joinPin) return;
                if (activePath !== "codeknights") return;
                setIsJoining(true);
                await joinDuel(joinPin);
                setIsJoining(false);
              }}
              disabled={isJoining || isCreating}
              style={{ 
                height: '56px', 
                background: activePath === "codeknights" ? 'var(--text)' : 'rgba(255,255,255,0.05)', 
                color: activePath === "codeknights" ? '#000' : 'var(--text-muted)', 
                border: activePath === "codeknights" ? 'none' : '1px solid var(--line)', 
                fontWeight: 900, 
                padding: '0 2rem',
                borderRadius: '0.4rem',
                cursor: (isJoining || isCreating) ? 'wait' : (activePath === "codeknights" ? 'pointer' : 'not-allowed'),
                fontSize: '0.9rem',
                letterSpacing: '0.1em',
                opacity: (isJoining || isCreating) ? 0.7 : 1
              }}
            >
              {isJoining ? t("joining") : t("join")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

BattleWindow.displayName = "BattleWindow";
