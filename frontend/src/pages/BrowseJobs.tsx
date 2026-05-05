import { useState, useRef, useEffect, useCallback } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, FREELANCER_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { jobsApi } from '@/api/jobs';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import type { JobResponse, SpringPage } from '@/types/job';

const SIDEBAR_BG = '#0A192F';

const EXP_CFG: Record<string, { label: string; cls: string }> = {
  ENTRY:        { label: 'Entry Level',   cls: 'bg-green-50 text-green-700'   },
  INTERMEDIATE: { label: 'Intermediate',  cls: 'bg-secondary/10 text-secondary' },
  EXPERT:       { label: 'Expert Level',  cls: 'bg-purple-50 text-purple-700' },
};

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  OPEN:      { label: 'Open',        cls: 'bg-secondary/10 text-secondary'  },
  ASSIGNED:  { label: 'Assigned',    cls: 'bg-green-100 text-green-700'     },
  DRAFT:     { label: 'Draft',       cls: 'bg-slate-100 text-slate-500'     },
  COMPLETED: { label: 'Completed',   cls: 'bg-blue-50 text-blue-600'        },
  CANCELLED: { label: 'Cancelled',   cls: 'bg-red-100 text-red-500'         },
};

const VIS_CFG: Record<string, { label: string; cls: string; icon: string }> = {
  PUBLIC:      { label: 'Public',      cls: 'bg-slate-100 text-slate-600', icon: 'public'      },
  INVITE_ONLY: { label: 'Invite Only', cls: 'bg-amber-50 text-amber-700',  icon: 'lock'        },
};

const CATEGORIES = [
  'All Categories',
  'Web Development',
  'Mobile Development',
  'Design & Creative',
  'Writing & Translation',
  'Data Science & Analytics',
  'DevOps & Cloud',
  'Marketing',
  'Video & Animation',
  'Other',
];

function formatBudget(min: number, max: number, type: string) {
  const s = type === 'HOURLY' ? '/hr' : '';
  return `$${min.toLocaleString()}${s} – $${max.toLocaleString()}${s}`;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function parseSkills(str?: string): string[] {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const PAGE_SIZE = 10;

const BUDGET_RANGES = [
  { label: 'Any Budget',        min: '',    max: ''    },
  { label: 'Under $500',        min: '',    max: '500' },
  { label: '$500 – $2,000',     min: '500', max: '2000' },
  { label: '$2,000 – $5,000',   min: '2000',max: '5000' },
  { label: '$5,000 – $10,000',  min: '5000',max: '10000' },
  { label: '$10,000+',          min: '10000', max: '' },
];

const POSTED_DATE_OPTIONS = [
  { label: 'Any Time',      value: '' },
  { label: 'Last 24 hours', days: 1   },
  { label: 'Last 7 days',   days: 7   },
  { label: 'Last 30 days',  days: 30  },
  { label: 'Last 3 months', days: 90  },
] as const;

function postedAfterISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 19);
}

const SAVED_KEY = 'bidforge_saved_jobs';

function loadSaved(): Map<string, JobResponse> {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return new Map();
    const arr: JobResponse[] = JSON.parse(raw);
    return new Map(arr.map(j => [j.id, j]));
  } catch { return new Map(); }
}

function persistSaved(m: Map<string, JobResponse>) {
  localStorage.setItem(SAVED_KEY, JSON.stringify([...m.values()]));
}

const SORT_OPTIONS = [
  { label: 'Newest',              value: 'createdAt,desc'  },
  { label: 'Oldest',             value: 'createdAt,asc'   },
  { label: 'Budget: Low → High', value: 'budgetMin,asc'   },
  { label: 'Budget: High → Low', value: 'budgetMin,desc'  },
];

type AppliedFilters = { keyword: string; category: string; skills: string; minBudget: string; maxBudget: string; postedAfter: string };
const EMPTY: AppliedFilters = { keyword: '', category: '', skills: '', minBudget: '', maxBudget: '', postedAfter: '' };

