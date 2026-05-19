"use client";

import React, { useState, useEffect } from "react";
import { User, ShieldCheck } from "lucide-react";
import { TranslationKey } from "../../constants/translations";

interface OtherProfileWindowProps {
  userId: string;
  t: (key: TranslationKey) => string;
}

export const OtherProfileWindow: React.FC<OtherProfileWindowProps> = React.memo(({ userId, t }) => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, [userId]);

  if (isLoading) return <div style={{ padding: '1rem' }}>Loading...</div>;
  if (!profile) return <div style={{ padding: '1rem' }}>Profile not found.</div>;

  const dailyWins = profile.dailyWins ? (typeof profile.dailyWins === 'string' ? JSON.parse(profile.dailyWins) : profile.dailyWins) : {};

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
            {profile.isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--accent)', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                <ShieldCheck size={12} />
                ADMIN
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>{t("rank")}: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{profile.rank || "Novice"}</span></span>
            <span>Rating: <span style={{ color: '#f1fa8c', fontWeight: 600 }}>{profile.rating ?? 1000}</span></span>
            <span>{t("battlesWon")}: <span style={{ color: '#50fa7b', fontWeight: 600 }}>{profile.battlesWon}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
});

OtherProfileWindow.displayName = "OtherProfileWindow";
