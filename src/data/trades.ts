import type { Severity, Trade, TradeSide, ViolationStatus } from "@/types/admin";
import { HOUR, NOW, iso } from "@/lib/format";
import { baseUsers } from "./users";
import { pick, rng } from "./random";

interface Sym { s: string; p: number; d: number; c: number; vol: number; jpy?: boolean }
export const SYMBOLS: Sym[] = [
  { s: "EUR/USD", p: 1.1725, d: 5, c: 100000, vol: 0.0035 },
  { s: "GBP/USD", p: 1.342, d: 5, c: 100000, vol: 0.004 },
  { s: "USD/JPY", p: 148.65, d: 3, c: 100000, vol: 0.004, jpy: true },
  { s: "AUD/USD", p: 0.6612, d: 5, c: 100000, vol: 0.0035 },
  { s: "USD/CAD", p: 1.3588, d: 5, c: 100000, vol: 0.003 },
  { s: "XAU/USD", p: 2650.5, d: 2, c: 100, vol: 0.008 },
  { s: "BTC/USD", p: 67500, d: 2, c: 1, vol: 0.02 },
  { s: "ETH/USD", p: 3400, d: 2, c: 1, vol: 0.025 },
];
const symOf = (s: string) => SYMBOLS.find((x) => x.s === s)!;
const VOLUMES = [0.01, 0.05, 0.1, 0.2, 0.5, 1, 1, 2, 3];
const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

interface Override {
  userId?: string; side?: TradeSide; symbol?: string; volume?: number; durationSec?: number;
  open?: string; close?: string; atHour?: number; open_?: boolean; prices?: [number, number];
  viol?: { ruleId: string; type: string; severity: Severity; status: ViolationStatus; details: string };
}
/** Index → deterministic tweaks. Entries with `viol` also generate a violation record (see violations.ts). */
export const OVERRIDES: Record<number, Override> = {
  0: { userId: "3769969", symbol: "EUR/USD", side: "BUY", volume: 1, prices: [1.1725, 1.1742], open: "2026-09-30T10:35:21.000Z", close: "2026-09-30T11:20:10.000Z" },
  1: { userId: "3769969", symbol: "EUR/USD", side: "SELL", volume: 0.5, open_: true },
  2: { userId: "10043" },
  4: { userId: "10041" },
  5: { userId: "10032" },
  3: { userId: "10037", symbol: "XAU/USD", side: "BUY", volume: 2, durationSec: 45, viol: { ruleId: "RULE-01", type: "Scalping", severity: "High", status: "Warned", details: "Position closed after 45s; minimum hold time is 60s." } },
  6: { userId: "10041", symbol: "EUR/USD", side: "BUY", volume: 12, durationSec: 5400, viol: { ruleId: "RULE-04", type: "Maximum lot size", severity: "Critical", status: "Open", details: "Order volume 12.00 lots exceeds the 5.00 lot limit." } },
  9: { userId: "10034", symbol: "GBP/USD", side: "BUY", volume: 1, durationSec: 7200 },
  10: { userId: "10034", symbol: "GBP/USD", side: "SELL", volume: 1, durationSec: 5400, viol: { ruleId: "RULE-02", type: "Hedging", severity: "High", status: "Banned", details: "SELL opened while BUY on the same symbol was still open (account MT5-500249)." } },
  12: { userId: "10026", symbol: "USD/JPY", side: "SELL", volume: 1, atHour: 12.5, durationSec: 1500, viol: { ruleId: "RULE-03", type: "News trading", severity: "Medium", status: "Warned", details: "Position opened 2 minutes before a high-impact US release." } },
  15: { userId: "10035", symbol: "AUD/USD", side: "BUY", volume: 0.5, durationSec: 20, viol: { ruleId: "RULE-06", type: "Minimum duration", severity: "Low", status: "Open", details: "Trade duration 20s is below the 120s minimum." } },
  18: { userId: "10039", symbol: "EUR/USD", side: "SELL", volume: 0.2, atHour: 22.08, durationSec: 4800, viol: { ruleId: "RULE-07", type: "Restricted hours", severity: "Low", status: "Open", details: "Position opened at 22:05 UTC inside the 21:55–23:05 restricted window." } },
  20: { userId: "10043", symbol: "BTC/USD", side: "BUY", volume: 0.1, durationSec: 9000, viol: { ruleId: "RULE-05", type: "Maximum open trades", severity: "Medium", status: "Cleared", details: "12 concurrent open positions detected (limit 10). Cleared after review." } },
  22: { userId: "10042", symbol: "XAU/USD", side: "SELL", volume: 1, durationSec: 30, viol: { ruleId: "RULE-01", type: "Scalping", severity: "High", status: "Banned", details: "Repeated scalping — 30s hold. Third occurrence in 14 days." } },
  24: { userId: "10033", symbol: "USD/CAD", side: "BUY", volume: 8, durationSec: 3600, viol: { ruleId: "RULE-04", type: "Maximum lot size", severity: "Critical", status: "Cleared", details: "Order volume 8.00 lots exceeds the 5.00 lot limit. Approved exception by risk desk." } },
  26: { userId: "10032", symbol: "ETH/USD", side: "BUY", volume: 1, durationSec: 14400 },
  27: { userId: "10032", symbol: "ETH/USD", side: "SELL", volume: 1, durationSec: 7200, viol: { ruleId: "RULE-02", type: "Hedging", severity: "High", status: "Open", details: "SELL opened while a BUY on ETH/USD was still open." } },
  29: { userId: "10045", symbol: "GBP/USD", side: "BUY", volume: 2, atHour: 12.5, durationSec: 900, viol: { ruleId: "RULE-03", type: "News trading", severity: "Medium", status: "Open", details: "Position opened during a high-impact release window." } },
  32: { userId: "10025", symbol: "USD/JPY", side: "BUY", volume: 1, durationSec: 40, viol: { ruleId: "RULE-01", type: "Scalping", severity: "High", status: "Open", details: "Position closed after 40s; minimum hold time is 60s." } },
};
const POOL = baseUsers.map((u) => u.id).filter((id) => !["10038", "10040", "10044", "10046", "10036", "3769969"].includes(id));
const acct = (id: string) => baseUsers.find((u) => u.id === id)!.accountId;
const OPEN_IDX = new Set([2, 4, 5, 7, 8]);
export const TRADE_COUNT = 38;

