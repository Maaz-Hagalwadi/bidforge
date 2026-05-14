import { useTheme } from '@/context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, FREELANCER_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { disputesApi } from '@/api/disputes';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import { MobileNavDrawer } from '@/components/MobileNavDrawer';
import type { DisputeResponse, DisputeStatus } from '@/types/dispute';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(d?: string) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_CFG: Record<DisputeStatus, { label: string; cls: string; icon: string }> = {
  OPEN:         { label: 'Open',         cls: 'bg-amber-50 text-amber-700',     icon: 'warning'        },
  UNDER_REVIEW: { label: 'Under Review', cls: 'bg-secondary/10 text-secondary', icon: 'manage_search'  },
  RESOLVED:     { label: 'Resolved',     cls: 'bg-emerald-50 text-emerald-700', icon: 'task_alt'       },
  CLOSED:       { label: 'Closed',       cls: 'bg-slate-100 text-slate-500',    icon: 'lock'           },
};

type FilterTab = 'ALL' | DisputeStatus;

export default function Disputes() {
  const { user, logout, refreshUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const sidebarLinks = withActive(
    user?.role === 'FREELANCER' ? FREELANCER_SIDEBAR : CLIENT_SIDEBAR,
    pathname
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [disputes, setDisputes] = useState<DisputeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);

  // Resolve modal state
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    disputesApi.getMyDisputes()
      .then(setDisputes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const handleResolve = async () => {
    if (!resolvingId) return;
    setResolveLoading(true);
    try {
      const updated = await disputesApi.resolveDispute(resolvingId, resolveNote.trim());
      setDisputes(prev => prev.map(d => d.id === resolvingId ? updated : d));
      setToast({ message: 'Dispute marked as resolved.' });
      setResolvingId(null);
      setResolveNote('');
    } catch {
      setToast({ message: 'Failed to resolve dispute. Try again.', error: true });
    } finally {
      setResolveLoading(false);
    }
  };

  const filtered = filter === 'ALL' ? disputes : disputes.filter(d => d.status === filter);

  const counts: Record<FilterTab, number> = {
    ALL: disputes.length,
    OPEN: disputes.filter(d => d.status === 'OPEN').length,
    UNDER_REVIEW: disputes.filter(d => d.status === 'UNDER_REVIEW').length,
    RESOLVED: disputes.filter(d => d.status === 'RESOLVED').length,
    CLOSED: disputes.filter(d => d.status === 'CLOSED').length,
  };

  const navRight = (
    <div className="flex items-center gap-1">
      <NotificationBell />
      <div className="relative" ref={profileRef}>
        <button onClick={() => setProfileOpen(o => !o)} aria-expanded={profileOpen} aria-label="Profile menu"
          className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} className="w-8 h-8 rounded-full object-cover border-2 border-slate-300 dark:border-white/20" alt={user?.name} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-slate-900 dark:text-white text-sm font-bold select-none">{initials}</div>
          )}
          <span className="material-symbols-outlined text-slate-900 dark:text-white/60 text-base leading-none">expand_more</span>
        </button>
        {profileOpen && user && <ProfileDropdown user={user} onUpdated={refreshUser} onLogout={handleLogout} />}
      </div>
    </div>
  );

  const navLeft = (
    <button onClick={() => setDrawerOpen(true)} className="p-1.5 text-slate-900 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors" aria-label="Open menu">
      <span className="material-symbols-outlined text-[22px]">menu</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="app" authRight={navRight} navLeft={navLeft} />
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} links={sidebarLinks} onLogout={handleLogout} />

      <div className="flex flex-1 min-h-0">
        <aside
          className={['hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-slate-200 dark:border-white/10 transition-[width] duration-300 ease-in-out overflow-hidden', sidebarOpen ? 'w-64' : 'w-16'].join(' ')}
          style={{ backgroundColor: theme === 'dark' ? '#0A192F' : '#ffffff' }}
        >
          <div className={`flex items-center h-14 border-b border-slate-200 dark:border-white/10 px-3 flex-shrink-0 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white/60 select-none">Menu</span>}
            <button onClick={() => setSidebarOpen(o => !o)} className="p-1.5 text-slate-900 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-xl">{sidebarOpen ? 'menu_open' : 'menu'}</span>
            </button>
          </div>
          <nav className="flex-1 min-h-0 py-2 px-2 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map(({ icon, label, active, path }) => (
              <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
                className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150 font-medium', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-slate-100 dark:bg-white/20 text-slate-900 dark:text-white font-bold border-l-4 border-secondary' : path ? 'text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white' : 'text-slate-300 dark:text-white/30 cursor-default'].join(' ')}>
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
              </button>
            ))}
          </nav>
          <div className="mt-auto p-3 border-t border-slate-200 dark:border-white/10 flex-shrink-0">
            <button onClick={handleLogout} title={!sidebarOpen ? 'Sign Out' : undefined}
              className={['w-full flex items-center gap-3 rounded-lg py-2.5 text-slate-900 dark:text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors', sidebarOpen ? 'px-3' : 'justify-center px-2'].join(' ')}>
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
              {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col bg-surface">
          <div className="flex-1 p-4 pb-6 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6">
            <div>
              <h1 className="text-h2 font-bold text-on-surface">Disputes</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">Track and manage your dispute requests.</p>
            </div>

            {loading ? (
              <PageLoader message="Loading disputes…" />
            ) : disputes.length === 0 ? (
              <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center border border-outline-variant">
                <span className="material-symbols-outlined text-5xl text-slate-400">balance</span>
                <p className="text-on-surface font-semibold">No disputes filed</p>
                <p className="text-sm text-on-surface-variant max-w-xs">Disputes can be opened from the Contracts page if you have an issue with an active contract.</p>
                <button onClick={() => navigate('/contracts')}
                  className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                  View Contracts
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Filter tabs */}
                <div className="flex gap-1.5 flex-wrap">
                  {([
                    { key: 'ALL' as FilterTab,          label: 'All'          },
                    { key: 'OPEN' as FilterTab,         label: 'Open'         },
                    { key: 'UNDER_REVIEW' as FilterTab, label: 'Under Review' },
                    { key: 'RESOLVED' as FilterTab,     label: 'Resolved'     },
                    { key: 'CLOSED' as FilterTab,       label: 'Closed'       },
                  ]).map(({ key, label }) => counts[key] === 0 && key !== 'ALL' ? null : (
                    <button key={key} onClick={() => setFilter(key)}
                      className={['flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all', filter === key ? 'bg-secondary text-white shadow-sm' : 'bg-white border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
                      {label}
                      <span className={['text-xs px-1.5 py-0.5 rounded-full font-bold', filter === key ? 'bg-white/20 text-slate-900 dark:text-white' : 'bg-slate-100 text-on-surface-variant'].join(' ')}>{counts[key]}</span>
                    </button>
                  ))}
                </div>

                {filtered.length === 0 ? (
                  <div className="tonal-card rounded-xl flex flex-col items-center gap-3 py-14 text-center border border-outline-variant">
                    <span className="material-symbols-outlined text-4xl text-slate-400">search_off</span>
                    <p className="text-on-surface-variant font-semibold text-sm">No disputes in this category</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filtered.map(dispute => {
                      const cfg = STATUS_CFG[dispute.status];
                      const isOwner = dispute.openedById === user?.id;
                      return (
                        <div key={dispute.id} className="tonal-card rounded-xl border border-outline-variant p-5 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${cfg.cls}`}>
                                  <span className="material-symbols-outlined text-[13px]">{cfg.icon}</span>
                                  {cfg.label}
                                </span>
                                {isOwner && <span className="text-xs text-on-surface-variant px-2 py-0.5 bg-surface-container rounded border border-outline-variant">Filed by you</span>}
                              </div>
                              <h3 className="text-base font-bold text-on-surface">{dispute.jobTitle}</h3>
                              <p className="text-xs text-on-surface-variant">Opened {formatDate(dispute.createdAt)} by {dispute.openedByName}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              {isOwner && dispute.status === 'OPEN' && (
                                <button onClick={() => { setResolvingId(dispute.id); setResolveNote(''); }}
                                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">handshake</span>
                                  Mark Resolved
                                </button>
                              )}
                              <button onClick={() => navigate(`/contracts/${dispute.contractId}`)}
                                className="px-4 py-1.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                View Contract
                              </button>
                            </div>
                          </div>

                          <div className="bg-surface-container rounded-lg p-3 border border-outline-variant">
                            <p className="text-xs font-semibold text-on-surface-variant mb-1">Reason</p>
                            <p className="text-sm text-on-surface">{dispute.reason}</p>
                          </div>

                          {resolvingId === dispute.id && (
                            <div className="border border-emerald-200 bg-emerald-50/50 rounded-lg p-4 space-y-3">
                              <p className="text-sm font-semibold text-on-surface">Add a resolution note (optional)</p>
                              <textarea rows={2} value={resolveNote} onChange={e => setResolveNote(e.target.value)}
                                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:border-secondary resize-none"
                                placeholder="Describe how this was resolved…" />
                              <div className="flex gap-2">
                                <button onClick={handleResolve} disabled={resolveLoading}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:brightness-110 disabled:opacity-60 transition-all">
                                  {resolveLoading ? <><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>Saving…</> : <><span className="material-symbols-outlined text-[14px]">check</span>Confirm Resolved</>}
                                </button>
                                <button onClick={() => setResolvingId(null)}
                                  className="px-4 py-2 border border-outline-variant text-xs font-semibold text-on-surface-variant rounded-lg hover:bg-surface-container transition-colors">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {dispute.resolutionNote && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">task_alt</span>
                                Resolution
                              </p>
                              <p className="text-sm text-emerald-800">{dispute.resolutionNote}</p>
                              {dispute.resolvedAt && <p className="text-xs text-emerald-600 mt-1">Resolved {formatDate(dispute.resolvedAt)}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <Footer />
        </main>
      </div>

      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold ${toast.error ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          <span className="material-symbols-outlined text-[18px]">{toast.error ? 'error' : 'check_circle'}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
