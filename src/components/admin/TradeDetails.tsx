"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, InfoGrid, NotFoundCard, UserLink, IdLink } from "./ui";
import StatusBadge from "./StatusBadge";
import { useAdminData } from "@/context/AdminDataContext";
import { fmtDateTime, fmtDuration, money, signedMoney } from "@/lib/format";

export default function TradeDetails({ tradeId }: { tradeId: string }) {
  const d = useAdminData();
  const router = useRouter();
  const t = d.trades.find((x) => x.id === tradeId);
  if (!t) return <NotFoundCard what={`Trade ${tradeId}`} backHref="/trades" />;
  const user = d.users.find((u) => u.id === t.userId);
  const vios = d.violations.filter((v) => v.tradeId === t.id);
  const px = (v: number | null) => (v === null ? "—" : v.toFixed(t.digits));
  const dur = t.closeTime ? fmtDuration((Date.parse(t.closeTime) - Date.parse(t.openTime)) / 1000) : "Still open";
  return (
    <>
      <button className="ix-back" onClick={() => router.push("/trades")}><i className="ti ti-arrow-left" />Back to trades</button>
      {vios.length > 0 && (
        <div className="ix-banner amber"><i className="ti ti-alert-triangle" />
          <div><b>{vios.length} rule violation{vios.length > 1 ? "s" : ""} on this trade:</b> {vios.map((v, i) => <span key={v.id}>{i > 0 && ", "}<Link href={`/risk/violations/${v.id}`} className="ix-link-id">{v.id} ({v.type})</Link></span>)}</div></div>
      )}
      <div className="ix-card" style={{ marginBottom: 18 }}>
        <div className="ix-hero">
          <div className="big-av"><i className="ti ti-chart-candle" /></div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="ix-row"><h1 style={{ fontSize: 22, fontWeight: 700 }}>{t.symbol}</h1><StatusBadge status={t.side} /><StatusBadge status={t.status} /></div>
            <div style={{ color: "var(--ix-muted)", fontSize: 13.5, marginTop: 4 }}><b className="ix-mono">{t.id}</b> · {t.volume.toFixed(2)} lots · Ticket #{t.ticket}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12.5, color: "var(--ix-muted)" }}>{t.status === "Open" ? "Floating P/L" : "Profit / Loss"}</div>
            <div className={t.profit >= 0 ? "pos" : "neg"} style={{ fontSize: 28, fontWeight: 700 }}>{signedMoney(t.profit)}</div>
          </div>
        </div>
      </div>
      <div className="ix-grid c2">
        <Card title="Trade information"><InfoGrid items={[
          ["Trade ID", <span className="ix-mono" key="a">{t.id}</span>], ["User ID", <UserLink key="u" id={t.userId} />], ["Account", <span className="ix-mono" key="b">{t.accountId}</span>],
          ["Symbol", t.symbol], ["Trade type", t.side], ["Volume", t.volume.toFixed(2)], ["Open price", px(t.openPrice)], ["Close price", px(t.closePrice)],
          ["Stop loss", px(t.sl)], ["Take profit", px(t.tp)], ["Profit / Loss", <span key="p" className={t.profit >= 0 ? "pos" : "neg"}>{signedMoney(t.profit)}</span>],
        ]} /></Card>
        <Card title="Trade timestamps"><InfoGrid items={[["Open time", fmtDateTime(t.openTime)], ["Close time", fmtDateTime(t.closeTime)], ["Duration", dur], ["Timezone", "UTC"]]} />
          <div className="ix-timeline" style={{ marginTop: 22 }}>
            <div className="it"><span className="dot" /><div>Order filled — {t.side} {t.volume.toFixed(2)} {t.symbol} @ {px(t.openPrice)}<small>{fmtDateTime(t.openTime)}</small></div></div>
            {t.closeTime ? <div className="it"><span className="dot" /><div>Position closed @ {px(t.closePrice)} ({signedMoney(t.profit)})<small>{fmtDateTime(t.closeTime)}</small></div></div>
              : <div className="it"><span className="dot" style={{ background: "var(--ix-amber)", boxShadow: "none" }} /><div>Position still open<small>Live</small></div></div>}
          </div></Card>
        <Card title="Execution information"><InfoGrid items={[
          ["Platform", "MetaTrader 5"], ["Server", t.server], ["Execution type", "Market execution"], ["Spread", `${t.spread} pts`], ["Slippage", `${t.slippage} pts`], ["Latency", `${t.latencyMs} ms`],
          ["Commission", money(t.commission)], ["Swap", money(t.swap)], ["Ticket", `#${t.ticket}`],
        ]} /></Card>
        <Card title="Account & user information" action={<UserLink id={t.userId} name="Open user profile →" />}><InfoGrid items={[
          ["User ID", <UserLink key="u" id={t.userId} />], ["Name", user?.name ?? "—"], ["Email", user?.email ?? "—"], ["Trading account", <span className="ix-mono" key="a">{t.accountId}</span>],
          ["Wallet balance", user ? money(user.balance) : "—"], ["Account status", user ? <StatusBadge key="s" status={user.accountStatus} /> : "—"],
          ["Violations on trade", vios.length ? vios.map((v) => <IdLink key={v.id} href={`/risk/violations/${v.id}`}>{v.id}</IdLink>) : "None"],
        ]} /></Card>
      </div>
    </>
  );
}
