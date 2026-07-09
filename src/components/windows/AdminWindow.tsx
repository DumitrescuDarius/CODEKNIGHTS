"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, AlertCircle, Sword, Edit2, X, Users } from "lucide-react";
import { TranslationKey } from "../../constants/translations";
import { Question } from "../../types";

interface AdminWindowProps {
  newQuestion: { id?: string; title: string; description: string; restrictions: string; difficulty: string; testCases: any[]; hiddenTestCases: any[] };
  setNewQuestion: (val: any) => void;
  handleAddQuestion: () => void;
  handleUpdateQuestion: () => void;
  t: (key: TranslationKey) => string;
  error: string | null;
  setError: (val: string | null) => void;
  questions: Question[];
  onDeleteQuestion: (id: string) => void;
}

export const AdminWindow: React.FC<AdminWindowProps> = React.memo(({
  newQuestion, setNewQuestion, handleAddQuestion, handleUpdateQuestion, t, error, setError, questions, onDeleteQuestion
}) => {
  const [testCasesRaw, setTestCasesRaw] = useState(JSON.stringify(newQuestion.testCases, null, 2));
  const [hiddenTestCasesRaw, setHiddenTestCasesRaw] = useState(JSON.stringify(newQuestion.hiddenTestCases, null, 2));

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingUsers(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete user");
    }
  };


  // ONLY sync raw strings when we start editing a new ID
  useEffect(() => {
    if (newQuestion.id) {
      setTestCasesRaw(JSON.stringify(newQuestion.testCases, null, 2));
      setHiddenTestCasesRaw(JSON.stringify(newQuestion.hiddenTestCases, null, 2));
    }
  }, [newQuestion.id]);

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

  const startEditing = (q: Question) => {
    setError(null);
    const tc = typeof q.testCases === 'string' ? JSON.parse(q.testCases) : q.testCases;
    const htc = q.hiddenTestCases ? (typeof q.hiddenTestCases === 'string' ? JSON.parse(q.hiddenTestCases) : q.hiddenTestCases) : [];
    
    setNewQuestion({
      id: q.id,
      title: q.title,
      description: q.description,
      restrictions: q.restrictions || "",
      difficulty: q.difficulty,
      testCases: tc,
      hiddenTestCases: htc
    });
    setTestCasesRaw(JSON.stringify(tc, null, 2));
    setHiddenTestCasesRaw(JSON.stringify(htc, null, 2));
  };

  const cancelEditing = () => {
    setNewQuestion({
      title: "",
      description: "",
      restrictions: "",
      difficulty: "Easy",
      testCases: [{ input: "", output: "" }],
      hiddenTestCases: []
    });
    setTestCasesRaw(JSON.stringify([{ input: "", output: "" }], null, 2));
    setHiddenTestCasesRaw(JSON.stringify([], null, 2));
  };

  return (
    <div style={{ padding: '2rem 1.5rem', height: '100%', overflow: 'auto' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent)' }}>{t("admin")}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t("adminDesc")}</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 85, 85, 0.1)', border: '1px solid #ff555544', color: '#ff5555', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* Question Creator / Editor */}
          <div className="settings-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem' }}>
              <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '0.8rem', color: 'var(--accent)' }}>
                {newQuestion.id ? <Edit2 size={14} /> : <Plus size={14} />} {newQuestion.id ? t("editChallenge") : t("createChallenge")}
              </span>
              {newQuestion.id && (
                <button onClick={cancelEditing} className="twm-btn" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.05)' }}>
                  <X size={12} /> {t("cancelEdit")}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t("titleLabel")}</label>
                <input 
                  type="text" 
                  value={newQuestion.title} 
                  onChange={(e) => { setError(null); setNewQuestion((prev: any) => ({ ...prev, title: e.target.value })); }}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.8rem 1rem', borderRadius: '0.4rem', color: 'inherit', outline: 'none', fontSize: '0.95rem' }}
                  placeholder="e.g., Reverse a Linked List"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Description (Markdown)</label>
                <textarea 
                  value={newQuestion.description} 
                  onChange={(e) => { setError(null); setNewQuestion((prev: any) => ({ ...prev, description: e.target.value })); }}
                  onKeyDown={(e) => handleTabKey(e, (val) => setNewQuestion((prev: any) => ({ ...prev, description: val })))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '1rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '160px', resize: 'vertical', outline: 'none', lineHeight: 1.6, fontSize: '0.9rem' }}
                  placeholder="Describe the challenge rules and constraints..."
                />
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  <span dangerouslySetInnerHTML={{ __html: t("boldHighlightInstruction") }} />
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t("restrictions")}</label>
                <textarea 
                  value={newQuestion.restrictions} 
                  onChange={(e) => { setError(null); setNewQuestion((prev: any) => ({ ...prev, restrictions: e.target.value })); }}
                  onKeyDown={(e) => handleTabKey(e, (val) => setNewQuestion((prev: any) => ({ ...prev, restrictions: val })))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.8rem 1rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '80px', resize: 'vertical', outline: 'none', lineHeight: 1.5, fontSize: '0.85rem' }}
                  placeholder="e.g., Time complexity O(N), Space complexity O(1)"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t("difficultyLabel")}</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {[
                    { label: "Target Practice", value: "Easy" },
                    { label: "Trial Duel", value: "Medium" },
                    { label: "Royal Challenge", value: "Hard" }
                  ].map((d) => (
                    <button 
                      key={d.value}
                      onClick={() => setNewQuestion({ ...newQuestion, difficulty: d.value })}
                      className="btn"
                      style={{ flex: 1, borderColor: newQuestion.difficulty === d.value ? 'var(--accent)' : 'var(--line)', color: newQuestion.difficulty === d.value ? 'var(--accent)' : 'inherit', height: '44px', fontWeight: newQuestion.difficulty === d.value ? 700 : 400, cursor: 'pointer', background: newQuestion.difficulty === d.value ? 'rgba(var(--accent-rgb), 0.05)' : 'transparent' }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Public Examples (JSON)</label>
                  <textarea 
                    value={testCasesRaw} 
                    onChange={(e) => { setError(null); setTestCasesRaw(e.target.value); }}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', padding: '1rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '150px', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Hidden Tests (JSON)</label>
                  <textarea 
                    value={hiddenTestCasesRaw} 
                    onChange={(e) => { setError(null); setHiddenTestCasesRaw(e.target.value); }}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', padding: '1rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '150px', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none', resize: 'vertical' }}
                  />
                </div>
              </div>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>Format: {'[{"input": "10\\n20", "output": "30"}]'}</p>

              <button 
                onClick={newQuestion.id ? handleUpdateQuestion : handleAddQuestion}
                className="btn" 
                style={{ background: 'var(--accent)', color: '#000', fontWeight: 800, border: 'none', padding: '1.25rem', marginTop: '1rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
              >
                {newQuestion.id ? "UPDATE CHALLENGE" : "PUBLISH TO ARENA"}
              </button>
            </div>
          </div>

          {/* Question List / Management */}
          <div className="settings-group" style={{ marginTop: '2rem' }}>
            <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--accent)' }}>
              <Sword size={14} /> MANAGE ARENA CHALLENGES
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {questions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>{t("noQuestionsFound")}</p>
              ) : (
                questions.map((q) => (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.4rem', transition: 'border-color 0.2s ease' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        <span style={{ opacity: 0.5, marginRight: '0.5rem' }}>#{q.problemId || "?"}</span>
                        {q.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: q.difficulty === 'Easy' ? '#50fa7b' : q.difficulty === 'Medium' ? '#ffb86c' : '#ff5555', marginTop: '0.2rem', fontWeight: 600 }}>
                        {q.difficulty === 'Easy' ? 'TARGET PRACTICE' : q.difficulty === 'Medium' ? 'TRIAL DUEL' : 'ROYAL CHALLENGE'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => startEditing(q)}
                        className="twm-btn" 
                        style={{ color: 'var(--accent)', padding: '0.5rem', background: 'rgba(255,255,255,0.03)' }}
                        title="Edit Question"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteQuestion(q.id)}
                        className="twm-btn" 
                        style={{ color: '#ff5555', padding: '0.5rem', background: 'rgba(255,255,255,0.03)' }}
                        title="Delete Question"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User List / Management */}
          <div className="settings-group" style={{ marginTop: '2rem' }}>
            <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--accent)' }}>
              <Users size={14} /> MANAGE USERS
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {loadingUsers ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>{t("loadingUsers")}</p>
              ) : users.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>{t("noUsersFound")}</p>
              ) : (
                users.map((u) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.4rem', transition: 'border-color 0.2s ease' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{u.username || u.name || "Unknown User"}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 600 }}>
                        {u.email} {u.isAdmin ? <span style={{ color: '#ffb86c' }}>(ADMIN)</span> : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="twm-btn" 
                        style={{ color: '#ff5555', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', opacity: u.isAdmin ? 0.3 : 1, cursor: u.isAdmin ? 'not-allowed' : 'pointer' }}
                        title="Delete User"
                        disabled={u.isAdmin}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

AdminWindow.displayName = "AdminWindow";
