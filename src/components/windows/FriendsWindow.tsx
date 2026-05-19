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
  const [following, setFollowing] = useState<string[]>([]);

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

  const handleFollowAction = async (userId: string, action: 'follow' | 'unfollow') => {
    try {
      const res = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, action })
      });
      if (res.ok) {
        fetchData(); // Refresh lists
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
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
          <AnimatePresence>
            {activeTab === 'friends' && friends.map(user => (
              <motion.div key={user.id} className="friend-item" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ fontWeight: 600 }}>{user.username}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" onClick={() => openProfile(user.id)}>View</button>
                    <button className="btn" onClick={() => handleFollowAction(user.id, 'unfollow')}><UserX size={14} /></button>
                </div>
              </motion.div>
            ))}

            {activeTab === 'requests' && requests.map(user => (
              <motion.div key={user.id} className="friend-item" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ fontWeight: 600 }}>{user.username}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" onClick={() => openProfile(user.id)}>View</button>
                    <button className="btn" onClick={() => handleFollowAction(user.id, 'follow')} style={{ color: 'var(--accent)', borderColor: 'var(--accent)'}}><Check size={14}/></button>
                </div>
              </motion.div>
            ))}

            {activeTab === 'find' && searchQuery.length >= 2 && searchResults.map((user) => (
              <motion.div key={user.id} className="friend-item" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ fontWeight: 600 }}>{user.username || user.name || "Unknown"}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" onClick={() => openProfile(user.id)}>View</button>
                    <button onClick={() => handleFollowAction(user.id, following.includes(user.id) ? 'unfollow' : 'follow')} className="btn">
                        {following.includes(user.id) ? t("following") : t("follow")}
                    </button>
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
