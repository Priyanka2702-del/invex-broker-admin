export default function DateFilter({ from, to, onChange, label = "Date" }: { from: string; to: string; onChange: (from: string, to: string) => void; label?: string }) {
  return (
    <div className="ix-fl">
      <span>{label}</span>
      <input type="date" className="ix-input" value={from} aria-label={`${label} from`} onChange={(e) => onChange(e.target.value, to)} />
      <span>–</span>
      <input type="date" className="ix-input" value={to} aria-label={`${label} to`} onChange={(e) => onChange(from, e.target.value)} />
    </div>
  );
}
