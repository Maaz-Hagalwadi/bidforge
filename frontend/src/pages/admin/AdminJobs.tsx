import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { adminApi, type AdminJob } from '@/api/admin';
import type { SpringPage } from '@/types/job';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'bg-slate-500/10 text-slate-500'    },
  OPEN:      { label: 'Open',      cls: 'bg-secondary/10 text-secondary'    },
  ASSIGNED:  { label: 'Assigned',  cls: 'bg-green-500/10 text-green-600'    },
  COMPLETED: { label: 'Completed', cls: 'bg-blue-500/10 text-blue-600'      },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-500/10 text-red-500'        },
};

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

const STATUS_PILLS = [
  { label: 'All',       value: '' },
  { label: 'Open',      value: 'OPEN' },
  { label: 'Draft',     value: 'DRAFT' },
  { label: 'Assigned',  value: 'ASSIGNED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function AdminJobs() {
  const navigate = useNavigate();
  const [data, setData] = useState<SpringPage<AdminJob> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchJobs = useCallback(() => {
    setLoading(true);
    adminApi.getJobs(page, 10, statusFilter || undefined)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const totalPages = data ? data.totalPages : 1;
  const currentPage = data ? data.number : 0;

  return (
    <AdminLayout>
      <div className="p-4 pb-8 lg:p-8 space-y-6 max-w-[1280px] w-full mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
          <div>
            <h1 className="text-2xl font-bold text-on-surface leading-tight">Job Moderation</h1>
            <p className="text-sm text-on-surface-variant mt-1">Monitor and moderate all platform jobs.</p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
        </div>

        {/* Table */}
        <div className="tonal-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10">
                  {['Job Title', 'Client', 'Status', 'Budget', 'Posted', 'Actions'].map((h, i) => (
                    <th key={h} className={`px-6 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <span className="material-symbols-outlined animate-spin text-secondary text-4xl">progress_activity</span>
                    </td>
                  </tr>
                ) : !data || data.content.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-5xl text-on-surface-variant">work_off</span>
                        <p className="text-sm text-on-surface-variant font-medium">No jobs found</p>
                      </div>
                    </td>
                  </tr>
                ) : data.content.map(j => {
                  const st = STATUS_CFG[j.status] ?? { label: j.status, cls: 'bg-slate-500/10 text-slate-500' };
                  const budget = j.budgetType === 'HOURLY'
                    ? `$${j.budgetMin}–$${j.budgetMax}/hr`
                    : `$${j.budgetMin.toLocaleString()}–$${j.budgetMax.toLocaleString()}`;
                  return (
                    <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="max-w-[280px]">
                          <p className="text-sm font-semibold text-on-surface truncate">{j.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{j.category}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">{j.clientName ?? `#${j.clientId}`}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-on-surface-variant">{budget}</td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">{timeAgo(j.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/jobs/${j.id}`, { state: { from: 'admin-jobs' } })}
                            className="p-1.5 text-secondary hover:bg-secondary/10 rounded transition-colors"
                            title="View job"
                          >
                            <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                          </button>
                          <button
                            onClick={() => navigate(`/profile/${j.clientId}?from=admin-jobs`)}
                            className="p-1.5 text-slate-500 hover:text-secondary hover:bg-secondary/10 rounded transition-colors"
                            title="View client profile"
                          >
                            <span className="material-symbols-outlined text-[20px]">account_circle</span>
                          </button>
                        </div>
                      </td>
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
                Showing {data.number * 10 + 1}–{Math.min((data.number + 1) * 10, data.totalElements)} of {data.totalElements.toLocaleString()}
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
