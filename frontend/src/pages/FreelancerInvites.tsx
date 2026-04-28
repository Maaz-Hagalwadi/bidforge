import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { jobsApi } from '@/api/jobs';
import { Navbar } from '@/components/Navbar';
import { BidForgeLogo } from '@/components/ui/BidForgeLogo';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import type { JobResponse } from '@/types/job';

const SIDEBAR_BG = '#0A192F';

const SIDEBAR_LINKS = [
  { icon: 'dashboard',    label: 'Dashboard',   short: 'Dashboard', active: false, path: '/freelancer/dashboard' },
  { icon: 'search',       label: 'Browse Jobs', short: 'Browse',    active: false, path: '/browse'               },
  { icon: 'mail',         label: 'My Invites',  short: 'Invites',   active: true,  path: '/freelancer/invites'   },
  { icon: 'receipt_long', label: 'Contracts',   short: 'Contracts', active: false, path: ''                      },
  { icon: 'payments',     label: 'Payments',    short: 'Payments',  active: false, path: ''                      },
];

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

const PAGE_SIZE = 10;

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatBudget(min: number, max: number, type: string) {
  const s = type === 'HOURLY' ? '/hr' : '';
  return `$${min.toLocaleString()}${s} – $${max.toLocaleString()}${s}`;
}

function parseSkills(str?: string): string[] {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

type AppliedFilters = {
  keyword: string;
  category: string;
  skills: string;
  minBudget: string;
  maxBudget: string;
};

const EMPTY_FILTERS: AppliedFilters = { keyword: '', category: '', skills: '', minBudget: '', maxBudget: '' };

export default function FreelancerInvites() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Form-input state (live, not yet applied)
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [skills, setSkills] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  // Applied state — only updated when Search is clicked
  const [applied, setApplied] = useState<AppliedFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    jobsApi.getInvitedJobs()
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied({ keyword, category, skills, minBudget, maxBudget });
    setPage(0);
  };

  const handleClear = () => {
    setKeyword(''); setCategory(''); setSkills(''); setMinBudget(''); setMaxBudget('');
    setApplied(EMPTY_FILTERS);
    setPage(0);
  };

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const filtered = jobs.filter(j => {
    if (applied.keyword) {
      const kw = applied.keyword.toLowerCase();
      if (!j.title.toLowerCase().includes(kw) && !j.description?.toLowerCase().includes(kw)) return false;
    }
    if (applied.category && j.category !== applied.category) return false;
    if (applied.skills && !j.requiredSkills?.toLowerCase().includes(applied.skills.toLowerCase())) return false;
    if (applied.minBudget && j.budgetMin < Number(applied.minBudget)) return false;
    if (applied.maxBudget && Number(applied.maxBudget) > 0 && j.budgetMax > Number(applied.maxBudget)) return false;
    return true;
  });

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
            {SIDEBAR_LINKS.map(({ icon, label, active, path }) => (
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

            {/* Header */}
            <div>
              <h1 className="text-h1 font-bold text-on-surface">My Invites</h1>
              <p className="text-body-md text-on-surface-variant mt-1">Jobs you've been personally invited to by clients.</p>
            </div>

            {/* Search form — only fires on submit */}
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
                    value={category || 'All Categories'}
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
            {!loading && (
              <p className="text-sm text-on-surface-variant">
                Showing <span className="font-semibold text-on-surface">{paginated.length}</span> of <span className="font-semibold text-on-surface">{filtered.length}</span> jobs
              </p>
            )}

            {loading ? (
              <PageLoader message="Loading invites…" />
            ) : jobs.length === 0 ? (
              <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">mail_outline</span>
                <p className="text-on-surface font-semibold">No invites yet</p>
                <p className="text-sm text-on-surface-variant max-w-xs">When a client invites you to a private job, it will appear here.</p>
                <button onClick={() => navigate('/browse')}
                  className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                  Browse Public Jobs
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
                <p className="text-on-surface font-semibold">No invites match your filters</p>
                <p className="text-sm text-on-surface-variant max-w-xs">Try adjusting your search criteria.</p>
                <button onClick={handleClear}
                  className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {paginated.map(job => {
                  const skills = parseSkills(job.requiredSkills);
                  return (
                    <article key={job.id} className="tonal-card rounded-xl overflow-hidden hover:shadow-md transition-all group">
                      <div className="p-6 flex flex-col md:flex-row md:items-start gap-6">
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">lock</span>Invite Only
                            </span>
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">{job.category}</span>
                            <span className="px-2.5 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-semibold">
                              {job.budgetType === 'HOURLY' ? 'Hourly' : 'Fixed Price'}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-on-surface group-hover:text-secondary transition-colors">{job.title}</h3>
                          <p className="text-sm text-on-surface-variant line-clamp-2">{job.description}</p>
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {skills.slice(0, 5).map(s => (
                                <span key={s} className="px-2.5 py-1 bg-slate-100 border border-outline-variant rounded-full text-xs text-on-surface-variant">{s}</span>
                              ))}
                              {skills.length > 5 && <span className="text-xs text-on-surface-variant px-2">+{skills.length - 5} more</span>}
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
                              <p className="text-sm font-semibold text-on-surface">
                                {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          )}
                          <div className="flex flex-col gap-2 md:items-end">
                            <button onClick={() => navigate(`/jobs/${job.id}`)}
                              className="w-full md:w-auto flex items-center justify-center gap-1.5 px-5 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
                              <span className="material-symbols-outlined text-[16px]">gavel</span>
                              View &amp; Bid
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
          </div>

          <footer className="py-8 px-8 border-t border-white/10 mt-auto" style={{ backgroundColor: '#0A192F' }}>
            <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-4">
              <BidForgeLogo variant="light" />
              <span className="text-slate-500 text-xs">© 2026 BidForge Inc.</span>
            </div>
          </footer>
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 flex items-stretch" style={{ backgroundColor: '#0A192F' }}>
        {SIDEBAR_LINKS.map(({ icon, short, active, path }) => (
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
