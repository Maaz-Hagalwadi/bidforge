import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { adminApi, type AdminPayment, type AdminStats, type AnalyticsPoint } from '@/api/admin';
import { PageLoader } from '@/components/ui/PageLoader';
import type { SpringPage } from '@/types/job';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ESCROWED: { label: 'In Escrow', cls: 'bg-amber-500/10 text-amber-600' },
  RELEASED: { label: 'Released',  cls: 'bg-green-500/10 text-green-600' },
};

const STATUS_PILLS = [
  { label: 'All',       value: '' },
  { label: 'In Escrow', value: 'ESCROWED' },
  { label: 'Released',  value: 'RELEASED' },
];

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function Donut({ released, escrowed, fmt }: { released: number; escrowed: number; fmt: (n: number) => string }) {
  const total = released + escrowed;
  const relPct = total === 0 ? 50 : (released / total) * 100;
  const escPct = 100 - relPct;
  return (
    <div className="tonal-card p-5 rounded-xl flex flex-col gap-4">
      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Escrow vs Released</p>
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28 flex-shrink-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(#10b981 0% ${relPct}%, #f59e0b ${relPct}% 100%)` }}
          />
          <div className="absolute inset-[14px] rounded-full bg-surface flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-on-surface-variant">TOTAL</span>
            <span className="text-xs font-bold text-on-surface">{fmt(total)}</span>
          </div>
        </div>
        <div className="space-y-2.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-on-surface-variant">Released</p>
              <p className="text-sm font-bold text-on-surface">{fmt(released)}</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{relPct.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-on-surface-variant">In Escrow</p>
              <p className="text-sm font-bold text-on-surface">{fmt(escrowed)}</p>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{escPct.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueChart({ data }: { data: AnalyticsPoint[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
  return (
    <div className="tonal-card p-5 rounded-xl flex flex-col gap-4">
      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Revenue — Last 12 Months</p>
      {data.length === 0 ? (
        <div className="h-28 flex items-center justify-center text-xs text-on-surface-variant">No data yet</div>
      ) : (
        <div className="flex items-end gap-1.5 h-28">
          {data.map(d => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full rounded-t bg-secondary/80 hover:bg-secondary transition-colors cursor-default"
                style={{ height: `${Math.max((d.value / max) * 96, d.value > 0 ? 4 : 0)}px` }}
              />
              <span className="text-[9px] text-on-surface-variant truncate w-full text-center">{d.label.slice(0, 3)}</span>
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-surface-container border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-[10px] font-semibold text-on-surface whitespace-nowrap shadow-lg z-10">
                {d.label}: {fmt(d.value)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="tonal-card p-5 rounded-xl flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <span className="material-symbols-outlined text-[22px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-on-surface leading-none">{value}</p>
      </div>
    </div>
  );
}

export default function AdminRevenue() {
  const [data, setData] = useState<SpringPage<AdminPayment> | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [escrowed, setEscrowed] = useState<number>(0);
  const [revenue, setRevenue] = useState<AnalyticsPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPayments = useCallback(() => {
    setLoading(true);
    adminApi.getPayments(page, 20, statusFilter || undefined)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    adminApi.getStats().then(setStats);
    adminApi.getPaymentSummary().then(s => setEscrowed(s.escrowed));
    adminApi.getRevenueAnalytics().then(setRevenue);
  }, []);

  const totalPages = data ? data.totalPages : 1;
  const currentPage = data ? data.number : 0;

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <AdminLayout>
      <div className="p-4 pb-8 lg:p-8 space-y-6 max-w-[1280px] w-full mx-auto">

        {/* Header */}
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-on-surface leading-tight">Revenue Tracking</h1>
          <p className="text-sm text-on-surface-variant mt-1">Monitor all platform payments and escrow activity.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard icon="payments"                label="Total Revenue Released" value={stats ? fmt(stats.totalRevenue) : '—'}       color="bg-emerald-500" />
          <SummaryCard icon="account_balance_wallet"  label="Currently in Escrow"    value={fmt(escrowed)}                                color="bg-amber-500"   />
          <SummaryCard icon="receipt_long"            label="Total Transactions"     value={data ? data.totalElements.toLocaleString() : '—'} color="bg-secondary" />
        </div>

        {/* Analytics charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Donut released={stats?.totalRevenue ?? 0} escrowed={escrowed} fmt={fmt} />
          <RevenueChart data={revenue} />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_PILLS.map(pill => (
            <button
              key={pill.value}
              onClick={() => { setStatusFilter(pill.value); setPage(0); }}
              className={['px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap', statusFilter === pill.value ? 'bg-secondary text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/20'].join(' ')}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="tonal-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10">
                  {['Milestone', 'Client → Freelancer', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16">
                      <PageLoader message="Loading payments…" />
                    </td>
                  </tr>
                ) : !data || data.content.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-5xl text-on-surface-variant">payments</span>
                        <p className="text-sm text-on-surface-variant font-medium">No payments found</p>
                      </div>
                    </td>
                  </tr>
                ) : data.content.map(p => {
                  const st = STATUS_CFG[p.status] ?? { label: p.status, cls: 'bg-slate-500/10 text-slate-500' };
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-on-surface max-w-[200px] truncate">{p.milestoneTitle}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        <span className="font-medium text-on-surface">{p.clientName}</span>
                        <span className="mx-2 text-on-surface-variant">→</span>
                        <span>{p.freelancerName}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-on-surface">{fmt(p.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">{timeAgo(p.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalElements > 0 && (
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
              <p className="text-sm text-on-surface-variant">
                Showing {data.number * data.size + 1}–{Math.min((data.number + 1) * data.size, data.totalElements)} of {data.totalElements.toLocaleString()}
              </p>
              <div className="flex items-center gap-1">
                <button disabled={data.first} onClick={() => setPage(p => p - 1)}
                  className="p-1.5 border border-slate-200 dark:border-white/10 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-30">
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                {(() => {
                  const pages: (number | '...')[] = [];
                  if (totalPages <= 7) { for (let i = 0; i < totalPages; i++) pages.push(i); }
                  else {
                    pages.push(0);
                    if (currentPage > 2) pages.push('...');
                    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) pages.push(i);
                    if (currentPage < totalPages - 3) pages.push('...');
                    pages.push(totalPages - 1);
                  }
                  return pages.map((p, idx) =>
                    p === '...'
                      ? <span key={`e-${idx}`} className="px-2 text-on-surface-variant text-sm">...</span>
                      : <button key={p} onClick={() => setPage(p as number)}
                          className={['px-3 py-1 rounded-md text-xs font-semibold transition-colors', currentPage === p ? 'bg-secondary text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-on-surface'].join(' ')}>
                          {(p as number) + 1}
                        </button>
                  );
                })()}
                <button disabled={data.last} onClick={() => setPage(p => p + 1)}
                  className="p-1.5 border border-slate-200 dark:border-white/10 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-30">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
