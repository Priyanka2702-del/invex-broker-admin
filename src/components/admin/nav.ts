export type NavItem = { label: string; href: string; icon?: string };
export type NavGroup = { label: string; icon: string; href?: string; children?: NavItem[] };
export type NavSection = { section: string; items: NavGroup[] };

export const NAV: NavSection[] = [
  { section: "Overview", items: [{ label: "Dashboard", icon: "ti-layout-dashboard", href: "/dashboard" }] },
  { section: "Broker", items: [
    { label: "Clients", icon: "ti-users", children: [
      { label: "All Users", href: "/clients" }, { label: "Users With Balance", href: "/clients/balance" },
      { label: "Banned Users", href: "/clients/banned" }, { label: "UnKYC Users", href: "/clients/unkyc" },
      { label: "KYC Approved Users", href: "/clients/kyc-approved" }, { label: "Direct Users", href: "/clients/direct" },
      { label: "Revenue Link Users", href: "/clients/revenue-link" } ] },
    { label: "IB Management", icon: "ti-network", children: [
      { label: "All IBs", href: "/ib" }, { label: "Rebate Link IB", href: "/ib/rebate-link" },
      { label: "Revenue Link IB", href: "/ib/revenue-link" }, { label: "Basic IB", href: "/ib/basic" },
      { label: "Starter IB", href: "/ib/starter" }, { label: "Prime IB", href: "/ib/prime" },
      { label: "Crown IB", href: "/ib/crown" }, { label: "Master IB", href: "/ib/master" } ] },
    { label: "Marketing Accounts", icon: "ti-speakerphone", href: "/marketing-accounts" },
    { label: "Affiliate / Links", icon: "ti-link", href: "/affiliate-links" },
  ] },
  { section: "Finance & Trading", items: [
    { label: "Transactions", icon: "ti-arrows-exchange", href: "/transactions" },
    { label: "Deposits", icon: "ti-arrow-bar-to-down", href: "/deposits" },
    { label: "Withdrawals", icon: "ti-arrow-bar-to-up", href: "/withdrawals" },
    { label: "Trades", icon: "ti-chart-candle", href: "/trades" },
    { label: "Rebate System", icon: "ti-percentage", href: "/rebate-system" },
    { label: "Revenue Link Commission", icon: "ti-coin", href: "/revenue-link-commission" },
    { label: "Copy Trading", icon: "ti-copy", href: "/copy-trading" },
    { label: "PAM Accounts", icon: "ti-building-bank", href: "/pam-accounts" },
  ] },
  { section: "Risk & Ranks", items: [
    { label: "Rules, Violation & Risk", icon: "ti-shield-check", children: [
      { label: "Risk Overview", href: "/risk" }, { label: "Rules", href: "/risk/rules" }, { label: "Violations", href: "/risk/violations" } ] },
    { label: "System Ranks", icon: "ti-award", href: "/system-ranks" },
    { label: "Equity Bonus", icon: "ti-scale", href: "/equity-bonus" },
  ] },
  { section: "Account Management", items: [{ label: "Account Management", icon: "ti-id", href: "/account-management" }] },
  { section: "Marketing", items: [
    { label: "Manage Templates", icon: "ti-photo", href: "/manage-templates" },
    { label: "Promotions", icon: "ti-gift", href: "/promotions" },
    { label: "Notifications", icon: "ti-bell-ringing", href: "/notifications" },
  ] },
  { section: "Analytics", items: [{ label: "Reports & Analytics", icon: "ti-chart-infographic", href: "/reports-analytics" }] },
  { section: "System", items: [
    { label: "Live Modules", icon: "ti-plug-connected", children: [
      { label: "Overview", href: "/legacy/overview" }, { label: "Analytics", href: "/analytics" },
      { label: "Live Clients", href: "/legacy/clients" }, { label: "KYC Review", href: "/kyc" },
      { label: "Live Deposits", href: "/legacy/deposits" }, { label: "Live Withdrawals", href: "/legacy/withdrawals" },
      { label: "Reports", href: "/reports" }, { label: "Management", href: "/pamm" },
      { label: "Audit Log", href: "/audit" }, { label: "Support", href: "/support" }, { label: "Live Settings", href: "/settings" } ] },
    { label: "Admin Settings", icon: "ti-settings-cog", href: "/admin-settings" },
    { label: "Audit Logs", icon: "ti-history", href: "/audit-logs" },
  ] },
];

