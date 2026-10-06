export type StatCardProps = {
  label: string; value: string; icon: string; tone?: "blue" | "green" | "amber" | "red";
  delta?: number; note?: string;
};
export default function StatCard({ label, value, icon, tone = "blue", delta, note }: StatCardProps) {
  return (
    <div className="ix-card ix-stat">
      <div className={`ic ${tone === "blue" ? "" : tone}`}><i className={`ti ${icon}`} /></div>
      <div style={{ minWidth: 0 }}>
        <div className="l">{label}</div>
        <div className="v">{value}</div>
        {delta !== undefined ? (
          <span className={`d ${delta >= 0 ? "up" : "dn"}`}><i className={`ti ${delta >= 0 ? "ti-trending-up" : "ti-trending-down"}`} />{Math.abs(delta).toFixed(1)}% <span style={{ color: "var(--ix-muted)", fontWeight: 500 }}>vs prev.</span></span>
        ) : note ? <span className="d nt">{note}</span> : null}
      </div>
    </div>
  );
}
