"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All Severities");
  const [componentFilter, setComponentFilter] = useState("All Components");
  const [loading, setLoading] = useState(true);
  
  // Purge confirmation modal state
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const res = await api.get(`/admin/audits`);
      setLogs(res.data);
    } catch (err) {
      console.error("Error fetching audits:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeLogs = () => {
    // Ideally calls a backend endpoint to purge
    setLogs([]);
    setModalOpen(false);
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = log.operator?.toLowerCase().includes(searchLower) || 
                          log.action?.toLowerCase().includes(searchLower) ||
                          log.ip?.includes(searchTerm);
    const matchesSeverity = severityFilter === "All Severities" || log.severity === severityFilter;
    const matchesComponent = componentFilter === "All Components" || log.component === componentFilter;
    return matchesSearch && matchesSeverity && matchesComponent;
  });

  return (
    <div className="screen on" id="sc-admin-audit">
      <div className="ph">
        <div>
          <h1>System Audit Trail</h1>
          <p>Chronological high-security ledger tracking administrative modifications, server routines and security overrides.</p>
        </div>
        <div className="fal gap8">
          <button className="btn btn-primary btn-sm" onClick={fetchAudits}>
            <i className="ti ti-refresh"></i> Refresh
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setModalOpen(true)}>
            <i className="ti ti-trash"></i> Purge Archival Logs
          </button>
        </div>
      </div>

      {/* Audit overview parameters */}
      <div className="g4 mb20">
        <div className="astat">
          <div className="astat-ic ic-blue"><i className="ti ti-file-description"></i></div>
          <div>
            <div className="astat-lbl">Total Archived Logs</div>
            <div className="astat-val">{logs.length > 0 ? `${logs.length} rows` : "0 rows"}</div>
            <div className="astat-sub">Indexed ledger database</div>
          </div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-red"><i className="ti ti-alert-triangle"></i></div>
          <div>
            <div className="astat-lbl">Security Overrides</div>
            <div className="astat-val">{logs.filter(l => l.severity === "CRITICAL").length} Critical</div>
            <div className="astat-sub" style={{ color: "var(--red)" }}>Requires weekly validation</div>
          </div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-amber"><i className="ti ti-shield-alert"></i></div>
          <div>
            <div className="astat-lbl">Warnings Triggered</div>
            <div className="astat-val">{logs.filter(l => l.severity === "WARNING").length} Warns</div>
            <div className="astat-sub">Potential firewall sync delays</div>
          </div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-green"><i className="ti ti-lock"></i></div>
          <div>
            <div className="astat-lbl">Archival Status</div>
            <div className="astat-val">365 Days</div>
            <div className="astat-sub" style={{ color: "var(--green)" }}>🔒 Encryption Lock Active</div>
          </div>
        </div>
      </div>

      {/* Audit log filters & ledger */}
      <div className="card">
        <div className="fb mb16" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="fal gap8" style={{ flex: '1 1 300px', flexWrap: "wrap" }}>
            <div className="search-box" style={{ flex: '1 1 200px', position: "relative" }}>
              <i className="ti ti-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--t3)" }}></i>
              <input 
                type="text" 
                className="fi" 
                placeholder="Search Operator, Action Taken, IP Address..." 
                style={{ paddingLeft: "34px", width: "100%" }} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              className="fi" 
              style={{ flex: '1 1 120px' }}
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="All Severities">All Severities</option>
              <option value="INFO">INFO Tiers</option>
              <option value="WARNING">WARNINGS</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>

            <select 
              className="fi" 
              style={{ flex: '1 1 120px' }}
              value={componentFilter}
              onChange={(e) => setComponentFilter(e.target.value)}
            >
              <option value="All Components">All Components</option>
              <option value="Compliance">Compliance</option>
              <option value="Finance">Finance</option>
              <option value="Servers">Servers</option>
              <option value="System Control">System Control</option>
              <option value="Support">Support</option>
            </select>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Action Event</th>
                <th>Component</th>
                <th>Severity</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px" }}>Loading logs...</td></tr>
              ) : filteredLogs.map(log => (
                    <tr key={log._id}>
                      <td className="text-xs c-t3 td-mono">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="fw7">{log.operator}</td>
                      <td className="fw6 c-text">{log.action}</td>
                      <td>
                        <span className={`badge ${
                          log.component === "Compliance" ? "badge-demo" : 
                          log.component === "Finance" ? "badge-mt5" : 
                          log.component === "Servers" ? "badge-mt4" : "badge-real"
                        }`}>
                          {log.component}
                        </span>
                      </td>
                      <td>
                        <span className={`st ${
                          log.severity === "INFO" ? "st-approved" : 
                          log.severity === "WARNING" ? "st-pending" : "st-rejected"
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="td-mono text-xs c-t3">{log.ip}</td>
                    </tr>
              ))}
              {!loading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--t3)" }}>No matching logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purge Logs Confirmation Modal */}
      {modalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.4)", zIndex: 9999, display: "flex",
          alignItems: "center", justifyContent: "center"
        }}>
          <div className="card" style={{ width: "min(400px, calc(100vw - 32px))", background: "var(--bg2)", border: "1px solid var(--border)", boxShadow: "0 20px 40px rgba(0,0,0,0.18)" }}>
            <div className="fb mb16">
              <div className="sh" style={{ margin: 0, color: "var(--red)" }}>🚨 SECURITY ACTION REQUIRED</div>
              <button className="btn btn-ghost btn-xs" style={{ minWidth: 0, padding: "4px" }} onClick={() => setModalOpen(false)}>
                <i className="ti ti-x" style={{ fontSize: "18px" }}></i>
              </button>
            </div>
            
            <p className="text-xs c-t2 mb20" style={{ lineHeight: "1.5" }}>
              Are you absolutely sure you want to purge the archival security audit trail log archives? This action is permanent and will wipe out compliance records from this session&apos;s database memory.
            </p>

            <div className="fb" style={{ marginTop: "24px" }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1, marginRight: "8px" }} onClick={() => setModalOpen(false)}>
                Cancel Action
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ flex: 1, backgroundColor: "var(--red)" }}
                onClick={handlePurgeLogs}
              >
                Yes, Purge Archives
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
