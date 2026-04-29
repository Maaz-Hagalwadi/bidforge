import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { jobsApi } from '@/api/jobs';
import { Navbar } from '@/components/Navbar';
import { BidForgeLogo } from '@/components/ui/BidForgeLogo';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import type { BidResponse, BidStatus, JobResponse } from '@/types/job';

const SIDEBAR_BG = '#0A192F';
const PAGE_SIZE = 10;

const BID_STATUS_CFG: Record<BidStatus, { label: string; cls: string; icon: string }> = {
  PENDING:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700',  icon: 'schedule'     },
  ACCEPTED: { label: 'Accepted', cls: 'bg-green-100 text-green-700', icon: 'check_circle' },
  REJECTED: { label: 'Rejected', cls: 'bg-slate-100 text-slate-500', icon: 'cancel'       },
};

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ClientJobBids() {
  const { jobId } = useParams<{ jobId: string }>();
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sidebarLinks = withActive(CLIENT_SIDEBAR, pathname);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [bids, setBids] = useState<BidResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | BidStatus>('ALL');
  const [expandedBid, setExpandedBid] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ bidId: string; type: 'accept' | 'decline' } | null>(null);
  const [actioning, setActioning] = useState(false);
  const [actionError, setActionError] = useState('');
  const [page, setPage] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!jobId) return;
    Promise.all([jobsApi.getById(jobId), jobsApi.getJobBids(jobId)])
      .then(([j, b]) => { setJob(j); setBids(b); })
      .catch(() => setLoadError('Failed to load bids. You may not have permission to view this page.'))
      .finally(() => setLoading(false));
  }, [jobId]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const handleConfirmAction = async () => {
    if (!confirmAction || !jobId) return;
    setActioning(true);
    setActionError('');
    try {
      if (confirmAction.type === 'accept') {
        await jobsApi.acceptBid(confirmAction.bidId);
      } else {
        await jobsApi.declineBid(confirmAction.bidId);
      }
      const [updatedJob, updatedBids] = await Promise.all([
        jobsApi.getById(jobId),
        jobsApi.getJobBids(jobId),
      ]);
      setJob(updatedJob);
      setBids(updatedBids);
      setConfirmAction(null);
    } catch {
      setActionError(`Failed to ${confirmAction.type} bid. Please try again.`);
    } finally {
      setActioning(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';
  const isAssigned = job?.status === 'ASSIGNED';

  const counts = {
    ALL:      bids.length,
    PENDING:  bids.filter(b => b.status === 'PENDING').length,
    ACCEPTED: bids.filter(b => b.status === 'ACCEPTED').length,
    REJECTED: bids.filter(b => b.status === 'REJECTED').length,
  };

  const filtered = statusTab === 'ALL' ? bids : bids.filter(b => b.status === statusTab);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const navRight = (
    <div className="flex items-center gap-1">
      <button className="relative p-2 text-white/70 hover:text-white transition-colors" aria-label="Notifications">
        <span className="material-symbols-outlined">notifications</span>
      </button>
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
    <div className="bg-surface min-h-screen flex flex-col">
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
          <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map(({ icon, label, active, path }) => (
              <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
                className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-white/10 text-white font-bold border-l-4 border-secondary' : path ? 'text-white/60 hover:bg-white/10 hover:text-white font-medium' : 'text-white/30 cursor-default font-medium'].join(' ')}>
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-white/10 flex-shrink-0">
            <button onClick={handleLogout} title={!sidebarOpen ? 'Sign Out' : undefined}
              className={['w-full flex items-center gap-3 rounded-lg py-2.5 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors', sidebarOpen ? 'px-3' : 'justify-center px-2'].join(' ')}>
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
              {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          <div className="flex-1 p-6 pb-24 lg:pb-8 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6">

            {/* Back */}
            <button onClick={() => navigate('/client/jobs')}
              className="flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to My Jobs
            </button>

            {loading ? (
              <PageLoader message="Loading bids…" />
            ) : loadError ? (
              <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">error_outline</span>
                <p className="text-on-surface font-semibold">{loadError}</p>
                <button onClick={() => navigate('/client/jobs')}
                  className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                  Back to My Jobs
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-h1 font-bold text-on-surface">Bids Received</h1>
                    {job && (
                      <p className="text-body-md text-on-surface-variant mt-1 line-clamp-1">
                        {job.title}
                      </p>
                    )}
                  </div>
                  {isAssigned && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-semibold flex-shrink-0">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Freelancer Assigned
                    </span>
                  )}
                </div>

                {bids.length === 0 ? (
                  <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-300">gavel</span>
                    <p className="text-on-surface font-semibold">No bids yet</p>
                    <p className="text-sm text-on-surface-variant max-w-xs">
                      Freelancers haven't placed any bids on this job yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Status tabs */}
                    <div className="flex gap-1.5 flex-wrap">
                      {([
                        { key: 'ALL' as const,      label: 'All',      count: counts.ALL      },
                        { key: 'PENDING' as const,  label: 'Pending',  count: counts.PENDING  },
                        { key: 'ACCEPTED' as const, label: 'Accepted', count: counts.ACCEPTED },
                        { key: 'REJECTED' as const, label: 'Rejected', count: counts.REJECTED },
                      ]).map(({ key, label, count }) => (
                        <button key={key}
                          onClick={() => { setStatusTab(key); setPage(0); }}
                          className={['flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all', statusTab === key ? 'bg-secondary text-white shadow-sm' : 'bg-white border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
                          {label}
                          <span className={['text-xs px-1.5 py-0.5 rounded-full font-bold', statusTab === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-on-surface-variant'].join(' ')}>{count}</span>
                        </button>
                      ))}
                    </div>

                    <p className="text-sm text-on-surface-variant">
                      Showing <span className="font-semibold text-on-surface">{paginated.length}</span> of <span className="font-semibold text-on-surface">{filtered.length}</span> bids
                    </p>

                    {filtered.length === 0 ? (
                      <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-16 text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
                        <p className="text-on-surface font-semibold">No bids in this category</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {paginated.map(bid => {
                            const cfg = BID_STATUS_CFG[bid.status];
                            const isExpanded = expandedBid === bid.id;
                            return (
                              <article key={bid.id} className="tonal-card rounded-xl overflow-hidden hover:shadow-md transition-all">
                                <div className="p-5 flex flex-col md:flex-row md:items-start gap-4">
                                  {/* Freelancer avatar */}
                                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                    {getInitials(bid.freelancerName)}
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-bold text-on-surface">{bid.freelancerName}</p>
                                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
                                        <span className="material-symbols-outlined text-[12px]">{cfg.icon}</span>
                                        {cfg.label}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                      <div>
                                        <p className="text-xs text-on-surface-variant">Bid Amount</p>
                                        <p className="text-base font-bold text-secondary">${bid.amount.toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-on-surface-variant">Delivery</p>
                                        <p className="text-sm font-semibold text-on-surface">{bid.deliveryDays} day{bid.deliveryDays !== 1 ? 's' : ''}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-on-surface-variant">Submitted</p>
                                        <p className="text-sm font-semibold text-on-surface">{formatDate(bid.createdAt)}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className={`text-sm text-on-surface-variant leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                                        {bid.proposal}
                                      </p>
                                      {bid.proposal.length > 120 && (
                                        <button
                                          onClick={() => setExpandedBid(isExpanded ? null : bid.id)}
                                          className="text-xs text-secondary font-semibold hover:underline mt-1"
                                        >
                                          {isExpanded ? 'Show less' : 'Read more'}
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Accept / Decline buttons */}
                                  {bid.status === 'PENDING' && !isAssigned && (
                                    <div className="flex gap-2 flex-shrink-0">
                                      <button
                                        onClick={() => { setConfirmAction({ bidId: bid.id, type: 'decline' }); setActionError(''); }}
                                        className="flex items-center gap-1.5 px-3 py-2 border border-outline-variant rounded-lg text-xs font-semibold text-on-surface-variant hover:border-red-300 hover:text-red-500 transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-[15px]">close</span>
                                        Decline
                                      </button>
                                      <button
                                        onClick={() => { setConfirmAction({ bidId: bid.id, type: 'accept' }); setActionError(''); }}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-white text-xs font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all"
                                      >
                                        <span className="material-symbols-outlined text-[15px]">check</span>
                                        Accept
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </article>
                            );
                          })}
                        </div>

                        {totalPages > 1 && (
                          <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <footer className="py-8 px-8 border-t border-white/10 mt-auto" style={{ backgroundColor: '#0A192F' }}>
            <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-4">
              <BidForgeLogo variant="light" />
              <span className="text-slate-500 text-xs">© 2026 BidForge Inc.</span>
            </div>
          </footer>
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

      {/* Confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !actioning && setConfirmAction(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${confirmAction.type === 'accept' ? 'bg-secondary/10' : 'bg-red-50'}`}>
                <span className={`material-symbols-outlined text-2xl ${confirmAction.type === 'accept' ? 'text-secondary' : 'text-red-500'}`}>
                  {confirmAction.type === 'accept' ? 'gavel' : 'cancel'}
                </span>
              </div>
              <h2 className="text-base font-bold text-on-surface">
                {confirmAction.type === 'accept' ? 'Accept this bid?' : 'Decline this bid?'}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {confirmAction.type === 'accept'
                  ? 'This will assign the freelancer to your job and reject all other pending bids. This action cannot be undone.'
                  : 'The freelancer will be notified that their bid was not selected.'}
              </p>
            </div>
            {actionError && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                <span className="material-symbols-outlined text-red-500 text-[16px] flex-shrink-0">error</span>
                <p className="text-xs text-red-600">{actionError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={actioning}
                className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actioning}
                className={`flex-1 py-2.5 text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 ${confirmAction.type === 'accept' ? 'bg-secondary' : 'bg-red-500'}`}
              >
                {actioning
                  ? (confirmAction.type === 'accept' ? 'Accepting…' : 'Declining…')
                  : (confirmAction.type === 'accept' ? 'Yes, Accept' : 'Yes, Decline')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaginationBar({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button disabled={page === 0} onClick={() => onPageChange(page - 1)}
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
            <button key={p} onClick={() => onPageChange(p)}
              className={['w-9 h-9 rounded-lg text-sm font-semibold transition-colors', p === page ? 'bg-secondary text-white' : 'border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
              {p + 1}
            </button>
          );
        })}
      </div>
      <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}
        className="flex items-center gap-1 px-3 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        Next<span className="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    </div>
  );
}
