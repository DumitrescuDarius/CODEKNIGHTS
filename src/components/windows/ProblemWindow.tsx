"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Sword, Trophy, X, Zap, Cpu, Activity, ShieldCheck, MessageSquareQuote, Eye, Crown, Skull, Medal, ChevronDown } from "lucide-react";
import Editor from "@monaco-editor/react";
import { Question } from "../../types";
import { LANG_CONFIG } from "../../constants/languages";
import { TranslationKey } from "../../constants/translations";
import { DefaultAvatar } from "../DefaultAvatar";

type CodeAnalysis = {
  timeComplexity?: string;
  spaceComplexity?: string;
  complexityExplanation?: string;
  meetsComplexityRequirements?: boolean | null;
  scores?: { efficiency: number; readability: number; maintainability: number; security: number };
  feedback?: string;
  error?: string;
  details?: string;
  quotaExceeded?: boolean;
  failedSubmissionsCount?: number;
};

function isQuotaOrRateLimitError(a: CodeAnalysis | null | undefined): boolean {
  if (!a?.error) return false;
  if (a.quotaExceeded) return true;
  const blob = `${a.error} ${a.details || ""}`.toLowerCase();
  return (
    blob.includes("quota") ||
    blob.includes("429") ||
    blob.includes("resource_exhausted") ||
    blob.includes("rate limit")
  );
}

function ComplexityAnalysisError({
  analysis,
  layout = "inline",
}: {
  analysis: CodeAnalysis;
  layout?: "inline" | "centered";
}) {
  if (isQuotaOrRateLimitError(analysis)) {
    const boxStyle: React.CSSProperties =
      layout === "centered"
        ? {
            margin: "0 auto 1rem",
            textAlign: "left",
            maxWidth: "32rem",
            padding: "1rem 1.15rem",
            borderRadius: "0.5rem",
            background: "rgba(241, 250, 140, 0.06)",
            border: "1px solid rgba(241, 250, 140, 0.35)",
            color: "var(--text)",
          }
        : {
            marginTop: "0.65rem",
            padding: "1rem 1.1rem",
            borderRadius: "0.5rem",
            background: "rgba(241, 250, 140, 0.06)",
            border: "1px solid rgba(241, 250, 140, 0.35)",
            color: "var(--text)",
          };
    return (
      <div style={boxStyle}>
        <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.5rem", color: "#f1fa8c" }}>
          Complexity analysis unavailable
        </div>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.55, margin: "0 0 0.75rem", color: "var(--text-muted)" }}>
          The automatic complexity analysis is temporarily unavailable. You can retry or use the built-in Big-O heuristic.
        </p>
        <ol style={{ fontSize: "0.8rem", lineHeight: 1.6, margin: "0 0 0.85rem", paddingLeft: "1.25rem", color: "var(--text)" }}>
          <li style={{ marginBottom: "0.35rem" }}>
            Try <strong>Analyze complexity</strong> again in a moment.
          </li>
          <li style={{ marginBottom: "0.35rem" }}>
            Ensure your code runs successfully and that tests completed without runtime errors.
          </li>
          <li style={{ marginBottom: "0.35rem" }}>If the issue persists, review the complexity manually using standard Big-O reasoning.</li>
        </ol>
      </div>
    );
  }
  const pStyle: React.CSSProperties =
    layout === "centered"
      ? { color: "#ff5555", fontSize: "0.9rem", marginBottom: "1rem", marginTop: 0 }
      : { color: "#ff5555", fontSize: "0.85rem", marginTop: "0.65rem", marginBottom: 0 };
  return (
    <p style={pStyle}>
      {analysis.error}
      {analysis.details ? ` — ${analysis.details}` : ""}
    </p>
  );
}

interface ProblemWindowProps {
  userId: string;
  activeQuestion: Question | null;
  testResults: { passed: number; total: number; details: any[] } | null;
  showQuitConfirmation: boolean;
  setShowQuitConfirmation: (val: boolean) => void;
  handleQuitBattle: () => void;
  runTests: () => void;
  isTesting: boolean;
  setStdin: (val: string) => void;
  setShowTerminal: (val: boolean) => void;
  setTerminalOutput: (val: string) => void;
  solveTime: string | null;
  lang: string;
  startNewBattle: () => void;
  runSingleTest: (input: string, index: number) => void;
  t: (key: TranslationKey) => string;
  analysis: CodeAnalysis | null;
  isAnalyzing: boolean;
  onAnalyzeComplexity: () => void;
  activeDuel?: any;
  timeLeft?: number | null;
  totalPenalty: number | null;
  wrongAttemptCount: number;
  calculatePenalty: (time: number, wa: number, scores: any, actualComp: string | undefined, idealComp: string | undefined) => number;
  retryProblem: () => void;
  setActiveDuel?: (val: any) => void;
  setDuelPin?: (val: string) => void;
  onOpenUserProfile?: (userId: string) => void;
  activeQuestionIndex?: number;
  changeActiveQuestion?: (index: number) => void;
  problemTestResults?: Record<string, { passed: number; total: number; details: any[] }>;
  problemScores?: Record<string, number>;
  problemWrongAttemptCounts?: Record<string, number>;
  setCode?: (val: string) => void;
}

