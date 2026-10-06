import "./globals.css";
import "./amg-components.css";
import "./invex-admin.css";
import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { AdminDataProvider } from "@/context/AdminDataContext";
import { AdminExtrasProvider } from "@/context/AdminExtrasContext";

export const metadata: Metadata = {
  title: "INVEX Trade — Broker Admin",
  description: "Administrative control panel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" />
      </head>
      <body>
        <AdminAuthProvider>
          <AdminDataProvider>
            <AdminExtrasProvider>
              <AppShell>{children}</AppShell>
            </AdminExtrasProvider>
          </AdminDataProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
