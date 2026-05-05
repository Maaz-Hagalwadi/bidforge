import { useState, useEffect, useRef } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { jobsApi } from '@/api/jobs';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import type { JobResponse } from '@/types/job';

const SIDEBAR_BG = '#0A192F';
const PAGE_SIZE = 10;

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function formatBudget(min: number, max: number, type: string) {
  const s = type === 'HOURLY' ? '/hr' : '';
  return `$${min.toLocaleString()}${s} – $${max.toLocaleString()}${s}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function parseSkills(str?: string): string[] {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

// ── Confirm Dialog ──────────────────────────────────────────────

function ConfirmDialog({
  title, message, confirmLabel, confirmCls, loading, onConfirm, onCancel,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  confirmCls: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !loading && onCancel()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-on-surface">{title}</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-slate-50 transition-colors disabled:opacity-60">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 py-2.5 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-60 ${confirmCls}`}>
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ArchivedJobs ────────────────────────────────────────────────

export default function ArchivedJobs() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sidebarLinks = withActive(CLIENT_SIDEBAR, pathname);

  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [profileOpen, setProfileOpen]       = useState(false);
  const [jobs, setJobs]                     = useState<JobResponse[]>([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [page, setPage]                     = useState(0);
  const [repostTarget, setRepostTarget]     = useState<JobResponse | null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<JobResponse | null>(null);
  const [actionLoading, setActionLoading]   = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    jobsApi.getMyJobs()
      .then(all => setJobs(all.filter(j => j.status === 'CANCELLED')))
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

  const handleRepost = async () => {
    if (!repostTarget) return;
    setActionLoading(true);
    try {
      const updated = await jobsApi.repostJob(repostTarget.id);
      setJobs(prev => prev.filter(j => j.id !== updated.id));
      setRepostTarget(null);
      navigate('/client/jobs');
    } catch {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await jobsApi.deleteJob(deleteTarget.id);
      setJobs(prev => prev.filter(j => j.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // silently keep dialog open so user can retry
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = jobs.filter(j =>
    !search || j.title.toLowerCase().includes(search.toLowerCase())
  );
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

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-h2 font-bold text-on-surface">Archived Jobs</h1>
                <p className="text-sm text-on-surface-variant mt-0.5">Jobs you've archived — repost or permanently remove them.</p>
              </div>
              <button onClick={() => navigate('/client/jobs')}
                className="flex items-center gap-2 px-5 h-10 border border-outline-variant text-on-surface-variant font-semibold rounded-lg hover:bg-slate-50 transition-colors flex-shrink-0 text-sm">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>My Projects
              </button>
            </div>

            {/* Search */}
            <div className="tonal-card rounded-xl p-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                  placeholder="Search archived jobs…"
                  className="w-full pl-9 pr-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors bg-white" />
              </div>
            </div>

            {/* Count */}
            {!loading && (
              <p className="text-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">{filtered.length}</span> archived job{filtered.length !== 1 ? 's' : ''}
                {search && <> matching "<span className="font-semibold text-on-surface">{search}</span>"</>}
              </p>
            )}

            {/* Content */}
            {loading ? (
              <PageLoader message="Loading archived jobs…" />
            ) : filtered.length === 0 ? (
              <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">inventory_2</span>
                <p className="text-on-surface font-semibold">
                  {jobs.length === 0 ? 'No archived jobs' : 'No results found'}
                </p>
                <p className="text-sm text-on-surface-variant max-w-xs">
                  {jobs.length === 0
                    ? "Jobs you archive from My Projects will appear here."
                    : "Try a different search term."}
                </p>
                {search && (
                  <button onClick={() => { setSearch(''); setPage(0); }}
                    className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginated.map(job => {
                    const skills = parseSkills(job.requiredSkills);
                    return (
                      <article key={job.id} className="tonal-card rounded-xl overflow-hidden hover:shadow-md transition-all">
                        <div className="h-[3px] bg-slate-300" />
                        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-5">

                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-2.5">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-[15px] font-bold text-on-surface leading-snug">{job.title}</h3>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[11px] font-bold">Archived</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[11px] font-medium">{job.category}</span>
                                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${job.visibility === 'INVITE_ONLY' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                  <span className="material-symbols-outlined text-[11px]">{job.visibility === 'INVITE_ONLY' ? 'lock' : 'public'}</span>
                                  {job.visibility === 'INVITE_ONLY' ? 'Invite Only' : 'Public'}
                                </span>
                              </div>
                            </div>

                            <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">{job.description}</p>

                            {skills.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {skills.slice(0, 5).map(s => (
                                  <span key={s} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500">{s}</span>
                                ))}
                                {skills.length > 5 && <span className="text-xs text-slate-400 self-center">+{skills.length - 5} more</span>}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                                <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                Posted {formatDate(job.createdAt)}
                              </span>
                              {job.deadline && (
                                <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                                  <span className="material-symbols-outlined text-[13px]">event</span>
                                  Deadline {formatDate(job.deadline)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions + budget */}
                          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-3 flex-shrink-0 sm:min-w-[160px]">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button onClick={() => navigate(`/jobs/${job.id}`)}
                                className="border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors">
                                View
                              </button>
                              <button onClick={() => setRepostTarget(job)}
                                className="flex items-center gap-1 bg-secondary text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
                                <span className="material-symbols-outlined text-[13px]">replay</span>Repost
                              </button>
                              <button onClick={() => setDeleteTarget(job)} title="Delete job"
                                className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors">
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                            <div className="sm:text-right">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Budget</p>
                              <p className="text-sm font-bold text-secondary">{formatBudget(job.budgetMin, job.budgetMax, job.budgetType)}</p>
                            </div>
                          </div>

                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                    <p className="text-sm text-on-surface-variant">
                      Page <span className="font-semibold text-on-surface">{page + 1}</span> of{' '}
                      <span className="font-semibold text-on-surface">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-1">
                      <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                        className="w-9 h-9 flex items-center justify-center border border-outline-variant rounded-lg text-on-surface-variant hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                      </button>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let p: number;
                        if (totalPages <= 7) { p = i; }
                        else if (page < 4) { p = i < 5 ? i : i === 5 ? -1 : totalPages - 1; }
                        else if (page >= totalPages - 4) { p = i === 0 ? 0 : i === 1 ? -1 : totalPages - 7 + i; }
                        else { p = i === 0 ? 0 : i === 1 ? -1 : i === 5 ? -1 : i === 6 ? totalPages - 1 : page - 2 + (i - 2); }
                        if (p === -1) return <span key={`e-${i}`} className="w-9 text-center text-on-surface-variant text-sm">…</span>;
                        return (
                          <button key={p} onClick={() => setPage(p)}
                            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-secondary text-white' : 'border border-outline-variant text-on-surface-variant hover:border-secondary/40'}`}>
                            {p + 1}
                          </button>
                        );
                      })}
                      <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                        className="w-9 h-9 flex items-center justify-center border border-outline-variant rounded-lg text-on-surface-variant hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </div>
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

      {/* Repost confirmation */}
      {repostTarget && (
        <ConfirmDialog
          title="Repost this job?"
          message={<>This will republish <span className="font-semibold text-on-surface">"{repostTarget.title}"</span> as an open job and make it visible to freelancers again.</>}
          confirmLabel="Repost Job"
          confirmCls="bg-secondary hover:brightness-110"
          loading={actionLoading}
          onConfirm={handleRepost}
          onCancel={() => setRepostTarget(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Permanently delete this job?"
          message={<>This will permanently remove <span className="font-semibold text-on-surface">"{deleteTarget.title}"</span> along with all its bids and invites. This cannot be undone.</>}
          confirmLabel="Delete Job"
          confirmCls="bg-red-500 hover:bg-red-600"
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
