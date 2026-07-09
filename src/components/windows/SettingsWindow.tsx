"use client";

import React from "react";
import { Theme, Font, SupportedLanguage, AnimationSpeed } from "../../types";
import { THEMES } from "../../constants/themes";
import { FONTS } from "../../constants/fonts";
import { TranslationKey } from "../../constants/translations";
import { Download, Upload } from "lucide-react";

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
  windowRadius: string;
  setWindowRadius: (radius: string) => void;
  windowGap: string;
  setWindowGap: (gap: string) => void;
  windowBorderThickness: string;
  setWindowBorderThickness: (thickness: string) => void;
  navStyle: string;
  setNavStyle: (style: string) => void;
  t: (key: TranslationKey) => string;
}

export const SettingsWindow: React.FC<SettingsWindowProps> = React.memo(({
  themeIndex, setThemeIndex, fontFamily, setFontFamily, fontSize, setFontSize,
  terminalFontSize, setTerminalFontSize, vimMode, setVimMode, uiLang, setUiLang,
  animationSpeed, setAnimationSpeed, windowRadius, setWindowRadius, windowGap, setWindowGap, windowBorderThickness, setWindowBorderThickness, navStyle, setNavStyle, t
}) => {
  const handleExport = () => {
    const settings = {
      themeIndex, fontFamily, fontSize, terminalFontSize,
      vimMode, uiLang, animationSpeed, windowRadius,
      windowGap, windowBorderThickness, navStyle
    };
    const jsonStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([jsonStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codeknights_settings.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (typeof parsed.themeIndex === 'number') setThemeIndex(parsed.themeIndex);
        if (typeof parsed.fontFamily === 'string') setFontFamily(parsed.fontFamily);
        if (typeof parsed.fontSize === 'number') setFontSize(parsed.fontSize);
        if (typeof parsed.terminalFontSize === 'number') setTerminalFontSize(parsed.terminalFontSize);
        if (typeof parsed.vimMode === 'boolean') setVimMode(parsed.vimMode);
        if (typeof parsed.uiLang === 'string') setUiLang(parsed.uiLang);
        if (typeof parsed.animationSpeed === 'string') setAnimationSpeed(parsed.animationSpeed);
        if (typeof parsed.windowRadius === 'string') setWindowRadius(parsed.windowRadius);
        if (typeof parsed.windowGap === 'string') setWindowGap(parsed.windowGap);
        if (typeof parsed.windowBorderThickness === 'string') setWindowBorderThickness(parsed.windowBorderThickness);
        if (typeof parsed.navStyle === 'string') setNavStyle(parsed.navStyle);
      } catch (err) {
        console.error("Failed to parse settings file", err);
        alert("Failed to parse settings file. Make sure it's a valid JSON.");
      }
    };
    reader.readAsText(file);
    // clear input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
      {/* 0. Settings Management */}
      <div className="settings-group" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button 
          onClick={handleExport}
          className="btn"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '0.4rem',
            background: 'var(--accent)', color: '#000',
            border: 'none', cursor: 'pointer', fontWeight: 600,
            fontSize: '0.85rem'
          }}
          title="Download settings as a .txt file"
        >
          <Download size={16} /> {t("exportSettings")}
        </button>
        
        <label
          className="btn"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '0.4rem',
            background: 'rgba(255,255,255,0.05)', color: 'var(--text)',
            border: '1px solid var(--line)', cursor: 'pointer', fontWeight: 600,
            fontSize: '0.85rem'
          }}
          title="Import settings from a .txt file"
        >
          <Upload size={16} /> {t("importSettings")}
          <input 
            type="file" 
            accept=".txt,.json" 
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </label>
      </div>

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

      {/* 3. Text Size */}
      <div className="settings-group">
        <span className="settings-label">{t("textSize")}</span>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t("editorLabel")}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => setFontSize(Math.max(10, fontSize - 1))} className="btn btn-ghost">-</button>
              <span style={{ fontSize: '0.85rem', minWidth: '3ch', textAlign: 'center' }}>{fontSize}px</span>
              <button onClick={() => setFontSize(Math.min(30, fontSize + 1))} className="btn btn-ghost">+</button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t("terminalLabel")}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => setTerminalFontSize(Math.max(10, terminalFontSize - 1))} className="btn btn-ghost">-</button>
              <span style={{ fontSize: '0.85rem', minWidth: '3ch', textAlign: 'center' }}>{terminalFontSize}px</span>
              <button onClick={() => setTerminalFontSize(Math.min(30, terminalFontSize + 1))} className="btn btn-ghost">+</button>
            </div>
          </div>
        </div>
      </div>


      {/* 2.5. Window Angles (Radius) */}
      <div className="settings-group" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <span className="settings-label">{t("windowAngles")}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: t("sharp"), value: '0px' },
            { label: t("slight"), value: '0.2rem' },
            { label: t("standard"), value: '0.4rem' },
            { label: t("rounded"), value: '0.8rem' },
            { label: t("roundest"), value: '1.5rem' }
          ].map((r) => (
            <button 
              key={r.value} 
              onClick={() => setWindowRadius(r.value)} 
              className={`btn`}
              style={{ 
                height: '44px',
                borderRadius: r.value,
                border: `1px solid ${windowRadius === r.value ? 'var(--accent)' : 'var(--line)'}`,
                color: windowRadius === r.value ? 'var(--accent)' : 'var(--text)',
                boxShadow: windowRadius === r.value ? `inset 0 0 0 2px var(--accent)` : 'none',
                transition: 'all 0.2s ease',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={r.label}
            >
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderTop: '3px solid currentColor',
                borderLeft: '3px solid currentColor',
                borderTopLeftRadius: r.value,
                transform: 'translate(4px, 4px)'
              }}></div>
            </button>
          ))}
        </div>
      </div>

      {/* 2.6. Window Gaps */}
      <div className="settings-group" style={{ marginBottom: '1.5rem' }}>
        <span className="settings-label">{t("windowGap")}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: t("none"), value: '0px' },
            { label: t("tight"), value: '0.25rem' },
            { label: t("standard"), value: '0.75rem' },
            { label: t("loose"), value: '1.5rem' },
            { label: t("spacious"), value: '2.5rem' }
          ].map((g) => (
            <button 
              key={g.value} 
              onClick={() => setWindowGap(g.value)} 
              className={`btn`}
              style={{ 
                height: '44px',
                borderRadius: '0.4rem',
                border: `1px solid ${windowGap === g.value ? 'var(--accent)' : 'var(--line)'}`,
                color: windowGap === g.value ? 'var(--accent)' : 'var(--text)',
                boxShadow: windowGap === g.value ? `inset 0 0 0 2px var(--accent)` : 'none',
                transition: 'all 0.2s ease',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: g.value
              }}
              title={g.label}
            >
              <div style={{ width: '12px', height: '12px', background: 'currentColor', borderRadius: '2px' }}></div>
              <div style={{ width: '12px', height: '12px', background: 'currentColor', borderRadius: '2px' }}></div>
            </button>
          ))}
        </div>
      </div>

      {/* 2.7. Window Border */}
      <div className="settings-group" style={{ marginBottom: '1.5rem' }}>
        <span className="settings-label">{t("windowBorder")}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: t("thin"), value: '1px' },
            { label: t("standard"), value: '2px' },
            { label: t("thick"), value: '4px' }
          ].map((b) => (
            <button 
              key={b.value} 
              onClick={() => setWindowBorderThickness(b.value)} 
              className={`btn`}
              style={{ 
                height: '44px',
                borderRadius: '0.4rem',
                border: `1px solid ${windowBorderThickness === b.value ? 'var(--accent)' : 'var(--line)'}`,
                color: windowBorderThickness === b.value ? 'var(--accent)' : 'var(--text)',
                boxShadow: windowBorderThickness === b.value ? `inset 0 0 0 2px var(--accent)` : 'none',
                transition: 'all 0.2s ease',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={b.label}
            >
              <div style={{ width: '24px', height: '16px', border: `${b.value} solid currentColor`, borderRadius: '4px' }}></div>
            </button>
          ))}
        </div>
      </div>

      {/* 2.8. Navbar Style */}
      <div className="settings-group" style={{ marginBottom: '1.5rem' }}>
        <span className="settings-label">{t("navbarStyle")}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: t("glass"), value: 'rgba(255, 255, 255, 0.02)' },
            { label: t("solid"), value: 'var(--bg)' }
          ].map((n) => (
            <button 
              key={n.value} 
              onClick={() => setNavStyle(n.value)} 
              className={`btn`}
              style={{ 
                height: '44px',
                borderRadius: '0.4rem',
                border: `1px solid ${navStyle === n.value ? 'var(--accent)' : 'var(--line)'}`,
                color: navStyle === n.value ? 'var(--accent)' : 'var(--text)',
                boxShadow: navStyle === n.value ? `inset 0 0 0 2px var(--accent)` : 'none',
                transition: 'all 0.2s ease',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}
            >
              {n.label}
            </button>
          ))}
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
            {vimMode ? t("vimModeOn") : t("vimModeOff")}
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t("vimModeDesc")}</p>
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
