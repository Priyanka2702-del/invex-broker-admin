"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AdminUser {
  email: string;
  name: string;
  role: string;
  isSuperAdmin?: boolean;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (token: string, adminData: AdminUser) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("amg_admin_token");
      const stored = localStorage.getItem("amg_admin");
      if (token && stored) {
        setAdmin(JSON.parse(stored));
      } else if (process.env.NEXT_PUBLIC_ADMIN_DEMO === "true") {
        // Optional local preview without the backend: set NEXT_PUBLIC_ADMIN_DEMO=true in .env.local
        setAdmin({ email: "admin@invextrade.com", name: "Super Admin", role: "superadmin", isSuperAdmin: true });
      }
    } catch {
      // ignore parse errors
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (token: string, adminData: AdminUser) => {
    localStorage.setItem("amg_admin_token", token);
    localStorage.setItem("amg_admin", JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem("amg_admin_token");
    localStorage.removeItem("amg_admin");
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
};
