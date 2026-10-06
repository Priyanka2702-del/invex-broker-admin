"use client";
import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import { Card, NotFoundCard, PageHeader } from "@/components/admin/ui";
import { useExtras } from "@/context/AdminExtrasContext";
import { LEVERAGES, type AccountTypeKey } from "@/data/extras";
import { money, num } from "@/lib/format";

export default function Page({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const { accountTypes, saveAccountType } = useExtras();
  const router = useRouter();
  const a = accountTypes[type as AccountTypeKey];
  const [perLot, setPerLot] = useState(String(a?.perLot ?? 0));
  const [lev, setLev] = useState(a?.leverage ?? "1:100");
  const [confirm, setConfirm] = useState(false);
  if (!a) return <NotFoundCard what="Account type" backHref="/account-management" />;
  const dirty = Number(perLot) !== a.perLot || lev !== a.leverage;
  const valid = perLot !== "" && Number(perLot) >= 0;
  return (
    <>
      <button className="ix-back" onClick={() => router.push("/account-management")}><i className="ti ti-arrow-left" />All account types</button>
      <PageHeader title={a.name} subtitle="Changes here apply to this account type only — other types are not affected." />
      <div className="ix-grid two-one">
        <Card title="Trading conditions">
          <div className="ix-grid c2" style={{ gap: 0 }}>
            <div className="ix-field" style={{ marginTop: 0 }}><label>Separate per lot ($)</label><input type="number" min={0} step="0.1" className="ix-input" value={perLot} onChange={(e) => setPerLot(e.target.value)} /></div>
            <div className="ix-field" style={{ marginTop: 0 }}><label>Leverage</label><select className="ix-select" value={lev} onChange={(e) => setLev(e.target.value)}>{LEVERAGES.map((l) => <option key={l}>{l}</option>)}</select></div>
          </div>
          <div className="ix-row" style={{ marginTop: 22 }}>
            <button className="ix-btn ix-btn-primary" disabled={!dirty || !valid} onClick={() => setConfirm(true)}><i className="ti ti-device-floppy" />Save changes</button>
            <button className="ix-btn ix-btn-outline" disabled={!dirty} onClick={() => { setPerLot(String(a.perLot)); setLev(a.leverage); }}>Reset</button>
            {dirty && <span className="ix-badge amber">Unsaved changes</span>}
          </div>
        </Card>
        <Card title="Current configuration">
          <div className="ix-stack" style={{ gap: 0 }}>
            <div className="ix-row" style={{ justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #eef2f8" }}><span>Separate per lot</span><b>{money(a.perLot)}</b></div>
            <div className="ix-row" style={{ justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #eef2f8" }}><span>Leverage</span><b>{a.leverage}</b></div>
            <div className="ix-row" style={{ justifyContent: "space-between", padding: "9px 0" }}><span>Open accounts</span><b>{num(a.accounts)}</b></div>
          </div>
          <div style={{ marginTop: 14 }} className="ix-row">{(Object.keys(accountTypes) as AccountTypeKey[]).filter((k) => k !== type).map((k) => <Link key={k} href={`/account-management/${k}`} className="ix-btn ix-btn-sm ix-btn-outline">{accountTypes[k].name.replace(" Account", "")}</Link>)}</div>
        </Card>
      </div>
      {confirm && <ConfirmationModal title={`Update ${a.name}?`} confirmLabel="Save" message={<>Separate per lot <b>{money(a.perLot)} → {money(Number(perLot))}</b>, leverage <b>{a.leverage} → {lev}</b>. Only {a.name} is changed.</>} onConfirm={() => saveAccountType(type as AccountTypeKey, { perLot: Number(perLot), leverage: lev })} onClose={() => setConfirm(false)} />}
    </>
  );
}
