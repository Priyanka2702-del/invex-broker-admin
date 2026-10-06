"use client";
import { useState } from "react";
import { Modal } from "./ConfirmationModal";
import { useAdminData } from "@/context/AdminDataContext";
import type { SystemRank } from "@/types/admin";

export default function CreateRankModal({ initial, onClose }: { initial?: SystemRank; onClose: () => void }) {
  const { addRank, updateRank } = useAdminData();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<SystemRank["status"]>(initial?.status ?? "Active");
  const submit = () => {
    const p = { name: name.trim(), description: description.trim(), status };
    if (initial) updateRank(initial.id, p); else addRank(p);
    onClose();
  };
  return (
    <Modal title={initial ? "Edit system rank" : "Create system rank"} onClose={onClose} footer={<>
      <button className="ix-btn ix-btn-outline" onClick={onClose}>Cancel</button>
      <button className="ix-btn ix-btn-primary" disabled={name.trim().length < 2} onClick={submit}>{initial ? "Save changes" : "Create rank"}</button></>}>
      <div className="ix-field"><label>Rank name</label><input className="ix-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Define your own rank name" /></div>
      <div className="ix-field"><label>Description</label><textarea className="ix-textarea" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="ix-field"><label>Status</label><select className="ix-select" value={status} onChange={(e) => setStatus(e.target.value as SystemRank["status"])}><option>Active</option><option>Inactive</option></select></div>
    </Modal>
  );
}
