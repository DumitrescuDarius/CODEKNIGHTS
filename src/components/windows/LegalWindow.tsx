import React from "react";
import { Shield, FileText } from "lucide-react";

interface LegalWindowProps {
  type: "privacy" | "terms";
}

export const LegalWindow: React.FC<LegalWindowProps> = ({ type }) => {
  const isPrivacy = type === "privacy";
  
  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--line)', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>
          {isPrivacy ? "Privacy Policy" : "Terms & Conditions"}
        </h1>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: 1.6, maxWidth: '800px' }}>
        {isPrivacy ? (
          <>
            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>1. Data Collection</h2>
              <p>We collect information you provide directly to us when you create an account, participate in battles, or communicate with us. This includes your username, email address (if provided via OAuth), and any code you submit.</p>
            </section>
            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>2. How We Use Your Information</h2>
              <p>We use the information we collect to operate our platform, match you with opponents, calculate rankings, and improve our services.</p>
            </section>
            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>3. Third-Party Authentication</h2>
              <p>We use third-party OAuth providers (like GitHub and Google) for authentication. We do not store your passwords.</p>
            </section>
            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>4. Data Security</h2>
              <p>We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.</p>
            </section>
          </>
        ) : (
          <>
            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>1. Acceptance of Terms</h2>
              <p>By accessing and using CodeKnights, you agree to be bound by these Terms and Conditions. If you do not agree to all of the terms, do not use the platform.</p>
            </section>
            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>2. Fair Play</h2>
              <p>Users must not use automated bots, external code-generation tools (unless explicitly permitted), or other methods to gain an unfair advantage in ranked battles.</p>
            </section>
            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>3. User Content</h2>
              <p>You retain ownership of the code you submit. However, by submitting code during battles, you grant us the right to store, analyze, and display it for platform purposes (e.g., replays and moderation).</p>
            </section>
            <section>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>4. Account Termination</h2>
              <p>We reserve the right to suspend or terminate accounts that violate these terms, engage in cheating, or disrupt the platform.</p>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
