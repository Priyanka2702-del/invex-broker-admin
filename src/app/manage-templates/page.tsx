"use client";
import { useMemo, useRef, useState } from "react";
import ConfirmationModal, { Modal } from "@/components/admin/ConfirmationModal";
import FilterDropdown from "@/components/admin/FilterDropdown";
import SearchBar from "@/components/admin/SearchBar";
import StatusBadge from "@/components/admin/StatusBadge";
import { PageHeader } from "@/components/admin/ui";
import { useExtras } from "@/context/AdminExtrasContext";
import { TEMPLATE_TYPES, type Template } from "@/data/extras";
import { fmtDate } from "@/lib/format";

function Preview({ t, h = 150 }: { t: Template; h?: number }) {
  return t.url
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={t.url} alt={t.name} style={{ width: "100%", height: h, objectFit: "cover", display: "block" }} />
    : <div style={{ height: h, background: `linear-gradient(135deg, hsl(${t.hue} 85% 94%), hsl(${t.hue} 80% 82%))`, display: "flex", alignItems: "center", justifyContent: "center", color: `hsl(${t.hue} 60% 38%)`, fontWeight: 700, padding: 14, textAlign: "center" }}>{t.text || t.name}</div>;
}
export default function ManageTemplatesPage() {
  const { templates } = useExtras();
  const [q, setQ] = useState(""); const [type, setType] = useState(""); const [status, setStatus] = useState("");
  const [edit, setEdit] = useState<Template | "new" | null>(null);
  const [del, setDel] = useState<Template | null>(null);
  const list = useMemo(() => templates.list.filter((t) => (!q || `${t.name} ${t.text}`.toLowerCase().includes(q.toLowerCase())) && (!type || t.type === type) && (!status || t.status === status)), [templates.list, q, type, status]);
  return (
    <>
      <PageHeader title="Manage Templates" subtitle="Central media library for promotional images, banners, graphics and website/app media." actions={<button className="ix-btn ix-btn-primary" onClick={() => setEdit("new")}><i className="ti ti-upload" />Upload media</button>} />
      <div className="ix-card" style={{ marginBottom: 18 }}>
        <div className="ix-toolbar" style={{ borderBottom: 0 }}>
          <SearchBar value={q} onChange={setQ} placeholder="Search media…" />
          <FilterDropdown label="Type" value={type} options={[...TEMPLATE_TYPES]} onChange={setType} />
          <FilterDropdown label="Status" value={status} options={["Published", "Draft"]} onChange={setStatus} />
          <span className="ix-spacer" /><span style={{ fontSize: 13, color: "var(--ix-muted)" }}>{list.length} items</span>
        </div>
      </div>
      {list.length === 0 && <div className="ix-card"><div className="ix-empty"><i className="ti ti-photo-off" />No media match your filters</div></div>}
      <div className="ix-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
        {list.map((t) => (
          <div key={t.id} className="ix-card" style={{ overflow: "hidden" }}>
            <Preview t={t} />
            <div style={{ padding: 16 }}>
              <div className="ix-row" style={{ justifyContent: "space-between", flexWrap: "nowrap" }}><b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</b><StatusBadge status={t.status} tone={t.status === "Published" ? "green" : "slate"} /></div>
              <div style={{ fontSize: 12.5, color: "var(--ix-muted)", margin: "4px 0 12px" }}>{t.type} · {fmtDate(t.createdAt)}</div>
              <div className="ix-act"><button className="ix-btn ix-btn-sm ix-btn-soft" onClick={() => setEdit(t)}><i className="ti ti-pencil" />Edit</button><button className="ix-btn ix-btn-sm ix-btn-danger" onClick={() => setDel(t)}><i className="ti ti-trash" />Delete</button></div>
            </div>
          </div>
        ))}
      </div>
      {edit && <TemplateModal initial={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} />}
      {del && <ConfirmationModal title="Delete this media?" tone="danger" confirmLabel="Delete" message={<>“{del.name}” will be removed from the library.</>} onConfirm={() => templates.remove(del.id)} onClose={() => setDel(null)} />}
    </>
  );
}
function TemplateModal({ initial, onClose }: { initial?: Template; onClose: () => void }) {
  const { templates } = useExtras();
  const [name, setName] = useState(initial?.name ?? ""); const [type, setType] = useState<Template["type"]>(initial?.type ?? "Promotional Image");
  const [text, setText] = useState(initial?.text ?? ""); const [status, setStatus] = useState<Template["status"]>(initial?.status ?? "Draft");
  const [url, setUrl] = useState(initial?.url); const file = useRef<HTMLInputElement>(null);
  const draft: Template = { id: initial?.id ?? "", name, type, text, status, url, createdAt: initial?.createdAt ?? "", hue: initial?.hue ?? 215 };
  const save = () => { if (initial) templates.update(initial.id, { name, type, text, status, url }); else templates.add({ name, type, text, status, url, createdAt: new Date("2026-09-30T13:00:00Z").toISOString(), hue: 210 + (name.length % 40) }); onClose(); };
  return (
    <Modal wide title={initial ? "Edit media" : "Upload media"} onClose={onClose} footer={<><button className="ix-btn ix-btn-outline" onClick={onClose}>Cancel</button><button className="ix-btn ix-btn-primary" disabled={name.trim().length < 2} onClick={save}>{initial ? "Save changes" : "Upload"}</button></>}>
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--ix-border)" }}><Preview t={draft} h={140} /></div>
      <div className="ix-row" style={{ marginTop: 10 }}>
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { setUrl(URL.createObjectURL(f)); if (!name) setName(f.name.replace(/\.[^.]+$/, "")); } }} />
        <button className="ix-btn ix-btn-sm ix-btn-soft" onClick={() => file.current?.click()}><i className="ti ti-upload" />{url ? "Replace image" : "Choose image"}</button>
        {url && <button className="ix-btn ix-btn-sm ix-btn-outline" onClick={() => setUrl(undefined)}>Remove image</button>}
      </div>
      <div className="ix-field"><label>Name</label><input className="ix-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="ix-grid c2" style={{ gap: 0 }}>
        <div className="ix-field"><label>Type</label><select className="ix-select" value={type} onChange={(e) => setType(e.target.value as Template["type"])}>{TEMPLATE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div className="ix-field"><label>Status</label><select className="ix-select" value={status} onChange={(e) => setStatus(e.target.value as Template["status"])}><option>Published</option><option>Draft</option></select></div>
      </div>
      <div className="ix-field"><label>Associated text</label><textarea className="ix-textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Headline / caption shown with this media" /></div>
    </Modal>
  );
}
