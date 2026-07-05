"use client";

import React, { useState } from "react";
import { Language } from "../../types";
import { LANG_CONFIG } from "../../constants/languages";
import { TranslationKey } from "../../constants/translations";
import { Bot, Code2, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  const MarkdownComponents = {
    code(props: any) {
      const { children, className, node, ...rest } = props;
      const match = /language-(\w+)/.exec(className || '');
      const isBlock = match || String(children).includes('\n');
      
      if (isBlock) {
        const codeContent = String(children).replace(/\n$/, '');
        return (
          <div style={{ margin: '0.5rem 0' }}>
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
              <code style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} {...rest}>
                {simpleHighlightCpp(codeContent)}
              </code>
            </pre>
          </div>
        );
      }
      
      const content = String(children);
      if (!isBlock && !className && content.startsWith("MATH:")) {
        return <code style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{content.slice(5)}</code>;
      }

      return (
        <code style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }} {...rest}>
          {children}
        </code>
      );
    },
    a(props: any) {
      return <a {...props} style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer" />;
    },
    p(props: any) {
      return <p {...props} style={{ marginBottom: '1rem' }} />;
    },
    h1(props: any) { return <h1 {...props} style={{ fontSize: '1.5rem', fontWeight: 800, margin: '1rem 0 0.5rem 0' }} />; },
    h2(props: any) { return <h2 {...props} style={{ fontSize: '1.3rem', fontWeight: 800, margin: '1rem 0 0.5rem 0' }} />; },
    h3(props: any) { return <h3 {...props} style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.5rem 0' }} />; },
    ul(props: any) { return <ul {...props} style={{ margin: '0.5rem 0 1rem 1.5rem', listStyleType: 'disc' }} />; },
    ol(props: any) { return <ol {...props} style={{ margin: '0.5rem 0 1rem 1.5rem', listStyleType: 'decimal' }} />; },
    li(props: any) { return <li {...props} style={{ marginBottom: '0.25rem' }} />; },
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
          {answer ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
              {answer.replace(/\$([^\$]+)\$/g, '`MATH:$1`')}
            </ReactMarkdown>
          ) : (isLoading ? t("analyzingCode") : t("noResponseYet"))}
        </div>
      </div>
    </div>
  );
};

export default AgentWindow;
