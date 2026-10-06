"use client";
import { downloadCsv } from "@/lib/format";
import { useAdminData } from "@/context/AdminDataContext";

export default function ExportButton({ name, rows }: { name: string; rows: Record<string, string | number>[] }) {
  const { toast } = useAdminData();
  return (
    <button type="button" className="ix-btn ix-btn-outline" disabled={!rows.length}
      onClick={() => { downloadCsv(name, rows); toast(`Exported ${rows.length} rows to CSV`); }}>
      <i className="ti ti-download" />Export CSV
    </button>
  );
}
