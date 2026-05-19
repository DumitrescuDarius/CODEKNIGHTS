"use client";

import React, { useState } from "react";
import { Language } from "../../types";
import { LANG_CONFIG } from "../../constants/languages";
import { TranslationKey } from "../../constants/translations";
import { Bot, Code2, Sparkles, Loader2 } from "lucide-react";

interface AgentWindowProps {
  t: (k: TranslationKey) => string;
  lang: Language;
  setLang: (l: Language) => void;
  code: string;
  setCode: (c: string) => void;
  isBattleActive: boolean;
}

export const AgentWindow: React.FC<AgentWindowProps> = ({ t, lang, setLang, code, setCode, isBattleActive }) => {
  const [prompt, setPrompt] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [provider, setProvider] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSolve = async () => {
    setIsLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, language: lang }),
      });
      const data = await res.json();
      setProvider(data?.provider ?? null);
      if (res.ok && data.answer) {
        const ans = typeof data.answer === 'string' ? data.answer : JSON.stringify(data.answer, null, 2);
        setAnswer(ans);
      } else {
        const err = data?.error ?? data;
        const errStr = typeof err === 'string' ? err : JSON.stringify(err, null, 2);
        setAnswer(errStr);
      }
    } catch (err) {
      setAnswer(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const simpleHighlightCpp = (code: string) => {
    const keywords = /\b(int|float|double|char|bool|void|include|iostream|vector|unordered_map|algorithm|using|namespace|std|return|for|while|if|else|cin|cout|endl)\b/g;
    const parts = code.split(keywords);
    return parts.map((part, i) => {
      if (keywords.test(part)) return <span key={i} style={{ color: '#ff79c6' }}>{part}</span>;
      return <span key={i} style={{ color: 'var(--text)' }}>{part}</span>;
    });
  };

  const formatInlineMarkdown = (text: string) => {
    // Parser for inline markdown
    const parts = text.split(/(\*\*.*?\*\*|==.*?==|_.*?_|~~.*?~~|`.*?`|\[.*?\]\(.*?\)|`?\$[^\$]+\$`?)/g);
    return (
      <span style={{ whiteSpace: 'pre-wrap' }}>
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith("==") && part.endsWith("==")) {
            return <mark key={i} style={{ background: 'var(--accent)', color: '#000', padding: '0 0.2rem', borderRadius: '0.1rem' }}>{part.slice(2, -2)}</mark>;
          }
          if (part.startsWith("_") && part.endsWith("_")) {
            return <em key={i}>{part.slice(1, -1)}</em>;
          }
          if (part.startsWith("~~") && part.endsWith("~~")) {
            return <del key={i}>{part.slice(2, -2)}</del>;
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return <code key={i} style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>{part.slice(1, -1)}</code>;
          }
          if (part.startsWith("$") && part.endsWith("$")) {
            return <code key={i} style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{part.slice(1, -1)}</code>;
          }
          if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
            const label = part.substring(1, part.indexOf("]("));
            const url = part.substring(part.indexOf("](") + 2, part.length - 1);
            return <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{label}</a>;
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const formatBlockMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} style={{fontSize: '1.1rem', fontWeight: 800, margin: '0.5rem 0'}}>{formatInlineMarkdown(line.slice(4))}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} style={{fontSize: '1.3rem', fontWeight: 800, margin: '0.5rem 0'}}>{formatInlineMarkdown(line.slice(3))}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} style={{fontSize: '1.5rem', fontWeight: 800, margin: '0.5rem 0'}}>{formatInlineMarkdown(line.slice(2))}</h1>;
      return <div key={i}>{formatInlineMarkdown(line)}</div>;
    });
  };

  const formatAnswer = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const codeContent = part.slice(3, -3).replace(/^(cpp|bash|python|java|javascript|json)\n/, '');
        return (
          <div key={i} style={{ margin: '0.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '0.4rem 0.4rem 0 0' }}>
              <button onClick={() => setCode(codeContent)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Code2 size={12} /> Add to Editor
              </button>
            </div>
            <pre style={{ 
              background: 'rgba(0,0,0,0.4)', 
              padding: '1rem', 
              borderRadius: '0 0 0.4rem 0.4rem', 
              overflowX: 'auto',
              margin: 0
            }}>
              <code style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{simpleHighlightCpp(codeContent)}</code>
            </pre>
          </div>
        );
      }
      return formatBlockMarkdown(part);
    });
  };

  if (isBattleActive) {
    return (
      <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'var(--bg)' }}>
        <Bot size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>{t("agentDisabled")}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bot size={20} /> {t("aiAssistant")}
        </h2>
      </div>

      <textarea 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)} 
        placeholder={t("promptPlaceholder")} 
        style={{ 
          minHeight: '8rem', 
          padding: '1rem', 
          fontFamily: 'monospace', 
          background: 'rgba(255,255,255,0.03)', 
          border: '1px solid var(--line)', 
          borderRadius: '0.5rem', 
          color: 'var(--text)', 
          fontSize: '0.9rem',
          resize: 'vertical' 
        }} 
      />

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={handleSolve} 
          disabled={isLoading || !prompt.trim()} 
          style={{ 
            flex: 1,
            padding: '0.75rem', 
            background: 'var(--accent)', 
            color: '#000', 
            border: 'none', 
            borderRadius: '0.4rem', 
            fontWeight: 800, 
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isLoading ? t("thinking") : t("solve")}
        </button>
        <button 
          onClick={() => { setPrompt(code || ''); }} 
          style={{ 
            padding: '0.75rem', 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid var(--line)', 
            borderRadius: '0.4rem', 
            color: 'var(--text)',
            cursor: 'pointer'
          }}
        >
          <Code2 size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>AI RESPONSE</div>
        {provider && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            Powered by {provider.name || 'AI'}
          </div>
        )}
        <div style={{ 
            padding: '1rem', 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid var(--line)',
            borderRadius: '0.5rem', 
            minHeight: '10rem',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            color: 'var(--text)'
        }}>
          {answer ? formatAnswer(answer) : (isLoading ? t("analyzingCode") : t("noResponseYet"))}
        </div>
      </div>
    </div>
  );
};

export default AgentWindow;
