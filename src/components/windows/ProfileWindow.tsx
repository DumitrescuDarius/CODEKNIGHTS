"use client";

import React from "react";
import { User, Shield } from "lucide-react";
import { UserStats } from "../../types";

interface ProfileWindowProps {
  session: any;
  userStats: UserStats;
}

export const ProfileWindow: React.FC<ProfileWindowProps> = React.memo(({ session, userStats }) => {
  const winRate = userStats.battlesTotal > 0 ? ((userStats.battlesWon / userStats.battlesTotal) * 100).toFixed(1) : "0.0";
  
  const getRank = (wins: number) => {
    if (wins > 50) return "Grandmaster";
    if (wins > 20) return "Knight";
    if (wins > 5) return "Squire";
    return "Beginner Peasant";
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
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{(session?.user as any)?.username || session?.user?.name || "Knight"}</h2>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>Rank: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{getRank(userStats.battlesWon)}</span></span>
            <span>Battles: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{userStats.battlesTotal}</span></span>
            <span>Wins: <span style={{ color: '#50fa7b', fontWeight: 600 }}>{userStats.battlesWon}</span></span>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <span className="settings-label">Activity Heatmap</span>
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--line)', borderRadius: '0.5rem', padding: '1.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '3px' }}>
              {Array.from({ length: 52 }).map((_, weekIdx) => (
                <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    const level = Math.floor(Math.random() * 5); // Mock activity levels
                    const colors = ['rgba(255,255,255,0.05)', '#0e4429', '#006d32', '#26a641', '#39d353'];
                    return (
                      <div 
                        key={dayIdx} 
                        style={{ 
                          width: '10px', 
                          height: '10px', 
                          background: colors[level], 
                          borderRadius: '2px',
                          transition: 'all 0.2s ease'
                        }} 
                        title={`Activity level: ${level}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Less</span>
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                {['rgba(255,255,255,0.05)', '#0e4429', '#006d32', '#26a641', '#39d353'].map(c => (
                  <div key={c} style={{ width: '10px', height: '10px', background: c, borderRadius: '2px' }} />
                ))}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>More</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Battles Fought</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{userStats.battlesTotal}</div>
        </div>
        <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Win Rate</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{winRate}%</div>
        </div>
        <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Battles Won</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{userStats.battlesWon}</div>
        </div>
      </div>
    </div>
  );
});

ProfileWindow.displayName = "ProfileWindow";
