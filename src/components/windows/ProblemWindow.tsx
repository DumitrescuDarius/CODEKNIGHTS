"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Play, Sword, Trophy, X, Zap, Cpu, Activity, ShieldCheck, MessageSquareQuote, Eye } from "lucide-react";
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
}

export const ProblemWindow: React.FC<ProblemWindowProps> = React.memo(({
  userId, activeQuestion, testResults, totalPenalty, wrongAttemptCount, calculatePenalty, retryProblem, showQuitConfirmation, setShowQuitConfirmation,
  handleQuitBattle, runTests, isTesting, setStdin, setShowTerminal,
  setTerminalOutput, solveTime, lang, startNewBattle, runSingleTest, t,
  analysis, isAnalyzing, onAnalyzeComplexity, activeDuel, timeLeft, setActiveDuel, setDuelPin,
  onOpenUserProfile, activeQuestionIndex, changeActiveQuestion, problemTestResults = {}, problemScores = {}
}) => {
  const allPassed = testResults?.passed === testResults?.total && testResults?.total > 0;
  const isDuelFinished = activeDuel?.status === "FINISHED" || (activeDuel != null && timeLeft === 0);
  const isHost = activeDuel?.hostId === userId;
  const isGuest = activeDuel?.guestId === userId;
  const userFinalized = isHost ? activeDuel?.hostFinalized : (isGuest ? activeDuel?.guestFinalized : false);
  const otherFinalized = isHost ? activeDuel?.guestFinalized : (isGuest ? activeDuel?.hostFinalized : false);

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
    const opponentAvatar = opponent?.image || `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(opponentName)}&rowColor=random`;

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
      </div>
    );
  };

  const [liveTime, setLiveTime] = useState(0);
  const [isPenaltyOpen, setIsPenaltyOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setLiveTime(prev => prev + 1), 1000);
    
    const handleAiRequest = (e: any) => {
      if (e.detail === "problem" && activeQuestion) {
        window.dispatchEvent(new CustomEvent('add_ai_context', {
          detail: {
            id: `problem-${activeQuestion.id}`,
            title: `Problem: ${activeQuestion.title}`,
            content: `Problem Title: ${activeQuestion.title}\n\nDescription:\n${activeQuestion.description}\n\nRestrictions:\n${activeQuestion.restrictions || 'None'}`
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

  useEffect(() => {
    if (timeLeft === 0 && !submitted && activeDuel?.status === "ACTIVE") {
      handleFinalSubmit();
    }
  }, [timeLeft, submitted, activeDuel]);
  
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
    return (
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
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
          li({children, ...props}: any) {
            return <li style={{ marginBottom: '0.5rem', lineHeight: 1.6 }} {...props}>{children}</li>;
          }
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  const handleFinalSubmit = async () => {
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
            totalPenalty: totalPenalty
        })
      });
      window.dispatchEvent(new CustomEvent("duel_update_required", { detail: activeDuel.id }));
      setSubmitted(true);
    } catch (err) {
      console.error("Final submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDuelFinished) {
    const hostSurrendered = (activeDuel.hostPenalty ?? 999999999) === 999999999;
    const guestSurrendered = (activeDuel.guestPenalty ?? 999999999) === 999999999;

    const hostPenalty = activeDuel.hostPenalty ?? 999999999;
    const guestPenalty = activeDuel.guestPenalty ?? 999999999;

    const hostWin = !hostSurrendered && (guestSurrendered || (activeDuel.hostSolveTime !== null && (activeDuel.guestSolveTime === null || hostPenalty < guestPenalty || (hostPenalty === guestPenalty && activeDuel.hostSolveTime < activeDuel.guestSolveTime))));
    const guestWin = !guestSurrendered && (hostSurrendered || (activeDuel.guestSolveTime !== null && (activeDuel.hostSolveTime === null || guestPenalty < hostPenalty || (hostPenalty === guestPenalty && activeDuel.guestSolveTime < activeDuel.hostSolveTime))));
    const draw = !hostWin && !guestWin;

    return (
      <div style={{ padding: '2rem', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ background: 'var(--accent)', color: '#000', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 0 20px var(--accent)' }}>
          <Trophy size={48} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent)' }}>{t("duelResult")}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>{activeDuel.question.title}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '500px', marginBottom: '3rem' }}>
          <div style={{ padding: '1.5rem', background: hostWin ? 'rgba(80, 250, 123, 0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${hostWin ? '#50fa7b' : 'var(--line)'}`, borderRadius: '0.8rem', textAlign: 'center', position: 'relative' }}>
            {hostWin && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#50fa7b', color: '#000', padding: '0.1rem 0.6rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 800 }}>{t("winner")}</div>}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <DefaultAvatar 
                name={activeDuel.host?.username || activeDuel.host?.name || "Host"} 
                size={48} 
                image={activeDuel.host?.image}
                isRoyal={!!activeDuel.host?.isRoyal}
                style={{ border: hostWin ? '1px solid #50fa7b' : '1px solid var(--line)' }} 
              />
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>{activeDuel.host?.username || activeDuel.host?.name || "Host"}</div>
            <div style={{ fontSize: '0.75rem', color: '#f1fa8c', marginBottom: '0.5rem', fontWeight: 600 }}>
              Rating: {activeDuel.host?.rating ?? 1000}
              {activeDuel.hostRatingChange !== null && activeDuel.hostRatingChange !== undefined && (
                <span style={{ marginLeft: '0.5rem', color: activeDuel.hostRatingChange >= 0 ? '#50fa7b' : '#ff5555' }}>
                  ({activeDuel.hostRatingChange >= 0 ? '+' : ''}{activeDuel.hostRatingChange})
                </span>
              )}
            </div>
            <div style={{ fontSize: hostSurrendered ? '0.8rem' : '1.5rem', fontWeight: 800, color: hostSurrendered ? '#ff5555' : (hostWin ? '#50fa7b' : 'inherit') }}>{activeDuel.hostSolveTime ? formatTime(Math.floor(activeDuel.hostSolveTime/1000)) : "--:--"}</div>
          </div>
          <div style={{ padding: '1.5rem', background: guestWin ? 'rgba(80, 250, 123, 0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${guestWin ? '#50fa7b' : 'var(--line)'}`, borderRadius: '0.8rem', textAlign: 'center', position: 'relative' }}>
            {guestWin && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#50fa7b', color: '#000', padding: '0.1rem 0.6rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 800 }}>{t("winner")}</div>}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <DefaultAvatar 
                name={activeDuel.guest?.username || activeDuel.guest?.name || "Guest"} 
                size={48} 
                image={activeDuel.guest?.image}
                isRoyal={!!activeDuel.guest?.isRoyal}
                style={{ border: guestWin ? '1px solid #50fa7b' : '1px solid var(--line)' }} 
              />
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>{activeDuel.guest?.username || activeDuel.guest?.name || "Guest"}</div>
            <div style={{ fontSize: '0.75rem', color: '#f1fa8c', marginBottom: '0.5rem', fontWeight: 600 }}>
              Rating: {activeDuel.guest?.rating ?? 1000}
              {activeDuel.guestRatingChange !== null && activeDuel.guestRatingChange !== undefined && (
                <span style={{ marginLeft: '0.5rem', color: activeDuel.guestRatingChange >= 0 ? '#50fa7b' : '#ff5555' }}>
                  ({activeDuel.guestRatingChange >= 0 ? '+' : ''}{activeDuel.guestRatingChange})
                </span>
              )}
            </div>
            <div style={{ fontSize: guestSurrendered ? '0.8rem' : '1.5rem', fontWeight: 800, color: guestSurrendered ? '#ff5555' : (guestWin ? '#50fa7b' : 'inherit') }}>{activeDuel.guestSolveTime ? formatTime(Math.floor(activeDuel.guestSolveTime/1000)) : "--:--"}</div>
          </div>
        </div>
        {draw && !hostSurrendered && !guestSurrendered && <p style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: '2rem' }}>{t("fairDraw")}</p>}
        <button onClick={() => { setActiveDuel?.(null); setDuelPin?.(""); handleQuitBattle(); }} className="btn" style={{ width: '100%', maxWidth: '300px', background: 'var(--line)', border: 'none', padding: '1rem' }}>{t("backToArena")}</button>
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
            <pre style={{ margin: 0, padding: '1rem', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text)', overflow: 'auto', textAlign: 'left', flex: 1 }}>
              {opponentCode}
            </pre>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '600px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '0.5rem', color: 'var(--text-muted)' }}>
             <p>{t("noCodeSynced")}</p>
          </div>
        )}
      </div>
    );
  }

  const allProblemsSolved = activeDuel?.questions && activeDuel.questions.length > 0
    ? activeDuel.questions.every((q: any) => {
        const res = problemTestResults[q.id];
        return res && res.passed === res.total && res.total > 0;
      })
    : allPassed;

  if (allProblemsSolved) {
    const totalScoreVal = Object.values(problemScores).reduce((sum, val) => sum + val, 0);

    return (
      <div style={{ padding: '2rem', height: '100%', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--line)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
              {activeQuestion?.problemId && <span style={{ opacity: 0.5, marginRight: '0.5rem' }}>#{activeQuestion.problemId}</span>}
              {activeQuestion?.title}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {activeDuel?.status === "ACTIVE" ? (
                <button 
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting || submitted}
                  style={{ 
                    background: submitted ? 'var(--line)' : '#50fa7b', 
                    color: submitted ? 'var(--text)' : '#000', 
                    border: 'none', 
                    padding: '0.5rem 1.5rem', 
                    borderRadius: '0.4rem', 
                    fontWeight: 800, 
                    cursor: (isSubmitting || submitted) ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSubmitting ? t("submitting") || "SUBMITTING..." : (submitted ? t("submitted") : t("finalSubmit") || "FINAL SUBMIT")}
                </button>
              ) : (
                <button 
                  disabled={true}
                  style={{ 
                    background: 'var(--accent)', 
                    color: '#000', 
                    border: 'none', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '0.4rem', 
                    fontWeight: 700, 
                    cursor: 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: 0.7
                  }}
                >
                  {t("submitted") || "Submitted"}
                </button>
              )}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ background: 'var(--accent)', color: '#000', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 0 30px var(--accent)' }}>
            <Trophy size={48} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent)' }}>{t("battleVictorious")}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{t("battleVictorious") === "LUPTĂ CÂȘTIGATĂ" ? "Ai rezolvat cu succes toate provocările din arenă." : "You have successfully solved all challenges in the arena."}</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Match Score</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)' }}>
                {totalScoreVal} pts
              </div>
            </div>

            {activeDuel?.questions && activeDuel.questions.map((q: any, idx: number) => {
              const pScore = problemScores[q.id] || 0;
              const pRes = problemTestResults[q.id];
              return (
                <div key={q.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Problem {idx + 1} Score</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{pScore} pts</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Passed: {pRes?.passed ?? 0}/{pRes?.total ?? 0} tests
                  </div>
                </div>
              );
            })}
        </div>

        <button 
          onClick={retryProblem}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--line)', padding: '1rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginBottom: '1rem' }}
        >
          {t("retry")}
        </button>
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

  const currentTestCases = activeQuestion ? (typeof activeQuestion.testCases === 'string' ? JSON.parse(activeQuestion.testCases) : activeQuestion.testCases) : [];

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
                <button
                  onClick={retryProblem}
                  style={{
                    background: 'rgba(80, 250, 123, 0.15)',
                    color: '#50fa7b',
                    border: '1px solid rgba(80, 250, 123, 0.3)',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '0.4rem',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#50fa7b'; e.currentTarget.style.color = '#000'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(80, 250, 123, 0.15)'; e.currentTarget.style.color = '#50fa7b'; }}
                >
                  RETRY
                </button>
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
              {activeQuestion.problemId && <span style={{ opacity: 0.5, marginRight: '0.5rem' }}>#{activeQuestion.problemId}</span>}
              {activeQuestion.title}
            </h2>
          </div>
          
          <div style={{ 
            lineHeight: 1.8, 
            color: 'rgba(255,255,255,0.85)', 
            whiteSpace: 'pre-wrap',
            fontSize: '1.05rem'
          }}>
            {renderFormattedText(activeQuestion.description)}
          </div>

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

          <div className="settings-group" style={{ marginTop: '1rem' }}>
            <span className="settings-label" style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '1.5rem', display: 'inline-block' }}>{t("examples")}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {currentTestCases.map((tc: any, i: number) => (
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
                        onClick={() => runSingleTest(tc.input, i)}
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
