"use client";

import React, { useState, useEffect } from "react";
import { Question } from "../../types";
import { signIn } from "next-auth/react";
import { LogIn, User, Sword, Swords, Shield, Trash2, Users, Plus, Minus, Copy, Hash, X, Trophy, Zap, Target, Edit2, Search, Flame, Github, ArrowLeft, Sparkles, Check, RotateCcw, Crown, ChevronUp, ChevronDown } from "lucide-react";
import { TranslationKey } from "../../constants/translations";
import { motion, AnimatePresence } from "framer-motion";
import { DefaultAvatar } from "../DefaultAvatar";
import { WindowSpinner } from "../WindowSpinner";

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
    icon: <i className="nf nf-fa-hat_wizard"></i>,
    isWip: true
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
  startQuickMatch?: (mode: 'create' | 'find', settings?: { problems?: string[]; isRanked?: boolean; gameMode?: string }) => Promise<void>;
  questions: Question[];
  session: any;
  isGuest: boolean;
  handlePlayAsGuest: () => void;
  t: (key: TranslationKey) => string;
  onDeleteQuestion?: (id: string) => void;
  onEditQuestion?: (q: Question) => void;
  createDuel: (demoMode?: boolean, options?: { problems?: string[]; unrated?: boolean; gameMode?: string }) => Promise<void>;
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
  inviteTargetForConfig?: { id: string, name: string } | null;
  sendConfiguredInvite?: (options: { problems?: string[]; unrated?: boolean; gameMode?: string }) => void;
  cancelConfiguredInvite?: () => void;
  sessionStatus?: string;
}

