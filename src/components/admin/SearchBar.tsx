export default function SearchBar({ value, onChange, placeholder = "Search…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="ix-search">
      <i className="ti ti-search" />
      <input className="ix-input" value={value} placeholder={placeholder} aria-label="Search" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
