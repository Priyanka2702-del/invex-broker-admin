export default function FilterDropdown({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select className="ix-select" value={value} aria-label={label} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}: All</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
