import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { jobsApi } from '@/api/jobs';
import { Navbar } from '@/components/Navbar';
import { BidForgeLogo } from '@/components/ui/BidForgeLogo';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import type { JobResponse, SpringPage } from '@/types/job';

const SIDEBAR_BG = '#0A192F';

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

type AppliedFilters = { keyword: string; category: string; skills: string; minBudget: string; maxBudget: string };
const EMPTY: AppliedFilters = { keyword: '', category: '', skills: '', minBudget: '', maxBudget: '' };

export default function BrowseJobs() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const dashboardPath = user?.role === 'CLIENT' ? '/client/dashboard' : user?.role === 'FREELANCER' ? '/freelancer/dashboard' : '';

  // Dynamic sidebar — freelancers get My Invites
  const sidebarLinks = user?.role === 'FREELANCER'
    ? [
        { icon: 'dashboard',    label: 'Dashboard',  short: 'Dashboard', active: false, path: 'DASHBOARD'          },
        { icon: 'search',       label: 'Browse Jobs', short: 'Browse',   active: true,  path: '/browse'            },
        { icon: 'mail',         label: 'My Invites', short: 'Invites',   active: false, path: '/freelancer/invites' },
        { icon: 'receipt_long', label: 'Contracts',  short: 'Contracts', active: false, path: ''                   },
        { icon: 'payments',     label: 'Payments',   short: 'Payments',  active: false, path: ''                   },
      ]
    : [
        { icon: 'dashboard',    label: 'Dashboard',  short: 'Dashboard', active: false, path: 'DASHBOARD' },
        { icon: 'search',       label: 'Browse Jobs', short: 'Browse',   active: true,  path: '/browse'   },
        { icon: 'receipt_long', label: 'Contracts',  short: 'Contracts', active: false, path: ''          },
        { icon: 'chat',         label: 'Messages',   short: 'Messages',  active: false, path: ''          },
        { icon: 'payments',     label: 'Payments',   short: 'Payments',  active: false, path: ''          },
      ];

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  // Live form-input state
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [skills, setSkills] = useState('');

  // Applied state — only updated on Search / Clear click
  const [applied, setApplied] = useState<AppliedFilters>(EMPTY);

  const [page, setPage] = useState(0);
  const [result, setResult] = useState<SpringPage<JobResponse> | null>(null);
  const [loading, setLoading] = useState(true);

  const profileRef = useRef<HTMLDivElement>(null);

  const fetchJobs = useCallback((p: number) => {
    setLoading(true);
    const params: Record<string, string | number | undefined> = {
      page: p,
      size: PAGE_SIZE,
      keyword: applied.keyword || undefined,
      category: applied.category || undefined,
      minBudget: applied.minBudget ? Number(applied.minBudget) : undefined,
      maxBudget: applied.maxBudget ? Number(applied.maxBudget) : undefined,
      skills: applied.skills || undefined,
    };
    jobsApi.getAll(params)
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [applied]);

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
    setApplied({ keyword, category, skills, minBudget, maxBudget });
    setPage(0);
  };

  const handleClear = () => {
    setKeyword(''); setCategory(''); setMinBudget(''); setMaxBudget(''); setSkills('');
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
      <button className="relative p-2 text-white/70 hover:text-white transition-colors" aria-label="Notifications">
        <span className="material-symbols-outlined">notifications</span>
      </button>
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
    <div className="bg-surface min-h-screen flex flex-col">
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
          <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map(({ icon, label, active, path }) => {
              const resolved = path === 'DASHBOARD' ? dashboardPath : path;
              return (
                <button key={label} onClick={() => resolved && navigate(resolved)} title={!sidebarOpen ? label : undefined}
                  className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150 font-medium', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-secondary/20 text-white' : resolved ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
                  <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
                  {sidebarOpen && <span className="text-sm truncate">{label}</span>}
                </button>
              );
            })}
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
            <div>
              <h1 className="text-h1 font-bold text-on-surface">Browse Jobs</h1>
              <p className="text-body-md text-on-surface-variant mt-1">Find projects that match your skills and expertise.</p>
            </div>

            {/* Filters */}
            <form onSubmit={handleSearch} className="tonal-card rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Keyword</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                    <input
                      type="text"
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                      placeholder="Search job titles, descriptions…"
                      className="w-full pl-9 pr-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value === 'All Categories' ? '' : e.target.value)}
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors bg-white"
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Skills</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    placeholder="React, Python, AWS…"
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors bg-white"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex gap-3 flex-1">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Min Budget ($)</label>
                    <input
                      type="number"
                      value={minBudget}
                      onChange={e => setMinBudget(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors bg-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Max Budget ($)</label>
                    <input
                      type="number"
                      value={maxBudget}
                      onChange={e => setMaxBudget(e.target.value)}
                      placeholder="Any"
                      min="0"
                      className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors bg-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button type="button" onClick={handleClear}
                    className="px-4 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-white transition-colors">
                    Clear
                  </button>
                  <button type="submit"
                    className="px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
                    Search
                  </button>
                </div>
              </div>
            </form>

            {/* Results count */}
            {!loading && result && (
              <p className="text-sm text-on-surface-variant">
                Showing <span className="font-semibold text-on-surface">{jobs.length}</span> of <span className="font-semibold text-on-surface">{totalElements}</span> jobs
              </p>
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
                  return (
                    <article key={job.id} className="tonal-card rounded-xl overflow-hidden hover:shadow-md transition-all group">
                      <div className="p-6 flex flex-col md:flex-row md:items-start gap-6">
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">{job.category}</span>
                            <span className="px-2.5 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-semibold">{job.budgetType === 'HOURLY' ? 'Hourly' : 'Fixed Price'}</span>
                            <span className="text-xs text-on-surface-variant">{job.createdAt ? timeAgo(job.createdAt) : ''}</span>
                          </div>
                          <h3 className="text-lg font-bold text-on-surface group-hover:text-secondary transition-colors">{job.title}</h3>
                          <p className="text-sm text-on-surface-variant line-clamp-2">{job.description}</p>
                          {skillList.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {skillList.slice(0, 6).map(s => (
                                <span key={s} className="px-2.5 py-1 bg-slate-100 border border-outline-variant rounded-full text-xs text-on-surface-variant">{s}</span>
                              ))}
                              {skillList.length > 6 && <span className="px-2.5 py-1 text-xs text-on-surface-variant">+{skillList.length - 6} more</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex md:flex-col items-start gap-4 md:items-end flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-on-surface-variant mb-0.5">Budget</p>
                            <p className="text-lg font-bold text-secondary">{formatBudget(job.budgetMin, job.budgetMax, job.budgetType)}</p>
                          </div>
                          {job.deadline && (
                            <div className="text-right">
                              <p className="text-xs text-on-surface-variant mb-0.5">Deadline</p>
                              <p className="text-sm font-semibold text-on-surface">{new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                          )}
                          <button
                            onClick={() => navigate(`/jobs/${job.id}`)}
                            className="flex items-center gap-1.5 px-5 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
                            <span className="material-symbols-outlined text-[16px]">gavel</span>
                            View &amp; Bid
                          </button>
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

          <footer className="py-8 px-8 border-t border-white/10 mt-auto" style={{ backgroundColor: '#0A192F' }}>
            <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-4">
              <BidForgeLogo variant="light" />
              <div className="flex flex-wrap justify-center gap-8">
                {['Privacy Policy', 'Terms of Service', 'Help Center'].map(l => (
                  <a key={l} href="#" className="text-slate-400 hover:text-white transition-colors text-xs">{l}</a>
                ))}
              </div>
              <span className="text-slate-500 text-xs">© 2026 BidForge Inc.</span>
            </div>
          </footer>
        </main>
      </div>

      {user && <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 flex items-stretch" style={{ backgroundColor: '#0A192F' }}>
        {sidebarLinks.map(({ icon, short, active, path }) => {
          const resolved = path === 'DASHBOARD' ? dashboardPath : path;
          return (
            <button key={short} onClick={() => resolved && navigate(resolved)}
              className={['flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors', active ? 'text-secondary' : resolved ? 'text-white/50 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
              <span className="text-[10px] font-semibold leading-none">{short}</span>
            </button>
          );
        })}
      </nav>}
    </div>
  );
}
