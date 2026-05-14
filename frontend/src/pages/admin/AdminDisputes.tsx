import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { adminApi, type AdminDispute } from '@/api/admin';
import { PageLoader } from '@/components/ui/PageLoader';
import type { SpringPage } from '@/types/job';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  OPEN:         { label: 'Open',         cls: 'bg-red-500/10 text-red-500'      },
  UNDER_REVIEW: { label: 'Under Review', cls: 'bg-amber-500/10 text-amber-600'  },
  RESOLVED:     { label: 'Resolved',     cls: 'bg-green-500/10 text-green-600'  },
  CLOSED:       { label: 'Closed',       cls: 'bg-slate-500/10 text-slate-500'  },
};

const STATUS_PILLS = [
  { label: 'All',          value: '' },
  { label: 'Open',         value: 'OPEN' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Resolved',     value: 'RESOLVED' },
  { label: 'Closed',       value: 'CLOSED' },
];

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function AdminDisputes() {
  const [data, setData] = useState<SpringPage<AdminDispute> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const [resolveTarget, setResolveTarget] = useState<AdminDispute | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchDisputes = useCallback(() => {
    setLoading(true);
    adminApi.getDisputes(page, 20, statusFilter || undefined)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const handleMarkUnderReview = (id: string) => {
    adminApi.markDisputeUnderReview(id).then(updated => {
      setData(prev => prev ? { ...prev, content: prev.content.map(d => d.id === id ? updated : d) } : prev);
    });
  };

  const handleResolve = () => {
    if (!resolveTarget) return;
    setResolving(true);
    adminApi.resolveDispute(resolveTarget.id, resolveNote).then(updated => {
      setData(prev => prev ? { ...prev, content: prev.content.map(d => d.id === updated.id ? updated : d) } : prev);
      setResolveTarget(null);
      setResolveNote('');
    }).finally(() => setResolving(false));
  };

  const totalPages = data ? data.totalPages : 1;
  const currentPage = data ? data.number : 0;

  return (
    <AdminLayout>
      <div className="p-4 pb-8 lg:p-8 space-y-6 max-w-[1280px] w-full mx-auto">

        {/* Header */}
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-on-surface leading-tight">Dispute Management</h1>
          <p className="text-sm text-on-surface-variant mt-1">Review and resolve user disputes.</p>
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
                  {['Opened By', 'Job', 'Reason', 'Status', 'Date', 'Actions'].map((h, i) => (
                    <th key={h} className={`px-6 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16">
                      <PageLoader message="Loading disputes…" />
                    </td>
                  </tr>
                ) : !data || data.content.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-5xl text-on-surface-variant">gavel</span>
                        <p className="text-sm text-on-surface-variant font-medium">No disputes found</p>
                      </div>
                    </td>
                  </tr>
                ) : data.content.map(d => {
                  const st = STATUS_CFG[d.status] ?? { label: d.status, cls: 'bg-slate-500/10 text-slate-500' };
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-sm font-semibold text-on-surface">{d.openedByName}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-on-surface-variant max-w-[180px] truncate">{d.jobTitle}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-on-surface-variant max-w-[240px] truncate">{d.reason}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">{timeAgo(d.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {d.status === 'OPEN' && (
                            <button
                              onClick={() => handleMarkUnderReview(d.id)}
                              className="px-3 py-1.5 text-xs font-semibold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-lg transition-colors"
                            >
                              Review
                            </button>
                          )}
                          {(d.status === 'OPEN' || d.status === 'UNDER_REVIEW') && (
                            <button
                              onClick={() => { setResolveTarget(d); setResolveNote(''); }}
                              className="px-3 py-1.5 text-xs font-semibold bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded-lg transition-colors"
                            >
                              Resolve
                            </button>
                          )}
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

      {/* Resolve modal */}
      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="tonal-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600 text-[22px]">task_alt</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Resolve Dispute</h3>
                <p className="text-xs text-on-surface-variant">Opened by {resolveTarget.openedByName}</p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant bg-slate-100 dark:bg-white/5 rounded-lg p-3 italic">"{resolveTarget.reason}"</p>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Resolution Note</label>
              <textarea
                rows={4}
                value={resolveNote}
                onChange={e => setResolveNote(e.target.value)}
                placeholder="Describe the resolution..."
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setResolveTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button onClick={handleResolve} disabled={resolving || !resolveNote.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-secondary text-white hover:brightness-110 transition-all disabled:opacity-50">
                {resolving && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                Resolve Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
