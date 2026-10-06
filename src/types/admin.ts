export type KycStatus = "Approved" | "Pending" | "Unverified" | "Rejected";
export type AccountStatus = "Active" | "Warned" | "Banned" | "Pending" | "Approved";
export type RevenueLinkStatus = "None" | "Pending" | "Approved" | "Rejected";
export type RegistrationType = "Direct" | "Rebate Link" | "Revenue Link";
export type IBType = "Rebate Link" | "Revenue Link";
export type IBRank = "Basic" | "Starter" | "Prime" | "Crown" | "Master";
export type TxStatus = "Successful" | "Pending" | "Rejected";
export type TradeSide = "BUY" | "SELL";
export type TradeStatus = "Open" | "Closed";
export type Severity = "Low" | "Medium" | "High" | "Critical";
export type ViolationStatus = "Open" | "Warned" | "Cleared" | "Banned";
export type RuleStatus = "Enabled" | "Disabled";
export type RuleType =
  | "scalping" | "hedging" | "news" | "max_lot" | "max_open_trades"
  | "min_duration" | "restricted_hours" | "custom";

export interface User {
  id: string; name: string; email: string; phone: string; country: string;
  accountId: string; balance: number; kycStatus: KycStatus; accountStatus: AccountStatus;
  ibId?: string; registrationType: RegistrationType; referralSource: string;
  createdAt: string; systemRankId?: string;
  /** direct upline user id (network tree used for levels 1–5) */ uplineId?: string;
  /** MT5 trading-account equity (separate from the Index Wallet balance) */ mt5Equity: number;
  revenueLink: RevenueLinkStatus;
  /** per-level overrides: rebate $ per lot, revenue % — index 0 = Level 1 */
  customIb?: { rebate: number[]; revenue: number[] };
  marketing?: { assignedAt: string; approvedBy: string; dummyDollars: number };
}
export interface IB {
  id: string; userId: string; type: IBType; rank: IBRank;
  status: "Active" | "Suspended"; createdAt: string; linkCode: string;
}
export interface Deposit {
  id: string; userId: string; amount: number; method: string; txId: string;
  status: TxStatus; createdAt: string; processedAt?: string; processedBy?: string; note?: string;
}
export type Withdrawal = Deposit & { destination: string };
export interface Trade {
  id: string; userId: string; accountId: string; symbol: string; side: TradeSide;
  volume: number; openPrice: number; closePrice: number | null;
  openTime: string; closeTime: string | null; profit: number; status: TradeStatus;
  ticket: number; sl: number | null; tp: number | null; commission: number; swap: number;
  spread: number; slippage: number; latencyMs: number; server: string; digits: number;
}
export interface Rule {
  id: string; name: string; description: string; type: RuleType;
  params: Record<string, string | number>; status: RuleStatus; createdAt: string; severity: Severity;
}
export interface Violation {
  id: string; userId: string; ruleId: string; ruleName: string; tradeId: string; symbol: string;
  type: string; createdAt: string; severity: Severity; status: ViolationStatus; details: string;
}
export interface SystemRank {
  id: string; name: string; description: string; status: "Active" | "Inactive"; createdAt: string;
}

export interface AuditLog {
  id: string; admin: string; action: string; module: string; userId?: string; description: string; timestamp: string;
}
