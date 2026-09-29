"use client";

import { Fragment, useEffect, useState } from "react";
import api from "@/services/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import PoolAccountingSummary from "@/components/pamm/PoolAccountingSummary";

type Allocation = { label: string; value: number };

type PammConfig = {
  _id: string;
  poolName: string;
  aum: number;
  monthlyReturn: number;
  activeStrategies: number;
  status: string;
  baseBalance: number;
  riskMode: string;
  reporting: string;
  allocation: Allocation[];
  updatedAt?: string;
  updatedBy?: string;
  distributionFeePercent: number;
};

type Investment = {
  _id: string;
  poolId?: PammConfig | string;
  poolNameSnapshot?: string;
  user?: { name?: string; email?: string; balance?: number };
  amount: number;
  status: string;
  profitShare: number;
  realizedPnl?: number;
  principalReturned?: number;
  notes?: string;
  createdAt: string;
  pendingProfit?: number;
  distributedProfit?: number;
  accounting?: { userShare?: number; userCurrentValue?: number; userPendingProfit?: number; userDistributedProfit?: number; totalCapital?: number; managerCapital?: number };
};

type TradeSymbol = {
  key: string;
  display: string;
  contractSize: number;
  precision: number;
  category: string;
};

type QuoteDiagnostic = {
  symbol: string;
  bid: number | null;
  ask: number | null;
  source?: string | null;
  feedInstrument?: string | null;
  providerTimestamp?: string | null;
  status?: string;
};

type SimTrade = {
  _id: string;
  poolId?: PammConfig;
  symbol: string;
  type: "Market" | "Limit" | "Stop";
  direction: "BUY" | "SELL";
  lots: number;
  leverage: number;
  contractSize: number;
  openPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  openTime: string;
  status: "Open" | "Closed";
  closePrice?: number;
  closeTime?: string;
  closeReason?: "SL" | "TP" | "Manual" | "Admin" | "StopOut";
  profit: number;
  settlementStatus?: string;
  distributionStatus?: string;
  distributionFee?: number;
  distributionFeePercentAtOpen?: number;
  eligibleParticipants?: TradeAllocation[];
  notes?: string;
  poolSummary?: {
    balance: number;
    equity: number;
    margin: number;
    freeMargin: number;
    marginLevel: number | null;
    riskStatus?: "Normal" | "Margin Call" | "Stop Out";
  };
  calculated?: {
    currentPrice: number | null;
    profit: number;
    swap: number;
    margin: number;
    notional: number;
    contractSize: number;
    displaySymbol: string;
    category?: string;
    bid?: number | null;
    ask?: number | null;
    quoteSource?: string | null;
    quoteUpdatedAt?: string | null;
    isPending?: boolean;
    isTriggered?: boolean;
  };
};

type TradeAllocation = {
  investment?: string | { _id: string; amount?: number; principalReturned?: number };
  participantType?: "Manager" | "Investor";
  managerCapital?: number;
  capitalAtOpen?: number;
  capitalAtClose?: number;
  user?: string | { name?: string; email?: string };
  allocationAtClose: number;
  allocatedProfit: number;
  allocatedLoss: number;
  netAllocation: number;
  grossAllocation?: number;
  feeAllocation?: number;
  distributionStatus?: string;
};

type AllocationPreview = {
  eligibilityTime?: string;
  totalCapital?: number;
  managerCapital?: number;
  investorCapital?: number;
  fee?: number;
  netProfit?: number;
  warnings?: string[];
  canBackfill?: boolean;
};

type TradeForm = {
  poolId: string;
  symbol: string;
  type: "Market" | "Limit" | "Stop";
  direction: "BUY" | "SELL";
  lots: number;
  leverage: number;
  openPrice: number;
  stopLoss: number;
  takeProfit: number;
  openTime: string;
  status: "Open" | "Closed";
  closePrice: number;
  profit?: number;
  closedAt?: string;
};

const defaultConfig: PammConfig = {
  _id: "",
  poolName: "AMG Robot PAMM Pool",
  aum: 2500000,
  monthlyReturn: 6.8,
  activeStrategies: 4,
  status: "Active",
  baseBalance: 0,
  riskMode: "Balanced",
  reporting: "Daily",
  allocation: [
    { label: "FX Basket", value: 42 },
    { label: "Metals", value: 24 },
    { label: "Indices", value: 18 },
    { label: "Crypto", value: 16 },
  ],
  distributionFeePercent: 0,
};

