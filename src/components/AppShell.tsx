"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
          borderTopColor: "#00A63E",
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
    <div id="app" className="min-h-screen bg-[var(--bg0)]">
      <Topbar
        isSidebarOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen((open) => !open)}
      />

      <div className="app-body">
        <button
          type="button"
          aria-label="Close navigation menu"
          className={[
            "fixed inset-0 top-14 z-[90] bg-slate-950/30 backdrop-blur-[2px] transition-opacity duration-300 md:hidden",
            sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
          onClick={() => setSidebarOpen(false)}
        />

        <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

        <main className="main w-full min-w-0" id="main">
          {children}
        </main>
      </div>
    </div>
  );
}
