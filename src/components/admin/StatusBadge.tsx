const TONES: Record<string, string> = {
  Successful: "green", Approved: "green", Active: "green", Enabled: "green", Closed: "slate", Cleared: "slate",
  Pending: "amber", Warned: "amber", Suspended: "amber", Medium: "amber",
  Rejected: "red", Banned: "red", Critical: "red", High: "orange",
  Open: "blue", Unverified: "slate", Inactive: "slate", Disabled: "slate", Low: "slate", BUY: "green", SELL: "red",
};
export default function StatusBadge({ status, tone }: { status: string; tone?: string }) {
  return <span className={`ix-badge ${tone ?? TONES[status] ?? "slate"}`}>{status}</span>;
}
