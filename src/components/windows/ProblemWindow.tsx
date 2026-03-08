"use client";

import React from "react";
import { Play, Sword, Trophy, X } from "lucide-react";
import { Question } from "../../types";
import { LANG_CONFIG } from "../../constants/languages";

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
}

export const ProblemWindow: React.FC<ProblemWindowProps> = React.memo(({
  activeQuestion, testResults, showQuitConfirmation, setShowQuitConfirmation,
  handleQuitBattle, runTests, isTesting, setStdin, setShowTerminal,
  setTerminalOutput, solveTime, lang, startNewBattle, runSingleTest
}) => {
  const allPassed = testResults?.passed === testResults?.total && testResults?.total > 0;

  if (allPassed) {
    return (
      <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ background: 'var(--accent)', color: '#000', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 0 30px var(--accent)' }}>
          <Trophy size={48} />
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent)' }}>BATTLE VICTORIOUS</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You have successfully solved the challenge.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', maxWidth: '400px', marginBottom: '2rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Taken</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{solveTime || "--:--"}</div>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Language</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{(LANG_CONFIG as any)[lang]?.label || lang}</div>
          </div>
        </div>

        <button 
          onClick={startNewBattle}
          style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '1rem 2rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
        >
          START NEW BATTLE
        </button>
      </div>
    );
  }

  if (showQuitConfirmation) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
        <X size={48} color="#ff5555" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Quit Battle?</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Your progress on this challenge will be lost. Are you sure you want to exit?
        </p>
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '300px' }}>
          <button 
            onClick={handleQuitBattle}
            className="btn"
            style={{ flex: 1, background: 'rgba(255, 85, 85, 0.1)', color: '#ff5555', borderColor: '#ff555544', cursor: 'pointer' }}
          >
            YES, QUIT
          </button>
          <button 
            onClick={() => setShowQuitConfirmation(false)}
            className="btn"
            style={{ flex: 1, background: 'var(--line)', border: 'none', cursor: 'pointer' }}
          >
            CANCEL
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
          <p>No active battle. Select a challenge in the Battle Arena.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>{activeQuestion.title}</h2>
            </div>
            <div style={{ lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
              {activeQuestion.description}
            </div>
          </div>

          <div className="settings-group">
            <span className="settings-label">Examples</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentTestCases.map((tc: any, i: number) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.4rem', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Example {i + 1}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => { setStdin(tc.input); setShowTerminal(true); }}
                        className="btn btn-ghost" 
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
                      >
                        Add to Stdin
                      </button>
                      <button 
                        onClick={() => runSingleTest(tc.input, i)}
                        className="btn" 
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--accent)', color: '#000', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Run Example
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
              {isTesting ? <><div className="loading-spinner" style={{ width: '16px', height: '16px', borderTopColor: '#000' }} /> TESTING...</> : <><Play size={18} fill="currentColor" /> RUN ALL TESTS</>}
            </button>
            
            {testResults && (
              <div style={{ marginTop: '1rem', textAlign: 'center', padding: '0.75rem', borderRadius: '0.4rem', background: testResults.passed === testResults.total ? 'rgba(80, 250, 123, 0.1)' : 'rgba(255, 85, 85, 0.1)', color: testResults.passed === testResults.total ? '#50fa7b' : '#ff5555', fontSize: '0.9rem', fontWeight: 600 }}>
                {testResults.passed === testResults.total ? "All tests passed! You are a true Knight! ⚔️" : `${testResults.passed}/${testResults.total} tests passed. Keep fighting!`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ProblemWindow.displayName = "ProblemWindow";
