"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAdminData } from "@/context/AdminDataContext";
import { fmtDateTime } from "@/lib/format";
import { titleFor } from "./nav";

export default function AdminNavbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAdminAuth();
  const { users, trades, violations, deposits, withdrawals } = useAdminData();
  const { title, trail } = titleFor(pathname);
  const [q, setQ] = useState("");
  const [pop, setPop] = useState<"" | "notif" | "profile" | "search">("");
  const [mounted, setMounted] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) {
        // also ignore clicks inside the portaled notif panel
        const notif = document.getElementById("ix-notif-portal");
        if (notif && notif.contains(e.target as Node)) return;
        setPop("");
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => setPop(""), [pathname]);

  // lock body scroll while notif sheet is open on mobile
  useEffect(() => {
    if (pop !== "notif") return;
    const prev = document.body.style.overflow;
    if (window.innerWidth <= 720) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [pop]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const u = users
      .filter((x) => x.id.includes(s) || x.name.toLowerCase().includes(s) || x.email.toLowerCase().includes(s))
      .slice(0, 4)
      .map((x) => ({ key: x.id, label: x.name, sub: `User · ${x.id}`, href: `/users/${x.id}` }));
    const t = trades
      .filter((x) => x.id.toLowerCase().includes(s))
      .slice(0, 3)
      .map((x) => ({ key: x.id, label: x.id, sub: `Trade · ${x.symbol}`, href: `/trades/${x.id}` }));
    return [...u, ...t];
  }, [q, users, trades]);

  const openViolations = violations.filter((v) => v.status === "Open");
  const pendingDep = deposits.filter((d) => d.status === "Pending");
  const pendingWd = withdrawals.filter((d) => d.status === "Pending");
  const notifs = [
    ...openViolations.slice(0, 3).map((v) => ({
      k: v.id,
      icon: "ti-alert-triangle",
      t: `${v.type} violation`,
      s: `${v.userId} · ${v.tradeId}`,
      href: `/risk/violations/${v.id}`,
    })),
    ...pendingDep.slice(0, 2).map((d) => ({
      k: d.id,
      icon: "ti-arrow-bar-to-down",
      t: `Pending deposit $${d.amount.toLocaleString("en-US")}`,
      s: `${d.userId} · ${fmtDateTime(d.createdAt)}`,
      href: `/deposits/${d.id}`,
    })),
    ...pendingWd.slice(0, 2).map((d) => ({
      k: d.id,
      icon: "ti-arrow-bar-to-up",
      t: `Pending withdrawal $${d.amount.toLocaleString("en-US")}`,
      s: `${d.userId} · ${fmtDateTime(d.createdAt)}`,
      href: `/withdrawals/${d.id}`,
    })),
  ];
  const initials = (admin?.name ?? "Super Admin")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const notifPanel =
    pop === "notif" ? (
      <>
        {/* mobile scrim */}
        <div
          className="ix-notif-scrim"
          onClick={() => setPop("")}
          aria-hidden
        />
        <div id="ix-notif-portal" className="ix-pop ix-notification-pop" role="dialog" aria-label="Notifications">
          <div className="ix-pop-h">
            <span>Notifications</span>
            <span style={{ color: "var(--ix-muted)", fontWeight: 500 }}>{notifs.length} new</span>
          </div>
          {notifs.length === 0 && (
            <div className="ix-empty" style={{ padding: 18 }}>No notifications</div>
          )}
          {notifs.map((n) => (
            <button
              key={n.k}
              type="button"
              className="ix-pop-i"
              onClick={() => {
                router.push(n.href);
                setPop("");
              }}
            >
              <i
                className={`ti ${n.icon}`}
                style={{ fontSize: 18, color: "var(--ix-primary)", marginTop: 1, flexShrink: 0 }}
              />
              <span>
                <b>{n.t}</b>
                <small>{n.s}</small>
              </span>
            </button>
          ))}
        </div>
      </>
    ) : null;

  return (
    <header className="ix-nav-bar" ref={box}>
      <button type="button" className="ix-icon-btn ix-menu-btn" onClick={onMenu} aria-label="Open menu">
        <i className="ti ti-menu-2" />
      </button>

      <div className="ix-crumbs">
        <div className="t">{title}</div>
        <div className="b">
          <Link href="/dashboard">Admin</Link>
          {trail.map((c) => (
            <span key={c}> / {c}</span>
          ))}
          {title !== "Dashboard" && <span> / {title}</span>}
        </div>
      </div>

      <div className="ix-gsearch">
        <i className="ti ti-search" />
        <input
          placeholder="Search user ID, name, email or trade ID…"
          value={q}
          aria-label="Global search"
          onChange={(e) => {
            setQ(e.target.value);
            setPop("search");
          }}
          onFocus={() => setPop("search")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              router.push(results[0].href);
              setQ("");
              setPop("");
            }
          }}
        />
        {pop === "search" && q.trim().length >= 2 && (
          <div className="ix-pop">
            {results.length === 0 && <div className="ix-empty" style={{ padding: 18 }}>No matches</div>}
            {results.map((r) => (
              <button
                key={r.key}
                type="button"
                className="ix-pop-i"
                onClick={() => {
                  router.push(r.href);
                  setQ("");
                  setPop("");
                }}
              >
                <span>
                  <b>{r.label}</b>
                  <small>{r.sub}</small>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ix-nav-right" style={{ position: "relative" }}>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="ix-icon-btn"
            onClick={() => setPop(pop === "notif" ? "" : "notif")}
            aria-label="Notifications"
            aria-expanded={pop === "notif"}
          >
            <i className="ti ti-bell" />
            {notifs.length > 0 && <span className="dot" />}
          </button>
          {/* Desktop: render inline. Mobile/portal: see below */}
          {pop === "notif" && mounted && window.innerWidth > 720 && notifPanel}
        </div>

        <Link href="/settings" className="ix-icon-btn" aria-label="Settings">
          <i className="ti ti-settings" />
        </Link>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="ix-profile"
            onClick={() => setPop(pop === "profile" ? "" : "profile")}
          >
            <span className="ix-avatar">{initials}</span>
            <span className="txt">
              <div className="n">{admin?.name ?? "Super Admin"}</div>
              <div className="r">Administrator</div>
            </span>
            <i className="ti ti-chevron-down txt" style={{ color: "var(--ix-faint)", fontSize: 14 }} />
          </button>
          {pop === "profile" && (
            <div className="ix-pop" style={{ minWidth: 220 }}>
              <div className="ix-pop-h" style={{ display: "block" }}>
                {admin?.name ?? "Super Admin"}
                <small style={{ display: "block", color: "var(--ix-muted)", fontWeight: 400 }}>
                  {admin?.email}
                </small>
              </div>
              <button type="button" className="ix-pop-i" onClick={() => router.push("/settings")}>
                <i className="ti ti-settings" /> Settings
              </button>
              <button
                type="button"
                className="ix-pop-i"
                style={{ color: "var(--ix-red)" }}
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
              >
                <i className="ti ti-logout" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Portal: always viewport-fixed on mobile — escapes backdrop-filter/overflow */}
      {mounted && pop === "notif" && createPortal(notifPanel, document.body)}
    </header>
  );
}