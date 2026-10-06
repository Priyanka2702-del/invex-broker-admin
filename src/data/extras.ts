import { DAY, HOUR, NOW, iso } from "@/lib/format";
import { rng } from "./random";

/* ───────── Copy Trading ───────── */
export type HistoryEvent = { date: string; type: string; amount: number };
export interface CopyInvestment { id: string; userId: string; amount: number; createdAt: string; status: "Active" | "Completed" | "Withdrawn" | "Pending"; history: HistoryEvent[] }
const COPY_USERS = ["3769969", "10032", "10033", "10035", "10037", "10039", "10041", "10043", "10045", "10021", "10022", "10029", "10030", "10024"];
const COPY_STATUS: CopyInvestment["status"][] = ["Active", "Active", "Active", "Pending", "Active", "Completed", "Active", "Withdrawn", "Active", "Active", "Completed", "Active", "Pending", "Active"];
function events(r: () => number, amount: number, start: number, closing?: "Completed" | "Withdrawn"): HistoryEvent[] {
  const ev: HistoryEvent[] = [{ date: iso(start), type: "Invested", amount }];
  const n = Math.floor(r() * 3);
  for (let i = 1; i <= n; i++) ev.push({ date: iso(start + i * 9 * DAY), type: r() > 0.4 ? "Profit share paid" : "Top-up", amount: Math.round(amount * (0.02 + r() * 0.06)) });
  if (closing) ev.push({ date: iso(start + 40 * DAY), type: closing === "Completed" ? "Term completed" : "Withdrawn", amount });
  return ev;
}
export const copyInvestments: CopyInvestment[] = COPY_USERS.map((userId, i) => {
  const r = rng(300 + i);
  const amount = [500, 1000, 1500, 2500, 3000, 5000, 7500, 10000][Math.floor(r() * 8)];
  const start = i < 3 ? NOW - (2 + i * 5) * HOUR : NOW - (3 + i * 6) * DAY;
  const status = i < 3 ? (i === 1 ? "Pending" : "Active") : COPY_STATUS[i];
  return { id: `CPY-${5001 + i}`, userId, amount, createdAt: iso(start), status, history: events(r, amount, start, status === "Completed" || status === "Withdrawn" ? status : undefined) };
});
export const copySettingsSeed = { profitCut: "20" as "10" | "20" | "30" | "custom", customCut: 25, minInvestment: 500, lockInDays: 30, settlementCycle: "Monthly" as "Weekly" | "Monthly", settlementDay: 1, earlyExitPenalty: 10 };

/* ───────── PAM ───────── */
export interface PamClient { id: string; userId: string; deposit: number; investment: number; createdAt: string; status: "Active" | "Pending" | "Closed"; history: HistoryEvent[] }
const PAM_USERS = ["10020", "10023", "10031", "10032", "10034", "10036", "10039", "10041", "10043", "10045"];
export const pamClients: PamClient[] = PAM_USERS.map((userId, i) => {
  const r = rng(700 + i);
  const deposit = [5000, 10000, 15000, 20000, 25000, 40000][Math.floor(r() * 6)];
  const investment = Math.round(deposit * (0.6 + r() * 0.4));
  const start = NOW - (4 + i * 11) * DAY;
  const status: PamClient["status"] = i === 3 ? "Pending" : i === 8 ? "Closed" : "Active";
  return { id: `PAM-${6001 + i}`, userId, deposit, investment, createdAt: iso(start), status,
    history: [{ date: iso(start), type: "Deposit", amount: deposit }, { date: iso(start + HOUR), type: "Invested in PAM", amount: investment },
      ...(i % 2 ? [{ date: iso(start + 30 * DAY), type: "Monthly return credited", amount: Math.round(investment * 0.04) }] : []),
      ...(status === "Closed" ? [{ date: iso(start + 50 * DAY), type: "Account closed", amount: investment }] : [])] };
});
export const pamSettingsSeed = { profitPercentage: 30, monthlyReturn: 4.5, minDeposit: 5000, lockMonths: 3, payoutDay: 1, acceptingClients: true };

/* ───────── Account types ───────── */
export type AccountTypeKey = "standard" | "zero" | "ecn" | "cent";
export const LEVERAGES = ["1:25", "1:50", "1:100", "1:200", "1:300", "1:400", "1:500", "1:1000"];
export const accountTypeSeed: Record<AccountTypeKey, { name: string; perLot: number; leverage: string; accounts: number; blurb: string }> = {
  standard: { name: "Standard Account", perLot: 0, leverage: "1:500", accounts: 8412, blurb: "General-purpose account for most clients." },
  zero: { name: "Zero Account", perLot: 3, leverage: "1:200", accounts: 2160, blurb: "Raw spreads with a separate per-lot charge." },
  ecn: { name: "ECN Account", perLot: 5, leverage: "1:400", accounts: 1288, blurb: "Direct market access for active traders." },
  cent: { name: "Cent Account", perLot: 0.5, leverage: "1:1000", accounts: 626, blurb: "Cent-denominated account for low-risk testing." },
};

