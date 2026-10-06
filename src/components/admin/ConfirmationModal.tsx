"use client";
import { useEffect } from "react";

export function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="ix-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`ix-modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="ix-modal-h"><h3>{title}</h3><button className="ix-icon-btn" style={{ width: 34, height: 34 }} onClick={onClose} aria-label="Close"><i className="ti ti-x" /></button></div>
        <div className="ix-modal-b">{children}</div>
        {footer && <div className="ix-modal-f">{footer}</div>}
      </div>
    </div>
  );
}
export default function ConfirmationModal({ title, message, confirmLabel = "Confirm", tone = "primary", onConfirm, onClose }: {
  title: string; message: React.ReactNode; confirmLabel?: string; tone?: "primary" | "warn" | "danger" | "ok"; onConfirm: () => void; onClose: () => void;
}) {
  const cls = { primary: "ix-btn-primary", warn: "ix-btn-warn", danger: "ix-btn-danger", ok: "ix-btn-ok" }[tone];
  return (
    <Modal title={title} onClose={onClose} footer={<>
      <button className="ix-btn ix-btn-outline" onClick={onClose}>Cancel</button>
      <button className={`ix-btn ${cls}`} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
    </>}>{message}</Modal>
  );
}
