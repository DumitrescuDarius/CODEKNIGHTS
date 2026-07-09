"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, UserCheck, Loader2, Users, Trophy, UserX, Check, User as UserIcon, BrainCircuit } from "lucide-react";
// framer-motion removed: use plain elements instead
import { User } from "../../types";
import { TranslationKey } from "../../constants/translations";

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
  onInviteDuel?: (userId: string, username: string) => void;
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

  return (
    <div className="friends-window">
      <div className="friends-header-info">
        <div className="friends-header-title">
          <Users size={18} style={{ color: "var(--accent)" }} />
          <span>{t("friendsList") || "FRIENDS"}</span>
        </div>
        <div className="friends-header-subtitle">
          Manage your alliances and search players
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
              <div style={{ position: 'absolute', right: '1rem', top: '50%', marginTop: '-8px', height: '16px', width: '16px' }}>
                <Loader2 size={16} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
              </div>
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
                    {user.image ? (
                      <img src={user.image} alt={user.username || "User"} className={`friend-avatar friend-avatar--${getRankClass(user.rank)}`} />
                    ) : (
                      <img src={`https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(user.username || user.name || "Knight")}&rowColor=random`} alt="Avatar" className={`friend-avatar friend-avatar--${getRankClass(user.rank)}`} />
                    )}
                    <div className="friend-status-dot" />
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
                  <button className="friend-btn friend-btn--primary" onClick={() => openProfile(user.id)}>{t("view")}</button>
                  {pendingInviteTargetId === user.id ? (
                    <button className="friend-btn friend-btn--primary" style={{ background: 'transparent', color: '#ff5555', border: '1px solid #ff5555' }} onClick={() => onCancelInvite && onCancelInvite()}>{t("cancelInvite") || t("cancel")}</button>
                  ) : (
                    <button className="friend-btn friend-btn--primary" style={{ background: '#ff5555', color: '#fff', border: 'none' }} onClick={() => onInviteDuel && onInviteDuel(user.id, user.username || user.name || "Knight")}>{t("duelBtn") || t("duel")}</button>
                  )}
                  <button className="friend-btn friend-btn--danger" onClick={() => setUnfriendConfirm(user)} title="Unfriend">
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
                    {user.image ? (
                      <img src={user.image} alt={user.username || "User"} className={`friend-avatar friend-avatar--${getRankClass(user.rank)}`} />
                    ) : (
                      <img src={`https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(user.username || user.name || "Knight")}&rowColor=random`} alt="Avatar" className={`friend-avatar friend-avatar--${getRankClass(user.rank)}`} />
                    )}
                  </div>
                  <div className="friend-meta">
                    <div className="friend-username" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {user.username || user.name || "Unknown"}
                      {onlineUsers?.has(user.id) && (
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: '#50fa7b', 
                          display: 'inline-block',
                          boxShadow: '0 0 8px rgba(80, 250, 123, 0.4)',
                        }} title="Online" />
                      )}
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
                  <button className="friend-btn friend-btn--success" onClick={() => handleRequestAction(user.requestId, 'ACCEPT')}><Check size={14}/> Accept</button>
                  <button className="friend-btn friend-btn--danger" onClick={() => handleRequestAction(user.requestId, 'REJECT')}><UserX size={14}/> Reject</button>
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
                    {user.image ? (
                      <img src={user.image} alt={user.username || "User"} className={`friend-avatar friend-avatar--${getRankClass(user.rank)}`} />
                    ) : (
                      <img src={`https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(user.username || user.name || "Knight")}&rowColor=random`} alt="Avatar" className={`friend-avatar friend-avatar--${getRankClass(user.rank)}`} />
                    )}
                  </div>
                  <div className="friend-meta">
                    <div className="friend-username" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {user.username || user.name || "Unknown"}
                      {onlineUsers?.has(user.id) && (
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: '#50fa7b', 
                          display: 'inline-block',
                          boxShadow: '0 0 8px rgba(80, 250, 123, 0.4)',
                        }} title="Online" />
                      )}
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
                    <button disabled className="friend-btn friend-btn--success" style={{ opacity: 0.6 }}>
                      <Check size={12}/> {t("friends")}
                    </button>
                  ) : user.status === "SENT" ? (
                    <button disabled className="friend-btn" style={{ opacity: 0.6 }}>
                      Pending
                    </button>
                  ) : user.status === "RECEIVED" ? (
                    <>
                      <button className="friend-btn friend-btn--success" onClick={() => handleRequestAction(user.requestId, 'ACCEPT')} title="Accept"><Check size={14}/></button>
                      <button className="friend-btn friend-btn--danger" onClick={() => handleRequestAction(user.requestId, 'REJECT')} title="Reject"><UserX size={14}/></button>
                    </>
                  ) : (
                    <button onClick={() => handleSendRequest(user.id)} className="friend-btn friend-btn--primary">
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
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>Are you sure you want to remove {unfriendConfirm.username || unfriendConfirm.name} from your friends list?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="twm-btn" onClick={() => setUnfriendConfirm(null)}>{t("cancel")}</button>
              <button className="twm-btn" style={{ background: '#ff5555', color: '#fff', border: 'none' }} onClick={() => handleUnfriend(unfriendConfirm.id)}>{t("removeBtn") || t("remove")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

FriendsWindow.displayName = "FriendsWindow";
