export type TabDef = { id: string; label: string; count?: number };
export default function Tabs({ tabs, active, onChange }: { tabs: TabDef[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="ix-tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={active === t.id} className={`ix-tab ${active === t.id ? "on" : ""}`} onClick={() => onChange(t.id)}>
          {t.label}{t.count !== undefined && <span className="ct">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
