"use client";

import React from "react";
import { Theme, Font, SupportedLanguage, AnimationSpeed } from "../../types";
import { THEMES } from "../../constants/themes";
import { FONTS } from "../../constants/fonts";
import { TranslationKey } from "../../constants/translations";

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
  uiLang: SupportedLanguage;
  setUiLang: (lang: SupportedLanguage) => void;
  animationSpeed: AnimationSpeed;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  t: (key: TranslationKey) => string;
}

export const SettingsWindow: React.FC<SettingsWindowProps> = React.memo(({
  themeIndex, setThemeIndex, fontFamily, setFontFamily, fontSize, setFontSize,
  terminalFontSize, setTerminalFontSize, vimMode, setVimMode, uiLang, setUiLang,
  animationSpeed, setAnimationSpeed, t
}) => {
  return (
    <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
      {/* 1. Interface Language */}
      <div className="settings-group">
        <span className="settings-label">{t("language")}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
          {(['en', 'ro', 'fr', 'de', 'hi', 'ru', 'hu', 'es', 'it', 'zh', 'ja', 'pt'] as SupportedLanguage[]).map((l) => {
            const labels: Record<SupportedLanguage, string> = {
              en: "English", ro: "Română", fr: "Français", de: "Deutsch", 
              hi: "हिन्दी", ru: "Русский", hu: "Magyar", es: "Español",
              it: "Italiano", zh: "中文", ja: "日本語", pt: "Português (BR)"
            };
            return (
              <button 
                key={l} 
                onClick={() => setUiLang(l)} 
                className={`btn`}
                style={{ 
                  height: '44px',
                  borderRadius: '0.4rem',
                  border: `1px solid ${uiLang === l ? 'var(--accent)' : 'var(--line)'}`,
                  color: uiLang === l ? 'var(--accent)' : 'var(--text)',
                  boxShadow: uiLang === l ? `inset 0 0 0 2px var(--accent)` : 'none',
                  transition: 'all 0.2s ease',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}
              >
                {labels[l]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Window Animations */}
      <div className="settings-group">
        <span className="settings-label">{t("windowAnimations")}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
          {(['none', 'snappy', 'fast', 'smooth', 'bouncy', 'elastic', 'dramatic', 'jello', 'lazy', 'ghost', 'teleport', 'boing', 'float', 'erased', 'flip', 'glitch', 'swapVertical', 'six seven'] as const).map((speed) => {
            const labels = {
              snappy: t("animationSnappy"),
              fast: t("animationFast"),
              smooth: t("animationSmooth"),
              none: t("animationNone"),
              bouncy: t("animationBouncy"),
              elastic: t("animationElastic"),
              dramatic: t("animationDramatic"),
              jello: t("animationJello"),
              lazy: t("animationLazy"),
              ghost: t("animationGhost"),
              teleport: t("animationTeleport"),
              boing: t("animationBoing"),
              float: t("animationFloat"),
              erased: t("animationErased"),
              flip: t("animationFlip"),
              glitch: t("animationGlitch"),
              swapVertical: t("animationSwapVertical"),
              "six seven": t("animationSixSeven")
            };
            return (
              <button 
                key={speed} 
                onClick={() => setAnimationSpeed(speed)} 
                className={`btn`}
                style={{ 
                  flex: 1,
                  height: '44px',
                  borderRadius: '0.4rem',
                  border: `1px solid ${animationSpeed === speed ? 'var(--accent)' : 'var(--line)'}`,
                  color: animationSpeed === speed ? 'var(--accent)' : 'var(--text)',
                  boxShadow: animationSpeed === speed ? `inset 0 0 0 2px var(--accent)` : 'none',
                  transition: 'all 0.2s ease',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}
              >
                {labels[speed]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Text Size */}
      <div className="settings-group">
        <span className="settings-label">{t("textSize")}</span>
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

      {/* 3. Keybindings */}
      <div className="settings-group">
        <span className="settings-label">{t("keybindings")}</span>
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

      {/* 4. Font Family */}
      <div className="settings-group">
        <span className="settings-label">{t("fontFamily")}</span>
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

      {/* 5. Color Themes */}
      <div className="settings-group">
        <span className="settings-label">{t("colorThemes")}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {THEMES.map((t, i) => {
            const keywordColor = t.rules.find(r => r.token === 'keyword')?.foreground || t.accent;
            const safeKeywordColor = keywordColor.startsWith('#') ? keywordColor : `#${keywordColor}`;
            
            return (
              <div key={t.name} className={`theme-card ${themeIndex === i ? "theme-card--active" : ""}`} onClick={() => setThemeIndex(i)} style={{ padding: 0, border: 'none', background: 'transparent' }}>
                <div className="theme-swatch" style={{ 
                  background: t.bg, 
                  border: `1px solid ${t.light ? 'rgba(0,0,0,0.1)' : t.accent}`,
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
                    color: safeKeywordColor,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {t.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

SettingsWindow.displayName = "SettingsWindow";
