"use client";

import React, { useState, useEffect } from "react";
import { Language } from "../../types";
import { LANG_CONFIG } from "../../constants/languages";
import { TranslationKey } from "../../constants/translations";
import { Brain, Code2, Sparkles, Loader2, History, Plus, X, MessageSquare, Trash2, Crown } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { WindowSpinner } from "../WindowSpinner";

interface AgentWindowProps {
  t: (k: TranslationKey) => string;
  lang: Language;
  setLang: (l: Language) => void;
  code: string;
  setCode: (c: string) => void;
  isBattleActive: boolean;
  session: any;
}

const simpleHighlightCpp = (code: string) => {
  const keywords = /\b(int|float|double|char|bool|void|include|iostream|vector|unordered_map|algorithm|using|namespace|std|return|for|while|if|else|cin|cout|endl)\b/g;
  const parts = code.split(keywords);
  return parts.map((part, i) => {
    if (keywords.test(part)) return <span key={i} style={{ color: '#ff79c6' }}>{part}</span>;
    return <span key={i} style={{ color: 'var(--text)' }}>{part}</span>;
  });
};

const getMarkdownComponents = (setCode: (c: string) => void) => ({
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
  a(props: any) { return <a {...props} style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer" />; },
  p(props: any) { return <p {...props} style={{ marginBottom: '1rem' }} />; },
  h1(props: any) { return <h1 {...props} style={{ fontSize: '1.5rem', fontWeight: 800, margin: '1rem 0 0.5rem 0' }} />; },
  h2(props: any) { return <h2 {...props} style={{ fontSize: '1.3rem', fontWeight: 800, margin: '1rem 0 0.5rem 0' }} />; },
  h3(props: any) { return <h3 {...props} style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.5rem 0' }} />; },
  ul(props: any) { return <ul {...props} style={{ margin: '0.5rem 0 1rem 1.5rem', listStyleType: 'disc' }} />; },
  ol(props: any) { return <ol {...props} style={{ margin: '0.5rem 0 1rem 1.5rem', listStyleType: 'decimal' }} />; },
  li(props: any) { return <li {...props} style={{ marginBottom: '0.25rem' }} />; },
});

const TypewriterMarkdown = React.memo(({ content, isNew, setCode, scrollContainerRef }: { content: string, isNew?: boolean, setCode: (c: string) => void, scrollContainerRef?: React.RefObject<HTMLDivElement> }) => {
  const [displayed, setDisplayed] = useState(isNew ? "" : content);

  useEffect(() => {
    if (!isNew) {
      setDisplayed(content);
      return;
    }
    
    let currentIdx = 0;
    setDisplayed("");
    
    const interval = setInterval(() => {
      const nextSpace = content.indexOf(' ', currentIdx + 1);
      const nextNewline = content.indexOf('\n', currentIdx + 1);
      
      let nextIdx = -1;
      if (nextSpace !== -1 && nextNewline !== -1) {
        nextIdx = Math.min(nextSpace, nextNewline);
      } else if (nextSpace !== -1) {
        nextIdx = nextSpace;
      } else if (nextNewline !== -1) {
        nextIdx = nextNewline;
      }
      
      if (nextIdx === -1) {
        setDisplayed(content);
        clearInterval(interval);
      } else {
        currentIdx = nextIdx;
        setDisplayed(content.slice(0, currentIdx + 1));
      }
    }, 30);
    
    return () => clearInterval(interval);
  }, [content, isNew]);

  useEffect(() => {
    if (isNew && scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [displayed, isNew, scrollContainerRef]);

  const getSafeMarkdown = (text: string) => {
    if (!isNew || text === content) return text;
    let safeText = text;
    const codeBlockCount = (safeText.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      safeText += '\n```\n';
    }
    return safeText;
  };

  const components = React.useMemo(() => getMarkdownComponents(setCode), [setCode]);

  return (
    <div className="markdown-body" style={{ color: 'inherit' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {getSafeMarkdown(displayed).replace(/\$([^\$]+)\$/g, '`MATH:$1`')}
      </ReactMarkdown>
    </div>
  );
});

export const AgentWindow: React.FC<AgentWindowProps> = ({ t, lang, setLang, code, setCode, isBattleActive, session }) => {
  const isRoyal = !!(session?.user as any)?.isRoyal;
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  type ChatMessage = {role: 'user'|'assistant', content: string, isNew?: boolean};
  type ChatSession = { id: string; title: string; updatedAt: number; messages: ChatMessage[] };

  const [prompt, setPrompt] = useState<string>("");
  const [contextTags, setContextTags] = useState<string[]>([]);
  const [customContexts, setCustomContexts] = useState<{id: string, title: string, content: string}[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTop = container.scrollHeight;
      
      const timer = setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading]);

  useEffect(() => {
    // Process any queued contexts
    if (typeof window !== "undefined" && (window as any).ckAiContexts) {
      const queue = (window as any).ckAiContexts;
      if (queue.length > 0) {
        setCustomContexts(prev => {
          const next = [...prev];
          queue.forEach((item: any) => {
            if (!next.find(c => c.id === item.id)) {
              next.push(item);
            }
          });
          return next;
        });
      }
    }

    const handleAddContext = (e: any) => {
      if (e.detail && e.detail.id && e.detail.content) {
        setCustomContexts(prev => {
          if (prev.find(c => c.id === e.detail.id)) return prev;
          return [...prev, { id: e.detail.id, title: e.detail.title || "Note", content: e.detail.content }];
        });
        
        // Also remove from global queue if present to keep it clean
        if (typeof window !== "undefined" && (window as any).ckAiContexts) {
          (window as any).ckAiContexts = (window as any).ckAiContexts.filter((item: any) => item.id !== e.detail.id);
        }
      }
    };
    window.addEventListener('add_ai_context', handleAddContext);
    return () => window.removeEventListener('add_ai_context', handleAddContext);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ck_agent_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
          setMessages(parsed[0].messages.map((m: any) => ({...m, isNew: false})));
        } else {
          startNewSession();
        }
      } else {
        startNewSession();
      }
    } catch(e) {
       startNewSession();
    }
  }, []);

  const startNewSession = () => {
    const newId = Date.now().toString();
    setCurrentSessionId(newId);
    setMessages([]);
    setSessions(prev => [{ id: newId, title: "New Chat", updatedAt: Date.now(), messages: [] }, ...prev]);
    setShowHistory(false);
  };

  useEffect(() => {
    if (!currentSessionId) return;
    setSessions(prev => {
      const copy = [...prev];
      const idx = copy.findIndex(s => s.id === currentSessionId);
      if (idx !== -1) {
        copy[idx] = { 
          ...copy[idx], 
          updatedAt: Date.now(), 
          messages,
          title: messages.length > 0 ? messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? "..." : "") : "New Chat"
        };
        copy.sort((a,b) => b.updatedAt - a.updatedAt);
        localStorage.setItem("ck_agent_sessions", JSON.stringify(copy));
        return copy;
      }
      return prev;
    });
  }, [messages, currentSessionId]);

  const loadSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(session.id);
      setMessages(session.messages.map(m => ({...m, isNew: false})));
      setShowHistory(false);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const nextSessions = sessions.filter(s => s.id !== id);
    setSessions(nextSessions);
    localStorage.setItem("ck_agent_sessions", JSON.stringify(nextSessions));
    if (currentSessionId === id) {
      if (nextSessions.length > 0) {
        setCurrentSessionId(nextSessions[0].id);
        setMessages(nextSessions[0].messages.map(m => ({...m, isNew: false})));
      } else {
        startNewSession();
      }
    }
  };

  const handleSolve = async () => {
    if (!prompt.trim() && contextTags.length === 0) return;
    
    let fullPrompt = prompt;
    if (contextTags.length > 0 || customContexts.length > 0) {
      let contextStrs = [];
      if (contextTags.includes("editor")) contextStrs.push(`[Context: Editor Code]\n\`\`\`${lang}\n${code}\n\`\`\``);
      if (contextTags.includes("problem")) contextStrs.push(`[Context: Current Problem]\nPlease help me understand and solve the current problem.`);
      if (contextTags.includes("notes")) contextStrs.push(`[Context: My Notes]\nPlease help me organize my thoughts and notes.`);
      if (contextTags.includes("battle")) contextStrs.push(`[Context: Battle]\nPlease give me tips for winning this battle.`);
      
      customContexts.forEach(c => {
        contextStrs.push(`[Context: ${c.title}]\n${c.content}`);
      });

      fullPrompt = (prompt.trim() ? prompt + "\n\n" : "") + contextStrs.join("\n\n");
    }

    const userMsg = { role: 'user' as const, content: fullPrompt };
    // Remove isNew flag from previous messages
    const existingMessages = messages.map(m => ({...m, isNew: false}));
    const newMessages = [...existingMessages, userMsg];
    setMessages(newMessages);
    setPrompt("");
    setContextTags([]);
    setCustomContexts([]);
    setIsLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, language: lang }),
      });
      const data = await res.json();
      setProvider(data?.provider ?? null);
      if (res.ok && data.answer) {
        const ans = typeof data.answer === 'string' ? data.answer : JSON.stringify(data.answer, null, 2);
        setMessages(prev => [...prev.map(m => ({...m, isNew: false})), { role: 'assistant', content: ans, isNew: true }]);
      } else {
        const errMsg = data?.error || JSON.stringify(data);
        const debugInfo = data?.debug ? `\n\nDebug Info: ${data.debug}` : '';
        const errStr = typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg, null, 2);
        setMessages(prev => [...prev.map(m => ({...m, isNew: false})), { role: 'assistant', content: `Error: ${errStr}${debugInfo}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev.map(m => ({...m, isNew: false})), { role: 'assistant', content: err instanceof Error ? err.message : String(err) }]);
    } finally {
      setIsLoading(false);
    }
  };



  if (!mounted) {
    return (
      <div style={{ height: '100%', width: '100%', background: 'var(--bg)', position: 'relative' }}>
        <WindowSpinner message={t("loading") || "LOADING..."} />
      </div>
    );
  }

  if (isBattleActive) {
    return (
      <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'var(--bg)' }}>
        <Brain size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>{t("agentDisabled")}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', position: 'relative' }}>

      {/* History Overlay Menu */}
      {showHistory && (
        <div style={{
          position: 'absolute', top: '4.5rem', left: '1.5rem', width: '280px', maxHeight: '60%',
          background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--line)', borderRadius: '1rem', zIndex: 10,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={16} color="var(--accent)" /> Past Chats
            </h3>
          </div>
          <div style={{ padding: '0.75rem' }}>
            <button 
              onClick={startNewSession}
              style={{ width: '100%', padding: '0.75rem', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Plus size={16} /> New Chat
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.75rem 0.75rem 0.75rem' }}>
            {sessions.map(s => (
              <div 
                key={s.id}
                onClick={() => loadSession(s.id)}
                style={{
                  padding: '0.75rem', borderRadius: '0.6rem', cursor: 'pointer',
                  background: currentSessionId === s.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '0.3rem', color: currentSessionId === s.id ? 'var(--text)' : 'var(--text-muted)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => { if(currentSessionId !== s.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={(e) => { if(currentSessionId !== s.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                  <MessageSquare size={14} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{s.title}</span>
                </div>
                <button onClick={(e) => deleteSession(e, s.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating History Toggle Button */}
      <button 
        onClick={() => setShowHistory(!showHistory)}
        style={{
          position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 5,
          background: showHistory ? 'var(--accent)' : 'rgba(0,0,0,0.6)', 
          border: showHistory ? '1px solid var(--accent)' : '1px solid var(--line)', 
          borderRadius: '50%',
          width: '44px', height: '44px', 
          color: showHistory ? '#000' : 'var(--text-muted)', 
          cursor: 'pointer',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'all 0.2s'
        }}
        title="Toggle Past Chats"
        onMouseEnter={(e) => { if(!showHistory) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
        onMouseLeave={(e) => { if(!showHistory) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.transform = 'scale(1)'; } }}
      >
        {showHistory ? <X size={20} /> : <History size={20} />}
      </button>

      {/* Chat History */}
      <div ref={chatContainerRef} style={{ flex: 1, padding: '3.5rem 1.5rem 1.5rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {messages.length === 0 && !isLoading && (
          <div style={{ margin: 'auto', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={32} color="var(--text-muted)" />
            </div>
            <p style={{ margin: 0 }}>{t("agentGreeting")}</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: '0.4rem'
          }}>
            <div style={{ 
              fontSize: '0.7rem', 
              color: 'var(--text-muted)', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              padding: '0 0.5rem'
            }}>
              {msg.role === 'user' ? t('you' as any) || 'You' : provider?.name || 'AI Assistant'}
            </div>
            <div style={{ 
              maxWidth: '85%',
              background: msg.role === 'user' ? 'var(--accent)' : 'rgba(255,255,255,0.02)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--line)',
              borderRadius: msg.role === 'user' ? '1.2rem 1.2rem 0 1.2rem' : '1.2rem 1.2rem 1.2rem 0',
              padding: '1rem 1.2rem',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: msg.role === 'user' ? '#000' : 'var(--text)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              overflowX: 'auto'
            }}>
              {msg.role === 'user' ? (
                <div style={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>{msg.content}</div>
              ) : (
                <TypewriterMarkdown content={msg.content} isNew={msg.isNew} setCode={setCode} scrollContainerRef={chatContainerRef} />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid var(--line)' }}>
            <div className="loading-spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }} /> {t("thinking")}...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div 
        style={{ padding: '1.5rem', borderTop: '1px solid var(--line)', background: 'rgba(0,0,0,0.2)', flexShrink: 0, transition: 'background 0.2s' }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
        onDragLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.2)'; }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
          const windowId = e.dataTransfer.getData("application/window-id");
          if (!windowId) return;
          if (["editor", "battle"].includes(windowId)) {
            setContextTags(prev => prev.includes(windowId) ? prev : [...prev, windowId]);
          } else {
            window.dispatchEvent(new CustomEvent('request_ai_context', { detail: windowId }));
          }
        }}
      >
        {(contextTags.length > 0 || customContexts.length > 0) && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
            {contextTags.map(tag => (
              <div key={tag} style={{ 
                display: 'flex', alignItems: 'center', gap: '0.4rem', 
                background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', 
                borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' 
              }}>
                <span style={{ color: 'var(--accent)', textTransform: 'capitalize' }}>{tag}</span>
                <button 
                  onClick={() => setContextTags(prev => prev.filter(t => t !== tag))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {customContexts.map(c => (
              <div key={c.id} style={{ 
                display: 'flex', alignItems: 'center', gap: '0.4rem', 
                background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', 
                borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' 
              }}>
                <span style={{ color: 'var(--accent)', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px', whiteSpace: 'nowrap' }}>{c.title}</span>
                <button 
                  onClick={() => setCustomContexts(prev => prev.filter(t => t.id !== c.id))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ 
          display: 'flex', 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid var(--line)', 
          borderRadius: '0.8rem', 
          overflow: 'hidden',
          transition: 'border-color 0.2s',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <textarea 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSolve();
              }
            }}
            placeholder={t("promptPlaceholder")} 
            style={{ 
              flex: 1,
              minHeight: '3.5rem', 
              maxHeight: '12rem',
              padding: '1rem', 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text)', 
              fontSize: '0.95rem',
              lineHeight: 1.5,
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box'
            }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', gap: '0.5rem', borderLeft: '1px solid var(--line)', background: 'rgba(0,0,0,0.1)' }}>
            <button 
              onClick={() => setPrompt(prev => prev + (prev ? '\n\n' : '') + code)} 
              title="Append Current Code"
              style={{ 
                padding: '0.6rem', 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-muted)',
                cursor: 'pointer',
                borderRadius: '0.4rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, color 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Code2 size={16} />
            </button>
            <button 
              onClick={handleSolve} 
              disabled={isLoading || !prompt.trim()} 
              style={{ 
                padding: '0.6rem', 
                background: isLoading || !prompt.trim() ? 'rgba(255,255,255,0.05)' : 'var(--accent)', 
                color: isLoading || !prompt.trim() ? 'var(--text-muted)' : '#000', 
                border: 'none', 
                borderRadius: '0.4rem', 
                cursor: isLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.1s, background 0.2s'
              }}
              onMouseDown={(e) => { if (!isLoading && prompt.trim()) e.currentTarget.style.transform = 'scale(0.95)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <Sparkles size={16} />
            </button>
          </div>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.75rem', opacity: 0.7 }}>
          {t("agentKeyboardHint")}
        </div>
      </div>
    </div>
  );
};

export default AgentWindow;
