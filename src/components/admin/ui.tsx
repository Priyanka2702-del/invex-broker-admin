import Link from "next/link";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="ix-ph">
      <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      {actions && <div className="ix-row">{actions}</div>}
    </div>
  );
}
export function Card({ title, subtitle, action, children, flush }: { title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; flush?: boolean }) {
  return (
    <section className="ix-card">
      {title && <div className="ix-card-h"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</div>}
      <div className={flush ? "" : "ix-card-b"} style={flush ? { paddingTop: 10 } : undefined}>{children}</div>
    </section>
  );
}
export function InfoGrid({ items }: { items: [string, React.ReactNode][] }) {
  return <div className="ix-info">{items.map(([k, v]) => <div key={k}><div className="k">{k}</div><div className="v">{v}</div></div>)}</div>;
}
export function UserLink({ id, name }: { id: string; name?: string }) {
  return <Link href={`/users/${id}`} className="ix-link-id ix-mono" onClick={(e) => e.stopPropagation()}>{name ?? id}</Link>;
}
export function IdLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="ix-link-id ix-mono" onClick={(e) => e.stopPropagation()}>{children}</Link>;
}
export function Avatar({ name }: { name: string }) {
  return <span className="av">{name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>;
}
export function NotFoundCard({ what, backHref }: { what: string; backHref: string }) {
  return (
    <div className="ix-card"><div className="ix-empty"><i className="ti ti-search-off" />{what} not found.<br /><Link href={backHref} className="ix-btn ix-btn-soft" style={{ marginTop: 14 }}>Go back</Link></div></div>
  );
}
