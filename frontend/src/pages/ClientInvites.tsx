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
import type { JobInviteStatus } from '@/types/job';

const SIDEBAR_BG = '#0A192F';
const PAGE_SIZE = 10;

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  INVITED:  { label: 'Sent',     cls: 'bg-amber-50 text-amber-700'   },
  ACCEPTED: { label: 'Accepted', cls: 'bg-green-100 text-green-700'  },
  DECLINED: { label: 'Declined', cls: 'bg-slate-100 text-slate-500'  },
};

export default function ClientInvites() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sidebarLinks = withActive(CLIENT_SIDEBAR, pathname);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [invites, setInvites] = useState<JobInviteStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<'ALL' | 'INVITED' | 'ACCEPTED' | 'DECLINED'>('ALL');
  const [page, setPage] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    jobsApi.getAllClientInvites()
      .then(setInvites)
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

  const counts = {
    ALL:      invites.length,
    INVITED:  invites.filter(i => i.status === 'INVITED').length,
    ACCEPTED: invites.filter(i => i.status === 'ACCEPTED').length,
    DECLINED: invites.filter(i => i.status === 'DECLINED').length,
  };

  const filtered = invites.filter(i => statusTab === 'ALL' || i.status === statusTab);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
    <div className="bg-surface min-h-screen flex flex-col">
      <Navbar variant="app" authRight={navRight} />

      <div className="flex flex-1 min-h-0">
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
          <div className="p-3 space-y-2 border-t border-white/10 flex-shrink-0">
            <button onClick={handleLogout} title={!sidebarOpen ? 'Sign Out' : undefined}
              className={['w-full flex items-center gap-3 rounded-lg py-2.5 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors', sidebarOpen ? 'px-3' : 'justify-center px-2'].join(' ')}>
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
              {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          <div className="flex-1 p-6 pb-24 lg:pb-8 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6">

            <div>
              <h1 className="text-h1 font-bold text-on-surface">Invites Sent</h1>
              <p className="text-body-md text-on-surface-variant mt-1">Freelancers you've personally invited to your jobs.</p>
            </div>

            {loading ? (
              <PageLoader message="Loading invites…" />
            ) : invites.length === 0 ? (
              <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">mail_outline</span>
                <p className="text-on-surface font-semibold">No invites sent yet</p>
                <p className="text-sm text-on-surface-variant max-w-xs">Invite freelancers to your jobs from the My Projects page.</p>
                <button onClick={() => navigate('/client/post-job')}
                  className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                  Post a Job
                </button>
              </div>
            ) : (
              <div className="space-y-5">

                {/* Status tabs */}
                <div className="flex gap-1.5 flex-wrap">
                  {([
                    { key: 'ALL',      label: 'All',      count: counts.ALL      },
                    { key: 'INVITED',  label: 'Sent',     count: counts.INVITED  },
                    { key: 'ACCEPTED', label: 'Accepted', count: counts.ACCEPTED },
                    { key: 'DECLINED', label: 'Declined', count: counts.DECLINED },
                  ] as const).map(({ key, label, count }) => (
                    <button key={key}
                      onClick={() => { setStatusTab(key); setPage(0); }}
                      className={['flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all', statusTab === key ? 'bg-secondary text-white shadow-sm' : 'bg-white border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
                      {label}
                      <span className={['text-xs px-1.5 py-0.5 rounded-full font-bold', statusTab === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-on-surface-variant'].join(' ')}>{count}</span>
                    </button>
                  ))}
                </div>

                <p className="text-sm text-on-surface-variant">
                  Showing <span className="font-semibold text-on-surface">{paginated.length}</span> of <span className="font-semibold text-on-surface">{filtered.length}</span> invites
                </p>

                {filtered.length === 0 ? (
                  <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-16 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
                    <p className="text-on-surface font-semibold">No invites in this category</p>
                  </div>
                ) : (
                  <>
                    {/* Table */}
                    <div className="tonal-card rounded-xl overflow-hidden">
                      {/* Header — hidden on mobile */}
                      <div className="hidden md:grid grid-cols-[1fr_1fr_120px_140px] gap-4 px-5 py-3 border-b border-outline-variant bg-slate-50/50">
                        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Freelancer</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Job</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Status</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Invited On</span>
                      </div>

                      <div className="divide-y divide-outline-variant">
                        {paginated.map(inv => {
                          const badge = STATUS_BADGE[inv.status] ?? { label: inv.status, cls: 'bg-slate-100 text-slate-600' };
                          return (
                            <div key={inv.inviteId} className="px-5 py-4 flex flex-col md:grid md:grid-cols-[1fr_1fr_120px_140px] md:items-center gap-3 md:gap-4 hover:bg-slate-50/50 transition-colors">
                              {/* Freelancer */}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-on-surface truncate">{inv.freelancerName}</p>
                                <p className="text-xs text-on-surface-variant truncate">{inv.freelancerEmail}</p>
                              </div>
                              {/* Job */}
                              <button
                                onClick={() => navigate(`/jobs/${inv.jobId}`, { state: { from: 'myjobs' } })}
                                className="text-sm font-medium text-secondary hover:underline text-left truncate">
                                {inv.jobTitle}
                              </button>
                              {/* Status */}
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${badge.cls}`}>
                                {inv.status === 'INVITED'  && <span className="material-symbols-outlined text-[12px]">schedule</span>}
                                {inv.status === 'ACCEPTED' && <span className="material-symbols-outlined text-[12px]">check_circle</span>}
                                {inv.status === 'DECLINED' && <span className="material-symbols-outlined text-[12px]">cancel</span>}
                                {badge.label}
                              </span>
                              {/* Date */}
                              <p className="text-xs text-on-surface-variant">{formatDate(inv.invitedAt)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {totalPages > 1 && (
                      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <Footer />
        </main>
      </div>

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

function PaginationBar({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        className="flex items-center gap-1 px-3 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <span className="material-symbols-outlined text-[18px]">chevron_left</span>Prev
      </button>
      <div className="flex gap-1">
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let p: number;
          if (totalPages <= 7) {
            p = i;
          } else if (page < 4) {
            p = i < 5 ? i : i === 5 ? -1 : totalPages - 1;
          } else if (page >= totalPages - 4) {
            p = i === 0 ? 0 : i === 1 ? -1 : totalPages - 7 + i;
          } else {
            p = i === 0 ? 0 : i === 1 ? -1 : i === 5 ? -1 : i === 6 ? totalPages - 1 : page - 2 + (i - 2);
          }
          if (p === -1) return <span key={`ellipsis-${i}`} className="px-2 py-2 text-on-surface-variant text-sm">…</span>;
          return (
            <button key={p} onClick={() => onPageChange(p)}
              className={['w-9 h-9 rounded-lg text-sm font-semibold transition-colors', p === page ? 'bg-secondary text-white' : 'border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
              {p + 1}
            </button>
          );
        })}
      </div>
      <button
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        className="flex items-center gap-1 px-3 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        Next<span className="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    </div>
  );
}
