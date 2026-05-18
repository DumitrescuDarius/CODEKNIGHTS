"use client";

import React from "react";
import { User, ShieldCheck } from "lucide-react";
import { UserStats } from "../../types";
import { TranslationKey } from "../../constants/translations";

interface ProfileWindowProps {
  session: any;
  userStats: UserStats;
  t: (key: TranslationKey) => string;
}

export const ProfileWindow: React.FC<ProfileWindowProps> = React.memo(({ session, userStats, t }) => {
  const isAdmin = !!session?.user?.isAdmin;
  const rank = (session?.user as any)?.rank || "Novice";
  const rating = (session?.user as any)?.rating ?? 1000;
  const dailyWins = (session?.user as any)?.dailyWins ? (typeof (session.user as any).dailyWins === 'string' ? JSON.parse((session.user as any).dailyWins) : (session.user as any).dailyWins) : {};

  const getTodayWins = () => {
    const today = new Date().toLocaleDateString('en-CA');
    return dailyWins[today] || 0;
  };

  const getSquareColor = (wins: number) => {
    if (wins === 0) return 'rgba(255,255,255,0.05)';
    if (wins < 2) return '#0e4429'; // L1
    if (wins < 5) return '#006d32'; // L2
    if (wins < 10) return '#26a641'; // L3
    return '#39d353'; // L4
  };

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        {session?.user?.image ? (
          <img src={session.user.image} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--accent)' }} />
        ) : (
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={40} /></div>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{(session?.user as any)?.username || session?.user?.name || "Knight"}</h2>
            {isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--accent)', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                <ShieldCheck size={12} />
                ADMIN
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>{t("rank")}: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{rank}</span></span>
            <span>Rating: <span style={{ color: '#f1fa8c', fontWeight: 600 }}>{rating}</span></span>
            <span>{t("battlesWon")}: <span style={{ color: '#50fa7b', fontWeight: 600 }}>{userStats.battlesWon}</span></span>
            <span>Wins Today: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{getTodayWins()}</span></span>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <span className="settings-label">Win Activity</span>
        <div style={{ 
          background: 'rgba(255,255,255,0.01)', 
          border: '1px solid var(--line)', 
          borderRadius: '0.5rem', 
          padding: '1.25rem',
          marginTop: '0.5rem'
        }}>
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            {Array.from({ length: 56 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (55 - i));
                const dateStr = date.toLocaleDateString('en-CA');
                const wins = dailyWins[dateStr] || 0;
                return (
                    <div 
                      key={i} 
                      title={`${dateStr}: ${wins} wins`}
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        background: getSquareColor(wins),
                        borderRadius: '2px',
                        border: '1px solid rgba(0,0,0,0.1)'
                      }} 
                    />
                )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <span>Last 8 weeks</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Less</span>
              {[0, 1, 4, 9, 15].map(w => (
                <div key={w} style={{ width: '10px', height: '10px', background: getSquareColor(w), borderRadius: '1px' }} />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProfileWindow.displayName = "ProfileWindow";
