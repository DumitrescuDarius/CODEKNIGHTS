"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignIn() {
  return (
    <div className="main-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ 
        maxWidth: '400px', 
        width: '100%', 
        border: '1px solid var(--line)', 
        padding: '2.5rem', 
        borderRadius: '0.5rem',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Link href="/" className="brand" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span className="brand-name" style={{ fontSize: '1.5rem' }}>EComp</span>
          </Link>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Sign in to your account
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
            onClick={() => signIn("github", { callbackUrl: "/" })}
          >
            Sign in with GitHub
          </button>
          
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            Sign in with Google
          </button>
        </div>

        <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
