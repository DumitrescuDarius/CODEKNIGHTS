"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, UserCheck, Loader2, Users, Trophy, UserX, Check, User as UserIcon, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
// framer-motion removed: use plain elements instead
import { User } from "../../types";
import { TranslationKey } from "../../constants/translations";
import { DefaultAvatar } from "../DefaultAvatar";
import { WindowSpinner } from "../WindowSpinner";

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
}

interface FriendsWindowProps {
  t: (key: TranslationKey) => string;
  openProfile: (userId: string) => void;
  cachedFriends?: User[];
  cachedRequests?: User[];
  onlineUsers?: Set<string>;
  onInviteDuel?: (userId: string, username: string, config?: any) => void;
  pendingInviteTargetId?: string | null;
  onCancelInvite?: () => void;
}

const getRankClass = (rank: string | undefined) => {
  if (!rank) return "bronze";
  const r = rank.toLowerCase();
  if (r.includes("grandmaster")) return "grandmaster";
  if (r.includes("master")) return "master";
  if (r.includes("diamond")) return "diamond";
  if (r.includes("gold")) return "gold";
  if (r.includes("silver")) return "silver";
  return "bronze";
};

export const FriendsWindow: React.FC<FriendsWindowProps> = React.memo(({ t, openProfile, cachedFriends, cachedRequests, onlineUsers, onInviteDuel, pendingInviteTargetId, onCancelInvite }) => {
  const [activeTab, setActiveTab] = useState<"friends" | "find" | "requests">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>(cachedFriends || []);
  const [requests, setRequests] = useState<User[]>(cachedRequests || []);
  const [isLoading, setIsLoading] = useState(!cachedFriends || !cachedRequests);
  const [unfriendConfirm, setUnfriendConfirm] = useState<User | null>(null);
  const [inviteFlowTarget, setInviteFlowTarget] = useState<User | null>(null);
  const [inviteFlowStep, setInviteFlowStep] = useState<'MODE' | 'CONFIG' | null>(null);
  const [inviteConfig, setInviteConfig] = useState({ gameMode: "CODEKNIGHTS" });
  const [uplinkProblems, setUplinkProblems] = useState<string[]>([]);
  const [draggedProblemIndex, setDraggedProblemIndex] = useState<number | null>(null);
  const [uplinkIsRanked, setUplinkIsRanked] = useState(true);

  const moveUplinkProblem = useCallback((idx: number, dir: 'up' | 'down') => {
    setUplinkProblems(prev => {
      if (dir === 'up' && idx > 0) {
        const next = [...prev];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        return next;
      }
      if (dir === 'down' && idx < prev.length - 1) {
        const next = [...prev];
        [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
        return next;
      }
      return prev;
    });
  }, []);
  const removeFriendConfirmText = unfriendConfirm
    ? t("removeFriendConfirm").replace("{name}", unfriendConfirm.username || unfriendConfirm.name || "this user")
    : "";

  const fetchData = useCallback(async (force = false) => {
    if (cachedFriends && cachedRequests && !force) return;
    setIsLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch("/api/user/friends"),
        fetch("/api/user/requests")
      ]);
      if (friendsRes.ok) setFriends(await friendsRes.json());
      if (requestsRes.ok) setRequests(await requestsRes.json());
      if (force) window.dispatchEvent(new Event("friends_update_required"));
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [cachedFriends, cachedRequests]);

  useEffect(() => {
    if (cachedFriends) setFriends(cachedFriends);
    if (cachedRequests) setRequests(cachedRequests);
  }, [cachedFriends, cachedRequests]);

  useEffect(() => {
    fetchData();
    
    const handleAiRequest = (e: any) => {
      if (e.detail === "friends") {
        const content = friends.length > 0 
          ? friends.map(f => `- ${f.username || f.name} (Rank: ${f.rank || 'Unknown'}, ELO: ${f.rating || 1000})`).join("\n") 
          : "You have no friends currently.";
        
        const requestsContent = requests.length > 0 
          ? "\n\nPending Requests:\n" + requests.map(f => `- ${f.username || f.name}`).join("\n")
          : "";
          
        window.dispatchEvent(new CustomEvent('add_ai_context', {
          detail: {
            id: "friends-list",
            title: "Friends List",
            content: "Current Friends:\n" + content + requestsContent
          }
        }));
      }
    };
    
    window.addEventListener("request_ai_context", handleAiRequest);
    return () => window.removeEventListener("request_ai_context", handleAiRequest);
  }, [fetchData, friends, requests]);

  const searchUsers = async (query: string, signal: AbortSignal) => {
    if (query.length < 2) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/user/search?q=${encodeURIComponent(query)}`, { signal });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce((query: string, signal: AbortSignal) => searchUsers(query, signal), 100), []);

  useEffect(() => {
    const controller = new AbortController();
    if (activeTab === 'find') {
      if (searchQuery.length >= 2) {
        setIsLoading(true);
      } else {
        setIsLoading(false);
      }
      debouncedSearch(searchQuery, controller.signal);
    } else {
      debouncedSearch.cancel();
      setSearchResults([]);
    }
    return () => controller.abort();
  }, [searchQuery, debouncedSearch, activeTab]);

  const handleRequestAction = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
    // Optimistic Update
    const requestItem = requests.find((r: any) => r.requestId === requestId);
    setRequests(prev => prev.filter((r: any) => r.requestId !== requestId));
    if (action === 'ACCEPT' && requestItem) {
      setFriends(prev => [...prev, requestItem]);
    }
    setSearchResults(prev => prev.map(u => (u as any).requestId === requestId ? { ...u, status: action === 'ACCEPT' ? 'FRIENDS' : 'NONE', requestId: undefined } as any : u));
    try {
      await fetch('/api/user/request/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });
      fetchData(true);
    } catch (err) {
      console.error("Error processing request:", err);
      fetchData(true);
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    // Optimistic Update
    setSearchResults(prev => prev.map(u => u.id === targetUserId ? { ...u, status: "SENT" } as any : u));
    try {
      await fetch('/api/user/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });
      fetchData(true);
    } catch (err) {
      console.error("Error sending request:", err);
      fetchData(true);
    }
  };

  const handleUnfriend = async (targetId: string) => {
    // Optimistic Update
    setUnfriendConfirm(null);
    setFriends(prev => prev.filter(f => f.id !== targetId));
    setSearchResults(prev => prev.map(u => u.id === targetId ? { ...u, status: "NONE" } as any : u));
    try {
      await fetch('/api/user/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId })
      });
      fetchData(true);
    } catch (err) {
      console.error(err);
      fetchData(true);
    }
  };

  const isInitialLoading = isLoading && friends.length === 0 && requests.length === 0;

  return (
    <div className="friends-window" style={{ position: 'relative' }}>
      {isInitialLoading && <WindowSpinner message={t("loading") || "LOADING..."} />}
      <div className="friends-header-info">
        <div className="friends-header-title">
          <Users size={18} style={{ color: "var(--accent)" }} />
          <span>{t("friendsList") || "FRIENDS"}</span>
        </div>
        <div className="friends-header-subtitle">
          {t("friendsListSubtitle") || "Manage your alliances and search players"}
        </div>
      </div>

      <div className="friends-tabs">
        <div className={`friends-tab ${activeTab === 'friends' ? 'friends-tab--active' : ''}`} onClick={() => setActiveTab('friends')}>
          <Users size={14} />
          <span>{t("friends")}</span>
        </div>
        <div className={`friends-tab ${activeTab === 'requests' ? 'friends-tab--active' : ''}`} onClick={() => setActiveTab('requests')}>
          <UserPlus size={14} />
          <span>{t("requests") || "Requests"}</span>
          {requests.length > 0 && <span className="friends-badge-count">{requests.length}</span>}
        </div>
        <div className={`friends-tab ${activeTab === 'find' ? 'friends-tab--active' : ''}`} onClick={() => setActiveTab('find')}>
          <Search size={14} />
          <span>{t("searchUsers")}</span>
        </div>
      </div>

      <div className="friends-content">
        {activeTab === 'find' && (
          <div className="friends-search-bar" style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="friends-search-input" />
            {isLoading && (
              <div 
                className="loading-spinner" 
                style={{ 
                  position: 'absolute', 
                  right: '1rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '14px', 
                  height: '14px',
                  borderWidth: '1.5px'
                }} 
              />
            )}
          </div>
        )}

        <div className="friends-grid">
            {activeTab === 'friends' && friends.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 2rem' }}>
                <Users size={36} style={{ marginBottom: '1rem', opacity: 0.4, color: 'var(--accent)' }} />
                <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>{t("noFriendsAdded")}</p>
              </div>
            )}
            {activeTab === 'friends' && friends.map(user => (
              <div key={user.id} className={`friend-card friend-card--${getRankClass(user.rank)}`}>
                <div className="friend-card-header">
                  <div className="friend-avatar-wrapper">
                    <DefaultAvatar 
                      name={user.username || user.name || "Knight"} 
                      size={36} 
                      image={user.image}
                      isRoyal={!!user.isRoyal}
                      style={{ border: `1px solid var(--rank-${getRankClass(user.rank)})` }}
                    />
                    {onlineUsers?.has(user.id) && <div className="friend-status-dot" />}
                  </div>
                  <div className="friend-meta">
                    <div className="friend-username" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {user.username || user.name || "Unknown"}
                    </div>
                    <div className={`friend-rank rank--${getRankClass(user.rank)}`}>{user.rank || "Novice"}</div>
                    <div className="friend-rating">
                      <Trophy size={10} style={{ color: 'var(--text-muted)' }} />
                      <span>{user.rating ?? 1000} ELO</span>
                    </div>
                  </div>
                </div>
                <div className="friend-stats">
                  <div className="friend-stat-item">
                    <span className="friend-stat-val">
                      {Math.round(((user.battlesWon || 0) / (user.battlesTotal || 1)) * 100)}%
                    </span>
                    <span className="friend-stat-lbl">{t("winRate")}</span>
                  </div>
                  <div className="friend-stat-item">
                    <span className="friend-stat-val">{user.battlesWon || 0}</span>
                    <span className="friend-stat-lbl">{t("battlesWon")}</span>
                  </div>
                  <div className="friend-stat-item">
                    <span className="friend-stat-val">{user.battlesTotal || 0}</span>
                    <span className="friend-stat-lbl">{t("battlesFought")}</span>
                  </div>
                </div>
                <div className="friend-card-actions">
                  <button className="friend-btn" onClick={() => openProfile(user.id)}>{t("view")}</button>
                  {pendingInviteTargetId === user.id ? (
                    <button className="friend-btn friend-btn--danger" style={{ background: 'transparent', border: '1px solid #ff5555' }} onClick={() => onCancelInvite && onCancelInvite()}>{t("cancelInvite") || t("cancel")}</button>
                  ) : (
                    <button className="friend-btn friend-btn--danger" onClick={() => { setInviteFlowTarget(user); setInviteFlowStep('MODE'); setUplinkProblems([]); }}>{t("duelBtn")}</button>
                  )}
                  <button className="friend-btn friend-btn--danger friend-btn--icon" onClick={() => setUnfriendConfirm(user)} title={t("unfriend")}>
                    <UserX size={14} />
                  </button>
                </div>
              </div>
            ))}

            {activeTab === 'requests' && requests.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 2rem' }}>
                <UserCheck size={36} style={{ marginBottom: '1rem', opacity: 0.4, color: 'var(--accent)' }} />
                <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>{t("noPendingRequests")}</p>
              </div>
            )}
            {activeTab === 'requests' && requests.map((user: any) => (
              <div key={user.id} className={`friend-card friend-card--${getRankClass(user.rank)}`}>
                <div className="friend-card-header">
                  <div className="friend-avatar-wrapper">
                    <DefaultAvatar 
                      name={user.username || user.name || "Knight"} 
                      size={36} 
                      image={user.image}
                      isRoyal={!!user.isRoyal}
                      style={{ border: `1px solid var(--rank-${getRankClass(user.rank)})` }}
                    />
                    {onlineUsers?.has(user.id) && <div className="friend-status-dot" />}
                  </div>
                  <div className="friend-meta">
                    <div className="friend-username" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {user.username || user.name || "Unknown"}
                    </div>
                    <div className={`friend-rank rank--${getRankClass(user.rank)}`}>{user.rank || "Novice"}</div>
                    <div className="friend-rating">
                      <Trophy size={10} style={{ color: 'var(--text-muted)' }} />
                      <span>{user.rating ?? 1000} ELO</span>
                    </div>
                  </div>
                </div>
                <div className="friend-stats">
                  <div className="friend-stat-item">
                    <span className="friend-stat-val">
                      {Math.round(((user.battlesWon || 0) / (user.battlesTotal || 1)) * 100)}%
                    </span>
                    <span className="friend-stat-lbl">{t("winRate")}</span>
                  </div>
                  <div className="friend-stat-item">
                    <span className="friend-stat-val">{user.battlesWon || 0}</span>
                    <span className="friend-stat-lbl">{t("battlesWon")}</span>
                  </div>
                  <div className="friend-stat-item">
                    <span className="friend-stat-val">{user.battlesTotal || 0}</span>
                    <span className="friend-stat-lbl">{t("battlesFought")}</span>
                  </div>
                </div>
                <div className="friend-card-actions">
                  <button className="friend-btn friend-btn--success" onClick={() => handleRequestAction(user.requestId, 'ACCEPT')}><Check size={14}/> {t("accept")}</button>
                  <button className="friend-btn friend-btn--danger" onClick={() => handleRequestAction(user.requestId, 'REJECT')}><UserX size={14}/> {t("reject")}</button>
                </div>
              </div>
            ))}

            {activeTab === 'find' && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 2rem' }}>
                <Search size={36} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>{t("noUsersFoundSearch")}</p>
              </div>
            )}
            {activeTab === 'find' && searchQuery.length < 2 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 2rem' }}>
                <Search size={36} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>{t("typeToSearch")}</p>
              </div>
            )}
            {activeTab === 'find' && searchQuery.length >= 2 && searchResults.map((user: any) => (
              <div key={user.id} className={`friend-card friend-card--${getRankClass(user.rank)}`}>
                <div className="friend-card-header">
                  <div className="friend-avatar-wrapper">
                    <DefaultAvatar 
                      name={user.username || user.name || "Knight"} 
                      size={36} 
                      image={user.image}
                      isRoyal={!!user.isRoyal}
                      style={{ border: `1px solid var(--rank-${getRankClass(user.rank)})` }}
                    />
                    {onlineUsers?.has(user.id) && <div className="friend-status-dot" />}
                  </div>
                  <div className="friend-meta">
                    <div className="friend-username" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {user.username || user.name || "Unknown"}
                    </div>
                    <div className={`friend-rank rank--${getRankClass(user.rank)}`}>{user.rank || "Novice"}</div>
                    <div className="friend-rating">
                      <Trophy size={10} style={{ color: 'var(--text-muted)' }} />
                      <span>{user.rating ?? 1000} ELO</span>
                    </div>
                  </div>
                </div>
                <div className="friend-stats">
                  <div className="friend-stat-item">
                    <span className="friend-stat-val">
                      {Math.round(((user.battlesWon || 0) / (user.battlesTotal || 1)) * 100)}%
                    </span>
                    <span className="friend-stat-lbl">{t("winRate")}</span>
                  </div>
                  <div className="friend-stat-item">
                    <span className="friend-stat-val">{user.battlesWon || 0}</span>
                    <span className="friend-stat-lbl">{t("battlesWon")}</span>
                  </div>
                  <div className="friend-stat-item">
                    <span className="friend-stat-val">{user.battlesTotal || 0}</span>
                    <span className="friend-stat-lbl">{t("battlesFought")}</span>
                  </div>
                </div>
                <div className="friend-card-actions">
                  <button className="friend-btn" onClick={() => openProfile(user.id)}>{t("view")}</button>
                  {user.status === "FRIENDS" ? (
                    <button disabled className="friend-btn friend-btn--success">
                      <Check size={12}/> {t("friends")}
                    </button>
                  ) : user.status === "SENT" ? (
                    <button disabled className="friend-btn">
                      {t("pending")}
                    </button>
                  ) : user.status === "RECEIVED" ? (
                    <>
                      <button className="friend-btn friend-btn--success" onClick={() => handleRequestAction(user.requestId, 'ACCEPT')} title={t("accept")}><Check size={14}/></button>
                      <button className="friend-btn friend-btn--danger" onClick={() => handleRequestAction(user.requestId, 'REJECT')} title={t("reject")}><UserX size={14}/></button>
                    </>
                  ) : (
                    <button onClick={() => handleSendRequest(user.id)} className="friend-btn friend-btn--success">
                      <UserPlus size={12}/> {t("follow")}
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {unfriendConfirm && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg)', padding: '2rem', borderRadius: '0.4rem', border: '1px solid var(--accent)', maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>{t("removeFriendTitle") || t("removeFriend")}</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>{removeFriendConfirmText}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="twm-btn" onClick={() => setUnfriendConfirm(null)}>{t("cancel")}</button>
              <button className="twm-btn twm-btn-primary" style={{ background: '#ff5555', color: '#fff', border: 'none' }} onClick={() => handleUnfriend(unfriendConfirm.id)}>{t("removeBtn") || t("remove")}</button>
            </div>
          </div>
        </div>
      )}

      {inviteFlowTarget && inviteFlowStep === 'MODE' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg)', padding: '2rem', borderRadius: '0.6rem', border: '1px solid var(--line)', width: '400px', maxWidth: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text)' }}>Select Game Mode</h3>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Challenge <strong style={{ color: 'var(--accent)' }}>{inviteFlowTarget.username || inviteFlowTarget.name || "Knight"}</strong></p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <button 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.2rem', 
                  background: 'color-mix(in srgb, var(--bg) 92%, white)', 
                  border: '2px solid transparent', borderRadius: '0.5rem', 
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#38bdf8';
                  e.currentTarget.style.background = 'color-mix(in srgb, var(--bg) 88%, white)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.background = 'color-mix(in srgb, var(--bg) 92%, white)';
                }}
                onClick={() => {
                  setInviteConfig({ ...inviteConfig, gameMode: "CODEKNIGHTS" });
                  setInviteFlowStep('CONFIG');
                }}
              >
                <div style={{ fontSize: '2.5rem', color: '#38bdf8', filter: 'drop-shadow(0 4px 6px rgba(56,189,248,0.2))', display: 'flex', alignItems: 'center' }}><i className="nf nf-fa-chess_knight"></i></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)', letterSpacing: '0.05em' }}>
                    CODE<span style={{ color: '#38bdf8' }}>KNIGHTS</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Standard 1v1 Algorithm Battle</span>
                </div>
              </button>

              <button 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.2rem', 
                  background: 'color-mix(in srgb, var(--bg) 92%, white)', 
                  border: '2px solid transparent', borderRadius: '0.5rem', 
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#50fa7b';
                  e.currentTarget.style.background = 'color-mix(in srgb, var(--bg) 88%, white)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.background = 'color-mix(in srgb, var(--bg) 92%, white)';
                }}
                onClick={() => {
                  setInviteConfig({ ...inviteConfig, gameMode: "BUGHUNTER" });
                  setInviteFlowStep('CONFIG');
                }}
              >
                <div style={{ fontSize: '2.5rem', color: '#50fa7b', filter: 'drop-shadow(0 4px 6px rgba(80,250,123,0.2))', display: 'flex', alignItems: 'center' }}><i className="nf nf-fa-bug"></i></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)', letterSpacing: '0.05em' }}>
                    BUG<span style={{ color: '#50fa7b' }}>HUNTER</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fix Broken Code Before the Enemy</span>
                </div>
              </button>

              <button 
                disabled
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.2rem', 
                  background: 'color-mix(in srgb, var(--bg) 92%, white)', 
                  border: '2px solid transparent', borderRadius: '0.5rem', 
                  cursor: 'not-allowed', textAlign: 'left', opacity: 0.5, position: 'relative'
                }}
              >
                <div style={{ fontSize: '2.5rem', color: '#ffb86c', display: 'flex', alignItems: 'center' }}><i className="nf nf-fa-coins"></i></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)', letterSpacing: '0.05em' }}>
                    HACK<span style={{ color: '#ffb86c' }}>BOUNTY</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Exploit Code Vulnerabilities</span>
                </div>
                <div style={{ position: 'absolute', right: '1rem', top: '1rem', background: '#ffb86c', color: '#000', fontSize: '0.6rem', fontWeight: 900, padding: '0.2rem 0.5rem', borderRadius: '0.2rem' }}>WIP</div>
              </button>

              <button 
                disabled
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.2rem', 
                  background: 'color-mix(in srgb, var(--bg) 92%, white)', 
                  border: '2px solid transparent', borderRadius: '0.5rem', 
                  cursor: 'not-allowed', textAlign: 'left', opacity: 0.5, position: 'relative'
                }}
              >
                <div style={{ fontSize: '2.5rem', color: '#bd93f9', display: 'flex', alignItems: 'center' }}><i className="nf nf-fa-hat_wizard"></i></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)', letterSpacing: '0.05em' }}>
                    ML<span style={{ color: '#bd93f9' }}>MAGES</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Train Models & Optimize Accuracy</span>
                </div>
                <div style={{ position: 'absolute', right: '1rem', top: '1rem', background: '#bd93f9', color: '#000', fontSize: '0.6rem', fontWeight: 900, padding: '0.2rem 0.5rem', borderRadius: '0.2rem' }}>WIP</div>
              </button>
            </div>

            <button 
              className="friend-btn" 
              style={{ marginTop: '0.5rem', padding: '0.8rem', fontWeight: 800 }} 
              onClick={() => {
                setInviteFlowTarget(null);
                setInviteFlowStep(null);
                setUplinkProblems([]);
              }}
            >
              {t("cancel") || "CANCEL"}
            </button>
          </div>
        </div>
      )}

      {inviteFlowTarget && inviteFlowStep === 'CONFIG' && (() => {
        const themeColor = inviteConfig.gameMode === "BUGHUNTER" ? "#50fa7b" : "#ffb86c";
        const calculatedUplinkTime = uplinkProblems.reduce((sum, diff) => {
          if (inviteConfig.gameMode === "BUGHUNTER") return sum + 8;
          return sum + (diff === 'EASY' ? 5 : diff === 'MEDIUM' ? 9 : 14);
        }, 0);

        return (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--bg)', padding: '1.5rem', borderRadius: '0.4rem', border: '1px solid var(--line)', width: '480px', maxWidth: '90%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, textAlign: 'center', color: 'var(--text)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                CONFIGURE {inviteConfig.gameMode === "BUGHUNTER" ? "BUG HUNTER" : "CODE KNIGHTS"} MATCH
              </h2>
              <p style={{ margin: '-0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Versus {inviteFlowTarget.username || inviteFlowTarget.name || "Knight"}</p>
              
              {/* Added Problems List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>SELECTED PROBLEMS QUEUE</label>
                {uplinkProblems.length === 0 ? (
                  <div style={{ padding: '1rem', border: '1px dashed var(--line)', borderRadius: '0.4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No problems selected. Add some below!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {uplinkProblems.map((p, idx) => (
                      <div 
                        key={idx} 
                        draggable
                        onDragStart={(e) => {
                          setDraggedProblemIndex(idx);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', idx.toString());
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedProblemIndex !== null && draggedProblemIndex !== idx) {
                            const updated = [...uplinkProblems];
                            const [moved] = updated.splice(draggedProblemIndex, 1);
                            updated.splice(idx, 0, moved);
                            setUplinkProblems(updated);
                          }
                          setDraggedProblemIndex(null);
                        }}
                        onDragEnd={() => setDraggedProblemIndex(null)}
                        style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                          background: draggedProblemIndex === idx ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)', 
                          border: '1px solid var(--line)', borderRadius: '0.4rem', padding: '0.5rem 0.75rem',
                          cursor: 'grab', opacity: draggedProblemIndex === idx ? 0.5 : 1
                        }}
                      >
                        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: inviteConfig.gameMode === "BUGHUNTER" ? '#50fa7b' : p === 'EASY' ? '#50fa7b' : p === 'MEDIUM' ? '#ffb86c' : '#bd93f9' }}>
                          {idx + 1}. {p} (+{inviteConfig.gameMode === "BUGHUNTER" ? 8 : p === 'EASY' ? 5 : p === 'MEDIUM' ? 9 : 14} mins)
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => moveUplinkProblem(idx, 'up')}
                            disabled={idx === 0}
                            style={{ background: 'transparent', border: 'none', color: idx === 0 ? 'rgba(255,255,255,0.07)' : 'var(--accent)', cursor: idx === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem', borderRadius: '0.25rem', transition: 'all 0.15s ease' }}
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => moveUplinkProblem(idx, 'down')}
                            disabled={idx === uplinkProblems.length - 1}
                            style={{ background: 'transparent', border: 'none', color: idx === uplinkProblems.length - 1 ? 'rgba(255,255,255,0.07)' : 'var(--accent)', cursor: idx === uplinkProblems.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem', borderRadius: '0.25rem', transition: 'all 0.15s ease' }}
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            onClick={() => setUplinkProblems(prev => prev.filter((_, i) => i !== idx))}
                            style={{ background: 'transparent', border: 'none', color: '#ff5555', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem', borderRadius: '0.25rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Problem Blocks Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>ADD PROBLEM BLOCK</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {inviteConfig.gameMode === "BUGHUNTER" ? (
                    (["PYTHON", "CPP", "C", "JAVA"] as string[]).map(l => (
                      <button
                        key={l}
                        disabled={uplinkProblems.length >= 5}
                        onClick={() => setUplinkProblems(prev => prev.length < 5 ? [...prev, l] : prev)}
                        style={{
                          flex: '1 1 90px', padding: '0.6rem 0.25rem', borderRadius: '0.4rem',
                          border: '1px solid rgba(80, 250, 123, 0.3)', background: 'rgba(80, 250, 123, 0.05)',
                          color: '#50fa7b', fontWeight: 900, fontSize: '0.75rem',
                          cursor: uplinkProblems.length >= 5 ? 'not-allowed' : 'pointer',
                          opacity: uplinkProblems.length >= 5 ? 0.3 : 1, transition: 'background 0.2s'
                        }}
                      >
                        + {l} (+8m)
                      </button>
                    ))
                  ) : (
                    <>
                      <button
                        disabled={uplinkProblems.length >= 5}
                        onClick={() => setUplinkProblems(prev => prev.length < 5 ? [...prev, 'EASY'] : prev)}
                        style={{ flex: 1, padding: '0.6rem 0.25rem', borderRadius: '0.4rem', border: '1px solid rgba(80, 250, 123, 0.3)', background: 'rgba(80, 250, 123, 0.05)', color: '#50fa7b', fontWeight: 900, fontSize: '0.75rem', cursor: uplinkProblems.length >= 5 ? 'not-allowed' : 'pointer', opacity: uplinkProblems.length >= 5 ? 0.3 : 1 }}
                      >
                        + EASY (+5m)
                      </button>
                      <button
                        disabled={uplinkProblems.length >= 5}
                        onClick={() => setUplinkProblems(prev => prev.length < 5 ? [...prev, 'MEDIUM'] : prev)}
                        style={{ flex: 1, padding: '0.6rem 0.25rem', borderRadius: '0.4rem', border: '1px solid rgba(255, 184, 108, 0.3)', background: 'rgba(255, 184, 108, 0.05)', color: '#ffb86c', fontWeight: 900, fontSize: '0.75rem', cursor: uplinkProblems.length >= 5 ? 'not-allowed' : 'pointer', opacity: uplinkProblems.length >= 5 ? 0.3 : 1 }}
                      >
                        + MEDIUM (+9m)
                      </button>
                      <button
                        disabled={uplinkProblems.length >= 5}
                        onClick={() => setUplinkProblems(prev => prev.length < 5 ? [...prev, 'HARD'] : prev)}
                        style={{ flex: 1, padding: '0.6rem 0.25rem', borderRadius: '0.4rem', border: '1px solid rgba(189, 147, 249, 0.3)', background: 'rgba(189, 147, 249, 0.05)', color: '#bd93f9', fontWeight: 900, fontSize: '0.75rem', cursor: uplinkProblems.length >= 5 ? 'not-allowed' : 'pointer', opacity: uplinkProblems.length >= 5 ? 0.3 : 1 }}
                      >
                        + HARD (+14m)
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Time & Type Summary Block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: '0.4rem', border: '1px solid var(--line)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>TOTAL TIME:</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: themeColor }}>{calculatedUplinkTime} MINUTES</span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginRight: 'auto' }}>MATCH TYPE</span>
                  {[
                    { label: 'RANKED', value: true },
                    { label: 'UNRATED', value: false }
                  ].map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => setUplinkIsRanked(opt.value)}
                      style={{ padding: '0.4rem 0.8rem', borderRadius: '0.4rem', border: uplinkIsRanked === opt.value ? `2px solid ${themeColor}` : '1px solid var(--line)', background: uplinkIsRanked === opt.value ? `${themeColor}22` : 'rgba(0,0,0,0.2)', color: uplinkIsRanked === opt.value ? themeColor : 'var(--text)', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Row */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => {
                    setInviteFlowStep('MODE');
                    setUplinkProblems([]);
                  }}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.4rem', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontWeight: 900, cursor: 'pointer' }}
                >
                  BACK
                </button>
                <button
                  disabled={uplinkProblems.length === 0}
                  onClick={() => {
                    if (onInviteDuel) {
                      onInviteDuel(inviteFlowTarget.id, inviteFlowTarget.username || inviteFlowTarget.name || "Knight", {
                        gameMode: inviteConfig.gameMode,
                        unrated: !uplinkIsRanked,
                        problems: uplinkProblems
                      });
                    }
                    setInviteFlowTarget(null);
                    setInviteFlowStep(null);
                    setUplinkProblems([]);
                  }}
                  style={{ flex: 2, padding: '0.75rem', borderRadius: '0.4rem', border: 'none', background: uplinkProblems.length === 0 ? 'var(--text-muted)' : themeColor, color: '#000', fontWeight: 900, cursor: uplinkProblems.length === 0 ? 'not-allowed' : 'pointer' }}
                >
                  SEND INVITE
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
});

FriendsWindow.displayName = "FriendsWindow";
