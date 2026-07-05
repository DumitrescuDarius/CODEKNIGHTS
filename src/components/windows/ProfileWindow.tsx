"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, ShieldCheck, Loader2, Settings, Sword } from "lucide-react";
import { TranslationKey } from "../../constants/translations";
import Link from "next/link";

interface ProfileWindowProps {
  session: any;
  userId?: string;
  t: (key: TranslationKey) => string;
  cachedProfile?: any;
  onInviteDuel?: (targetId: string, name: string) => void;
}

export const ProfileWindow: React.FC<ProfileWindowProps> = React.memo(({ session, userId, t, cachedProfile, onInviteDuel }) => {
  const [profile, setProfile] = useState<any>(cachedProfile || null);
  const [isLoading, setIsLoading] = useState(!cachedProfile);
  const [daysRange, setDaysRange] = useState(180);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedDuel, setExpandedDuel] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const graphRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (graphRef.current) {
      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.scrollLeft = graphRef.current.scrollWidth;
        }
      }, 10);
    }
  }, [daysRange, profile]);

  useEffect(() => {
    if (cachedProfile && (!userId || userId === session?.user?.id)) {
        setProfile(cachedProfile);
        setIsLoading(false);
    }
  }, [cachedProfile, userId, session]);

  useEffect(() => {
    const fetchProfile = () => {
        const targetId = userId || session?.user?.id;
        
        if (cachedProfile && targetId === session?.user?.id) {
            return;
        }

        if (targetId) {
          fetch(`/api/user/profile?userId=${targetId}`)
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
    };

    fetchProfile();

    const handleUpdate = () => {
        if (!cachedProfile || (userId && userId !== session?.user?.id)) {
            fetchProfile();
        }
    };

    window.addEventListener("duel_update_required", handleUpdate);
    // Also listen for general focus events or visibility changes just in case
    window.addEventListener("focus", handleUpdate);

    return () => {
        window.removeEventListener("duel_update_required", handleUpdate);
        window.removeEventListener("focus", handleUpdate);
    };
  }, [userId, session, cachedProfile]);

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: 'var(--accent)' }}>
      <Loader2 size={48} className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} />
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
      <div style={{ fontWeight: 600, letterSpacing: '0.1em' }}>LOADING PROFILE...</div>
    </div>
  );
  if (!profile) return <div style={{ padding: '1rem' }}>Profile not found.</div>;

  const isAdmin = !!profile.isAdmin;
  const rank = profile.rank || "Novice";
  const rating = profile.rating ?? 1000;
  const dailyWins = profile.dailyWins ? (typeof profile.dailyWins === 'string' ? JSON.parse(profile.dailyWins) : profile.dailyWins) : {};

  const getSquareColor = (wins: number) => {
    if (wins === 0) return 'rgba(255,255,255,0.05)';
    if (wins < 2) return '#0e4429';
    if (wins < 5) return '#006d32';
    if (wins < 10) return '#26a641';
    return '#39d353';
  };

  const pastDuels = profile.pastDuels || [];
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysRange);
  
  const filteredDuels = pastDuels.filter((duel: any) => new Date(duel.createdAt) >= cutoffDate);
  
  let currentIterRating = rating;
  const fullRatingHistory = [];
  
  for (const duel of pastDuels) {
     const isHost = duel.hostId === profile.id;
     const change = isHost ? duel.hostRatingChange : duel.guestRatingChange;
     
     fullRatingHistory.push({ 
         rating: currentIterRating, 
         name: new Date(duel.createdAt).toLocaleDateString(), 
         date: new Date(duel.createdAt),
         hideNode: change === 0 || change === null || change === undefined
     });

     if (change !== null && change !== undefined) {
         currentIterRating -= change;
     }
  }
  
  let ratingHistory: any[] = [];
  ratingHistory.push({ rating: rating, name: 'Current', date: new Date(), hideNode: true });
  
  let addedStartNode = false;
  for (const item of fullRatingHistory) {
      if (item.date >= cutoffDate) {
          ratingHistory.push(item);
      } else if (!addedStartNode) {
          ratingHistory.push({ rating: item.rating, name: 'Start', date: cutoffDate, hideNode: true });
          addedStartNode = true;
      }
  }
  
  if (!addedStartNode) {
      const oldestRating = fullRatingHistory.length > 0 ? fullRatingHistory[fullRatingHistory.length - 1].rating : rating;
      ratingHistory.push({ rating: oldestRating, name: 'Start', date: cutoffDate, hideNode: true });
  }

  ratingHistory.reverse();

  // Define padding and inner chart dimensions
  const padding = { top: 15, right: 15, bottom: 25, left: 45 };
  const width = 600;
  const height = 180;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxRating = Math.max(...ratingHistory.map(r => r.rating)) || 1000;
  const minRating = Math.min(...ratingHistory.map(r => r.rating)) || 1000;
  
  // Increase range slightly to avoid dots on the exact top/bottom edges
  const paddedMin = minRating - 20;
  const paddedMax = maxRating + 20;
  const range = (paddedMax - paddedMin) || 100;
  
  const now = new Date().getTime();
  const cut = cutoffDate.getTime();
  const timeRange = Math.max(1, now - cut);
  
  const points = ratingHistory.map((d) => {
     const x = padding.left + ((d.date.getTime() - cut) / timeRange) * chartWidth;
     const y = padding.top + chartHeight - ((d.rating - paddedMin) / range) * chartHeight;
     return `${x},${y}`;
  }).join(' ');

  const getLastMonths = () => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - (daysRange - 1));
    
    const monthsMap = new Map<string, { label: string, days: (Date | null)[] }>();
    
    for (let i = 0; i < daysRange; i++) {
       const d = new Date(startDate);
       d.setDate(startDate.getDate() + i);
       const key = `${d.getFullYear()}-${d.getMonth()}`;
       
       if (!monthsMap.has(key)) {
         const days: (Date | null)[] = [];
         const startDayOfWeek = d.getDay();
         for (let p = 0; p < startDayOfWeek; p++) {
            days.push(null);
         }
         monthsMap.set(key, { 
           label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
           days
         });
       }
       monthsMap.get(key)!.days.push(d);
    }
    return Array.from(monthsMap.values());
  };

  return (
    <div style={{ padding: '2rem', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Profile Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--line)', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {profile.image ? (
            <img src={profile.image} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--accent)' }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={40} /></div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.75rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {profile.username || profile.name || "Knight"}
                {userId && userId !== session?.user?.id && (
                  <span style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: profile.isOnline ? '#50fa7b' : 'var(--text-muted)', 
                    display: 'inline-block',
                    boxShadow: profile.isOnline ? '0 0 10px rgba(80, 250, 123, 0.4)' : 'none',
                    border: '2px solid var(--bg)'
                  }} title={profile.isOnline ? 'Online' : 'Offline'} />
                )}
              </h2>
              {isAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--accent)', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  <ShieldCheck size={12} />
                  ADMIN
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{t("rank")}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem' }}>{rank}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Rating</span>
                  <span style={{ color: '#f1fa8c', fontWeight: 700, fontSize: '1.1rem' }}>{rating}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{t("battlesWon")}</span>
                  <span style={{ color: '#50fa7b', fontWeight: 700, fontSize: '1.1rem' }}>{profile.battlesWon || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {(!userId || userId === session?.user?.id) && (
           <button onClick={() => setIsEditingProfile(!isEditingProfile)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: isEditingProfile ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease' }}
                   onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.background = isEditingProfile ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'; }}>
             <Settings size={16} />
             <span>{isEditingProfile ? "Cancel" : t("configureProfile")}</span>
           </button>
        )}

        {userId && userId !== session?.user?.id && (
           <button onClick={() => onInviteDuel && onInviteDuel(userId, profile.username || profile.name)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#ff5555', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 800, transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(255, 85, 85, 0.3)' }}
                   onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#ff6b6b'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#ff5555'; }}>
             <Sword size={16} fill="currentColor" />
             <span>DUEL!</span>
           </button>
        )}
      </div>

      {isEditingProfile ? (
         <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ margin: 0, color: 'var(--text)', fontSize: '1.25rem' }}>{t("configureProfile")}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Username</label>
                <input type="text" defaultValue={profile.username || profile.name} id="edit-username" style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--text)', padding: '0.75rem', borderRadius: '0.5rem', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Profile Image URL</label>
                <input type="text" defaultValue={profile.image || ''} id="edit-image" style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--text)', padding: '0.75rem', borderRadius: '0.5rem', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button onClick={() => {
                   const username = (document.getElementById('edit-username') as HTMLInputElement).value;
                   const image = (document.getElementById('edit-image') as HTMLInputElement).value;
                   fetch('/api/user/profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username, image })
                   }).then(res => {
                      if (res.ok) {
                         setIsEditingProfile(false);
                         window.dispatchEvent(new Event("duel_update_required")); // triggers a re-fetch
                      } else {
                         res.text().then(text => alert("Failed to update profile: " + text));
                      }
                   });
                }} style={{ padding: '0.75rem 1.5rem', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
            </div>
         </div>
      ) : (
      <>
      {/* Historical Data Wrapper */}
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text)', fontWeight: 800 }}>Historical Data</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
             <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    background: 'rgba(255,255,255,0.02)', 
                    color: 'var(--text)', 
                    border: '1px solid var(--line)', 
                    padding: '0.4rem 1rem', 
                    borderRadius: '0.4rem', 
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Past {daysRange === 365 ? '1 Year' : `${daysRange} Days`}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                {isDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'var(--bg)',
                    border: '1px solid var(--line)',
                    borderRadius: '0.4rem',
                    padding: '0.25rem',
                    zIndex: 50,
                    minWidth: '140px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}>
                    {[90, 180, 365].map(days => (
                      <div 
                        key={days}
                        onClick={() => { setDaysRange(days); setIsDropdownOpen(false); }}
                        style={{
                          padding: '0.4rem 0.8rem',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          borderRadius: '0.2rem',
                          background: daysRange === days ? 'var(--line)' : 'transparent',
                          color: 'var(--text)'
                        }}
                        onMouseEnter={(e) => {
                          if (daysRange !== days) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          if (daysRange !== days) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        Past {days === 365 ? '1 Year' : `${days} Days`}
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          {/* Activity Grid */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text)' }}>Activity Graph</h3>
          
          <div ref={graphRef} style={{ display: 'flex', gap: '2.5rem', width: '100%', overflowX: 'auto', paddingBottom: '0.5rem', scrollBehavior: 'smooth' }}>
            {getLastMonths().map(month => (
              <div key={month.label} style={{ display: 'flex', flexDirection: 'column', minWidth: 'max-content' }}>
                 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{month.label}</span>
                 <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', gap: '4px' }}>
                    {month.days.map((d, i) => {
                       if (!d) return <div key={`empty-${i}`} style={{ width: '12px', height: '12px' }} />;
                       const dateStr = d.toLocaleDateString('en-CA');
                       const w = dailyWins[dateStr] || 0;
                       return <div key={`day-${i}`} title={`${dateStr}: ${w} wins`} style={{ width: '12px', height: '12px', background: getSquareColor(w), borderRadius: '2px' }} />
                    })}
                 </div>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Less
            <div style={{ width: '12px', height: '12px', background: getSquareColor(0), borderRadius: '2px' }} />
            <div style={{ width: '12px', height: '12px', background: getSquareColor(1), borderRadius: '2px' }} />
            <div style={{ width: '12px', height: '12px', background: getSquareColor(3), borderRadius: '2px' }} />
            <div style={{ width: '12px', height: '12px', background: getSquareColor(8), borderRadius: '2px' }} />
            <div style={{ width: '12px', height: '12px', background: getSquareColor(15), borderRadius: '2px' }} />
            More
          </div>
          </div>

          {/* Rating Chart */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text)' }}>Rating History</h3>
          {ratingHistory.length > 1 ? (
            <div style={{ width: '100%', overflowX: 'auto', padding: '1rem 0' }}>
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ minWidth: '400px', overflow: 'visible' }}>
                    {/* Y-axis Labels & Horizontal Grid lines */}
                    {[0, 0.5, 1].map(ratio => {
                        const yPos = padding.top + chartHeight * ratio;
                        const ratingVal = Math.round(paddedMax - range * ratio);
                        return (
                            <g key={ratio}>
                                <text x={padding.left - 10} y={yPos} fill="var(--text-muted)" fontSize="10" textAnchor="end" dominantBaseline="middle">
                                    {ratingVal}
                                </text>
                                <line x1={padding.left} y1={yPos} x2={width - padding.right} y2={yPos} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                            </g>
                        );
                    })}

                    <polyline fill="none" stroke="var(--accent)" strokeWidth="3" points={points} style={{ strokeLinejoin: "round", strokeLinecap: "round" }} />
                    
                    {ratingHistory.map((d, i) => {
                        const x = padding.left + ((d.date.getTime() - cut) / timeRange) * chartWidth;
                        const y = padding.top + chartHeight - ((d.rating - paddedMin) / range) * chartHeight;
                        const showLabel = i === 0 || i === ratingHistory.length - 1 || ratingHistory.length < 8 || i % Math.ceil(ratingHistory.length / 5) === 0;
                        return (
                            <g key={i}>
                                {showLabel && (
                                    <text x={x} y={height - 5} fill="var(--text-muted)" fontSize="9" textAnchor="middle">
                                        {d.name === 'Current' ? 'Now' : d.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </text>
                                )}
                                {!d.hideNode && (
                                    <g style={{ transition: 'all 0.3s ease' }} className="chart-node">
                                        <circle cx={x} cy={y} r="5" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2" />
                                        <circle cx={x} cy={y} r="12" fill="transparent" style={{ cursor: 'pointer' }}>
                                            <title>{d.name}: {d.rating}</title>
                                        </circle>
                                    </g>
                                )}
                            </g>
                        )
                    })}
                </svg>
                <style>{`
                  .chart-node:hover circle:first-child { r: 7px; fill: var(--accent); }
                `}</style>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Not enough data for graph</div>
          )}
          </div>
        </div>

        {/* Past Battles */}
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text)' }}>Past Battles</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[...filteredDuels].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((duel: any) => {
              const isHost = duel.hostId === profile.id;
              const change = isHost ? duel.hostRatingChange : duel.guestRatingChange;
              const won = change > 0;
              const isDraw = change === 0;
              const opponent = isHost ? duel.guest : duel.host;
              
              return (
                <div key={duel.id} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', borderRadius: '0.5rem', transition: 'transform 0.2s ease', cursor: 'pointer' }}
                     onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                     onClick={() => setExpandedDuel(expandedDuel === duel.id ? null : duel.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text)' }}>{duel.question?.title || "Unknown Problem"}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        vs 
                        {opponent?.image && <img src={opponent.image} alt="opponent" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />}
                        <span style={{ color: 'var(--accent)' }}>{opponent?.username || opponent?.name || "Unknown"}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, fontSize: '1.1rem', color: won ? '#50fa7b' : (isDraw ? 'var(--text-muted)' : '#ff5555') }}>
                        {won ? "VICTORY" : (isDraw ? "DRAW" : "DEFEAT")}
                      </div>
                      {duel.finishReason && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.1rem' }}>
                              {duel.finishReason}
                          </div>
                      )}
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: change >= 0 ? '#50fa7b' : '#ff5555' }}>
                        {change >= 0 ? `+${change}` : change}
                      </div>
                    </div>
                  </div>
                  
                  {expandedDuel === duel.id && (
                    <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--line)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ background: 'var(--bg)', borderRadius: '0.5rem', border: '1px solid var(--line)', overflow: 'hidden' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, borderBottom: '1px solid var(--line)', color: 'var(--text)' }}>Your Code</div>
                                <pre style={{ margin: 0, padding: '1rem', overflowX: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', maxHeight: '200px' }}>
                                    {isHost ? (duel.hostCode || 'No code submitted') : (duel.guestCode || 'No code submitted')}
                                </pre>
                            </div>
                            <div style={{ background: 'var(--bg)', borderRadius: '0.5rem', border: '1px solid var(--line)', overflow: 'hidden' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, borderBottom: '1px solid var(--line)', color: 'var(--text)' }}>{opponent?.username || opponent?.name || "Opponent"}&apos;s Code</div>
                                <pre style={{ margin: 0, padding: '1rem', overflowX: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', maxHeight: '200px' }}>
                                    {isHost ? (duel.guestCode || 'No code submitted') : (duel.hostCode || 'No code submitted')}
                                </pre>
                            </div>
                        </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredDuels.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No past battles found in this timeframe.</div>}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
});

ProfileWindow.displayName = "ProfileWindow";
