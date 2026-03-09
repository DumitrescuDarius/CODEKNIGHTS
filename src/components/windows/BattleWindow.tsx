"use client";

import React, { useState } from "react";
import { Question } from "../../types";
import { signIn } from "next-auth/react";
import { LogIn, User, Sword, Shield, Trash2, Users, Plus, Copy, Hash, X, Trophy, Zap, Target } from "lucide-react";
import { TranslationKey } from "../../constants/translations";

interface BattleWindowProps {
  startBattle: (q?: any) => void;
  questions: Question[];
  session: any;
  isGuest: boolean;
  handlePlayAsGuest: () => void;
  t: (key: TranslationKey) => string;
  onDeleteQuestion?: (id: string) => void;
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
  startBattle, questions, session, isGuest, handlePlayAsGuest, t, onDeleteQuestion,
  createDuel, joinDuel, activeDuel, setActiveDuel, setDuelPin, showCancelDuel, setShowCancelDuel, handleCancelDuel
}) => {
  const [joinPin, setJoinPin] = useState("");

  if (!session && !isGuest) {
    return (
      <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ background: 'rgba(122, 162, 247, 0.1)', color: 'var(--accent)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <Shield size={48} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>{t("authRequired")}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px', marginBottom: '2rem' }}>
          {t("authRequired") === "Autentificare Necesară" 
            ? "Trebuie să fii autentificat sau să joci ca invitat pentru a intra în Arena de Luptă." 
            : "You must be signed in or playing as a guest to enter the Battle Arena."}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px' }}>
          <button 
            onClick={() => signIn()}
            style={{ 
              background: 'var(--accent)', color: '#000', border: 'none', padding: '0.8rem', 
              borderRadius: '0.4rem', fontWeight: 700, cursor: 'pointer', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', gap: '0.5rem' 
            }}
          >
            <LogIn size={18} /> {t("signIn").toUpperCase()}
          </button>
          
          <button 
            onClick={handlePlayAsGuest}
            style={{ 
              background: 'rgba(255,255,255,0.02)', color: 'var(--text)', border: '1px solid var(--line)', 
              padding: '0.8rem', borderRadius: '0.4rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <User size={18} /> {t("playAsGuest").toUpperCase()}
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = !!session?.user?.isAdmin;

  if (showCancelDuel) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
        <X size={48} color="#ff5555" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Cancel Duel?</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Closing this window will cancel your pending invitation. Are you sure?
        </p>
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '300px' }}>
          <button 
            onClick={handleCancelDuel}
            className="btn"
            style={{ flex: 1, background: 'rgba(255, 85, 85, 0.1)', color: '#ff5555', borderColor: '#ff555544', cursor: 'pointer' }}
          >
            YES, CANCEL
          </button>
          <button 
            onClick={() => setShowCancelDuel(false)}
            className="btn"
            style={{ flex: 1, background: 'var(--line)', border: 'none', cursor: 'pointer' }}
          >
            KEEP WAITING
          </button>
        </div>
      </div>
    );
  }

  if (activeDuel && activeDuel.status === "WAITING") {
    return (
      <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ background: 'rgba(122, 162, 247, 0.1)', color: 'var(--accent)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <Users size={48} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Waiting for Opponent</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Share this PIN with a friend to start the duel.</p>
        
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '0.2em', color: 'var(--accent)', padding: '1rem 2rem', background: 'rgba(255,255,255,0.02)', border: '2px dashed var(--line)', borderRadius: '0.5rem' }}>
            {activeDuel.pin}
          </div>
          <button 
            onClick={() => navigator.clipboard.writeText(activeDuel.pin)}
            style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--accent)', color: '#000', border: 'none', padding: '0.4rem', borderRadius: '50%', cursor: 'pointer' }}
            title="Copy PIN"
          >
            <Copy size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.5rem', width: '100%', maxWidth: '300px' }}>
          {activeDuel.host.image ? <img src={activeDuel.host.image} style={{ width: '32px', height: '32px', borderRadius: '50%' }} /> : <User size={20} />}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{activeDuel.host.username || activeDuel.host.name}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>HOST</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--accent)' }}>READY</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sword size={20} color="var(--accent)" />
          <h2 style={{ margin: 0 }}>{t("battle")} Arena</h2>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Quick Battle */}
        <div className="settings-group">
          <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sword size={14} /> Arena Quick Duel
          </span>
          <button 
            onClick={() => startBattle()}
            className="btn"
            style={{ 
              width: '100%', 
              background: 'var(--accent)', 
              color: '#000', 
              border: 'none', 
              padding: '1.25rem', 
              borderRadius: '0.4rem', 
              fontWeight: 800, 
              fontSize: '1rem', 
              cursor: 'pointer', 
              marginTop: '1rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}
          >
            <Zap size={18} fill="currentColor" /> {t("startQuickBattle")}
          </button>
        </div>

        {/* Private Duel Section */}
        <div className="settings-group">
          <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={14} /> Private Combat
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={createDuel}
                className="btn"
                style={{ 
                  flex: 1, 
                  height: '48px', 
                  borderRadius: '0.4rem',
                  border: '1px solid var(--line)',
                  background: 'rgba(255,255,255,0.02)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Plus size={16} /> GENERATE PIN
              </button>
              <div style={{ flex: 1.5, display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Hash size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    maxLength={6}
                    placeholder="Enter PIN"
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value)}
                    style={{ 
                      width: '100%', 
                      height: '48px', 
                      background: '#000', 
                      border: '1px solid var(--line)', 
                      borderRadius: '0.4rem', 
                      color: 'inherit', 
                      padding: '0 1rem 0 2.25rem', 
                      outline: 'none', 
                      boxSizing: 'border-box',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <button 
                  onClick={() => joinDuel(joinPin)}
                  className="btn"
                  style={{ 
                    height: '48px', 
                    background: 'var(--text)', 
                    color: '#000', 
                    border: 'none', 
                    fontWeight: 700, 
                    padding: '0 1.5rem',
                    borderRadius: '0.4rem'
                  }}
                >
                  JOIN
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Create or join a private room to battle with a direct opponent.</p>
          </div>
        </div>
        
        <div className="settings-group">
          <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={14} /> {t("availableChallenges")}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {questions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t("availableChallenges") === "Provocări Disponibile" ? "Nicio întrebare disponibilă momentan." : "No questions available yet."}</p>
            ) : (
              questions.map((q) => {
                const diffLabel = q.difficulty === 'Easy' ? 'Target Practice' : q.difficulty === 'Medium' ? 'Trial Duel' : 'Royal Challenge';
                const diffColor = q.difficulty === 'Easy' ? '#50fa7b' : q.difficulty === 'Medium' ? '#ffb86c' : '#ff5555';
                return (
                  <div key={q.id} style={{ 
                    padding: '1rem', 
                    border: '1px solid var(--line)', 
                    borderRadius: '0.4rem', 
                    background: 'rgba(255,255,255,0.01)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q.title}</div>
                      <div style={{ fontSize: '0.7rem', color: diffColor, marginTop: '0.2rem', fontWeight: 600 }}>{diffLabel}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {isAdmin && onDeleteQuestion && (
                        <button 
                          onClick={() => onDeleteQuestion(q.id)}
                          className="twm-btn" 
                          style={{ color: '#ff5555', padding: '0.4rem' }}
                          title="Delete Question"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => startBattle(q)} 
                        className="btn" 
                        style={{ 
                          fontSize: '0.75rem', 
                          height: '32px',
                          padding: '0 1rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--line)',
                          color: 'var(--accent)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          borderRadius: '0.3rem'
                        }}
                      >
                        {t("battle").toUpperCase()}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

BattleWindow.displayName = "BattleWindow";
