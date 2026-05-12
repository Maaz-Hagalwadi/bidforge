import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { adminApi, type AdminPayment, type AdminStats } from '@/api/admin';
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
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <span className="material-symbols-outlined animate-spin text-secondary text-4xl">progress_activity</span>
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
