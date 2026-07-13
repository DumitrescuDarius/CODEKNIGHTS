import React from "react";

interface DefaultAvatarProps {
  name: string;
  size: number;
  style?: React.CSSProperties;
}

export const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ name, size, style }) => {
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

  return (
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
        flexShrink: 0,
        textTransform: "uppercase",
        fontFamily: "'Inter', sans-serif",
        ...style,
      }}
    >
      {initial}
    </div>
  );
};