const money = (value: number) =>
  `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium" });

export default function PAMMManagement() {
  const { admin, loading: authLoading } = useAdminAuth();
  const [pools, setPools] = useState<PammConfig[]>([]);
  const [config, setConfig] = useState<PammConfig>({ ...defaultConfig, _id: "" } as PammConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(true);

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [poolAccountings, setPoolAccountings] = useState<Array<{ pool: PammConfig; accounting: any }>>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"config" | "investments" | "positions" | "trades">("config");
  const [simTrades, setSimTrades] = useState<SimTrade[]>([]);
  const [tradeSymbols, setTradeSymbols] = useState<TradeSymbol[]>([]);
  const [quoteDiagnostics, setQuoteDiagnostics] = useState<QuoteDiagnostic[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [tradeSaving, setTradeSaving] = useState(false);
  const [editingTrade, setEditingTrade] = useState<string | null>(null);
  const [editTradeSaving, setEditTradeSaving] = useState(false);
  const [editTradeForm, setEditTradeForm] = useState<TradeForm>({
    poolId: "",
    symbol: "XAU/USD",
    type: "Market",
    direction: "BUY",
    lots: 0.1,
    leverage: 200,
    openPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    openTime: new Date().toISOString().slice(0, 16),
    status: "Open",
    closePrice: 0,
  });
  const [tradeForm, setTradeForm] = useState<TradeForm>({
    poolId: "",
    symbol: "XAU/USD",
    type: "Market",
    direction: "BUY",
    lots: 0.1,
    leverage: 200,
    openPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    openTime: new Date().toISOString().slice(0, 16),
    status: "Open",
    closePrice: 0,
  });



  const [allocationTrade, setAllocationTrade] = useState<SimTrade | null>(null);
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [allocationLegacy, setAllocationLegacy] = useState(false);
  const [allocationCanBackfill, setAllocationCanBackfill] = useState(false);
  const [allocationNotice, setAllocationNotice] = useState("");
  const [allocationPreview, setAllocationPreview] = useState<AllocationPreview | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!admin) {
      setLoading(false);
      return;
    }

    let alive = true;
    let requestFinished = false;
    const loadConfig = async () => {
      try {
        setMessage("");
        setMessageOk(true);
        const [res, accountingRes] = await Promise.all([
          api.get("/pamm/pools", { timeout: 15000 }),
          api.get("/admin/pamm/accounting", { timeout: 15000 }).catch(() => ({ data: { pools: [] } })),
        ]);
        if (!alive) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setPools(list);
        const first = list[0];
        setConfig(first ? { ...defaultConfig, ...first } : { ...defaultConfig, _id: "" } as PammConfig);
        setPoolAccountings(Array.isArray(accountingRes.data?.pools) ? accountingRes.data.pools : []);
      } catch (error: any) {
        if (!alive) return;
        setMessage(error?.response?.data?.message || "Unable to load PAMM pools.");
        setMessageOk(false);
      } finally {
        requestFinished = true;
        if (!alive) return;
        setLoading(false);
      }
    };

    loadConfig();
    const timeout = window.setTimeout(() => {
      if (alive && !requestFinished) {
        setLoading(false);
        setMessage("PAMM load timed out. Check the backend response.");
        setMessageOk(false);
      }
    }, 16000);

    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [admin, authLoading]);

  useEffect(() => {
    if (authLoading || !admin) return;
    if (activeTab === "investments") fetchInvestments();
    if (activeTab === "positions" || activeTab === "trades") {
      fetchSimTrades();
      const interval = setInterval(() => {
        api.get("/admin/market/quotes", { timeout: 8000 })
          .then((res) => {
            if (Array.isArray(res.data?.quotes)) setQuoteDiagnostics(res.data.quotes);
          })
          .catch(() => {});
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, admin, authLoading]);

  useEffect(() => {
    if (!tradeForm.poolId && config._id) {
      setTradeForm((prev) => ({ ...prev, poolId: config._id }));
    }
  }, [config._id, tradeForm.poolId]);



  const fetchInvestments = async () => {
    setInvLoading(true);
    try {
      const [res, accountingRes] = await Promise.all([
        api.get("/admin/pamm/investments", { timeout: 15000 }),
        api.get("/admin/pamm/accounting", { timeout: 15000 }).catch(() => ({ data: { pools: [] } })),
      ]);
      const accountingRows = Array.isArray(accountingRes.data?.pools) ? accountingRes.data.pools : [];
      const apiInvestments = Array.isArray(res.data?.investments)
        ? res.data.investments
        : Array.isArray(res.data) ? res.data : [];
      // Some deployments return the canonical accounting envelope before the
      // legacy investment list is available. Keep the admin view useful while
      // preserving the investment id and participant identity from accounting.
      const accountingFallback = accountingRows.flatMap(({ pool, accounting }: { pool: PammConfig; accounting: any }) =>
        (accounting?.participants || [])
          .filter((participant: any) => participant.participantType === "Investor" && participant.investment)
          .map((participant: any) => ({
            _id: String(participant.investment),
            poolId: pool,
            poolNameSnapshot: pool?.poolName,
            user: participant.user,
            amount: Number(participant.currentValue || participant.capital || 0),
            principalReturned: 0,
            realizedPnl: Number(participant.realizedPnl || 0),
            pendingProfit: Number(participant.pendingProfit || 0),
            distributedProfit: Number(participant.distributedProfit || 0),
            profitShare: Number(participant.realizedPnl || 0),
            status: "Active",
            createdAt: pool?.updatedAt || new Date().toISOString(),
            accounting: {
              userShare: Number(participant.sharePercentage || participant.share || 0),
              userCurrentValue: Number(participant.currentValue || participant.capital || 0),
              userPendingProfit: Number(participant.pendingProfit || 0),
              userDistributedProfit: Number(participant.distributedProfit || 0),
            },
          }))
      );
      const visibleInvestments = apiInvestments.length ? apiInvestments : accountingFallback;
      setInvestments(visibleInvestments);
      setTotalInvested(Number(res.data?.totalInvested || accountingRows.reduce((sum: number, row: any) => sum + Number(row.accounting?.investorCapital || 0), 0)));
      setPoolAccountings(accountingRows);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Unable to load PAMM investments.");
      setMessageOk(false);
    } finally {
      setInvLoading(false);
    }
  };

  const fetchSimTrades = async () => {
    setTradesLoading(true);
    try {
      const [tradesRes, symbolsRes] = await Promise.all([
        api.get("/admin/pamm/trades", { timeout: 15000 }),
        api.get("/pamm/trade-symbols", { timeout: 15000 }),
      ]);
      api.get("/admin/market/quotes", { timeout: 15000 }).then((res) => setQuoteDiagnostics(Array.isArray(res.data?.quotes) ? res.data.quotes : [])).catch(() => setQuoteDiagnostics([]));
      setSimTrades(Array.isArray(tradesRes.data) ? tradesRes.data : []);
      const symbols = Array.isArray(symbolsRes.data) ? symbolsRes.data : [];
      setTradeSymbols(symbols);
      setTradeForm((prev) => ({
        ...prev,
        poolId: prev.poolId || config._id || pools[0]?._id || "",
        symbol: prev.symbol || symbols[0]?.display || "XAU/USD",
      }));
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Unable to load PAMM trades.");
      setMessageOk(false);
    } finally {
      setTradesLoading(false);
    }
  };

  const reviewTradeAllocation = async (trade: SimTrade) => {
    setAllocationLoading(true);
    try {
      const res = await api.get(`/admin/pamm/trades/${trade._id}/allocations`);
      setAllocationTrade({ ...trade, ...(res.data.trade || {}), eligibleParticipants: res.data.allocations || [] });
      setAllocationLegacy(Boolean(res.data.isLegacy));
      setAllocationCanBackfill(Boolean(res.data.canBackfill));
      setAllocationPreview(res.data.preview || null);
      setAllocationNotice((res.data.preview?.warnings || []).join(" "));
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Unable to load trade allocation.");
      setMessageOk(false);
    } finally { setAllocationLoading(false); }
  };

  const backfillTrade = async () => {
    if (!allocationTrade || !window.confirm("Create and settle the permanent allocation snapshot for this historical trade?")) return;
    setAllocationLoading(true);
    try {
      const res = await api.post(`/admin/pamm/trades/${allocationTrade._id}/allocations/backfill`, { confirm: true });
      setAllocationTrade({ ...allocationTrade, ...(res.data.trade || {}) });
      setAllocationLegacy(false);
      setAllocationCanBackfill(false);
      setAllocationNotice("");
      setAllocationPreview(null);
      await fetchSimTrades();
      setMessage("Historical allocation snapshot created and settled.");
      setMessageOk(true);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Unable to backfill trade allocation.");
      setMessageOk(false);
    } finally { setAllocationLoading(false); }
  };

  const distributeTrade = async (investmentId?: string) => {
    if (!allocationTrade) return;
    setAllocationLoading(true);
    try {
      await api.post(`/admin/pamm/trades/${allocationTrade._id}/distribute`, { note: "Admin-approved trade profit distribution", ...(investmentId ? { investmentId } : {}) });
      setAllocationTrade(null);
      await fetchSimTrades();
      setMessage(investmentId ? "Investor profit allocated successfully." : "Trade profit distribution completed.");
      setMessageOk(true);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Unable to distribute trade profit.");
      setMessageOk(false);
    } finally { setAllocationLoading(false); }
  };

  const reverseTrade = async () => {
    if (!allocationTrade || !window.confirm("Reverse this settlement? Wallet credits and investment P/L will be undone.")) return;
    setAllocationLoading(true);
    try { await api.post(`/admin/pamm/trades/${allocationTrade._id}/reverse`); setAllocationTrade(null); await fetchSimTrades(); setMessage("Trade settlement reversed."); setMessageOk(true); }
    catch (error: any) { setMessage(error?.response?.data?.message || "Unable to reverse settlement."); setMessageOk(false); }
    finally { setAllocationLoading(false); }
  };

  const resetTradeForm = () => {
    setEditingTrade(null);
    setTradeForm({
      poolId: config._id || pools[0]?._id || "",
      symbol: tradeSymbols[0]?.display || "XAU/USD",
      type: "Market",
      direction: "BUY",
      lots: 0.1,
      leverage: 200,
      openPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      openTime: new Date().toISOString().slice(0, 16),
      status: "Open",
      closePrice: 0,
    });
  };

  const editSimTrade = (trade: SimTrade) => {
    setEditingTrade(trade._id);
    setEditTradeForm({
      poolId: trade.poolId?._id || "",
      symbol: trade.symbol,
      type: trade.type || "Market",
      direction: trade.direction,
      lots: Number(trade.lots || 0.1),
      leverage: Number(trade.leverage || 200),
      openPrice: Number(trade.openPrice || 0),
      stopLoss: Number(trade.stopLoss || 0),
      takeProfit: Number(trade.takeProfit || 0),
      openTime: new Date(trade.openTime).toISOString().slice(0, 16),
      status: trade.status,
      closePrice: Number(trade.closePrice || 0),
    });
  };

  const saveSimTrade = async () => {
    if (!tradeForm.poolId) {
      setMessage("Select a PAMM pool before posting a simulated trade.");
      setMessageOk(false);
      return;
    }
    setTradeSaving(true);
    try {
      const symbolSpec = tradeSymbols.find((symbol) => symbol.display === tradeForm.symbol || symbol.key === tradeForm.symbol);
      const payload = {
        ...tradeForm,
        symbol: symbolSpec?.display || tradeForm.symbol,
        contractSize: symbolSpec?.contractSize,
        lots: Number(tradeForm.lots || 0),
        leverage: Number(tradeForm.leverage || 0),
        openPrice: Number(tradeForm.openPrice || 0),
        stopLoss: Number(tradeForm.stopLoss || 0) || undefined,
        takeProfit: Number(tradeForm.takeProfit || 0) || undefined,
        closePrice: Number(tradeForm.closePrice || 0),
        openTime: new Date(tradeForm.openTime).toISOString(),
        closedAt: tradeForm.closedAt ? new Date(tradeForm.closedAt).toISOString() : undefined,
        notes: "",
      };
      await api.post("/admin/pamm/trades", payload);
      setMessage("");
      window.setTimeout(() => {
        setMessage("Position posted successfully.");
        setMessageOk(true);
        window.setTimeout(() => setMessage(""), 4000);
      }, 0);
      resetTradeForm();
      await fetchSimTrades();
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.response?.data?.message || error?.message || "Unable to save simulated position.";
      setMessage(errMsg);
      setMessageOk(false);
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setTradeSaving(false);
    }
  };

  const saveEditSimTrade = async () => {
    if (!editTradeForm.poolId) return;
    setEditTradeSaving(true);
    try {
      const symbolSpec = tradeSymbols.find((symbol) => symbol.display === editTradeForm.symbol || symbol.key === editTradeForm.symbol);
      const payload = {
        ...editTradeForm,
        symbol: symbolSpec?.display || editTradeForm.symbol,
        contractSize: symbolSpec?.contractSize,
        lots: Number(editTradeForm.lots || 0),
        leverage: Number(editTradeForm.leverage || 0),
        openPrice: Number(editTradeForm.openPrice || 0),
        stopLoss: Number(editTradeForm.stopLoss || 0) || undefined,
        takeProfit: Number(editTradeForm.takeProfit || 0) || undefined,
        closePrice: Number(editTradeForm.closePrice || 0),
        openTime: new Date(editTradeForm.openTime).toISOString(),
        notes: "",
      };
      await api.put(`/admin/pamm/trades/${editingTrade}`, payload);
      setMessage("Simulated position updated.");
      setMessageOk(true);
      setEditingTrade(null);
      await fetchSimTrades();
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.response?.data?.message || error?.message || "Unable to update simulated position.";
      setMessage(errMsg);
      setMessageOk(false);
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setEditTradeSaving(false);
    }
  };

  const deleteSimTrade = async (id: string) => {
    if (!window.confirm("Delete this simulated position?")) return;
    try {
      await api.delete(`/admin/pamm/trades/${id}`);
      await fetchSimTrades();
      setMessage("Simulated position deleted.");
      setMessageOk(true);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Unable to delete simulated position.");
      setMessageOk(false);
    }
  };

  const updateField = (field: keyof PammConfig, value: string | number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const updateAllocation = (index: number, field: keyof Allocation, value: string | number) => {
    setConfig((prev) => ({
      ...prev,
      allocation: prev.allocation.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    }));
  };

  const addAllocation = () => {
    setConfig((prev) => ({
      ...prev,
      allocation: [...prev.allocation, { label: "New Segment", value: 0 }],
    }));
  };

  const removeAllocation = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      allocation: prev.allocation.filter((_, idx) => idx !== index),
    }));
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        ...config,
        aum: Number(config.aum || 0),
        monthlyReturn: Number(config.monthlyReturn || 0),
        activeStrategies: Number(config.activeStrategies || 0),
        allocation: config.allocation.map((item) => ({
          label: item.label,
          value: Number(item.value || 0),
        })),
      };
      const res = await api.put("/pamm/config", payload);
      setConfig({ ...defaultConfig, ...res.data });
      setPools((prev) => prev.map((pool) => (pool._id === res.data._id ? { ...pool, ...res.data } : pool)));
      setMessage("PAMM pool configuration saved successfully.");
      setMessageOk(true);
    } catch {
      setMessage("Unable to save PAMM configuration.");
      setMessageOk(false);
    } finally {
      setSaving(false);
    }
  };

  const createPool = async () => {
    setCreating(true);
    try {
      const payload = {
        ...config,
        aum: Number(config.aum || 0),
        monthlyReturn: Number(config.monthlyReturn || 0),
        activeStrategies: Number(config.activeStrategies || 0),
        allocation: config.allocation.map((item) => ({
          label: item.label,
          value: Number(item.value || 0),
        })),
      };
      const res = await api.post("/pamm/pools", payload);
      setPools((prev) => [res.data, ...prev]);
      setConfig({ ...defaultConfig, ...res.data });
      setMessage("New PAMM pool created successfully.");
      setMessageOk(true);
      setTimeout(() => setMessage(''), 4000);
    } catch (error: any) {
      setMessage(error?.response?.data?.error || "Unable to create PAMM pool.");
      setMessageOk(false);
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setCreating(false);
    }
  };

  const updatePool = async () => {
    if (!config._id) return;
    setCreating(true);
    try {
      const payload = {
        ...config,
        aum: Number(config.aum || 0),
        monthlyReturn: Number(config.monthlyReturn || 0),
        activeStrategies: Number(config.activeStrategies || 0),
        allocation: config.allocation.map((item) => ({
          label: item.label,
          value: Number(item.value || 0),
        })),
      };
      const res = await api.put(`/admin/pamm/pools/${config._id}`, payload);
      setPools((prev) => prev.map(p => p._id === config._id ? res.data : p));
      setMessage("PAMM pool updated successfully.");
      setMessageOk(true);
      setTimeout(() => setMessage(''), 4000);
    } catch (error: any) {
      setMessage(error?.response?.data?.error || "Unable to update PAMM pool.");
      setMessageOk(false);
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setCreating(false);
    }
  };

  const deletePool = async () => {
    if (!config._id) return;
    if (!window.confirm("Are you sure you want to delete this pool? This cannot be undone.")) return;
    setCreating(true);
    try {
      await api.delete(`/admin/pamm/pools/${config._id}`);
      setPools((prev) => prev.filter(p => p._id !== config._id));
      setConfig(defaultConfig);
      setMessage("PAMM pool deleted successfully.");
      setMessageOk(true);
      setTimeout(() => setMessage(''), 4000);
    } catch (error: any) {
      setMessage(error?.response?.data?.error || "Unable to delete PAMM pool.");
      setMessageOk(false);
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setCreating(false);
    }
  };

  const startNewPool = () => {
    setConfig({ ...defaultConfig, _id: "" } as PammConfig);
  };

  const handleApproveInvestment = async (id: string) => {
    try {
      await api.put(`/admin/pamm/investments/${id}/approve`);
      await fetchInvestments();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to approve');
    }
  };

  const handleRejectInvestment = async (id: string) => {
    try {
      await api.put(`/admin/pamm/investments/${id}/reject`);
      await fetchInvestments();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to reject');
    }
  };

  const allocationTotal = config.allocation.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const selectedPoolAccounting = poolAccountings.find((item) => String(item.pool?._id) === String(config._id));
  const selectedPoolClientInvestment = Number(selectedPoolAccounting?.accounting?.investorCapital || 0);
  const selectedPoolActiveInvCount = Number(selectedPoolAccounting?.accounting?.activeInvestorCount || 0);
  const selectedPoolProfitGenerated = Number(selectedPoolAccounting?.accounting?.realizedPnl || (config as any).realizedPnl || 0);

  if (loading) {
    return <div className="screen on">Loading PAMM configuration...</div>;
  }

  if (!admin) {
    return (
      <div className="screen on">
        <div className="card">
          <div className="sh mb8">Admin session required</div>
          <p className="text-sm c-t2">Please sign in again to load PAMM pools and investment data.</p>
        </div>
      </div> 
    );
  }

  return (
    <div className="screen on" id="sc-admin-pamm">
      {message && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white border border-[#E5E7EB] transition-all duration-300">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${messageOk ? 'bg-[#059669]/10 text-[#059669]' : 'bg-[#DC2626]/10 text-[#DC2626]'}`}>
            <i className={`ti ${messageOk ? 'ti-check' : 'ti-alert-circle'} text-lg`}></i>
          </div>
          <div className="text-sm font-semibold text-[#111827] max-w-sm">
            {message}
          </div>
          <button className="ml-2 text-[#9CA3AF] hover:text-[#4B5563] p-1" onClick={() => setMessage('')}>
            <i className="ti ti-x"></i>
          </button>
        </div>
      )}

      <div className="ph">
        <div>
          <h1>PAMM Management</h1>
          <p>Control pool settings and manually distribute profits to client investors.</p>
        </div>
        <div className="fal gap8">
          {activeTab === "config" && (
            <button className="btn btn-outline btn-sm" onClick={startNewPool}>
              <i className="ti ti-plus"></i> Create New Pool
            </button>
          )}
          {activeTab === "investments" && (
            <button className="btn btn-outline btn-sm" onClick={fetchInvestments}>
              <i className="ti ti-refresh"></i> Refresh
            </button>
          )}
          {activeTab === "trades" && (
            <button className="btn btn-outline btn-sm" onClick={fetchSimTrades}>
              <i className="ti ti-refresh"></i> Refresh
            </button>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="tabs mb20">
        <button className={`tab ${activeTab === "config" ? "on" : ""}`} onClick={() => setActiveTab("config")}>
          <i className="ti ti-settings" style={{ fontSize: "13px", marginRight: "4px" }} />
          Pool Configuration
        </button>
        <button className={`tab ${activeTab === "investments" ? "on" : ""}`} onClick={() => setActiveTab("investments")}>
          <i className="ti ti-users" style={{ fontSize: "13px", marginRight: "4px" }} />
          Client Investments
        </button>
        <button className={`tab ${activeTab === "positions" ? "on" : ""}`} onClick={() => setActiveTab("positions")}>
          <i className="ti ti-plus" style={{ fontSize: "13px", marginRight: "4px" }} />
          Post Position
        </button>
        <button className={`tab ${activeTab === "trades" ? "on" : ""}`} onClick={() => setActiveTab("trades")}>
          <i className="ti ti-chart-candle" style={{ fontSize: "13px", marginRight: "4px" }} />
          Trades & Allocation
        </button>
      </div>

      {/* Pool Configuration Tab */}
      {activeTab === "config" && (
        <div className="flex flex-col gap-5">
          <div className="g4">
            <div className="astat">
              <div className="astat-ic ic-blue"><i className="ti ti-trending-up"></i></div>
              <div>
                <div className="astat-lbl">Displayed Pool AUM</div>
                <div className="astat-val">{money(config.aum)}</div>
                <div className="astat-sub">Visible to clients</div>
              </div>
            </div>
            <div className="astat">
              <div className="astat-ic ic-green"><i className="ti ti-percentage"></i></div>
              <div>
                <div className="astat-lbl">Monthly Return</div>
                <div className="astat-val">{Number(config.monthlyReturn || 0).toFixed(2)}%</div>
                <div className="astat-sub">Dashboard display</div>
              </div>
            </div>
            <div className="astat">
              <div className="astat-ic ic-purple"><i className="ti ti-wallet"></i></div>
              <div>
                <div className="astat-lbl">Pool Client Investment</div>
                <div className="astat-val">{money(selectedPoolClientInvestment)}</div>
                <div className="astat-sub">{selectedPoolActiveInvCount} active investment{selectedPoolActiveInvCount === 1 ? "" : "s"} in selected pool</div>
              </div>
            </div>
            <div className="astat">
              <div className="astat-ic ic-amber"><i className="ti ti-chart-line"></i></div>
              <div>
                <div className="astat-lbl">Pool Profit Generated</div>
                <div className="astat-val" style={{ color: selectedPoolProfitGenerated >= 0 ? "var(--green)" : "var(--red)" }}>{money(selectedPoolProfitGenerated)}</div>
                <div className="astat-sub">Realized P/L for selected pool</div>
              </div>
            </div>
          </div>

          {/* 1. Existing PAMM Pools (4-column grid) */}
          <div className="card">
            <div className="fb mb-4">
              <div>
                <div className="sh" style={{ margin: 0 }}>Existing PAMM Pools</div>
                <div className="text-xs c-t3 mt-1">Select a pool to edit its configuration or create a new one.</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setConfig(defaultConfig)}>
                <i className="ti ti-plus"></i> New Pool
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {pools.map((pool) => {
                const isActive = config._id === pool._id;
                return (
                  <button
                    key={pool._id}
                    onClick={() => setConfig({ ...defaultConfig, ...pool })}
                    className={`flex flex-col items-start p-4 rounded-xl transition-all duration-200 text-left ${
                      isActive 
                        ? 'border-2 border-[#C3D634] bg-[#C3D634]/5 shadow-sm' 
                        : 'border border-[#E5E7EB] hover:border-[#C3D634]/50 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-[13px] font-bold text-[#111827] mb-1">{pool.poolName}</div>
                    <div className="text-[11px] text-[#6B7280] font-medium flex items-center justify-between w-full">
                      <span>{pool.status}</span>
                      <span className="font-mono text-[#059669]">{money(pool.aum)}</span>
                    </div>
                  </button>
                );
              })}
              {pools.length === 0 && (
                <div className="col-span-full p-4 border border-dashed border-[#E5E7EB] rounded-lg text-center text-[12px] text-[#6B7280]">
                  No pools found. Create your first pool to get started.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 mb-5">
            {/* 2. Configuration Form */}
            <div className="card flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div>
                  <div className="sh" style={{ margin: 0 }}>Pool Setup & Parameters</div>
                  <div className="text-xs c-t3 mt-1">Configure the operational and display settings for this pool.</div>
                </div>
                <div className="flex gap-2">
                  {config._id ? (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={updatePool} disabled={creating}>
                        <i className="ti ti-device-floppy"></i> {creating ? "Saving..." : "Save Changes"}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={deletePool} disabled={creating}>
                        <i className="ti ti-trash"></i> Delete
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={createPool} disabled={creating}>
                      <i className="ti ti-plus"></i> {creating ? "Creating..." : "Create Pool"}
                    </button>
                  )}
                </div>
              </div>

              {/* Categorized Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-6">
                
                {/* General Setup */}
                <div className="col-span-1 md:col-span-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">General Setup</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label>
                      <div className="text-xs font-semibold text-[#374151] mb-1.5">Pool Name</div>
                      <input className="input w-full" placeholder="e.g. Alpha Growth Fund" value={config.poolName} onChange={(e) => updateField("poolName", e.target.value)} />
                    </label>
                    <label>
                      <div className="text-xs font-semibold text-[#374151] mb-1.5">Pool Status</div>
                      <select className="input w-full" value={config.status} onChange={(e) => updateField("status", e.target.value)}>
                        <option>Active</option>
                        <option>Paused</option>
                        <option>Closed</option>
                      </select>
                    </label>
                  </div>
                  {/* Base Balance row */}
                  <div className="mt-4">
                    <label>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-xs font-semibold text-[#374151]">Pool Base Balance ($)</div>
                        <div className="text-[10px] text-[#6B7280] font-medium">Seeded capital added to MT5 account balance</div>
                      </div>
                      <input
                        className="input w-full font-mono"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={config.baseBalance || ""}
                        onChange={(e) => updateField("baseBalance", e.target.value === '' ? 0 : Number(e.target.value))}
                      />
                    </label>
                  </div>
                  <div className="mt-4">
                    <label>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-xs font-semibold text-[#374151]">Profit distribution fee (%)</div>
                        <div className="text-[10px] text-[#6B7280] font-medium">Applied to future profitable trades</div>
                      </div>
                      <input className="input w-full font-mono" type="number" min="0" max="100" step="0.01" value={config.distributionFeePercent ?? 0} onChange={(e) => updateField("distributionFeePercent", Number(e.target.value || 0))} />
                    </label>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="col-span-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">Performance Metrics</div>
                  <div className="flex flex-col gap-4">
                    <label>
                      <div className="text-xs font-semibold text-[#374151] mb-1.5">Displayed AUM ($)</div>
                      <input className="input w-full font-mono" type="number" placeholder="1000000" value={config.aum || ""} onChange={(e) => updateField("aum", e.target.value === '' ? 0 : Number(e.target.value))} />
                    </label>
                    <label>
                      <div className="text-xs font-semibold text-[#374151] mb-1.5">Monthly Return (%)</div>
                      <input className="input w-full font-mono" type="number" step="0.01" placeholder="5.25" value={config.monthlyReturn || ""} onChange={(e) => updateField("monthlyReturn", e.target.value === '' ? 0 : Number(e.target.value))} />
                    </label>
                  </div>
                </div>

                {/* Risk & Strategy */}
                <div className="col-span-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">Risk & Strategy</div>
                  <div className="flex flex-col gap-4">
                    <label>
                      <div className="text-xs font-semibold text-[#374151] mb-1.5">Risk Mode</div>
                      <select className="input w-full" value={config.riskMode} onChange={(e) => updateField("riskMode", e.target.value)}>
                        <option>Conservative</option>
                        <option>Balanced</option>
                        <option>Aggressive</option>
                      </select>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label>
                        <div className="text-xs font-semibold text-[#374151] mb-1.5">Active Strategies</div>
                        <input className="input w-full font-mono" type="number" placeholder="3" value={config.activeStrategies || ""} onChange={(e) => updateField("activeStrategies", e.target.value === '' ? 0 : Number(e.target.value))} />
                      </label>
                      <label>
                        <div className="text-xs font-semibold text-[#374151] mb-1.5">Reporting</div>
                        <select className="input w-full" value={config.reporting} onChange={(e) => updateField("reporting", e.target.value)}>
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              {/* Allocation Mix inside form */}
              <div className="mt-2 pt-5 border-t border-[#E5E7EB]">
                <div className="fb mb-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Asset Allocation Mix</div>
                  <div className="flex items-center gap-3">
                    <div className={`text-[11px] font-bold px-2 py-0.5 rounded ${allocationTotal === 100 ? "bg-[#059669]/10 text-[#059669]" : "bg-[#F59E0B]/10 text-[#B45309]"}`}>
                      Total: {allocationTotal.toFixed(0)}% {allocationTotal !== 100 && "⚠️"}
                    </div>
                    <button className="btn btn-outline btn-xs" onClick={addAllocation}>+ Add Segment</button>
                  </div>
                </div>
                <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                  <table className="!m-0 w-full text-sm">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-[#6B7280]">Segment Label</th>
                        <th className="px-3 py-2 text-right text-xs text-[#6B7280] w-[140px]">Percent (%)</th>
                        <th className="px-3 py-2 text-right text-xs text-[#6B7280] w-[80px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.allocation.map((item, index) => (
                        <tr key={`${item.label}-${index}`} className="border-t border-[#E5E7EB]">
                          <td className="px-2 py-1.5">
                            <input className="input w-full text-sm py-1.5" value={item.label} onChange={(e) => updateAllocation(index, "label", e.target.value)} />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              className="input w-full text-sm py-1.5 font-mono text-right"
                              type="number"
                              value={item.value || ""}
                              onChange={(e) => updateAllocation(index, "value", e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <button className="text-[#DC2626] hover:bg-[#DC2626]/10 p-1.5 rounded" onClick={() => removeAllocation(index)}>
                              <i className="ti ti-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 3. Live Summary / Dashboard Preview */}
            <div className="card h-fit sticky top-5 bg-[#F8FAFC]">
              <div className="sh mb-4 border-b border-[#E5E7EB] pb-3">Client Dashboard Preview</div>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mb-1">Fund Name</div>
                  <div className="text-lg font-bold text-[#111827]">{config.poolName || "Unnamed Pool"}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-[#E5E7EB]">
                    <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mb-1">AUM</div>
                    <div className="font-mono font-bold text-[#059669] text-[15px]">{money(config.aum)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#E5E7EB]">
                    <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mb-1">Return /mo</div>
                    <div className="font-mono font-bold text-[#2F80ED] text-[15px]">+{Number(config.monthlyReturn || 0).toFixed(2)}%</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-[#6B7280]">Status</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${config.status === 'Active' ? 'bg-[#C3D634]/20 text-[#4D5A12]' : 'bg-[#E5E7EB] text-[#6B7280]'}`}>{config.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-[#6B7280]">Risk Profile</span>
                    <span className="font-medium text-[#111827]">{config.riskMode}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-[#6B7280]">Reporting</span>
                    <span className="font-medium text-[#111827]">{config.reporting}</span>
                  </div>
                </div>
                
                {config.updatedAt && (
                  <div className="mt-4 pt-3 border-t border-[#E5E7EB] text-[10px] text-[#9CA3AF] text-center">
                    Last updated {new Date(config.updatedAt).toLocaleString()}
                    {config.updatedBy && <span> by {config.updatedBy}</span>}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Client Investments Tab */}
      {activeTab === "investments" && (
        <div className="card">
          <div className="fb mb14">
            <div>
              <div className="sh" style={{ margin: 0 }}>Client Investments</div>
              <div className="text-xs c-t3 mt-1">Review and manage client requests to invest in a PAMM pool.</div>
            </div>
            {(() => {
              const pendingCount = investments.filter(i => i.status === "Pending").length;
              return pendingCount > 0 ? (
                <span className="st st-pending">{pendingCount} awaiting review</span>
              ) : null;
            })()}
          </div>

          {invLoading ? (
            <div className="text-xs c-t3 p-6 text-center">Loading investment requests...</div>
          ) : investments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-[#E5E7EB] rounded-xl">
              <i className="ti ti-circle-check text-3xl text-[#059669] mb-3"></i>
              <div className="text-sm font-semibold text-[#111827]">No investments found</div>
              <div className="text-xs c-t3 mt-1">Clients have not submitted any investment requests yet.</div>
            </div>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Pool</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th>Submitted</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {investments
                    .map((inv) => (
                      <tr key={inv._id}>
                        <td>
                          <div className="fw6 text-sm">{inv.user?.name || "—"}</div>
                          <div className="text-xs c-t3">{inv.user?.email || "—"}</div>
                        </td>
                        <td>
                          <div className="text-sm fw6">{typeof inv.poolId === "object" ? inv.poolId?.poolName : inv.poolNameSnapshot || "—"}</div>
                          <div className="text-xs c-t3">Investment #{inv._id.slice(-8).toUpperCase()}</div>
                        </td>
                        <td className="mono fw7 val-pos" style={{ textAlign: "right" }}>{money(inv.amount)}</td>
                        <td className="text-xs c-t3">{fmtDate(inv.createdAt)}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`st ${inv.status === "Active" ? "st-approved" : inv.status === "Rejected" ? "st-rejected" : "st-pending"}`}>{inv.status}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {inv.status === "Pending" ? (
                            <div className="fal gap8 justify-end">
                              <button
                                className="btn btn-success btn-xs"
                                onClick={() => handleApproveInvestment(inv._id)}
                              >
                                <i className="ti ti-check" /> Approve
                              </button>
                              <button
                                className="btn btn-danger btn-xs"
                                onClick={() => handleRejectInvestment(inv._id)}
                              >
                                <i className="ti ti-x" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs c-t3">{inv.status === "Active" ? "Approved" : "—"}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Trades and Allocation Tab */}
      {(activeTab === "positions" || activeTab === "trades") && (
        <>
          {activeTab === "positions" && <div className="pamm-workflow-note mb-4"><strong>Position posting</strong><span>Choose a pool, enter the execution details, then post the simulated position. Allocation and distribution are managed in the separate Trades & Allocation tab.</span></div>}
          {activeTab === "positions" && (
            <div className="flex flex-col items-center w-full">
              {quoteDiagnostics.length > 0 && (
                <div className="mb-4 w-full max-w-[820px] rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold text-[#334155]">Live Feed & Market Prices</div>
                    <div className="text-[10px] text-[#64748B]">Provider timestamps in local time · Click pair to select</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8">
                    {quoteDiagnostics.map((quote) => {
                      const matched = tradeSymbols.find(s => s.key.toLowerCase() === quote.symbol.toLowerCase() || s.display.toLowerCase().replace(/[^a-z0-9]/g, '') === quote.symbol.toLowerCase().replace(/[^a-z0-9]/g, ''));
                      const isSelected = matched && tradeForm.symbol === matched.display;
                      return (
                        <div
                          key={quote.symbol}
                          onClick={() => {
                            if (matched) {
                              setTradeForm(prev => ({ ...prev, symbol: matched.display }));
                            }
                          }}
                          className={`cursor-pointer rounded-md border p-2 transition-all ${
                            isSelected 
                              ? 'border-[#2F80ED] bg-[#2F80ED]/5 shadow-sm ring-1 ring-[#2F80ED]' 
                              : 'border-[#E2E8F0] bg-white hover:border-[#2F80ED]/50 hover:bg-slate-50'
                          }`}
                          title="Click to select this instrument"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-[#334155]">{quote.symbol.toUpperCase()}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#2F80ED]"></span>}
                          </div>
                          <div className="mt-1 font-mono text-[11px] font-medium">{quote.bid ?? "—"} / {quote.ask ?? "—"}</div>
                          <div className="mt-1 truncate text-[9px] text-[#64748B]">{quote.source || "Unavailable"} · {quote.providerTimestamp ? new Date(quote.providerTimestamp).toLocaleTimeString() : "—"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="card w-full max-w-[820px]">
            <div className="fb mb14 pb4 border-b border-[#E5E7EB]">
              <div>
                <div className="sh" style={{ margin: 0 }}>Post Simulated Position</div>
                <div className="text-xs c-t3 mt-1 mb-2">Configure trade parameters for PAMM simulation.</div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* TRADE STATE CATEGORY */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTradeForm({ ...tradeForm, status: 'Open', type: 'Market' })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${tradeForm.status === 'Open' && tradeForm.type === 'Market' ? 'border-[#2F80ED] bg-[#2F80ED]/5' : 'border-[#E5E7EB] hover:border-[#2F80ED]/40'}`}
                >
                  <div className={`text-sm font-bold mb-0.5 ${tradeForm.status === 'Open' && tradeForm.type === 'Market' ? 'text-[#2F80ED]' : 'text-[#374151]'}`}>🟢 Active Trade</div>
                  <div className="text-[11px] text-[#6B7280]">Live market tracking</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTradeForm({ ...tradeForm, status: 'Open', type: 'Limit' })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${tradeForm.status === 'Open' && (tradeForm.type === 'Limit' || tradeForm.type === 'Stop') ? 'border-[#F59E0B] bg-[#F59E0B]/5' : 'border-[#E5E7EB] hover:border-[#F59E0B]/40'}`}
                >
                  <div className={`text-sm font-bold mb-0.5 ${tradeForm.status === 'Open' && (tradeForm.type === 'Limit' || tradeForm.type === 'Stop') ? 'text-[#F59E0B]' : 'text-[#374151]'}`}>⏳ Pending Order</div>
                  <div className="text-[11px] text-[#6B7280]">Awaiting trigger price</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTradeForm({ ...tradeForm, status: 'Closed', type: 'Market' })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${tradeForm.status === 'Closed' ? 'border-[#10B981] bg-[#10B981]/5' : 'border-[#E5E7EB] hover:border-[#10B981]/40'}`}
                >
                  <div className={`text-sm font-bold mb-0.5 ${tradeForm.status === 'Closed' ? 'text-[#10B981]' : 'text-[#374151]'}`}>🔴 Closed History</div>
                  <div className="text-[11px] text-[#6B7280]">Log booked past positions</div>
                </button>
              </div>

              {/* SECTION 1: Trade Identity */}
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">1. Trade Identity</div>
                <div className="grid grid-cols-1 gap-3">
                  <label>
                    <div className="text-xs c-t3 mb-1.5">Target Pool</div>
                    <select className="input w-full" value={tradeForm.poolId} onChange={(e) => setTradeForm({ ...tradeForm, poolId: e.target.value })}>
                      <option value="">Select pool</option>
                      {pools.map((pool) => <option key={pool._id} value={pool._id}>{pool.poolName}</option>)}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label>
                      <div className="text-xs c-t3 mb-1.5">Symbol</div>
                      <select className="input w-full" value={tradeForm.symbol} onChange={(e) => setTradeForm({ ...tradeForm, symbol: e.target.value })}>
                        {(tradeSymbols.length ? tradeSymbols : [{ display: "XAU/USD", key: "xauusd", contractSize: 100, precision: 2, category: "Metals" }]).map((symbol) => (
                          <option key={symbol.key} value={symbol.display}>{symbol.display}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <div className="text-xs c-t3 mb-1.5">Direction</div>
                      <select className="input w-full" value={tradeForm.direction} onChange={(e) => setTradeForm({ ...tradeForm, direction: e.target.value as "BUY" | "SELL" })}>
                        <option>BUY</option>
                        <option>SELL</option>
                      </select>
                    </label>
                  </div>
                  {/* Pending sub-type selector */}
                  {tradeForm.status === 'Open' && (tradeForm.type === 'Limit' || tradeForm.type === 'Stop') && (
                    <div className="grid grid-cols-2 gap-3 p-2 bg-[#FEF3C7] rounded-lg border border-[#F59E0B]/30">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="pendingType" value="Limit" checked={tradeForm.type === 'Limit'} onChange={() => setTradeForm({ ...tradeForm, type: 'Limit' })} className="accent-[#F59E0B]" />
                        <div>
                          <div className="text-xs font-semibold text-[#92400E]">Limit Order</div>
                          <div className="text-[10px] text-[#92400E]/70">{tradeForm.direction === 'BUY' ? 'Buy below market' : 'Sell above market'}</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="pendingType" value="Stop" checked={tradeForm.type === 'Stop'} onChange={() => setTradeForm({ ...tradeForm, type: 'Stop' })} className="accent-[#F59E0B]" />
                        <div>
                          <div className="text-xs font-semibold text-[#92400E]">Stop Order</div>
                          <div className="text-[10px] text-[#92400E]/70">{tradeForm.direction === 'BUY' ? 'Buy above market (breakout)' : 'Sell below market (breakout)'}</div>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: Execution Parameters */}
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">2. Execution Parameters</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <label>
                    <div className="text-xs c-t3 mb-1.5">Lot Size</div>
                    <input className="input w-full font-mono text-sm" type="number" min="0.01" step="0.01"
                      placeholder="0.10"
                      value={tradeForm.lots || ""}
                      onChange={(e) => setTradeForm({ ...tradeForm, lots: e.target.value === '' ? 0 : Number(e.target.value) })} />
                  </label>
                  <label>
                    <div className="text-xs c-t3 mb-1.5">Leverage (1:X)</div>
                    <input className="input w-full font-mono text-sm" type="number" min="1" step="1"
                      placeholder="200"
                      value={tradeForm.leverage || ""}
                      onChange={(e) => setTradeForm({ ...tradeForm, leverage: e.target.value === '' ? 0 : Number(e.target.value) })} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Open Price */}
                  <label className={tradeForm.status === 'Open' && tradeForm.type === 'Market' ? 'col-span-2' : ''}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-xs c-t3">
                        {tradeForm.status === 'Closed' ? 'Historical Entry Price' : 
                         (tradeForm.type === 'Market' ? 'Entry Price (Leave blank for Live Market)' : 'Trigger Price')}
                      </div>
                      {tradeForm.status === 'Open' && tradeForm.type !== 'Market' && (
                        <div className="text-[10px] text-[#F59E0B] font-medium">
                          {tradeForm.type === 'Limit'
                            ? (tradeForm.direction === 'BUY' ? 'Below current' : 'Above current')
                            : (tradeForm.direction === 'BUY' ? 'Above current' : 'Below current')}
                        </div>
                      )}
                    </div>
                    <input className="input w-full font-mono text-sm" type="number" step="0.00001"
                      placeholder={tradeForm.type === 'Market' ? 'Live Auto-Fill' : 'Enter price'}
                      value={tradeForm.openPrice || ""}
                      onChange={(e) => setTradeForm({ ...tradeForm, openPrice: e.target.value === '' ? 0 : Number(e.target.value) })} />
                  </label>
                  <label className={tradeForm.status === 'Open' && tradeForm.type === 'Market' ? 'col-span-2' : ''}>
                    <div className="text-xs c-t3 mb-1.5">{tradeForm.status === 'Closed' ? 'Historical Open Time' : 'Open Time'}</div>
                    <input className="input w-full text-sm" type="datetime-local" value={tradeForm.openTime} onChange={(e) => setTradeForm({ ...tradeForm, openTime: e.target.value })} />
                  </label>
                </div>
              </div>

              {/* SECTION 3: Risk Management */}
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">3. Risk Management <span className="normal-case font-normal text-[10px] text-[#9CA3AF]">(optional)</span></div>
                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-xs c-t3">Stop Loss</div>
                      <div className="text-[10px] text-[#DC2626] font-medium">{tradeForm.direction === "BUY" ? "Below Open" : "Above Open"}</div>
                    </div>
                    <input className="input w-full font-mono text-sm" type="number" step="0.00001"
                      placeholder="Optional"
                      value={tradeForm.stopLoss || ""}
                      onChange={(e) => setTradeForm({ ...tradeForm, stopLoss: e.target.value === '' ? 0 : Number(e.target.value) })} />
                  </label>
                  <label>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-xs c-t3">Take Profit</div>
                      <div className="text-[10px] text-[#059669] font-medium">{tradeForm.direction === "BUY" ? "Above Open" : "Below Open"}</div>
                    </div>
                    <input className="input w-full font-mono text-sm" type="number" step="0.00001"
                      placeholder="Optional"
                      value={tradeForm.takeProfit || ""}
                      onChange={(e) => setTradeForm({ ...tradeForm, takeProfit: e.target.value === '' ? 0 : Number(e.target.value) })} />
                  </label>
                </div>
              </div>

              {/* SECTION 4: Closure — only for closed trades */}
              {tradeForm.status === "Closed" && (
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] animate-fade-in">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">4. Historical Closure Info</div>
                  <div className="grid grid-cols-1 gap-3 mb-3">
                    <label>
                      <div className="text-xs c-t3 mb-1.5">Close Price</div>
                      <input className="input w-full font-mono text-sm" type="number" step="0.00001"
                        placeholder="Close price"
                        value={tradeForm.closePrice || ""}
                        onChange={(e) => setTradeForm({ ...tradeForm, closePrice: e.target.value === '' ? 0 : Number(e.target.value) })} />
                    </label>
                  </div>
                  <div className="grid grid-cols-1">
                    <label>
                      <div className="text-xs c-t3 mb-1.5">Close Time</div>
                      <input className="input w-full text-sm" type="datetime-local" value={tradeForm.closedAt || ""} onChange={(e) => setTradeForm({ ...tradeForm, closedAt: e.target.value })} />
                    </label>
                  </div>
                </div>
              )}

              <button className="btn btn-primary w-full py-2.5 mt-1 text-sm font-bold" onClick={saveSimTrade} disabled={tradeSaving}>
                <i className="ti ti-device-floppy"></i> {tradeSaving ? "Posting..." : "Post Position"}
              </button>
            </div>
          </div>
            </div>
          )}

          {activeTab === "trades" && (<div className="card h-fit col-span-full">
            <div className="fb mb14">
              <div>
                <div className="sh" style={{ margin: 0 }}>PAMM Trades & Profit Allocation</div>
                <div className="text-xs c-t3 mt-1">Floating P/L uses live bid/ask matching industry standards.</div>
              </div>
              <div className="text-xs px-2 py-1 bg-[#C3D634]/10 text-[#C3D634] rounded border border-[#C3D634]/20 font-semibold">{simTrades.filter((trade) => trade.status === "Open").length} Open</div>
            </div>

            {tradesLoading ? (
              <div className="text-sm c-t3 p-8 text-center border border-dashed border-[#E5E7EB] rounded-lg">Loading PAMM trades...</div>
            ) : simTrades.length === 0 ? (
              <div className="text-sm c-t3 p-8 text-center border border-dashed border-[#E5E7EB] rounded-lg">No PAMM trades posted yet.</div>
            ) : (
              <div className="flex flex-col gap-6 mt-4">
                {pools.map((pool) => {
                  const poolTrades = simTrades.filter(t => t.poolId?._id === pool._id);
                  if (poolTrades.length === 0) return null;

                  return (
                    <div key={pool._id} className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                      <div className="bg-[#F8FAFC] px-4 py-2 border-b border-[#E5E7EB] flex justify-between items-center">
                        <div className="font-bold text-sm text-[#111827]">{pool.poolName}</div>
                        <div className="flex items-center gap-3 text-xs font-semibold text-[#6B7280]">
                          {poolTrades[0]?.poolSummary?.riskStatus && poolTrades[0].poolSummary.riskStatus !== "Normal" && (
                            <span className={poolTrades[0].poolSummary.riskStatus === "Stop Out" ? "text-[#B91C1C]" : "text-[#B45309]"}>
                              {poolTrades[0].poolSummary.riskStatus} · {poolTrades[0].poolSummary.marginLevel ?? 0}%
                            </span>
                          )}
                          <span>{poolTrades.filter(t => t.status === "Open").length} Open</span>
                        </div>
                      </div>
                      <div className="tbl-wrap pamm-trades-table !mt-0 !border-0">
                        <table className="!m-0">
                          <thead>
                            <tr>
                              <th>Instrument</th>
                              <th>Direction</th>
                              <th>Volume</th>
                              <th>Open Price</th>
                              <th>Current / Close Price</th>
                              <th>SL / TP</th>
                              <th>Margin</th>
                              <th>Swap</th>
                              <th>P/L</th>
                              <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {poolTrades.map((trade) => {
                              const calc = trade.calculated;
                              const isClosed = trade.status === "Closed";
                              const isPending = calc?.isPending && !calc?.isTriggered;
                              const pnl = isClosed ? Number(trade.profit || 0) : Number(calc?.profit || 0);
                              const swap = Number(calc?.swap || 0);
                              const currentPrice = isClosed ? trade.closePrice : calc?.currentPrice;
                              const orderType = trade.type || "Market";

                              return (
                                <Fragment key={trade._id}>
                                <tr className={`${isClosed ? "opacity-75 bg-[#F9FAFB]" : ""} ${isPending ? "bg-[#FFFBEB]" : ""}`}>
                                  <td data-label="Instrument" className="fw7">
                                    {trade.symbol}
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <div className="text-[10px] c-t3">{isClosed ? "CLOSED" : (calc?.category || "FX")}</div>
                                      {isPending && <span className="text-[9px] px-1 py-0 rounded bg-[#F59E0B]/20 text-[#92400E] font-bold">PENDING</span>}
                                      {trade.closeReason === "StopOut" && <span title={trade.notes || "Automatically closed by margin stop out"} className="text-[9px] px-1 py-0 rounded bg-[#DC2626]/10 text-[#B91C1C] font-bold">STOP OUT</span>}
                                    </div>
                                  </td>
                                  <td data-label="Direction">
                                    <div className="flex flex-col gap-0.5">
                                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold w-fit ${trade.direction === "BUY" ? "bg-[#2F80ED]/10 text-[#2F80ED]" : "bg-[#DC2626]/10 text-[#DC2626]"}`}>
                                        {trade.direction}
                                      </span>
                                      {orderType !== "Market" && <span className="text-[9px] text-[#F59E0B] font-semibold">{orderType}</span>}
                                    </div>
                                  </td>
                                  <td data-label="Volume" className="mono">{Number(trade.lots).toFixed(2)}</td>
                                  <td data-label="Open Price" className="mono">
                                    {isPending ? (
                                      <div>
                                        <div className="text-[#F59E0B] font-semibold">{trade.openPrice}</div>
                                        <div className="text-[10px] c-t3">Trigger</div>
                                      </div>
                                    ) : trade.openPrice}
                                  </td>
                                  <td data-label="Current / Close Price" className="mono font-medium">
                                    {isPending ? <span className="text-[11px] text-[#F59E0B]">⏳ Awaiting</span> : (
                                      <div>
                                        <div>{currentPrice ?? "—"}</div>
                                        {!isClosed && calc?.quoteSource && <div className="text-[9px] c-t3 mt-0.5">{calc.quoteSource} · {calc.quoteUpdatedAt ? new Date(calc.quoteUpdatedAt).toLocaleTimeString() : "time unavailable"}</div>}
                                      </div>
                                    )}
                                  </td>
                                  <td data-label="SL / TP" className="mono text-xs">
                                    <div className="text-[#DC2626]">{trade.stopLoss || "—"}</div>
                                    <div className="text-[#059669]">{trade.takeProfit || "—"}</div>
                                  </td>
                                  <td data-label="Margin" className="mono">
                                    {isPending ? <span className="text-[#9CA3AF] text-xs">—</span> : (
                                      <>{money(Number(calc?.margin || 0))}<div className="text-[10px] c-t3 mt-0.5">1:{trade.leverage}</div></>
                                    )}
                                  </td>
                                  <td data-label="Swap" className={`mono ${swap === 0 ? "text-[#6B7280]" : swap > 0 ? "text-[#059669]" : "text-[#DC2626]"}`}>
                                    {isPending ? <span className="text-[#9CA3AF]">—</span> : <>{swap > 0 ? "+" : ""}{swap.toFixed(2)}</>}
                                  </td>
                                  <td data-label="P/L" className={`mono fw7 text-[15px] ${pnl >= 0 ? "val-pos" : "val-neg"}`}>
                                    {isPending ? <span className="text-[#9CA3AF] text-xs font-normal">Pending</span> : <>{pnl > 0 ? "▲" : pnl < 0 ? "▼" : ""} {money(pnl)}</>}
                                  </td>
                                  <td data-label="Actions" style={{ textAlign: "right" }}>
                                    <div className="flex gap-2 justify-end">
                                      <button className="btn btn-outline btn-xs !px-2" onClick={() => editSimTrade(trade)}>Edit</button>
                                      <button className="btn btn-outline btn-xs !text-[#DC2626] !border-[#DC2626]/30 !px-2 hover:!bg-[#DC2626]/10" onClick={() => deleteSimTrade(trade._id)}>Delete</button>
                                    </div>
                                  </td>
                                </tr>
                                {isClosed && <tr className="pamm-trade-secondary-action">
                                  <td colSpan={10}>
                                    <button className="btn btn-primary btn-xs" onClick={() => reviewTradeAllocation(trade)} disabled={allocationLoading}>
                                      <i className="ti ti-eye" /> Review allocation and settlement
                                    </button>
                                  </td>
                                </tr>}
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        </>
    )}


      {allocationTrade && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4" onClick={(e) => { if (e.target === e.currentTarget) setAllocationTrade(null); }}>
          <div className="card pamm-allocation-dialog w-full max-w-4xl bg-white" style={{ maxHeight: "88vh", overflowY: "auto" }}>
            {(() => {
              const tradeProfit = Number(allocationTrade.profit || 0);
              const participants = allocationTrade.eligibleParticipants || [];
              const investorRows = participants.filter((item) => item.participantType !== "Manager");
              const pendingInvestors = investorRows.filter((item) => Number(item.allocatedProfit || 0) > 0 && item.distributionStatus !== "Completed");
              const lossInvestors = investorRows.filter((item) => Number(item.allocatedLoss || item.netAllocation || 0) < 0);
              const managerRow = participants.find((item) => item.participantType === "Manager");
              const preview = allocationPreview || {};
              return <>
                <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[.12em] text-[#64748B]">Trade settlement review</div>
                    <h2 className="mt-1 text-lg font-bold text-[#0F172A]">{allocationTrade.symbol} <span className="text-[#64748B]">{allocationTrade.direction}</span></h2>
                    <div className={`mt-1 text-sm font-semibold ${tradeProfit >= 0 ? "val-pos" : "val-neg"}`}>{tradeProfit >= 0 ? "Realized profit" : "Realized loss"}: {money(Math.abs(tradeProfit))}</div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748B]"><span>Opened {allocationTrade.openTime ? new Date(allocationTrade.openTime).toLocaleString() : "—"}</span><span>Closed {allocationTrade.closeTime ? new Date(allocationTrade.closeTime).toLocaleString() : "—"}</span><span>Settlement: {allocationTrade.settlementStatus || "Pending"}</span></div>
                  </div>
                  <button className="btn btn-outline btn-xs shrink-0" onClick={() => setAllocationTrade(null)}>Close</button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <div className="pamm-allocation-stat"><div className="pamm-allocation-label">Eligible capital</div><div className="mt-1 mono fw7">{money(Number(allocationLegacy ? preview.totalCapital : participants.reduce((sum, item) => sum + Number(item.capitalAtClose || item.capitalAtOpen || 0), 0)))}</div></div>
                  <div className="pamm-allocation-stat"><div className="pamm-allocation-label">Manager capital</div><div className="mt-1 mono fw7">{money(Number(allocationLegacy ? preview.managerCapital : managerRow?.capitalAtClose || managerRow?.capitalAtOpen || managerRow?.managerCapital || 0))}</div></div>
                  <div className="pamm-allocation-stat"><div className="pamm-allocation-label">Investors</div><div className="mt-1 mono fw7">{investorRows.length}</div></div>
                  <div className="pamm-allocation-stat">
                    <div className="pamm-allocation-label">Fee rate</div>
                    <div className="mt-1 mono fw7">
                      {Number(
                        allocationLegacy
                          ? (preview.fee && tradeProfit > 0 ? (Number(preview.fee) / tradeProfit * 100) : 0)
                          : (allocationTrade.distributionFeePercentAtOpen ?? 0)
                      ).toFixed(2)}%
                    </div>
                  </div>
                  <div className="pamm-allocation-stat">
                    <div className="pamm-allocation-label">Fee deducted / Net result</div>
                    <div className="mt-1 mono fw7 text-xs">
                      <span className="text-[#DC2626]">{money(Number(allocationLegacy ? preview.fee : allocationTrade.distributionFee))}</span>
                      <span className="text-[#9CA3AF] mx-1">/</span>
                      <span className={Number(allocationLegacy ? preview.netProfit : tradeProfit - Number(allocationTrade.distributionFee || 0)) >= 0 ? "val-pos" : "val-neg"}>{money(Number(allocationLegacy ? preview.netProfit : tradeProfit - Number(allocationTrade.distributionFee || 0)))}</span>
                    </div>
                  </div>
                  <div className="pamm-allocation-stat"><div className="pamm-allocation-label">Workflow</div><div className="mt-1 text-xs font-semibold text-[#334155]">{allocationLegacy ? "Historical preview" : allocationTrade.distributionStatus || "No distribution"}</div></div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-[#0F172A]">Who receives this result</h3><p className="mt-1 text-xs text-[#64748B]">The manager is retained in the pool. Each listed investor is allocated according to the capital eligible for this trade.</p></div><span className="badge badge-mt5">{participants.length} listed</span></div>
                {participants.length ? <div className="mt-3 overflow-hidden rounded-lg border border-[#E5E7EB]">
                  <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(90px,.8fr)_minmax(70px,.6fr)_minmax(90px,.8fr)_minmax(80px,.7fr)_minmax(80px,.7fr)_auto] gap-2 bg-[#F8FAFC] px-4 py-2 text-[10px] font-bold uppercase tracking-[.08em] text-[#64748B] sm:grid">
                    <span>Participant</span>
                    <span>Capital</span>
                    <span>Share</span>
                    <span className="text-right">Gross Alloc</span>
                    <span className="text-right text-[#DC2626]">Fee</span>
                    <span className="text-right">Net P/L</span>
                    <span className="text-right">Action</span>
                  </div>
                  {participants.map((item, index) => {
                    const user = typeof item.user === "object" ? item.user : undefined;
                    const capital = item.capitalAtClose ?? item.capitalAtOpen ?? item.managerCapital ?? 0;
                    const isManager = item.participantType === "Manager";
                    const grossAmt = Number(item.grossAllocation || 0);
                    const feeAmt = Number(item.feeAllocation || 0);
                    const amount = Number(item.netAllocation || 0);
                    const pending = !isManager && Number(item.allocatedProfit || 0) > 0 && item.distributionStatus !== "Completed";
                    return <div key={`${String(item.investment || item.participantType)}-${index}`} className="grid gap-2 border-t border-[#F1F5F9] px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(90px,.8fr)_minmax(70px,.6fr)_minmax(90px,.8fr)_minmax(80px,.7fr)_minmax(80px,.7fr)_auto] sm:items-center sm:gap-2">
                      <div><div className="text-sm font-semibold text-[#0F172A]">{isManager ? "Pool manager" : (user?.name || "Investor")}</div><div className="mt-1 text-xs text-[#64748B]">{isManager ? "Retained in pool" : (user?.email || "Eligible investor")}</div></div>
                      <div><div className="text-[10px] uppercase text-[#64748B] sm:hidden">Capital</div><div className="mono text-xs font-bold">{money(capital)}</div></div>
                      <div><div className="text-[10px] uppercase text-[#64748B] sm:hidden">Share</div><div className="mono text-xs font-bold">{Number(item.allocationAtClose || 0).toFixed(2)}%</div></div>
                      <div><div className="text-[10px] uppercase text-[#64748B] sm:hidden">Gross</div><div className={`mono text-xs font-bold text-right ${grossAmt >= 0 ? "val-pos" : "val-neg"}`}>{money(grossAmt)}</div></div>
                      <div><div className="text-[10px] uppercase text-[#64748B] sm:hidden">Fee</div><div className="mono text-xs font-bold text-right text-[#DC2626]">{feeAmt > 0 ? `-${money(feeAmt)}` : "—"}</div></div>
                      <div><div className="text-[10px] uppercase text-[#64748B] sm:hidden">Net P/L</div><div className={`mono text-xs font-bold text-right ${amount >= 0 ? "val-pos" : "val-neg"}`}>{money(amount)}</div></div>
                      <div className="flex items-center justify-between gap-2 sm:justify-end"><span className="text-xs text-[#64748B]">{isManager ? "Retained" : item.distributionStatus === "Completed" ? "Credited" : amount < 0 ? "Applied" : pending ? "Ready" : "Pending"}</span>{pending && <button className="btn btn-success btn-xs" onClick={() => distributeTrade(String(item.investment))} disabled={allocationLoading}><i className="ti ti-gift" /> Allocate</button>}</div>
                    </div>;
                  })}
                </div> : <div className="mt-3 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center text-sm text-[#64748B]">No eligible participants matched the trade opening time.</div>}

                <div className={`mt-5 rounded-lg border p-3 text-xs ${tradeProfit < 0 ? "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]" : "border-[#E5E7EB] bg-[#F8FAFC] text-[#475569]"}`}>{tradeProfit < 0 ? `Loss handling: ${lossInvestors.length} investor allocation${lossInvestors.length === 1 ? "" : "s"} will be applied to investment value. No wallet credit is created.` : "Profit handling: investor amounts remain pending until the administrator allocates them. The manager amount remains retained in the pool."}</div>
                {allocationLegacy && <div className="mt-3 rounded-lg border border-[#F59E0B]/40 bg-[#FFFBEB] p-4"><div className="text-sm font-bold text-[#92400E]">Historical trade</div><div className="mt-1 text-xs text-[#92400E]">This record has no permanent participant snapshot. Review the listed participants before saving the historical allocation basis.</div>{allocationNotice && <div className="mt-2 text-xs text-[#92400E]">{allocationNotice}</div>}<button className="btn btn-outline mt-3 w-full" onClick={backfillTrade} disabled={allocationLoading || !allocationCanBackfill}><i className="ti ti-database-import" /> {allocationLoading ? "Saving allocation..." : "Save historical allocation"}</button>{!allocationCanBackfill && <div className="mt-2 text-xs val-neg">Reliable timestamps and positive eligible capital are required.</div>}</div>}
                {!allocationLegacy && allocationNotice && <div className="mt-3 rounded-lg border border-[#F59E0B]/40 bg-[#FFFBEB] p-3 text-xs text-[#92400E]">{allocationNotice}</div>}

                <div className="mt-5 flex flex-col gap-2 border-t border-[#E5E7EB] pt-4 sm:flex-row sm:justify-end">
                  <button className="btn btn-outline" onClick={() => setAllocationTrade(null)}>Done</button>
                  <button className="btn btn-primary" onClick={() => distributeTrade()} disabled={allocationLoading || allocationLegacy || tradeProfit <= 0 || allocationTrade.distributionStatus === "Completed" || !pendingInvestors.length}><i className="ti ti-gift" /> {allocationLoading ? "Processing..." : pendingInvestors.length ? `Allocate ${pendingInvestors.length} investor${pendingInvestors.length === 1 ? "" : "s"}` : tradeProfit < 0 ? "Loss applied to investments" : "No pending profit"}</button>
                  {allocationTrade.settlementStatus === "Settled" && <button className="btn btn-outline !text-[#DC2626]" onClick={reverseTrade} disabled={allocationLoading}><i className="ti ti-rotate-2" /> Reverse settlement</button>}
                </div>
              </>;
            })()}
          </div>
        </div>
      )}

      {/* Edit Trade Modal */}
      {editingTrade && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4" onClick={(e) => { if (e.target === e.currentTarget) setEditingTrade(null); }}>
          <div className="card w-full max-w-2xl bg-white" style={{ maxHeight: '90vh' }}>
            <div className="fb mb14 pb4 border-b border-[#E5E7EB]">
              <div>
                <div className="sh" style={{ margin: 0 }}>Edit Simulated Position</div>
                <div className="text-xs c-t3 mt-1">Modify parameters for this PAMM simulated trade.</div>
              </div>
              <button className="btn btn-outline btn-xs" onClick={() => setEditingTrade(null)}>Cancel</button>
            </div>

            <div className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto px-1">
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">1. Trade Identity</div>
                <div className="grid grid-cols-1 gap-3">
                  <label>
                    <div className="text-xs c-t3 mb-1.5">Target Pool</div>
                    <select className="input w-full" value={editTradeForm.poolId} onChange={(e) => setEditTradeForm({ ...editTradeForm, poolId: e.target.value })}>
                      <option value="">Select pool</option>
                      {pools.map((pool) => <option key={pool._id} value={pool._id}>{pool.poolName}</option>)}
                    </select>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="col-span-1">
                      <div className="text-xs c-t3 mb-1.5">Symbol</div>
                      <select className="input w-full" value={editTradeForm.symbol} onChange={(e) => setEditTradeForm({ ...editTradeForm, symbol: e.target.value })}>
                        {(tradeSymbols.length ? tradeSymbols : [{ display: "XAU/USD", key: "xauusd", contractSize: 100, precision: 2, category: "Metals" }]).map((symbol) => (
                          <option key={symbol.key} value={symbol.display}>{symbol.display}</option>
                        ))}
                      </select>
                    </label>
                    <label className="col-span-1">
                      <div className="text-xs c-t3 mb-1.5">Direction</div>
                      <select className="input w-full" value={editTradeForm.direction} onChange={(e) => setEditTradeForm({ ...editTradeForm, direction: e.target.value as "BUY" | "SELL" })}>
                        <option>BUY</option>
                        <option>SELL</option>
                      </select>
                    </label>
                    <label className="col-span-1">
                      <div className="text-xs c-t3 mb-1.5">Type</div>
                      <select className="input w-full" value={editTradeForm.type} onChange={(e) => setEditTradeForm({ ...editTradeForm, type: e.target.value as "Market" | "Limit" | "Stop" })}>
                        <option>Market</option>
                        <option>Limit</option>
                        <option>Stop</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">2. Execution Parameters</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <label>
                    <div className="text-xs c-t3 mb-1.5">Lot Size</div>
                    <input className="input w-full font-mono text-sm" type="number" min="0.01" step="0.01"
                      placeholder="0.10"
                      value={editTradeForm.lots || ""}
                      onChange={(e) => setEditTradeForm({ ...editTradeForm, lots: e.target.value === '' ? 0 : Number(e.target.value) })} />
                  </label>
                  <label>
                    <div className="text-xs c-t3 mb-1.5">Leverage (1:X)</div>
                    <input className="input w-full font-mono text-sm" type="number" min="1" step="1"
                      placeholder="200"
                      value={editTradeForm.leverage || ""}
                      onChange={(e) => setEditTradeForm({ ...editTradeForm, leverage: e.target.value === '' ? 0 : Number(e.target.value) })} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <div className="text-xs c-t3 mb-1.5">Open Price</div>
                    <input className="input w-full font-mono text-sm" type="number" step="0.00001"
                      placeholder="Enter price"
                      value={editTradeForm.openPrice || ""}
                      onChange={(e) => setEditTradeForm({ ...editTradeForm, openPrice: e.target.value === '' ? 0 : Number(e.target.value) })} />
                  </label>
                  <label>
                    <div className="text-xs c-t3 mb-1.5">Open Time</div>
                    <input className="input w-full text-sm" type="datetime-local" value={editTradeForm.openTime} onChange={(e) => setEditTradeForm({ ...editTradeForm, openTime: e.target.value })} />
                  </label>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">3. Risk Management</div>
                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-xs c-t3">Stop Loss</div>
                      <div className="text-[10px] text-[#DC2626] font-medium">{editTradeForm.direction === "BUY" ? "Below Open" : "Above Open"}</div>
                    </div>
                    <input className="input w-full font-mono text-sm" type="number" step="0.00001"
                      placeholder="Optional"
                      value={editTradeForm.stopLoss || ""}
                      onChange={(e) => setEditTradeForm({ ...editTradeForm, stopLoss: e.target.value === '' ? 0 : Number(e.target.value) })} />
                  </label>
                  <label>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-xs c-t3">Take Profit</div>
                      <div className="text-[10px] text-[#059669] font-medium">{editTradeForm.direction === "BUY" ? "Above Open" : "Below Open"}</div>
                    </div>
                    <input className="input w-full font-mono text-sm" type="number" step="0.00001"
                      placeholder="Optional"
                      value={editTradeForm.takeProfit || ""}
                      onChange={(e) => setEditTradeForm({ ...editTradeForm, takeProfit: e.target.value === '' ? 0 : Number(e.target.value) })} />
                  </label>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">4. Closure</div>
                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <div className="text-xs c-t3 mb-1.5">Status</div>
                    <select className="input w-full" value={editTradeForm.status} onChange={(e) => setEditTradeForm({ ...editTradeForm, status: e.target.value as "Open" | "Closed" })}>
                      <option>Open</option>
                      <option>Closed</option>
                    </select>
                  </label>
                  {editTradeForm.status === "Closed" && (
                    <label className="animate-fade-in">
                      <div className="text-xs c-t3 mb-1.5">Close Price</div>
                      <input className="input w-full font-mono text-sm" type="number" step="0.00001"
                        placeholder="Close price"
                        value={editTradeForm.closePrice || ""}
                        onChange={(e) => setEditTradeForm({ ...editTradeForm, closePrice: e.target.value === '' ? 0 : Number(e.target.value) })} />
                    </label>
                  )}
                </div>
              </div>

              <button className="btn btn-primary w-full py-2.5 mt-2 text-sm font-bold" onClick={saveEditSimTrade} disabled={editTradeSaving}>
                <i className="ti ti-device-floppy"></i> {editTradeSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
