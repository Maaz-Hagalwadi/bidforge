import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { adminApi, type LoginActivityRecord } from '@/api/admin';
import { PageLoader } from '@/components/ui/PageLoader';
import type { SpringPage } from '@/types/job';

type MethodFilter = 'ALL' | 'EMAIL' | 'GOOGLE' | 'OTP';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

function parseBrowser(ua: string | null): string {
  if (!ua) return '—';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('MSIE') || ua.includes('Trident/')) return 'IE';
  if (ua.includes('curl')) return 'cURL';
  if (ua.includes('PostmanRuntime')) return 'Postman';
  return ua.split(' ')[0].slice(0, 20);
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function MethodBadge({ method }: { method: LoginActivityRecord['loginMethod'] }) {
  const map = {
    EMAIL:  { color: 'bg-blue-500/10 text-blue-600', icon: 'mail' },
    GOOGLE: { color: 'bg-red-500/10 text-red-500',   icon: 'g_mobiledata' },
    OTP:    { color: 'bg-purple-500/10 text-purple-600', icon: 'pin' },
  };
  const { color, icon } = map[method] ?? map.EMAIL;
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold w-fit ${color}`}>
      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      {method.charAt(0) + method.slice(1).toLowerCase()}
    </span>
  );
}

const PAGE_SIZE = 20;

const PILL_TABS: { label: string; value: MethodFilter }[] = [
  { label: 'All',    value: 'ALL'    },
  { label: 'Email',  value: 'EMAIL'  },
  { label: 'Google', value: 'GOOGLE' },
  { label: 'OTP',    value: 'OTP'    },
];

export default function AdminLoginActivity() {
  const [data, setData] = useState<SpringPage<LoginActivityRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('ALL');

  const fetchData = useCallback(() => {
    setLoading(true);
    adminApi.getLoginActivity(page, PAGE_SIZE)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data
    ? {
        ...data,
        content: methodFilter === 'ALL'
          ? data.content
          : data.content.filter(r => r.loginMethod === methodFilter),
      }
    : null;

  const totalPages = data ? data.totalPages : 1;
  const currentPage = data ? data.number : 0;

  return (
    <AdminLayout>
      <div className="p-4 pb-8 lg:p-8 space-y-6 max-w-[1280px] w-full mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
          <div>
            <h1 className="text-2xl font-bold text-on-surface leading-tight">Login Activity</h1>
            <p className="text-sm text-on-surface-variant mt-1">Track every successful login — who, when, and from where.</p>
          </div>
          {data && (
            <div className="tonal-card px-4 py-2.5 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">history</span>
              <span className="text-sm font-semibold text-on-surface">{data.totalElements.toLocaleString()} total logins</span>
            </div>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {PILL_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setMethodFilter(tab.value)}
              className={[
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap',
                methodFilter === tab.value
                  ? 'bg-secondary text-white'
                  : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/20',
              ].join(' ')}
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
                  {['User', 'Method', 'IP Address', 'Location', 'Browser', 'When'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16">
                      <PageLoader message="Loading login activity…" />
                    </td>
                  </tr>
                ) : !filtered || filtered.content.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-5xl text-on-surface-variant">manage_accounts</span>
                        <p className="text-sm text-on-surface-variant font-medium">No login records found</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.content.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary text-xs flex-shrink-0 select-none">
                          {getInitials(r.userName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate max-w-[160px]">{r.userName}</p>
                          <p className="text-xs text-on-surface-variant truncate max-w-[160px]">{r.userEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Method */}
                    <td className="px-6 py-4">
                      <MethodBadge method={r.loginMethod} />
                    </td>

                    {/* IP */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-on-surface-variant bg-slate-100 dark:bg-white/10 px-2 py-1 rounded">
                        {r.ipAddress ?? '—'}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                      {r.city || r.country ? (
                        <span className="flex items-center gap-1.5">
                          {r.countryCode && (
                            <span className="text-base leading-none" title={r.country ?? undefined}>
                              {countryFlag(r.countryCode)}
                            </span>
                          )}
                          {[r.city, r.country].filter(Boolean).join(', ')}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/40">—</span>
                      )}
                    </td>

                    {/* Browser */}
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {parseBrowser(r.userAgent)}
                    </td>

                    {/* When */}
                    <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap" title={new Date(r.createdAt).toLocaleString()}>
                      {timeAgo(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalElements > 0 && (
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-on-surface-variant">
                Page {currentPage + 1} of {totalPages} &middot; {data.totalElements.toLocaleString()} records
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
