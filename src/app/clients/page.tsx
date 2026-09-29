"use client";

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import api from "@/services/api";



const CRYPTO_METHODS = [
  { value: "USDT_TRC20", label: "USDT (TRC20)" },
  { value: "USDT_ERC20", label: "USDT (ERC20)" },
  { value: "USDT_BEP20", label: "USDT (BEP20)" },
  { value: "BTC", label: "Bitcoin (BTC)" },
  { value: "ETH", label: "Ethereum (ETH)" },
];

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundCryptoMethod, setFundCryptoMethod] = useState("USDT_TRC20");
  const [fundTxid, setFundTxid] = useState("");
  const [showFundModal, setShowFundModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [deletingClient, setDeletingClient] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    status: "active",
  });

  // Stats
  const [stats, setStats] = useState({
    totalClients: 0,
    verified: 0,
    pendingKyc: 0,
    totalAUM: 0
  });

  const socketRef = useRef<any>(null);

  useEffect(() => {
    fetchClients();

    // Guard against React Strict Mode double-mount in dev
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:5001", { transports: ['websocket', 'polling'] });
      socketRef.current.on('connect', () => console.log('Admin socket connected'));
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get(`/admin/clients`);
      setClients(res.data);
      
      const resStats = await api.get(`/admin/stats`);
      setStats({
        totalClients: resStats.data.totalUsers,
        verified: resStats.data.verifiedUsers,
        pendingKyc: resStats.data.pendingKyc,
        totalAUM: resStats.data.totalBalance
      });

    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKycReview = async (clientId: string, status: 'approved' | 'rejected') => {
    try {
      await api.post(`/admin/kyc/review/${clientId}`, {
        status,
        rejectionReason: status === 'rejected' ? 'Documents invalid or blurry.' : ''
      });
      
      fetchClients();
      alert(`KYC ${status} successfully.`);
    } catch (err) {
      console.error("Error reviewing KYC:", err);
      alert("Failed to review KYC.");
    }
  };

  const openFundModal = (client: any) => {
    setSelectedClient(client);
    setFundAmount("");
    setFundCryptoMethod("USDT_TRC20");
    setFundTxid("");
    setShowFundModal(true);
  };

  const openEditModal = (client: any) => {
    setSelectedClient(client);
    setEditForm({
      name: client.name || "",
      email: client.email || "",
      status: client.status || "active",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (client: any) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const handleFundWallet = async () => {
    if (!selectedClient) return;
    const amount = Number(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      return alert("Please enter a valid positive number");
    }
    try {
      await api.post(`/admin/users/${selectedClient._id}/fund`, {
        amount,
        cryptoMethod: fundCryptoMethod,
        txid: fundTxid.trim(),
      });
      fetchClients();
      setShowFundModal(false);
      alert(`Successfully credited $${amount}`);
    } catch (err: any) {
      console.error("Error funding wallet:", err);
      alert(err.response?.data?.message || "Failed to update wallet balance");
    }
  };

  const handleSaveClient = async () => {
    if (!selectedClient) return;
    setSavingClient(true);
    try {
      await api.put(`/admin/users/${selectedClient._id}`, editForm);
      setShowEditModal(false);
      fetchClients();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update client");
    } finally {
      setSavingClient(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    setDeletingClient(true);
    try {
      await api.delete(`/admin/users/${selectedClient._id}`);
      setShowDeleteModal(false);
      fetchClients();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete client");
    } finally {
      setDeletingClient(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = c.name?.toLowerCase().includes(searchLower) ||
      c._id.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchLower);
    
    // c.kyc.status could be 'approved', 'pending', 'rejected', 'not_submitted'
    let mappedStatus = 'Unverified';
    if (c.kyc?.status === 'approved') mappedStatus = 'Verified';
    if (c.kyc?.status === 'pending') mappedStatus = 'Pending';

    const matchesStatus = statusFilter === "All Status" || mappedStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="screen on" id="sc-admin-clients">
      <div className="ph">
        <div>
          <h1>Client Management</h1>
          <p>View and manage all registered clients.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={fetchClients}><i className="ti ti-refresh"></i> Refresh</button>
      </div>

      <div className="g4 mb20">
        <div className="astat">
          <div className="astat-ic ic-blue"><i className="ti ti-users"></i></div>
          <div>
            <div className="astat-lbl">Total Clients</div>
            <div className="astat-val">{stats.totalClients.toLocaleString()}</div>
          </div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-green"><i className="ti ti-user-check"></i></div>
          <div>
            <div className="astat-lbl">Verified</div>
            <div className="astat-val">{stats.verified.toLocaleString()}</div>
          </div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-amber"><i className="ti ti-clock"></i></div>
          <div>
            <div className="astat-lbl">Pending KYC</div>
            <div className="astat-val">{stats.pendingKyc.toLocaleString()}</div>
          </div>
        </div>
        <div className="astat">
          <div className="astat-ic ic-purple"><i className="ti ti-chart-pie"></i></div>
          <div>
            <div className="astat-lbl">Total AUM</div>
            <div className="astat-val">${stats.totalAUM.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="fb mb16" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="fal gap8" style={{ flex: '1 1 300px' }}>
            <div className="search-box" style={{ flex: 1, position: 'relative' }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }}></i>
              <input
                type="text"
                className="fi"
                placeholder="Search ID, Name, Email..."
                style={{ paddingLeft: '34px', width: '100%' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="fi"
              style={{ width: '120px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All Status">All Status</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Unverified">Unverified</option>
            </select>
          </div>
          <div className="fal gap8">
            <button className="btn btn-sm btn-outline"><i className="ti ti-filter"></i> Filters</button>
            <button className="btn btn-sm btn-outline"><i className="ti ti-download"></i> Export</button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Client Name</th>
                <th>Email</th>
                <th>Total Deposits</th>
                <th>Balance</th>
                <th>KYC</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '30px' }}>Loading clients...</td></tr>
              ) : (
                filteredClients.map(c => {
                  let kycStatus = 'Unverified';
                  if (c.kyc?.status === 'approved') kycStatus = 'Verified';
                  if (c.kyc?.status === 'pending') kycStatus = 'Pending';
                  
                  return (
                    <tr key={c._id}>
                      <td className="td-mono c-t3">{c._id.slice(-6)}</td>
                      <td><div className="fw6">{c.name || 'Unnamed'}</div></td>
                      <td className="c-t2 text-xs">{c.email}</td>
                      <td className="val-pos">${c.totalDeposits?.toLocaleString() || 0}</td>
                      <td className="val-pos">${c.balance?.toLocaleString() || 0}</td>
                      <td>
                        <span className={`st ${kycStatus === 'Verified' ? 'st-approved' : kycStatus === 'Pending' ? 'st-pending' : 'st-rejected'}`}>
                          {kycStatus}
                        </span>
                      </td>
                      <td><span className={c.status === 'active' ? 'dot-green' : 'dot-amber'}></span> {c.status}</td>
                      <td className="text-xs c-t3">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="fal gap4" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                          {c.kyc?.status === 'pending' ? (
                            <button className="btn btn-xs btn-success" onClick={() => handleKycReview(c._id, 'approved')}><i className="ti ti-check"></i></button>
                          ) : null}
                          <button className="btn btn-xs btn-outline" onClick={() => openFundModal(c)} title="Add Funds"><i className="ti ti-wallet"></i> Fund</button>
                          <button className="btn btn-xs btn-outline" onClick={() => openEditModal(c)} title="Edit Client"><i className="ti ti-pencil"></i> Edit</button>
                          <button className="btn btn-xs btn-danger" onClick={() => openDeleteModal(c)} title="Delete Client"><i className="ti ti-trash"></i> Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
              {!loading && filteredClients.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--t3)' }}>No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showFundModal && selectedClient && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4" onClick={(e) => { if (e.target === e.currentTarget) setShowFundModal(false); }}>
          <div className="card w-full max-w-lg">
            <div className="fb mb16">
              <div>
                <div className="sh" style={{ margin: 0 }}>Fund Wallet</div>
                <div className="text-xs c-t3">{selectedClient.name || selectedClient.email}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowFundModal(false)}><i className="ti ti-x"></i></button>
            </div>
            <div className="grid gap-3">
              <div className="card-sm" style={{ background: "var(--bg3)" }}>
                <div className="fb text-xs">
                  <span className="c-t2">Current wallet</span>
                  <span className="mono fw7">${Number(selectedClient.balance || 0).toLocaleString()}</span>
                </div>
              </div>
              <label>
                <div className="text-xs c-t3 mb4">Amount</div>
                <input className="fi w-full" type="number" min="1" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
              </label>
              <label>
                <div className="text-xs c-t3 mb4">Crypto Method</div>
                <select className="fi w-full" value={fundCryptoMethod} onChange={(e) => setFundCryptoMethod(e.target.value)}>
                  {CRYPTO_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>{method.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <div className="text-xs c-t3 mb4">Transaction Hash / TxID <span className="c-t3">(Optional)</span></div>
                <input className="fi w-full mono" value={fundTxid} onChange={(e) => setFundTxid(e.target.value)} placeholder="Optional blockchain transaction hash" />
              </label>
            </div>
            <div className="fal gap8 mt16">
              <button className="btn btn-outline btn-sm" onClick={() => setShowFundModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleFundWallet}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedClient && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4" onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
          <div className="card w-full max-w-lg">
            <div className="fb mb16">
              <div>
                <div className="sh" style={{ margin: 0 }}>Edit Client</div>
                <div className="text-xs c-t3">{selectedClient.email}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEditModal(false)}><i className="ti ti-x"></i></button>
            </div>
            <div className="grid gap-3">
              <label>
                <div className="text-xs c-t3 mb4">Name</div>
                <input className="fi w-full" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
              </label>
              <label>
                <div className="text-xs c-t3 mb4">Email</div>
                <input className="fi w-full" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
              </label>
              <label>
                <div className="text-xs c-t3 mb4">Status</div>
                <select className="fi w-full" value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="active">active</option>
                  <option value="disabled">disabled</option>
                  <option value="pending">pending</option>
                </select>
              </label>
            </div>
            <div className="fal gap8 mt16">
              <button className="btn btn-outline btn-sm" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveClient} disabled={savingClient}>{savingClient ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedClient && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4" onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}>
          <div className="card w-full max-w-md">
            <div className="sh mb8">Delete Client</div>
            <p className="text-sm c-t2 mb16">
              Delete <strong>{selectedClient.name || selectedClient.email}</strong> and remove related investment, trade, and transaction records?
            </p>
            <div className="fal gap8">
              <button className="btn btn-outline btn-sm" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteClient} disabled={deletingClient}>{deletingClient ? "Deleting..." : "Delete Client"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
