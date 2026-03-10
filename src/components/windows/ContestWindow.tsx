"use client";

import React, { useState } from "react";
import { Plus, Trash2, ChevronRight, Binary, Sword, Users, Trophy } from "lucide-react";
import { Question, Contest, Match } from "../../types";
import { TranslationKey } from "../../constants/translations";

interface ContestWindowProps {
  questions: Question[];
  t: (key: TranslationKey) => string;
  isAdmin: boolean;
}

export const ContestWindow: React.FC<ContestWindowProps> = React.memo(({ questions, t, isAdmin }) => {
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState("");
  const [contests, setContests] = useState<Contest[]>([]);
  const [viewingContest, setViewingContest] = useState<Contest | null>(null);

  const addParticipant = () => {
    if (newParticipant.trim() && !participants.includes(newParticipant.trim())) {
      setParticipants([...participants, newParticipant.trim()]);
      setNewParticipant("");
    }
  };

  const removeParticipant = (name: string) => {
    setParticipants(participants.filter(p => p !== name));
  };

  const generateChampionship = () => {
    if (participants.length < 2) {
      alert("At least 2 participants are required.");
      return;
    }

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const matches: Match[] = [];
    
    // We need to create a binary tree.
    // Total matches needed = participants.length - 1
    // We'll build it from the final backwards to the first round.
    
    const numParticipants = shuffled.length;
    const numRounds = Math.ceil(Math.log2(numParticipants));
    const totalMatches = numParticipants - 1;

    // Create matches
    for (let i = 0; i < totalMatches; i++) {
      matches.push({
        id: `match-${i}`,
        player1: null,
        player2: null,
        winner: null,
        questionId: questions[Math.floor(Math.random() * questions.length)]?.id || "default",
        nextMatchId: null
      });
    }

    // Link matches into a tree
    // The last match created (index totalMatches - 1) is the final.
    // Matches 0 to totalMatches - 2 will have a nextMatchId.
    for (let i = 0; i < totalMatches - 1; i++) {
      const nextMatchIdx = Math.floor(i / 2) + Math.ceil(totalMatches / 2);
      // Wait, let's use a simpler approach for the tree linking
    }

    // Revised linking:
    // Round 1 matches: indices 0 to M1-1
    // Round 2 matches: indices M1 to M1+M2-1, etc.
    // Final is the last match.
    
    // Let's just create a flat list for now and assign participants to the "leaves"
    // To properly show a tree, we'd need a more complex object.
    
    // Simple assignment for demonstration:
    for (let i = 0; i < Math.floor(numParticipants / 2); i++) {
      matches[i].player1 = shuffled[i * 2];
      matches[i].player2 = shuffled[i * 2 + 1];
    }
    // If odd, the last one gets a bye (handled in next round logic usually)

    const newContest: Contest = {
      id: `contest-${Date.now()}`,
      title: title || "New Championship",
      participants: [...shuffled],
      matches: matches,
      status: "DRAFT"
    };

    setContests([newContest, ...contests]);
    setViewingContest(newContest);
    setTitle("");
    setParticipants([]);
  };

  const renderBracket = (contest: Contest) => {
    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{contest.title.toUpperCase()}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{contest.participants.length} contestants battling for glory</p>
          </div>
          <button onClick={() => setViewingContest(null)} className="btn btn-ghost" style={{ fontSize: '0.75rem', border: '1px solid var(--line)' }}>BACK TO TOURNAMENTS</button>
        </div>
        
        <div style={{ display: 'flex', gap: '3rem', overflowX: 'auto', padding: '2rem 0', alignItems: 'center' }}>
          {/* Round 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: '240px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.1em', textAlign: 'center' }}>ROUND 1</div>
            {contest.matches.slice(0, Math.ceil(contest.participants.length / 2)).map((m, idx) => (
              <div key={m.id} style={{ position: 'relative' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.4rem', padding: '0.75rem', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>{m.player1 || "---"}</span>
                      <span style={{ opacity: 0.3 }}>#1</span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--line)' }} />
                    <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>{m.player2 || "BYE"}</span>
                      <span style={{ opacity: 0.3 }}>#2</span>
                    </div>
                  </div>
                </div>
                {/* Connector line */}
                <div style={{ position: 'absolute', right: '-1.5rem', top: '50%', width: '1.5rem', height: '1px', background: 'var(--line)' }} />
              </div>
            ))}
          </div>

          {/* Subsequent rounds would go here, connecting logically */}
          <div style={{ opacity: 0.3, textAlign: 'center' }}>
            <Binary size={48} style={{ marginBottom: '1rem' }} />
            <div style={{ fontSize: '0.8rem' }}>Bracket scaling logic<br/>in development</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
      {viewingContest ? renderBracket(viewingContest) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent)' }}>{t("contests")}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Organize binary-tree style championships.</p>
          </div>

          {isAdmin && (
            <div className="settings-group" style={{ marginBottom: '3rem', padding: '2rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--line)', borderRadius: '0.8rem' }}>
              <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontSize: '0.9rem' }}>
                <Plus size={16} /> CHAMPIONSHIP CREATOR
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>TOURNAMENT NAME</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', padding: '1rem', borderRadius: '0.4rem', color: 'inherit', outline: 'none', fontSize: '1rem' }}
                    placeholder="e.g., Grand Knight's Invitational"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>INVITE CONTESTANTS</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      value={newParticipant} 
                      onChange={(e) => setNewParticipant(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                      style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', padding: '1rem', borderRadius: '0.4rem', color: 'inherit', outline: 'none' }}
                      placeholder="Enter username..."
                    />
                    <button onClick={addParticipant} className="btn" style={{ background: 'var(--accent)', color: '#000', fontWeight: 700, padding: '0 2rem' }}>ADD</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
                    {participants.map(p => (
                      <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(122, 162, 247, 0.1)', color: 'var(--accent)', padding: '0.5rem 1rem', borderRadius: '0.4rem', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(122, 162, 247, 0.2)' }}>
                        <Users size={14} />
                        {p}
                        <Trash2 size={14} style={{ cursor: 'pointer', marginLeft: '0.5rem', opacity: 0.6 }} onClick={() => removeParticipant(p)} />
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={generateChampionship}
                  className="btn" 
                  disabled={participants.length < 2}
                  style={{ background: 'var(--accent)', color: '#000', fontWeight: 800, border: 'none', padding: '1.25rem', marginTop: '1rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '1rem', opacity: participants.length < 2 ? 0.5 : 1, boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
                >
                  GENERATE BINARY TREE BRACKET
                </button>
              </div>
            </div>
          )}

          <div className="settings-group">
            <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <Binary size={16} /> TOURNAMENTS
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              {contests.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--line)', borderRadius: '0.8rem' }}>
                  <Trophy size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.2 }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No championships found. Create one to begin!</p>
                </div>
              ) : (
                contests.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.6rem', transition: 'transform 0.2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ background: 'rgba(122, 162, 247, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--accent)' }}>
                        <Trophy size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{c.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Users size={12} /> {c.participants.length} contestants • <span style={{ color: 'var(--accent)' }}>{c.status}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setViewingContest(c)} className="btn" style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                      VIEW BRACKET
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ContestWindow.displayName = "ContestWindow";