export const ProblemWindow: React.FC<ProblemWindowProps> = React.memo(({
  userId, activeQuestion, testResults, totalPenalty, wrongAttemptCount, calculatePenalty, retryProblem, showQuitConfirmation, setShowQuitConfirmation,
  handleQuitBattle, runTests, isTesting, setStdin, setShowTerminal,
  setTerminalOutput, solveTime, lang, startNewBattle, runSingleTest, t,
  analysis, isAnalyzing, onAnalyzeComplexity, activeDuel, timeLeft, setActiveDuel, setDuelPin, onOpenUserProfile,
  activeQuestionIndex, changeActiveQuestion, problemTestResults, problemScores, problemWrongAttemptCounts, setCode
}) => {
  const [isScrolledToTop, setIsScrolledToTop] = useState(true);
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolledToTop(e.currentTarget.scrollTop < 5);
  }, []);

  const allPassed = testResults?.passed === testResults?.total && testResults?.total > 0 && (testResults as any)?.phase === (activeDuel?.phase || null);
  const isDuelFinished = activeDuel?.status === "FINISHED" || (activeDuel != null && timeLeft === 0 && !(activeDuel?.gameMode === "HACKBOUNTY" && activeDuel?.phase === "BREAKING"));
  const isHost = activeDuel?.hostId === userId;
  const isGuest = activeDuel?.guestId === userId;
  const userFinalized = isHost ? activeDuel?.hostFinalized : (isGuest ? activeDuel?.guestFinalized : false);
  const otherFinalized = isHost ? activeDuel?.guestFinalized : (isGuest ? activeDuel?.hostFinalized : false);

  const allProblemsSolved = activeDuel?.questions && activeDuel.questions.length > 0
    ? activeDuel.questions.every((q: any) => {
        const res = problemTestResults?.[q.id];
        return res && res.passed === res.total && res.total > 0 && (res as any).phase === (activeDuel?.phase || null);
      })
    : allPassed;

  const renderMatchStats = () => {
    const currentUserIsHost = isHost || (!isHost && !isGuest); 
    
    const hostStats = {
      role: "Host",
      name: activeDuel.host?.username || "Host",
      score: activeDuel.hostPenalty ?? 0,
      solveTime: activeDuel.hostSolveTime,
      testsPassed: activeDuel.hostTestsPassed ?? 0,
      testsTotal: activeDuel.hostTestsTotal ?? 0,
      codeLength: activeDuel.hostCodeLength ?? 0
    };

    const guestStats = {
      role: "Guest",
      name: activeDuel.guest?.username || "Guest",
      score: activeDuel.guestPenalty ?? 0,
      solveTime: activeDuel.guestSolveTime,
      testsPassed: activeDuel.guestTestsPassed ?? 0,
      testsTotal: activeDuel.guestTestsTotal ?? 0,
      codeLength: activeDuel.guestCodeLength ?? 0
    };

    const firstStats = currentUserIsHost ? hostStats : guestStats;
    const secondStats = currentUserIsHost ? guestStats : hostStats;

    const renderCard = (stats: any, isMe: boolean) => (
      <div key={stats.role} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${isMe ? 'var(--accent)' : 'var(--line)'}`, borderRadius: '0.8rem', position: 'relative', overflow: 'hidden' }}>
        {isMe && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />}
        
        <div style={{ fontSize: '0.8rem', color: isMe ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>
          {isMe ? "Your Stats" : "Opponent Stats"}
        </div>
        
        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '1.2rem' }}>
          {stats.score} <span style={{ fontSize: '1rem', opacity: 0.6 }}>PTS</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Time Spent</div>
            <div style={{ fontSize: '1rem', color: '#f1fa8c', fontWeight: 800 }}>
              {stats.solveTime ? formatTime(Math.floor(stats.solveTime / 1000)) : "--:--"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Tests Passed</div>
            <div style={{ fontSize: '1rem', color: '#50fa7b', fontWeight: 800 }}>
              {stats.testsPassed} / {Math.max(stats.testsTotal, stats.testsPassed)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Code Length</div>
            <div style={{ fontSize: '1rem', color: '#ff79c6', fontWeight: 800 }}>
              {stats.codeLength} chars
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <>
        {renderCard(firstStats, true)}
        {activeDuel.guestId && renderCard(secondStats, false)}
      </>
    );
  };

  const SURRENDER_TIME = 999999999;

  const renderTimer = () => {
    console.log("[ProblemWindow] renderTimer - timeLeft:", timeLeft, "activeQuestion:", activeQuestion);
    if (timeLeft === null || timeLeft === undefined || activeQuestion === null) return null;
    return (
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        padding: '0.25rem 0.75rem',
        borderRadius: '0.4rem',
        fontSize: '1rem',
        fontWeight: 800,
        color: timeLeft < 60 ? '#ff5555' : 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Zap size={14} /> {formatTime(timeLeft)}
      </div>
    );
  };

  const renderOpponentProgress = () => {
    if (!activeDuel || activeDuel.status !== "ACTIVE" || isDuelFinished) return null;

    const isCurrentUserHost = activeDuel.hostId === userId;
    const opponent = isCurrentUserHost ? activeDuel.guest : activeDuel.host;
    const opponentName = isCurrentUserHost ? (activeDuel.guest?.username || activeDuel.guest?.name || "Guest") : (activeDuel.host?.username || activeDuel.host?.name || "Host");
    const opponentAvatar = opponent?.image || `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(opponentName)}`;

    const opponentCodeLength = isCurrentUserHost ? activeDuel.guestCodeLength : activeDuel.hostCodeLength;
    const opponentLineCount = isCurrentUserHost ? activeDuel.guestLineCount : activeDuel.hostLineCount;
    const opponentTestsPassed = isCurrentUserHost ? activeDuel.guestTestsPassed : activeDuel.hostTestsPassed;
    const opponentTestsTotal = isCurrentUserHost ? activeDuel.guestTestsTotal : activeDuel.hostTestsTotal;
    const opponentLastActive = isCurrentUserHost ? activeDuel.guestLastActive : activeDuel.hostLastActive;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          width: 'fit-content'
        }}
      >
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1 }}>Opponent:</span>
        
        <div 
          style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => {
            if (onOpenUserProfile && opponent?.id) {
              onOpenUserProfile(opponent.id);
            }
          }}
        >
          {opponentAvatar ? (
            <img 
              src={opponentAvatar} 
              alt={opponentName} 
              style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={10} color="var(--text-muted)" />
            </div>
          )}
        </div>

        <span 
          onClick={() => {
            if (onOpenUserProfile && opponent?.id) {
              onOpenUserProfile(opponent.id);
            }
          }}
          style={{ 
            fontSize: '0.85rem', 
            fontWeight: 800, 
            color: 'var(--text)', 
            lineHeight: 1,
            cursor: 'pointer',
            textDecoration: 'underline transparent',
            transition: 'color 0.2s, text-decoration-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent)';
            e.currentTarget.style.textDecorationColor = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text)';
            e.currentTarget.style.textDecorationColor = 'transparent';
          }}
        >
          {opponentName}
        </span>
        <div style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: otherFinalized ? '#50fa7b' : 'var(--text-muted)' }}>
          ({otherFinalized ? 'Finalized' : 'Coding...'})
        </div>
      </div>
    );
  };

  const [liveTime, setLiveTime] = useState(0);
  const [isPenaltyOpen, setIsPenaltyOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showFinalizeConfirmation, setShowFinalizeConfirmation] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setLiveTime(prev => prev + 1), 1000);
    
    const handleAiRequest = (e: any) => {
      if (e.detail === "problem" && activeQuestion) {
        window.dispatchEvent(new CustomEvent('add_ai_context', {
          detail: {
            // id: `problem-${activeQuestion.id}`,
            title: `Problem: ${activeQuestion.title}`,
            content: `Problem Title: ${activeQuestion.title}\n\nDescription:\n${activeQuestion.description}\n\nInput Format:\n${activeQuestion.inputFormat || "None"}\n\nOutput Format:\n${activeQuestion.outputFormat || "None"}\n\nRestrictions:\n${activeQuestion.restrictions || "None"}`
          }
        }));
      }
    };
    
    window.addEventListener("request_ai_context", handleAiRequest);
    return () => {
      clearInterval(interval);
      window.removeEventListener("request_ai_context", handleAiRequest);
    };
  }, [activeQuestion]);
  const handleFinalSubmit = React.useCallback(async () => {
    if (!activeDuel || isSubmitting || submitted) return;
    setIsSubmitting(true);
    try {
      const timeSeconds = solveTime ? solveTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0) : 0;
      const complexityTotal = analysis?.scores ? 
        (analysis.scores.efficiency + analysis.scores.readability + analysis.scores.maintainability + analysis.scores.security) * 50 : 0;

      await fetch("/api/duels/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            duelId: activeDuel.id, 
            finalize: true,
            solveTime: timeSeconds * 1000,
            complexityScore: complexityTotal,
            totalPenalty: totalPenalty,
            hackBountySolved: (activeDuel?.gameMode === "HACKBOUNTY" && allProblemsSolved) ? true : undefined
        })
      });
      window.dispatchEvent(new CustomEvent("duel_update_required", { detail: activeDuel.id }));
      setSubmitted(true);
    } catch (err) {
      console.error("Final submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeDuel, isSubmitting, submitted, solveTime, analysis, totalPenalty, allProblemsSolved]);

  useEffect(() => {
    const handleEndBattleReq = () => {
      if (allProblemsSolved) {
        handleFinalSubmit();
      } else {
        if (activeDuel?.gameMode === "BUGHUNTER" || activeDuel?.gameMode === "HACKBOUNTY") {
          alert(t("bugHunterMustPassAll") || "In BugHunter mode, you must pass all tests to submit and end the battle!");
          return;
        }
        setShowFinalizeConfirmation(true);
      }
    };
    window.addEventListener("request_end_battle", handleEndBattleReq);
    return () => window.removeEventListener("request_end_battle", handleEndBattleReq);
  }, [allProblemsSolved, handleFinalSubmit]);

  useEffect(() => {
    if (allProblemsSolved && !submitted && !isSubmitting && activeDuel?.status === "ACTIVE") {
      handleFinalSubmit();
    }
  }, [allProblemsSolved, submitted, isSubmitting, activeDuel]);

  useEffect(() => {
    if (timeLeft === 0 && !submitted && activeDuel?.status === "ACTIVE") {
      if (activeDuel?.gameMode === "HACKBOUNTY" && activeDuel.phase === "BREAKING") return;
      
      // Debounce to prevent stale timeLeft state from triggering premature submissions
      const timer = setTimeout(() => {
         handleFinalSubmit();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, submitted, activeDuel, handleFinalSubmit]);
  
  const penaltyBreakdown = {
      time: solveTime ? solveTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0) : 0,
      wa: wrongAttemptCount * 50
  };

  const livePenalty = penaltyBreakdown.time + penaltyBreakdown.wa;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "Enter") {
        e.preventDefault();
        runTests();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runTests]);

  const formatTime = (seconds: number) => {
    if (seconds * 1000 === SURRENDER_TIME) return "SURRENDERED";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const processedText = text.replace(/==(.*?)==/g, '[$1](#ck-mark)');
    return (
      <ReactMarkdown 
        children={processedText}
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({node, inline, className, children, ...props}: any) {
            return (
              <code className={className} style={{ 
                background: 'rgba(122, 162, 247, 0.15)', 
                color: 'var(--accent)',
                padding: '0.2rem 0.4rem', 
                borderRadius: '0.3rem', 
                fontFamily: '"Fira Code", monospace',
                fontSize: '0.9em',
                fontWeight: 600
              }} {...props}>
                {children}
              </code>
            );
          },
          pre({children, ...props}: any) {
            return <pre style={{ 
              background: 'rgba(0,0,0,0.4)', 
              padding: '1.25rem', 
              borderRadius: '0.5rem', 
              overflow: 'auto',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
            }} {...props}>{children}</pre>;
          },
          p({children, ...props}: any) {
            return <p style={{ margin: '0.5rem 0', lineHeight: 1.8, fontSize: '1.05rem', color: 'rgba(255,255,255,0.85)' }} {...props}>{children}</p>;
          },
          ul({children, ...props}: any) {
            return <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0', color: 'rgba(255,255,255,0.85)' }} {...props}>{children}</ul>;
          },
          a({href, children, ...props}: any) {
            if (href === '#ck-mark') {
              return (
                <mark style={{ background: 'rgba(255, 184, 108, 0.25)', color: '#ffb86c', padding: '0 0.3rem', borderRadius: '0.2rem', fontWeight: 700, boxShadow: '0 0 10px rgba(255, 184, 108, 0.1)' }}>
                  {children}
                </mark>
              );
            }
            return <a href={href} style={{ color: 'var(--accent)', textDecoration: 'underline' }} {...props}>{children}</a>;
          },
          li({children, ...props}: any) {
            return <li style={{ marginBottom: '0.5rem', lineHeight: 1.6 }} {...props}>{children}</li>;
          }
        }}
      />
    );
  };



  if (isDuelFinished) {
    // Keep the result display consistent with the server: a higher battle score
    // wins, while a score of zero represents a surrender/timeout.
    const hostSurrendered = activeDuel.hostPenalty === 0;
    const guestSurrendered = activeDuel.guestPenalty === 0;
    const hostScore = activeDuel.hostPenalty ?? 0;
    const guestScore = activeDuel.guestPenalty ?? 0;
    const hasRatingDecision = activeDuel.hostRatingChange !== null
      && activeDuel.hostRatingChange !== undefined
      && activeDuel.guestRatingChange !== null
      && activeDuel.guestRatingChange !== undefined
      && activeDuel.hostRatingChange !== activeDuel.guestRatingChange;

    const hostWin = hasRatingDecision
      ? activeDuel.hostRatingChange! > activeDuel.guestRatingChange!
      : !hostSurrendered && (guestSurrendered || hostScore > guestScore);
    const guestWin = hasRatingDecision
      ? activeDuel.guestRatingChange! > activeDuel.hostRatingChange!
      : !guestSurrendered && (hostSurrendered || guestScore > hostScore);
    const draw = !hostWin && !guestWin;

    return (
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <motion.div 
        onScroll={handleScroll}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ height: '100%', overflowY: 'auto', background: 'radial-gradient(circle at top, rgba(189,147,249,0.05) 0%, transparent 60%)' }}
      >
        <div style={{ padding: '3rem 2rem', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--accent)', textShadow: '0 2px 10px rgba(189,147,249,0.3)', letterSpacing: '-0.05em' }}>
          {t("duelResult")}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>{activeDuel.question?.title || "Match Ended"}</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', width: '100%', maxWidth: '700px', marginBottom: '4rem', flexWrap: 'wrap' }}>
          
          {/* HOST CARD */}
          <motion.div 
             initial={{ x: -30, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
             style={{ flex: 1, minWidth: '220px', padding: '2rem 1.5rem', background: hostWin ? 'linear-gradient(145deg, rgba(80, 250, 123, 0.1), rgba(0,0,0,0.2))' : 'rgba(255,255,255,0.02)', border: `1px solid ${hostWin ? 'rgba(80, 250, 123, 0.5)' : 'var(--line)'}`, borderRadius: '1rem', textAlign: 'center', position: 'relative', boxShadow: hostWin ? '0 10px 40px rgba(80, 250, 123, 0.1)' : 'none', filter: guestWin ? 'grayscale(0.5) opacity(0.8)' : 'none' }}
          >
            {hostWin && <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#50fa7b', color: '#000', padding: '0.3rem 1rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 800, display: 'flex', gap: '0.3rem', alignItems: 'center', boxShadow: '0 0 15px rgba(80,250,123,0.5)' }}><Crown size={14} /> {t("winner")}</div>}
            {guestWin && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#ff5555', color: '#fff', padding: '0.2rem 0.8rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 800 }}>DEFEATED</div>}
            
            <div 
              style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s ease' }}
              onClick={() => { if (activeDuel.hostId) onOpenUserProfile?.(activeDuel.hostId); }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <DefaultAvatar 
                name={activeDuel.host?.username || activeDuel.host?.name || "Host"} 
                size={80} 
                image={activeDuel.host?.image}
                isRoyal={!!activeDuel.host?.isRoyal}
                style={{ border: hostWin ? '3px solid #50fa7b' : '2px solid var(--line)', padding: '3px', background: 'var(--bg)' }} 
              />
            </div>
            
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>{activeDuel.host?.username || activeDuel.host?.name || "Host"}</div>
            
            <div style={{ fontSize: '0.9rem', color: '#f1fa8c', marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
              Rating: {activeDuel.host?.rating ?? 1000}
              {activeDuel.hostRatingChange !== null && activeDuel.hostRatingChange !== undefined && (
                <span style={{ color: activeDuel.hostRatingChange >= 0 ? '#50fa7b' : '#ff5555', display: 'flex', alignItems: 'center' }}>
                  ({activeDuel.hostRatingChange >= 0 ? '+' : ''}{activeDuel.hostRatingChange})
                </span>
              )}
            </div>
            
            <div style={{ fontSize: hostSurrendered ? '1rem' : '2.5rem', fontWeight: 900, color: hostSurrendered ? '#ff5555' : (hostWin ? '#50fa7b' : '#fff'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textShadow: hostWin ? '0 0 20px rgba(80,250,123,0.3)' : 'none' }}>
               {hostSurrendered ? <><Skull size={18} /> SURRENDERED</> : <>{hostScore} <span style={{ fontSize: '1rem', opacity: 0.7 }}>PTS</span></>}
            </div>
          </motion.div>

          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.5 }}>VS</div>

          {/* GUEST CARD */}
          <motion.div 
             initial={{ x: 30, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.3 }}
             style={{ flex: 1, minWidth: '220px', padding: '2rem 1.5rem', background: guestWin ? 'linear-gradient(145deg, rgba(80, 250, 123, 0.1), rgba(0,0,0,0.2))' : 'rgba(255,255,255,0.02)', border: `1px solid ${guestWin ? 'rgba(80, 250, 123, 0.5)' : 'var(--line)'}`, borderRadius: '1rem', textAlign: 'center', position: 'relative', boxShadow: guestWin ? '0 10px 40px rgba(80, 250, 123, 0.1)' : 'none', filter: hostWin ? 'grayscale(0.5) opacity(0.8)' : 'none' }}
          >
            {guestWin && <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#50fa7b', color: '#000', padding: '0.3rem 1rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 800, display: 'flex', gap: '0.3rem', alignItems: 'center', boxShadow: '0 0 15px rgba(80,250,123,0.5)' }}><Crown size={14} /> {t("winner")}</div>}
            {hostWin && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#ff5555', color: '#fff', padding: '0.2rem 0.8rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 800 }}>DEFEATED</div>}
            
            <div 
              style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s ease' }}
              onClick={() => { if (activeDuel.guestId) onOpenUserProfile?.(activeDuel.guestId); }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <DefaultAvatar 
                name={activeDuel.guest?.username || activeDuel.guest?.name || "Guest"} 
                size={80} 
                image={activeDuel.guest?.image}
                isRoyal={!!activeDuel.guest?.isRoyal}
                style={{ border: guestWin ? '3px solid #50fa7b' : '2px solid var(--line)', padding: '3px', background: 'var(--bg)' }} 
              />
            </div>
            
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>{activeDuel.guest?.username || activeDuel.guest?.name || "Guest"}</div>
            
            <div style={{ fontSize: '0.9rem', color: '#f1fa8c', marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
              Rating: {activeDuel.guest?.rating ?? 1000}
              {activeDuel.guestRatingChange !== null && activeDuel.guestRatingChange !== undefined && (
                <span style={{ color: activeDuel.guestRatingChange >= 0 ? '#50fa7b' : '#ff5555', display: 'flex', alignItems: 'center' }}>
                  ({activeDuel.guestRatingChange >= 0 ? '+' : ''}{activeDuel.guestRatingChange})
                </span>
              )}
            </div>
            
            <div style={{ fontSize: guestSurrendered ? '1rem' : '2.5rem', fontWeight: 900, color: guestSurrendered ? '#ff5555' : (guestWin ? '#50fa7b' : '#fff'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textShadow: guestWin ? '0 0 20px rgba(80,250,123,0.3)' : 'none' }}>
               {guestSurrendered ? <><Skull size={18} /> SURRENDERED</> : <>{guestScore} <span style={{ fontSize: '1rem', opacity: 0.7 }}>PTS</span></>}
            </div>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ width: '100%', maxWidth: '700px', marginBottom: '4rem', marginTop: '4rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 800 }}>MATCH STATISTICS</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {renderMatchStats()}
          </div>
        </motion.div>

        {draw && !hostSurrendered && !guestSurrendered && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }} style={{ background: 'rgba(139, 233, 253, 0.1)', padding: '0.75rem 2rem', borderRadius: '2rem', border: '1px solid rgba(139, 233, 253, 0.3)', color: '#8be9fd', fontWeight: 800, marginBottom: '2.5rem', letterSpacing: '1px' }}>
            {t("fairDraw").toUpperCase()}
          </motion.div>
        )}

        <motion.button 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setActiveDuel?.(null); setDuelPin?.(""); handleQuitBattle(); }} 
          className="btn" 
          style={{ width: '100%', maxWidth: '300px', background: 'var(--accent)', color: '#000', border: 'none', padding: '1.2rem', borderRadius: '0.5rem', fontWeight: 800, fontSize: '1.1rem', boxShadow: '0 5px 20px rgba(189,147,249,0.3)' }}
        >
          {t("backToArena")}
        </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isScrolledToTop && (
          <motion.div 
            initial={{ opacity: 0, y: 10, x: '-50%' }} 
            animate={{ opacity: 1, y: 0, x: '-50%' }} 
            exit={{ opacity: 0, y: 10, x: '-50%' }} 
            transition={{ delay: 0.5, duration: 0.15 }}
            style={{ position: 'absolute', bottom: '1rem', left: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)', opacity: 0.8, zIndex: 10, pointerEvents: 'none' }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '1px', textShadow: '0 2px 5px var(--bg)' }}>SCROLL FOR DETAILS</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ChevronDown size={24} style={{ filter: 'drop-shadow(0 2px 5px var(--bg))' }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    );
  }

  const opponentCode = isHost ? activeDuel?.guestCode : activeDuel?.hostCode;

  if (userFinalized && !isDuelFinished) {
    return (
      <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ background: 'rgba(122, 162, 247, 0.1)', color: 'var(--accent)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1rem' }}>
          <Activity size={48} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t("waitingForOpponent")}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', marginBottom: '1.5rem' }}>
          {t("waitingForOpponentMessage")}
        </p>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '1.5rem' }}>
           {timeLeft !== null && timeLeft !== undefined ? formatTime(timeLeft) : "--:--"}
        </div>
        
        {opponentCode ? (
          <div style={{ width: '100%', maxWidth: '600px', flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--line)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={14} /> {t("liveOpponentCode")}
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <Editor
                height="100%"
                language={lang.toLowerCase()}
                theme="dynamic-theme"
                value={opponentCode}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  fontSize: 12,
                  fontFamily: '"Fira Code", monospace',
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '600px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '0.5rem', color: 'var(--text-muted)' }}>
             <p>{t("noCodeSynced")}</p>
          </div>
        )}
      </div>
    );
  }


  if (showFinalizeConfirmation) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
        <Trophy size={48} color="var(--accent)" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>FINALIZE MATCH?</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', maxWidth: '400px', lineHeight: 1.5 }}>
          You have not perfectly solved all problems. Are you sure you wish to finalize the match, even if you didn&apos;t finish?
        </p>
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '300px' }}>
          <button 
            onClick={() => {
              setShowFinalizeConfirmation(false);
              handleFinalSubmit();
            }}
            className="btn"
            style={{ flex: 1, background: 'rgba(80, 250, 123, 0.1)', color: '#50fa7b', borderColor: '#50fa7b44', cursor: 'pointer' }}
          >
            {t("yesQuit") === "Da, părăsește" ? "Da, finalizează" : "Yes, Finalize"}
          </button>
          <button 
            onClick={() => setShowFinalizeConfirmation(false)}
            className="btn"
            style={{ flex: 1, background: 'var(--line)', border: 'none', cursor: 'pointer' }}
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    );
  }

  if (showQuitConfirmation) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
        <X size={48} color="#ff5555" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>SURRENDER?</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', maxWidth: '400px', lineHeight: 1.5 }}>
          Surrender? Keep in mind that your lack of ambition will cause your oponent to win!
        </p>
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '300px' }}>
          <button 
            onClick={handleQuitBattle}
            className="btn"
            style={{ flex: 1, background: 'rgba(255, 85, 85, 0.1)', color: '#ff5555', borderColor: '#ff555544', cursor: 'pointer' }}
          >
            {t("yesQuit")}
          </button>
          <button 
            onClick={() => setShowQuitConfirmation(false)}
            className="btn"
            style={{ flex: 1, background: 'var(--line)', border: 'none', cursor: 'pointer' }}
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    );
  }

  const currentTestCases = activeQuestion ? (typeof activeQuestion.testCases === 'string' ? JSON.parse(activeQuestion.testCases) : (activeQuestion.testCases || [])) : [];

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto', position: 'relative' }}>
      {timeLeft !== null && timeLeft !== undefined && activeDuel && (
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              {renderTimer()}
          </div>
      )}
      {!activeQuestion ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          <Sword size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p>{t("quitBattle") === "Părăsești lupta?" ? "Nicio luptă activă. Selectează o provocare în Arena de Luptă." : "No active battle. Select a challenge in the Battle Arena."}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '0.5rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}>
            {renderOpponentProgress()}
            {activeDuel?.questions && activeDuel.questions.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', marginRight: '0.25rem', letterSpacing: '0.05em' }}>
                  PROBLEMS:
                </span>
                {activeDuel.questions.map((q: any, idx: number) => {
                  const isSelected = activeQuestion?.id === q.id;
                  const isSolved = (() => {
                    const res = problemTestResults[q.id];
                    return res && res.passed === res.total && res.total > 0;
                  })();
                  const score = problemScores[q.id] || 0;

                  return (
                    <button
                      key={q.id}
                      onClick={() => changeActiveQuestion?.(idx)}
                      style={{
                        minWidth: '32px',
                        height: '32px',
                        padding: '0 0.75rem',
                        borderRadius: '0.4rem',
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--line)',
                        background: isSelected ? 'rgba(122, 162, 247, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isSolved ? "✓ " : ""}{idx + 1}{score > 0 ? ` (${score} pts)` : ""}
                    </button>
                  );
                })}
              </div>
            )}
            
            {allPassed && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1.25rem',
                background: 'rgba(80, 250, 123, 0.08)',
                border: '1px solid rgba(80, 250, 123, 0.25)',
                borderRadius: '0.5rem',
                marginTop: '0.25rem',
                marginBottom: '0.5rem',
                boxShadow: '0 4px 15px rgba(80, 250, 123, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Trophy size={16} color="#50fa7b" />
                  <span style={{ fontWeight: 800, color: '#50fa7b', fontSize: '0.85rem' }}>
                    PROBLEM DONE! All test cases passed.
                  </span>
                </div>
              </div>
            )}

            <h2 style={{ 
              fontSize: '1.8rem', 
              fontWeight: 900, 
              margin: 0, 
              background: 'linear-gradient(135deg, var(--accent) 0%, #fff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(122, 162, 247, 0.2)'
            }}>
              {/* {activeQuestion.problemId && <span style={{ opacity: 0.5, marginRight: '0.5rem' }}>#{activeQuestion.problemId}</span>} */}
              {activeQuestion.title}
            </h2>
            
            {activeDuel?.gameMode === "HACKBOUNTY" && activeDuel.phase === "BREAKING" && (
              <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(255, 85, 85, 0.1)', border: '1px solid rgba(255, 85, 85, 0.4)', borderRadius: '0.5rem', color: '#ff5555', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Zap size={20} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>PHASE 1: SABOTAGE!</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Break this perfectly working code before the timer ends. Do NOT fix it!</div>
                </div>
              </div>
            )}
            
            {activeDuel?.gameMode === "HACKBOUNTY" && activeDuel.phase === "FIXING" && (
              <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(80, 250, 123, 0.1)', border: '1px solid rgba(80, 250, 123, 0.4)', borderRadius: '0.5rem', color: '#50fa7b', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldCheck size={20} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>PHASE 2: FIX IT!</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Your opponent broke this code. Fix it and make it pass all tests! First to submit wins.</div>
                </div>
              </div>
            )}
          </div>
          
          {(() => {
            if (!activeQuestion.brokenCode || activeDuel?.gameMode !== "BUGHUNTER") return null;
            let snippet = "";
            try {
              const parsed = JSON.parse(activeQuestion.brokenCode);
              snippet = parsed[lang.toLowerCase()] || "";
            } catch (e) {}
            
            if (!snippet) return null;
            
            return (
              <div 
                style={{ 
                  padding: '1.25rem', 
                  background: 'rgba(122, 162, 247, 0.05)', 
                  border: '1px dashed rgba(122, 162, 247, 0.4)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  marginBottom: '1.5rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '0.25rem' }}>BUG HUNTER MODE</div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Load the broken code into your editor to start debugging.</div>
                </div>
                <button
                  onClick={() => setCode?.(snippet)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: 'var(--accent)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '0.4rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Use sample code
                </button>
              </div>
            );
          })()}

          <div style={{ 
            lineHeight: 1.8, 
            color: 'rgba(255,255,255,0.85)', 
            fontSize: '1.05rem'
          }}>
            {renderFormattedText(activeQuestion.description)}
          </div>


          {activeQuestion.inputFormat && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                Input Format
              </div>
              <div style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                {renderFormattedText(activeQuestion.inputFormat)}
              </div>
            </div>
          )}

          {activeQuestion.outputFormat && (
            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                Output Format
              </div>
              <div style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                {renderFormattedText(activeQuestion.outputFormat)}
              </div>
            </div>
          )}
  

          {activeQuestion.restrictions && (
            <div 
              style={{ 
                padding: '1.25rem', 
                background: 'linear-gradient(to right, rgba(255,85,85,0.05), rgba(255,85,85,0.01))', 
                borderLeft: '4px solid #ff5555',
                borderRadius: '0 0.5rem 0.5rem 0',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.05, transform: 'translate(20%, -20%)' }}>
                <ShieldCheck size={100} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ff5555', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.1em' }}>
                <ShieldCheck size={16} /> RESTRICTIONS
              </div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                {renderFormattedText(activeQuestion.restrictions)}
              </div>
            </div>
          )}



          {(activeQuestion.timeLimit || activeQuestion.memoryLimit) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {activeQuestion.timeLimit && (
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(122, 162, 247, 0.08)', 
                  border: '1px solid rgba(122, 162, 247, 0.15)',
                  borderRadius: '0.5rem', 
                  padding: '0.75rem 1.25rem'
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time Limit</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>{(activeQuestion.timeLimit / 1000).toFixed(1)}s</span>
                </div>
              )}
              {activeQuestion.memoryLimit && (
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(122, 162, 247, 0.08)', 
                  border: '1px solid rgba(122, 162, 247, 0.15)',
                  borderRadius: '0.5rem', 
                  padding: '0.75rem 1.25rem'
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Memory Limit</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>{activeQuestion.memoryLimit} MB</span>
                </div>
              )}
            </div>
          )}

          <div className="settings-group" style={{ marginTop: '1rem' }}>
            <span className="settings-label" style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '1.5rem', display: 'inline-block' }}>{t("examples")}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {(currentTestCases || []).map((tc: any, i: number) => (
                <div 
                  key={i} 
                  style={{ 
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', 
                    border: '1px solid rgba(255,255,255,0.05)', 
                    borderRadius: '0.75rem', 
                    padding: '1.5rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent)', opacity: 0.5 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {t("examples").slice(0, -1)} {i + 1}
                    </span>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        onClick={() => { setStdin(tc.input); setShowTerminal(true); }}
                        style={{ 
                          fontSize: '0.75rem', padding: '0.4rem 0.75rem', cursor: 'pointer',
                          background: 'rgba(255,255,255,0.05)', color: 'var(--text)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.4rem',
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      >
                        {t("addToStdin")}
                      </button>
                      <button 
                        onClick={() => { setStdin(tc.input); runSingleTest(tc.input, i); }}
                        style={{ 
                          fontSize: '0.75rem', padding: '0.4rem 1rem', cursor: 'pointer',
                          background: 'var(--accent)', color: '#000',
                          border: 'none', borderRadius: '0.4rem', fontWeight: 700,
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <Play size={12} fill="currentColor" /> {t("runExample")}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Input</div>
                      <pre style={{ margin: 0, padding: 0, background: 'transparent', fontSize: '0.85rem', overflow: 'auto', color: 'var(--text)', fontFamily: '"Fira Code", monospace' }}>{tc.input}</pre>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Output</div>
                      <pre style={{ margin: 0, padding: 0, background: 'transparent', fontSize: '0.85rem', overflow: 'auto', color: '#50fa7b', fontFamily: '"Fira Code", monospace' }}>{tc.output}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          </div>
        </div>
      )}
    </div>
  );
});

ProblemWindow.displayName = "ProblemWindow";
