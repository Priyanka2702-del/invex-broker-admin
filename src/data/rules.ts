import type { Rule } from "@/types/admin";
import { DAY, NOW, iso } from "@/lib/format";

export const RULE_TYPES: { value: Rule["type"]; label: string; defaults: Record<string, string | number> }[] = [
  { value: "scalping", label: "Scalping", defaults: { minHoldSeconds: 60 } },
  { value: "hedging", label: "Hedging", defaults: { sameSymbol: "true" } },
  { value: "news", label: "News trading", defaults: { windowMinutes: 5 } },
  { value: "max_lot", label: "Maximum lot size", defaults: { maxLots: 5 } },
  { value: "max_open_trades", label: "Maximum open trades", defaults: { maxOpen: 10 } },
  { value: "min_duration", label: "Minimum trade duration", defaults: { minSeconds: 120 } },
  { value: "restricted_hours", label: "Restricted trading hours", defaults: { from: "21:55", to: "23:05" } },
  { value: "custom", label: "Custom", defaults: {} },
];

export const rules: Rule[] = [
  { id: "RULE-01", name: "Scalping Not Allowed", description: "Trades held for less than the minimum hold time are flagged as scalping.", type: "scalping", params: { minHoldSeconds: 60 }, status: "Enabled", severity: "High", createdAt: iso(NOW - 200 * DAY) },
  { id: "RULE-02", name: "Hedging Not Allowed", description: "Opposite positions on the same symbol within the same account are not permitted.", type: "hedging", params: { sameSymbol: "true" }, status: "Enabled", severity: "High", createdAt: iso(NOW - 200 * DAY) },
  { id: "RULE-03", name: "News Trading Not Allowed", description: "No new positions within the window around high-impact news releases.", type: "news", params: { windowMinutes: 5 }, status: "Enabled", severity: "Medium", createdAt: iso(NOW - 170 * DAY) },
  { id: "RULE-04", name: "Maximum Lot Size", description: "A single order may not exceed the configured lot size.", type: "max_lot", params: { maxLots: 5 }, status: "Enabled", severity: "Critical", createdAt: iso(NOW - 160 * DAY) },
  { id: "RULE-05", name: "Maximum Open Trades", description: "Limits concurrent open positions per account.", type: "max_open_trades", params: { maxOpen: 10 }, status: "Enabled", severity: "Medium", createdAt: iso(NOW - 120 * DAY) },
  { id: "RULE-06", name: "Minimum Trade Duration", description: "Positions must remain open for at least the minimum duration.", type: "min_duration", params: { minSeconds: 120 }, status: "Enabled", severity: "Low", createdAt: iso(NOW - 90 * DAY) },
  { id: "RULE-07", name: "Restricted Trading Hours", description: "No new positions during the daily rollover window (UTC).", type: "restricted_hours", params: { from: "21:55", to: "23:05" }, status: "Disabled", severity: "Low", createdAt: iso(NOW - 60 * DAY) },
];