/* ───────── Templates / Promotions / Notifications ───────── */
export const TEMPLATE_TYPES = ["Promotional Image", "Banner", "Graphic", "Website/App Media"] as const;
export interface Template { id: string; name: string; type: (typeof TEMPLATE_TYPES)[number]; text: string; status: "Published" | "Draft"; createdAt: string; url?: string; hue: number }
const TPL: [string, Template["type"], string, Template["status"]][] = [
  ["Welcome Banner", "Banner", "Trade a smarter tomorrow", "Published"], ["Deposit Bonus Hero", "Promotional Image", "Boost your first deposit", "Published"],
  ["Copy Trading Promo", "Promotional Image", "Follow top traders", "Published"], ["Affiliate Program Graphic", "Graphic", "Earn with every referral", "Published"],
  ["App Splash Screen", "Website/App Media", "INVEX Trade", "Draft"], ["Weekend Contest Banner", "Banner", "Win up to $5,000", "Draft"],
  ["KYC Reminder Graphic", "Graphic", "Verify to withdraw faster", "Published"], ["Dashboard Top Strip", "Website/App Media", "Live markets, 1,000+ assets", "Published"],
  ["Ramadan Offer Image", "Promotional Image", "Seasonal offer", "Draft"],
];
export const templates: Template[] = TPL.map(([name, type, text, status], i) => ({ id: `TPL-${100 + i}`, name, type, text, status, createdAt: iso(NOW - (3 + i * 6) * DAY), hue: 205 + ((i * 23) % 50) }));

export const PROMO_TYPES = ["Bonus Promotion", "Contest", "Offer", "Other"] as const;
export interface Promotion { id: string; name: string; type: (typeof PROMO_TYPES)[number]; start: string; end: string; status: "Active" | "Inactive" | "Draft"; description: string; participants: number }
export const promotions: Promotion[] = [
  { id: "PRM-01", name: "Autumn Deposit Bonus", type: "Bonus Promotion", start: "2026-09-15", end: "2026-10-31", status: "Active", description: "Bonus credited on qualifying deposits during the campaign window.", participants: 412 },
  { id: "PRM-02", name: "Weekend Trading Contest", type: "Contest", start: "2026-10-04", end: "2026-10-06", status: "Draft", description: "Highest closed-trade return over the weekend wins.", participants: 0 },
  { id: "PRM-03", name: "Refer & Earn Offer", type: "Offer", start: "2026-08-01", end: "2026-12-31", status: "Active", description: "Extra reward when a referred client completes KYC.", participants: 1260 },
  { id: "PRM-04", name: "Summer Cashback", type: "Offer", start: "2026-06-01", end: "2026-08-31", status: "Inactive", description: "Ended seasonal cashback promotion.", participants: 988 },
  { id: "PRM-05", name: "Copy Trading Launch", type: "Other", start: "2026-09-01", end: "2026-11-30", status: "Active", description: "Launch campaign for the Copy Trading product.", participants: 214 },
  { id: "PRM-06", name: "New Year Contest", type: "Contest", start: "2026-12-26", end: "2027-01-05", status: "Draft", description: "Year-end trading contest.", participants: 0 },
  { id: "PRM-07", name: "KYC Completion Bonus", type: "Bonus Promotion", start: "2026-07-01", end: "2026-09-30", status: "Active", description: "Reward for clients who complete verification.", participants: 733 },
];
export interface AdminNotification { id: string; title: string; message: string; audience: "All users" | "Specific user"; userId?: string; status: "Sent" | "Draft" | "Scheduled"; createdAt: string; read: boolean; recipients: number; readCount: number }
export const notifications: AdminNotification[] = [
  { id: "NTF-01", title: "Scheduled maintenance", message: "Platform maintenance on Sunday 02:00–03:00 UTC.", audience: "All users", status: "Sent", createdAt: iso(NOW - 2 * DAY), read: false, recipients: 12486, readCount: 8120 },
  { id: "NTF-02", title: "Complete your verification", message: "Please finish KYC to enable withdrawals.", audience: "Specific user", userId: "3769969", status: "Sent", createdAt: iso(NOW - 5 * HOUR), read: false, recipients: 1, readCount: 0 },
  { id: "NTF-03", title: "Withdrawal processed", message: "Your withdrawal has been paid out.", audience: "Specific user", userId: "10037", status: "Sent", createdAt: iso(NOW - 3 * DAY), read: true, recipients: 1, readCount: 1 },
  { id: "NTF-04", title: "Autumn Deposit Bonus is live", message: "Deposit now and receive a bonus.", audience: "All users", status: "Sent", createdAt: iso(NOW - 14 * DAY), read: false, recipients: 12310, readCount: 9044 },
  { id: "NTF-05", title: "Risk warning", message: "Your account received a rule warning.", audience: "Specific user", userId: "10037", status: "Sent", createdAt: iso(NOW - 6 * DAY), read: true, recipients: 1, readCount: 1 },
  { id: "NTF-06", title: "Weekend contest", message: "Join the weekend trading contest.", audience: "All users", status: "Scheduled", createdAt: iso(NOW - HOUR), read: false, recipients: 12486, readCount: 0 },
  { id: "NTF-07", title: "Welcome to INVEX Trade", message: "Your trading account is ready.", audience: "Specific user", userId: "10046", status: "Draft", createdAt: iso(NOW - 20 * HOUR), read: false, recipients: 1, readCount: 0 },
  { id: "NTF-08", title: "Account upgraded", message: "Your IB rank has been upgraded.", audience: "Specific user", userId: "10024", status: "Sent", createdAt: iso(NOW - 9 * DAY), read: true, recipients: 1, readCount: 1 },
];

