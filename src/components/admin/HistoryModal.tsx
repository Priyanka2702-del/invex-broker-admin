"use client";
import { Modal } from "./ConfirmationModal";
import { UserLink } from "./ui";
import { fmtDateTime, money } from "@/lib/format";
import type { HistoryEvent } from "@/data/extras";

export default function HistoryModal({ title, userId, userName, events, onClose }: { title: string; userId: string; userName: string; events: HistoryEvent[]; onClose: () => void }) {
  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ marginBottom: 14 }}><b>{userName}</b> · <UserLink id={userId} /></div>
      <div className="ix-timeline">
        {events.map((e, i) => (
          <div className="it" key={i}><span className="dot" /><div style={{ flex: 1 }}><div className="ix-row" style={{ justifyContent: "space-between" }}><b>{e.type}</b><b>{money(e.amount, 0)}</b></div><small>{fmtDateTime(e.date)}</small></div></div>
        ))}
      </div>
    </Modal>
  );
}
