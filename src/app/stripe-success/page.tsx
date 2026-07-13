"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Trophy, Crown, ArrowRight } from "lucide-react";

export default function StripeSuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const activateSubscription = async () => {
      try {
        const res = await fetch("/api/stripe/success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          setLoading(false);
        } else {
          setError(true);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError(true);
        setLoading(false);
      }
    };

    activateSubscription();
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at center, #1e1233 0%, #0c0817 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#f8f9fa",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "2rem",
    }}>
      <div style={{
        background: "rgba(30, 20, 50, 0.4)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 215, 0, 0.2)",
        borderRadius: "1.5rem",
        padding: "3rem",
        maxWidth: "480px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
      }}>
        {loading ? (
          <>
            <div style={{
              width: "60px",
              height: "60px",
              border: "4px solid rgba(255, 215, 0, 0.1)",
              borderTopColor: "#ffd700",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }} />
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
              Claiming Royal Status...
            </h2>
            <p style={{ color: "#a0aec0", margin: 0 }}>
              Verifying payment and upgrading your knight credentials.
            </p>
          </>
        ) : error ? (
          <>
            <div style={{
              width: "60px",
              height: "60px",
              background: "rgba(255, 85, 85, 0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ff5555",
            }}>
              <Trophy size={32} />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#ff5555" }}>
              Upgrade Failed
            </h2>
            <p style={{ color: "#a0aec0", margin: 0 }}>
              Something went wrong activating your Royal subscription. Please contact support.
            </p>
            <button
              onClick={() => router.push("/")}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#fff",
                padding: "0.8rem 1.6rem",
                borderRadius: "0.75rem",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              Return Home
            </button>
          </>
        ) : (
          <>
            <div style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{
                position: "absolute",
                width: "120px",
                height: "120px",
                background: "radial-gradient(circle, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0) 70%)",
                filter: "blur(8px)",
                animation: "pulse 2s infinite ease-in-out",
              }} />
              <div style={{
                width: "80px",
                height: "80px",
                background: "linear-gradient(135deg, #ffd700 0%, #ff8800 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1a0f30",
                boxShadow: "0 0 30px rgba(255, 215, 0, 0.4)",
              }}>
                <Crown size={40} />
              </div>
            </div>

            <h2 style={{
              fontSize: "2rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #ffd700 0%, #ffb86c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: "0.5rem 0 0 0",
              letterSpacing: "0.05em",
            }}>
              WELCOME TO THE ROYALS!
            </h2>

            <p style={{ color: "#c3c0df", fontSize: "1rem", lineHeight: "1.5", margin: 0 }}>
              Your account has been upgraded to <strong style={{ color: "#ffd700" }}>CodeKnights Royal</strong>. 
              The Royal crown badge is now visible next to your name.
            </p>

            <button
              onClick={() => {
                // Force full reload or session update, then redirect home
                window.location.href = "/";
              }}
              style={{
                background: "linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)",
                color: "#120824",
                border: "none",
                padding: "1rem 2rem",
                borderRadius: "0.75rem",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 10px 20px -5px rgba(255, 170, 0, 0.4)",
                transition: "all 0.2s",
                marginTop: "1rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 12px 24px -4px rgba(255, 170, 0, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(255, 170, 0, 0.4)";
              }}
            >
              Enter the Arena <ArrowRight size={18} />
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
