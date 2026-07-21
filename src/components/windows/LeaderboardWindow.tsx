import React, { useState, useEffect, useRef } from "react";
import { Trophy, Medal, Award, User, RefreshCw, Crown } from "lucide-react";
import { DefaultAvatar } from "../DefaultAvatar";
import { WindowSpinner } from "../WindowSpinner";

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
  const [selectedGameMode, setSelectedGameMode] = useState<string>("CODEKNIGHTS");

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
      const url = currentUserId ? `/api/leaderboard?userId=${currentUserId}&gameMode=${selectedGameMode}` : `/api/leaderboard?gameMode=${selectedGameMode}`;
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
    fetchLeaderboard();
  }, [selectedGameMode]);

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
    if (index === 0) return <Crown size={18} color="#ffd700" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))' }} />;
    if (index === 1) return <Trophy size={16} color="#c0c0c0" style={{ filter: 'drop-shadow(0 0 6px rgba(192, 192, 192, 0.4))' }} />;
    if (index === 2) return <Trophy size={16} color="#cd7f32" style={{ filter: 'drop-shadow(0 0 6px rgba(205, 127, 50, 0.4))' }} />;
    return <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{index + 1}</span>;
  };

  const getPinnedRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={18} color="#ffd700" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))' }} />;
    if (rank === 2) return <Trophy size={16} color="#c0c0c0" style={{ filter: 'drop-shadow(0 0 6px rgba(192, 192, 192, 0.4))' }} />;
    if (rank === 3) return <Trophy size={16} color="#cd7f32" style={{ filter: 'drop-shadow(0 0 6px rgba(205, 127, 50, 0.4))' }} />;
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
    <div ref={containerRef} style={{ 
      position: "relative", 
      padding: "1.25rem", 
      display: "flex", 
      flexDirection: "column", 
      height: "100%", 
      overflowY: "auto", 
      overflowX: "hidden", 
      background: "radial-gradient(circle at top, rgba(255, 215, 0, 0.05), rgba(0,0,0,0.1) 40%)", 
      boxSizing: "border-box", 
      width: "100%" 
    }}>
      {isLoading && <WindowSpinner message={t("loading") || "LOADING..."} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            background: "rgba(255, 215, 0, 0.15)",
            padding: "0.4rem",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(255, 215, 0, 0.2)"
          }}>
            <Crown size={22} color="#ffd700" style={{ filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))' }} />
          </div>
          <h2 style={{ 
            fontSize: "1.3rem", 
            margin: 0, 
            fontWeight: 900,
            background: "linear-gradient(135deg, #ffd700, #ffaa00)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            textShadow: "0px 2px 10px rgba(255, 215, 0, 0.2)"
          }}>
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

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
        {["CODEKNIGHTS", "BUGHUNTER", "HACKBOUNTY"].map((mode) => {
          const isActive = selectedGameMode === mode;
          const label = mode === "CODEKNIGHTS" ? "Code Knights" : mode === "BUGHUNTER" ? "Bug Hunter" : "Hack Bounty";
          return (
            <button
              key={mode}
              onClick={() => setSelectedGameMode(mode)}
              style={{
                padding: '0.3rem 0.8rem',
                background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                color: isActive ? '#000' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {error ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px", color: "#ff5555", fontSize: "0.85rem" }}>
          {error}
        </div>
      ) : leaders.length === 0 && !isLoading ? (
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
                  <DefaultAvatar 
                    name={currentUser.username || currentUser.name || "Anonymous"} 
                    size={20} 
                    image={currentUser.image}
                    isRoyal={!!currentUser.isRoyal}
                  />
                  <span style={{ fontWeight: 800, color: "var(--text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "0.3rem", maxWidth: "100%", minWidth: 0 }}>
                    <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", minWidth: 0 }}>
                      {currentUser.username || currentUser.name || "Anonymous"} 
                    </span>
                    <span style={{ fontSize: "0.6rem", background: "var(--accent)", color: "#000", padding: "0.05rem 0.25rem", borderRadius: "0.2rem", fontWeight: 900, flexShrink: 0 }}>YOU</span>
                  </span>
                </div>
                <div style={{ textAlign: "right", fontWeight: 900, color: "var(--accent)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{currentUser[selectedGameMode === "BUGHUNTER" ? "ratingBugHunter" : selectedGameMode === "HACKBOUNTY" ? "ratingHackBounty" : "rating"] || 1000}</div>
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
            <div style={{ textAlign: "right" }}>{selectedGameMode === "BUGHUNTER" ? "BHP" : selectedGameMode === "HACKBOUNTY" ? "HBP" : "CKP"}</div>
            {containerWidth >= 450 && <div style={{ textAlign: "right" }}>Title</div>}
            {containerWidth >= 580 && <div style={{ textAlign: "right" }}>Win Rate</div>}
          </div>

          {leaders.map((leader, index) => {
            const winRate = leader.battlesTotal > 0 ? Math.round((leader.battlesWon / leader.battlesTotal) * 100) : 0;
            const isMe = leader.id === currentUserId;
            
            // Royal styling for top 3
            let rowBg = isMe ? "rgba(122, 162, 247, 0.04)" : "rgba(255,255,255,0.02)";
            let rowBorder = isMe ? "1px solid rgba(122, 162, 247, 0.4)" : "1px solid var(--line)";
            let hoverBg = isMe ? "rgba(122, 162, 247, 0.08)" : "rgba(255,255,255,0.05)";
            let hoverBorder = "var(--accent)";

            if (index === 0) {
              rowBg = "linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%)";
              rowBorder = "1px solid rgba(255, 215, 0, 0.5)";
              hoverBg = "linear-gradient(90deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%)";
              hoverBorder = "rgba(255, 215, 0, 0.8)";
            } else if (index === 1) {
              rowBg = "linear-gradient(90deg, rgba(192,192,192,0.1) 0%, rgba(192,192,192,0.02) 100%)";
              rowBorder = "1px solid rgba(192, 192, 192, 0.4)";
              hoverBg = "linear-gradient(90deg, rgba(192,192,192,0.15) 0%, rgba(192,192,192,0.05) 100%)";
              hoverBorder = "rgba(192, 192, 192, 0.6)";
            } else if (index === 2) {
              rowBg = "linear-gradient(90deg, rgba(205,127,50,0.1) 0%, rgba(205,127,50,0.02) 100%)";
              rowBorder = "1px solid rgba(205, 127, 50, 0.4)";
              hoverBg = "linear-gradient(90deg, rgba(205,127,50,0.15) 0%, rgba(205,127,50,0.05) 100%)";
              hoverBorder = "rgba(205, 127, 50, 0.6)";
            }

            return (
              <div 
                key={leader.id} 
                onClick={() => openProfile(leader.id)}
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: gridLayout, 
                  padding: "0.75rem 0.85rem", 
                  background: rowBg, 
                  border: rowBorder, 
                  borderRadius: "0.4rem", 
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  width: "100%",
                  minWidth: 0,
                  gap: "0.5rem",
                  boxSizing: "border-box",
                  boxShadow: index === 0 ? "0 0 10px rgba(255, 215, 0, 0.1)" : "none"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = hoverBg;
                  e.currentTarget.style.border = `1px solid ${hoverBorder}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = rowBg;
                  e.currentTarget.style.border = rowBorder;
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "50%", background: index < 3 ? "rgba(255,255,255,0.03)" : "transparent", flexShrink: 0 }}>
                  {getRankIcon(index)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                  <DefaultAvatar 
                    name={leader.username || leader.name || "Anonymous"} 
                    size={20} 
                    image={leader.image}
                    isRoyal={!!leader.isRoyal}
                  />
                  <span style={{ fontWeight: 700, color: "var(--text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "0.3rem", maxWidth: "100%", minWidth: 0 }}>
                    <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", minWidth: 0 }}>
                      {leader.username || leader.name || "Anonymous"}
                    </span>
                    {isMe && <span style={{ fontSize: "0.55rem", background: "rgba(122, 162, 247, 0.2)", color: "var(--accent)", padding: "0.05rem 0.2rem", borderRadius: "0.2rem", fontWeight: 800, flexShrink: 0 }}>YOU</span>}
                  </span>
                </div>
                <div style={{ textAlign: "right", fontWeight: 900, color: isMe ? "var(--accent)" : "var(--text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{leader[selectedGameMode === "BUGHUNTER" ? "ratingBugHunter" : selectedGameMode === "HACKBOUNTY" ? "ratingHackBounty" : "rating"] || 1000}</div>
                {containerWidth >= 450 && (
                  <div style={{ textAlign: "right", fontSize: "0.75rem", color: isMe ? "var(--accent)" : "var(--text-muted)", fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{leader.rank || "Bronze"}</div>
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
