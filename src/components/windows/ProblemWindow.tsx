"use client";

import React from "react";
import { Play, Sword, Trophy, X, Zap, Cpu, Activity, ShieldCheck, MessageSquareQuote } from "lucide-react";
import { Question } from "../../types";
import { LANG_CONFIG } from "../../constants/languages";
import { TranslationKey } from "../../constants/translations";
import { motion } from "framer-motion";

interface ProblemWindowProps {
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
  analysis: any | null;
  isAnalyzing: boolean;
  activeDuel?: any;
  timeLeft?: number | null;
  setActiveDuel?: (val: any) => void;
  setDuelPin?: (val: string) => void;
}

export const ProblemWindow: React.FC<ProblemWindowProps> = React.memo(({
  activeQuestion, testResults, showQuitConfirmation, setShowQuitConfirmation,
  handleQuitBattle, runTests, isTesting, setStdin, setShowTerminal,
  setTerminalOutput, solveTime, lang, startNewBattle, runSingleTest, t,
  analysis, isAnalyzing, activeDuel, timeLeft, setActiveDuel, setDuelPin
}) => {
  const allPassed = testResults?.passed === testResults?.total && testResults?.total > 0;
  const isDuelFinished = activeDuel?.status === "FINISHED";

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    
    // Split by both **bold** and ==highlight==
    const parts = text.split(/(\*\*.*?\*\*|==.*?==)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('==') && part.endsWith('==')) {
        return <mark key={i} style={{ background: 'var(--accent)', color: '#000', padding: '0 0.2rem', borderRadius: '0.1rem' }}>{part.slice(2, -2)}</mark>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (isDuelFinished) {
    const hostWin = activeDuel.hostSolveTime !== null && (activeDuel.guestSolveTime === null || activeDuel.hostSolveTime < activeDuel.guestSolveTime);
    const guestWin = activeDuel.guestSolveTime !== null && (activeDuel.hostSolveTime === null || activeDuel.guestSolveTime < activeDuel.hostSolveTime);
    const draw = activeDuel.hostSolveTime !== null && activeDuel.guestSolveTime !== null && activeDuel.hostSolveTime === activeDuel.guestSolveTime;

    return (
      <div style={{ padding: '2rem', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ background: 'var(--accent)', color: '#000', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 0 20px var(--accent)' }}>
          <Trophy size={48} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent)' }}>DUEL RESULT</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>{activeDuel.question.title}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '500px', marginBottom: '3rem' }}>
          <div style={{ padding: '1.5rem', background: hostWin ? 'rgba(80, 250, 123, 0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${hostWin ? '#50fa7b' : 'var(--line)'}`, borderRadius: '0.8rem', textAlign: 'center', position: 'relative' }}>
            {hostWin && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#50fa7b', color: '#000', padding: '0.1rem 0.6rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 800 }}>WINNER</div>}
            <div style={{ marginBottom: '1rem' }}>{activeDuel.host.image ? <img src={activeDuel.host.image} style={{ width: '48px', height: '48px', borderRadius: '50%', border: hostWin ? '2px solid #50fa7b' : '1px solid var(--line)' }} /> : <Zap size={32} style={{ opacity: 0.5 }} />}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>{activeDuel.host.username || activeDuel.host.name}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: hostWin ? '#50fa7b' : 'inherit' }}>{activeDuel.hostSolveTime ? formatTime(Math.floor(activeDuel.hostSolveTime/1000)) : "--:--"}</div>
          </div>
          <div style={{ padding: '1.5rem', background: guestWin ? 'rgba(80, 250, 123, 0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${guestWin ? '#50fa7b' : 'var(--line)'}`, borderRadius: '0.8rem', textAlign: 'center', position: 'relative' }}>
            {guestWin && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#50fa7b', color: '#000', padding: '0.1rem 0.6rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 800 }}>WINNER</div>}
            <div style={{ marginBottom: '1rem' }}>{activeDuel.guest?.image ? <img src={activeDuel.guest.image} style={{ width: '48px', height: '48px', borderRadius: '50%', border: guestWin ? '2px solid #50fa7b' : '1px solid var(--line)' }} /> : <Zap size={32} style={{ opacity: 0.5 }} />}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>{activeDuel.guest?.username || activeDuel.guest?.name || "Guest Knight"}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: guestWin ? '#50fa7b' : 'inherit' }}>{activeDuel.guestSolveTime ? formatTime(Math.floor(activeDuel.guestSolveTime/1000)) : "--:--"}</div>
          </div>
        </div>
        {draw && <p style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: '2rem' }}>⚔️ IT'S A FAIR DRAW! ⚔️</p>}
        <button onClick={() => { setActiveDuel?.(null); setDuelPin?.(""); handleQuitBattle(); }} className="btn" style={{ width: '100%', maxWidth: '300px', background: 'var(--line)', border: 'none', padding: '1rem' }}>BACK TO ARENA</button>
      </div>
    );
  }

  if (allPassed) {
    return (
      <div style={{ padding: '2rem', height: '100%', overflow: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ background: 'var(--accent)', color: '#000', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 0 30px var(--accent)' }}>
            <Trophy size={48} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent)' }}>{t("battleVictorious")}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{t("battleVictorious") === "LUPTĂ CÂȘTIGATĂ" ? "Ai rezolvat cu succes această provocare." : "You have successfully solved the challenge."}</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t("timeTaken")}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{solveTime || "--:--"}</div>
          </div>
          <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t("langUsed")}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{(LANG_CONFIG as any)[lang]?.label || lang}</div>
          </div>
          <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Time Complexity</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{isAnalyzing ? "..." : (analysis?.timeComplexity || "N/A")}</div>
          </div>
          <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Space Complexity</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{isAnalyzing ? "..." : (analysis?.spaceComplexity || "N/A")}</div>
          </div>
        </div>

        {/* AI Analysis Graph Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Zap size={18} color="var(--accent)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Complexity & Quality Analysis</span>
          </div>

          {isAnalyzing ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--line)', borderRadius: '0.5rem' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Gemini is analyzing your source code...</p>
            </div>
          ) : analysis ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {/* Bars Graph */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  { label: "Efficiency", value: analysis.scores?.efficiency, icon: <Cpu size={14} /> },
                  { label: "Readability", value: analysis.scores?.readability, icon: <MessageSquareQuote size={14} /> },
                  { label: "Maintainability", value: analysis.scores?.maintainability, icon: <Activity size={14} /> },
                  { label: "Security", value: analysis.scores?.security, icon: <ShieldCheck size={14} /> },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {stat.icon}
                        <span style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
                      </div>
                      <span style={{ fontWeight: 700 }}>{stat.value}/100</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.value}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{ height: '100%', background: 'var(--accent)', borderRadius: '3px' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback */}
              <div style={{ padding: '1.5rem', background: 'rgba(122, 162, 247, 0.05)', border: '1px solid var(--accent)', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquareQuote size={16} /> Knight's Feedback
                </div>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{analysis.feedback}"
                </p>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Analysis data unavailable.</p>
          )}
        </div>

        <button 
          onClick={startNewBattle}
          style={{ width: '100%', background: 'var(--accent)', color: '#000', border: 'none', padding: '1.25rem', borderRadius: '0.5rem', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', marginBottom: '2rem' }}
        >
          {t("startNewBattle")}
        </button>
      </div>
    );
  }

  if (showQuitConfirmation) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
        <X size={48} color="#ff5555" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{t("quitBattle")}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          {t("quitWarning")}
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
    <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
      {!activeQuestion ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          <Sword size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p>{t("quitBattle") === "Părăsești lupta?" ? "Nicio luptă activă. Selectează o provocare în Arena de Luptă." : "No active battle. Select a challenge in the Battle Arena."}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{activeQuestion.title}</h2>
            </div>
            {timeLeft !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: timeLeft < 30 ? '#ff5555' : 'var(--accent)', fontWeight: 800, fontSize: '1.2rem', fontFamily: 'monospace' }}>
                <Zap size={18} fill="currentColor" /> {formatTime(timeLeft)}
              </div>
            )}
          </div>
          <div style={{ lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
            {renderFormattedText(activeQuestion.description)}
          </div>

          {activeQuestion.restrictions && (
            <div style={{ padding: '1rem', background: 'rgba(var(--accent-rgb, 122, 162, 247), 0.05)', border: '1px solid var(--line)', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={14} /> RESTRICTIONS
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.5 }}>
                {renderFormattedText(activeQuestion.restrictions)}
              </div>
            </div>
          )}

          <div className="settings-group">
            <span className="settings-label">{t("examples")}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentTestCases.map((tc: any, i: number) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.4rem', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t("examples").slice(0, -1)} {i + 1}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => { setStdin(tc.input); setShowTerminal(true); }}
                        className="btn btn-ghost" 
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
                      >
                        {t("addToStdin")}
                      </button>
                      <button 
                        onClick={() => runSingleTest(tc.input, i)}
                        className="btn" 
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--accent)', color: '#000', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {t("runExample")}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Input</div>
                      <pre style={{ margin: 0, padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.25rem', fontSize: '0.8rem', overflow: 'auto' }}>{tc.input}</pre>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Output</div>
                      <pre style={{ margin: 0, padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.25rem', fontSize: '0.8rem', overflow: 'auto' }}>{tc.output}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--line)' }}>
            <button 
              onClick={runTests}
              disabled={isTesting}
              style={{ 
                width: '100%', 
                background: 'var(--accent)', 
                color: '#000', 
                border: 'none', 
                padding: '1rem', 
                borderRadius: '0.5rem', 
                fontWeight: 700, 
                cursor: isTesting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: isTesting ? 0.7 : 1
              }}
            >
              {isTesting ? <><div className="loading-spinner" style={{ width: '16px', height: '16px', borderTopColor: '#000' }} /> {t("testing")}</> : <><Play size={18} fill="currentColor" /> {t("runAllTests")}</>}
            </button>
            
            {testResults && (
              <div style={{ marginTop: '1rem', textAlign: 'center', padding: '0.75rem', borderRadius: '0.4rem', background: testResults.passed === testResults.total ? 'rgba(80, 250, 123, 0.1)' : 'rgba(255, 85, 85, 0.1)', color: testResults.passed === testResults.total ? '#50fa7b' : '#ff5555', fontSize: '0.9rem', fontWeight: 600 }}>
                {testResults.passed === testResults.total 
                  ? (t("battleVictorious") === "LUPTĂ CÂȘTIGATĂ" ? "Toate testele au trecut! Ești un adevărat Cavaler! ⚔️" : "All tests passed! You are a true Knight! ⚔️") 
                  : (t("battleVictorious") === "LUPTĂ CÂȘTIGATĂ" ? `${testResults.passed}/${testResults.total} teste trecute. Continuă să lupți!` : `${testResults.passed}/${testResults.total} tests passed. Keep fighting!`)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ProblemWindow.displayName = "ProblemWindow";
