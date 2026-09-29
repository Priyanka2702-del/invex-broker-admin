"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  isOpen?: boolean;
  onNavigate?: () => void;
};

export default function Sidebar({ isOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  type NavLink = {
    name: string;
    path: string;
    icon: string;
    pill?: string | number;
  };

  type NavSection = {
    section: string;
    links: NavLink[];
  };

  const navLinks: NavSection[] = [
    { section: "Overview", links: [
      { name: "Dashboard", path: "/", icon: "ti-layout-dashboard" },
      { name: "Analytics", path: "/analytics", icon: "ti-chart-area" },
    ]},
    { section: "Clients", links: [
      { name: "All Clients", path: "/clients", icon: "ti-users" },
      { name: "KYC Review", path: "/kyc", icon: "ti-id-badge-2" },
    ]},
    { section: "Finance", links: [
      { name: "Deposits", path: "/deposits", icon: "ti-arrow-bar-to-down" },
      { name: "Withdrawals", path: "/withdrawals", icon: "ti-arrow-bar-to-up" },
      { name: "Reports", path: "/reports", icon: "ti-report-analytics" },
    ]},
    { section: "Platform", links: [
      { name: "Management", path: "/pamm", icon: "ti-trending-up" },
    ]},
    { section: "System", links: [
      { name: "Settings", path: "/settings", icon: "ti-settings" },
      { name: "Audit Log", path: "/audit", icon: "ti-file-description" },
      { name: "Support", path: "/support", icon: "ti-headset" },
    ]}
  ];

  return (
    <nav
      className={[
        "sidebar transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
      id="sb-admin"
      aria-label="Primary navigation"
    >
      {navLinks.map((section, idx) => (
        <div key={idx}>
          <div className="nav-sec">{section.section}</div>
          {section.links.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.path} 
                href={link.path}
                className={`nav-link ${isActive ? "on" : ""}`}
                onClick={onNavigate}
              >
                <i className={`ti ${link.icon}`}></i>{link.name}
                {link.pill && <span className="nav-pill">{link.pill}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
