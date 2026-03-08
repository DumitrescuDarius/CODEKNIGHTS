"use client";

import React from "react";
import { Question } from "../../types";

interface BattleWindowProps {
  isAdmin: boolean;
  isAdminView: boolean;
  setIsAdminView: (val: boolean) => void;
  newQuestion: { title: string; description: string; difficulty: string; testCases: any[] };
  setNewQuestion: (val: any) => void;
  handleAddQuestion: () => void;
  startBattle: (q?: any) => void;
  questions: Question[];
}

export const BattleWindow: React.FC<BattleWindowProps> = React.memo(({
  isAdmin, isAdminView, setIsAdminView, newQuestion, setNewQuestion,
  handleAddQuestion, startBattle, questions
}) => {
  return (
    <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Battle Arena</h2>
        {isAdmin && (
          <button 
            onClick={() => setIsAdminView(!isAdminView)}
            className="btn"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderColor: isAdminView ? 'var(--accent)' : 'var(--line)', color: isAdminView ? 'var(--accent)' : 'inherit' }}
          >
            {isAdminView ? "VIEW BATTLES" : "ADMIN: ADD QUESTION"}
          </button>
        )}
      </div>

      {isAdminView ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
          <div className="settings-group">
            <label className="settings-label">Title</label>
            <input 
              type="text" 
              value={newQuestion.title} 
              onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.6rem', borderRadius: '0.4rem', color: 'inherit' }}
              placeholder="e.g., Two Sum"
            />
          </div>
          <div className="settings-group">
            <label className="settings-label">Description (Markdown)</label>
            <textarea 
              value={newQuestion.description} 
              onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.6rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '120px', resize: 'vertical' }}
              placeholder="Describe the problem..."
            />
          </div>
          <div className="settings-group">
            <label className="settings-label">Difficulty</label>
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
                  style={{ flex: 1, borderColor: newQuestion.difficulty === d.value ? 'var(--accent)' : 'var(--line)', color: newQuestion.difficulty === d.value ? 'var(--accent)' : 'inherit', height: '40px', fontSize: '0.75rem' }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-group">
            <label className="settings-label">Test Cases (JSON Format Input/Output)</label>
            <textarea 
              value={JSON.stringify(newQuestion.testCases, null, 2)} 
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setNewQuestion({ ...newQuestion, testCases: parsed });
                } catch (err) {}
              }}
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.6rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '100px', fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Format: {'[{"input": "...", "output": "..."}]'}
            </p>
          </div>
          <button 
            onClick={handleAddQuestion}
            className="btn" 
            style={{ background: 'var(--accent)', color: '#000', fontWeight: 600, border: 'none', padding: '0.75rem', height: '44px' }}
          >
            PUBLISH QUESTION
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            onClick={() => startBattle()}
            style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '1.25rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginBottom: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
          >
            START QUICK BATTLE
          </button>
          
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Challenges</div>
          
          {questions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No questions available yet. Challenge knights in coding duels.</p>
          ) : (
            questions.map((q) => {
              const diffLabel = q.difficulty === 'Easy' ? 'Target Practice' : q.difficulty === 'Medium' ? 'Trial Duel' : 'Royal Challenge';
              return (
                <div key={q.id} style={{ padding: '1rem', border: '1px solid var(--line)', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{q.title}</div>
                    <div style={{ fontSize: '0.75rem', color: q.difficulty === 'Easy' ? '#50fa7b' : q.difficulty === 'Medium' ? '#ffb86c' : '#ff5555', marginTop: '0.2rem' }}>{diffLabel}</div>
                  </div>
                  <button onClick={() => startBattle(q)} className="btn btn-outline" style={{ fontSize: '0.75rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}>BATTLE</button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
});

BattleWindow.displayName = "BattleWindow";