/* ───────── Admin settings ───────── */
export const PERM_MODULES = ["Clients", "IB Management", "Transactions", "Trades", "Risk & Rules", "Rebates & Commissions", "Marketing", "Reports", "Admin Settings"];
export const PERMS = ["View", "Create", "Edit", "Delete", "Approve", "Manage"] as const;
export interface Role { id: string; name: string; description: string; permissions: Record<string, string[]> }
const all = (): Record<string, string[]> => Object.fromEntries(PERM_MODULES.map((m) => [m, [...PERMS]]));
export const roles: Role[] = [
  { id: "ROLE-01", name: "Super Admin", description: "Full access to every module", permissions: all() },
  { id: "ROLE-02", name: "Finance Manager", description: "Deposits, withdrawals and commissions", permissions: { Transactions: ["View", "Edit", "Approve", "Manage"], "Rebates & Commissions": ["View", "Approve"], Reports: ["View"], Clients: ["View"] } },
  { id: "ROLE-03", name: "Risk Officer", description: "Rules, violations and trades", permissions: { "Risk & Rules": ["View", "Create", "Edit", "Approve", "Manage"], Trades: ["View"], Clients: ["View", "Edit"] } },
  { id: "ROLE-04", name: "Support Agent", description: "Read-only client support", permissions: { Clients: ["View"], Transactions: ["View"], Marketing: ["View"] } },
  { id: "ROLE-05", name: "Marketing Manager", description: "Templates, promotions and notifications", permissions: { Marketing: ["View", "Create", "Edit", "Delete", "Manage"], Reports: ["View"] } },
];
export interface AdminUser { id: string; name: string; email: string; roleId: string; status: "Active" | "Disabled"; lastLogin: string }
export const adminUsers: AdminUser[] = [
  { id: "ADM-01", name: "Super Admin", email: "admin@invextrade.com", roleId: "ROLE-01", status: "Active", lastLogin: iso(NOW - HOUR) },
  { id: "ADM-02", name: "Finance Desk", email: "finance@invextrade.com", roleId: "ROLE-02", status: "Active", lastLogin: iso(NOW - 4 * HOUR) },
  { id: "ADM-03", name: "Risk Officer", email: "risk@invextrade.com", roleId: "ROLE-03", status: "Active", lastLogin: iso(NOW - 26 * HOUR) },
  { id: "ADM-04", name: "Ops Admin", email: "ops@invextrade.com", roleId: "ROLE-01", status: "Active", lastLogin: iso(NOW - 2 * DAY) },
  { id: "ADM-05", name: "Marketing Manager", email: "marketing@invextrade.com", roleId: "ROLE-05", status: "Active", lastLogin: iso(NOW - 3 * DAY) },
  { id: "ADM-06", name: "Support Agent", email: "support@invextrade.com", roleId: "ROLE-04", status: "Disabled", lastLogin: iso(NOW - 40 * DAY) },
];
export const systemSettingsSeed = {
  platformName: "INVEX Trade", supportEmail: "support@invextrade.com", timezone: "UTC", currency: "USD",
  requireTwoFactor: true, sessionTimeoutMin: 20, ipWhitelist: "", maintenanceMode: false,
  emailAlerts: true, riskAlerts: true, withdrawalAlerts: true, pageSize: 10,
};
