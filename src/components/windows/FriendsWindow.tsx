"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, UserCheck, Loader2, Users, Trophy, UserX, Check } from "lucide-react";
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
}

export const FriendsWindow: React.FC<FriendsWindowProps> = React.memo(({ t, openProfile }) => {
  const [activeTab, setActiveTab] = useState<"friends" | "find" | "requests">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch("/api/user/friends"),
        fetch("/api/user/requests")
      ]);
      if (friendsRes.ok) setFriends(await friendsRes.json());
      if (requestsRes.ok) setRequests(await requestsRes.json());
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const searchUsers = async (query: string, signal: AbortSignal) => {
    if (query.length < 2) {
      setSearchResults([]);
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

  const debouncedSearch = useCallback(debounce((query: string, signal: AbortSignal) => searchUsers(query, signal), 300), []);

  useEffect(() => {
    const controller = new AbortController();
    if (activeTab === 'find') {
      debouncedSearch(searchQuery, controller.signal);
    } else {
      debouncedSearch.cancel();
      setSearchResults([]);
    }
    return () => controller.abort();
  }, [searchQuery, debouncedSearch, activeTab]);

  const handleRequestAction = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      const res = await fetch('/api/user/request/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });
      if (res.ok) {
        fetchData(); // Refresh lists
        // Update local search results state if any match requestId
        setSearchResults(prev => prev.map(u => (u as any).requestId === requestId ? { ...u, status: action === 'ACCEPT' ? 'FRIENDS' : 'NONE', requestId: undefined } as any : u));
      }
    } catch (err) {
      console.error("Error processing request:", err);
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/user/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });
      if (res.ok) {
        fetchData(); // Refresh lists
        // Update local search results state
        setSearchResults(prev => prev.map(u => u.id === targetUserId ? { ...u, status: "SENT" } as any : u));
      }
    } catch (err) {
      console.error("Error sending request:", err);
    }
  };

  return (
    <div className="friends-window">
      <div className="friends-tabs">
        <div className={`friends-tab ${activeTab === 'friends' ? 'friends-tab--active' : ''}`} onClick={() => setActiveTab('friends')}>
          {t("friends")}
        </div>
        <div className={`friends-tab ${activeTab === 'requests' ? 'friends-tab--active' : ''}`} onClick={() => setActiveTab('requests')}>
          Requests ({requests.length})
        </div>
        <div className={`friends-tab ${activeTab === 'find' ? 'friends-tab--active' : ''}`} onClick={() => setActiveTab('find')}>
          {t("searchUsers")}
        </div>
      </div>

      <div className="friends-content">
        {activeTab === 'find' && (
          <div className="friends-search-bar" style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="friends-search-input" />
            {isLoading && (
              <div style={{ position: 'absolute', right: '1rem', top: '50%', marginTop: '-8px', height: '16px', width: '16px' }}>
                <Loader2 size={16} style={{ color: 'var(--accent)' }} />
              </div>
            )}
          </div>
        )}
        <div className="friends-list">
            {activeTab === 'friends' && friends.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <Users size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No friends added yet.</p>
              </div>
            )}
            {activeTab === 'friends' && friends.map(user => (
              <div key={user.id} className="friend-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {user.image && <img src={user.image} alt={user.username || "User"} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                  <div style={{ fontWeight: 600 }}>{user.username || user.name || "Unknown"}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" onClick={() => openProfile(user.id)}>View</button>
                </div>
              </div>
            ))}

            {activeTab === 'requests' && requests.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <UserCheck size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No pending friend requests.</p>
              </div>
            )}
            {activeTab === 'requests' && requests.map((user: any) => (
              <div key={user.id} className="friend-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {user.image && <img src={user.image} alt={user.username || "User"} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                  <div style={{ fontWeight: 600 }}>{user.username || user.name || "Unknown"}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" onClick={() => handleRequestAction(user.requestId, 'ACCEPT')} style={{ color: 'var(--accent)', borderColor: 'var(--accent)'}}><Check size={14}/></button>
                    <button className="btn" onClick={() => handleRequestAction(user.requestId, 'REJECT')} style={{ color: '#ff5555', borderColor: '#ff5555'}}><UserX size={14}/></button>
                </div>
              </div>
            ))}

            {activeTab === 'find' && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <Search size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No users found matching your search.</p>
              </div>
            )}
            {activeTab === 'find' && searchQuery.length >= 2 && searchResults.map((user: any) => (
              <div key={user.id} className="friend-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {user.image && <img src={user.image} alt={user.username || "User"} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                  <div style={{ fontWeight: 600 }}>{user.username || user.name || "Unknown"}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" onClick={() => openProfile(user.id)}>View</button>
                    {user.status === "FRIENDS" ? (
                      <button disabled className="btn" style={{ opacity: 0.5, cursor: 'not-allowed', color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                        {t("friends")}
                      </button>
                    ) : user.status === "SENT" ? (
                      <button disabled className="btn" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                        Pending
                      </button>
                    ) : user.status === "RECEIVED" ? (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn" onClick={() => handleRequestAction(user.requestId, 'ACCEPT')} style={{ color: 'var(--accent)', borderColor: 'var(--accent)'}}><Check size={14}/></button>
                        <button className="btn" onClick={() => handleRequestAction(user.requestId, 'REJECT')} style={{ color: '#ff5555', borderColor: '#ff5555'}}><UserX size={14}/></button>
                      </div>
                    ) : (
                      <button onClick={() => handleSendRequest(user.id)} className="btn">
                          {t("follow")}
                      </button>
                    )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
});

FriendsWindow.displayName = "FriendsWindow";
