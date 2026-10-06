import type { SystemRank } from "@/types/admin";
import { DAY, NOW, iso } from "@/lib/format";

export const systemRanks: SystemRank[] = [
  { id: "RANK-01", name: "Master", description: "System rank — lifetime once achieved (Total Team Deposit)", status: "Active", createdAt: iso(NOW - 180 * DAY) },
  { id: "RANK-02", name: "Royal", description: "System rank — lifetime once achieved (Total Team Deposit)", status: "Active", createdAt: iso(NOW - 180 * DAY) },
  { id: "RANK-03", name: "Empire", description: "System rank — lifetime once achieved (Total Team Deposit)", status: "Active", createdAt: iso(NOW - 150 * DAY) },
  { id: "RANK-04", name: "Ambassador", description: "System rank — lifetime once achieved (Total Team Deposit)", status: "Active", createdAt: iso(NOW - 120 * DAY) },
  { id: "RANK-05", name: "Crown Ambassador", description: "System rank — lifetime once achieved (Total Team Deposit)", status: "Active", createdAt: iso(NOW - 90 * DAY) },
];
/** userId -> system rank id (seed assignments). Independent of Equity Bonus. */
export const RANK_ASSIGNMENTS: Record<string, string> = {
  "10032": "RANK-01", "10033": "RANK-01", "10036": "RANK-01",
  "10021": "RANK-02", "10022": "RANK-02", "10035": "RANK-02",
  "10020": "RANK-05", "10023": "RANK-03", "10041": "RANK-03",
  "10024": "RANK-04", "10025": "RANK-04", "10027": "RANK-03",
};
