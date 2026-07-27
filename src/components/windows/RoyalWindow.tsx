"use client";

import React, { useState, useEffect } from "react";
import { Crown, Check, ShieldCheck, Loader2, CreditCard, Lock, AlertTriangle } from "lucide-react";
import { WindowSpinner } from "../WindowSpinner";
import { TranslationKey } from "../../constants/translations";

interface RoyalWindowProps {
  session: any;
  t: (key: TranslationKey) => string;
  onUpgradeSuccess: () => void;
}

export const RoyalWindow: React.FC<RoyalWindowProps> = ({ session, t, onUpgradeSuccess }) => {
  const [isRoyal, setIsRoyal] = useState(!!(session?.user as any)?.isRoyal);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [validationError, setValidationError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    setIsRoyal(!!(session?.user as any)?.isRoyal);
  }, [session]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    setInfoMessage("");

    if (!cardName.trim()) {
      setValidationError("Cardholder name is required.");
      return;
    }
    if (cardNumber.replace(/\s/g, "").length < 16) {
      setValidationError("Please enter a valid 16-digit card number.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setValidationError("Please enter expiry date in MM/YY format.");
      return;
    }
    if (cardCvc.length < 3) {
      setValidationError("Please enter a valid 3 or 4 digit CVC.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/stripe/success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setSuccess(true);
        setIsRoyal(true);
        // Force the parent menu session to update immediately
        if (session && session.user) {
          (session.user as any).isRoyal = true;
        }
        onUpgradeSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setValidationError(data.error || "Transaction declined. Please try another card.");
      }
    } catch (err) {
      console.error(err);
      setValidationError("Failed to communicate with Stripe servers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setValidationError("");
    setInfoMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setIsRoyal(false);
        setSuccess(false);
        if (session && session.user) {
          (session.user as any).isRoyal = false;
        }
        onUpgradeSuccess(); // Notify parent window of session changes
        setInfoMessage("Your subscription was successfully canceled. You are now a Standard member.");
      } else {
        const data = await res.json().catch(() => ({}));
        setValidationError(data.error || "Failed to cancel subscription. Please contact support.");
      }
    } catch (err) {
      console.error(err);
      setValidationError("Communication error with billing server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const matches = val.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(" "));
    } else {
      setCardNumber(val);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + "/" + val.substring(2);
    }
    setCardExpiry(val);
  };

  // State A: User is already a Royal subscriber (Manage / Cancel subscription)
  if (isRoyal && !success) {
    return (
      <div style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2.5rem",
        boxSizing: "border-box",
        background: "radial-gradient(ellipse at top center, #261b07 0%, var(--bg) 80%)",
        overflowY: "auto",
        position: "relative"
      }}>
        {loading && <WindowSpinner message="Canceling membership..." />}
        
        {/* Animated Glow Behind Card */}
        <div style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, rgba(0, 0, 0, 0) 70%)",
          filter: "blur(40px)",
          animation: "pulseGlow 4s infinite alternate",
        }} />

        <div style={{
          position: "relative",
          background: "rgba(10, 8, 15, 0.7)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 215, 0, 0.15)",
          borderTop: "1px solid rgba(255, 215, 0, 0.3)",
          borderRadius: "2rem",
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.1)",
          padding: "3.5rem 3rem",
          boxSizing: "border-box",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
          zIndex: 1
        }}>
          <div style={{
            position: "relative",
            width: "90px",
            height: "90px",
            background: "linear-gradient(135deg, #fff2a8 0%, #d4af37 50%, #996515 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#120824",
            boxShadow: "0 0 0 6px rgba(255, 215, 0, 0.1), 0 0 30px rgba(255, 215, 0, 0.5)",
          }}>
            <Crown size={40} fill="currentColor" strokeWidth={1} />
            <div style={{
              position: "absolute",
              inset: "-4px",
              borderRadius: "50%",
              border: "1px solid rgba(255, 215, 0, 0.4)",
              animation: "spin 10s linear infinite",
            }} />
          </div>

          <div>
            <h3 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff", margin: "0 0 0.5rem 0", letterSpacing: "0.03em" }}>
              Royal Membership <span style={{ color: "var(--color-gold)" }}>Active</span>
            </h3>
            <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0, lineHeight: "1.6" }}>
              You are currently enjoying unrestricted access to the premium CodeKnights experience.
            </p>
          </div>

          <div style={{
            background: "linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "1rem",
            width: "100%",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            textAlign: "left",
          }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--color-gold)", letterSpacing: "0.1em" }}>YOUR PERKS</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", fontSize: "0.9rem", color: "var(--text)" }}>
                <div style={{ background: "rgba(255,215,0,0.15)", borderRadius: "50%", padding: "4px" }}><Check size={14} color="var(--color-gold)" strokeWidth={3} /></div>
                <span>Unlimited AI Assistant Prompts</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", fontSize: "0.9rem", color: "var(--text)" }}>
                <div style={{ background: "rgba(255,215,0,0.15)", borderRadius: "50%", padding: "4px" }}><Check size={14} color="var(--color-gold)" strokeWidth={3} /></div>
                <span>Exclusive Gold Crown PFP Badges</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", fontSize: "0.9rem", color: "var(--text)" }}>
                <div style={{ background: "rgba(255,215,0,0.15)", borderRadius: "50%", padding: "4px" }}><Check size={14} color="var(--color-gold)" strokeWidth={3} /></div>
                <span>Access to Premium WIP Game Modes</span>
              </div>
            </div>
          </div>

          {validationError && (
            <div style={{
              background: "rgba(255, 85, 85, 0.1)",
              borderLeft: "3px solid var(--color-red)",
              color: "var(--color-red)",
              borderRadius: "0.4rem",
              padding: "1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              width: "100%",
              textAlign: "left"
            }}>
              {validationError}
            </div>
          )}

          <div style={{ width: "100%", marginTop: "1rem" }}>
            <button
              onClick={handleCancelSubscription}
              disabled={loading}
              style={{
                background: "transparent",
                color: "var(--text-muted)",
                border: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s",
                padding: "0.75rem 1rem",
                width: "100%",
                borderRadius: "0.75rem"
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "rgba(255, 85, 85, 0.08)";
                  e.currentTarget.style.color = "var(--color-red)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }
              }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Canceling Membership...</>
              ) : (
                <><AlertTriangle size={16} /> Cancel Royal Membership</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State B: Confirm Success Upgrade screen
  if (success) {
    return (
      <div style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "radial-gradient(ellipse at top center, #261b07 0%, var(--bg) 100%)",
        textAlign: "center",
        boxSizing: "border-box",
        position: "relative"
      }}>
        {/* Animated Particles/Glow */}
        <div style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, rgba(0, 0, 0, 0) 60%)",
          filter: "blur(50px)",
          animation: "pulseGlow 3s infinite alternate",
        }} />

        <div style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem"
        }}>
          <div style={{
            width: "100px",
            height: "100px",
            background: "linear-gradient(135deg, #fff2a8 0%, #d4af37 50%, #996515 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#120824",
            boxShadow: "0 0 0 10px rgba(255, 215, 0, 0.1), 0 0 50px rgba(255, 215, 0, 0.6)",
          }}>
            <Crown size={48} fill="currentColor" strokeWidth={1} />
          </div>

          <h3 style={{
            fontSize: "2.2rem",
            fontWeight: 900,
            background: "linear-gradient(135deg, #fff2a8 0%, var(--color-gold) 50%, #d4af37 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "1rem 0 0 0",
            letterSpacing: "0.02em",
          }}>
            WELCOME TO ROYALTY
          </h3>

          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: "480px", margin: 0, lineHeight: "1.6" }}>
            Your account is now upgraded to <strong style={{ color: "var(--color-gold)" }}>CodeKnights Royal</strong>. Your gold crown badge has been unlocked across the platform.
          </p>

          <button
            onClick={() => setSuccess(false)}
            style={{
              background: "linear-gradient(135deg, #fff2a8 0%, #d4af37 100%)",
              border: "none",
              color: "#120824",
              padding: "0.8rem 2rem",
              borderRadius: "2rem",
              fontSize: "1rem",
              fontWeight: 800,
              cursor: "pointer",
              marginTop: "1.5rem",
              boxShadow: "0 10px 20px -5px rgba(255, 215, 0, 0.4)",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(255, 215, 0, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(255, 215, 0, 0.4)";
            }}
          >
            Enter the Arena
          </button>
        </div>
      </div>
    );
  }

  // State C: Purchase subscription form
  return (
    <div style={{
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      boxSizing: "border-box",
      background: "radial-gradient(ellipse at top center, #1e1505 0%, var(--bg) 80%)",
      overflowY: "auto",
      position: "relative"
    }}>
      {loading && <WindowSpinner message="Processing payment..." />}
      
      {/* Background Ambience */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "70vw",
        height: "50vh",
        background: "radial-gradient(ellipse at center, rgba(255, 215, 0, 0.05) 0%, rgba(0,0,0,0) 70%)",
        filter: "blur(60px)",
        pointerEvents: "none"
      }} />

      {/* Main Container - Banner Style */}
      <div style={{
        background: "rgba(10, 8, 15, 0.7)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        border: "1px solid rgba(255, 215, 0, 0.15)",
        borderTop: "1px solid rgba(255, 215, 0, 0.4)",
        borderRadius: "1rem",
        width: "100%",
        maxWidth: "850px",
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.05)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "row",
        position: "relative",
        zIndex: 1
      }}>
        {/* Left Pane: Perks list */}
        <div style={{
          flex: "1 1 50%",
          padding: "1.5rem 2rem",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%)",
          borderRight: "1px solid rgba(255, 255, 255, 0.05)",
          boxSizing: "border-box",
        }}>
          {/* Decorative Corner Glow */}
          <div style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100px", height: "100px",
            background: "radial-gradient(circle at top left, rgba(255,215,0,0.15) 0%, rgba(0,0,0,0) 70%)",
            pointerEvents: "none"
          }} />

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <div style={{ background: "rgba(255,215,0,0.15)", borderRadius: "6px", padding: "4px" }}>
                <Crown size={16} color="var(--color-gold)" fill="var(--color-gold)" />
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 900, letterSpacing: "0.2em", color: "var(--color-gold)" }}>PREMIUM</span>
            </div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.1 }}>
              CodeKnights <span style={{ background: "linear-gradient(135deg, #fff2a8 0%, #d4af37 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Royal</span>
            </h3>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", margin: "0.5rem 0 0 0", lineHeight: "1.4" }}>
              Unlock the ultimate competitive coding experience and exclusive gamemodes.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "1.2rem", flex: 1, justifyContent: "center" }}>
            {[
              { title: "Gold Royal Badge", desc: "A sleek gold crown next to your username." },
              { title: "WIP Game Modes", desc: "Instant access to BUG HUNTER & MLMAGES." },
              { title: "Unlimited Matches", desc: "Bypass queue limits. Battle without boundaries." },
              { title: "Unlimited AI Access", desc: "Query the Agent as much as you want." },
            ].map((perk, i) => (
              <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{
                  background: "rgba(255, 215, 0, 0.08)",
                  border: "1px solid rgba(255, 215, 0, 0.2)",
                  color: "var(--color-gold)",
                  borderRadius: "50%",
                  padding: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "0.1rem",
                }}>
                  <Check size={12} strokeWidth={3} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.85rem", color: "#fff", fontWeight: 700, marginBottom: "0.1rem" }}>{perk.title}</strong>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", lineHeight: "1.2", display: "block" }}>{perk.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Stripe Card Form */}
        <div style={{
          flex: "1 1 50%",
          padding: "1.5rem 2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          boxSizing: "border-box",
          background: "rgba(0,0,0,0.2)"
        }}>
          {infoMessage && (
            <div style={{
              background: "rgba(80, 250, 123, 0.1)",
              borderLeft: "3px solid var(--color-green)",
              color: "var(--color-green)",
              borderRadius: "0.4rem",
              padding: "0.75rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              marginBottom: "1rem",
            }}>
              {infoMessage}
            </div>
          )}

          <form onSubmit={handlePayment} style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}>
            <div style={{ background: "rgba(255,215,0,0.03)", border: "1px solid rgba(255,215,0,0.1)", borderRadius: "0.75rem", padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "0.1rem" }}>SUBSCRIPTION</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>Monthly Plan</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontSize: "1.2rem", fontWeight: 900, color: "var(--color-gold)" }}>$9.99</span>
              </div>
            </div>

            {validationError && (
              <div style={{
                background: "rgba(255, 85, 85, 0.1)",
                borderLeft: "3px solid var(--color-red)",
                color: "var(--color-red)",
                borderRadius: "0.4rem",
                padding: "0.75rem",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}>
                {validationError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em" }}>CARDHOLDER NAME</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.5rem",
                    padding: "0.6rem 0.75rem",
                    color: "#fff",
                    fontSize: "0.85rem",
                    outline: "none",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(255,215,0,0.5)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em" }}>CARD NUMBER</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    required
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "0.5rem",
                      padding: "0.6rem 0.75rem 0.6rem 2.2rem",
                      color: "#fff",
                      fontSize: "0.85rem",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s",
                      letterSpacing: "1px"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(255,215,0,0.5)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                  <CreditCard size={14} color="rgba(255,255,255,0.4)" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em" }}>EXPIRY DATE</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    required
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "0.5rem",
                      padding: "0.6rem 0.75rem",
                      color: "#fff",
                      fontSize: "0.85rem",
                      outline: "none",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(255,215,0,0.5)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em" }}>CVC</label>
                  <input
                     type="password"
                     placeholder="123"
                     value={cardCvc}
                     onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                     required
                     style={{
                       background: "rgba(0,0,0,0.3)",
                       border: "1px solid rgba(255,255,255,0.1)",
                       borderRadius: "0.5rem",
                       padding: "0.6rem 0.75rem",
                       color: "#fff",
                       fontSize: "0.85rem",
                       outline: "none",
                       transition: "border-color 0.2s"
                     }}
                     onFocus={(e) => e.target.style.borderColor = "rgba(255,215,0,0.5)"}
                     onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, var(--color-gold) 0%, var(--color-orange) 100%)",
                color: "#120824",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.75rem",
                fontWeight: 900,
                fontSize: "0.85rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 5px 15px -5px rgba(255, 170, 0, 0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
                marginTop: "0.25rem",
                letterSpacing: "0.02em"
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px -5px rgba(255, 170, 0, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 5px 15px -5px rgba(255, 170, 0, 0.4)";
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  PROCESSING...
                </>
              ) : (
                <>
                  <Lock size={14} strokeWidth={2.5} />
                  SECURE CHECKOUT
                </>
              )}
            </button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>
              <ShieldCheck size={12} />
              <span>Stripe 256-bit SSL encrypted payment.</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
