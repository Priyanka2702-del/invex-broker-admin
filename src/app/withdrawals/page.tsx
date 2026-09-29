"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";

export default function Withdrawals() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "pending">("pending");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [approvalTarget, setApprovalTarget] = useState<any | null>(null);
  const [payoutTxid, setPayoutTxid] = useState("");
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const [res, pendingRes] = await Promise.all([api.get("/admin/reports"), api.get("/admin/withdrawals/pending")]);
      const allTx: any[] = res.data.transactions || [];
      const withdrawals = allTx.filter((t: any) => t.type === "Withdrawal");
      setTransactions(withdrawals);
      setPendingWithdrawals(pendingRes.data || []);

      setStats({
        total: withdrawals.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0),
        pending: pendingRes.data?.length || withdrawals.filter((t: any) => t.status === "Pending").length,
        approved: withdrawals.filter((t: any) => t.status === "Approved").length,
        rejected: withdrawals.filter((t: any) => t.status === "Rejected").length,
      });
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
    } finally {
      setLoading(false);
    }
  };

  const reviewWithdrawal = async (id: string, status: "Approved" | "Rejected") => {
    try {
      await api.post(`/admin/withdrawals/review/${id}`, { status });
      await fetchWithdrawals();
    } catch (err) {
      console.error("Error reviewing withdrawal:", err);
    }
  };

  const openApprovalModal = (withdrawal: any) => {
    setApprovalTarget(withdrawal);
    setPayoutTxid("");
  };

  const approveWithdrawal = async () => {
    if (!approvalTarget) return;
    if (payoutTxid.trim().length < 8) {
      alert("Please enter the payout transaction hash.");
      return;
    }
    setApproving(true);
    try {
      await api.post(`/admin/withdrawals/review/${approvalTarget._id}`, {
        status: "Approved",
        payoutTxid: payoutTxid.trim(),
      });
      setApprovalTarget(null);
      setPayoutTxid("");
      await fetchWithdrawals();
    } catch (err: any) {
      console.error("Error approving withdrawal:", err);
      alert(err.response?.data?.message || "Failed to approve withdrawal");
    } finally {
      setApproving(false);
    }
  };

  const visibleRows = activeTab === "pending" ? pendingWithdrawals : transactions;

  return (
    <div className="screen on" id="sc-admin-withdrawals">
      <div className="ph">
        <div>
          <h1>Withdrawal Management</h1>
          <p>View all client withdrawal transactions.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={fetchWithdrawals}><i className="ti ti-refresh"></i> Refresh</button>
      </div>

      {stats.pending > 0 && (
        <div className="alert alert-danger mb20" style={{ background: "rgba(244,63,94,.1)", color: "var(--red)", padding: "12px 16px", borderRadius: "var(--r8)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontSize: "13px", fontWeight: 500 }}>
          <i className="ti ti-alert-circle"></i> {stats.pending} withdrawal(s) are in pending state.
        </div>
      )}

      <div className="g4 mb20">
        <div className="astat">
          <div className="astat-ic ic-red"><i className="ti ti-arrow-bar-to-up"></i></div>
          <div><div className="astat-lbl">Total Withdrawals</div><div className="astat-val">${stats.total.toLocaleString()}</div><div className="astat-sub">All recorded requests</div></div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-amber"><i className="ti ti-clock"></i></div>
          <div><div className="astat-lbl">Pending</div><div className="astat-val">{stats.pending}</div></div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-green"><i className="ti ti-circle-check"></i></div>
          <div><div className="astat-lbl">Approved</div><div className="astat-val">{stats.approved}</div></div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-blue"><i className="ti ti-x"></i></div>
          <div><div className="astat-lbl">Rejected</div><div className="astat-val">{stats.rejected}</div></div>
        </div>
      </div>

      <div className="card">
        <div className="tabs mb14">
          <button className={`tab ${activeTab === "all" ? "on" : ""}`} onClick={() => setActiveTab("all")}>All Withdrawals ({transactions.length})</button>
          <button className={`tab ${activeTab === "pending" ? "on" : ""}`} onClick={() => setActiveTab("pending")}>Pending Approval ({pendingWithdrawals.length})</button>
        </div>
        <div className="sh mb14">{activeTab === "pending" ? "Pending Withdrawal Approvals" : "Withdrawal History"}</div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>TX ID</th>
                <th>Client</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Submitted</th>
                {activeTab === "pending" && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={activeTab === "pending" ? 7 : 6} style={{ textAlign: "center", padding: "30px" }}>Loading withdrawals...</td></tr>
              ) : visibleRows.map((w) => (
                <tr key={w._id}>
                  <td className="td-mono c-t3">{w._id.slice(-8)}</td>
                  <td>
                    <div className="fw6">{w.user?.name || "Unknown"}</div>
                    <div className="text-xs c-t3">{w.user?.email}</div>
                  </td>
                  <td className="c-t2">{w.method}</td>
                  <td className="val-neg fw6">-${w.amount?.toLocaleString()}</td>
                  <td>
                    <span className={`st ${w.status === "Approved" ? "st-approved" : w.status === "Pending" ? "st-pending" : "st-rejected"}`}>
                      {w.status}
                    </span>
                    {w.payoutTxid && (
                      <div className="text-xs c-t3 mt4 mono" style={{ wordBreak: "break-all" }}>
                        Payout TxID: {w.payoutTxid}
                      </div>
                    )}
                  </td>
                  <td className="text-xs c-t3">{new Date(w.createdAt).toLocaleString()}</td>
                  {activeTab === "pending" && <td className="text-right"><div className="fal gap8 justify-end flex-wrap"><button className="btn btn-xs btn-success" onClick={() => openApprovalModal(w)}>Approve</button><button className="btn btn-xs btn-danger" onClick={() => reviewWithdrawal(w._id, "Rejected")}>Reject</button></div></td>}
                </tr>
              ))}
              {!loading && visibleRows.length === 0 && (
                <tr><td colSpan={activeTab === "pending" ? 7 : 6} style={{ textAlign: "center", padding: "30px", color: "var(--t3)" }}>No withdrawals found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {approvalTarget && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4" onClick={(e) => { if (e.target === e.currentTarget) setApprovalTarget(null); }}>
          <div className="card w-full max-w-lg">
            <div className="fb mb16">
              <div>
                <div className="sh" style={{ margin: 0 }}>Approve Withdrawal</div>
                <div className="text-xs c-t3">{approvalTarget.user?.name || approvalTarget.user?.email || "Client"} · ${Number(approvalTarget.amount || 0).toLocaleString()}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setApprovalTarget(null)}><i className="ti ti-x"></i></button>
            </div>
            <div className="grid gap-3">
              <div className="card-sm" style={{ background: "var(--bg3)" }}>
                <div className="text-xs c-t3 mb4">Destination Wallet</div>
                <div className="mono text-xs c-t2" style={{ wordBreak: "break-all" }}>{approvalTarget.walletAddress}</div>
              </div>
              <label>
                <div className="text-xs c-t3 mb4">Payout Transaction Hash / TxID</div>
                <input className="fi w-full mono" value={payoutTxid} onChange={(e) => setPayoutTxid(e.target.value)} placeholder="Paste outgoing blockchain transaction hash" />
              </label>
            </div>
            <div className="fal gap8 mt16">
              <button className="btn btn-outline btn-sm" onClick={() => setApprovalTarget(null)}>Cancel</button>
              <button className="btn btn-success btn-sm" onClick={approveWithdrawal} disabled={approving}>{approving ? "Approving..." : "Approve & Save TxID"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
