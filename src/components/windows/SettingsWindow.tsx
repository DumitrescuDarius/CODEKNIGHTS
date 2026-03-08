"use client";

import React from "react";
import { Theme, Font } from "../../types";
import { THEMES } from "../../constants/themes";
import { FONTS } from "../../constants/fonts";

interface SettingsWindowProps {
  themeIndex: number;
  setThemeIndex: (idx: number) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  terminalFontSize: number;
  setTerminalFontSize: (size: number) => void;
  vimMode: boolean;
  setVimMode: (val: boolean) => void;
}

export const SettingsWindow: React.FC<SettingsWindowProps> = React.memo(({
  themeIndex, setThemeIndex, fontFamily, setFontFamily, fontSize, setFontSize,
  terminalFontSize, setTerminalFontSize, vimMode, setVimMode
}) => {
  return (
    <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
      <div className="settings-group">
        <span className="settings-label">Color Themes</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {THEMES.map((t, i) => (
            <div key={t.name} className={`theme-card ${themeIndex === i ? "theme-card--active" : ""}`} onClick={() => setThemeIndex(i)} style={{ padding: 0, border: 'none', background: 'transparent' }}>
              <div className="theme-swatch" style={{ 
                background: t.bg, 
                border: `1px solid ${t.accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '44px',
                margin: 0,
                borderRadius: '0.4rem',
                boxShadow: themeIndex === i ? `inset 0 0 0 2px ${t.accent}` : 'none',
                opacity: themeIndex === i ? 1 : 0.7,
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}>
                <div style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 700, 
                  color: `#${t.rules.find(r => r.token === 'keyword')?.foreground}`,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {t.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <span className="settings-label">Font Family</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {FONTS.map((f) => (
            <button 
              key={f.name} 
              onClick={() => setFontFamily(f.value)} 
              className={`btn`}
              style={{ 
                fontFamily: f.value, 
                fontSize: '0.8rem', 
                textAlign: 'center', 
                height: '44px',
                padding: '0 0.8rem',
                borderRadius: '0.4rem',
                border: `1px solid ${fontFamily === f.value ? 'var(--accent)' : 'var(--line)'}`,
                color: fontFamily === f.value ? 'var(--accent)' : 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: fontFamily === f.value ? `inset 0 0 0 2px var(--accent)` : 'none',
                transition: 'all 0.2s ease',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer'
              }}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <span className="settings-label">Text Size</span>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>EDITOR</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => setFontSize(Math.max(10, fontSize - 1))} className="btn btn-ghost">-</button>
              <span style={{ fontSize: '0.85rem', minWidth: '3ch', textAlign: 'center' }}>{fontSize}px</span>
              <button onClick={() => setFontSize(Math.min(30, fontSize + 1))} className="btn btn-ghost">+</button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TERMINAL</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => setTerminalFontSize(Math.max(10, terminalFontSize - 1))} className="btn btn-ghost">-</button>
              <span style={{ fontSize: '0.85rem', minWidth: '3ch', textAlign: 'center' }}>{terminalFontSize}px</span>
              <button onClick={() => setTerminalFontSize(Math.min(30, terminalFontSize + 1))} className="btn btn-ghost">+</button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <span className="settings-label">Keybindings</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setVimMode(!vimMode)} 
            className={`btn`} 
            style={{ 
              height: '44px',
              padding: '0 1rem',
              borderRadius: '0.4rem',
              border: `1px solid ${vimMode ? 'var(--accent)' : 'var(--line)'}`, 
              color: vimMode ? 'var(--accent)' : 'var(--text)',
              boxShadow: vimMode ? `inset 0 0 0 2px var(--accent)` : 'none',
              transition: 'all 0.2s ease',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            {vimMode ? "Vim Mode: ON" : "Vim Mode: OFF"}
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enable Vim emulations.</p>
        </div>
      </div>
    </div>
  );
});

SettingsWindow.displayName = "SettingsWindow";
