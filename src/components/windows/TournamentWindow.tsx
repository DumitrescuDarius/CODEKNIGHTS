"use client";

import React, { useState } from "react";
import { Plus, Trash2, ChevronRight, Binary, Sword, Users, Trophy, Shield, Zap, Target } from "lucide-react";
import { Question, Tournament, Match } from "../../types";
import { TranslationKey } from "../../constants/translations";

interface TournamentWindowProps {
  questions: Question[];
  t: (key: TranslationKey) => string;
  isAdmin: boolean;
}

export const TournamentWindow: React.FC<TournamentWindowProps> = React.memo(({ questions, t, isAdmin }) => {
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [viewingTournament, setViewingTournament] = useState<Tournament | null>(null);

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
    
    const numParticipants = shuffled.length;
    const totalMatches = numParticipants - 1;

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

    for (let i = 0; i < Math.floor(numParticipants / 2); i++) {
      matches[i].player1 = shuffled[i * 2];
      matches[i].player2 = shuffled[i * 2 + 1];
    }

    const newTournament: Tournament = {
      id: `tournament-${Date.now()}`,
      title: title || "NEO-ARENA CHAMPIONSHIP",
      participants: [...shuffled],
      matches: matches,
      status: "ACTIVE"
    };

    setTournaments([newTournament, ...tournaments]);
    setViewingTournament(newTournament);
    setTitle("");
    setParticipants([]);
  };

  const renderBracket = (tournament: Tournament) => {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Trophy size={24} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '0.1em' }}>{tournament.title.toUpperCase()}</h3>
            </div>
            <p style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em', opacity: 0.8 }}>
              STATUS: {tournament.status} {"//"} {tournament.participants.length} ELITE KNIGHTS
            </p>
          </div>
          <button 
            onClick={() => setViewingTournament(null)} 
            className="btn" 
            style={{ 
              fontSize: '0.7rem', 
              fontWeight: 800, 
              letterSpacing: '0.1em',
              background: 'transparent',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              padding: '0.6rem 1.2rem',
              borderRadius: '0.2rem'
            }}
          >
            TERMINATE VIEW
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '4rem', overflowX: 'auto', padding: '2rem 0', alignItems: 'center' }}>
          {/* Round 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', minWidth: '280px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.3em', textAlign: 'center', marginBottom: '1rem', opacity: 0.6 }}>[ PHASE_01 ]</div>
            {tournament.matches.slice(0, Math.ceil(tournament.participants.length / 2)).map((m, idx) => (
              <div key={m.id} style={{ position: 'relative' }}>
                <div style={{ 
                  background: 'rgba(122, 162, 247, 0.03)', 
                  border: '1px solid var(--line)', 
                  borderLeft: '3px solid var(--accent)',
                  borderRadius: '0.2rem', 
                  padding: '1rem', 
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Subtle background icon */}
                  <Shield size={40} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05, transform: 'rotate(-15deg)' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: m.player1 ? 'var(--text)' : 'var(--text-muted)', letterSpacing: '0.05em' }}>
                        {m.player1?.toUpperCase() || "PENDING..."}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--accent)', opacity: 0.5, fontWeight: 900 }}>{t("rankA")}</span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--line)', width: '100%' }} />
                    <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: m.player2 ? 'var(--text)' : 'var(--text-muted)', letterSpacing: '0.05em' }}>
                        {m.player2?.toUpperCase() || "BYE_SECURED"}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--accent)', opacity: 0.5, fontWeight: 900 }}>{t("rankB")}</span>
                    </div>
                  </div>
                </div>
                {/* Connector line with glow */}
                <div style={{ 
                  position: 'absolute', 
                  right: '-2rem', 
                  top: '50%', 
                  width: '2rem', 
                  height: '1px', 
                  background: 'var(--accent)',
                  boxShadow: '0 0 10px var(--accent)'
                }} />
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--line)', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.01)' }}>
            <Binary size={48} style={{ color: 'var(--accent)', marginBottom: '1.5rem', opacity: 0.4 }} />
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
              CALCULATING<br/>NEXT_PHASE_PROJECTIONS
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem', height: '100%', overflow: 'auto', background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(122,162,247,0.02) 100%)' }}>
      {viewingTournament ? renderBracket(viewingTournament) : (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ marginBottom: '4rem', textAlign: 'left' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text)', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              {t("tourna")}<span style={{ color: 'var(--accent)' }}>{t("ments")}</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ height: '2px', width: '40px', background: 'var(--accent)' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Secure the grid. Rise through the brackets.
              </p>
            </div>
          </div>

          {isAdmin && (
            <div style={{ 
              marginBottom: '4rem', 
              padding: '2.5rem', 
              background: 'rgba(255,255,255,0.01)', 
              border: '1px solid var(--line)', 
              borderRadius: '0.4rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem', background: 'var(--accent)', color: '#000', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.2em' }}>{t("adminAccess")}</div>
              
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.2em', marginBottom: '2.5rem' }}>
                <Zap size={16} /> {t("initTourney")}
              </span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>{t("identifierTitle")}</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)', padding: '1rem', borderRadius: '0.2rem', color: 'inherit', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit', borderLeft: '2px solid var(--line)' }}
                      placeholder="TOURNAMENT_NAME_01"
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--line)'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>{t("addParticipant")}</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={newParticipant} 
                        onChange={(e) => setNewParticipant(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                        style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)', padding: '1rem', borderRadius: '0.2rem', color: 'inherit', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit' }}
                        placeholder="USERNAME..."
                      />
                      <button onClick={addParticipant} className="btn" style={{ background: 'var(--accent)', color: '#000', fontWeight: 900, padding: '0 1.5rem', borderRadius: '0.2rem', border: 'none' }}>{t("inviteBtn") || t("invite")}</button>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.1em' }}>REGISTERED_AGENTS ({participants.length})</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {participants.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.5 }}>{t("noAgentsRegistered")}</span>}
                    {participants.map(p => (
                      <div key={p} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        background: 'rgba(122, 162, 247, 0.05)', 
                        color: 'var(--accent)', 
                        padding: '0.6rem 1rem', 
                        borderRadius: '0.2rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        border: '1px solid rgba(122, 162, 247, 0.2)',
                        letterSpacing: '0.05em'
                      }}>
                        <Target size={12} />
                        {p.toUpperCase()}
                        <Trash2 size={12} style={{ cursor: 'pointer', marginLeft: '0.5rem', opacity: 0.6 }} onClick={() => removeParticipant(p)} />
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={generateChampionship}
                  className="btn" 
                  disabled={participants.length < 2}
                  style={{ 
                    background: 'var(--accent)', 
                    color: '#000', 
                    fontWeight: 900, 
                    border: 'none', 
                    padding: '1.25rem', 
                    marginTop: '1rem', 
                    borderRadius: '0.2rem', 
                    cursor: 'pointer', 
                    fontSize: '0.9rem', 
                    opacity: participants.length < 2 ? 0.4 : 1, 
                    letterSpacing: '0.2em'
                  }}
                >
                  INITIALIZE_BRACKET_SEQUENCE
                </button>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              <Binary size={16} /> ACTIVE_TOURNAMENTS_ON_GRID
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
              {tournaments.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--line)', borderRadius: '0.4rem' }}>
                  <Trophy size={48} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', opacity: 0.1 }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em' }}>{t("noActiveSequences")}</p>
                </div>
              ) : (
                tournaments.map(c => (
                  <div key={c.id} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    padding: '1.5rem', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--line)', 
                    borderRadius: '0.3rem', 
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(122, 162, 247, 0.1)', padding: '0.8rem', borderRadius: '0.2rem', color: 'var(--accent)' }}>
                          <Sword size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.05em' }}>{c.title.toUpperCase()}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--accent)', marginTop: '0.4rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                            STATUS: {c.status}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.2rem' }}>
                      <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '0.25rem' }}>{t("agentsTitle")}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{c.participants.length.toString().padStart(2, '0')}</div>
                      </div>
                      <div style={{ width: '1px', height: '20px', background: 'var(--line)' }} />
                      <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '0.25rem' }}>{t("phaseTitle")}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>01</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setViewingTournament(c)} 
                      className="btn" 
                      style={{ 
                        width: '100%',
                        padding: '1rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 900, 
                        letterSpacing: '0.2em',
                        border: '1px solid var(--accent)', 
                        color: 'var(--accent)',
                        background: 'transparent',
                        transition: 'all 0.2s ease',
                        borderRadius: '0.2rem'
                      }}
                    >
                      ACCESS_BRACKET_DATA
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

TournamentWindow.displayName = "TournamentWindow";
