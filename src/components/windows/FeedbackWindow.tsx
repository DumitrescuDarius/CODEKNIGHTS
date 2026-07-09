import React, { useState } from 'react';
import { Send, CheckCircle, AlertTriangle, MessageSquareHeart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { TranslationKey } from '../../constants/translations';

interface FeedbackWindowProps {
  t: (k: TranslationKey) => string;
  session?: any;
}

const FeedbackWindow: React.FC<FeedbackWindowProps> = ({ session, t }) => {
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSendFeedback = async () => {
    if (!feedback.trim()) return;
    
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          feedback,
          userEmail: session?.user?.email || "Guest"
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send feedback");
      }

      setStatus("success");
      setFeedback("");
      
      // Auto reset success message after 5 seconds
      setTimeout(() => setStatus("idle"), 5000);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "An error occurred");
    }
  };

  return (
    <div style={{ 
      padding: '2.5rem', 
      height: '100%', 
      overflow: 'auto', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(135deg, var(--bg) 0%, rgba(0,0,0,0.8) 100%)', 
      color: 'var(--text)',
      position: 'relative'
    }}>
      {/* Decorative Glow */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'var(--accent)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '200px', height: '200px', background: 'var(--accent)', filter: 'blur(120px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', zIndex: 1 }}>
        <div style={{ background: 'var(--accent)', color: '#000', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquareHeart size={20} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{t("sendFeedbackTitle") || t("sendFeedback")}</h2>
      </div>
      
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.5, zIndex: 1 }}>
        {t("feedbackDesc")}
      </p>

      <AnimatePresence mode="wait">
        {status === "success" && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ padding: '1rem', background: 'rgba(80, 250, 123, 0.1)', border: '1px solid rgba(80, 250, 123, 0.3)', color: '#50fa7b', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', zIndex: 1, boxShadow: '0 4px 12px rgba(80, 250, 123, 0.05)' }}
          >
            <CheckCircle size={18} />
            <span style={{ fontWeight: 600 }}>{t("feedbackSuccess")}</span>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ padding: '1rem', background: 'rgba(255, 85, 85, 0.1)', border: '1px solid rgba(255, 85, 85, 0.3)', color: '#ff5555', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', zIndex: 1, boxShadow: '0 4px 12px rgba(255, 85, 85, 0.05)' }}
          >
            <AlertTriangle size={18} />
            <span style={{ fontWeight: 600 }}>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{
        flex: 1,
        marginBottom: '1.5rem',
        zIndex: 1,
        borderRadius: '0.75rem',
        padding: '2px',
        background: isFocused ? 'linear-gradient(135deg, var(--accent) 0%, transparent 100%)' : 'rgba(255,255,255,0.05)',
        transition: 'background 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <textarea 
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t("feedbackPlaceholder")}
          style={{
            flex: 1,
            background: 'var(--bg)',
            border: 'none',
            borderRadius: '0.65rem',
            padding: '1.25rem',
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: '1rem',
            lineHeight: 1.6,
            resize: 'none',
            outline: 'none',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
          }}
        />
      </div>

      <motion.button 
        whileHover={{ scale: (status === "loading" || !feedback.trim()) ? 1 : 1.02 }}
        whileTap={{ scale: (status === "loading" || !feedback.trim()) ? 1 : 0.98 }}
        onClick={handleSendFeedback}
        disabled={status === "loading" || !feedback.trim()}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '1rem', 
          background: 'var(--accent)', 
          color: '#000', 
          border: 'none', 
          borderRadius: '0.75rem', 
          fontWeight: 800,
          fontSize: '1rem',
          cursor: (status === "loading" || !feedback.trim()) ? 'not-allowed' : 'pointer',
          opacity: (status === "loading" || !feedback.trim()) ? 0.6 : 1,
          zIndex: 1,
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}
      >
        {status === "loading" ? (
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: 'flex' }}>
            <AlertTriangle size={18} style={{ opacity: 0 }} /> {/* Spacer */}
            <div style={{ position: 'absolute', width: '18px', height: '18px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%' }} />
          </motion.div>
        ) : (
          <Send size={18} />
        )}
        {status === "loading" ? t("sending") : t("sendFeedbackBtn")}
      </motion.button>
    </div>
  );
};

export default FeedbackWindow;