/** Title + breadcrumb trail for the top navbar (longest matching prefix wins). */
const TITLES: [string, string, string[]][] = [
  ["/dashboard", "Dashboard", []],
  ["/transactions", "Transactions", []], ["/rebate-system", "Rebate System", ["Finance & Trading"]],
  ["/revenue-link-commission", "Revenue Link Commission", ["Finance & Trading"]], ["/copy-trading", "Copy Trading", ["Finance & Trading"]],
  ["/pam-accounts", "PAM Accounts", ["Finance & Trading"]], ["/equity-bonus", "Equity Bonus", ["Risk & Ranks"]],
  ["/account-management/", "Account Type", ["Account Management"]], ["/account-management", "Account Management", []],
  ["/affiliate-links/", "Link Details", ["Affiliate / Links"]], ["/affiliate-links", "Affiliate / Links", []],
  ["/manage-templates", "Manage Templates", ["Marketing"]], ["/promotions", "Promotions", ["Marketing"]], ["/notifications", "Notifications", ["Marketing"]],
  ["/reports-analytics", "Reports & Analytics", []], ["/admin-settings", "Admin Settings", ["System"]], ["/audit-logs", "Audit Logs", ["System"]],
  ["/clients/balance", "Users With Balance", ["Clients"]], ["/clients/banned", "Banned Users", ["Clients"]],
  ["/clients/unkyc", "UnKYC Users", ["Clients"]], ["/clients/kyc-approved", "KYC Approved Users", ["Clients"]],
  ["/clients/direct", "Direct Users", ["Clients"]], ["/clients/revenue-link", "Revenue Link Users", ["Clients"]],
  ["/clients", "All Users", ["Clients"]], ["/users/", "User Profile", ["Clients"]],
  ["/ib/profile/", "IB Details", ["IB Management"]], ["/ib/rebate-link", "Rebate Link IB", ["IB Management"]],
  ["/ib/revenue-link", "Revenue Link IB", ["IB Management"]], ["/ib/basic", "Basic IB", ["IB Management"]],
  ["/ib/starter", "Starter IB", ["IB Management"]], ["/ib/prime", "Prime IB", ["IB Management"]],
  ["/ib/crown", "Crown IB", ["IB Management"]], ["/ib/master", "Master IB", ["IB Management"]],
  ["/ib", "All IBs", ["IB Management"]], ["/marketing-accounts", "Marketing Accounts", []],
  ["/deposits/", "Deposit Details", ["Transactions", "Deposits"]], ["/deposits", "Deposits", ["Transactions"]],
  ["/withdrawals/", "Withdrawal Details", ["Transactions", "Withdrawals"]], ["/withdrawals", "Withdrawals", ["Transactions"]],
  ["/trades/", "Trade Details", ["Trades"]], ["/trades", "All Trades", []],
  ["/risk/violations/", "Violation Details", ["Rules, Violation & Risk", "Violations"]],
  ["/risk/violations", "Violations", ["Rules, Violation & Risk"]], ["/risk/rules", "Rules", ["Rules, Violation & Risk"]],
  ["/risk", "Risk Overview", ["Rules, Violation & Risk"]], ["/system-ranks/", "System Rank", ["System Ranks"]],
  ["/system-ranks", "System Ranks", []],
  ["/legacy/overview", "Live Overview", ["Live API tools"]], ["/legacy/clients", "Live Clients", ["Live API tools"]],
  ["/legacy/deposits", "Live Deposits", ["Live API tools"]], ["/legacy/withdrawals", "Live Withdrawals", ["Live API tools"]],
  ["/analytics", "Analytics", ["Live API tools"]], ["/kyc", "KYC Review", ["Live API tools"]],
  ["/reports", "Reports", ["Live API tools"]], ["/pamm", "Management", ["Live API tools"]],
  ["/audit", "Audit Log", ["Live API tools"]], ["/support", "Support", ["Live API tools"]],
  ["/settings", "Settings", ["Live API tools"]],
];
export function titleFor(path: string): { title: string; trail: string[] } {
  const hit = TITLES.find(([p]) => (p.endsWith("/") ? path.startsWith(p) : path === p || path.startsWith(p + "/")));
  return hit ? { title: hit[1], trail: hit[2] } : { title: "Admin", trail: [] };
}
