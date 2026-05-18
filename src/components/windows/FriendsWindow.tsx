"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, UserCheck, Loader2, Users, Trophy } from "lucide-react";
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
}

export const FriendsWindow: React.FC<FriendsWindowProps> = React.memo(({ t }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [following, setFollowing] = useState<string[]>([]);

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
      if (error.name !== 'AbortError') {
        console.error("Search error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string, signal: AbortSignal) => searchUsers(query, signal), 300),
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    debouncedSearch(searchQuery, controller.signal);
    return () => controller.abort();
  }, [searchQuery, debouncedSearch]);

  const toggleFollow = (userId: string) => {
    if (following.includes(userId)) {
      setFollowing(following.filter(id => id !== userId));
    } else {
      setFollowing([...following, userId]);
    }
  };

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent)' }}>{t("friends")}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t("searchUsers")}</p>
        </div>

        <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
          <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--line)',
              padding: '1rem 1rem 1rem 3.5rem',
              borderRadius: '0.8rem',
              color: 'inherit',
              outline: 'none',
              fontSize: '1rem',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--line)'}
          />
        </div>

        <div className="settings-group">
          <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} /> {searchQuery.length >= 2 ? t("searchUsers") : t("friendsList")}
          </span>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            {searchQuery.length < 2 ? (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--line)', borderRadius: '0.8rem' }}>
                <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.2 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Type at least 2 characters to search for knights.</p>
              </div>
            ) : searchResults.length === 0 && !isLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--line)', borderRadius: '0.8rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t("noUsersFound")}</p>
              </div>
            ) : (
              searchResults.map((user) => (
                <div key={user.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '1.25rem 1.5rem', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--line)', 
                  borderRadius: '0.8rem',
                  transition: 'transform 0.2s ease, background 0.2s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {user.image ? (
                      <img src={user.image} alt={user.username || user.name || ""} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--line)' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={24} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user.username || user.name || "Unknown Knight"}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trophy size={12} /> {user.battlesWon} wins • {user.battlesTotal} fought
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => toggleFollow(user.id)}
                    className="btn"
                    style={{ 
                      padding: '0.5rem 1.25rem', 
                      fontSize: '0.8rem', 
                      fontWeight: 700, 
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: following.includes(user.id) ? 'rgba(255,255,255,0.1)' : 'var(--accent)',
                      color: following.includes(user.id) ? 'var(--text)' : '#000',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {following.includes(user.id) ? (
                      <><UserCheck size={16} /> {t("following")}</>
                    ) : (
                      <><UserPlus size={16} /> {t("follow")}</>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

FriendsWindow.displayName = "FriendsWindow";
