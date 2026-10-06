/**
 * Data-access seam for the broker admin modules.
 * Today every call resolves from the local mock layer in `@/data`.
 * To go live, swap each body for an `api.get/post/put/delete(...)` call (see `@/services/api`) —
 * the AdminDataProvider (`@/context/AdminDataContext`) is the only consumer.
 */
import * as d from "@/data";

const wrap = <T,>(v: T): Promise<T> => Promise.resolve(structuredClone(v));
export const adminService = {
  getUsers: () => wrap(d.users), getIBs: () => wrap(d.ibs),
  getDeposits: () => wrap(d.deposits), getWithdrawals: () => wrap(d.withdrawals),
  getTrades: () => wrap(d.trades), getViolations: () => wrap(d.violations),
  getRules: () => wrap(d.rules), getSystemRanks: () => wrap(d.systemRanks),
  getDashboard: () => wrap({ stats: d.dashboardStats, charts: d.chartData, labels: d.chartLabels }),
};
export default adminService;
