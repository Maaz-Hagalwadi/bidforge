import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { jobsApi } from '@/api/jobs';
import { usersApi, type FreelancerSearchResult } from '@/api/users';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import type { JobInviteStatus, JobResponse } from '@/types/job';


const SIDEBAR_BG = '#0A192F';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'bg-slate-100 text-slate-600'    },
  OPEN:      { label: 'Open',      cls: 'bg-secondary/10 text-secondary' },
  ASSIGNED:  { label: 'Assigned',  cls: 'bg-green-100 text-green-700'    },
  COMPLETED: { label: 'Completed', cls: 'bg-blue-50 text-blue-600'       },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-100 text-red-600'        },
};

const STATUS_TABS = ['ALL', 'OPEN', 'DRAFT', 'ASSIGNED', 'COMPLETED', 'CANCELLED'] as const;
type StatusFilter = (typeof STATUS_TABS)[number];

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

// ── Invite Modal ───────────────────────────────────────────────

function getInitialsFrom(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function InviteModal({ job, onClose }: { job: JobResponse; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FreelancerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<FreelancerSearchResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [alreadyInvitedIds, setAlreadyInvitedIds] = useState<Set<number>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    jobsApi.getJobInvites(job.id)
      .then(invitees => setAlreadyInvitedIds(new Set(invitees.map(i => i.freelancerId))))
      .catch(() => {});
  }, [job.id]);

  const search = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    usersApi.searchFreelancers(q)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  const isAlreadyInvited = selected ? alreadyInvitedIds.has(selected.id) : false;

  const handleInvite = async () => {
    if (!selected || isAlreadyInvited) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      await jobsApi.inviteFreelancer(job.id, selected.id);
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg('Failed to send invite. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-on-surface">Invite Freelancer</h2>
            <p className="text-sm text-on-surface-variant mt-0.5 line-clamp-1">{job.title}</p>
          </div>
          <button onClick={onClose} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
            </div>
            <p className="font-semibold text-on-surface">Invite sent!</p>
            <p className="text-sm text-on-surface-variant">{selected?.name} has been invited to this job.</p>
            <button onClick={onClose} className="mt-2 px-6 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Search Freelancer
              </label>

              {selected ? (
                <div className="flex items-center gap-3 px-3 py-2.5 border border-secondary/40 bg-secondary/5 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {selected.profileImageUrl
                      ? <img src={selected.profileImageUrl} className="w-8 h-8 rounded-full object-cover" alt={selected.name} />
                      : getInitialsFrom(selected.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{selected.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{selected.email}</p>
                  </div>
                  <button onClick={() => { setSelected(null); setQuery(''); setResults([]); }}
                    className="p-1 text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search by name or email…"
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors"
                  />
                  {(results.length > 0 || searching || query.trim()) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-10 overflow-hidden">
                      {searching ? (
                        <div className="px-4 py-3 text-sm text-on-surface-variant">Searching…</div>
                      ) : results.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-on-surface-variant">No freelancers found.</div>
                      ) : (
                        results.map(r => (
                          <button key={r.id} onClick={() => { setSelected(r); setResults([]); setQuery(''); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {r.profileImageUrl
                                ? <img src={r.profileImageUrl} className="w-8 h-8 rounded-full object-cover" alt={r.name} />
                                : getInitialsFrom(r.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-on-surface truncate">{r.name}</p>
                              <p className="text-xs text-on-surface-variant truncate">{r.email}</p>
                            </div>
                            {r.rating && (
                              <span className="flex items-center gap-0.5 text-xs text-amber-500 flex-shrink-0">
                                <span className="material-symbols-outlined text-[13px]">star</span>
                                {r.rating.toFixed(1)}
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              {isAlreadyInvited && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="material-symbols-outlined text-amber-600 text-[15px]">info</span>
                  <p className="text-xs text-amber-700 font-medium">This freelancer has already been invited to this job.</p>
                </div>
              )}
              {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleInvite} disabled={!selected || status === 'loading' || isAlreadyInvited}
                className="flex-1 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60">
                {status === 'loading' ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── InviteesModal ──────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: string }> = {
  INVITED:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700',   icon: 'schedule'      },
  ACCEPTED: { label: 'Accepted', cls: 'bg-green-100 text-green-700',  icon: 'check_circle'  },
  DECLINED: { label: 'Declined', cls: 'bg-slate-100 text-slate-500',  icon: 'cancel'        },
};

type InviteTab = 'ALL' | 'ACCEPTED' | 'INVITED' | 'DECLINED';

const INVITE_TABS: { key: InviteTab; label: string }[] = [
  { key: 'ALL',      label: 'All'      },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'INVITED',  label: 'Pending'  },
  { key: 'DECLINED', label: 'Declined' },
];

function InviteesModal({ job, onClose }: { job: JobResponse; onClose: () => void }) {
  const [invitees, setInvitees] = useState<JobInviteStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<InviteTab>('ALL');

  useEffect(() => {
    jobsApi.getJobInvites(job.id)
      .then(setInvitees)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [job.id]);

  const tabCounts: Record<InviteTab, number> = {
    ALL:      invitees.length,
    ACCEPTED: invitees.filter(i => i.status === 'ACCEPTED').length,
    INVITED:  invitees.filter(i => i.status === 'INVITED').length,
    DECLINED: invitees.filter(i => i.status === 'DECLINED').length,
  };

  const visible = tab === 'ALL' ? invitees : invitees.filter(i => i.status === tab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-on-surface">Invite Responses</h2>
            <p className="text-sm text-on-surface-variant mt-0.5 line-clamp-1">{job.title}</p>
          </div>
          <button onClick={onClose} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Status tabs */}
        {!loading && invitees.length > 0 && (
          <div className="px-4 pt-4 flex gap-1.5 flex-wrap flex-shrink-0">
            {INVITE_TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={['flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', tab === key ? 'bg-secondary text-white' : 'bg-slate-100 text-on-surface-variant hover:bg-slate-200'].join(' ')}>
                {label}
                <span className={['text-[10px] px-1.5 py-0.5 rounded-full font-bold', tab === key ? 'bg-white/20 text-white' : 'bg-white text-on-surface-variant'].join(' ')}>
                  {tabCounts[key]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              Loading…
            </div>
          ) : invitees.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">group</span>
              <p className="text-sm text-on-surface-variant">No freelancers invited yet.</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="material-symbols-outlined text-3xl text-slate-300">person_search</span>
              <p className="text-sm text-on-surface-variant">No invitees with this status.</p>
            </div>
          ) : (
            visible.map(inv => {
              const badge = STATUS_BADGE[inv.status] ?? STATUS_BADGE.INVITED;
              return (
                <div key={inv.inviteId} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-outline-variant bg-slate-50">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {inv.freelancerName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{inv.freelancerName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{inv.freelancerEmail}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${badge.cls}`}>
                    <span className="material-symbols-outlined text-[12px]">{badge.icon}</span>
                    {badge.label}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-outline-variant flex-shrink-0">
          <button onClick={onClose}
            className="w-full py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-slate-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MyJobs ─────────────────────────────────────────────────────

export default function MyJobs() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sidebarLinks = withActive(CLIENT_SIDEBAR, pathname);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'PUBLIC' | 'INVITE_ONLY'>('ALL');
  const [search, setSearch] = useState('');
  const [inviteJob, setInviteJob] = useState<JobResponse | null>(null);
  const [inviteesJob, setInviteesJob] = useState<JobResponse | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    jobsApi.getMyJobs()
      .then(setJobs)
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

  const handleFilterChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (val: T) => { setter(val); setPage(0); };

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const filtered = jobs
    .filter(j => statusFilter === 'ALL' || j.status === statusFilter)
    .filter(j => visibilityFilter === 'ALL' || j.visibility === visibilityFilter)
    .filter(j => !search || j.title.toLowerCase().includes(search.toLowerCase()));

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
          <div className="p-3 space-y-2 border-t border-white/10 flex-shrink-0">
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
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          <div className="flex-1 p-6 pb-24 lg:pb-8 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-h1 font-bold text-on-surface">My Posted Jobs</h1>
                <p className="text-body-md text-on-surface-variant mt-1">Manage all jobs you've posted on BidForge.</p>
              </div>
              <button onClick={() => navigate('/client/post-job')}
                className="flex items-center gap-2 px-6 h-12 bg-secondary text-white font-semibold rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex-shrink-0">
                <span className="material-symbols-outlined">add</span>Post a New Job
              </button>
            </div>

            {/* Filters */}
            <div className="tonal-card rounded-xl p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                  placeholder="Search by job title…"
                  className="w-full pl-9 pr-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors bg-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Status tabs */}
                <div className="flex gap-1 flex-wrap flex-1">
                  {STATUS_TABS.map(tab => (
                    <button key={tab} onClick={() => handleFilterChange(setStatusFilter)(tab)}
                      className={['px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', statusFilter === tab ? 'bg-secondary text-white shadow-sm' : 'bg-white border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
                      {tab === 'ALL' ? `All (${jobs.length})` : `${STATUS_CFG[tab]?.label ?? tab} (${jobs.filter(j => j.status === tab).length})`}
                    </button>
                  ))}
                </div>

                {/* Visibility filter */}
                <div className="flex gap-1 flex-wrap flex-shrink-0">
                  {(['ALL', 'PUBLIC', 'INVITE_ONLY'] as const).map(v => (
                    <button key={v} onClick={() => handleFilterChange(setVisibilityFilter)(v)}
                      className={['px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1', visibilityFilter === v ? 'bg-secondary text-white shadow-sm' : 'bg-white border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
                      {v !== 'ALL' && <span className="material-symbols-outlined text-[13px]">{v === 'PUBLIC' ? 'public' : 'lock'}</span>}
                      {v === 'ALL' ? 'All Visibility' : v === 'PUBLIC' ? 'Public' : 'Invite Only'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results count */}
            {!loading && (
              <p className="text-sm text-on-surface-variant">
                Showing <span className="font-semibold text-on-surface">{paginated.length}</span> of <span className="font-semibold text-on-surface">{filtered.length}</span> jobs
              </p>
            )}

            {/* Content */}
            {loading ? (
              <PageLoader message="Loading your jobs…" />
            ) : filtered.length === 0 ? (
              <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">work_off</span>
                <p className="text-on-surface font-semibold">No jobs found</p>
                <p className="text-sm text-on-surface-variant max-w-xs">
                  {jobs.length === 0
                    ? "You haven't posted any jobs yet. Post your first job to start receiving bids."
                    : 'No jobs match your current filters.'}
                </p>
                {jobs.length === 0 ? (
                  <button onClick={() => navigate('/client/post-job')}
                    className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                    Post a Job
                  </button>
                ) : (
                  <button onClick={() => { setStatusFilter('ALL'); setVisibilityFilter('ALL'); setSearch(''); setPage(0); }}
                    className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {paginated.map(job => {
                  const st = STATUS_CFG[job.status] ?? { label: job.status, cls: 'bg-slate-100 text-slate-600' };
                  const skills = parseSkills(job.requiredSkills);
                  const isInviteOnly = job.visibility === 'INVITE_ONLY';
                  return (
                    <article key={job.id} className="tonal-card rounded-xl overflow-hidden hover:shadow-md transition-all">
                      <div className="p-6 flex flex-col md:flex-row md:items-start gap-6">
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">{job.category}</span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${isInviteOnly ? 'bg-amber-50 text-amber-700' : 'bg-secondary/10 text-secondary'}`}>
                              <span className="material-symbols-outlined text-[13px]">{isInviteOnly ? 'lock' : 'public'}</span>
                              {isInviteOnly ? 'Invite Only' : 'Public'}
                            </span>
                            <span className="text-xs text-on-surface-variant">{job.createdAt ? formatDate(job.createdAt) : ''}</span>
                          </div>
                          <h3 className="text-lg font-bold text-on-surface">{job.title}</h3>
                          <p className="text-sm text-on-surface-variant line-clamp-2">{job.description}</p>
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {skills.slice(0, 5).map(s => (
                                <span key={s} className="px-2.5 py-1 bg-slate-100 border border-outline-variant rounded-full text-xs text-on-surface-variant">{s}</span>
                              ))}
                              {skills.length > 5 && <span className="px-2.5 py-1 text-xs text-on-surface-variant">+{skills.length - 5} more</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-3 md:items-end flex-shrink-0 w-full md:w-auto">
                          <div className="md:text-right">
                            <p className="text-xs text-on-surface-variant mb-0.5">Budget</p>
                            <p className="text-lg font-bold text-secondary">{formatBudget(job.budgetMin, job.budgetMax, job.budgetType)}</p>
                          </div>
                          {job.deadline && (
                            <div className="md:text-right">
                              <p className="text-xs text-on-surface-variant mb-0.5">Deadline</p>
                              <p className="text-sm font-semibold text-on-surface">{formatDate(job.deadline)}</p>
                            </div>
                          )}
                          {/* Action buttons — compact horizontal row */}
                          <div className="flex items-center gap-2 flex-wrap md:justify-end">
                            <button onClick={() => navigate(`/jobs/${job.id}`)} title="View Details"
                              className="flex items-center gap-1 px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold text-on-surface-variant hover:border-secondary/40 hover:text-secondary transition-colors">
                              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                              Details
                            </button>
                            {(job.status === 'OPEN' || job.status === 'ASSIGNED') && (
                              <button onClick={() => navigate(`/client/jobs/${job.id}/bids`)} title="View Bids"
                                className="flex items-center gap-1 px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold text-on-surface-variant hover:border-secondary/40 hover:text-secondary transition-colors">
                                <span className="material-symbols-outlined text-[14px]">gavel</span>
                                Bids
                              </button>
                            )}
                            {isInviteOnly && job.status === 'OPEN' && (
                              <button onClick={() => setInviteJob(job)} title="Invite Freelancer"
                                className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-white text-xs font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
                                <span className="material-symbols-outlined text-[14px]">person_add</span>
                                Invite
                              </button>
                            )}
                            {isInviteOnly && (
                              <button onClick={() => setInviteesJob(job)} title="View Invitees"
                                className="flex items-center gap-1 px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold text-on-surface-variant hover:border-secondary/40 hover:text-secondary transition-colors">
                                <span className="material-symbols-outlined text-[14px]">group</span>
                                Invitees
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
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
                      <button key={p} onClick={() => setPage(p)}
                        className={['w-9 h-9 rounded-lg text-sm font-semibold transition-colors', p === page ? 'bg-secondary text-white' : 'border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
                        {p + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1 px-3 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next<span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
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

      {inviteJob && <InviteModal job={inviteJob} onClose={() => setInviteJob(null)} />}
      {inviteesJob && <InviteesModal job={inviteesJob} onClose={() => setInviteesJob(null)} />}
    </div>
  );
}
