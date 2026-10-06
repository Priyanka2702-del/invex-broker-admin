"use client";
import { useRouter } from "next/navigation";
import { Card, InfoGrid, NotFoundCard, UserLink, IdLink } from "./ui";
import StatusBadge from "./StatusBadge";
import ViolationActions from "./ViolationActions";
import { useAdminData } from "@/context/AdminDataContext";
import { fmtDateTime, signedMoney } from "@/lib/format";

export default function ViolationDetails({ violationId }: { violationId: string }) {
  const d = useAdminData();
  const router = useRouter();
  const v = d.violations.find((x) => x.id === violationId);
  if (!v) return <NotFoundCard what={`Violation ${violationId}`} backHref="/risk/violations" />;
  const trade = d.trades.find((t) => t.id === v.tradeId);
  const rule = d.rules.find((r) => r.id === v.ruleId);
  const user = d.users.find((u) => u.id === v.userId);
  const history = d.violations.filter((x) => x.userId === v.userId && x.id !== v.id);
  return (
    <>
      <button className="ix-back" onClick={() => router.push("/risk/violations")}><i className="ti ti-arrow-left" />Back to violations</button>
      <div className="ix-card" style={{ marginBottom: 18 }}>
        <div className="ix-hero">
          <div className="big-av"><i className="ti ti-shield-exclamation" /></div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="ix-row"><h1 style={{ fontSize: 22, fontWeight: 700 }}>{v.type}</h1><StatusBadge status={v.severity} /><StatusBadge status={v.status} /></div>
            <div style={{ color: "var(--ix-muted)", fontSize: 13.5, marginTop: 4 }}><b className="ix-mono">{v.id}</b> · detected {fmtDateTime(v.createdAt)} by the rule engine</div>
          </div>
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--ix-border)", background: "#fafcff", borderRadius: "0 0 16px 16px" }}><ViolationActions v={v} /></div>
      </div>
      <div className="ix-grid c2">
        <Card title="What happened"><p style={{ fontSize: 14.5, lineHeight: 1.6, marginBottom: 18 }}>{v.details}</p>
          <InfoGrid items={[["Violation ID", <span className="ix-mono" key="a">{v.id}</span>], ["Rule", v.ruleName], ["Type", v.type], ["Severity", <StatusBadge key="s" status={v.severity} />], ["Detected", fmtDateTime(v.createdAt)], ["Status", <StatusBadge key="st" status={v.status} />]]} /></Card>
        <Card title="Trade"><InfoGrid items={trade ? [
          ["Trade ID", <IdLink key="t" href={`/trades/${trade.id}`}>{trade.id}</IdLink>], ["Symbol", trade.symbol], ["Side", <StatusBadge key="sd" status={trade.side} />], ["Volume", trade.volume.toFixed(2)],
          ["Opened", fmtDateTime(trade.openTime)], ["Closed", fmtDateTime(trade.closeTime)], ["Profit / Loss", <span key="p" className={trade.profit >= 0 ? "pos" : "neg"}>{signedMoney(trade.profit)}</span>],
        ] : [["Trade", "Not found"]]} /></Card>
        <Card title="User"><InfoGrid items={[["User ID", <UserLink key="u" id={v.userId} />], ["Name", user?.name ?? "—"], ["Account status", user ? <StatusBadge key="as" status={user.accountStatus} /> : "—"], ["Other violations", history.length ? history.map((h) => <span key={h.id} style={{ marginRight: 8 }}><IdLink href={`/risk/violations/${h.id}`}>{h.id}</IdLink></span>) : "None"]]} /></Card>
        <Card title="Rule configuration"><InfoGrid items={rule ? [["Rule", rule.name], ["Rule status", <StatusBadge key="r" status={rule.status} />], ["Parameters", <span className="ix-mono" key="p">{Object.entries(rule.params).map(([k, val]) => `${k}=${val}`).join(", ") || "—"}</span>], ["Description", rule.description]] : [["Rule", "Deleted"]]} /></Card>
      </div>
    </>
  );
}
