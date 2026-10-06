"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminNavbar from "@/components/admin/AdminNavbar";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { admin, loading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.toggle("mobile-sidebar-open", sidebarOpen);
    return () => document.body.classList.remove("mobile-sidebar-open");
  }, [sidebarOpen]);

  // Redirect to login if unauthenticated (except on the login page itself)
  useEffect(() => {
    if (!loading && !admin && pathname !== "/login") {
      router.replace("/login");
    }
  }, [loading, admin, pathname, router]);

  // Show login page without shell chrome
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: "3px solid #e2e8f0",
          borderTopColor: "#2456e6",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!admin) {
    // Render nothing while redirect happens (or render children if we're on /login)
    return pathname === "/login" ? <>{children}</> : null;
  }

  return (
    <div id="app" className={`ix-shell ${collapsed ? "ix-collapsed" : ""}`}>
      <div className={`ix-scrim ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={sidebarOpen}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onExpand={() => setCollapsed(false)}
        onNavigate={() => setSidebarOpen(false)}
      />
      <div className="ix-main">
        <AdminNavbar onMenu={() => setSidebarOpen(true)} />
        <main className="ix-content" id="main">
          {children}
        </main>
      </div>
    </div>
  );
}
