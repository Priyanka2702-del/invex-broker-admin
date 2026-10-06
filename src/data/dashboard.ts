import { DAY, NOW } from "@/lib/format";
import { rng } from "./random";

/** Shape mirrors a future GET /admin/dashboard/stats response. Aggregate values cover the whole platform (not only the demo rows). */
export const dashboardStats = {
  allDeposit: { value: 2485600, delta: 12.4 },
  allWithdraw: { value: 845200, delta: 6.1 },
  deposit24h: { value: 48520, delta: 8.7 },
  withdraw24h: { value: 21350, delta: -3.2 },
  totalClients: { value: 12486, delta: 4.9 },
  newClients24h: { value: 42, delta: 11.0 },
  systemBalance: { value: 1640400, delta: 9.3 },
};
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const chartLabels = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(NOW - (13 - i) * DAY);
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`;
});
const series = (seed: number, lo: number, hi: number, last: number) => {
  const r = rng(seed);
  return Array.from({ length: 14 }, (_, i) => (i === 13 ? last : Math.round(lo + r() * (hi - lo))));
};
export const chartData = {
  deposit: series(1, 28000, 62000, 48520),
  withdraw: series(2, 12000, 32000, 21350),
  registrations: series(3, 18, 58, 42),
  volume: series(4, 820, 1900, 1476),
  profit: series(5, 6000, 21000, 14820),
  loss: series(6, 5000, 19000, 11240).map((v) => -v),
};
