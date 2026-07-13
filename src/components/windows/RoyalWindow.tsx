"use client";

import React, { useState } from "react";
import { Crown, Check, ShieldCheck, Loader2, CreditCard, Lock, AlertTriangle } from "lucide-react";
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
        background: "radial-gradient(circle at center, #1b0f30 0%, var(--bg) 100%)",
        overflowY: "auto",
      }}>
        <div style={{
          background: "rgba(15, 10, 25, 0.55)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 215, 0, 0.25)",
          borderRadius: "1.5rem",
          width: "100%",
          maxWidth: "540px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 35px rgba(255, 215, 0, 0.08)",
          padding: "3rem 2.5rem",
          boxSizing: "border-box",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}>
          <div style={{
            width: "70px",
            height: "70px",
            background: "linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#120824",
            boxShadow: "0 0 25px rgba(255, 215, 0, 0.3)",
          }}>
            <Crown size={32} fill="currentColor" />
          </div>

          <div>
            <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffd700", margin: 0, letterSpacing: "0.02em" }}>
              Royal Membership Active
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.5rem 0 0 0", lineHeight: "1.5" }}>
              You are currently enjoying full CodeKnights Royal premium features.
            </p>
          </div>

          <div style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "0.8rem",
            width: "100%",
            padding: "1.2rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
            textAlign: "left",
          }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.05em" }}>INCLUDED BENEFITS</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text)" }}>
                <Check size={14} color="#ffd700" strokeWidth={3} />
                <span>Unlimited AI Assistant Prompts</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text)" }}>
                <Check size={14} color="#ffd700" strokeWidth={3} />
                <span>Exclusive Gold Crown PFP Badges</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text)" }}>
                <Check size={14} color="#ffd700" strokeWidth={3} />
                <span>Access to Premium WIP Game Modes</span>
              </div>
            </div>
          </div>

          {validationError && (
            <div style={{
              background: "rgba(255, 85, 85, 0.08)",
              border: "1px solid rgba(255, 85, 85, 0.25)",
              color: "#ff5555",
              borderRadius: "0.5rem",
              padding: "0.75rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              width: "100%",
            }}>
              {validationError}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", width: "100%", marginTop: "0.5rem" }}>
            <button
              onClick={handleCancelSubscription}
              disabled={loading}
              style={{
                background: "rgba(255, 85, 85, 0.06)",
                color: "#ff5555",
                border: "1px solid rgba(255, 85, 85, 0.2)",
                borderRadius: "0.6rem",
                padding: "0.75rem 1rem",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "rgba(255, 85, 85, 0.12)";
                  e.currentTarget.style.borderColor = "rgba(255, 85, 85, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "rgba(255, 85, 85, 0.06)";
                  e.currentTarget.style.borderColor = "rgba(255, 85, 85, 0.2)";
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Canceling Membership...
                </>
              ) : (
                <>
                  <AlertTriangle size={14} />
                  Cancel Royal Membership
                </>
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
        background: "radial-gradient(circle at center, rgba(30, 20, 50, 0.45) 0%, rgba(12, 8, 23, 0.75) 100%)",
        textAlign: "center",
        gap: "1.5rem",
        boxSizing: "border-box",
      }}>
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
            filter: "blur(6px)",
          }} />
          <div style={{
            width: "80px",
            height: "80px",
            background: "linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#120824",
            boxShadow: "0 0 30px rgba(255, 215, 0, 0.4)",
          }}>
            <Crown size={38} fill="currentColor" />
          </div>
        </div>

        <h3 style={{
          fontSize: "1.8rem",
          fontWeight: 900,
          background: "linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          margin: 0,
          letterSpacing: "0.05em",
        }}>
          ROYAL STATUS CONFIRMED!
        </h3>

        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "420px", margin: 0, lineHeight: "1.5" }}>
          Thank you for subscribing! Your account has been successfully upgraded to <strong style={{ color: "#ffd700" }}>CodeKnights Royal</strong>. Your gold crown badge is now active.
        </p>

        <button
          onClick={() => setSuccess(false)}
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--line)",
            color: "var(--text)",
            padding: "0.6rem 1.2rem",
            borderRadius: "0.5rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            marginTop: "0.5rem",
          }}
        >
          Manage Membership
        </button>
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
      padding: "2.5rem",
      boxSizing: "border-box",
      background: "radial-gradient(circle at center, #1b0f30 0%, var(--bg) 100%)",
      overflowY: "auto",
    }}>
      {/* Central Glassmorphic Double-pane Container */}
      <div style={{
        background: "rgba(15, 10, 25, 0.55)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 215, 0, 0.15)",
        borderRadius: "1.5rem",
        width: "100%",
        maxWidth: "800px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.05)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
      }}>
        {/* Left Pane: Perks list */}
        <div style={{
          flex: "1 1 350px",
          padding: "2.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.02) 100%)",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
          boxSizing: "border-box",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Crown size={20} color="#ffd700" fill="#ffd700" />
              <span style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.15em", color: "#ffd700" }}>CODEKNIGHTS ROYAL</span>
            </div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>
              Unlock Ultimate Perks
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0", lineHeight: "1.4" }}>
              Upgrade your coder profile and get unrestricted entry to the premium arenas.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", marginTop: "0.5rem" }}>
            {[
              { title: "Gold Royal Badge", desc: "A sleek gold crown badge next to your username on profiles, boards, and invites." },
              { title: "WIP Game Modes Unlocked", desc: "Instant access to BUG HUNTER, HACK BOUNTY, and MLMAGES modes." },
              { title: "Unlimited Matches", desc: "Bypass queue rate limits. Battle as much and as fast as you want." },
              { title: "Elite Profile Glow", desc: "Premium styling configurations for your workspace cards." },
            ].map((perk, i) => (
              <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{
                  background: "rgba(255, 215, 0, 0.1)",
                  color: "#ffd700",
                  borderRadius: "50%",
                  padding: "0.2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "0.1rem",
                }}>
                  <Check size={13} strokeWidth={3} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.9rem", color: "var(--text)", fontWeight: 700 }}>{perk.title}</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: "1.4" }}>{perk.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Stripe Card Form */}
        <div style={{
          flex: "1 1 350px",
          padding: "2.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          boxSizing: "border-box",
        }}>
          {infoMessage && (
            <div style={{
              background: "rgba(80, 250, 123, 0.08)",
              border: "1px solid rgba(80, 250, 123, 0.25)",
              color: "#50fa7b",
              borderRadius: "0.5rem",
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
            gap: "1.25rem",
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)" }}>PLAN</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#ffd700", background: "rgba(255, 215, 0, 0.1)", padding: "0.15rem 0.4rem", borderRadius: "0.25rem" }}>MONTHLY</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginTop: "0.25rem" }}>
                <span style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--text)" }}>$9.99</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>/ month</span>
              </div>
            </div>

            <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

            {validationError && (
              <div style={{
                background: "rgba(255, 85, 85, 0.08)",
                border: "1px solid rgba(255, 85, 85, 0.25)",
                color: "#ff5555",
                borderRadius: "0.5rem",
                padding: "0.75rem",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}>
                {validationError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)" }}>CARDHOLDER NAME</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--line)",
                    borderRadius: "0.5rem",
                    padding: "0.6rem 0.8rem",
                    color: "var(--text)",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)" }}>CARD NUMBER</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    required
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--line)",
                      borderRadius: "0.5rem",
                      padding: "0.6rem 0.8rem 0.6rem 2.2rem",
                      color: "var(--text)",
                      fontSize: "0.85rem",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                  <CreditCard size={16} color="var(--text-muted)" style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)" }}>EXPIRY DATE</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    required
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--line)",
                      borderRadius: "0.5rem",
                      padding: "0.6rem 0.8rem",
                      color: "var(--text)",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)" }}>CVC</label>
                  <input
                    type="password"
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    required
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--line)",
                      borderRadius: "0.5rem",
                      padding: "0.6rem 0.8rem",
                      color: "var(--text)",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)",
                color: "#120824",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.8rem 1rem",
                fontWeight: 800,
                fontSize: "0.9rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 12px rgba(255, 170, 0, 0.3)",
                transition: "opacity 0.2s",
                marginTop: "0.5rem",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Secure Stripe Checkout
                </>
              )}
            </button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.7rem", marginTop: "0.25rem" }}>
              <ShieldCheck size={12} />
              <span>Stripe payment processing. Encrypted SSL.</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
