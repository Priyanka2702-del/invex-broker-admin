"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingKyc: 0,
    totalTrades: 0,
    totalVolume: 0,
    totalBalance: 0
  });
  
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [pendingTxCount, setPendingTxCount] = useState({ deposits: 0, withdrawals: 0 });
  const [pendingTickets, setPendingTickets] = useState(0);
  const [pammAum, setPammAum] = useState(0);
  const [pammPools, setPammPools] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch Stats
      const statsRes = await api.get(`/admin/stats`);
      setStats(statsRes.data);

      // Fetch Clients
      const clientsRes = await api.get(`/admin/clients`);
      setRecentClients(clientsRes.data.slice(0, 5));

      // Fetch Reports (Transactions)
      const reportsRes = await api.get(`/admin/reports`);
      const txs = reportsRes.data.transactions || [];
      setRecentTx(txs.slice(0, 5));

      const depositsRes = await api.get(`/admin/deposits/pending`);
      const pendingDep = depositsRes.data?.length || 0;
      
      const pendingWit = txs.filter((t: any) => t.type === 'Withdrawal' && t.status === 'Pending').length;
      setPendingTxCount({ deposits: pendingDep, withdrawals: pendingWit });

      // Fetch Support tickets
      const supportRes = await api.get(`/support/all-tickets`);
      const pTickets = supportRes.data.filter((t: any) => t.status === 'open').length;
      setPendingTickets(pTickets);

      // Fetch PAMM pools for AUM and Snapshot
      try {
        const pammRes = await api.get('/pamm/pools');
        if (pammRes.data && Array.isArray(pammRes.data)) {
          setPammPools(pammRes.data);
          const totalAum = pammRes.data.reduce((sum: number, p: any) => sum + (Number(p.aum) || 0), 0);
          setPammAum(totalAum);
        }
      } catch (e) {
        console.warn("Failed to fetch PAMM pools:", e);
      }

    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    }
  };

  return (
    <div className="screen on" id="sc-admin-dash">
      <div className="ph">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Platform overview — <span id="admin-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
        </div>
        <div className="fal gap8" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={fetchDashboardData}><i className="ti ti-refresh"></i> Refresh</button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card transition-colors">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider c-t3 mb-1">Total Clients</div>
              <div className="text-2xl font-bold font-mono c-text">{stats.totalUsers.toLocaleString()}</div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--blue)]" style={{ background: 'var(--bg3)' }}>
              <i className="ti ti-users text-xl"></i>
            </div>
          </div>
          <div className="text-xs font-semibold c-t2 flex items-center gap-1">
            <i className="ti ti-check text-[var(--blue)]"></i> {stats.verifiedUsers.toLocaleString()} Verified Accounts
          </div>
        </div>

        <div className="card transition-colors">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider c-t3 mb-1">Global Wallet Balance</div>
              <div className="text-2xl font-bold font-mono c-text">${stats.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--cyan)]" style={{ background: 'var(--bg3)' }}>
              <i className="ti ti-wallet text-xl"></i>
            </div>
          </div>
          <div className="text-xs c-t3">Sum of all client wallet balances</div>
        </div>

        <div className="card transition-colors">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider c-t3 mb-1">PAMM Active AUM</div>
              <div className="text-2xl font-bold font-mono c-text">${pammAum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--blue)]" style={{ background: 'var(--bg3)' }}>
              <i className="ti ti-chart-pie text-xl"></i>
            </div>
          </div>
          <div className="text-xs c-t3">Total funds deployed in PAMM strategies</div>
        </div>

        <div className="card transition-colors">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider c-t3 mb-1">Pending Actions</div>
              <div className="text-2xl font-bold font-mono c-text">
                {pendingTxCount.deposits + pendingTxCount.withdrawals + stats.pendingKyc + pendingTickets}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--red)]" style={{ background: 'var(--bg3)' }}>
              <i className="ti ti-alert-circle text-xl"></i>
            </div>
          </div>
          <div className="text-xs font-semibold text-[var(--red)]">Requires immediate admin attention</div>
        </div>
      </div>

      {/* ── PAMM Pool Snapshot ── */}
      {pammPools.length > 0 && (
        <div className="card mb-6" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
          <div className="fb mb-6">
            <div className="sh" style={{ margin: 0 }}>📊 PAMM Pools</div>
            <Link href="/pamm" className="btn btn-sm btn-outline">Manage Pools</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pammPools.slice(0, 3).map((pool) => (
              <div key={pool._id} className="card-sm" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                <div className="fb mb8">
                  <div className="fw7 text-sm">{pool.poolName}</div>
                  <span className={`st ${pool.status === "Active" ? "st-approved" : "st-pending"}`}>{pool.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div>
                    <div className="text-[10px] uppercase c-t3 fw7">AUM</div>
                    <div className="font-mono text-sm">${Number(pool.aum).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase c-t3 fw7">Return</div>
                    <div className="font-mono text-sm text-[var(--blue)]">{pool.monthlyReturn}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase c-t3 fw7">Risk</div>
                    <div className="text-sm">{pool.riskMode}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase c-t3 fw7">Strategies</div>
                    <div className="text-sm">{pool.activeStrategies}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pending Actions + Recent Registrations ── */}
      <div className="g2 mb20">
        <div className="card">
          <div className="sh mb14">⚡ Pending Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="fb card-sm" style={{ background: 'var(--bg3)' }}>
              <div>
                <div className="fw6 text-sm">Pending Deposits</div>
                <div className="text-xs c-t3">Require manual review & approval</div>
              </div>
              <div className="fal gap8">
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--amber)', fontFamily: 'var(--mono)' }}>{pendingTxCount.deposits}</div>
                <Link href="/deposits" className="btn btn-sm btn-warning">Review</Link>
              </div>
            </div>
            <div className="fb card-sm" style={{ background: 'var(--bg3)' }}>
              <div>
                <div className="fw6 text-sm">Pending Withdrawals</div>
                <div className="text-xs c-t3">Awaiting processing</div>
              </div>
              <div className="fal gap8">
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--red)', fontFamily: 'var(--mono)' }}>{pendingTxCount.withdrawals}</div>
                <Link href="/withdrawals" className="btn btn-sm btn-danger">Process</Link>
              </div>
            </div>
            <div className="fb card-sm" style={{ background: 'var(--bg3)' }}>
              <div>
                <div className="fw6 text-sm">KYC Reviews</div>
                <div className="text-xs c-t3">Documents awaiting verification</div>
              </div>
              <div className="fal gap8">
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--amber)', fontFamily: 'var(--mono)' }}>{stats.pendingKyc}</div>
                <Link href="/kyc" className="btn btn-sm btn-warning">Review</Link>
              </div>
            </div>
            <div className="fb card-sm" style={{ background: 'var(--bg3)' }}>
              <div>
                <div className="fw6 text-sm">Support Tickets</div>
                <div className="text-xs c-t3">Unresolved open tickets</div>
              </div>
              <div className="fal gap8">
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--blue2)', fontFamily: 'var(--mono)' }}>{pendingTickets}</div>
                <Link href="/support" className="btn btn-sm btn-blue">Handle</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="card">
          <div className="fb mb14">
            <div className="sh" style={{ margin: 0 }}>Recent Registrations</div>
            <Link href="/clients" className="btn btn-xs btn-outline">All Clients</Link>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Registered</th>
                  <th>KYC</th>
                </tr>
              </thead>
              <tbody>
                {recentClients.map((c, i) => {
                  let kycStatus = 'Unverified';
                  if (c.kyc?.status === 'approved') kycStatus = 'Verified';
                  if (c.kyc?.status === 'pending') kycStatus = 'Pending';

                  return (
                    <tr key={i}>
                      <td><div className="fw6">{c.name || 'Unnamed'}</div><div className="text-xs c-t3">ID: {c._id.slice(-6)}</div></td>
                      <td className="text-xs c-t3">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`st ${kycStatus === 'Verified' ? 'st-approved' : kycStatus === 'Pending' ? 'st-pending' : 'st-rejected'}`}>
                          {kycStatus}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {recentClients.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center' }}>No recent clients</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Recent Transactions (full-width) ── */}
      <div className="card mb20">
        <div className="fb mb14">
          <div className="sh" style={{ margin: 0 }}>Recent Transactions</div>
          <Link href="/reports" className="btn btn-xs btn-outline">All Reports</Link>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.map((t, i) => (
                <tr key={i}>
                  <td><div className="fw6 text-xs">{t.user?.name || t.user?.email || 'Unknown'}</div><div className="text-xs c-t3">#{t._id.slice(-6)}</div></td>
                  <td><span className={t.type === 'Deposit' ? "type-dep" : "type-wit"}>{t.type}</span></td>
                  <td className={t.type === 'Deposit' ? "val-pos" : "val-neg"}>{t.type === 'Deposit' ? '+' : '−'}${t.amount?.toLocaleString()}</td>
                  <td>
                    <span className={`st ${t.status === 'Approved' ? 'st-approved' : t.status === 'Pending' ? 'st-pending' : 'st-rejected'}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentTx.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center' }}>No recent transactions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
