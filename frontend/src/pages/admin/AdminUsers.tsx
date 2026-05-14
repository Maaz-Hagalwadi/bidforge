import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { adminApi, type AdminUser, type AdminStats } from '@/api/admin';
import { PageLoader } from '@/components/ui/PageLoader';
import type { SpringPage } from '@/types/job';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

type StatusFilter = 'ALL' | 'VERIFIED' | 'PENDING' | 'FLAGGED';

function getUserStatus(u: AdminUser): StatusFilter {
  if (u.banned) return 'FLAGGED';
  if (!u.emailVerified) return 'PENDING';
  return 'VERIFIED';
}

function StatusBadge({ u }: { u: AdminUser }) {
  const status = getUserStatus(u);
  if (status === 'VERIFIED') return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-600 rounded-md text-xs font-semibold w-fit">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      Verified
    </span>
  );
  if (status === 'PENDING') return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-md text-xs font-semibold w-fit">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Pending
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-500 rounded-md text-xs font-semibold w-fit">
      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
      Flagged
    </span>
  );
}

export default function AdminUsers() {
  const _navigate = useNavigate(); void _navigate;

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [data, setData] = useState<SpringPage<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    adminApi.getStats().then(setStats).catch(() => {});
  }, []);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    adminApi.getUsers(page, 10, undefined, query, statusFilter === 'ALL' ? undefined : statusFilter)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, query, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setQuery(searchInput); setPage(0); }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const handleBanToggle = async (u: AdminUser) => {
    setActionLoading(u.id);
    try {
      if (u.banned) await adminApi.unbanUser(u.id);
      else await adminApi.banUser(u.id);
      fetchUsers();
      adminApi.getStats().then(setStats).catch(() => {});
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (u: AdminUser) => {
    setActionLoading(u.id);
    setConfirmDelete(null);
    try {
      await adminApi.deleteUser(u.id);
      fetchUsers();
      adminApi.getStats().then(setStats).catch(() => {});
    } finally {
      setActionLoading(null);
    }
  };

  const PILL_TABS: { label: string; value: StatusFilter }[] = [
    { label: 'All Users', value: 'ALL' },
    { label: 'Verified',  value: 'VERIFIED' },
    { label: 'Pending',   value: 'PENDING' },
    { label: 'Flagged',   value: 'FLAGGED' },
  ];

  const totalPages = data ? data.totalPages : 1;
  const currentPage = data ? data.number : 0;

  return (
    <AdminLayout>
      <div className="p-4 pb-8 lg:p-8 space-y-6 max-w-[1280px] w-full mx-auto">

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
          <div>
            <h1 className="text-2xl font-bold text-on-surface leading-tight">User Management</h1>
            <p className="text-sm text-on-surface-variant mt-1">Oversee, verify, and moderate the BidForge community.</p>
          </div>
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-slate-200 dark:border-white/10 bg-transparent rounded-lg w-72 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 text-on-surface placeholder:text-on-surface-variant transition-all"
            />
          </div>
        </div>

        {/* Bento stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => { setStatusFilter('PENDING'); setPage(0); }}
            className="tonal-card flex flex-col p-5 rounded-xl hover:ring-2 hover:ring-secondary/30 transition-all group text-left"
          >
            <span className="material-symbols-outlined text-secondary mb-3 text-[26px]">pending_actions</span>
            <span className="text-3xl font-bold text-on-surface leading-none">{stats?.pendingVerifications ?? '—'}</span>
            <span className="text-sm font-semibold text-on-surface-variant mt-1">Pending Verifications</span>
            <div className="mt-3 text-xs font-semibold text-secondary group-hover:underline flex items-center gap-1">
              View List <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </div>
          </button>

          <button
            onClick={() => { setStatusFilter('FLAGGED'); setPage(0); }}
            className="tonal-card flex flex-col p-5 rounded-xl hover:ring-2 hover:ring-red-500/30 transition-all group text-left"
          >
            <span className="material-symbols-outlined text-red-500 mb-3 text-[26px]">report</span>
            <span className="text-3xl font-bold text-on-surface leading-none">{stats?.bannedUsers ?? '—'}</span>
            <span className="text-sm font-semibold text-on-surface-variant mt-1">Flagged Users</span>
            <div className="mt-3 text-xs font-semibold text-red-500 group-hover:underline flex items-center gap-1">
              View Flagged <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </div>
          </button>

          {/* Growth card */}
          <div className="md:col-span-2 flex flex-col p-5 bg-secondary text-white rounded-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-base font-bold mb-0.5">Platform Growth</h3>
              <p className="text-xs opacity-70 mb-4">Total registered users.</p>
              <div className="flex gap-8">
                <div>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Total Users</p>
                  <p className="text-3xl font-bold mt-0.5">{stats?.totalUsers?.toLocaleString() ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Freelancers</p>
                  <p className="text-3xl font-bold mt-0.5">{stats?.totalFreelancers?.toLocaleString() ?? '—'}</p>
                </div>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 pointer-events-none">
              <span className="material-symbols-outlined text-[160px]">monitoring</span>
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {PILL_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(0); }}
              className={['px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap', statusFilter === tab.value ? 'bg-secondary text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/20'].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="tonal-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10">
                  {['Name & Email', 'Role', 'Status', 'Joined', 'Actions'].map((h, i) => (
                    <th key={h} className={`px-6 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16">
                      <PageLoader message="Loading users…" />
                    </td>
                  </tr>
                ) : !data || data.content.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-5xl text-on-surface-variant">group_off</span>
                        <p className="text-sm text-on-surface-variant font-medium">No users found</p>
                      </div>
                    </td>
                  </tr>
                ) : data.content.map(u => {
                  const status = getUserStatus(u);
                  const isBusy = actionLoading === u.id;
                  return (
                    <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group ${u.banned ? 'opacity-70' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.profileImageUrl ? (
                            <img src={u.profileImageUrl} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt={u.name} />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary text-sm flex-shrink-0 select-none">
                              {getInitials(u.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-on-surface truncate">{u.name}</p>
                            <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/10 text-on-surface-variant rounded-md text-xs font-semibold">
                          {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge u={u} />
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.role !== 'ADMIN' && (
                            <>
                              {status === 'FLAGGED' && (
                                <button disabled={isBusy} onClick={() => handleBanToggle(u)}
                                  className="px-3 py-1 border border-slate-200 dark:border-white/20 text-on-surface-variant rounded text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                                  {isBusy ? '…' : 'Unban'}
                                </button>
                              )}
                              <button onClick={() => window.open(`/profile/${u.id}?from=admin`, '_blank')}
                                className="p-1.5 text-secondary hover:bg-secondary/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                title="View profile (opens in new tab)">
                                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                              </button>
                              {status !== 'FLAGGED' && (
                                <button disabled={isBusy} onClick={() => handleBanToggle(u)}
                                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                  title="Ban user">
                                  {isBusy
                                    ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                    : <span className="material-symbols-outlined text-[18px]">flag</span>}
                                </button>
                              )}
                              <button disabled={isBusy} onClick={() => setConfirmDelete(u)}
                                className="p-1.5 text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                title="Delete user">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </>
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
                Showing {data.number * 10 + 1}–{Math.min((data.number + 1) * 10, data.totalElements)} of {data.totalElements.toLocaleString()} users
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

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="tonal-card w-full max-w-sm rounded-2xl shadow-2xl p-6 pointer-events-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-red-500 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface">Delete User</h3>
                <p className="text-sm text-on-surface-variant">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant mb-5">
              Permanently delete <strong className="text-on-surface">{confirmDelete.name}</strong> from the platform?
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors">
                Delete
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-on-surface">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
