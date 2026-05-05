import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { jobsApi } from '@/api/jobs';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import type { BidResponse, JobResponse } from '@/types/job';

const SIDEBAR_BG = '#0A192F';

const JOB_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  OPEN:      { label: 'Open',      cls: 'bg-secondary/10 text-secondary' },
  ASSIGNED:  { label: 'Assigned',  cls: 'bg-green-100 text-green-700'    },
  COMPLETED: { label: 'Completed', cls: 'bg-blue-50 text-blue-600'       },
  DRAFT:     { label: 'Draft',     cls: 'bg-slate-100 text-slate-600'    },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-100 text-red-600'        },
};

type BidTab = 'ALL' | 'HAS_PENDING' | 'HAS_ACCEPTED' | 'HAS_REJECTED';

interface JobBidSummary {
  job: JobResponse;
  bids: BidResponse[];
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ClientBids() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sidebarLinks = withActive(CLIENT_SIDEBAR, pathname);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [summaries, setSummaries] = useState<JobBidSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<BidTab>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    jobsApi.getMyJobs().then(async jobs => {
      const eligible = jobs.filter(j => j.status !== 'DRAFT' && j.status !== 'CANCELLED');
      const results = await Promise.all(
        eligible.map(job =>
          jobsApi.getJobBids(job.id)
            .then(page => ({ job, bids: page.content }))
            .catch(() => ({ job, bids: [] as BidResponse[] }))
        )
      );
      setSummaries(results);
    })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const allBids = summaries.flatMap(s => s.bids);
  const totalBids    = allBids.length;
  const pendingBids  = allBids.filter(b => b.status === 'PENDING').length;
  const acceptedBids = allBids.filter(b => b.status === 'ACCEPTED').length;
  const rejectedBids = allBids.filter(b => b.status === 'REJECTED').length;

