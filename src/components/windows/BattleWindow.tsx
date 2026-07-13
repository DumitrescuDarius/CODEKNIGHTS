"use client";

import React, { useState, useEffect } from "react";
import { Question } from "../../types";
import { signIn } from "next-auth/react";
import { LogIn, User, Sword, Shield, Trash2, Users, Plus, Copy, Hash, X, Trophy, Zap, Target, Edit2, Search, Flame, Github, ArrowLeft, Sparkles, Check, RotateCcw, Crown } from "lucide-react";
import { TranslationKey } from "../../constants/translations";
import { motion, AnimatePresence } from "framer-motion";
import { DefaultAvatar } from "../DefaultAvatar";

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
  startQuickMatch?: (mode: 'create' | 'find', settings?: { problems?: string[]; isRanked?: boolean }) => Promise<void>;
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
  isWaitingForResponse?: boolean;
  guestId?: string | null;
}

export const BattleWindow: React.FC<BattleWindowProps> = React.memo(({
  startBattle, startQuickMatch, setShowWaitingPopup, questions, session, isGuest, handlePlayAsGuest, t, onDeleteQuestion, onEditQuestion,
  createDuel, joinDuel, activeDuel, setActiveDuel, setDuelPin, showCancelDuel, setShowCancelDuel, handleCancelDuel, timeLeft, userStats,
  showSignInOptions, setShowSignInOptions, isWaitingForResponse = false, guestId = null
}) => {
  const [joinPin, setJoinPin] = useState("");
  const [showBubbles, setShowBubbles] = useState(false);
  const [isQuickMatchMode, setIsQuickMatchMode] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let timerId: any = null;
    const isWaiting = activeDuel && activeDuel.status === "WAITING";
    if (isWaiting && isQuickMatchMode && activeDuel.createdAt) {
      const startTime = new Date(activeDuel.createdAt).getTime();
      const updateTimer = () => {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(diff > 0 ? diff : 0);
      };
      updateTimer();
      timerId = setInterval(updateTimer, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [activeDuel?.id, activeDuel?.status, isQuickMatchMode]);
  const [selectedBubble, setSelectedBubble] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ck_active_path") || "codeknights";
    }
    return "codeknights";
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isBrowsingPublicMatches, setIsBrowsingPublicMatches] = useState(false);
  const [publicMatches, setPublicMatches] = useState<any[]>([]);
  const [isFetchingMatches, setIsFetchingMatches] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [selectedProblems, setSelectedProblems] = useState<string[]>(['EASY']);
  const [isRanked, setIsRanked] = useState(true);
  const [pendingChallengeMatch, setPendingChallengeMatch] = useState<any>(null);

  const fetchPublicMatches = React.useCallback(async () => {
    setIsFetchingMatches(true);
    try {
      const res = await fetch("/api/duels/public");
      if (res.ok) {
        const data = await res.json();
        setPublicMatches(data);
      }
    } catch (err) {
      console.error(err);
    }
    setIsFetchingMatches(false);
  }, []);

  useEffect(() => {
    if (isBrowsingPublicMatches) {
      fetchPublicMatches();
      const interval = setInterval(fetchPublicMatches, 4000);
      return () => clearInterval(interval);
    }
  }, [isBrowsingPublicMatches, fetchPublicMatches]);

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
              window.dispatchEvent(new CustomEvent("pin_copied"));
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
    const myUserId = session?.user ? (session.user as any).id : (isGuest ? guestId : null);
    const isHost = activeDuel && activeDuel.hostId === myUserId;

    const formatElapsedTime = (secs: number) => {
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = (secs % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

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
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '0.1em', color: 'var(--text)', textTransform: 'uppercase' }}>
          WAITING FOR OPPONENT TO RESPOND
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
          TIME ELAPSED: <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{formatElapsedTime(elapsedTime)}</span>
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

  if (showSettingsPanel) {
    const calculatedTime = selectedProblems.reduce((sum, diff) => sum + (diff === 'EASY' ? 5 : diff === 'MEDIUM' ? 9 : 14), 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '480px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', borderRadius: '0.8rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, textAlign: 'center', color: 'var(--text)', letterSpacing: '0.05em' }}>
            MATCH CONFIGURATION
          </h2>

          {/* Added Problems List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>SELECTED PROBLEMS QUEUE</label>
            {selectedProblems.length === 0 ? (
              <div style={{ padding: '1rem', border: '1px dashed var(--line)', borderRadius: '0.4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No problems selected. Add some below!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {selectedProblems.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', borderRadius: '0.4rem', padding: '0.5rem 0.75rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: p === 'EASY' ? '#50fa7b' : p === 'MEDIUM' ? '#ffb86c' : '#bd93f9' }}>
                      {idx + 1}. {p} (+{p === 'EASY' ? 5 : p === 'MEDIUM' ? 9 : 14} mins)
                    </span>
                    <button
                      onClick={() => {
                        setSelectedProblems(prev => prev.filter((_, i) => i !== idx));
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ff5555',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: '0.1rem 0.4rem'
                      }}
                    >
                      REMOVE
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Problem Blocks Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>ADD PROBLEM BLOCK</label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => setSelectedProblems(prev => [...prev, 'EASY'])}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.25rem',
                  borderRadius: '0.4rem',
                  border: '1px solid rgba(80, 250, 123, 0.3)',
                  background: 'rgba(80, 250, 123, 0.05)',
                  color: '#50fa7b',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(80, 250, 123, 0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(80, 250, 123, 0.05)' }}
              >
                + EASY (+5m)
              </button>
              <button
                onClick={() => setSelectedProblems(prev => [...prev, 'MEDIUM'])}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.25rem',
                  borderRadius: '0.4rem',
                  border: '1px solid rgba(255, 184, 108, 0.3)',
                  background: 'rgba(255, 184, 108, 0.05)',
                  color: '#ffb86c',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 184, 108, 0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 184, 108, 0.05)' }}
              >
                + MEDIUM (+9m)
              </button>
              <button
                onClick={() => setSelectedProblems(prev => [...prev, 'HARD'])}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.25rem',
                  borderRadius: '0.4rem',
                  border: '1px solid rgba(189, 147, 249, 0.3)',
                  background: 'rgba(189, 147, 249, 0.05)',
                  color: '#bd93f9',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(189, 147, 249, 0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(189, 147, 249, 0.05)' }}
              >
                + HARD (+14m)
              </button>
            </div>
          </div>

          {/* Time & Type Summary Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: '0.4rem', border: '1px solid var(--line)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>TOTAL TIME:</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: themeColor }}>{calculatedTime} MINUTES</span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginRight: 'auto' }}>MATCH TYPE</span>
              {[
                { label: 'RANKED', value: true },
                { label: 'UNRATED', value: false }
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setIsRanked(opt.value)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '0.4rem',
                    border: isRanked === opt.value ? `2px solid ${themeColor}` : '1px solid var(--line)',
                    background: isRanked === opt.value ? `${themeColor}22` : 'rgba(0,0,0,0.2)',
                    color: isRanked === opt.value ? themeColor : 'var(--text)',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => setShowSettingsPanel(false)}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.4rem',
                border: '1px solid var(--line)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text)',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              CANCEL
            </button>
            <button
              disabled={selectedProblems.length === 0}
              onClick={async () => {
                setShowSettingsPanel(false);
                if (startQuickMatch) {
                  setIsQuickMatchMode(true);
                  try {
                    await startQuickMatch('create', { problems: selectedProblems, isRanked });
                  } catch (e) {
                    setIsQuickMatchMode(false);
                  }
                }
              }}
              style={{
                flex: 2,
                padding: '0.75rem',
                borderRadius: '0.4rem',
                border: 'none',
                background: selectedProblems.length === 0 ? 'var(--text-muted)' : themeColor,
                color: '#000',
                fontWeight: 900,
                cursor: selectedProblems.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: selectedProblems.length === 0 ? 'none' : `0 4px 15px ${themeColor}33`
              }}
            >
              CREATE LOBBY
            </button>
          </div>

        </div>
      </div>
    );
  }

  if (pendingChallengeMatch) {
    const hostName = pendingChallengeMatch.host?.username || pendingChallengeMatch.host?.name || "Host";
    const hostElo = pendingChallengeMatch.host?.rating ?? 1000;
    const hostImage = pendingChallengeMatch.host?.image;
    const isRoyal = !!pendingChallengeMatch.host?.isRoyal;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: '100%', maxWidth: '440px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', borderRadius: '0.8rem', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          
          <div style={{ position: 'relative', width: '80px', height: '80px' }}>
            <DefaultAvatar name={hostName} size={80} image={hostImage} isRoyal={isRoyal} />
            {isRoyal && <Crown size={20} fill="#ffd700" color="#ffd700" style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)' }} />}
          </div>

          <div>
            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '0.02em' }}>
              ACCEPT FIGHT?
            </h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
              Host: {hostName} ({hostElo} ELO)
            </p>
          </div>

          <div style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.4rem', padding: '1rem', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem' }}>MATCH CONFIGURATION</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: themeColor }}>
              {pendingChallengeMatch.numProblems} Problem{pendingChallengeMatch.numProblems > 1 ? 's' : ''} • {pendingChallengeMatch.totalTime}m • {pendingChallengeMatch.unrated ? 'Unrated' : 'Ranked'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 600 }}>
              Queue: {pendingChallengeMatch.difficulty}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '0.5rem' }}>
            <button
              onClick={() => setPendingChallengeMatch(null)}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '0.4rem',
                border: '1px solid #ff5555',
                background: 'rgba(255,85,85,0.05)',
                color: '#ff5555',
                fontWeight: 900,
                cursor: 'pointer',
                fontSize: '0.9rem',
                letterSpacing: '0.05em'
              }}
            >
              DECLINE
            </button>
            <button
              onClick={async () => {
                const matchToJoin = pendingChallengeMatch;
                setPendingChallengeMatch(null);
                setIsJoining(true);
                try {
                  setIsBrowsingPublicMatches(false);
                  await joinDuel(matchToJoin.pin);
                } catch (err) {
                  console.error(err);
                }
                setIsJoining(false);
              }}
              style={{
                flex: 1.5,
                padding: '1rem',
                borderRadius: '0.4rem',
                border: 'none',
                background: themeColor,
                color: '#000',
                fontWeight: 900,
                cursor: 'pointer',
                fontSize: '0.9rem',
                letterSpacing: '0.05em',
                boxShadow: `0 4px 15px ${themeColor}33`
              }}
            >
              ACCEPT FIGHT
            </button>
          </div>

        </div>
      </div>
    );
  }

  if (isBrowsingPublicMatches) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem', boxSizing: 'border-box' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
          <button 
            onClick={() => setIsBrowsingPublicMatches(false)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid var(--line)', 
              color: 'var(--text)', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.4rem', 
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          >
            <ArrowLeft size={14} /> BACK
          </button>
          
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.05em', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="var(--accent)" /> AVAILABLE MATCHES
          </h2>

          <button 
            onClick={fetchPublicMatches}
            disabled={isFetchingMatches}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--accent)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
              opacity: isFetchingMatches ? 0.5 : 1
            }}
            title="Refresh list"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Matches List Container */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem', justifyContent: isFetchingMatches || publicMatches.length === 0 ? 'center' : 'flex-start', alignItems: isFetchingMatches || publicMatches.length === 0 ? 'center' : 'stretch' }}>
          {isFetchingMatches ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '3px solid rgba(255, 255, 255, 0.05)',
                  borderTopColor: 'var(--accent)',
                  boxShadow: '0 0 15px rgba(122, 162, 247, 0.2)'
                }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                LOOKING FOR AVAILABLE MATCHES...
              </span>
            </div>
          ) : publicMatches.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.6 }}>
              <Users size={48} style={{ marginBottom: '1rem', color: 'var(--accent)', opacity: 0.5 }} />
              <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.25rem' }}>NO ACTIVE MATCHES FOUND</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Create a coding match to invite other challengers!</div>
            </div>
          ) : (
            publicMatches.map((match: any) => {
              const hostName = match.host?.username || match.host?.name || "Host";
              const hostElo = match.host?.rating ?? 1000;
              const hostImage = match.host?.image;
              const isRoyal = !!match.host?.isRoyal;
              const diffColor = match.question?.difficulty === 'HARD' ? '#ff5555' : match.question?.difficulty === 'MEDIUM' ? '#ffb86c' : '#50fa7b';
              
              return (
                <div 
                  key={match.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--line)', 
                    borderRadius: '0.6rem', 
                    padding: '1rem 1.25rem',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(122, 162, 247, 0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                >
                  {/* Left Column: User details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <DefaultAvatar name={hostName} size={36} image={hostImage} isRoyal={isRoyal} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {hostName}
                        {isRoyal && <Crown size={12} fill="#ffd700" color="#ffd700" />}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#f1fa8c', fontWeight: 600 }}>Rating: {hostElo} ELO</div>
                    </div>
                  </div>

                  {/* Middle Column: Match Settings details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Match Configuration</div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>
                      {match.numProblems} Problem{match.numProblems > 1 ? 's' : ''} ({match.difficulty})
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Duration: {match.totalTime}m • {match.unrated ? 'Unrated' : 'Ranked'}
                    </div>
                  </div>

                  {/* Right Column: CTA */}
                  <button
                    onClick={() => {
                      setPendingChallengeMatch(match);
                    }}
                    disabled={isJoining}
                    style={{
                      background: themeColor,
                      color: '#000',
                      border: 'none',
                      padding: '0.6rem 1.5rem',
                      borderRadius: '0.4rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      letterSpacing: '0.05em',
                      transition: 'all 0.2s ease',
                      boxShadow: `0 4px 12px ${themeColor}22`
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    CHALLENGE
                  </button>
                </div>
              );
            })
          )}
        </div>
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
        opacity: (isCreating || isJoining) ? 0 : 1, 
        pointerEvents: (isCreating || isJoining) ? 'none' : 'auto', 
        transition: 'opacity 0.2s ease' 
      }}>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          textAlign: 'center',
          padding: '1.5rem 0' 
        }}>
          {/* Dynamic Header Titles based on path */}
          {activePath === "bughunter" ? (
            <h2 style={{ fontSize: 'clamp(1.5rem, 10cqw, 5.5rem)', fontWeight: 900, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>BUG<span style={{ color: '#50fa7b' }}>HUNTER</span></h2>
          ) : activePath === "hackbounty" ? (
            <h2 style={{ fontSize: 'clamp(1.5rem, 10cqw, 5.5rem)', fontWeight: 900, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>HACK<span style={{ color: '#ffb86c' }}>BOUNTY</span></h2>
          ) : activePath === "mlmages" ? (
            <h2 style={{ fontSize: 'clamp(1.5rem, 10cqw, 5.5rem)', fontWeight: 900, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>ML<span style={{ color: '#bd93f9' }}>MAGES</span></h2>
          ) : (
            <h2 style={{ fontSize: 'clamp(1.5rem, 10cqw, 5.5rem)', fontWeight: 900, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>CODE<span style={{ color: '#38bdf8' }}>KNIGHTS</span></h2>
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

          {/* Public Match Buttons Row */}
          <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                setShowSettingsPanel(true);
              }}
              disabled={isJoining || isCreating}
              style={{ 
                flex: 1, 
                minWidth: '200px',
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
              <Sword size={22} fill="currentColor" /> {activePath === "bughunter" ? "CREATE DEBUG MATCH" : activePath === "hackbounty" ? "CREATE BOUNTY DUEL" : activePath === "mlmages" ? "CREATE GENERATION MATCH" : "CREATE CODING MATCH"}
            </button>

            <button 
              onClick={() => {
                setIsBrowsingPublicMatches(true);
              }}
              disabled={isJoining || isCreating}
              style={{ 
                flex: 1, 
                minWidth: '200px',
                background: 'transparent', 
                color: themeColor, 
                border: `2px solid ${themeColor}`, 
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
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = `${themeColor}10` }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'transparent' }}
            >
              <Users size={22} /> {activePath === "bughunter" ? "FIND DEBUG MATCH" : activePath === "hackbounty" ? "FIND BOUNTY DUEL" : activePath === "mlmages" ? "FIND GENERATION MATCH" : "FIND PUBLIC MATCH"}
            </button>
          </div>

          {/* Uplink and Join Row */}
          <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Generate Uplink Button */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <button 
                onClick={async () => { 
                  if (isWaitingForResponse) return;
                  setIsCreating(true);
                  try {
                    await createDuel();
                    setShowWaitingPopup(true);
                  } catch (e) {
                    console.error(e);
                  }
                  setIsCreating(false);
                }}
                disabled={isCreating || isJoining || isWaitingForResponse}
                style={{ 
                  width: '100%', 
                  height: '56px',
                  background: 'rgba(255,255,255,0.05)', 
                  color: themeColor, 
                  border: `1px solid ${themeColor}33`, 
                  padding: '0 1rem', 
                  borderRadius: '0.4rem', 
                  fontWeight: 900, 
                  fontSize: '1rem', 
                  cursor: (isCreating || isJoining || isWaitingForResponse) ? 'not-allowed' : 'pointer', 
                  letterSpacing: '0.1em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease',
                  opacity: isWaitingForResponse ? 0.4 : 1
                }}
                onMouseEnter={(e) => { if (!isWaitingForResponse) e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { if (!isWaitingForResponse) e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <Users size={20} /> {isCreating ? "GENERATING..." : isWaitingForResponse ? "WAITING..." : t("createUplink").toUpperCase()}
              </button>
            </div>

            {/* Join Section */}
            <div style={{ display: 'flex', gap: '0.75rem', flex: 1.2, minWidth: '250px' }}>
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
    </div>
  );
});

BattleWindow.displayName = "BattleWindow";
