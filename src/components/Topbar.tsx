"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAdminAuth } from "@/context/AdminAuthContext";

type TopbarProps = {
  isSidebarOpen?: boolean;
  onMenuClick?: () => void;
};

export default function Topbar({ isSidebarOpen = false, onMenuClick }: TopbarProps) {
  const { admin, logout } = useAdminAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const initials = admin?.name
    ? admin.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "SA";

  return (
    <div className="topbar">
      {/* Mobile hamburger toggle */}
      <button
        type="button"
        className="mobile-menu-trigger tb-btn"
        aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        onClick={onMenuClick}
      >
        <i className={`ti ${isSidebarOpen ? "ti-x" : "ti-menu-2"}`}></i>
      </button>

      <div className="topbar-logo flex items-center gap-0">
        <Image
          src="/images/logo.PNG"
          alt=""
          width={220}
          height={50}
          style={{ height: 42, width: "auto" }}
          priority
        />
      </div>
      <div className="topbar-divider topbar-secondary"></div>

      <div className="font-semibold text-sm text-t2 ml-2 topbar-secondary">Admin Portal</div>

      <div className="topbar-spacer"></div>

      <div className="topbar-right">
        <div className="topbar-user" id="topbar-user">
          <div className="user-avatar" id="ua-initials">{initials}</div>
          <div className="topbar-secondary">
            <div className="user-name" id="ua-name">{admin?.name ?? "Super Admin"}</div>
            <div className="user-role" id="ua-role">Administrator</div>
          </div>
          <div className="user-kyc topbar-secondary"></div>
        </div>
        {/* Logout button */}
        <button
          id="admin-logout-btn"
          type="button"
          onClick={handleLogout}
          title="Logout"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34,
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: "var(--r8)",
            color: "#ef4444",
            cursor: "pointer",
            fontSize: 16,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.12)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.06)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.15)";
          }}
        >
          <i className="ti ti-logout"></i>
        </button>
      </div>
    </div>
  );
}