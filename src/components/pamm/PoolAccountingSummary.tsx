type PoolAccounting = { managerCapital?: number; investorCapital?: number; totalCapital?: number; realizedPnl?: number; pendingDistributionTotal?: number; paidDistributionTotal?: number; activeInvestorCount?: number };
const money = (value: number | undefined) => `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export default function PoolAccountingSummary({ poolName, accounting }: { poolName: string; accounting?: PoolAccounting }) {
  if (!accounting) return null;
  return <div className="pamm-accounting-summary" aria-label={`${poolName} accounting summary`}>
    <div><span>Pool</span><strong>{poolName}</strong></div><div><span>Total capital</span><strong>{money(accounting.totalCapital)}</strong></div><div><span>Manager</span><strong>{money(accounting.managerCapital)}</strong></div><div><span>Investors</span><strong>{money(accounting.investorCapital)}</strong></div><div><span>Realized P/L</span><strong className={Number(accounting.realizedPnl || 0) >= 0 ? 'val-pos' : 'val-neg'}>{money(accounting.realizedPnl)}</strong></div><div><span>Pending / paid</span><strong>{money(accounting.pendingDistributionTotal)} / {money(accounting.paidDistributionTotal)}</strong></div><div><span>Active investors</span><strong>{accounting.activeInvestorCount || 0}</strong></div>
  </div>;
}
