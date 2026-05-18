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
  setShowWaitingPopup: (val: boolean) => void;
}

export const BattleWindow: React.FC<BattleWindowProps> = React.memo(({
  startBattle, setShowWaitingPopup, questions, session, isGuest, handlePlayAsGuest, t, onDeleteQuestion, onEditQuestion,
  createDuel, joinDuel, activeDuel, setActiveDuel, setDuelPin, showCancelDuel, setShowCancelDuel, handleCancelDuel
}) => {
  console.log("BattleWindow activeDuel:", activeDuel);
  const [joinPin, setJoinPin] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

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

  if (activeDuel && activeDuel.status === "FINISHED") {
    const hostWin = (activeDuel.hostPenalty || 0) < (activeDuel.guestPenalty || 0);
    const guestWin = !hostWin;
    
    return (
      <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>BATTLE FINISHED</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
          <div style={{ padding: '1.5rem', background: hostWin ? 'rgba(80, 250, 123, 0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${hostWin ? '#50fa7b' : 'var(--line)'}`, borderRadius: '0.8rem' }}>
            <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>{activeDuel.host?.username || activeDuel.host?.name || "Host"}</div>
            <div style={{ fontSize: '0.75rem', color: '#f1fa8c', marginBottom: '0.5rem', fontWeight: 600 }}>
              Rating: {activeDuel.host?.rating ?? 1000}
              {activeDuel.hostRatingChange !== null && activeDuel.hostRatingChange !== undefined && (
                <span style={{ marginLeft: '0.4rem', color: activeDuel.hostRatingChange >= 0 ? '#50fa7b' : '#ff5555' }}>
                  ({activeDuel.hostRatingChange >= 0 ? '+' : ''}{activeDuel.hostRatingChange})
                </span>
              )}
            </div>
            <div style={{ fontSize: '1.5rem', color: hostWin ? '#50fa7b' : 'var(--text)' }}>Penalty: {activeDuel.hostPenalty || 0}</div>
          </div>
          <div style={{ padding: '1.5rem', background: guestWin ? 'rgba(80, 250, 123, 0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${guestWin ? '#50fa7b' : 'var(--line)'}`, borderRadius: '0.8rem' }}>
            <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>{activeDuel.guest?.username || activeDuel.guest?.name || "Guest"}</div>
            <div style={{ fontSize: '0.75rem', color: '#f1fa8c', marginBottom: '0.5rem', fontWeight: 600 }}>
              Rating: {activeDuel.guest?.rating ?? 1000}
              {activeDuel.guestRatingChange !== null && activeDuel.guestRatingChange !== undefined && (
                <span style={{ marginLeft: '0.4rem', color: activeDuel.guestRatingChange >= 0 ? '#50fa7b' : '#ff5555' }}>
                  ({activeDuel.guestRatingChange >= 0 ? '+' : ''}{activeDuel.guestRatingChange})
                </span>
              )}
            </div>
            <div style={{ fontSize: '1.5rem', color: guestWin ? '#50fa7b' : 'var(--text)' }}>Penalty: {activeDuel.guestPenalty || 0}</div>
          </div>
        </div>
        <button onClick={() => { setActiveDuel(null); setDuelPin(""); }} style={{ background: 'var(--line)', border: 'none', padding: '1rem 2rem', borderRadius: '0.4rem', color: 'var(--text)', cursor: 'pointer' }}>BACK TO ARENA</button>
      </div>
    );
  }

  if (activeDuel && activeDuel.status === "WAITING") {
    return (
      <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ background: 'rgba(122, 162, 247, 0.1)', color: 'var(--accent)', padding: '1.5rem', borderRadius: '50%', marginBottom: '2rem' }}>
          <Users size={64} />
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '0.05em' }}>WAITING FOR OPPONENT</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '450px', marginBottom: '3rem', lineHeight: 1.6 }}>
          Your duel uplink is established. Share the PIN below with your opponent to initiate combat.
        </p>
        
        <div 
          onClick={() => {
            if (activeDuel?.pin) {
              navigator.clipboard.writeText(activeDuel.pin);
            }
          }}
          title="Click to copy PIN"
          style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid var(--line)', 
            padding: '2rem 4rem', 
            borderRadius: '1rem', 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.background = 'rgba(122, 162, 247, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.2em' }}>DUEL PIN</div>
          <div style={{ fontSize: '4rem', fontWeight: 950, color: 'var(--accent)', letterSpacing: '0.3em', fontFamily: 'monospace' }}>
            {activeDuel.pin}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700 }}>
            <Copy size={14} /> CLICK TO COPY
          </div>
        </div>

        <button 
          onClick={() => setShowCancelDuel(true)}
          style={{ 
            marginTop: '4rem', 
            background: 'transparent', 
            border: 'none', 
            color: 'rgba(255, 85, 85, 0.6)', 
            fontWeight: 700, 
            cursor: 'pointer', 
            fontSize: '0.9rem',
            letterSpacing: '0.1em',
            textDecoration: 'underline'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ff5555'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 85, 85, 0.6)'}
        >
          ABORT UPLINK
        </button>
      </div>
    );
  }


  return (
    <div style={{ padding: '2.5rem 1.5rem', height: '100%', overflow: 'auto', position: 'relative' }}>
      {(isCreating || isJoining) && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div className="loading-spinner" style={{ width: '40px', height: '40px' }} />
          <div style={{ color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.1em' }}>
            {isCreating ? "GENERATING UPLINK..." : "INITIATING HANDSHAKE..."}
          </div>
        </div>
      )}
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
                  onClick={async () => { 
                    setIsCreating(true);
                    await createDuel(); 
                    setShowWaitingPopup(true);
                    setIsCreating(false);
                  }}
                  disabled={isCreating}
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
                    cursor: isCreating ? 'wait' : 'pointer',
                    opacity: isCreating ? 0.7 : 1
                  }}
                >
                  {isCreating ? "GENERATING..." : "CREATE UPLINK"}
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
                    onClick={async () => {
                      if (!joinPin) return;
                      setIsJoining(true);
                      await joinDuel(joinPin);
                      setIsJoining(false);
                    }}
                    disabled={isJoining || isCreating}
                    style={{ 
                      height: '56px', 
                      background: 'var(--text)', 
                      color: '#000', 
                      border: 'none', 
                      fontWeight: 900, 
                      padding: '0 2rem',
                      borderRadius: '0.4rem',
                      cursor: (isJoining || isCreating) ? 'wait' : 'pointer',
                      fontSize: '0.9rem',
                      letterSpacing: '0.1em',
                      opacity: (isJoining || isCreating) ? 0.7 : 1
                    }}
                  >
                    {isJoining ? "JOINING..." : "JOIN"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
});

BattleWindow.displayName = "BattleWindow";