  const filtered = summaries.filter(({ bids }) => {
    if (tab === 'HAS_PENDING')  return bids.some(b => b.status === 'PENDING');
    if (tab === 'HAS_ACCEPTED') return bids.some(b => b.status === 'ACCEPTED');
    if (tab === 'HAS_REJECTED') return bids.some(b => b.status === 'REJECTED');
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const navRight = (
    <div className="flex items-center gap-1">
      <NotificationBell />
      <div className="relative" ref={profileRef}>
        <button onClick={() => setProfileOpen(o => !o)} aria-expanded={profileOpen} aria-label="Profile menu"
          className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} className="w-8 h-8 rounded-full object-cover border-2 border-white/20" alt={user.name} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold select-none">{initials}</div>
          )}
          <span className="material-symbols-outlined text-white/60 text-base leading-none">expand_more</span>
        </button>
        {profileOpen && user && <ProfileDropdown user={user} onUpdated={refreshUser} onLogout={handleLogout} />}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="app" authRight={navRight} />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className={['hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-white/10 transition-[width] duration-300 ease-in-out overflow-hidden', sidebarOpen ? 'w-64' : 'w-16'].join(' ')}
          style={{ backgroundColor: SIDEBAR_BG }}
        >
          <div className={`flex items-center h-14 border-b border-white/10 px-3 flex-shrink-0 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 select-none">Menu</span>}
            <button onClick={() => setSidebarOpen(o => !o)} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-xl">{sidebarOpen ? 'menu_open' : 'menu'}</span>
            </button>
          </div>
          <nav className="flex-1 min-h-0 py-2 px-2 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map(({ icon, label, active, path }) => (
              <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
                className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-white/10 text-white font-bold border-l-4 border-secondary' : path ? 'text-white/60 hover:bg-white/10 hover:text-white font-medium' : 'text-white/30 cursor-default font-medium'].join(' ')}>
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
              </button>
            ))}
          </nav>
          <div className="mt-auto p-3 space-y-2 border-t border-white/10 flex-shrink-0">
            {sidebarOpen && (
              <div className="bg-white/5 border border-white/10 text-white rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">PRO PLAN</p>
                <p className="text-xs font-semibold leading-relaxed mb-3 text-white/80">Unlimited active contracts and priority support.</p>
                <button className="w-full py-2 bg-secondary rounded-lg text-xs font-bold hover:brightness-110 transition-all">Upgrade Now</button>
              </div>
            )}
            <button onClick={handleLogout} title={!sidebarOpen ? 'Sign Out' : undefined}
              className={['w-full flex items-center gap-3 rounded-lg py-2.5 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors', sidebarOpen ? 'px-3' : 'justify-center px-2'].join(' ')}>
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
              {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col bg-surface">
          <div className="flex-1 p-6 pb-24 lg:pb-8 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6">

            <div>
              <h1 className="text-h2 font-bold text-on-surface">Bids</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">All bids received across your posted jobs.</p>
            </div>

            {loading ? (
              <PageLoader message="Loading bids…" />
            ) : (
              <>
                {/* Summary stats */}
                {totalBids > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Bids', value: totalBids,    icon: 'gavel',        cls: 'text-secondary'  },
                      { label: 'Pending',    value: pendingBids,  icon: 'schedule',     cls: 'text-amber-600'  },
                      { label: 'Accepted',   value: acceptedBids, icon: 'check_circle', cls: 'text-green-600'  },
                      { label: 'Rejected',   value: rejectedBids, icon: 'cancel',       cls: 'text-slate-500'  },
                    ].map(({ label, value, icon, cls }) => (
                      <div key={label} className="tonal-card rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <span className={`material-symbols-outlined text-[20px] ${cls}`}>{icon}</span>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-on-surface">{value}</p>
                          <p className="text-xs text-on-surface-variant">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {summaries.length === 0 ? (
                  <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-300">gavel</span>
                    <p className="text-on-surface font-semibold">No bids yet</p>
                    <p className="text-sm text-on-surface-variant max-w-xs">
                      Post a job and freelancers will start placing bids.
                    </p>
                    <button onClick={() => navigate('/client/post-job')}
                      className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                      Post a Job
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Filter tabs + view toggle */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex gap-1.5 flex-wrap">
                        {([
                          { key: 'ALL' as const,          label: 'All Jobs',    count: summaries.length                                                           },
                          { key: 'HAS_PENDING' as const,  label: 'Has Pending', count: summaries.filter(s => s.bids.some(b => b.status === 'PENDING')).length  },
                          { key: 'HAS_ACCEPTED' as const, label: 'Has Accepted',count: summaries.filter(s => s.bids.some(b => b.status === 'ACCEPTED')).length },
                          { key: 'HAS_REJECTED' as const, label: 'Has Rejected',count: summaries.filter(s => s.bids.some(b => b.status === 'REJECTED')).length },
                        ]).map(({ key, label, count }) => (
                          <button key={key} onClick={() => { setTab(key); setPage(0); }}
                            className={['flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all', tab === key ? 'bg-secondary text-white shadow-sm' : 'bg-white border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
                            {label}
                            <span className={['text-xs px-1.5 py-0.5 rounded-full font-bold', tab === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-on-surface-variant'].join(' ')}>{count}</span>
                          </button>
                        ))}
                      </div>
                      <div className="hidden lg:flex items-center gap-0.5 p-1 bg-slate-100 rounded-lg border border-slate-200 flex-shrink-0">
                        <button onClick={() => setViewMode('list')} title="List view"
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                          <span className="material-symbols-outlined text-[16px]">view_list</span>
                          <span className="text-xs font-semibold">List</span>
                        </button>
                        <button onClick={() => setViewMode('grid')} title="Grid view"
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                          <span className="material-symbols-outlined text-[16px]">grid_view</span>
                          <span className="text-xs font-semibold">Grid</span>
                        </button>
                      </div>
                    </div>

                    {filtered.length === 0 ? (
                      <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-16 text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
                        <p className="text-on-surface font-semibold">No jobs match this filter</p>
                      </div>
                    ) : (
                      viewMode === 'list' ? (
                      <div className="space-y-3">
                        {paginated.map(({ job, bids }) => {
                          const jst = JOB_STATUS_CFG[job.status] ?? { label: job.status, cls: 'bg-slate-100 text-slate-600' };
                          const pending  = bids.filter(b => b.status === 'PENDING').length;
                          const accepted = bids.filter(b => b.status === 'ACCEPTED').length;
                          const rejected = bids.filter(b => b.status === 'REJECTED').length;
                          return (
                            <article key={job.id} className="tonal-card rounded-xl p-5 hover:shadow-md transition-all">
                              <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${jst.cls}`}>{jst.label}</span>
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">{job.category}</span>
                                  </div>
                                  <h3 className="text-sm font-bold text-on-surface line-clamp-1">{job.title}</h3>
                                  <div className="flex flex-wrap gap-4">
                                    <span className="flex items-center gap-1 text-xs text-on-surface-variant"><span className="material-symbols-outlined text-[14px]">gavel</span><span className="font-semibold text-on-surface">{bids.length}</span> total</span>
                                    {pending > 0 && <span className="flex items-center gap-1 text-xs text-amber-700"><span className="material-symbols-outlined text-[14px]">schedule</span>{pending} pending</span>}
                                    {accepted > 0 && <span className="flex items-center gap-1 text-xs text-green-700"><span className="material-symbols-outlined text-[14px]">check_circle</span>{accepted} accepted</span>}
                                    {rejected > 0 && <span className="flex items-center gap-1 text-xs text-slate-500"><span className="material-symbols-outlined text-[14px]">cancel</span>{rejected} rejected</span>}
                                    {bids.length === 0 && <span className="text-xs text-on-surface-variant italic">No bids yet</span>}
                                  </div>
                                </div>
                                <button
                                  onClick={() => navigate(`/client/jobs/${job.id}/bids`)}
                                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-secondary text-white text-xs font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
                                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                  View Bids
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                      ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {paginated.map(({ job, bids }) => {
                          const jst = JOB_STATUS_CFG[job.status] ?? { label: job.status, cls: 'bg-slate-100 text-slate-600' };
                          const pending  = bids.filter(b => b.status === 'PENDING').length;
                          const accepted = bids.filter(b => b.status === 'ACCEPTED').length;
                          const rejected = bids.filter(b => b.status === 'REJECTED').length;
                          return (
                            <article key={job.id} className="tonal-card rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-all">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${jst.cls}`}>{jst.label}</span>
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">{job.category}</span>
                              </div>
                              <h3 className="text-sm font-bold text-on-surface line-clamp-2">{job.title}</h3>
                              <div className="space-y-1 text-xs text-on-surface-variant">
                                <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">gavel</span><span className="font-semibold text-on-surface">{bids.length}</span> total bids</div>
                                {pending > 0 && <div className="flex items-center gap-1 text-amber-700"><span className="material-symbols-outlined text-[13px]">schedule</span>{pending} pending</div>}
                                {accepted > 0 && <div className="flex items-center gap-1 text-green-700"><span className="material-symbols-outlined text-[13px]">check_circle</span>{accepted} accepted</div>}
                                {rejected > 0 && <div className="flex items-center gap-1 text-slate-500"><span className="material-symbols-outlined text-[13px]">cancel</span>{rejected} rejected</div>}
                              </div>
                              <button
                                onClick={() => navigate(`/client/jobs/${job.id}/bids`)}
                                className="mt-auto w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary text-white text-xs font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
                                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                View Bids
                              </button>
                            </article>
                          );
                        })}
                      </div>
                      )
                    )}

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                          className="flex items-center gap-1 px-3 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          <span className="material-symbols-outlined text-[18px]">chevron_left</span>Prev
                        </button>
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            let p: number;
                            if (totalPages <= 7) { p = i; }
                            else if (page < 4) { p = i < 5 ? i : i === 5 ? -1 : totalPages - 1; }
                            else if (page >= totalPages - 4) { p = i === 0 ? 0 : i === 1 ? -1 : totalPages - 7 + i; }
                            else { p = i === 0 ? 0 : i === 1 ? -1 : i === 5 ? -1 : i === 6 ? totalPages - 1 : page - 2 + (i - 2); }
                            if (p === -1) return <span key={`e-${i}`} className="px-2 py-2 text-on-surface-variant text-sm">…</span>;
                            return (
                              <button key={p} onClick={() => setPage(p)}
                                className={['w-9 h-9 rounded-lg text-sm font-semibold transition-colors', p === page ? 'bg-secondary text-white' : 'border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
                                {p + 1}
                              </button>
                            );
                          })}
                        </div>
                        <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                          className="flex items-center gap-1 px-3 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          Next<span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <Footer />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 flex items-stretch" style={{ backgroundColor: '#0A192F' }}>
        {sidebarLinks.map(({ icon, short, active, path }) => (
          <button key={short} onClick={() => path && navigate(path)}
            className={['flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors', active ? 'text-secondary' : path ? 'text-white/50 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
            <span className="text-[10px] font-semibold leading-none">{short}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
