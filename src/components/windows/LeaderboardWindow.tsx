import React, { useState, useEffect, useRef } from "react";
import { Trophy, Medal, Award, User, RefreshCw } from "lucide-react";
import { DefaultAvatar } from "../DefaultAvatar";

interface LeaderboardWindowProps {
  t: any;
  currentUserId?: string;
  cachedLeaderboard?: any;
  onUpdateCache?: (data: any) => void;
  openProfile: (id: string) => void;
}

export const LeaderboardWindow: React.FC<LeaderboardWindowProps> = React.memo(({ t, currentUserId, cachedLeaderboard, onUpdateCache, openProfile }) => {
  const [leaders, setLeaders] = useState<any[]>(cachedLeaderboard?.topUsers || []);
  const [currentUser, setCurrentUser] = useState<any>(cachedLeaderboard?.currentUser || null);
  const [isLoading, setIsLoading] = useState(!cachedLeaderboard);
  const [error, setError] = useState<string | null>(null);

  // ResizeObserver state to handle resizable panels
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = currentUserId ? `/api/leaderboard?userId=${currentUserId}` : "/api/leaderboard";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLeaders(data.topUsers || []);
        setCurrentUser(data.currentUser || null);
        if (onUpdateCache) {
          onUpdateCache(data);
        }
      } else {
        setError("Failed to load rankings");
      }
    } catch (e) {
      setError("Failed to load rankings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!cachedLeaderboard) {
      fetchLeaderboard();
    } else {
      setLeaders(cachedLeaderboard.topUsers || []);
      setCurrentUser(cachedLeaderboard.currentUser || null);
      setIsLoading(false);
    }
  }, [cachedLeaderboard, currentUserId]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy size={16} color="#ffd700" style={{ filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.4))' }} />;
    if (index === 1) return <Trophy size={16} color="#c0c0c0" style={{ filter: 'drop-shadow(0 0 6px rgba(192, 192, 192, 0.3))' }} />;
    if (index === 2) return <Trophy size={16} color="#cd7f32" style={{ filter: 'drop-shadow(0 0 6px rgba(205, 127, 50, 0.2))' }} />;
    return <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{index + 1}</span>;
  };

  const getPinnedRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={16} color="#ffd700" style={{ filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.4))' }} />;
    if (rank === 2) return <Trophy size={16} color="#c0c0c0" style={{ filter: 'drop-shadow(0 0 6px rgba(192, 192, 192, 0.3))' }} />;
    if (rank === 3) return <Trophy size={16} color="#cd7f32" style={{ filter: 'drop-shadow(0 0 6px rgba(205, 127, 50, 0.2))' }} />;
    return <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>#{rank}</span>;
  };

  // Determine grid columns dynamically based on parent container width
  const isNarrow = containerWidth < 450;
  const isMedium = containerWidth >= 450 && containerWidth < 580;

  const gridLayout = isNarrow 
    ? "35px 1fr 65px" 
    : (isMedium 
        ? "40px 1fr 75px 85px" 
        : "45px 1.5fr 80px 90px 100px");

  return (
    <div ref={containerRef} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", overflowX: "hidden", background: "rgba(0,0,0,0.1)", boxSizing: "border-box", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Trophy size={20} color="var(--accent)" />
          <h2 style={{ fontSize: "1.15rem", color: "var(--text)", margin: 0, fontWeight: 800 }}>
            {t("leaderboardTitle") || "GLOBAL LEADERBOARD"}
          </h2>
        </div>
        <button 
          onClick={fetchLeaderboard} 
          disabled={isLoading}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--line)",
            color: "var(--text)",
            borderRadius: "0.4rem",
            padding: "0.35rem 0.55rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
        >
          <RefreshCw size={12} className={isLoading ? "spin" : ""} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, height: "200px" }}>
          <RefreshCw size={28} className="spin" style={{ color: "var(--accent)", animation: "spin 1s linear infinite" }} />
        </div>
      ) : error ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px", color: "#ff5555", fontSize: "0.85rem" }}>
          {error}
        </div>
      ) : leaders.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          No active participants found.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", width: "100%" }}>
          
          {/* Pinned Current User Standings Row */}
          {currentUser && (
            <div style={{ marginBottom: "0.75rem", width: "100%" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--accent)", marginBottom: "0.4rem", letterSpacing: "0.05em" }}>
                YOUR STANDING
              </div>
              <div 
                onClick={() => openProfile(currentUser.id)}
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: gridLayout, 
                  padding: "0.75rem 0.85rem", 
                  background: "rgba(122, 162, 247, 0.08)", 
                  border: "1px solid var(--accent)", 
                  borderRadius: "0.4rem", 
                  alignItems: "center",
                  cursor: "pointer",
                  boxShadow: "0 0 10px rgba(122, 162, 247, 0.12)",
                  transition: "all 0.15s ease",
                  width: "100%",
                  minWidth: 0,
                  gap: "0.5rem",
                  boxSizing: "border-box"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(122, 162, 247, 0.12)";
                  e.currentTarget.style.transform = "scale(1.005)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(122, 162, 247, 0.08)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "50%", background: currentUser.globalRank <= 3 ? "rgba(255,255,255,0.03)" : "transparent", flexShrink: 0 }}>
                  {getPinnedRankIcon(currentUser.globalRank)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                  {currentUser.image ? (
                    <img src={currentUser.image} alt={currentUser.username} style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <DefaultAvatar name={currentUser.username || currentUser.name || "Anonymous"} size={20} />
                  )}
                  <span style={{ fontWeight: 800, color: "var(--text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "0.3rem", maxWidth: "100%", minWidth: 0 }}>
                    <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", minWidth: 0 }}>
                      {currentUser.username || currentUser.name || "Anonymous"} 
                    </span>
                    <span style={{ fontSize: "0.6rem", background: "var(--accent)", color: "#000", padding: "0.05rem 0.25rem", borderRadius: "0.2rem", fontWeight: 900, flexShrink: 0 }}>YOU</span>
                  </span>
                </div>
                <div style={{ textAlign: "right", fontWeight: 900, color: "var(--accent)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{currentUser.rating || 1000}</div>
                {containerWidth >= 450 && (
                  <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{currentUser.rank || "Bronze"}</div>
                )}
                {containerWidth >= 580 && (
                  <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {currentUser.battlesTotal > 0 ? Math.round((currentUser.battlesWon / currentUser.battlesTotal) * 100) : 0}% 
                    <span style={{ fontSize: "0.65rem", opacity: 0.7 }}> ({currentUser.battlesWon}/{currentUser.battlesTotal})</span>
                  </div>
                )}
              </div>
              <div style={{ borderBottom: "1px dashed var(--line)", marginTop: "1rem", opacity: 0.3 }} />
            </div>
          )}

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: gridLayout, 
            padding: "0.4rem 0.85rem", 
            fontSize: "0.7rem", 
            fontWeight: 700, 
            color: "var(--text-muted)", 
            borderBottom: "1px solid var(--line)", 
            textTransform: "uppercase", 
            letterSpacing: "0.05em",
            width: "100%",
            gap: "0.5rem",
            boxSizing: "border-box"
          }}>
            <div>Rank</div>
            <div>Player</div>
            <div style={{ textAlign: "right" }}>Rating</div>
            {containerWidth >= 450 && <div style={{ textAlign: "right" }}>Title</div>}
            {containerWidth >= 580 && <div style={{ textAlign: "right" }}>Win Rate</div>}
          </div>

          {leaders.map((leader, index) => {
            const winRate = leader.battlesTotal > 0 ? Math.round((leader.battlesWon / leader.battlesTotal) * 100) : 0;
            const isMe = leader.id === currentUserId;
            
            return (
              <div 
                key={leader.id} 
                onClick={() => openProfile(leader.id)}
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: gridLayout, 
                  padding: "0.75rem 0.85rem", 
                  background: isMe ? "rgba(122, 162, 247, 0.04)" : "rgba(255,255,255,0.02)", 
                  border: isMe ? "1px solid rgba(122, 162, 247, 0.4)" : "1px solid var(--line)", 
                  borderRadius: "0.4rem", 
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  width: "100%",
                  minWidth: 0,
                  gap: "0.5rem",
                  boxSizing: "border-box"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isMe ? "rgba(122, 162, 247, 0.08)" : "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isMe ? "rgba(122, 162, 247, 0.04)" : "rgba(255,255,255,0.02)";
                  e.currentTarget.style.borderColor = isMe ? "rgba(122, 162, 247, 0.4)" : "var(--line)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "50%", background: index < 3 ? "rgba(255,255,255,0.03)" : "transparent", flexShrink: 0 }}>
                  {getRankIcon(index)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                  {leader.image ? (
                    <img src={leader.image} alt={leader.username} style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <DefaultAvatar name={leader.username || leader.name || "Anonymous"} size={20} />
                  )}
                  <span style={{ fontWeight: 700, color: "var(--text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "0.3rem", maxWidth: "100%", minWidth: 0 }}>
                    <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", minWidth: 0 }}>
                      {leader.username || leader.name || "Anonymous"}
                    </span>
                    {isMe && <span style={{ fontSize: "0.55rem", background: "rgba(122, 162, 247, 0.2)", color: "var(--accent)", padding: "0.05rem 0.2rem", borderRadius: "0.2rem", fontWeight: 800, flexShrink: 0 }}>YOU</span>}
                  </span>
                </div>
                <div style={{ textAlign: "right", fontWeight: 850, color: "var(--accent)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{leader.rating || 1000}</div>
                {containerWidth >= 450 && (
                  <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{leader.rank || "Bronze"}</div>
                )}
                {containerWidth >= 580 && (
                  <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {winRate}% <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>({leader.battlesWon}/{leader.battlesTotal})</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

LeaderboardWindow.displayName = "LeaderboardWindow";
