"use client";
import { useState } from "react";
import { Modal } from "./ConfirmationModal";
import { RULE_TYPES } from "@/data/rules";
import { useAdminData } from "@/context/AdminDataContext";
import type { Rule, RuleType, Severity } from "@/types/admin";

export default function CreateRuleModal({ initial, onClose }: { initial?: Rule; onClose: () => void }) {
  const { addRule, updateRule } = useAdminData();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<RuleType>(initial?.type ?? "scalping");
  const [severity, setSeverity] = useState<Severity>(initial?.severity ?? "Medium");
  const [status, setStatus] = useState<Rule["status"]>(initial?.status ?? "Enabled");
  const [params, setParams] = useState<[string, string][]>(Object.entries(initial?.params ?? RULE_TYPES[0].defaults).map(([k, v]) => [k, String(v)]));
  const valid = name.trim().length >= 3;
  const changeType = (t: RuleType) => {
    setType(t);
    if (!initial) setParams(Object.entries(RULE_TYPES.find((x) => x.value === t)!.defaults).map(([k, v]) => [k, String(v)]));
  };
  const submit = () => {
    const obj: Rule["params"] = {};
    params.filter(([k]) => k.trim()).forEach(([k, v]) => { obj[k.trim()] = v !== "" && !isNaN(Number(v)) ? Number(v) : v; });
    const payload = { name: name.trim(), description: description.trim(), type, severity, status, params: obj };
    if (initial) updateRule(initial.id, payload); else addRule(payload);
    onClose();
  };
  return (
    <Modal wide title={initial ? "Edit rule" : "Create rule"} onClose={onClose} footer={<>
      <button className="ix-btn ix-btn-outline" onClick={onClose}>Cancel</button>
      <button className="ix-btn ix-btn-primary" disabled={!valid} onClick={submit}>{initial ? "Save changes" : "Create rule"}</button></>}>
      <div className="ix-field"><label>Rule name</label><input className="ix-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Scalping Not Allowed" autoFocus /></div>
      <div className="ix-field"><label>Description</label><textarea className="ix-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this rule check?" /></div>
      <div className="ix-grid c3" style={{ marginTop: 0 }}>
        <div className="ix-field"><label>Rule type</label><select className="ix-select" value={type} onChange={(e) => changeType(e.target.value as RuleType)}>{RULE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
        <div className="ix-field"><label>Severity</label><select className="ix-select" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>{["Low", "Medium", "High", "Critical"].map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="ix-field"><label>Status</label><select className="ix-select" value={status} onChange={(e) => setStatus(e.target.value as Rule["status"])}><option>Enabled</option><option>Disabled</option></select></div>
      </div>
      <div className="ix-field">
        <label>Parameters <span style={{ fontWeight: 400, color: "var(--ix-muted)" }}>— key / value pairs passed to the rule engine</span></label>
        {params.map(([k, v], i) => (
          <div key={i} className="ix-row" style={{ flexWrap: "nowrap" }}>
            <input className="ix-input" style={{ flex: 1 }} value={k} placeholder="key" onChange={(e) => setParams((p) => p.map((r, j) => (j === i ? [e.target.value, r[1]] : r)))} aria-label="Parameter key" />
            <input className="ix-input" style={{ flex: 1 }} value={v} placeholder="value" onChange={(e) => setParams((p) => p.map((r, j) => (j === i ? [r[0], e.target.value] : r)))} aria-label="Parameter value" />
            <button type="button" className="ix-icon-btn" style={{ width: 38, height: 38 }} onClick={() => setParams((p) => p.filter((_, j) => j !== i))} aria-label="Remove parameter"><i className="ti ti-trash" /></button>
          </div>
        ))}
        <div><button type="button" className="ix-btn ix-btn-sm ix-btn-soft" onClick={() => setParams((p) => [...p, ["", ""]])}><i className="ti ti-plus" />Add parameter</button></div>
      </div>
    </Modal>
  );
}
