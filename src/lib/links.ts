import type { IB, User } from "@/types/admin";

export interface LinkRow { id: string; user: User; kind: "Rebate Link" | "Revenue Link"; code: string; approval: "Approved" | "Pending" | "Rejected"; referrals: User[] }
/** Every IB owner has a Rebate Link; a Revenue Link row exists once requested (shown in the user's Affiliate Program only when Approved). */
export function buildLinks(users: User[], ibs: IB[]): LinkRow[] {
  const rows: LinkRow[] = [];
  for (const u of users) {
    const ib = ibs.find((i) => i.userId === u.id);
    if (!ib && u.revenueLink === "None") continue;
    const refs = (k: LinkRow["kind"]) => users.filter((x) => x.uplineId === u.id && x.registrationType === k);
    if (ib) rows.push({ id: `LNK-${u.id}-R`, user: u, kind: "Rebate Link", code: ib.linkCode, approval: "Approved", referrals: refs("Rebate Link") });
    if (u.revenueLink !== "None") rows.push({ id: `LNK-${u.id}-V`, user: u, kind: "Revenue Link", code: `REV-${u.id}`, approval: u.revenueLink, referrals: refs("Revenue Link") });
  }
  return rows;
}
