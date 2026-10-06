"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmationModal from "./ConfirmationModal";
import { useAdminData } from "@/context/AdminDataContext";
import type { Violation } from "@/types/admin";

/** Warn / Ban / Clear / View Trade / View User for a violation. `compact` renders icon-only buttons for table rows. */
export default function ViolationActions({ v, compact }: { v: Violation; compact?: boolean }) {
  const d = useAdminData();
  const router = useRouter();
  const [dlg, setDlg] = useState<"" | "warn" | "ban" | "clear">("");
  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
  const closed = v.status === "Banned";
  const btn = (cls: string, icon: string, label: string, fn: () => void, disabled = false) => (
    <button className={`ix-btn ix-btn-sm ${cls}`} onClick={stop(fn)} disabled={disabled} title={label} aria-label={label}><i className={`ti ${icon}`} />{!compact && label}</button>
  );
  return (
    <>
      <div className="ix-act" style={{ flexWrap: "wrap" }}>
        {btn("ix-btn-warn", "ti-alert-triangle", "Warn User", () => setDlg("warn"), closed || v.status === "Warned")}
        {btn("ix-btn-danger", "ti-ban", "Ban User", () => setDlg("ban"), closed)}
        {btn("ix-btn-ok", "ti-circle-check", "Clear Violation", () => setDlg("clear"), v.status === "Cleared")}
        {btn("ix-btn-outline", "ti-chart-candle", "View Trade", () => router.push(`/trades/${v.tradeId}`))}
        {btn("ix-btn-outline", "ti-user", "View User", () => router.push(`/users/${v.userId}`))}
      </div>
      {dlg === "warn" && <ConfirmationModal title="Warn user?" tone="warn" confirmLabel="Send warning" message={<>A warning for <b>{v.type}</b> ({v.id}) will be sent to user <b>{v.userId}</b>.</>} onConfirm={() => d.setViolationStatus(v.id, "Warned")} onClose={() => setDlg("")} />}
      {dlg === "ban" && <ConfirmationModal title="Ban user?" tone="danger" confirmLabel="Ban user" message={<>User <b>{v.userId}</b> will be banned for <b>{v.type}</b> ({v.id}). Trading and withdrawals are blocked.</>} onConfirm={() => d.setViolationStatus(v.id, "Banned")} onClose={() => setDlg("")} />}
      {dlg === "clear" && <ConfirmationModal title="Clear violation?" tone="ok" confirmLabel="Mark as cleared" message={<>{v.id} will be marked <b>Cleared</b> — no further action against the user.</>} onConfirm={() => d.setViolationStatus(v.id, "Cleared")} onClose={() => setDlg("")} />}
    </>
  );
}
