"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";

export default function KYC() {
  const [activeTab, setActiveTab] = useState("pending");
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get("/admin/clients");
      setClients(res.data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (clientId: string, action: "approved" | "rejected") => {
    try {
      await api.post(`/admin/kyc/review/${clientId}`, {
        status: action,
        rejectionReason: action === "rejected" ? "Documents invalid or blurry." : "",
      });
      fetchClients();
      alert(`KYC ${action} successfully.`);
    } catch (err) {
      console.error("Error updating KYC:", err);
      alert("Failed to update KYC.");
    }
  };

  const pending = clients.filter((c) => c.kyc?.status === "pending");
  const verified = clients.filter((c) => c.kyc?.status === "approved");
  const rejected = clients.filter((c) => c.kyc?.status === "rejected");

  return (
    <div className="screen on" id="sc-admin-kyc">
      <div className="ph">
        <div>
          <h1>KYC Management</h1>
          <p>Review and approve identity documents.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={fetchClients}><i className="ti ti-refresh"></i> Refresh</button>
      </div>
      <div className="card">
        <div className="fb mb16">
          <div className="tabs" style={{ margin: 0 }}>
            <button className={`tab ${activeTab === "pending" ? "on" : ""}`} onClick={() => setActiveTab("pending")}>
              Pending ({pending.length})
            </button>
            <button className={`tab ${activeTab === "verified" ? "on" : ""}`} onClick={() => setActiveTab("verified")}>
              Verified ({verified.length})
            </button>
            <button className={`tab ${activeTab === "rejected" ? "on" : ""}`} onClick={() => setActiveTab("rejected")}>
              Rejected ({rejected.length})
            </button>
          </div>
        </div>

        <div id="kyc-admin">
          {activeTab === "pending" && (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "30px" }}>Loading...</td></tr>
                  ) : pending.map((c) => (
                    <tr key={c._id}>
                      <td><div className="fw6">{c.name || "Unnamed"}</div><div className="text-xs c-t3">ID: {c._id.slice(-6)}</div></td>
                      <td className="c-t2 text-xs">{c.email}</td>
                      <td className="text-xs c-t3">{c.kyc?.submittedAt ? new Date(c.kyc.submittedAt).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="fal gap6">
                          <button className="btn btn-xs btn-success" onClick={() => handleAction(c._id, "approved")}><i className="ti ti-check"></i> Approve</button>
                          <button className="btn btn-xs btn-danger" onClick={() => handleAction(c._id, "rejected")}><i className="ti ti-x"></i> Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && pending.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "var(--t3)" }}>No pending KYC requests.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "verified" && (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Balance</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "30px" }}>Loading...</td></tr>
                  ) : verified.map((v) => (
                    <tr key={v._id}>
                      <td className="fw6">{v.name || "Unnamed"}</td>
                      <td className="c-t2 text-xs">{v.email}</td>
                      <td className="val-pos">${v.balance?.toLocaleString() || 0}</td>
                      <td className="text-xs c-t3">{new Date(v.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!loading && verified.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "var(--t3)" }}>No verified clients.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "rejected" && (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Rejection Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "30px" }}>Loading...</td></tr>
                  ) : rejected.map((r) => (
                    <tr key={r._id}>
                      <td className="fw6">{r.name || "Unnamed"}</td>
                      <td className="c-t2 text-xs">{r.email}</td>
                      <td className="c-t3 text-xs">{r.kyc?.rejectionReason || "N/A"}</td>
                      <td>
                        <button className="btn btn-xs btn-success" onClick={() => handleAction(r._id, "approved")}><i className="ti ti-refresh"></i> Re-approve</button>
                      </td>
                    </tr>
                  ))}
                  {!loading && rejected.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "var(--t3)" }}>No rejected KYC requests.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
