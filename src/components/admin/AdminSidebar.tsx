"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV } from "./nav";

type Props = { collapsed: boolean; mobileOpen: boolean; onToggleCollapse: () => void; onExpand: () => void; onNavigate: () => void };

export default function AdminSidebar({ collapsed, mobileOpen, onToggleCollapse, onExpand, onNavigate }: Props) {
  const pathname = usePathname();
  const isOn = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/") && !isSiblingRoot(href));
  // parent roots like /clients or /ib should only be "on" for exact match or detail routes (/users, /ib/profile)
  function isSiblingRoot(href: string) { return href === "/clients" || href === "/ib" || href === "/risk"; }
  const activeChild = (href: string) => {
    if (pathname === href) return true;
    if (href === "/clients") return pathname.startsWith("/users/");
    if (href === "/ib") return pathname.startsWith("/ib/profile/");
    if (href === "/risk/violations") return pathname.startsWith("/risk/violations/");
    return isOn(href);
  };
  const groupHasActive = (g: (typeof NAV)[number]["items"][number]) => !!g.children?.some((c) => activeChild(c.href));
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const isOpen = (g: (typeof NAV)[number]["items"][number]) => manual[g.label] ?? groupHasActive(g);

  return (
    <aside className={`ix-sidebar ${mobileOpen ? "open" : ""}`} aria-label="Primary navigation">
      <button type="button" className="ix-collapse-btn" onClick={onToggleCollapse} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        <i className="ti ti-chevron-left" />
      </button>
      <Link href="/dashboard" className="ix-side-logo" onClick={onNavigate} aria-label="INVEX Trade admin">
        <Image src={collapsed ? "/images/invex-mark.png" : "/images/invex-logo.png"} alt="INVEX Trade" width={collapsed ? 120 : 220} height={collapsed ? 60 : 146} priority style={{ height: collapsed ? 34 : 50, width: "auto" }} />
      </Link>
      <nav className="ix-nav">
        {NAV.map((sec) => (
          <div key={sec.section}>
            <div className="ix-nav-sec">{sec.section}</div>
            {sec.items.map((g) =>
              g.children ? (
                <div key={g.label}>
                  <button
                    type="button" title={g.label}
                    className={`ix-link ${groupHasActive(g) ? "on" : ""} ${isOpen(g) ? "open" : ""}`}
                    onClick={() => { if (collapsed) { onExpand(); setManual((m) => ({ ...m, [g.label]: true })); } else setManual((m) => ({ ...m, [g.label]: !isOpen(g) })); }}
                  >
                    <i className={`ti ${g.icon}`} /><span className="lbl">{g.label}</span><i className="ti ti-chevron-right chev" />
                  </button>
                  {isOpen(g) && (
                    <div className="ix-sub">
                      {g.children.map((c) => (
                        <Link key={c.href} href={c.href} onClick={onNavigate} className={`ix-link ${activeChild(c.href) ? "on" : ""}`}>
                          <span className="lbl">{c.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link key={g.href} href={g.href!} title={g.label} onClick={onNavigate} className={`ix-link ${activeChild(g.href!) ? "on" : ""}`}>
                  <i className={`ti ${g.icon}`} /><span className="lbl">{g.label}</span>
                </Link>
              )
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
