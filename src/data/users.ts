import type { AccountStatus, KycStatus, User } from "@/types/admin";
import { DAY, NOW, iso } from "@/lib/format";
import { ibs, ibTypeById } from "./ibs";
import { RANK_ASSIGNMENTS } from "./systemRanks";
import { pick, rng } from "./random";
import { EQUITY, UPLINES, REVENUE_LINK_STATUS } from "./network";

// id, name, country, kyc, status, referring IB index (-1 = direct), days since registration
type Row = [string, string, string, KycStatus, AccountStatus, number, number];
const ROWS: Row[] = [
  // the first 12 users are the IB accounts (IB-1001 … IB-1012)
  ["10020", "Daniel Whitmore", "United Kingdom", "Approved", "Active", -1, 412],
  ["10021", "Priya Nair", "India", "Approved", "Active", -1, 388],
  ["10022", "Marcus Lindholm", "Sweden", "Approved", "Active", -1, 350],
  ["10023", "Sofia Ramirez", "Spain", "Approved", "Active", -1, 301],
  ["10024", "Omar Al-Farsi", "United Arab Emirates", "Approved", "Active", -1, 276],
  ["10025", "Chen Wei", "Singapore", "Approved", "Active", -1, 244],
  ["10026", "Elena Petrova", "Cyprus", "Approved", "Warned", -1, 219],
  ["10027", "Kwame Mensah", "Ghana", "Approved", "Active", -1, 198],
  ["10028", "Isabella Rossi", "Italy", "Approved", "Active", -1, 170],
  ["10029", "Rahul Deshmukh", "India", "Approved", "Active", -1, 143],
  ["10030", "Lucas Ferreira", "Brazil", "Approved", "Active", -1, 121],
  ["10031", "Aisha Rahman", "Malaysia", "Approved", "Active", -1, 96],
  // clients
  ["3769969", "Aarav Malhotra", "India", "Unverified", "Active", 1, 34],
  ["10032", "Thomas Becker", "Germany", "Approved", "Active", 0, 88],
  ["10033", "Ananya Iyer", "India", "Approved", "Active", 1, 80],
  ["10034", "Jamal Carter", "United States", "Approved", "Banned", 2, 77],
  ["10035", "Yuki Tanaka", "Japan", "Approved", "Active", 3, 71],
  ["10036", "Fatima Zahra", "Morocco", "Pending", "Active", 4, 65],
  ["10037", "Nikolai Volkov", "Kazakhstan", "Approved", "Warned", 5, 60],
  ["10038", "Olivia Brown", "Australia", "Unverified", "Active", -1, 54],
  ["10039", "Vikram Singh", "India", "Approved", "Active", 6, 51],
  ["10040", "Grace Okafor", "Nigeria", "Rejected", "Active", 7, 47],
  ["10041", "Mateo Gonzalez", "Argentina", "Approved", "Active", 8, 44],
  ["10042", "Hana Kim", "South Korea", "Approved", "Banned", 9, 39],
  ["10043", "Sanjay Kapoor", "India", "Approved", "Active", 10, 33],
  ["10044", "Emma Larsson", "Norway", "Pending", "Active", -1, 29],
  ["10045", "Tariq Hussain", "Pakistan", "Approved", "Active", 11, 22],
  ["10046", "Zoe Mitchell", "Canada", "Unverified", "Active", -1, 1],
];
const DIAL: Record<string, string> = {
  "United Kingdom": "+44", India: "+91", Sweden: "+46", Spain: "+34", "United Arab Emirates": "+971",
  Singapore: "+65", Cyprus: "+357", Ghana: "+233", Italy: "+39", Brazil: "+55", Malaysia: "+60",
  Germany: "+49", "United States": "+1", Japan: "+81", Morocco: "+212", Kazakhstan: "+7",
  Australia: "+61", Nigeria: "+234", Argentina: "+54", "South Korea": "+82", Norway: "+47", Canada: "+1",
};
const MARKETING = ["10032", "10039", "10043"];
const DIRECT_SOURCES = ["Organic search", "Social media", "Direct signup", "Affiliate banner"] as const;

/** Users with balance = 0; `data/index.ts` fills balances from the deposit/withdrawal/trade ledgers. */
export const baseUsers: User[] = ROWS.map(([id, name, country, kyc, status, ibIdx, days], i) => {
  const r = rng(500 + i);
  const [first, ...rest] = name.toLowerCase().split(" ");
  const ib = ibIdx >= 0 ? ibs[ibIdx] : undefined;
  const createdAt = iso(NOW - days * DAY - Math.floor(r() * 12) * 3_600_000);
  return {
    id, name, country, kycStatus: kyc, accountStatus: status, balance: 0,
    email: `${first}.${rest.join("")}@${pick(r, ["gmail.com", "outlook.com", "proton.me", "yahoo.com"])}`,
    phone: `${DIAL[country] ?? "+1"} ${Math.floor(70000 + r() * 29999)} ${Math.floor(10000 + r() * 89999)}`,
    accountId: id === "3769969" ? "MT5-500234" : `MT5-${500235 + i}`,
    ibId: ib?.id,
    registrationType: ib ? (ibTypeById(ib.id) ?? "Direct") : "Direct",
    referralSource: ib ? `IB referral link (${ib.linkCode})` : pick(r, DIRECT_SOURCES),
    createdAt,
    systemRankId: RANK_ASSIGNMENTS[id],
    marketing: MARKETING.includes(id)
      ? { assignedAt: iso(NOW - (5 + i) * DAY), approvedBy: "Super Admin", dummyDollars: 5000 + (i % 3) * 2500 } : undefined,
    uplineId: UPLINES[id] ?? (ib ? ibs.find((x) => x.id === ib.id)?.userId : undefined),
    mt5Equity: EQUITY[id] ?? Math.round(600 + r() * 4800),
    revenueLink: REVENUE_LINK_STATUS[id] ?? (ibs.find((x) => x.userId === id)?.type === "Revenue Link" ? "Approved" : "None"),
  };
});
