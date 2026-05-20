"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, UserCheck, Loader2, Users, Trophy, UserX, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
          <div className="friends-search-bar">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="friends-search-input" />
          </div>
        )}

        <motion.div className="friends-list" layout>
          <AnimatePresence mode="wait">
            {activeTab === 'friends' && friends.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <Users size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No friends added yet.</p>
              </motion.div>
            )}
            {activeTab === 'friends' && friends.map(user => (
              <motion.div key={user.id} className="friend-item" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {user.image && <img src={user.image} alt={user.username || "User"} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                  <div style={{ fontWeight: 600 }}>{user.username || user.name || "Unknown"}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn" onClick={() => openProfile(user.id)}>View</motion.button>
                </div>
              </motion.div>
            ))}

            {activeTab === 'requests' && requests.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <UserCheck size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No pending friend requests.</p>
              </motion.div>
            )}
            {activeTab === 'requests' && requests.map((user: any) => (
              <motion.div key={user.id} className="friend-item" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {user.image && <img src={user.image} alt={user.username || "User"} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                  <div style={{ fontWeight: 600 }}>{user.username || user.name || "Unknown"}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn" onClick={() => handleRequestAction(user.requestId, 'ACCEPT')} style={{ color: 'var(--accent)', borderColor: 'var(--accent)'}}><Check size={14}/></motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn" onClick={() => handleRequestAction(user.requestId, 'REJECT')} style={{ color: '#ff5555', borderColor: '#ff5555'}}><UserX size={14}/></motion.button>
                </div>
              </motion.div>
            ))}

            {activeTab === 'find' && searchQuery.length >= 2 && searchResults.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <Search size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No users found matching your search.</p>
              </motion.div>
            )}
            {activeTab === 'find' && searchQuery.length >= 2 && searchResults.map((user) => (
              <motion.div key={user.id} className="friend-item" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {user.image && <img src={user.image} alt={user.username || "User"} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                  <div style={{ fontWeight: 600 }}>{user.username || user.name || "Unknown"}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn" onClick={() => openProfile(user.id)}>View</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleSendRequest(user.id)} className="btn">
                        {t("follow")}
                    </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
});

FriendsWindow.displayName = "FriendsWindow";
