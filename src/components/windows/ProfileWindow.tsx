"use client";

import React, { useState, useEffect } from "react";
import { User, ShieldCheck } from "lucide-react";
import { TranslationKey } from "../../constants/translations";

interface ProfileWindowProps {
  session: any;
  userId?: string;
  t: (key: TranslationKey) => string;
}

export const ProfileWindow: React.FC<ProfileWindowProps> = React.memo(({ session, userId, t }) => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetch(`/api/user/profile?id=${userId}`)
        .then(res => res.json())
        .then(data => {
            setProfile(data);
            setIsLoading(false);
        })
        .catch(err => {
            console.error("Failed to load profile:", err);
            setIsLoading(false);
        });
    } else {
      setProfile(session?.user);
      setIsLoading(false);
    }
  }, [userId, session]);

  if (isLoading) return <div style={{ padding: '1rem' }}>Loading...</div>;
  if (!profile) return <div style={{ padding: '1rem' }}>Profile not found.</div>;

  const isAdmin = !!profile.isAdmin;
  const rank = profile.rank || "Novice";
  const rating = profile.rating ?? 1000;
  const dailyWins = profile.dailyWins ? (typeof profile.dailyWins === 'string' ? JSON.parse(profile.dailyWins) : profile.dailyWins) : {};

  const getTodayWins = () => {
    const today = new Date().toLocaleDateString('en-CA');
    return dailyWins[today] || 0;
  };

  const getSquareColor = (wins: number) => {
    if (wins === 0) return 'rgba(255,255,255,0.05)';
    if (wins < 2) return '#0e4429';
    if (wins < 5) return '#006d32';
    if (wins < 10) return '#26a641';
    return '#39d353';
  };

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        {profile.image ? (
          <img src={profile.image} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--accent)' }} />
        ) : (
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={40} /></div>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{profile.username || profile.name || "Knight"}</h2>
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
            <span>{t("battlesWon")}: <span style={{ color: '#50fa7b', fontWeight: 600 }}>{profile.battlesWon || 0}</span></span>
            <span>Wins Today: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{getTodayWins()}</span></span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>Duel Activity</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', width: '100%' }}>
          {Array.from({ length: 28 }).map((_, i) => {
             const date = new Date();
             date.setDate(date.getDate() - (27 - i));
             const dateStr = date.toLocaleDateString('en-CA');
             const w = dailyWins[dateStr] || 0;
             return <div key={i} title={`${dateStr}: ${w} wins`} style={{ width: '100%', aspectRatio: '1', background: getSquareColor(w), borderRadius: '1px' }} />
          })}
        </div>
      </div>
    </div>
  );
});

ProfileWindow.displayName = "ProfileWindow";
