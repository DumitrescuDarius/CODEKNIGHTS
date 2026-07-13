import React from "react";
import { Crown } from "lucide-react";

interface DefaultAvatarProps {
  name: string;
  size: number;
  style?: React.CSSProperties;
  isRoyal?: boolean;
  image?: string | null;
}

export const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ name, size, style, isRoyal, image }) => {
  const colors = [
    "#4285F4", // Google Blue
    "#EA4335", // Google Red
    "#FBBC05", // Google Yellow
    "#34A853", // Google Green
    "#8E24AA", // Purple
    "#00ACC1", // Cyan
    "#D81B60", // Pink
    "#F4511E", // Deep Orange
    "#3949AB", // Indigo
    "#00897B", // Teal
  ];

  let hash = 0;
  const cleanName = name || "?";
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  const bgColor = colors[index];
  const initial = cleanName.charAt(0).toUpperCase();

  const crownSize = Math.max(12, size * 0.45);
  const crownIconSize = Math.max(8, size * 0.28);

  return (
    <div style={{ position: "relative", display: "inline-block", borderRadius: "50%", flexShrink: 0, ...style }}>
      {image ? (
        <img
          src={image}
          alt={cleanName}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            backgroundColor: bgColor,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: `${Math.max(10, size * 0.45)}px`,
            userSelect: "none",
            textTransform: "uppercase",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {initial}
        </div>
      )}
      {isRoyal && (
        <div style={{
          position: "absolute",
          top: "-4px",
          right: "-4px",
          background: "linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)",
          borderRadius: "50%",
          width: `${crownSize}px`,
          height: `${crownSize}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 8px rgba(255, 215, 0, 0.6)",
          color: "#120824",
          border: "1px solid #120824",
          zIndex: 2,
        }}>
          <Crown size={crownIconSize} fill="currentColor" style={{ display: "block" }} />
        </div>
      )}
    </div>
  );
};
