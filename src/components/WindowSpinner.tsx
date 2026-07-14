import React from "react";

interface WindowSpinnerProps {
  message?: string;
}

export const WindowSpinner: React.FC<WindowSpinnerProps> = ({ message = "LOADING..." }) => {
  return (
    <div style={{ 
      position: 'absolute', 
      inset: 0, 
      background: 'color-mix(in srgb, var(--bg) 90%, transparent)', 
      backdropFilter: 'blur(8px)',
      zIndex: 100, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '1rem',
      borderRadius: 'inherit'
    }}>
      <div 
        className="loading-spinner" 
        style={{ 
          width: '36px', 
          height: '36px', 
          border: '3px solid var(--line)', 
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite'
        }} 
      />
      <div style={{ 
        color: 'var(--accent)', 
        fontWeight: 800, 
        letterSpacing: '0.15em', 
        fontSize: '0.78rem',
        textTransform: 'uppercase'
      }}>
        {message}
      </div>
    </div>
  );
};
