"use client";

import React, { useState } from "react";
import { Question } from "../../types";
import { signIn } from "next-auth/react";
import { LogIn, User, Sword, Shield, Trash2, Users, Plus, Copy, Hash, X, Trophy, Zap, Target, Edit2, Search } from "lucide-react";
import { TranslationKey } from "../../constants/translations";

interface BattleWindowProps {
  startBattle: (q?: any) => void;
  questions: Question[];
  session: any;
  isGuest: boolean;
  handlePlayAsGuest: () => void;
  t: (key: TranslationKey) => string;
  onDeleteQuestion?: (id: string) => void;
  onEditQuestion?: (q: Question) => void;
  createDuel: () => void;
  joinDuel: (pin: string) => void;
  activeDuel: any;
  setActiveDuel: (val: any) => void;
  setDuelPin: (val: string) => void;
  showCancelDuel: boolean;
  setShowCancelDuel: (val: boolean) => void;
  handleCancelDuel: () => void;
}

export const BattleWindow: React.FC<BattleWindowProps> = React.memo(({
  startBattle, questions, session, isGuest, handlePlayAsGuest, t, onDeleteQuestion, onEditQuestion,
  createDuel, joinDuel, activeDuel, setActiveDuel, setDuelPin, showCancelDuel, setShowCancelDuel, handleCancelDuel
}) => {
  const [joinPin, setJoinPin] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const isAdmin = !!session?.user?.isAdmin;

  const filteredQuestions = questions.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!session && !isGuest) {
    return (
      <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ background: 'rgba(122, 162, 247, 0.1)', color: 'var(--accent)', padding: '1.5rem', borderRadius: '50%', marginBottom: '2rem', boxShadow: '0 0 30px rgba(122, 162, 247, 0.2)' }}>
          <Shield size={64} />
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '0.05em' }}>{t("authRequired").toUpperCase()}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', marginBottom: '3rem', lineHeight: 1.6 }}>
          {t("authRequired") === "Autentificare Necesară" 
            ? "Trebuie să fii autentificat sau să joci ca invitat pentru a intra în Arena de Luptă." 
            : "You must be signed in or playing as a guest to enter the Battle Arena."}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '350px' }}>
          <button 
            onClick={() => signIn()}
            style={{ 
              background: 'var(--accent)', color: '#000', border: 'none', padding: '1rem', 
              borderRadius: '0.4rem', fontWeight: 800, cursor: 'pointer', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1rem',
              boxShadow: '0 4px 20px rgba(122, 162, 247, 0.4)'
            }}
          >
            <LogIn size={20} /> {t("signIn").toUpperCase()}
          </button>
          
          <button 
            onClick={handlePlayAsGuest}
            style={{ 
              background: 'rgba(255,255,255,0.03)', color: 'var(--text)', border: '1px solid var(--line)', 
              padding: '1rem', borderRadius: '0.4rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1rem'
            }}
          >
            <User size={20} /> {t("playAsGuest").toUpperCase()}
          </button>
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
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>CANCEL DUEL?</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '3rem', maxWidth: '400px' }}>
          Closing this window will terminate your pending invitation and broadcast. Continue?
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', width: '100%', maxWidth: '400px' }}>
          <button 
            onClick={handleCancelDuel}
            style={{ flex: 1, background: 'rgba(255, 85, 85, 0.1)', color: '#ff5555', border: '1px solid rgba(255, 85, 85, 0.3)', padding: '1rem', borderRadius: '0.4rem', fontWeight: 800, cursor: 'pointer' }}
          >
            TERMINATE
          </button>
          <button 
            onClick={() => setShowCancelDuel(false)}
            style={{ flex: 1, background: 'var(--line)', border: 'none', color: 'var(--text)', padding: '1rem', borderRadius: '0.4rem', fontWeight: 800, cursor: 'pointer' }}
          >
            MAINTAIN
          </button>
        </div>
      </div>
    );
  }

  if (activeDuel && activeDuel.status === "WAITING") {
    return (
      <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ background: 'rgba(122, 162, 247, 0.1)', color: 'var(--accent)', padding: '1.5rem', borderRadius: '50%', marginBottom: '2rem', animation: 'pulse 2s infinite' }}>
          <Users size={64} />
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>WAITING FOR OPPONENT</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '3rem' }}>UPLINK ESTABLISHED. BROADCASTING PIN.</p>
        
        <div style={{ position: 'relative', marginBottom: '3rem' }}>
          <div style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '0.3em', color: 'var(--accent)', padding: '1.5rem 3rem', background: 'rgba(122, 162, 247, 0.03)', border: '2px dashed var(--accent)', borderRadius: '0.5rem', boxShadow: '0 0 40px rgba(122, 162, 247, 0.1)' }}>
            {activeDuel.pin}
          </div>
          <button 
            onClick={() => navigator.clipboard.writeText(activeDuel.pin)}
            style={{ position: 'absolute', top: '-15px', right: '-15px', background: 'var(--accent)', color: '#000', border: 'none', padding: '0.6rem', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
            title="Copy PIN"
          >
            <Copy size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.8rem', width: '100%', maxWidth: '350px' }}>
          {activeDuel.host.image ? (
            <img src={activeDuel.host.image} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--accent)' }} />
          ) : (
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} />
            </div>
          )}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{activeDuel.host.username || activeDuel.host.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 900, letterSpacing: '0.1em' }}>UPLINK_HOST</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 900 }}>ONLINE</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2.5rem 1.5rem', height: '100%', overflow: 'auto' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
            <Sword size={32} color="var(--accent)" />
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>BATTLE<span style={{ color: 'var(--accent)' }}>ARENA</span></h2>
          </div>
          <div style={{ height: '2px', width: '60px', background: 'var(--accent)', margin: '0.5rem auto 1.5rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Engage in high-frequency algorithmic combat.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* Quick Battle */}
          <section>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.2em', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
              <Zap size={16} /> Rapid Deployment
            </span>
            <button 
              onClick={() => startBattle()}
              style={{ 
                width: '100%', 
                background: 'var(--accent)', 
                color: '#000', 
                border: 'none', 
                padding: '1.5rem', 
                borderRadius: '0.4rem', 
                fontWeight: 900, 
                fontSize: '1.1rem', 
                cursor: 'pointer', 
                letterSpacing: '0.1em',
                boxShadow: '0 0 25px rgba(122, 162, 247, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Sword size={22} fill="currentColor" /> {t("startQuickBattle").toUpperCase()}
            </button>
          </section>

          {/* Private Duel Section */}
          <section>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
              <Users size={16} /> Secure Point-to-Point Combat
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.25rem' }}>
                <button 
                  onClick={createDuel}
                  style={{ 
                    height: '56px', 
                    borderRadius: '0.4rem',
                    border: '1px solid var(--line)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'var(--text)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                >
                  <Plus size={18} /> GENERATE UPLINK
                </button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Hash size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', opacity: 0.7 }} />
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="ENTER PIN"
                      value={joinPin}
                      onChange={(e) => setJoinPin(e.target.value.toUpperCase())}
                      style={{ 
                        width: '100%', 
                        height: '56px', 
                        background: 'rgba(0,0,0,0.3)', 
                        border: '1px solid var(--line)', 
                        borderRadius: '0.4rem', 
                        color: 'inherit', 
                        padding: '0 1rem 0 2.75rem', 
                        outline: 'none', 
                        boxSizing: 'border-box',
                        fontSize: '1rem',
                        fontWeight: 700,
                        letterSpacing: '0.2em',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--line)'}
                    />
                  </div>
                  <button 
                    onClick={() => joinDuel(joinPin)}
                    style={{ 
                      height: '56px', 
                      background: 'var(--text)', 
                      color: '#000', 
                      border: 'none', 
                      fontWeight: 900, 
                      padding: '0 2rem',
                      borderRadius: '0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      letterSpacing: '0.1em'
                    }}
                  >
                    JOIN
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Establish a secure encrypted room for direct peer-to-peer algorithmic testing.</p>
            </div>
          </section>
          
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                <Target size={16} /> Tactical Scenarios
              </span>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="FILTER_GRID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid var(--line)', 
                    padding: '0.5rem 0.8rem 0.5rem 2.25rem', 
                    borderRadius: '0.4rem', 
                    color: 'inherit', 
                    outline: 'none',
                    fontSize: '0.75rem',
                    width: '200px',
                    fontWeight: 600,
                    letterSpacing: '0.05em'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--line)'}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredQuestions.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--line)', borderRadius: '0.4rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>NO DATA MATCHES SEARCH PARAMETERS.</p>
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const diffLabel = q.difficulty === 'Easy' ? 'LOW_THREAT' : q.difficulty === 'Medium' ? 'MODERATE_THREAT' : 'HIGH_THREAT';
                  const diffColor = q.difficulty === 'Easy' ? '#50fa7b' : q.difficulty === 'Medium' ? '#ffb86c' : '#ff5555';
                  const isHovered = hoveredCard === q.id;
                  
                  return (
                    <div 
                      key={q.id} 
                      onMouseEnter={() => setHoveredCard(q.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{ 
                        padding: '1.25rem 1.5rem', 
                        border: '1px solid',
                        borderColor: isHovered ? 'var(--accent)' : 'var(--line)', 
                        borderRadius: '0.4rem', 
                        background: isHovered ? 'rgba(122, 162, 247, 0.03)' : 'rgba(255,255,255,0.01)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isHovered ? 'scale(1.01)' : 'scale(1)',
                        boxShadow: isHovered ? '0 10px 30px rgba(0,0,0,0.3)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ height: '40px', width: '2px', background: isHovered ? 'var(--accent)' : diffColor, transition: 'all 0.2s ease' }} />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.02em', color: isHovered ? 'var(--accent)' : 'var(--text)' }}>{q.title.toUpperCase()}</div>
                          <div style={{ fontSize: '0.65rem', color: diffColor, marginTop: '0.4rem', fontWeight: 900, letterSpacing: '0.1em' }}>{diffLabel}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {isAdmin && (
                          <>
                            {onEditQuestion && (
                              <button 
                                onClick={() => onEditQuestion(q)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.3rem', transition: 'all 0.2s ease' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                title="Edit Scenario"
                              >
                                <Edit2 size={18} />
                              </button>
                            )}
                            {onDeleteQuestion && (
                              <button 
                                onClick={() => onDeleteQuestion(q.id)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.3rem', transition: 'all 0.2s ease' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#ff5555'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                title="Delete Scenario"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </>
                        )}
                        <button 
                          onClick={() => startBattle(q)} 
                          style={{ 
                            fontSize: '0.75rem', 
                            height: '36px',
                            padding: '0 1.25rem',
                            background: isHovered ? 'var(--accent)' : 'transparent',
                            border: '1px solid',
                            borderColor: isHovered ? 'var(--accent)' : 'var(--line)',
                            color: isHovered ? '#000' : 'var(--accent)',
                            fontWeight: 900,
                            cursor: 'pointer',
                            borderRadius: '0.2rem',
                            letterSpacing: '0.15em',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          INITIALIZE
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
});

BattleWindow.displayName = "BattleWindow";
