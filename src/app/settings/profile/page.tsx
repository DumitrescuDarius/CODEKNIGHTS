"use client";

import React, { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, X, User as UserIcon } from "lucide-react";

export default function ProfileSettings() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [username, setUsername] = useState(session?.user?.username || "");
  const [imageUrl, setImageUrl] = useState(session?.user?.image || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (!session) {
    return (
      <div className="main-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Please log in to access this page.</p>
        <Link href="/auth/signin" className="btn btn-ghost" style={{ marginLeft: '1rem' }}>Log in</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, image: imageUrl }),
      });

      if (res.ok) {
        setSuccess("Profile updated successfully!");
        // Update the session to reflect changes
        await update();
        setTimeout(() => router.push("/"), 1500);
      } else {
        const msg = await res.text();
        setError(msg || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ 
        maxWidth: '500px', 
        width: '100%', 
        border: '1px solid var(--line)', 
        padding: '2.5rem', 
        borderRadius: '0.5rem',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '0.5rem' }}>Profile Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Customize how you appear on CodeKnights
          </p>
        </div>

        {error && <div style={{ color: '#ff5555', background: 'rgba(255, 85, 85, 0.1)', padding: '0.75rem', borderRadius: '0.25rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>{error}</div>}
        {success && <div style={{ color: '#50fa7b', background: 'rgba(80, 250, 123, 0.1)', padding: '0.75rem', borderRadius: '0.25rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative' }}>
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserIcon size={40} color="var(--text-muted)" />
                </div>
              )}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  right: 0, 
                  background: 'var(--accent)', 
                  color: '#000', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                }}
                title="Upload from desktop"
              >
                <Upload size={16} />
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click the icon to upload from your desktop</p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>USERNAME</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your unique username"
              style={{
                width: '100%',
                background: '#000',
                border: '1px solid var(--line)',
                padding: '0.75rem',
                borderRadius: '0.25rem',
                color: 'var(--text)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>PROFILE IMAGE URL</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  flex: 1,
                  background: '#000',
                  border: '1px solid var(--line)',
                  padding: '0.75rem',
                  borderRadius: '0.25rem',
                  color: 'var(--text)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {imageUrl && (
                <button 
                  type="button" 
                  onClick={() => setImageUrl("")}
                  className="btn btn-ghost"
                  style={{ padding: '0 0.75rem' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              type="submit" 
              className="btn" 
              disabled={loading}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <Link href="/" style={{ flex: 1, textDecoration: 'none' }}>
              <button type="button" className="btn btn-ghost" style={{ width: '100%' }}>Cancel</button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
