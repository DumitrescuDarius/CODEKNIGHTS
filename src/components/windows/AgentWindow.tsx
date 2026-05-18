"use client";

import React, { useState } from "react";
import { Language } from "../../types";
import { LANG_CONFIG } from "../../constants/languages";
import { TranslationKey } from "../../constants/translations";

interface AgentWindowProps {
  t: (k: TranslationKey) => string;
  lang: Language;
  setLang: (l: Language) => void;
  code: string;
  setCode: (c: string) => void;
}

export const AgentWindow: React.FC<AgentWindowProps> = ({ t, lang, setLang, code, setCode }) => {
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

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select value={lang} onChange={(e) => setLang(e.target.value as Language)} style={{ padding: '0.35rem' }}>
          {Object.keys(LANG_CONFIG).map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <button onClick={handleSolve} disabled={isLoading || !prompt.trim()} style={{ padding: '0.4rem 0.6rem' }}>
          {isLoading ? 'Solving...' : 'Solve'}
        </button>
        <button onClick={() => { setPrompt(code || ''); }} style={{ padding: '0.35rem' }}>Use Editor Code</button>
      </div>

      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the problem or paste the statement here" style={{ minHeight: '8rem', padding: '0.6rem', fontFamily: 'monospace' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontWeight: 600 }}>Answer</div>
        {provider && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Provider: {provider.name || 'unknown'}{provider.model ? ` — model: ${provider.model}` : ''}
          </div>
        )}
        <pre style={{ whiteSpace: 'pre-wrap', padding: '0.75rem', background: 'rgba(0,0,0,0.03)', borderRadius: '0.4rem', minHeight: '6rem' }}>{answer || (isLoading ? 'Thinking...' : 'No answer yet')}</pre>
        {provider?.body && (
          <details style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            <summary>Provider raw response (debug)</summary>
            <pre style={{ whiteSpace: 'pre-wrap', padding: '0.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '0.25rem' }}>{JSON.stringify(provider.body, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default AgentWindow;
