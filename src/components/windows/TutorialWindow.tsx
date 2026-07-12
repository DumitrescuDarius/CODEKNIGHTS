"use client";

import React from "react";
import { BookOpen, CheckCircle } from "lucide-react";
import { TranslationKey } from "../../constants/translations";

export const TutorialWindow: React.FC<{ t: (k: TranslationKey) => string }> = ({ t }) => {
  return (
    <div style={{ padding: '2rem', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <BookOpen size={32} color="var(--accent)" />
        <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}>{t("howToPlay")}</h2>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent)' }}>1. Start a Battle</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Head over to the Battle Arena and select Quick Match or challenge a friend via PIN. 
            When an opponent is found, the duel begins!
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent)' }}>2. Solve the Algorithm</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            You and your opponent will receive the exact same algorithmic problem. 
            Use the integrated editor to write your solution in your preferred language.
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent)' }}>3. Run Tests</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Click Run to execute your code against the public examples. Once you are confident, submit your solution!
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent)' }}>4. Claim Victory</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            The first player to successfully pass all hidden tests wins the battle, gains rank points, and keeps their streak alive. Good luck!
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent)' }}>5. Submission Penalty System</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
            In a battle, the player with the <strong>lowest penalty score</strong> wins! Your penalty is calculated as follows:
          </p>
          <ul style={{ color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li><strong>Time</strong>: {t("penaltyTime")}</li>
            <li><strong>Wrong Attempts</strong>: {t("penaltyWrong")}</li>
            <li><strong>Sub-optimal Complexity</strong>: {t("penaltyComplexity")}</li>
          </ul>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent)' }}>6. Ranking & Score System</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
            When you win a battle, you will gain between <strong>50 and 70 Elo points</strong>. 
            If you lose, you will lose a similar amount. As you accumulate points, you will progress through the ranks:
          </p>
          <ul style={{ color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li><strong>{t("bronze")}</strong>: &lt; 1100 points</li>
            <li><strong>{t("silver")}</strong>: 1100+ points</li>
            <li><strong>{t("gold")}</strong>: 1300+ points</li>
            <li><strong>{t("diamond")}</strong>: 1600+ points</li>
            <li><strong>{t("master" as any)}</strong>: 2000+ points</li>
            <li><strong>{t("grandmaster" as any)}</strong>: 2500+ points</li>
          </ul>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent)' }}>7. Keybindings</h3>
          <ul style={{ color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>Alt + &apos;</strong> or <strong>Alt + Enter</strong>: Run Code</li>

            <li><strong>Alt + W</strong>: Close current or last opened window</li>
            <li><strong>Alt + M</strong>: Toggle window maximize</li>
            <li><strong>Alt + S</strong>: Open Settings</li>
            <li><strong>Alt + B</strong>: Open Battle Arena</li>
            <li><strong>Alt + ArrowLeft/ArrowRight</strong>: Cycle focus between open windows</li>
            <li><strong>Alt + Shift + ArrowLeft/ArrowRight</strong>: Move active window left or right</li>
          </ul>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#50fa7b', fontWeight: 800, marginTop: '1rem', justifyContent: 'center' }}>
          <CheckCircle size={20} /> You are ready for the arena!
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--line)', paddingTop: '1.5rem' }}>
          Project created by Dumitrescu Darius - Ioan, student at Colegiul National &quot;Mircea cel Batran&quot;
        </div>
      </div>
    </div>
  );
};
