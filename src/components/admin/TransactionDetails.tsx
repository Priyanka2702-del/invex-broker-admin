"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, InfoGrid, NotFoundCard, UserLink } from "./ui";
import StatusBadge from "./StatusBadge";
import ConfirmationModal from "./ConfirmationModal";
import { useAdminData } from "@/context/AdminDataContext";
import { fmtDateTime, money } from "@/lib/format";

export default function TransactionDetails({ kind, id }: { kind: "deposit" | "withdrawal"; id: string }) {
  const d = useAdminData();
  const router = useRouter();
  const [act, setAct] = useState<"" | "approve" | "reject">("");
  const dep = kind === "deposit";
  const tx = (dep ? d.deposits : d.withdrawals).find((x) => x.id === id);
  const base = dep ? "/deposits" : "/withdrawals";
  if (!tx) return <NotFoundCard what={`${dep ? "Deposit" : "Withdrawal"} ${id}`} backHref={base} />;
  const user = d.users.find((u) => u.id === tx.userId);
  const review = dep ? d.reviewDeposit : d.reviewWithdrawal;
  const dest: string | undefined = "destination" in tx ? (tx.destination as string) : undefined;
  return (
    <>
      <button className="ix-back" onClick={() => router.push(base)}><i className="ti ti-arrow-left" />Back to {dep ? "deposits" : "withdrawals"}</button>
      <div className="ix-card" style={{ marginBottom: 18 }}>
        <div className="ix-hero">
          <div className="big-av"><i className={`ti ${dep ? "ti-arrow-bar-to-down" : "ti-arrow-bar-to-up"}`} /></div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="ix-row"><h1 style={{ fontSize: 22, fontWeight: 700 }}>{money(tx.amount)}</h1><StatusBadge status={tx.status} /></div>
            <div style={{ color: "var(--ix-muted)", fontSize: 13.5, marginTop: 4 }}><b className="ix-mono">{tx.id}</b> · {tx.method} · {fmtDateTime(tx.createdAt)}</div>
          </div>
          {tx.status === "Pending" && (
            <div className="ix-row">
              <button className="ix-btn ix-btn-ok" onClick={() => setAct("approve")}><i className="ti ti-check" />Approve</button>
              <button className="ix-btn ix-btn-danger" onClick={() => setAct("reject")}><i className="ti ti-x" />Reject</button>
            </div>
          )}
        </div>
      </div>
      <div className="ix-grid c2">
        <Card title="Transaction information"><InfoGrid items={[
          [`${dep ? "Deposit" : "Withdrawal"} ID`, <span className="ix-mono" key="a">{tx.id}</span>], ["Amount", money(tx.amount)], ["Payment method", tx.method],
          ["Transaction ID", <span className="ix-mono" key="t">{tx.txId}</span>], ...(dest ? [["Destination", <span className="ix-mono" key="d">{dest}</span>] as [string, React.ReactNode]] : []),
          ["Status", <StatusBadge key="s" status={tx.status} />], ["Requested", fmtDateTime(tx.createdAt)], ["Processed", fmtDateTime(tx.processedAt)],
          ["Processed by", tx.processedBy ?? "—"], ["Admin note", tx.note ?? "—"],
        ]} /></Card>
        <Card title="User information" action={<UserLink id={tx.userId} name="Open profile →" />}><InfoGrid items={[
          ["User ID", <UserLink key="u" id={tx.userId} />], ["Name", user?.name ?? "—"], ["Email", user?.email ?? "—"], ["Trading account", user?.accountId ?? "—"],
          ["Wallet balance", user ? money(user.balance) : "—"], ["KYC", user ? <StatusBadge key="k" status={user.kycStatus} /> : "—"], ["Account status", user ? <StatusBadge key="a" status={user.accountStatus} /> : "—"],
        ]} /></Card>
        <Card title="Timeline">
          <div className="ix-timeline">
            <div className="it"><span className="dot" /><div>{dep ? "Deposit submitted" : "Withdrawal requested"}<small>{fmtDateTime(tx.createdAt)}</small></div></div>
            {tx.processedAt ? <div className="it"><span className="dot" style={{ background: tx.status === "Successful" ? "var(--ix-green)" : "var(--ix-red)", boxShadow: "none" }} /><div>{tx.status === "Successful" ? "Approved" : "Rejected"} by {tx.processedBy}<small>{fmtDateTime(tx.processedAt)}</small></div></div>
              : <div className="it"><span className="dot" style={{ background: "var(--ix-amber)", boxShadow: "none" }} /><div>Awaiting admin review<small>—</small></div></div>}
          </div>
        </Card>
      </div>
      {act && <ConfirmationModal title={act === "approve" ? "Approve transaction?" : "Reject transaction?"} tone={act === "approve" ? "ok" : "danger"} confirmLabel={act === "approve" ? "Approve" : "Reject"}
        message={<>{act === "approve" ? (dep ? "The amount will be credited to the client wallet." : "The withdrawal will be marked as paid out.") : (dep ? "The deposit will be declined." : "The held amount will be returned to the client wallet.")} <b>{money(tx.amount)}</b> · {tx.id}</>}
        onConfirm={() => review(tx.id, act === "approve" ? "Successful" : "Rejected", act === "reject" ? "Rejected by admin" : undefined)} onClose={() => setAct("")} />}
    </>
  );
}
