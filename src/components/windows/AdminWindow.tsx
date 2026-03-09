"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Database, Plus, RefreshCw, Trash2, AlertCircle, Sword } from "lucide-react";
import { TranslationKey } from "../../constants/translations";
import { Question } from "../../types";

interface AdminWindowProps {
  newQuestion: { title: string; description: string; restrictions: string; difficulty: string; testCases: any[]; hiddenTestCases: any[] };
  setNewQuestion: (val: any) => void;
  handleAddQuestion: () => void;
  t: (key: TranslationKey) => string;
  error: string | null;
  setError: (val: string | null) => void;
  questions: Question[];
  onDeleteQuestion: (id: string) => void;
}

export const AdminWindow: React.FC<AdminWindowProps> = React.memo(({
  newQuestion, setNewQuestion, handleAddQuestion, t, error, setError, questions, onDeleteQuestion
}) => {
  const [testCasesRaw, setTestCasesRaw] = useState(JSON.stringify(newQuestion.testCases, null, 2));
  const [hiddenTestCasesRaw, setHiddenTestCasesRaw] = useState(JSON.stringify(newQuestion.hiddenTestCases, null, 2));

  useEffect(() => {
    try {
      const parsed = JSON.parse(testCasesRaw);
      if (Array.isArray(parsed)) {
        setNewQuestion((prev: any) => ({ ...prev, testCases: parsed }));
      }
    } catch (e) {}
  }, [testCasesRaw, setNewQuestion]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(hiddenTestCasesRaw);
      if (Array.isArray(parsed)) {
        setNewQuestion((prev: any) => ({ ...prev, hiddenTestCases: parsed }));
      }
    } catch (e) {}
  }, [hiddenTestCasesRaw, setNewQuestion]);

  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>, setter: (val: string) => void) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      setter(newValue);
      setTimeout(() => { target.selectionStart = target.selectionEnd = start + 2; }, 0);
    }
  };

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t("admin")}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Privileged tools for arena management and development.</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(255, 85, 85, 0.1)', border: '1px solid #ff555544', color: '#ff5555', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Question Creator */}
          <div className="settings-group">
            <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={14} /> Create New Problem
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>TITLE</label>
                <input 
                  type="text" 
                  value={newQuestion.title} 
                  onChange={(e) => { setError(null); setNewQuestion((prev: any) => ({ ...prev, title: e.target.value })); }}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.75rem', borderRadius: '0.4rem', color: 'inherit', outline: 'none' }}
                  placeholder="e.g., Reverse a Linked List"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>DESCRIPTION (MARKDOWN)</label>
                <textarea 
                  value={newQuestion.description} 
                  onChange={(e) => { setError(null); setNewQuestion((prev: any) => ({ ...prev, description: e.target.value })); }}
                  onKeyDown={(e) => handleTabKey(e, (val) => setNewQuestion((prev: any) => ({ ...prev, description: val })))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.75rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '120px', resize: 'vertical', outline: 'none', lineHeight: 1.5 }}
                  placeholder="Describe the challenge rules and constraints..."
                />
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Use <b>**bold**</b> for bold and <b>==highlight==</b> for highlights.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>RESTRICTIONS</label>
                <textarea 
                  value={newQuestion.restrictions} 
                  onChange={(e) => { setError(null); setNewQuestion((prev: any) => ({ ...prev, restrictions: e.target.value })); }}
                  onKeyDown={(e) => handleTabKey(e, (val) => setNewQuestion((prev: any) => ({ ...prev, restrictions: val })))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.75rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '80px', resize: 'vertical', outline: 'none', lineHeight: 1.5 }}
                  placeholder="e.g., Time complexity O(N), Space complexity O(1)"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>DIFFICULTY</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { label: "Target Practice", value: "Easy" },
                    { label: "Trial Duel", value: "Medium" },
                    { label: "Royal Challenge", value: "Hard" }
                  ].map((d) => (
                    <button 
                      key={d.value}
                      onClick={() => setNewQuestion({ ...newQuestion, difficulty: d.value })}
                      className="btn"
                      style={{ flex: 1, borderColor: newQuestion.difficulty === d.value ? 'var(--accent)' : 'var(--line)', color: newQuestion.difficulty === d.value ? 'var(--accent)' : 'inherit', height: '44px', fontWeight: newQuestion.difficulty === d.value ? 700 : 400, cursor: 'pointer' }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>PUBLIC EXAMPLES (JSON)</label>
                <textarea 
                  value={testCasesRaw} 
                  onChange={(e) => { setError(null); setTestCasesRaw(e.target.value); }}
                  onKeyDown={(e) => handleTabKey(e, setTestCasesRaw)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.75rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '100px', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none', resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>HIDDEN TESTS (JSON)</label>
                <textarea 
                  value={hiddenTestCasesRaw} 
                  onChange={(e) => { setError(null); setHiddenTestCasesRaw(e.target.value); }}
                  onKeyDown={(e) => handleTabKey(e, setHiddenTestCasesRaw)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.75rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '100px', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none', resize: 'none' }}
                />
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Format: {'[{"input": "10\\n20", "output": "30"}]'}</p>
              </div>

              <button 
                onClick={handleAddQuestion}
                className="btn" 
                style={{ background: 'var(--accent)', color: '#000', fontWeight: 700, border: 'none', padding: '1rem', marginTop: '1rem', borderRadius: '0.4rem', cursor: 'pointer' }}
              >
                PUBLISH TO ARENA
              </button>
            </div>
          </div>

          {/* Question List / Management */}
          <div className="settings-group">
            <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sword size={14} /> Manage Arena Challenges
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {questions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No questions found in the database.</p>
              ) : (
                questions.map((q) => (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.4rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q.title}</div>
                      <div style={{ fontSize: '0.7rem', color: q.difficulty === 'Easy' ? '#50fa7b' : q.difficulty === 'Medium' ? '#ffb86c' : '#ff5555' }}>
                        {q.difficulty === 'Easy' ? 'Target Practice' : q.difficulty === 'Medium' ? 'Trial Duel' : 'Royal Challenge'}
                      </div>
                    </div>
                    <button 
                      onClick={() => onDeleteQuestion(q.id)}
                      className="twm-btn" 
                      style={{ color: '#ff5555', padding: '0.4rem' }}
                      title="Delete Question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="settings-group">
            <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={14} /> System Tools
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', textAlign: 'left', gap: '0.75rem', padding: '0.75rem' }}>
                <RefreshCw size={16} /> Sync Submissions
              </button>
              <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', textAlign: 'left', gap: '0.75rem', padding: '0.75rem' }}>
                <Terminal size={16} /> View Server Logs
              </button>
              <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', textAlign: 'left', gap: '0.75rem', padding: '0.75rem', color: '#ff5555' }}>
                <Trash2 size={16} /> Clear Temp Files
              </button>
            </div>
          </div>

          <div style={{ padding: '1.25rem', background: 'rgba(122, 162, 247, 0.05)', border: '1px solid var(--accent)', borderRadius: '0.5rem', opacity: 0.8 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Admin Notice</div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>Changes made here are permanent and affect all knights in the arena. Proceed with caution.</p>
          </div>
        </div>
      </div>
    </div>
  );
});

AdminWindow.displayName = "AdminWindow";
