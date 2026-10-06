import type { AuditLog } from "@/types/admin";
import { HOUR, NOW, iso } from "@/lib/format";

const S: [string, string, string, string?, string?][] = [
  ["User status changed", "Clients", "Status changed Active → Banned (repeated scalping)", "10042", "Super Admin"],
  ["Upline changed", "Clients", "Upline changed 10022 → 10021", "10025", "Super Admin"],
  ["Rank changed", "IB Management", "IB rank changed Prime → Crown", "10024", "Ops Admin"],
  ["Balance added", "Clients", "Added $500.00 to Index Wallet", "10033", "Finance Desk"],
  ["Balance deducted", "Clients", "Deducted $120.00 MT5 equity", "10034", "Finance Desk"],
  ["Transaction edited", "Transactions", "Deposit DEP-20004 payment method corrected", "10021", "Finance Desk"],
  ["Revenue Link approved", "Affiliate / Links", "Revenue Link approved for user", "10023", "Super Admin"],
  ["Marketing Account approved", "Marketing Accounts", "User approved as Marketing Account", "10032", "Super Admin"],
  ["Settings changed", "Admin Settings", "Session timeout changed 30 → 20 minutes", undefined, "Super Admin"],
  ["Rule enabled", "Risk", "Rule “Maximum Open Trades” enabled", undefined, "Risk Officer"],
  ["Deposit approved", "Transactions", "Deposit approved", "10035", "Finance Desk"],
  ["Withdrawal rejected", "Transactions", "Withdrawal rejected — address not whitelisted", "10037", "Finance Desk"],
  ["Promotion activated", "Promotions", "Promotion “Autumn Deposit Bonus” activated", undefined, "Marketing Manager"],
  ["Notification sent", "Notifications", "Broadcast notification sent to all users", undefined, "Marketing Manager"],
  ["Account type updated", "Account Management", "ECN separate per lot updated", undefined, "Ops Admin"],
];
export const seedAudit: AuditLog[] = Array.from({ length: 30 }, (_, i) => {
  const [action, module, description, userId, admin] = S[(i * 7) % S.length];
  return { id: `AUD-${9000 + 30 - i}`, action, module, description, userId, admin: admin!, timestamp: iso(NOW - (i * 5.3 + 2) * HOUR) };
});
