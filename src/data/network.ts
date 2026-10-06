/** Team network seed. uplineId defaults to the referring IB's owner; IB owners below are re-parented to build a 5-level tree. */
export const UPLINES: Record<string, string> = {
  "10021": "10020", "10022": "10020", "10023": "10021", "10024": "10021", "10025": "10022", "10026": "10023",
  "10027": "10023", "10028": "10024", "10029": "10025", "10030": "10026", "10031": "10027",
};
/** MT5 equity (USD) per user; unlisted users get a small seeded value. */
export const EQUITY: Record<string, number> = {
  "10023": 8200, "10024": 6400, "3769969": 3100, "10033": 4500, "10025": 9800, "10034": 1200,
  "10026": 5000, "10027": 3800, "10035": 2900, "10028": 6200, "10036": 900, "10029": 7600, "10037": 5200,
  "10030": 15000, "10039": 41000, "10031": 12000, "10040": 6000, "10041": 14000, "10042": 3000, "10043": 8500, "10045": 105000,
};
export const REVENUE_LINK_STATUS: Record<string, "None" | "Pending" | "Approved" | "Rejected"> = {
  "10035": "Pending", "10039": "Pending", "10040": "Rejected", "10038": "Pending",
};
