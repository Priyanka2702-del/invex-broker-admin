"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function Reports() {
  const { admin, loading: authLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<"pnl" | "tx">("pnl");
  const [serverFilter, setServerFilter] = useState("All Servers");
  const [isExporting, setIsExporting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [transactions, setTransactions] = useState<any[]>([]);
  const [pnlData, setPnlData] = useState<any[]>([]);
  const [poolAccounting, setPoolAccounting] = useState<any[]>([]);
  const [poolDetails, setPoolDetails] = useState<any[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [pammTotals, setPammTotals] = useState<any>({});
  const [reconciliation, setReconciliation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!admin) return;
    fetchReports();
  }, [admin, authLoading]);

  const money = (value: number) =>
    `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fetchReports = async () => {
    try {
      const [res, accountingRes, integrityRes] = await Promise.all([
        api.get(`/admin/reports`),
        api.get(`/admin/pamm/accounting`).catch(() => ({ data: { pools: [] } })),
        api.get(`/admin/pamm/integrity`).catch(() => ({ data: { pools: [] } })),
      ]);
      setTransactions(res.data.transactions || []);
      setPnlData(res.data.pnl || []);
      const reportPools = res.data.poolAccounting || [];
      const accountingPools = (accountingRes.data?.pools || []).map((row: any) => ({
        ...(row.accounting || {}),
        poolId: row.pool?._id,
        poolName: row.pool?.poolName || 'PAMM pool',
      }));
      setPoolAccounting(reportPools.length ? reportPools : accountingPools);
      setPoolDetails(accountingRes.data?.pools || []);
      setPammTotals(res.data.pammTotals || accountingPools.reduce((totals: any, pool: any) => Object.keys(totals).reduce((next, key) => ({ ...next, [key]: next[key] + Number(pool[key] || 0) }), totals), { totalCapital: 0, managerCapital: 0, investorCapital: 0, realizedPnl: 0, grossRealizedPnl: 0, retainedPnl: 0, pendingDistributionTotal: 0, paidDistributionTotal: 0 }));
      setReconciliation(integrityRes.data?.pools || res.data.reconciliation || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    if (format !== 'csv') return;
    setIsExporting(true);
    
    try {
      const type = activeTab === 'tx' ? 'transactions' : 'pamm-trades';
      const response = await api.get(`/admin/export?type=${type}`, {
        responseType: 'blob', // Important for downloading files
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      
      setToastMessage(`Report downloaded successfully!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (err) {
      console.error("Error exporting:", err);
      setToastMessage(`Error downloading report.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredPnL = pnlData;

  // Stats calculate
  const totalVolume = pnlData.reduce((sum, p) => sum + p.totalVolume, 0);
  const netRevenue = pnlData.reduce((sum, p) => sum + Number(p.distributionFee || 0), 0);
  const realizedPnl = Number(pammTotals.realizedPnl ?? pnlData.reduce((sum, p) => sum + Number(p.profit || 0), 0));
  const totalDepositFlow = transactions.filter(t => t.type === 'Deposit').reduce((sum, t) => sum + t.amount, 0);
  const poolCards = poolDetails.length ? poolDetails.map((row) => ({ ...(row.accounting || {}), poolId: row.pool?._id, poolName: row.pool?.poolName || "PAMM pool" })) : poolAccounting;
  const selectedPool = poolDetails.find((row) => String(row.pool?._id) === String(selectedPoolId));
  const poolTradeCounts = (poolId: string | null) => {
    const record = reconciliation.find((pool) => String(pool.poolId) === String(poolId));
    const openTrades = Number(record?.counts?.openTrades || 0);
    const closedTrades = Number(record?.counts?.closedTrades || 0);
    return { openTrades, totalTrades: openTrades + closedTrades };
  };
  const uniqueInvestorCount = (pool: any) => {
    const ids = new Set(
      (pool?.participants || [])
        .filter((participant: any) => participant.participantType !== "Manager")
        .map((participant: any) => {
          const user = typeof participant.user === "object" ? participant.user : null;
          return String(user?._id || user?.email || participant.user || participant.investment || "");
        })
        .filter(Boolean)
    );
    return ids.size;
  };
  const selectedTradeCounts = poolTradeCounts(selectedPoolId);
  const selectedParticipants = (() => {
    const participants = selectedPool?.accounting?.participants || [];
    const totalCapital = Number(selectedPool?.accounting?.totalCapital || 0);
    const grouped = new Map<string, any>();
    participants.forEach((participant: any) => {
      const isManager = participant.participantType === "Manager";
      const user = typeof participant.user === "object" ? participant.user : null;
      const key = isManager ? "manager" : String(user?._id || user?.email || participant.user || participant.investment);
      const existing = grouped.get(key) || {
        key,
        participantType: participant.participantType,
        name: isManager ? "Pool manager" : user?.name || "Investor",
        email: isManager ? "Base capital" : user?.email || "Investor allocation",
        capital: 0,
        realizedPnl: 0,
      };
      existing.capital += Number(participant.capital || 0);
      existing.realizedPnl += Number(participant.realizedPnl || 0);
      grouped.set(key, existing);
    });
    return Array.from(grouped.values()).map((participant) => ({
      ...participant,
      sharePercentage: totalCapital > 0 ? participant.capital / totalCapital * 100 : 0,
    }));
  })();

  return (
    <div className="screen on" id="sc-admin-reports">
      {!authLoading && !admin && (
        <div className="alert alert-warning mb20">
          <i className="ti ti-alert-triangle"></i>
          Admin session is missing or expired. Sign in again to load reports.
        </div>
      )}

      <div className="ph">
        <div>
          <h1>Financial Reports</h1>
          <p>Extract performance diagnostics, accounting lists, commissions and trading stats.</p>
        </div>
        <div className="fal gap8">
          <button className="btn btn-primary btn-sm" onClick={() => fetchReports()}>
            <i className="ti ti-refresh"></i> Refresh
          </button>
          <button 
            className="btn btn-primary btn-sm" 
            disabled={isExporting} 
            onClick={() => handleExport("csv")}
            style={{ position: "relative", minWidth: "120px" }}
          >
            {isExporting ? (
              <span className="fal gap6"><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> Compiling...</span>
            ) : (
              <span className="fal gap6"><i className="ti ti-download"></i> Export CSV</span>
            )}
          </button>
        </div>
      </div>

      {/* Success alert banner */}
      {showToast && (
        <div className="alert alert-success transition duration-300">
          <i className="ti ti-circle-check"></i>
          <div>{toastMessage}</div>
        </div>
      )}

      {/* Summary grid */}
      <div className="g4 mb20">
        <div className="astat">
          <div className="astat-ic ic-blue"><i className="ti ti-chart-pie"></i></div>
          <div>
            <div className="astat-lbl">Aggregated Volume</div>
            <div className="astat-val">${totalVolume.toLocaleString()}</div>
            <div className="astat-sub">Across all platforms</div>
          </div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-green"><i className="ti ti-trending-up"></i></div>
          <div>
            <div className="astat-lbl">PAMM Net Realized P/L</div>
            <div className="astat-val" style={{ color: realizedPnl >= 0 ? "var(--green)" : "var(--red)" }}>{money(realizedPnl)}</div>
            <div className="astat-sub">Gross trade result less fees</div>
          </div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-purple"><i className="ti ti-network"></i></div>
          <div>
            <div className="astat-lbl">Pending / Paid Profit</div>
            <div className="astat-val">{money(pammTotals.pendingDistributionTotal)} / {money(pammTotals.paidDistributionTotal)}</div>
            <div className="astat-sub">Awaiting / credited to investors</div>
          </div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-amber"><i className="ti ti-wallet"></i></div>
          <div>
            <div className="astat-lbl">Total Cash Deposit Flow</div>
            <div className="astat-val">${totalDepositFlow.toLocaleString()}</div>
            <div className="astat-sub">All time record</div>
          </div>
        </div>
      </div>

      {/* Main reporting table with tabs */}
      <div className="card">
        <div className="tabs">
          <button className={`tab ${activeTab === "pnl" ? "on" : ""}`} onClick={() => setActiveTab("pnl")}>💰 P&L Summary</button>
          <button className={`tab ${activeTab === "tx" ? "on" : ""}`} onClick={() => setActiveTab("tx")}>📋 Transaction Feed</button>
        </div>

        {/* P&L SUMMARY SHEET */}
        {activeTab === "pnl" && (
          <div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            <div className="scard"><div className="scard-lbl">All Pools Capital</div><div className="scard-val">{money(pammTotals.totalCapital)}</div></div>
            <div className="scard"><div className="scard-lbl">All Pools Investor Capital</div><div className="scard-val">{money(pammTotals.investorCapital)}</div></div>
            <div className="scard"><div className="scard-lbl">All Pools Retained P/L</div><div className="scard-val" style={{ color: Number(pammTotals.retainedPnl || 0) >= 0 ? "var(--green)" : "var(--red)" }}>{money(pammTotals.retainedPnl)}</div></div>
            <div className="scard"><div className="scard-lbl">All Pools Distribution Fees</div><div className="scard-val">{money(netRevenue)}</div></div>
          </div>
          <div className="border-t border-[#E7EDF3] px-4 pb-4 pt-4">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <div className="sh">Pool performance</div>
                <div className="mt-1 text-xs c-t3">Click a pool card to open its participant and trade details below.</div>
              </div>
              {selectedPoolId && <span className="st st-approved">Pool selected</span>}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {poolCards.map((pool) => {
                const pnl = Number(pool.realizedPnl || 0);
                const isSelected = String(pool.poolId) === String(selectedPoolId);
                const investors = uniqueInvestorCount(pool);
                return <button type="button" key={String(pool.poolId)} aria-pressed={isSelected} data-selected={isSelected ? "true" : "false"} className={`scard text-left transition hover:-translate-y-0.5 ${isSelected ? "selected-pool-card" : "hover:border-[#94A3B8]"}`} style={isSelected ? { border: "2px solid var(--green)" } : undefined} onClick={() => setSelectedPoolId(String(pool.poolId))}>
                  <div className="flex items-start justify-between gap-3"><div className="text-sm font-semibold">{pool.poolName || "PAMM pool"}</div>{isSelected ? <span className="text-[11px] font-semibold text-[#0F766E]">Selected</span> : <span className="text-[11px] font-semibold text-[#2563EB]">Click to view details</span>}</div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div><div className="scard-lbl">Live P/L</div><div className={`text-sm font-bold ${pnl >= 0 ? "val-pos" : "val-neg"}`}>{pnl >= 0 ? "+" : ""}{money(pnl)}</div></div>
                    <div><div className="scard-lbl">Total capital</div><div className="text-sm font-bold">{money(Number(pool.totalCapital))}</div></div>
                    <div><div className="scard-lbl">Investors</div><div className="text-sm font-bold">{investors}</div></div>
                  </div>
                </button>;
              })}
              {!poolCards.length && <div className="text-xs c-t3">No pool accounting data found.</div>}
            </div>
          {selectedPool ? <div className="mt-4 rounded-lg p-4" style={{ border: "2px solid var(--green)" }}>
            <div className="flex items-center justify-between gap-3 border-b border-[#E7EDF3] pb-3"><div><div className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#64748B]">Selected pool</div><h3 className="mt-1 text-base font-semibold">{selectedPool.pool?.poolName || "PAMM pool"}</h3></div><button className="btn btn-outline btn-xs" onClick={() => setSelectedPoolId(null)}><i className="ti ti-arrow-left" /> All pools</button></div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5"><div className="scard"><div className="scard-lbl">Total capital</div><div className="scard-val">{money(Number(selectedPool.accounting?.totalCapital))}</div></div><div className="scard"><div className="scard-lbl">Live P/L</div><div className={`scard-val ${Number(selectedPool.accounting?.realizedPnl || 0) >= 0 ? "val-pos" : "val-neg"}`}>{money(Number(selectedPool.accounting?.realizedPnl))}</div></div><div className="scard"><div className="scard-lbl">Investors</div><div className="scard-val">{uniqueInvestorCount(selectedPool.accounting)}</div></div><div className="scard"><div className="scard-lbl">Open trades</div><div className="scard-val">{selectedTradeCounts.openTrades}</div></div><div className="scard"><div className="scard-lbl">Total trades</div><div className="scard-val">{selectedTradeCounts.totalTrades}</div></div></div>
            <div className="mt-4"><div className="sh mb-2">Participant allocation</div><div className="tbl-wrap"><table className="reports-detail-table"><thead><tr><th>Participant</th><th>Type</th><th style={{ textAlign: "right" }}>Aggregated capital</th><th style={{ textAlign: "right" }}>Current share</th><th style={{ textAlign: "right" }}>Total realized P/L</th></tr></thead><tbody>{selectedParticipants.map((participant: any) => <tr key={participant.key}><td><div className="fw6">{participant.name}</div><div className="text-xs c-t3">{participant.email}</div></td><td>{participant.participantType}</td><td className="td-mono" style={{ textAlign: "right" }}>{money(Number(participant.capital))}</td><td className="td-mono" style={{ textAlign: "right" }}>{Number(participant.sharePercentage || 0).toFixed(2)}%</td><td className={`td-mono ${Number(participant.realizedPnl || 0) >= 0 ? "val-pos" : "val-neg"}`} style={{ textAlign: "right" }}>{money(Number(participant.realizedPnl))}</td></tr>)}{!selectedParticipants.length && <tr><td colSpan={5} className="text-center c-t3">No participant allocation records found for this pool.</td></tr>}</tbody></table></div></div>
          </div> : <div className="mt-4 border-t border-[#E7EDF3] pt-4 text-xs c-t3">Select a pool card to view participant allocation details.</div>}
          </div>
          </div>
        )}

        {/* TRANSACTION FEED */}
        {activeTab === "tx" && (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>TX ID</th>
                  <th>Timestamp</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "30px" }}>Loading Transactions...</td></tr>
                ) : transactions.map((t, idx) => (
                  <tr key={idx}>
                    <td className="td-mono fw6">{t._id.slice(-8)}</td>
                    <td className="c-t3 text-xs">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="fw6">{t.user?.name || t.user?.email || 'Unknown'}</td>
                    <td>
                      <span className={t.type === "Deposit" ? "type-dep" : "type-wit"}>
                        {t.type}
                      </span>
                    </td>
                    <td className="c-t2 text-sm">{t.method}</td>
                    <td className={`td-mono text-right fw6 ${t.type === "Deposit" ? "val-pos" : "val-neg"}`}>
                      {t.type === "Deposit" ? "+" : "-"}${t.amount?.toLocaleString()}
                    </td>
                    <td>
                      <span className={`st ${t.status === 'Approved' ? 'st-approved' : t.status === 'Pending' ? 'st-pending' : 'st-rejected'}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
                {!loading && transactions.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center' }}>No transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
