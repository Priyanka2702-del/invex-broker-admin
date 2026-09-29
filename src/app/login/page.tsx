"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import api from "@/services/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, admin } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (admin) router.replace("/");
  }, [admin, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/admin-auth/login", { email, password });

      login(res.data.token, res.data.admin);
      router.replace("/");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "linear-gradient(135deg, #f0f9f4 0%, #f8fafc 50%, #eef7f2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', 'Inter', sans-serif",
      overflow: "hidden",
    }}>

      {/* Animated background blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-120px", left: "-120px",
          width: 450, height: 450, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,166,62,0.12) 0%, transparent 70%)",
          animation: "blobFloat 8s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "-100px", right: "-80px",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,166,62,0.09) 0%, transparent 70%)",
          animation: "blobFloat 10s ease-in-out infinite reverse",
        }} />
        <div style={{
          position: "absolute", top: "40%", right: "15%",
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)",
          animation: "blobFloat 12s ease-in-out infinite 2s",
        }} />

        {/* Grid pattern overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(0,166,62,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,166,62,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
      </div>

      {/* Floating security badges - top left */}
      <div style={{
        position: "absolute", top: 32, left: 32,
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(0,166,62,0.15)", borderRadius: 12,
        padding: "10px 16px",
        boxShadow: "0 4px 16px rgba(0,166,62,0.08)",
        animation: mounted ? "slideInLeft 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s both" : "none",
      }}>
        <i className="ti ti-shield-check" style={{ fontSize: 18, color: "#00A63E" }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", letterSpacing: "0.03em" }}>
            SECURE ACCESS
          </div>
          <div style={{ fontSize: 10, color: "#64748b" }}>256-bit TLS encrypted</div>
        </div>
      </div>

      {/* System status - top right */}
      <div style={{
        position: "absolute", top: 32, right: 32,
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(0,166,62,0.15)", borderRadius: 12,
        padding: "10px 16px",
        boxShadow: "0 4px 16px rgba(0,166,62,0.08)",
        animation: mounted ? "slideInRight 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s both" : "none",
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: "#10b981",
          boxShadow: "0 0 0 3px rgba(16,185,129,0.2)",
          animation: "pulse 2s infinite",
        }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>ALL SYSTEMS ONLINE</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>Uptime 99.98%</div>
        </div>
      </div>

      {/* Login card */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: 460,
        margin: "0 20px",
        animation: mounted ? "cardEntrance 0.7s cubic-bezier(0.16,1,0.3,1) both" : "none",
      }}>

        {/* Card glow ring */}
        <div style={{
          position: "absolute", inset: -1,
          borderRadius: 24,
          background: "linear-gradient(135deg, rgba(0,166,62,0.3), rgba(16,185,129,0.1), rgba(0,166,62,0.2))",
          filter: "blur(1px)",
        }} />

        <div style={{
          position: "relative",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0,166,62,0.12)",
          borderRadius: 22,
          padding: "44px 40px",
          boxShadow: "0 32px 80px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.8) inset",
        }}>

          {/* Brand mark */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginBottom: 36 }}>
            <div style={{ position: "relative" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: "linear-gradient(135deg, #00A63E, #059669)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 12px 32px -4px rgba(0,166,62,0.4)",
              }}>
                <i className="ti ti-shield-lock" style={{ fontSize: 28, color: "#fff" }} />
              </div>
              {/* Admin badge */}
              <div style={{
                position: "absolute", bottom: -6, right: -8,
                background: "#0f172a", color: "#fff",
                fontSize: 9, fontWeight: 700,
                padding: "3px 7px", borderRadius: 8,
                letterSpacing: "0.08em", textTransform: "uppercase" as const,
                fontFamily: "'JetBrains Mono', monospace",
                border: "2px solid #fff",
              }}>ADMIN</div>
            </div>

            <div style={{ textAlign: "center" }}>
              <h1 style={{
                fontSize: 24, fontWeight: 700, color: "#0f172a",
                margin: 0, letterSpacing: "-0.4px",
              }}>
                Advance Markets Group Admin Portal
              </h1>
              <p style={{
                fontSize: 13, color: "#64748b", margin: "6px 0 0",
                fontWeight: 400,
              }}>
                Restricted access — authorized personnel only
              </p>
            </div>
          </div>

          {/* Divider with icon */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #e2e8f0)" }} />
            <i className="ti ti-login" style={{ fontSize: 14, color: "#94a3b8" }} />
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #e2e8f0)" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Email field */}
            <div>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 700,
                color: "#475569", letterSpacing: "0.06em",
                textTransform: "uppercase" as const, marginBottom: 8,
              }}>
                Admin Email
              </label>
              <div style={{ position: "relative" }}>
                <i className="ti ti-mail" style={{
                  position: "absolute", left: 14, top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 16,
                  color: emailFocus ? "#00A63E" : "#94a3b8",
                  transition: "color 0.2s",
                  pointerEvents: "none",
                }} />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  placeholder="admin@amgtrading.com"
                  style={{
                    width: "100%", height: 48,
                    background: emailFocus ? "#f0fdf4" : "#f8fafc",
                    border: `1.5px solid ${emailFocus ? "#00A63E" : "#e2e8f0"}`,
                    borderRadius: 12,
                    paddingLeft: 44, paddingRight: 14,
                    fontSize: 14, color: "#0f172a",
                    outline: "none",
                    transition: "all 0.2s",
                    boxSizing: "border-box" as const,
                    fontFamily: "inherit",
                    boxShadow: emailFocus ? "0 0 0 3px rgba(0,166,62,0.1)" : "none",
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 700,
                color: "#475569", letterSpacing: "0.06em",
                textTransform: "uppercase" as const, marginBottom: 8,
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <i className="ti ti-lock" style={{
                  position: "absolute", left: 14, top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 16,
                  color: passFocus ? "#00A63E" : "#94a3b8",
                  transition: "color 0.2s",
                  pointerEvents: "none",
                }} />
                <input
                  id="admin-password"
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  placeholder="••••••••••"
                  style={{
                    width: "100%", height: 48,
                    background: passFocus ? "#f0fdf4" : "#f8fafc",
                    border: `1.5px solid ${passFocus ? "#00A63E" : "#e2e8f0"}`,
                    borderRadius: 12,
                    paddingLeft: 44, paddingRight: 48,
                    fontSize: 14, color: "#0f172a",
                    outline: "none",
                    transition: "all 0.2s",
                    boxSizing: "border-box" as const,
                    fontFamily: "inherit",
                    boxShadow: passFocus ? "0 0 0 3px rgba(0,166,62,0.1)" : "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  style={{
                    position: "absolute", right: 14, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    color: "#94a3b8", cursor: "pointer",
                    fontSize: 16, lineHeight: 1,
                    padding: 4,
                  }}
                  tabIndex={-1}
                >
                  <i className={`ti ${showPass ? "ti-eye-off" : "ti-eye"}`} />
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 10, padding: "10px 14px",
                fontSize: 13, color: "#dc2626",
              }}>
                <i className="ti ti-alert-circle" style={{ fontSize: 16, flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              style={{
                width: "100%", height: 50,
                background: loading
                  ? "linear-gradient(135deg, #86efac, #6ee7b7)"
                  : "linear-gradient(135deg, #00A63E, #059669)",
                border: "none", borderRadius: 13,
                color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: loading ? "none" : "0 8px 24px -4px rgba(0,166,62,0.4)",
                transition: "all 0.2s",
                letterSpacing: "0.01em",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 12px 28px -4px rgba(0,166,62,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(0,166,62,0.4)";
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 18, height: 18,
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  Authenticating…
                </>
              ) : (
                <>
                  <i className="ti ti-lock-open" style={{ fontSize: 18 }} />
                  Access Admin Portal
                </>
              )}
            </button>
          </form>

          {/* Footer notice */}
          <div style={{
            marginTop: 28,
            padding: "14px 16px",
            background: "linear-gradient(135deg, rgba(0,166,62,0.04), rgba(16,185,129,0.03))",
            border: "1px solid rgba(0,166,62,0.1)",
            borderRadius: 12,
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <i className="ti ti-info-circle" style={{ fontSize: 15, color: "#00A63E", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
              This portal is restricted to authorized administrators only.
              All access attempts are logged and monitored.
            </p>
          </div>
        </div>
      </div>

      {/* Trust badges at bottom */}
      <div style={{
        position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 24,
        animation: mounted ? "slideInUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.8s both" : "none",
      }}>
        {[
          { icon: "ti-shield-check", label: "SSL Secured" },
          { icon: "ti-certificate", label: "ISO 27001" },
          { icon: "ti-lock", label: "MFA Ready" },
          { icon: "ti-eye-off", label: "Zero Trust" },
        ].map(({ icon, label }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase" as const, letterSpacing: "0.06em",
          }}>
            <i className={`ti ${icon}`} style={{ fontSize: 13, color: "#00A63E" }} />
            {label}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
        }
        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -20px) scale(1.05); }
          66% { transform: translate(-15px, 15px) scale(0.97); }
        }
        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