export const trades: Trade[] = Array.from({ length: TRADE_COUNT }, (_, i) => {
  const r = rng(9000 + i);
  const ov = OVERRIDES[i] ?? {};
  const userId = ov.userId ?? pick(r, POOL);
  const sym = symOf(ov.symbol ?? pick(r, SYMBOLS).s);
  const side: TradeSide = ov.side ?? (r() > 0.5 ? "BUY" : "SELL");
  const dir = side === "BUY" ? 1 : -1;
  const volume = ov.volume ?? pick(r, VOLUMES);
  const isOpen = ov.open_ ?? (!ov.open && !ov.durationSec && OPEN_IDX.has(i));
  let openMs = ov.open ? Date.parse(ov.open) : NOW - (i * 4.8 + 0.2 + r() * 2) * HOUR;
  if (ov.atHour !== undefined) {
    const day = new Date(openMs); day.setUTCHours(0, 0, 0, 0);
    openMs = day.getTime() + Math.round(ov.atHour * HOUR) + 21_000;
  }
  const openPrice = ov.prices?.[0] ?? round(sym.p * (1 + (r() - 0.5) * sym.vol), sym.d);
  let closePrice: number | null = null; let closeMs: number | null = null; let profit = 0;
  const cur = (px: number) => px * (1 + (r() - 0.45) * sym.vol * 0.6);
  if (isOpen) {
    const px = round(cur(openPrice), sym.d);
    profit = round(((px - openPrice) * dir * volume * sym.c) / (sym.jpy ? px : 1), 2);
  } else {
    const dur = ov.durationSec ?? Math.floor(1200 + r() * 60000);
    closeMs = ov.close ? Date.parse(ov.close) : Math.min(openMs + dur * 1000, NOW - 60_000);
    closePrice = ov.prices?.[1] ?? round(openPrice * (1 + (r() - 0.46) * sym.vol * 1.2), sym.d);
    profit = round(((closePrice - openPrice) * dir * volume * sym.c) / (sym.jpy ? closePrice : 1), 2);
  }
  return {
    id: `TRD-${10001 + i}`, userId, accountId: acct(userId), symbol: sym.s, side, volume,
    openPrice, closePrice, openTime: iso(openMs), closeTime: closeMs ? iso(closeMs) : null,
    profit, status: isOpen ? "Open" : "Closed", ticket: 82000000 + i * 137 + Math.floor(r() * 90),
    sl: r() > 0.4 ? round(openPrice * (1 - dir * sym.vol * 0.8), sym.d) : null,
    tp: r() > 0.5 ? round(openPrice * (1 + dir * sym.vol * 1.2), sym.d) : null,
    commission: round(volume * 7, 2), swap: round((r() - 0.6) * 4 * volume, 2),
    spread: round(0.2 + r() * 1.4, 1), slippage: round(r() * 0.4, 1), latencyMs: Math.floor(18 + r() * 60),
    server: "INVEX-Live01", digits: sym.d,
  };
});
export const startOfToday = () => { const d = new Date(NOW); d.setUTCHours(0, 0, 0, 0); return d.getTime(); };
