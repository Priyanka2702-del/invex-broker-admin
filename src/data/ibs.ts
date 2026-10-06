import type { IB, IBRank, IBType } from "@/types/admin";
import { DAY, NOW, iso } from "@/lib/format";

export const IB_RANKS: IBRank[] = ["Basic", "Starter", "Prime", "Crown", "Master"];
export const IB_TYPES: IBType[] = ["Rebate Link", "Revenue Link"];
/** IB rate per lot (USD) by rank — used to derive commission from referred-user volume. */
export const IB_RATE: Record<IBRank, number> = { Basic: 2, Starter: 3, Prime: 4.5, Crown: 6, Master: 8 };

// userId must match the first 12 users in users.ts (10020–10031)
const SEED: [string, string, IBType, IBRank, number][] = [
  ["IB-1001", "10020", "Rebate Link", "Master", 412],
  ["IB-1002", "10021", "Revenue Link", "Master", 388],
  ["IB-1003", "10022", "Rebate Link", "Crown", 350],
  ["IB-1004", "10023", "Revenue Link", "Crown", 301],
  ["IB-1005", "10024", "Rebate Link", "Prime", 276],
  ["IB-1006", "10025", "Revenue Link", "Prime", 244],
  ["IB-1007", "10026", "Rebate Link", "Starter", 219],
  ["IB-1008", "10027", "Revenue Link", "Starter", 198],
  ["IB-1009", "10028", "Rebate Link", "Starter", 170],
  ["IB-1010", "10029", "Revenue Link", "Basic", 143],
  ["IB-1011", "10030", "Rebate Link", "Basic", 121],
  ["IB-1012", "10031", "Revenue Link", "Basic", 96],
];
export const ibs: IB[] = SEED.map(([id, userId, type, rank, days]) => ({
  id, userId, type, rank, status: id === "IB-1009" ? "Suspended" : "Active",
  createdAt: iso(NOW - (days - 2) * DAY), linkCode: `INVEX-${id.slice(3)}`,
}));
export const ibTypeById = (id?: string): IBType | undefined => ibs.find((i) => i.id === id)?.type;
