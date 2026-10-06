"use client";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { useExtras } from "@/context/AdminExtrasContext";
import { type AccountTypeKey } from "@/data/extras";
import { money, num } from "@/lib/format";

const ICONS: Record<AccountTypeKey, string> = { standard: "ti-user-circle", zero: "ti-circle-dashed", ecn: "ti-topology-star-3", cent: "ti-coin-bitcoin" };
export default function AccountManagementPage() {
  const { accountTypes } = useExtras();
  return (
    <>
      <PageHeader title="Account Management" subtitle="Choose an account type to manage its separate per-lot charge and leverage. Each type is configured independently." />
      <div className="ix-grid c4">
        {(Object.keys(accountTypes) as AccountTypeKey[]).map((k) => {
          const a = accountTypes[k];
          return (
            <Link key={k} href={`/account-management/${k}`} className="ix-card ix-stat" style={{ flexDirection: "column", gap: 14 }}>
              <div className="ic"><i className={`ti ${ICONS[k]}`} /></div>
              <div><div style={{ fontSize: 17, fontWeight: 700 }}>{a.name}</div><div className="l" style={{ marginTop: 4 }}>{a.blurb}</div></div>
              <div className="ix-row" style={{ justifyContent: "space-between", width: "100%", fontSize: 13 }}><span>Separate per lot</span><b>{money(a.perLot)}</b></div>
              <div className="ix-row" style={{ justifyContent: "space-between", width: "100%", fontSize: 13 }}><span>Leverage</span><b>{a.leverage}</b></div>
              <div className="ix-row" style={{ justifyContent: "space-between", width: "100%", fontSize: 13 }}><span>Accounts</span><b>{num(a.accounts)}</b></div>
              <span className="ix-btn ix-btn-soft" style={{ width: "100%" }}>Manage <i className="ti ti-arrow-right" /></span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
