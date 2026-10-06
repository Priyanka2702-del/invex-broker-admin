"use client";
/** Local state for the secondary admin modules (copy trading, PAM, account types, media, promotions, notifications, admins). Swap for API calls later. */
import React, { createContext, useContext, useState } from "react";
import * as x from "@/data/extras";
import { useAdminData } from "@/context/AdminDataContext";
import { NOW, iso } from "@/lib/format";

type Crud<T> = { list: T[]; add: (v: Omit<T, "id">) => T; update: (id: string, p: Partial<T>) => void; remove: (id: string) => void };
function useCrud<T extends { id: string }>(seed: T[], prefix: string, module: string, noun: (v: Partial<T>) => string): Crud<T> {
  const { log, toast } = useAdminData();
  const [list, setList] = useState<T[]>(seed);
  const next = () => `${prefix}-${String(Math.max(0, ...list.map((l) => parseInt(l.id.split("-")[1], 10) || 0)) + 1).padStart(2, "0")}`;
  return {
    list,
    add: (v) => { const item = { ...v, id: next() } as T; setList((l) => [item, ...l]); log(`${module} created`, module, `${noun(item)} created`); toast(`${noun(item)} created`); return item; },
    update: (id, p) => { setList((l) => l.map((i) => (i.id === id ? { ...i, ...p } : i))); log(`${module} updated`, module, `${noun(list.find((i) => i.id === id) ?? {})} updated`); toast("Changes saved"); },
    remove: (id) => { const it = list.find((i) => i.id === id); setList((l) => l.filter((i) => i.id !== id)); log(`${module} deleted`, module, `${noun(it ?? {})} deleted`); toast("Deleted", "warn"); },
  };
}
interface Extras {
  copy: x.CopyInvestment[]; copySettings: typeof x.copySettingsSeed; saveCopySettings: (s: typeof x.copySettingsSeed) => void;
  pam: x.PamClient[]; pamSettings: typeof x.pamSettingsSeed; savePamSettings: (s: typeof x.pamSettingsSeed) => void;
  accountTypes: typeof x.accountTypeSeed; saveAccountType: (k: x.AccountTypeKey, v: { perLot: number; leverage: string }) => void;
  templates: Crud<x.Template>; promotions: Crud<x.Promotion>; notifications: Crud<x.AdminNotification>; admins: Crud<x.AdminUser>; roles: Crud<x.Role>;
  systemSettings: typeof x.systemSettingsSeed; saveSystemSettings: (s: typeof x.systemSettingsSeed) => void;
  linkStatus: Record<string, "Active" | "Disabled">; toggleLink: (id: string) => void;
}
const Ctx = createContext<Extras | undefined>(undefined);
export function AdminExtrasProvider({ children }: { children: React.ReactNode }) {
  const { log, toast } = useAdminData();
  const [copySettings, setCopy] = useState(x.copySettingsSeed);
  const [pamSettings, setPam] = useState(x.pamSettingsSeed);
  const [accountTypes, setAcc] = useState(x.accountTypeSeed);
  const [systemSettings, setSys] = useState(x.systemSettingsSeed);
  const [linkStatus, setLinks] = useState<Record<string, "Active" | "Disabled">>({});
  const templates = useCrud(x.templates, "TPL", "Templates", (v) => `Template “${v.name ?? ""}”`);
  const promotions = useCrud(x.promotions, "PRM", "Promotions", (v) => `Promotion “${v.name ?? ""}”`);
  const notifications = useCrud(x.notifications, "NTF", "Notifications", (v) => `Notification “${v.title ?? ""}”`);
  const admins = useCrud(x.adminUsers, "ADM", "Admin Settings", (v) => `Admin ${v.name ?? ""}`);
  const roles = useCrud(x.roles, "ROLE", "Admin Settings", (v) => `Role “${v.name ?? ""}”`);
  const value: Extras = {
    copy: x.copyInvestments, copySettings, pam: x.pamClients, pamSettings, accountTypes, systemSettings, linkStatus,
    templates, promotions, notifications, admins, roles,
    saveCopySettings: (s) => { setCopy(s); log("Settings changed", "Copy Trading", `Profit cut ${s.profitCut === "custom" ? s.customCut : s.profitCut}%, lock-in ${s.lockInDays}d, ${s.settlementCycle} settlement`); toast("Copy Trading settings saved"); },
    savePamSettings: (s) => { setPam(s); log("Settings changed", "PAM Accounts", `Profit ${s.profitPercentage}%, monthly return ${s.monthlyReturn}%`); toast("PAM settings saved"); },
    saveAccountType: (k, v) => { setAcc((a) => ({ ...a, [k]: { ...a[k], ...v } })); log("Account type updated", "Account Management", `${accountTypes[k].name}: $${v.perLot} per lot, leverage ${v.leverage}`); toast(`${accountTypes[k].name} saved`); },
    saveSystemSettings: (s) => { setSys(s); log("Settings changed", "Admin Settings", "System settings updated"); toast("System settings saved"); },
    toggleLink: (id) => setLinks((l) => { const n = (l[id] ?? "Active") === "Active" ? "Disabled" : "Active"; log("Link status changed", "Affiliate / Links", `${id} ${n.toLowerCase()}`); toast(`Link ${n.toLowerCase()}`, n === "Active" ? "ok" : "warn"); return { ...l, [id]: n }; }),
  };
  void NOW; void iso;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useExtras = () => { const c = useContext(Ctx); if (!c) throw new Error("useExtras outside provider"); return c; };
