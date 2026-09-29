"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import api from "@/services/api";

export default function Analytics() {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "12m">("30d");
  const flowCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real data from backend
  const [realStats, setRealStats] = useState({
    totalUsers: 0, verifiedUsers: 0, pendingKyc: 0,
    totalBalance: 0, totalTrades: 0, totalVolume: 0,
    totalDeposits: 0, totalWithdrawals: 0,
    totalActiveInvestments: 0, totalAUM: 0
  });
  const [pammConfig, setPammConfig] = useState<any>(null);
  const [pammAccounting, setPammAccounting] = useState<any[]>([]);
  const [pammTotals, setPammTotals] = useState<any>({});
  const [txSummary, setTxSummary] = useState({
    totalDeposits: 0, totalWithdrawals: 0, pendingCount: 0,
    depositCount: 0, withdrawalCount: 0
  });
  const [flowPoints, setFlowPoints] = useState({ dep: [] as number[], wit: [] as number[] });

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      const [statsRes, pammRes, accountingRes, reportsRes, depositsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/pamm/config').catch(() => ({ data: null })),
        api.get('/admin/pamm/accounting').catch(() => ({ data: { pools: [] } })),
        api.get('/admin/reports').catch(() => ({ data: { transactions: [] } })),
        api.get('/admin/deposits/pending').catch(() => ({ data: [] }))
      ]);

      setRealStats(statsRes.data);
      if (pammRes.data) setPammConfig(pammRes.data);
      const accountingRows = accountingRes.data?.pools || [];
      setPammAccounting(accountingRows);
      setPammTotals(accountingRows.reduce((totals: any, row: any) => {
        const accounting = row.accounting || {};
        return Object.keys(totals).reduce((next, key) => ({ ...next, [key]: next[key] + Number(accounting[key] || 0) }), totals);
      }, { totalCapital: 0, managerCapital: 0, investorCapital: 0, realizedPnl: 0, grossRealizedPnl: 0, retainedPnl: 0, pendingDistributionTotal: 0, paidDistributionTotal: 0 }));

      const txs = reportsRes.data.transactions || [];
      const pendingDeps = depositsRes.data?.length || 0;
      const pendingWits = txs.filter((t: any) => t.type === 'Withdrawal' && t.status === 'Pending').length;

      setTxSummary({
        totalDeposits: statsRes.data.totalDeposits || 0,
        totalWithdrawals: statsRes.data.totalWithdrawals || 0,
        pendingCount: pendingDeps + pendingWits,
        depositCount: txs.filter((t: any) => t.type === 'Deposit' && t.status === 'Approved').length,
        withdrawalCount: txs.filter((t: any) => t.type === 'Withdrawal' && t.status === 'Approved').length
      });
      const bucketCount = timeframe === "7d" ? 7 : timeframe === "30d" ? 15 : 12;
      const now = Date.now();
      const span = timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 365;
      const buckets = Array.from({ length: bucketCount }, () => ({ dep: 0, wit: 0 }));
      txs.forEach((tx: any) => {
        const date = new Date(tx.createdAt || tx.reviewedAt || 0).getTime();
        const age = (now - date) / 86400000;
        if (!Number.isFinite(age) || age < 0 || age > span) return;
        const index = Math.min(bucketCount - 1, Math.floor((span - age) / span * bucketCount));
        if (tx.status !== "Approved") return;
        if (tx.type === "Deposit") buckets[index].dep += Number(tx.amount || 0);
        if (tx.type === "Withdrawal") buckets[index].wit += Number(tx.amount || 0);
      });
      setFlowPoints({ dep: buckets.map((b) => b.dep), wit: buckets.map((b) => b.wit) });
    } catch (err) {
      console.error("Analytics fetch error:", err);
    }
  };

  // KYC funnel — derived from real stats
  const kycFunnel = [
    { step: "Registered", count: realStats.totalUsers, pct: 100, label: "Total Signups" },
    { step: "KYC Submitted", count: realStats.pendingKyc + realStats.verifiedUsers, pct: realStats.totalUsers ? Math.round(((realStats.pendingKyc + realStats.verifiedUsers) / realStats.totalUsers) * 100) : 0, label: "Documents Submitted" },
    { step: "Verified", count: realStats.verifiedUsers, pct: realStats.totalUsers ? Math.round((realStats.verifiedUsers / realStats.totalUsers) * 100) : 0, label: "KYC Approved" },
    { step: "Funded", count: txSummary.depositCount, pct: realStats.totalUsers ? Math.min(100, Math.round((txSummary.depositCount / realStats.totalUsers) * 100)) : 0, label: "First Deposit Made" }
  ];

  // Draw Financial Flow chart
  useEffect(() => {
    const canvas = flowCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    const W = parent?.offsetWidth ? parent.offsetWidth - 36 : 600;
    const H = 180;
    canvas.width = W;
    canvas.height = H;

    const depPoints = flowPoints.dep.length ? flowPoints.dep : [0, 0];
    const witPoints = flowPoints.wit.length ? flowPoints.wit : [0, 0];
    const maxVal = Math.max(...depPoints, ...witPoints, 1) * 1.15;
    const plotLeft = 58;
    const plotRight = W - 10;
    const plotTop = 12;
    const plotBottom = H - 28;
    const plotWidth = Math.max(1, plotRight - plotLeft);
    const plotHeight = plotBottom - plotTop;
    const stepX = plotWidth / Math.max(1, depPoints.length - 1);
    const yFor = (value: number) => plotBottom - (value / maxVal) * plotHeight;

    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    ctx.font = "10px Arial";
    ctx.fillStyle = "#64748B";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const y = plotBottom - (plotHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(plotLeft, y);
      ctx.lineTo(plotRight, y);
      ctx.stroke();
      ctx.fillText(`$${Math.round((maxVal / 4) * i).toLocaleString()}`, plotLeft - 8, y + 3);
    }
    ctx.textAlign = "center";
    const bucketLabels = timeframe === "7d" ? ["-6d", "-5d", "-4d", "-3d", "-2d", "-1d", "Today"] : timeframe === "30d" ? ["-30d", "-25d", "-20d", "-15d", "-10d", "-5d", "Today"] : ["-12m", "-10m", "-8m", "-6m", "-4m", "-2m", "Now"];
    bucketLabels.forEach((label, index) => ctx.fillText(label, plotLeft + (index / 6) * plotWidth, H - 8));

    // Deposits area
    const gradDep = ctx.createLinearGradient(0, 0, 0, H);
    gradDep.addColorStop(0, "rgba(16, 185, 129, 0.12)");
    gradDep.addColorStop(1, "rgba(16, 185, 129, 0.00)");
    ctx.beginPath();
    ctx.moveTo(plotLeft, plotBottom);
    depPoints.forEach((val, index) => {
      ctx.lineTo(plotLeft + index * stepX, yFor(val));
    });
    ctx.lineTo(plotRight, plotBottom);
    ctx.closePath();
    ctx.fillStyle = gradDep;
    ctx.fill();

    // Deposits line
    ctx.beginPath();
    depPoints.forEach((val, index) => {
      const x = plotLeft + index * stepX;
      const y = yFor(val);
      index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Deposit dots
    depPoints.forEach((val, index) => {
      const x = plotLeft + index * stepX;
      const y = yFor(val);
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#111827";
      ctx.fill();
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Withdrawals area
    const gradWit = ctx.createLinearGradient(0, 0, 0, H);
    gradWit.addColorStop(0, "rgba(239, 68, 68, 0.08)");
    gradWit.addColorStop(1, "rgba(239, 68, 68, 0.00)");
    ctx.beginPath();
    ctx.moveTo(plotLeft, plotBottom);
    witPoints.forEach((val, index) => {
      ctx.lineTo(plotLeft + index * stepX, yFor(val));
    });
    ctx.lineTo(plotRight, plotBottom);
    ctx.closePath();
    ctx.fillStyle = gradWit;
    ctx.fill();

    // Withdrawals line
    ctx.beginPath();
    witPoints.forEach((val, index) => {
      const x = plotLeft + index * stepX;
      const y = yFor(val);
      index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Withdrawal dots
    witPoints.forEach((val, index) => {
      const x = plotLeft + index * stepX;
      const y = yFor(val);
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#111827";
      ctx.fill();
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

  }, [timeframe, flowPoints]);

  const netFlow = realStats.totalDeposits - realStats.totalWithdrawals;

  return (
    <div className="screen on" id="sc-admin-analytics">
      <div className="ph">
        <div>
          <h1>Platform Analytics</h1>
          <p>Financial flow metrics, KYC funnel, and PAMM pool performance.</p>
        </div>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${timeframe === "7d" ? "on" : ""}`} onClick={() => setTimeframe("7d")}>7 Days</button>
          <button className={`tab ${timeframe === "30d" ? "on" : ""}`} onClick={() => setTimeframe("30d")}>30 Days</button>
          <button className={`tab ${timeframe === "12m" ? "on" : ""}`} onClick={() => setTimeframe("12m")}>12 Months</button>
        </div>
      </div>

      {/* ── Overview Stat Cards ── */}
      <div className="g4 mb24">
        <div className="astat" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid var(--border2)" }}>
          <div className="astat-ic ic-blue" style={{ fontSize: "24px" }}><i className="ti ti-users"></i></div>
          <div>
            <div className="astat-lbl">Total Clients</div>
            <div className="astat-val">{realStats.totalUsers.toLocaleString()}</div>
            <div className="astat-sub" style={{ color: "var(--green)" }}>{realStats.verifiedUsers} verified</div>
          </div>
        </div>
        <div className="astat" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid var(--border2)" }}>
          <div className="astat-ic ic-green" style={{ fontSize: "24px" }}><i className="ti ti-wallet"></i></div>
          <div>
            <div className="astat-lbl">Total Wallet Balance</div>
            <div className="astat-val">${realStats.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <div className="astat-sub">All client wallets combined</div>
          </div>
        </div>
        <div className="astat" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid var(--border2)" }}>
          <div className="astat-ic ic-amber" style={{ fontSize: "24px" }}><i className="ti ti-chart-pie"></i></div>
          <div>
            <div className="astat-lbl">Total Platform AUM</div>
            <div className="astat-val">${Number(pammTotals.totalCapital ?? realStats.totalAUM ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <div className="astat-sub" style={{ color: "var(--green)" }}>Across all pools</div>
          </div>
        </div>
        <div className="astat" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid var(--border2)" }}>
          <div className="astat-ic ic-purple" style={{ fontSize: "24px" }}><i className="ti ti-arrows-exchange"></i></div>
          <div>
            <div className="astat-lbl">Net Capital Flow</div>
            <div className="astat-val" style={{ color: netFlow >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {netFlow >= 0 ? '+' : '-'}${Math.abs(netFlow).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="astat-sub">Deposits − Withdrawals</div>
          </div>
        </div>
      </div>

      {/* ── Financial Flow & KYC Funnel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[14px] mb20">
        {/* Financial Flow Card */}
        <div className="card lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="sh mb14">
              <div className="fal gap8">
                <span>💸 Financial Flow (Deposits vs Withdrawals)</span>
              </div>
              <span className="badge badge-mt5">{timeframe === "7d" ? "7 Days" : timeframe === "30d" ? "30 Days" : "12 Months"}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb16">
              <div className="scard" style={{ padding: "10px 12px" }}>
                <div className="scard-lbl">Total Deposits</div>
                <div className="scard-val" style={{ fontSize: "16px", color: "var(--green)" }}>${txSummary.totalDeposits.toLocaleString()}</div>
                <div className="scard-sub neutral"><i className="ti ti-arrow-down-left"></i> {txSummary.depositCount} transactions</div>
              </div>
              <div className="scard" style={{ padding: "10px 12px" }}>
                <div className="scard-lbl">Total Withdrawals</div>
                <div className="scard-val" style={{ fontSize: "16px", color: "var(--red)" }}>${txSummary.totalWithdrawals.toLocaleString()}</div>
                <div className="scard-sub neutral"><i className="ti ti-arrow-up-right"></i> {txSummary.withdrawalCount} transactions</div>
              </div>
              <div className="scard" style={{ padding: "10px 12px" }}>
                <div className="scard-lbl">Net Capital Flow</div>
                <div className="scard-val" style={{ fontSize: "16px", color: netFlow >= 0 ? "var(--green)" : "var(--red)" }}>
                  {netFlow >= 0 ? '+' : '-'}${Math.abs(netFlow).toLocaleString()}
                </div>
                <div className="scard-sub up"><i className="ti ti-trending-up"></i> Revenue Positive</div>
              </div>
              <div className="scard" style={{ padding: "10px 12px" }}>
                <div className="scard-lbl">Pending Queue</div>
                <div className="scard-val" style={{ fontSize: "16px", color: "var(--amber)" }}>{txSummary.pendingCount} Tx</div>
                <div className="scard-sub neutral"><i className="ti ti-clock"></i> Awaiting review</div>
              </div>
            </div>

            <div className="chart-wrap" style={{ marginTop: "12px" }}>
              <div className="mb-1 flex items-center justify-between px-1 text-[10px] text-[#64748B]"><span>USD amount</span><span>Approved transactions by period</span></div>
              <canvas ref={flowCanvasRef} aria-label={`Financial flow chart for ${timeframe === "7d" ? "7 days" : timeframe === "30d" ? "30 days" : "12 months"}`} style={{ width: "100%", height: "180px" }}></canvas>
              <div className="mt-1 flex justify-between px-1 text-[10px] text-[#64748B]" aria-hidden="true">
                {timeframe === "7d" ? <><span>7 days ago</span><span>Today</span></> : timeframe === "30d" ? <><span>30 days ago</span><span>15 days</span><span>Today</span></> : <><span>12 months ago</span><span>6 months</span><span>Today</span></>}
              </div>
            </div>
          </div>

          <div className="fal gap12 text-xs" style={{ marginTop: "12px", justifyContent: "flex-end" }}>
            <div className="fal gap4">
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--green)" }}></span>
              <span className="c-t2 font-semibold">Deposits (Inflow)</span>
            </div>
            <div className="fal gap4">
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--red)" }}></span>
              <span className="c-t2 font-semibold">Withdrawals (Outflow)</span>
            </div>
          </div>
        </div>

        {/* KYC Onboarding Funnel */}
        <div className="card lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="sh mb14">
              <span>📊 KYC Onboarding Funnel</span>
              <span className="badge badge-mt4">Live</span>
            </div>

            <div className="col gap14" style={{ marginTop: "8px" }}>
              {kycFunnel.map((item, index) => {
                let convFromPrev = "";
                let dropoff = "";
                if (index > 0 && kycFunnel[index - 1].count > 0) {
                  const prevCount = kycFunnel[index - 1].count;
                  const rate = ((item.count / prevCount) * 100).toFixed(1);
                  convFromPrev = `${rate}% conversion`;
                  dropoff = `-${(100 - parseFloat(rate)).toFixed(1)}% drop-off`;
                }

                return (
                  <div key={index} className="col gap4">
                    <div className="fb text-xs">
                      <div className="fal gap6">
                        <span className="fw6 c-text">{index + 1}. {item.step}</span>
                        <span className="c-t3" style={{ fontSize: "11px" }}>({item.label})</span>
                      </div>
                      <span className="td-mono fw7 c-text">{item.count.toLocaleString()}</span>
                    </div>

                    <div className="fal gap8">
                      <div className="prog" style={{ flex: 1, height: "8px", borderRadius: "4px" }}>
                        <div 
                          className="prog-fill" 
                          style={{ 
                            width: `${item.pct}%`, 
                            height: "100%", 
                            borderRadius: "4px",
                            background: index === 0 
                              ? "linear-gradient(90deg, var(--blue) 0%, var(--green) 100%)" 
                              : index === 1 
                              ? "var(--blue)" 
                              : index === 2 
                              ? "var(--green)" 
                              : "var(--cyan)"
                          }}
                        ></div>
                      </div>
                      <span className="td-mono text-xs fw6" style={{ width: "38px", textAlign: "right" }}>{item.pct}%</span>
                    </div>

                    {index > 0 && convFromPrev && (
                      <div className="fb text-xs c-t3" style={{ fontSize: "10.5px", paddingLeft: "4px" }}>
                        <span className="c-green fw5"><i className="ti ti-arrow-ramp-right"></i> {convFromPrev}</span>
                        <span className="c-red fw5"><i className="ti ti-arrow-bar-down"></i> {dropoff}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* KYC Pending Banner */}
          {realStats.pendingKyc > 0 && (
            <div className="alert alert-warning animate-fade-in" style={{ marginTop: "18px", padding: "8px 12px", marginBottom: 0 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: "18px" }}></i>
              <div style={{ flex: 1, fontSize: "11.5px" }}>
                <div className="fw6 text-slate-800">Compliance Review Required</div>
                <div className="c-t2">There are <strong className="mono">{realStats.pendingKyc} users</strong> awaiting manual document verification.</div>
              </div>
              <Link href="/kyc" className="btn btn-xs btn-warning" style={{ height: "26px", padding: "0 8px", fontSize: "11px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                Verify
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── PAMM Performance Overview ── */}
      {pammConfig && (
        <div className="card mb20">
          <div className="sh mb14">
            <div>
              <span>🏆 PAMM Pool Performance</span>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: "normal", color: "var(--t3)" }}>
                Active managed account pool with asset allocation breakdown
              </p>
            </div>
            <Link href="/pamm" className="btn btn-xs btn-outline" style={{ textDecoration: "none" }}>Manage Pool</Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb16">
            <div className="scard" style={{ padding: "10px 12px" }}>
              <div className="scard-lbl">Pool Name</div>
              <div className="scard-val" style={{ fontSize: "14px" }}>{pammConfig.poolName}</div>
            </div>
            <div className="scard" style={{ padding: "10px 12px" }}>
              <div className="scard-lbl">Monthly Return</div>
            <div className="scard-val" style={{ fontSize: "16px", color: Number(pammConfig.realizedPnl || 0) >= 0 ? "var(--green)" : "var(--red)" }}>{Number(pammConfig.realizedPnl || 0) >= 0 ? "+" : ""}{pammConfig.realizedPnl || 0}</div>
            </div>
            <div className="scard" style={{ padding: "10px 12px" }}>
              <div className="scard-lbl">Active Strategies</div>
              <div className="scard-val" style={{ fontSize: "16px" }}>{pammConfig.activeStrategies}</div>
            </div>
            <div className="scard" style={{ padding: "10px 12px" }}>
              <div className="scard-lbl">Risk Mode</div>
              <div className="scard-val" style={{ fontSize: "14px" }}>{pammConfig.riskMode}</div>
            </div>
          </div>

          {/* Allocation Breakdown */}
          {pammConfig.allocation && pammConfig.allocation.length > 0 && (
            <div>
              <div className="text-xs fw6 c-t2 mb8">Asset Allocation</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pammConfig.allocation.map((a: any, idx: number) => {
                  const colors = ["var(--blue)", "var(--green)", "var(--cyan)", "var(--purple)", "var(--amber)"];
                  return (
                    <div key={idx}>
                      <div className="fb text-xs mb4">
                        <span className="fw6">{a.label}</span>
                        <span className="td-mono fw6">{a.value}%</span>
                      </div>
                      <div className="prog">
                        <div className="prog-fill" style={{ width: `${a.value}%`, backgroundColor: colors[idx % colors.length] }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card mb20">
        <div className="sh mb14">
          <div>
            <span>PAMM Pool Performance</span>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: "normal", color: "var(--t3)" }}>Current accounting totals by pool</p>
          </div>
          <Link href="/pamm" className="btn btn-xs btn-outline" style={{ textDecoration: "none" }}>Open PAMM</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {pammAccounting.map((row) => {
            const pool = row.pool || {};
            const accounting = row.accounting || {};
            const pnl = Number(accounting.realizedPnl || 0);
            return <div className="scard" key={String(pool._id)}>
              <div className="fb"><div className="scard-lbl">{pool.poolName || 'PAMM pool'}</div><span className="badge badge-mt5">{pnl >= 0 ? 'Profit' : 'Loss'}</span></div>
              <div className="scard-val" style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{pnl >= 0 ? '+' : ''}{pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="scard-sub">Capital {Number(accounting.totalCapital || 0).toLocaleString()} · Pending {Number(accounting.pendingDistributionTotal || 0).toLocaleString()} · Paid {Number(accounting.paidDistributionTotal || 0).toLocaleString()}</div>
            </div>;
          })}
          {!pammAccounting.length && <div className="text-xs c-t3">No PAMM pool accounting data available.</div>}
        </div>
      </div>
    </div>
  );
}
