"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";

type DepositRequest = {
  _id: string;
  user?: { name?: string; email?: string };
  currency: string;
  network: string;
  amount: number;
  walletAddress: string;
  txid: string;
  proofUrl?: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  adminNote?: string;
};

export default function Deposits() {
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [allDeposits, setAllDeposits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "pending">("pending");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  const fetchDeposits = async () => {
    try {
      const res = await api.get("/admin/deposits/pending");
      const pendingRequests: DepositRequest[] = res.data || [];
      setRequests(pendingRequests);

      const allRes = await api.get("/admin/reports");
      const allTx: any[] = allRes.data.transactions || [];
      const deposits = allTx.filter((t: any) => t.type === "Deposit");
      setAllDeposits(deposits);

      setStats({
        total: deposits.reduce((sum: number, t: any) => sum + Number(t.creditedAmount ?? t.amount ?? 0), 0),
        pending: pendingRequests.length,
        approved: deposits.filter((t: any) => t.status === "Approved").length,
        rejected: deposits.filter((t: any) => t.status === "Rejected").length,
      });
    } catch (err) {
      console.error("Error fetching deposits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const reviewDeposit = async (id: string, status: "Approved" | "Rejected") => {
    try {
      await api.post(`/admin/deposits/review/${id}`, { status });
      fetchDeposits();
    } catch (err) {
      console.error("Error reviewing deposit:", err);
    }
  };

  const pendingCount = useMemo(() => requests.filter((req) => req.status === "Pending").length, [requests]);
  const visibleRows = activeTab === "pending" ? requests : allDeposits;

  return (
    <div className="screen on" id="sc-admin-deposits">
      <div className="ph">
        <div>
          <h1>Deposit Management</h1>
          <p>Review crypto proof submissions and approve funding requests.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={fetchDeposits}><i className="ti ti-refresh"></i> Refresh</button>
      </div>

      <div className="g4 mb20">
        <div className="astat">
          <div className="astat-ic ic-green"><i className="ti ti-arrow-bar-to-down"></i></div>
          <div><div className="astat-lbl">Total Deposits</div><div className="astat-val">${stats.total.toLocaleString()}</div><div className="astat-sub">All approved cash flow</div></div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-amber"><i className="ti ti-clock"></i></div>
          <div><div className="astat-lbl">Pending</div><div className="astat-val">{pendingCount}</div></div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-blue"><i className="ti ti-circle-check"></i></div>
          <div><div className="astat-lbl">Approved</div><div className="astat-val">{stats.approved}</div></div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-red"><i className="ti ti-x"></i></div>
          <div><div className="astat-lbl">Rejected</div><div className="astat-val">{stats.rejected}</div></div>
        </div>
      </div>


      <div className="card">
        <div className="tabs mb14">
          <button className={`tab ${activeTab === "all" ? "on" : ""}`} onClick={() => setActiveTab("all")}>All Deposits ({allDeposits.length})</button>
          <button className={`tab ${activeTab === "pending" ? "on" : ""}`} onClick={() => setActiveTab("pending")}>Pending Approval ({pendingCount})</button>
        </div>
        <div className="sh mb14">{activeTab === "pending" ? "Pending Deposits" : "Deposit History"}</div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Network</th>
                <th>Amount</th>
                <th>TxID</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px" }}>Loading deposits...</td></tr>
              ) : visibleRows.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--t3)" }}>No deposits found.</td></tr>
              ) : visibleRows.map((dep) => (
                <tr key={dep._id}>
                  <td>
                    <div className="fw6">{dep.user?.name || "Unknown"}</div>
                    <div className="text-xs c-t3">{dep.user?.email}</div>
                  </td>
                  <td className="c-t2">{dep.currency} {dep.network}</td>
                  <td className="val-pos fw6">${Number(dep.creditedAmount ?? dep.amount ?? 0).toLocaleString()}</td>
                  <td className="td-mono c-t3">{dep.txid ? `${dep.txid.slice(0, 10)}...` : `#${String(dep._id).slice(-8)}`}</td>
                  <td className="text-xs c-t3">{new Date(dep.createdAt).toLocaleString()}</td>
                  <td className="text-right">
                    {activeTab === "pending" ? <div className="fal gap8 justify-end flex-wrap">
                      <button className="btn btn-xs btn-success" onClick={() => reviewDeposit(dep._id, "Approved")}>Approve</button>
                      <button className="btn btn-xs btn-danger" onClick={() => reviewDeposit(dep._id, "Rejected")}>Reject</button>
                    </div> : <span className={`st ${dep.status === "Approved" ? "st-approved" : "st-rejected"}`}>{dep.status}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