export default function BrowseJobs() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sidebarLinks = withActive(
    user?.role === 'FREELANCER' ? FREELANCER_SIDEBAR : CLIENT_SIDEBAR,
    pathname
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  // Live form-input state
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [postedDate, setPostedDate] = useState('');
  const [skills, setSkills] = useState('');

  // Applied state — only updated on Search / Clear click
  const [applied, setApplied] = useState<AppliedFilters>(EMPTY);

  const [activeTab, setActiveTab] = useState<'browse' | 'saved'>('browse');
  const [sortBy, setSortBy] = useState('createdAt,desc');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<SpringPage<JobResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<Map<string, JobResponse>>(loadSaved);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const toggleSave = (job: JobResponse) => {
    setSavedJobs(prev => {
      const next = new Map(prev);
      if (next.has(job.id)) next.delete(job.id);
      else next.set(job.id, job);
      persistSaved(next);
      return next;
    });
  };

  const profileRef = useRef<HTMLDivElement>(null);

  const fetchJobs = useCallback((p: number) => {
    setLoading(true);
    const params: Record<string, string | number | undefined> = {
      page: p,
      size: PAGE_SIZE,
      sort: sortBy,
      keyword: applied.keyword || undefined,
      category: applied.category || undefined,
      minBudget: applied.minBudget ? Number(applied.minBudget) : undefined,
      maxBudget: applied.maxBudget ? Number(applied.maxBudget) : undefined,
      skills: applied.skills || undefined,
      postedAfter: applied.postedAfter || undefined,
    };
    jobsApi.getAll(params)
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [applied, sortBy]);

  useEffect(() => {
    if (user?.role === 'FREELANCER') {
      jobsApi.getMyBids().then(bids => setAppliedJobIds(new Set(bids.map(b => b.jobId)))).catch(() => {});
    }
  }, [user]);

  useEffect(() => { fetchJobs(page); }, [fetchJobs, page]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const range = BUDGET_RANGES.find(r => r.label === budgetRange) ?? BUDGET_RANGES[0];
    const postedAfterVal = (() => {
      const opt = POSTED_DATE_OPTIONS.find(o => o.label === postedDate);
      if (!opt || !('days' in opt)) return '';
      return postedAfterISO(opt.days);
    })();
    setApplied({ keyword, category, skills, minBudget: range.min, maxBudget: range.max, postedAfter: postedAfterVal });
    setPage(0);
  };

  const handleClear = () => {
    setKeyword(''); setCategory(''); setBudgetRange(''); setPostedDate(''); setSkills('');
    setApplied(EMPTY);
    setPage(0);
  };

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const jobs = result?.content ?? [];
  const totalPages = result?.totalPages ?? 0;
  const totalElements = result?.totalElements ?? 0;

  const navRight = user ? (
    <div className="flex items-center gap-1">
      <NotificationBell />
      <div className="relative" ref={profileRef}>
        <button onClick={() => setProfileOpen(o => !o)} aria-expanded={profileOpen} aria-label="Profile menu"
          className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
          {user.profileImageUrl ? (
            <img src={user.profileImageUrl} className="w-8 h-8 rounded-full object-cover border-2 border-white/20" alt={user.name} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold select-none">{initials}</div>
          )}
          <span className="material-symbols-outlined text-white/60 text-base leading-none">expand_more</span>
        </button>
        {profileOpen && <ProfileDropdown user={user} onUpdated={refreshUser} onLogout={handleLogout} />}
      </div>
    </div>
  ) : (
    <button onClick={() => navigate('/login')}
      className="px-4 py-1.5 border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/10 transition-colors">
      Log In
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="app" authRight={navRight} />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — only shown when logged in */}
        <aside
          className={[user ? 'hidden lg:flex' : 'hidden', 'flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-white/10 transition-[width] duration-300 ease-in-out overflow-hidden', sidebarOpen ? 'w-64' : 'w-16'].join(' ')}
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
                  className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150 font-medium', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-white/10 text-white font-bold border-l-4 border-secondary' : path ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-h2 font-bold text-on-surface">Browse Jobs</h1>
                <p className="text-sm text-on-surface-variant mt-0.5">Find projects that match your skills and expertise.</p>
              </div>
              {user?.role === 'FREELANCER' && (
                <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 self-start sm:self-auto border border-outline-variant">
                  <button
                    onClick={() => setActiveTab('browse')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'browse' ? 'bg-secondary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    Browse
                  </button>
                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'saved' ? 'bg-secondary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                    <span className="material-symbols-outlined text-[18px]">bookmark</span>
                    Saved
                    {savedJobs.size > 0 && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'saved' ? 'bg-white/20 text-white' : 'bg-secondary/10 text-secondary'}`}>
                        {savedJobs.size}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {activeTab === 'saved' && (
              <div className="space-y-4">
                {savedJobs.size === 0 ? (
                  <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center border border-outline-variant">
                    <span className="material-symbols-outlined text-5xl text-slate-300">bookmark</span>
                    <p className="text-on-surface font-semibold">No saved jobs yet</p>
                    <p className="text-sm text-on-surface-variant max-w-xs">Browse jobs and click Save to keep track of opportunities you're interested in.</p>
                    <button onClick={() => setActiveTab('browse')}
                      className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                      Browse Jobs
                    </button>
                  </div>
                ) : [...savedJobs.values()].map(job => {
                  const skillList = parseSkills(job.requiredSkills);
                  const statusCfg = STATUS_CFG[job.status] ?? STATUS_CFG.OPEN;
                  const visCfg = VIS_CFG[job.visibility];
                  return (
                    <article key={job.id} className="tonal-card rounded-xl border border-outline-variant hover:border-secondary/20 hover:shadow-md transition-all group">
                      <div className="flex flex-col p-5 gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <span className="text-xs text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {job.createdAt ? timeAgo(job.createdAt) : ''}
                          </span>
                          <h3 className="text-base font-bold text-on-surface group-hover:text-secondary transition-colors">{job.title}</h3>
                          <p className="text-sm text-on-surface-variant line-clamp-1">{job.description}</p>
                          {skillList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {skillList.slice(0, 4).map(s => (
                                <span key={s} className="px-2 py-0.5 bg-surface-container border border-outline-variant rounded-full text-xs text-on-surface-variant">{s}</span>
                              ))}
                              {skillList.length > 4 && <span className="px-2 py-0.5 text-xs text-on-surface-variant">+{skillList.length - 4} more</span>}
                            </div>
                          )}
                          <p className="text-base font-bold text-secondary">{formatBudget(job.budgetMin, job.budgetMax, job.budgetType)}</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${statusCfg.cls}`}>{statusCfg.label}</span>
                            <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${visCfg.cls}`}>
                              <span className="material-symbols-outlined text-[12px]">{visCfg.icon}</span>
                              {visCfg.label}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => navigate(`/jobs/${job.id}`)}
                              className="px-4 py-1.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all">
                              View &amp; Bid
                            </button>
                            <button onClick={() => toggleSave(job)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-all flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px]">bookmark_remove</span>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Filters */}
            {activeTab === 'browse' && <form onSubmit={handleSearch} className="tonal-card rounded-xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                  <input
                    type="text"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder="Search for jobs, skills, or companies…"
                    className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all bg-white"
                  />
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button type="button" onClick={handleClear}
                    className="px-4 py-3 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-white transition-colors">
                    Clear
                  </button>
                  <button type="submit"
                    className="flex items-center gap-2 px-5 py-3 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                    Search Jobs
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant px-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value === 'All Categories' ? '' : e.target.value)}
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all bg-white">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant px-1">Budget Range</label>
                  <select value={budgetRange} onChange={e => setBudgetRange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all bg-white">
                    {BUDGET_RANGES.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant px-1">Skills</label>
                  <input type="text" value={skills} onChange={e => setSkills(e.target.value)}
                    placeholder="e.g. React, Python"
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant px-1">Posted Date</label>
                  <select value={postedDate} onChange={e => setPostedDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all bg-white">
                    {POSTED_DATE_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </form>}

            {activeTab === 'browse' && <>
            {/* Header & count */}
            {!loading && result && (
              <div className="flex justify-between items-center px-1">
                <h2 className="text-xl font-bold text-on-surface">
                  Available Projects{' '}
                  <span className="text-on-surface-variant font-normal text-base ml-1">({totalElements})</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant font-medium">Sort by</span>
                  <select
                    value={sortBy}
                    onChange={e => { setSortBy(e.target.value); setPage(0); }}
                    className="px-3 py-1.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  >
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Content */}
            {loading ? (
              <PageLoader message="Finding matching jobs…" />
            ) : jobs.length === 0 ? (
              <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
                <p className="text-on-surface font-semibold">No jobs found</p>
                <p className="text-sm text-on-surface-variant max-w-xs">Try adjusting your filters or check back later for new opportunities.</p>
                <button onClick={handleClear}
                  className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => {
                  const skillList = parseSkills(job.requiredSkills);
                  const isUrgent = job.urgencyLevel === 'HIGH';
                  const expCfg = job.experienceLevel ? EXP_CFG[job.experienceLevel] : null;
                  const statusCfg = STATUS_CFG[job.status] ?? STATUS_CFG.OPEN;
                  const visCfg = VIS_CFG[job.visibility];

                  const isSaved = savedJobs.has(job.id);
                  const isApplied = appliedJobIds.has(job.id);

                  if (isUrgent) {
                    return (
                      <article key={job.id} className="relative rounded-xl border-l-4 border-l-secondary overflow-hidden hover:shadow-lg transition-all group"
                        style={{ backgroundColor: '#d8e2ff' }}>
                        <div className="absolute top-5 right-4 flex items-center gap-1.5 z-10">
                          <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${statusCfg.cls}`}>{statusCfg.label}</span>
                          <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${visCfg.cls}`}>
                            <span className="material-symbols-outlined text-[12px]">{visCfg.icon}</span>
                            {visCfg.label}
                          </span>
                        </div>
                        <div className="flex flex-col p-5 gap-3">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 bg-secondary text-white rounded text-xs font-bold uppercase tracking-wider">Urgent Hiring</span>
                              {expCfg && (
                                <span className="px-2.5 py-0.5 bg-white/50 text-secondary rounded text-xs font-semibold uppercase tracking-wider">{expCfg.label}</span>
                              )}
                              {isApplied && (
                                <span className="flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                  Applied
                                </span>
                              )}
                              <span className="text-xs text-secondary/70 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                {job.createdAt ? timeAgo(job.createdAt) : ''}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-secondary group-hover:opacity-80 transition-opacity pr-28">{job.title}</h3>
                            <p className="text-sm text-secondary/70 line-clamp-2">{job.description}</p>
                            {skillList.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {skillList.slice(0, 6).map(s => (
                                  <span key={s} className="px-2 py-0.5 bg-white/40 border border-secondary/20 rounded-full text-xs text-secondary font-medium">{s}</span>
                                ))}
                                {skillList.length > 6 && <span className="text-xs text-secondary/70">+{skillList.length - 6} more</span>}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <p className="text-base font-bold text-secondary">{formatBudget(job.budgetMin, job.budgetMax, job.budgetType)}</p>
                            <div className="flex gap-2">
                              {job.visibility === 'INVITE_ONLY' ? (
                                <div className="relative group/tip">
                                  <button onClick={() => navigate(`/jobs/${job.id}`)}
                                    className="px-4 py-1.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[15px]">lock</span>
                                    View &amp; Bid
                                  </button>
                                  <div className="absolute bottom-full right-0 mb-2 w-56 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-20">
                                    <div className="bg-slate-800 text-white text-xs font-medium rounded-lg px-3 py-2 leading-relaxed shadow-lg">
                                      <span className="material-symbols-outlined text-[13px] align-middle mr-1 text-amber-400">info</span>
                                      You must accept the invite before placing a bid.
                                    </div>
                                    <div className="w-2.5 h-2.5 bg-slate-800 rotate-45 absolute -bottom-1 right-5" />
                                  </div>
                                </div>
                              ) : (
                                <button onClick={() => navigate(`/jobs/${job.id}`)}
                                  className="px-4 py-1.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all">
                                  View &amp; Bid
                                </button>
                              )}
                              <button onClick={() => toggleSave(job)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all flex items-center gap-1.5 ${isSaved ? 'bg-secondary/15 border-secondary text-secondary' : 'border-secondary/30 text-secondary hover:bg-secondary/10'}`}>
                                <span className="material-symbols-outlined text-[18px]">{isSaved ? 'bookmark_added' : 'bookmark'}</span>
                                {isSaved ? 'Saved' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  }

                  return (
                    <article key={job.id} className="relative tonal-card rounded-xl overflow-hidden hover:border-secondary/20 hover:shadow-md transition-all group border border-outline-variant">
                      <div className="absolute top-5 right-4 flex items-center gap-1.5 z-10">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${statusCfg.cls}`}>{statusCfg.label}</span>
                        <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${visCfg.cls}`}>
                          <span className="material-symbols-outlined text-[12px]">{visCfg.icon}</span>
                          {visCfg.label}
                        </span>
                      </div>
                      <div className="flex flex-col p-5 gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {expCfg ? (
                              <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${expCfg.cls}`}>{expCfg.label}</span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-semibold">{job.category}</span>
                            )}
                            {isApplied && (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                Applied
                              </span>
                            )}
                            <span className="text-xs text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {job.createdAt ? timeAgo(job.createdAt) : ''}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-on-surface group-hover:text-secondary transition-colors pr-28">{job.title}</h3>
                          <p className="text-sm text-on-surface-variant line-clamp-2">{job.description}</p>
                          {skillList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {skillList.slice(0, 6).map(s => (
                                <span key={s} className="px-2 py-0.5 bg-surface-container border border-outline-variant rounded-full text-xs text-on-surface-variant">{s}</span>
                              ))}
                              {skillList.length > 6 && <span className="text-xs text-on-surface-variant">+{skillList.length - 6} more</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <p className="text-base font-bold text-secondary">{formatBudget(job.budgetMin, job.budgetMax, job.budgetType)}</p>
                          <div className="flex gap-2">
                            {job.visibility === 'INVITE_ONLY' ? (
                              <div className="relative group/tip">
                                <button onClick={() => navigate(`/jobs/${job.id}`)}
                                  className="px-4 py-1.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[15px]">lock</span>
                                  View &amp; Bid
                                </button>
                                <div className="absolute bottom-full right-0 mb-2 w-56 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-20">
                                  <div className="bg-slate-800 text-white text-xs font-medium rounded-lg px-3 py-2 leading-relaxed shadow-lg">
                                    <span className="material-symbols-outlined text-[13px] align-middle mr-1 text-amber-400">info</span>
                                    You must accept the invite before placing a bid.
                                  </div>
                                  <div className="w-2.5 h-2.5 bg-slate-800 rotate-45 absolute -bottom-1 right-5" />
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => navigate(`/jobs/${job.id}`)}
                                className="px-4 py-1.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all">
                                View &amp; Bid
                              </button>
                            )}
                            <button onClick={() => toggleSave(job)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all flex items-center gap-1.5 ${isSaved ? 'bg-secondary/10 border-secondary text-secondary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}>
                              <span className="material-symbols-outlined text-[18px]">{isSaved ? 'bookmark_added' : 'bookmark'}</span>
                              {isSaved ? 'Saved' : 'Save'}
                            </button>
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
            </>}
          </div>

          <Footer />
        </main>
      </div>

      {user && <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 flex flex-col" style={{ backgroundColor: '#0A192F' }}>
        {[sidebarLinks.slice(0, 4), sidebarLinks.slice(4)].map((row, ri) => (
          <div key={ri} className={`flex items-stretch ${ri === 0 ? 'border-b border-white/10' : ''}`}>
            {row.map(({ icon, short, active, path }) => (
              <button key={short} onClick={() => path && navigate(path)}
                className={['flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors', active ? 'text-secondary' : path ? 'text-white/50 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
                <span className="text-[9px] font-semibold leading-none">{short}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>}
    </div>
  );
}