export const BattleWindow: React.FC<BattleWindowProps> = React.memo(({
  startBattle, startQuickMatch, setShowWaitingPopup, questions, session, isGuest, handlePlayAsGuest, t, onDeleteQuestion, onEditQuestion,
  createDuel, joinDuel, activeDuel, setActiveDuel, setDuelPin, showCancelDuel, setShowCancelDuel, handleCancelDuel, timeLeft, userStats,
  showSignInOptions, setShowSignInOptions, isWaitingForResponse = false, guestId = null,
  inviteTargetForConfig, sendConfiguredInvite, cancelConfiguredInvite, sessionStatus
}) => {
  const [joinPin, setJoinPin] = useState("");
  const [showBubbles, setShowBubbles] = useState(false);
  const [isQuickMatchMode, setIsQuickMatchMode] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isArtificiallyLoading, setIsArtificiallyLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsArtificiallyLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const [showUplinkConfigPanel, setShowUplinkConfigPanel] = useState(false);
  const [uplinkProblems, setUplinkProblems] = useState<string[]>([]);
  const [uplinkIsRanked, setUplinkIsRanked] = useState(true);

  const [draggedProblemIndex, setDraggedProblemIndex] = useState<number | null>(null);

  const moveUplinkProblem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === uplinkProblems.length - 1) return;
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...uplinkProblems];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setUplinkProblems(updated);
  };

  const moveSelectedProblem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === selectedProblems.length - 1) return;
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...selectedProblems];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setSelectedProblems(updated);
  };

  const [pendingChallengeMatch, setPendingChallengeMatch] = useState<any>(null);

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

  const [activePath, setActivePath] = useState<string>("codeknights");
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ck_active_path");
      if (saved) setActivePath(saved);
    }
  }, []);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isBrowsingPublicMatches, setIsBrowsingPublicMatches] = useState(false);
  const [publicMatches, setPublicMatches] = useState<any[]>([]);
  const [isFetchingMatches, setIsFetchingMatches] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [isRanked, setIsRanked] = useState(true);
  
  const [filterDifficulties, setFilterDifficulties] = useState<string[]>([]);
  const [filterMinElo, setFilterMinElo] = useState<string>("");
  const [filterMaxElo, setFilterMaxElo] = useState<string>("");
  const [battleNotification, setBattleNotification] = useState<{message: string, isConfirm?: boolean, onConfirm?: () => void} | null>(null);

  useEffect(() => {
    if (battleNotification) {
      const timer = setTimeout(() => setBattleNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [battleNotification]);

  const renderBattleNotification = () => (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', pointerEvents: 'none' }}>
      <AnimatePresence>
        {battleNotification && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            style={{
              background: 'rgba(20, 20, 25, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--line)',
              borderLeft: '4px solid #ff5555',
              padding: '0.75rem 1rem',
              borderRadius: '0.4rem',
              color: 'var(--text)',
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              zIndex: 1000,
              pointerEvents: 'none'
            }}
          >
            {battleNotification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  
  const fetchPublicMatches = React.useCallback(async () => {
    setIsFetchingMatches(true);
    try {
      const mode = activePath === "bughunter" ? "BUGHUNTER" : "CODEKNIGHTS";
      const res = await fetch(`/api/duels/public?gameMode=${mode}`);
      if (res.ok) {
        const data = await res.json();
        setPublicMatches(data);
      }
    } catch (err) {
      console.error(err);
    }
    setIsFetchingMatches(false);
  }, [activePath]);

  useEffect(() => {
    let interval: any;
    if (isBrowsingPublicMatches) {
      fetchPublicMatches();
      interval = setInterval(fetchPublicMatches, 60000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBrowsingPublicMatches, fetchPublicMatches]);

  const isAdmin = !!session?.user?.isAdmin;
  const themeColor = activePath === "bughunter" ? "#50fa7b" : activePath === "hackbounty" ? "#ffb86c" : activePath === "mlmages" ? "#bd93f9" : "#38bdf8";

  useEffect(() => {
    const isBughunter = activePath === "bughunter";
    setSelectedProblems([]);
    setUplinkProblems([]);
  }, [activePath]);

  // Automatically reset if duel finishes
  useEffect(() => {
    if (activeDuel && activeDuel.status === "FINISHED") {
      setActiveDuel(null);
      setDuelPin("");
    }
  }, [activeDuel, setActiveDuel, setDuelPin]);

  if (sessionStatus === "loading" || isArtificiallyLoading) {
    return <WindowSpinner />;
  }

  if (!session && !isGuest) {
    return (
      <div style={{ 
        padding: '2.5rem', 
        height: '100%', 
        overflowY: 'auto',
        overflowX: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: 'var(--bg)', 
        color: 'var(--text)',
        position: 'relative'
      }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', zIndex: 1, color: 'var(--accent)' }}>
          {showSignInOptions ? <LogIn size={32} /> : <Shield size={32} />}
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            {showSignInOptions ? t("signIn") : t("authRequired")}
          </h2>
        </div>

        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '400px', zIndex: 1 }}>
          {showSignInOptions
            ? (t("signIn") === "Conectare" 
                ? "Conectați-vă la cont pentru a vă salva progresul, a acumula puncte și a urca în clasament. De asemenea, veți avea acces la mai multe funcționalități." 
                : "Connect your account to save your progress, earn points, and climb the leaderboards. You'll also gain access to advanced features.")
            : (t("authRequired") === "Autentificare Necesară" 
                ? "Bun venit pe CodeKnights! Platforma supremă de programare competitivă unde te poți duela 1 la 1 în timp real, poți rezolva probleme de algoritmică și poți urca în clasament. Alege o opțiune de conectare mai jos pentru a-ți salva progresul și a intra în Arena de Luptă." 
                : "Welcome to CodeKnights! The ultimate competitive programming platform where you can duel 1v1 in real-time, solve algorithm problems, and climb the leaderboard. Choose a sign-in option below to save your progress and enter the Battle Arena.")
          }
        </p>

        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '320px' }}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => signIn("google", { callbackUrl: "/" })} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '1rem', 
              background: 'rgba(255,255,255,0.05)', 
              color: '#fff', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '0.75rem', 
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => signIn("github", { callbackUrl: "/" })} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '1rem', 
              background: '#24292e', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '0.75rem', 
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}
          >
            <Github size={20} /> Continue with GitHub
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePlayAsGuest} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '1rem', 
              background: 'transparent', 
              color: 'var(--text)', 
              border: '1px solid rgba(255,255,255,0.2)', 
              borderRadius: '0.75rem', 
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            <User size={18} /> {t("playAsGuest")}
          </motion.button>
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
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          {/* Outer Dashed Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px dashed var(--accent)',
              opacity: 0.3
            }}
          />
          {/* Inner Fast Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            style={{
              position: 'absolute',
              inset: 15,
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: 'var(--accent)',
              borderBottomColor: 'var(--accent)',
              opacity: 0.8
            }}
          />
          {/* Pulsing Core Icon */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Swords size={40} color="var(--accent)" />
          </motion.div>
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
    const calculatedTime = selectedProblems.reduce((sum, diff) => {
      if (activePath === 'bughunter') return sum + 8;
      return sum + (diff === 'EASY' ? 5 : diff === 'MEDIUM' ? 9 : 14);
    }, 0);

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
                  <div 
                    key={idx} 
                    draggable
                    onDragStart={(e) => {
                      setDraggedProblemIndex(idx);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', idx.toString());
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedProblemIndex !== null && draggedProblemIndex !== idx) {
                        const updated = [...selectedProblems];
                        const [moved] = updated.splice(draggedProblemIndex, 1);
                        updated.splice(idx, 0, moved);
                        setSelectedProblems(updated);
                      }
                      setDraggedProblemIndex(null);
                    }}
                    onDragEnd={() => setDraggedProblemIndex(null)}
                    style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      background: draggedProblemIndex === idx ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)', 
                      border: '1px solid var(--line)', borderRadius: '0.4rem', padding: '0.5rem 0.75rem',
                      cursor: 'grab', opacity: draggedProblemIndex === idx ? 0.5 : 1
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: activePath === 'bughunter' ? '#50fa7b' : p === 'EASY' ? '#50fa7b' : p === 'MEDIUM' ? '#ffb86c' : '#bd93f9' }}>
                      {idx + 1}. {p} (+{activePath === 'bughunter' ? 8 : p === 'EASY' ? 5 : p === 'MEDIUM' ? 9 : 14} mins)
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        onClick={() => moveSelectedProblem(idx, 'up')}
                        disabled={idx === 0}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: idx === 0 ? 'rgba(255,255,255,0.07)' : 'var(--accent)',
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.2rem',
                          borderRadius: '0.25rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => moveSelectedProblem(idx, 'down')}
                        disabled={idx === selectedProblems.length - 1}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: idx === selectedProblems.length - 1 ? 'rgba(255,255,255,0.07)' : 'var(--accent)',
                          cursor: idx === selectedProblems.length - 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.2rem',
                          borderRadius: '0.25rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProblems(prev => prev.filter((_, i) => i !== idx));
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ff5555',
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.2rem',
                          borderRadius: '0.25rem'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Problem Blocks Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>ADD PROBLEM BLOCK</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {activePath === "bughunter" ? (
                (["PYTHON", "CPP", "C", "JAVA"] as string[]).map(l => (
                  <button
                    key={l}
                    disabled={selectedProblems.length >= 5}
                    onClick={() => setSelectedProblems(prev => prev.length < 5 ? [...prev, l] : prev)}
                    style={{
                      flex: '1 1 90px',
                      padding: '0.6rem 0.25rem',
                      borderRadius: '0.4rem',
                      border: '1px solid rgba(80, 250, 123, 0.3)',
                      background: 'rgba(80, 250, 123, 0.05)',
                      color: '#50fa7b',
                      fontWeight: 900,
                      fontSize: '0.75rem',
                      cursor: selectedProblems.length >= 5 ? 'not-allowed' : 'pointer',
                      opacity: selectedProblems.length >= 5 ? 0.3 : 1,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => { if (selectedProblems.length < 5) e.currentTarget.style.background = 'rgba(80, 250, 123, 0.15)' }}
                    onMouseLeave={e => { if (selectedProblems.length < 5) e.currentTarget.style.background = 'rgba(80, 250, 123, 0.05)' }}
                  >
                    + {l} (+8m)
                  </button>
                ))
              ) : (
                <>
                  <button
                    disabled={selectedProblems.length >= 5}
                    onClick={() => setSelectedProblems(prev => prev.length < 5 ? [...prev, 'EASY'] : prev)}
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.25rem',
                      borderRadius: '0.4rem',
                      border: '1px solid rgba(80, 250, 123, 0.3)',
                      background: 'rgba(80, 250, 123, 0.05)',
                      color: '#50fa7b',
                      fontWeight: 900,
                      fontSize: '0.75rem',
                      cursor: selectedProblems.length >= 5 ? 'not-allowed' : 'pointer',
                      opacity: selectedProblems.length >= 5 ? 0.3 : 1,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => { if (selectedProblems.length < 5) e.currentTarget.style.background = 'rgba(80, 250, 123, 0.15)' }}
                    onMouseLeave={e => { if (selectedProblems.length < 5) e.currentTarget.style.background = 'rgba(80, 250, 123, 0.05)' }}
                  >
                    + EASY (+5m)
                  </button>
                  <button
                    disabled={selectedProblems.length >= 5}
                    onClick={() => setSelectedProblems(prev => prev.length < 5 ? [...prev, 'MEDIUM'] : prev)}
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.25rem',
                      borderRadius: '0.4rem',
                      border: '1px solid rgba(255, 184, 108, 0.3)',
                      background: 'rgba(255, 184, 108, 0.05)',
                      color: '#ffb86c',
                      fontWeight: 900,
                      fontSize: '0.75rem',
                      cursor: selectedProblems.length >= 5 ? 'not-allowed' : 'pointer',
                      opacity: selectedProblems.length >= 5 ? 0.3 : 1,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => { if (selectedProblems.length < 5) e.currentTarget.style.background = 'rgba(255, 184, 108, 0.15)' }}
                    onMouseLeave={e => { if (selectedProblems.length < 5) e.currentTarget.style.background = 'rgba(255, 184, 108, 0.05)' }}
                  >
                    + MEDIUM (+9m)
                  </button>
                  <button
                    disabled={selectedProblems.length >= 5}
                    onClick={() => setSelectedProblems(prev => prev.length < 5 ? [...prev, 'HARD'] : prev)}
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.25rem',
                      borderRadius: '0.4rem',
                      border: '1px solid rgba(189, 147, 249, 0.3)',
                      background: 'rgba(189, 147, 249, 0.05)',
                      color: '#bd93f9',
                      fontWeight: 900,
                      fontSize: '0.75rem',
                      cursor: selectedProblems.length >= 5 ? 'not-allowed' : 'pointer',
                      opacity: selectedProblems.length >= 5 ? 0.3 : 1,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => { if (selectedProblems.length < 5) e.currentTarget.style.background = 'rgba(189, 147, 249, 0.15)' }}
                    onMouseLeave={e => { if (selectedProblems.length < 5) e.currentTarget.style.background = 'rgba(189, 147, 249, 0.05)' }}
                  >
                    + HARD (+14m)
                  </button>
                </>
              )}
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
                    await startQuickMatch('create', {
                      problems: selectedProblems,
                      isRanked,
                      gameMode: activePath === "bughunter" ? "BUGHUNTER" : "CODEKNIGHTS"
                    });
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

  if (showUplinkConfigPanel) {
    const calculatedUplinkTime = uplinkProblems.reduce((sum, diff) => {
      if (activePath === 'bughunter') return sum + 8;
      return sum + (diff === 'EASY' ? 5 : diff === 'MEDIUM' ? 9 : 14);
    }, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '480px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', borderRadius: '0.8rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, textAlign: 'center', color: 'var(--text)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            UPLINK CONFIGURATION
          </h2>

          {/* Added Problems List */}
          {activePath !== "hackbounty" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>SELECTED PROBLEMS QUEUE</label>
              {uplinkProblems.length === 0 ? (
                <div style={{ padding: '1rem', border: '1px dashed var(--line)', borderRadius: '0.4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No problems selected. Add some below!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {uplinkProblems.map((p, idx) => (
                    <div 
                      key={idx} 
                      draggable
                      onDragStart={(e) => {
                        setDraggedProblemIndex(idx);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', idx.toString());
                      }}
                      onDragOver={(e) => {
                        e.preventDefault(); // necessary to allow drop
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedProblemIndex !== null && draggedProblemIndex !== idx) {
                          const updated = [...uplinkProblems];
                          const [moved] = updated.splice(draggedProblemIndex, 1);
                          updated.splice(idx, 0, moved);
                          setUplinkProblems(updated);
                        }
                        setDraggedProblemIndex(null);
                      }}
                      onDragEnd={() => setDraggedProblemIndex(null)}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        background: draggedProblemIndex === idx ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)', 
                        border: '1px solid var(--line)', borderRadius: '0.4rem', padding: '0.5rem 0.75rem',
                        cursor: 'grab', opacity: draggedProblemIndex === idx ? 0.5 : 1
                      }}
                    >
                      <span style={{ fontWeight: 800, fontSize: '0.8rem', color: activePath === 'bughunter' ? '#50fa7b' : p === 'EASY' ? '#50fa7b' : p === 'MEDIUM' ? '#ffb86c' : '#bd93f9' }}>
                        {idx + 1}. {p} (+{activePath === 'bughunter' ? 8 : p === 'EASY' ? 5 : p === 'MEDIUM' ? 9 : 14} mins)
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => moveUplinkProblem(idx, 'up')}
                          disabled={idx === 0}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: idx === 0 ? 'rgba(255,255,255,0.07)' : 'var(--accent)',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.2rem',
                            borderRadius: '0.25rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => moveUplinkProblem(idx, 'down')}
                          disabled={idx === uplinkProblems.length - 1}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: idx === uplinkProblems.length - 1 ? 'rgba(255,255,255,0.07)' : 'var(--accent)',
                            cursor: idx === uplinkProblems.length - 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.2rem',
                            borderRadius: '0.25rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setUplinkProblems(prev => prev.filter((_, i) => i !== idx));
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ff5555',
                            fontWeight: 900,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.2rem',
                            borderRadius: '0.25rem'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Problem Blocks Buttons */}
          {activePath !== "hackbounty" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>ADD PROBLEM BLOCK</label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {activePath === "bughunter" ? (
                  (["PYTHON", "CPP", "C", "JAVA"] as string[]).map(l => (
                    <button
                      key={l}
                      disabled={uplinkProblems.length >= 5}
                      onClick={() => setUplinkProblems(prev => prev.length < 5 ? [...prev, l] : prev)}
                      style={{
                        flex: '1 1 90px',
                        padding: '0.6rem 0.25rem',
                        borderRadius: '0.4rem',
                        border: '1px solid rgba(80, 250, 123, 0.3)',
                        background: 'rgba(80, 250, 123, 0.05)',
                        color: '#50fa7b',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        cursor: uplinkProblems.length >= 5 ? 'not-allowed' : 'pointer',
                        opacity: uplinkProblems.length >= 5 ? 0.3 : 1,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => { if (uplinkProblems.length < 5) e.currentTarget.style.background = 'rgba(80, 250, 123, 0.15)' }}
                      onMouseLeave={e => { if (uplinkProblems.length < 5) e.currentTarget.style.background = 'rgba(80, 250, 123, 0.05)' }}
                    >
                      + {l} (+8m)
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      disabled={uplinkProblems.length >= 5}
                      onClick={() => setUplinkProblems(prev => prev.length < 5 ? [...prev, 'EASY'] : prev)}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.25rem',
                        borderRadius: '0.4rem',
                        border: '1px solid rgba(80, 250, 123, 0.3)',
                        background: 'rgba(80, 250, 123, 0.05)',
                        color: '#50fa7b',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        cursor: uplinkProblems.length >= 5 ? 'not-allowed' : 'pointer',
                        opacity: uplinkProblems.length >= 5 ? 0.3 : 1,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => { if (uplinkProblems.length < 5) e.currentTarget.style.background = 'rgba(80, 250, 123, 0.15)' }}
                      onMouseLeave={e => { if (uplinkProblems.length < 5) e.currentTarget.style.background = 'rgba(80, 250, 123, 0.05)' }}
                    >
                      + EASY (+5m)
                    </button>
                    <button
                      disabled={uplinkProblems.length >= 5}
                      onClick={() => setUplinkProblems(prev => prev.length < 5 ? [...prev, 'MEDIUM'] : prev)}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.25rem',
                        borderRadius: '0.4rem',
                        border: '1px solid rgba(255, 184, 108, 0.3)',
                        background: 'rgba(255, 184, 108, 0.05)',
                        color: '#ffb86c',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        cursor: uplinkProblems.length >= 5 ? 'not-allowed' : 'pointer',
                        opacity: uplinkProblems.length >= 5 ? 0.3 : 1,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => { if (uplinkProblems.length < 5) e.currentTarget.style.background = 'rgba(255, 184, 108, 0.15)' }}
                      onMouseLeave={e => { if (uplinkProblems.length < 5) e.currentTarget.style.background = 'rgba(255, 184, 108, 0.05)' }}
                    >
                      + MEDIUM (+9m)
                    </button>
                    <button
                      disabled={uplinkProblems.length >= 5}
                      onClick={() => setUplinkProblems(prev => prev.length < 5 ? [...prev, 'HARD'] : prev)}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.25rem',
                        borderRadius: '0.4rem',
                        border: '1px solid rgba(189, 147, 249, 0.3)',
                        background: 'rgba(189, 147, 249, 0.05)',
                        color: '#bd93f9',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        cursor: uplinkProblems.length >= 5 ? 'not-allowed' : 'pointer',
                        opacity: uplinkProblems.length >= 5 ? 0.3 : 1,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => { if (uplinkProblems.length < 5) e.currentTarget.style.background = 'rgba(189, 147, 249, 0.15)' }}
                      onMouseLeave={e => { if (uplinkProblems.length < 5) e.currentTarget.style.background = 'rgba(189, 147, 249, 0.05)' }}
                    >
                      + HARD (+14m)
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Time & Type Summary Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: '0.4rem', border: '1px solid var(--line)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>TOTAL TIME:</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: themeColor }}>{calculatedUplinkTime} MINUTES</span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginRight: 'auto' }}>MATCH TYPE</span>
              {[
                { label: 'RANKED', value: true },
                { label: 'UNRATED', value: false }
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setUplinkIsRanked(opt.value)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '0.4rem',
                    border: uplinkIsRanked === opt.value ? `2px solid ${themeColor}` : '1px solid var(--line)',
                    background: uplinkIsRanked === opt.value ? `${themeColor}22` : 'rgba(0,0,0,0.2)',
                    color: uplinkIsRanked === opt.value ? themeColor : 'var(--text)',
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
              onClick={() => {
                setShowUplinkConfigPanel(false);
                if (inviteTargetForConfig && cancelConfiguredInvite) {
                  cancelConfiguredInvite();
                }
              }}
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
              disabled={activePath !== 'hackbounty' && uplinkProblems.length === 0}
              onClick={async () => {
                setShowUplinkConfigPanel(false);
                const matchProblems = activePath === "hackbounty" ? ["ANY"] : uplinkProblems;
                if (inviteTargetForConfig && sendConfiguredInvite) {
                  sendConfiguredInvite({
                    problems: matchProblems,
                    unrated: !uplinkIsRanked,
                    gameMode: activePath === "bughunter" ? "BUGHUNTER" : activePath === "hackbounty" ? "HACKBOUNTY" : activePath === "mlmages" ? "MLMAGES" : "CODEKNIGHTS"
                  });
                } else {
                  setIsCreating(true);
                  try {
                    await createDuel(false, {
                      problems: matchProblems,
                      unrated: !uplinkIsRanked,
                      gameMode: activePath === "bughunter" ? "BUGHUNTER" : activePath === "hackbounty" ? "HACKBOUNTY" : activePath === "mlmages" ? "MLMAGES" : "CODEKNIGHTS"
                    });
                    setShowWaitingPopup(true);
                  } catch (e) {
                    console.error(e);
                  }
                  setIsCreating(false);
                }
              }}
              style={{
                flex: 2,
                padding: '0.75rem',
                borderRadius: '0.4rem',
                border: 'none',
                background: (activePath !== 'hackbounty' && uplinkProblems.length === 0) ? 'var(--text-muted)' : themeColor,
                color: '#000',
                fontWeight: 900,
                cursor: (activePath !== 'hackbounty' && uplinkProblems.length === 0) ? 'not-allowed' : 'pointer',
                boxShadow: (activePath !== 'hackbounty' && uplinkProblems.length === 0) ? 'none' : `0 4px 15px ${themeColor}33`
              }}
            >
              {inviteTargetForConfig ? `INVITE ${inviteTargetForConfig.name.toUpperCase()}` : "CREATE UPLINK"}
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
              Queue: {pendingChallengeMatch.questions ? Object.entries(pendingChallengeMatch.questions.reduce((acc: any, q: any) => {
                  const d = q.difficulty || "UNKNOWN";
                  acc[d] = (acc[d] || 0) + 1;
                  return acc;
                }, {})).map(([d, c]) => `${c} ${d === 'CPP' ? 'C++' : d}`).join(", ").toUpperCase() : pendingChallengeMatch.difficulty}
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
            <motion.div animate={isFetchingMatches ? { rotate: -360 } : { rotate: 0 }} transition={isFetchingMatches ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0 }}>
              <RotateCcw size={16} />
            </motion.div>
          </button>
        </div>

        {/* Filters Section */}
        {activePath !== "hackbounty" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', flexShrink: 0 }}>
          
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter Matches</div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            
            {/* Format filter (bubbles) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '250px' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', opacity: filterDifficulties.length >= 5 ? 0.5 : 1, pointerEvents: filterDifficulties.length >= 5 ? 'none' : 'auto' }}>
                {activePath === "bughunter" ? (
                  <>
                    <button onClick={() => setFilterDifficulties([...filterDifficulties, 'PYTHON'])} style={{ background: 'rgba(241, 250, 140, 0.1)', color: '#f1fa8c', border: '1px solid rgba(241, 250, 140, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Plus size={12} /> PYTHON
                    </button>
                    <button onClick={() => setFilterDifficulties([...filterDifficulties, 'CPP'])} style={{ background: 'rgba(139, 233, 253, 0.1)', color: '#8be9fd', border: '1px solid rgba(139, 233, 253, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Plus size={12} /> C++
                    </button>
                    <button onClick={() => setFilterDifficulties([...filterDifficulties, 'C'])} style={{ background: 'rgba(189, 147, 249, 0.1)', color: '#bd93f9', border: '1px solid rgba(189, 147, 249, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Plus size={12} /> C
                    </button>
                    <button onClick={() => setFilterDifficulties([...filterDifficulties, 'JAVA'])} style={{ background: 'rgba(255, 121, 198, 0.1)', color: '#ff79c6', border: '1px solid rgba(255, 121, 198, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Plus size={12} /> JAVA
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setFilterDifficulties([...filterDifficulties, 'EASY'])} style={{ background: 'rgba(80, 250, 123, 0.1)', color: '#50fa7b', border: '1px solid rgba(80, 250, 123, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Plus size={12} /> EASY
                    </button>
                    <button onClick={() => setFilterDifficulties([...filterDifficulties, 'MEDIUM'])} style={{ background: 'rgba(255, 184, 108, 0.1)', color: '#ffb86c', border: '1px solid rgba(255, 184, 108, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Plus size={12} /> MEDIUM
                    </button>
                    <button onClick={() => setFilterDifficulties([...filterDifficulties, 'HARD'])} style={{ background: 'rgba(255, 85, 85, 0.1)', color: '#ff5555', border: '1px solid rgba(255, 85, 85, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Plus size={12} /> HARD
                    </button>
                  </>
                )}
              </div>
              
              {filterDifficulties.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {filterDifficulties.map((diff, i) => {
                    let diffColor = '#50fa7b';
                    if (diff === 'HARD') diffColor = '#ff5555';
                    else if (diff === 'MEDIUM') diffColor = '#ffb86c';
                    else if (diff === 'PYTHON') diffColor = '#f1fa8c';
                    else if (diff === 'CPP') diffColor = '#8be9fd';
                    else if (diff === 'C') diffColor = '#bd93f9';
                    else if (diff === 'JAVA') diffColor = '#ff79c6';
                    
                    return (
                      <div key={i} onClick={() => setFilterDifficulties(filterDifficulties.filter((_, index) => index !== i))} style={{ background: diffColor, color: '#000', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        {diff === 'CPP' ? 'C++' : diff} <X size={10} />
                      </div>
                    );
                  })}
                  <div onClick={() => setFilterDifficulties([])} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline', padding: '0.1rem 0.5rem', alignSelf: 'center' }}>Clear</div>
                </div>
              )}
            </div>

            {/* Elo filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '250px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>OPP ELO:</div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.4rem', padding: '0.2rem' }}>
                <button onClick={() => setFilterMinElo(prev => String(Math.max(0, (parseInt(prev || "0") - 50))))} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem', borderRadius: '0.25rem' }}>
                  <Minus size={14} />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={filterMinElo}
                  onChange={(e) => setFilterMinElo(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  style={{ width: '40px', background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', fontSize: '0.85rem', textAlign: 'center' }}
                />
                <button onClick={() => setFilterMinElo(prev => String(parseInt(prev || "0") + 50))} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem', borderRadius: '0.25rem' }}>
                  <Plus size={14} />
                </button>
              </div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>-</span>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.4rem', padding: '0.2rem' }}>
                <button onClick={() => setFilterMaxElo(prev => String(Math.max(0, (parseInt(prev || "9999") - 50))))} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem', borderRadius: '0.25rem' }}>
                  <Minus size={14} />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={filterMaxElo}
                  onChange={(e) => setFilterMaxElo(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="9999"
                  style={{ width: '40px', background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', fontSize: '0.85rem', textAlign: 'center' }}
                />
                <button onClick={() => setFilterMaxElo(prev => String(parseInt(prev || "9999") + 50))} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem', borderRadius: '0.25rem' }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>
        )}

        {/* Matches List Container */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem', justifyContent: publicMatches.length === 0 ? 'center' : 'flex-start', alignItems: publicMatches.length === 0 ? 'center' : 'stretch' }}>
          {publicMatches.length === 0 ? (
            isFetchingMatches ? (
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
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.6 }}>
                <Users size={48} style={{ marginBottom: '1rem', color: 'var(--accent)', opacity: 0.5 }} />
                <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.25rem' }}>NO ACTIVE MATCHES FOUND</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Create a coding match to invite other challengers!</div>
              </div>
            )
          ) : (
            [...publicMatches].map(match => {
              let score = 0;
              const hostElo = match.host?.rating ?? 1000;
              const minElo = filterMinElo ? parseInt(filterMinElo) : 0;
              const maxElo = filterMaxElo ? parseInt(filterMaxElo) : 9999;
              
              // Score Elo Match
              if (hostElo >= minElo && hostElo <= maxElo) {
                score += 100;
              } else {
                const diff = Math.min(Math.abs(hostElo - minElo), Math.abs(hostElo - maxElo));
                score -= diff * 0.1; // Penalize based on distance from range
              }

              // Score Difficulty Match
              if (filterDifficulties.length > 0) {
                const requiredCounts = filterDifficulties.reduce((acc: any, diff: string) => {
                  acc[diff] = (acc[diff] || 0) + 1;
                  return acc;
                }, {});
                
                const matchCounts = (match.questions || []).reduce((acc: any, q: any) => {
                  const d = q.difficulty || "UNKNOWN";
                  acc[d] = (acc[d] || 0) + 1;
                  return acc;
                }, {});

                let diffScore = 0;
                for (const diff of Object.keys(requiredCounts)) {
                  const has = matchCounts[diff] || 0;
                  const req = requiredCounts[diff];
                  if (has >= req) {
                    diffScore += req * 50; // Points for having what we want
                  } else {
                    diffScore += has * 50; // Partial points
                    diffScore -= (req - has) * 20; // Penalty for missing
                  }
                }
                score += diffScore;
              }
              
              return { match, score };
            })
            .sort((a, b) => b.score - a.score)
            .map(({ match }) => {
              const hostName = match.host?.username || match.host?.name || "Host";
              const hostElo = match.host?.rating ?? 1000;
              const hostImage = match.host?.image;
              const isRoyal = !!match.host?.isRoyal;
              const diffColor = match.question?.difficulty === 'HARD' ? '#ff5555' : match.question?.difficulty === 'MEDIUM' ? '#ffb86c' : '#50fa7b';
                const formatMap = (match.questions || []).reduce((acc: any, q: any) => {
                  const d = q.difficulty || "UNKNOWN";
                  acc[d] = (acc[d] || 0) + 1;
                  return acc;
                }, {});
                const formatDisplay = Object.entries(formatMap).length > 0
                  ? Object.entries(formatMap).map(([d, c]) => `${c} ${d === 'CPP' ? 'C++' : d}`).join(", ").toUpperCase()
                  : match.difficulty;

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
                      {match.numProblems} Problem{match.numProblems > 1 ? 's' : ''} ({formatDisplay})
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Duration: {match.totalTime}m • {match.unrated ? 'Unrated' : 'Ranked'}
                    </div>
                  </div>

                  {/* Right Column: CTA */}
                  <button
                    onClick={() => {
                      const hostElo = match.host?.rating ?? 1000;
                      const userElo = userStats?.rating ?? 1000;
                      
                      if (userElo - hostElo > 250) {
                        setBattleNotification({
                          message: "Challenging an underdog. You won't gain much Elo but could lose a lot!",
                        });
                      } else if (hostElo - userElo > 250) {
                        setBattleNotification({
                          message: "Challenging a stronger opponent. There is a very large Elo gap!",
                        });
                      }

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
        {renderBattleNotification()}
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
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {hoveredOption?.name}
                      {(hoveredOption as any)?.isWip && (
                        <span style={{ 
                          fontSize: '0.55rem', 
                          background: 'rgba(255, 170, 0, 0.15)', 
                          color: '#ffaa00', 
                          padding: '0.1rem 0.3rem', 
                          borderRadius: '0.2rem',
                          fontWeight: 800,
                          textTransform: 'uppercase'
                        }}>
                          WIP
                        </span>
                      )}
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
        <WindowSpinner message={isCreating ? "GENERATING..." : (t("joining") || "JOINING...")} />
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
             const streak = activePath === "codeknights" ? (userStats?.codeKnightsStreak || userStats?.currentStreak || 0) :
                            activePath === "bughunter" ? (userStats?.bugHunterStreak || 0) :
                            activePath === "hackbounty" ? (userStats?.hackBountyStreak || 0) :
                            activePath === "mlmages" ? (userStats?.mlMagesStreak || 0) : 0;
             return (
               <div title={`Current Win Streak: ${streak}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: streak > 0 ? '#ffb86c' : 'var(--text-muted)', filter: streak > 0 ? 'drop-shadow(0 0 8px rgba(255, 184, 108, 0.4))' : 'none', background: streak > 0 ? 'rgba(255, 184, 108, 0.1)' : 'rgba(255,255,255,0.05)', padding: '0.5rem 1.25rem', borderRadius: '2rem', border: streak > 0 ? '1px solid rgba(255, 184, 108, 0.2)' : '1px solid var(--line)', marginTop: '0.5rem' }}>
                  <Flame size={20} fill={streak > 0 ? "#ffb86c" : "none"} />
                  <span style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '0.05em' }}>{streak} {t("currentStreak")?.toUpperCase() || "STREAK"}</span>
               </div>
             );
          })()}
        </div>
        
        {/* Unified Setup Controls for All Paths */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', paddingBottom: '1rem', flex: 1 }}>
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

          {/* Action Grid: Create/Find Match & Uplink/Join */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(max(180px, calc(50% - 1rem)), 1fr))', gap: '1rem', width: '100%', flex: 1 }}>
            {/* 1. CREATE MATCH */}
            <button 
              onClick={() => {
                if (activePath === 'hackbounty') {
                  setIsQuickMatchMode(true);
                  startQuickMatch?.('create', { gameMode: 'HACKBOUNTY', problems: ['ANY'] }).catch(() => setIsQuickMatchMode(false));
                } else {
                  setShowSettingsPanel(true);
                }
              }}
              disabled={isJoining || isCreating}
              style={{ 
                background: themeColor, 
                color: '#000', 
                border: 'none', 
                padding: '0 1.5rem', 
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
                opacity: 1,
                height: '100%',
                minHeight: '4rem',
                width: '100%'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Sword size={22} fill="currentColor" /> {activePath === "bughunter" ? "CREATE DEBUG MATCH" : activePath === "hackbounty" ? "CREATE BOUNTY DUEL" : activePath === "mlmages" ? "CREATE GENERATION MATCH" : "CREATE CODING MATCH"}
            </button>

            {/* 2. CREATE UPLINK */}
            <button 
              onClick={async () => { 
                if (isWaitingForResponse) return;
                if (activePath === 'hackbounty') {
                  setIsCreating(true);
                  try {
                    await createDuel(false, {
                      gameMode: 'HACKBOUNTY',
                      problems: ['ANY'],
                      unrated: false
                    });
                    setShowWaitingPopup(true);
                  } catch (e) {
                    console.error(e);
                  }
                  setIsCreating(false);
                } else {
                  setShowUplinkConfigPanel(true);
                }
              }}
              disabled={isCreating || isJoining || isWaitingForResponse}
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                color: themeColor, 
                border: `1px solid ${themeColor}33`, 
                padding: '0 1.5rem', 
                borderRadius: '0.4rem', 
                fontWeight: 900, 
                fontSize: '1.1rem', 
                cursor: (isCreating || isJoining || isWaitingForResponse) ? 'not-allowed' : 'pointer', 
                letterSpacing: '0.1em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s ease',
                opacity: isWaitingForResponse ? 0.4 : 1,
                height: '100%',
                minHeight: '4rem',
                width: '100%'
              }}
              onMouseEnter={(e) => { if (!isWaitingForResponse) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { if (!isWaitingForResponse) e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Users size={20} /> {isCreating ? "GENERATING..." : isWaitingForResponse ? "WAITING..." : (inviteTargetForConfig ? "CONFIGURE INVITE" : t("createUplink").toUpperCase())}
            </button>

            {/* 3. FIND MATCH */}
            <button 
              onClick={() => {
                setIsBrowsingPublicMatches(true);
              }}
              disabled={isJoining || isCreating}
              style={{ 
                background: 'transparent', 
                color: themeColor, 
                border: `2px solid ${themeColor}`, 
                padding: '0 1.5rem', 
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
                opacity: 1,
                height: '100%',
                minHeight: '4rem',
                width: '100%'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = `${themeColor}10` }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'transparent' }}
            >
              <Users size={22} /> {activePath === "bughunter" ? "FIND DEBUG MATCH" : activePath === "hackbounty" ? "FIND BOUNTY DUEL" : activePath === "mlmages" ? "FIND GENERATION MATCH" : "FIND PUBLIC MATCH"}
            </button>

            {/* 4. ENTER PIN */}
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', height: '100%', minHeight: '4rem' }}>
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
                    height: '100%', 
                    background: 'rgba(0,0,0,0.3)', 
                    border: '1px solid var(--line)', 
                    borderRadius: '0.4rem', 
                    color: 'inherit', 
                    padding: '0 1rem 0 2.75rem', 
                    outline: 'none', 
                    boxSizing: 'border-box',
                    fontSize: '1.1rem',
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
                  if (activePath !== "codeknights" && activePath !== "bughunter" && activePath !== "hackbounty") return;
                  setIsJoining(true);
                  await joinDuel(joinPin);
                  setIsJoining(false);
                }}
                disabled={isJoining || isCreating}
                style={{ 
                  height: '100%', 
                  background: (activePath === "codeknights" || activePath === "bughunter" || activePath === "hackbounty") ? 'var(--text)' : 'rgba(255,255,255,0.05)', 
                  color: (activePath === "codeknights" || activePath === "bughunter" || activePath === "hackbounty") ? '#000' : 'var(--text-muted)', 
                  border: (activePath === "codeknights" || activePath === "bughunter" || activePath === "hackbounty") ? 'none' : '1px solid var(--line)', 
                  fontWeight: 900, 
                  padding: '0 1.5rem',
                  borderRadius: '0.4rem',
                  cursor: (isJoining || isCreating) ? 'wait' : ((activePath === "codeknights" || activePath === "bughunter" || activePath === "hackbounty") ? 'pointer' : 'not-allowed'),
                  fontSize: '1rem',
                  letterSpacing: '0.1em',
                  opacity: (isJoining || isCreating) ? 0.7 : 1
                }}
              >
                {isJoining ? t("joining") : t("join")}
              </button>
            </div>
          </div>
        </div>
        {renderBattleNotification()}
      </div>
    </div>
  );
});
BattleWindow.displayName = "BattleWindow";
