import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate, useLocation } from 'react-router-dom';
import { FREELANCER_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { jobsApi } from '@/api/jobs';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import type { InviteWithJobResponse } from '@/types/job';

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
  const { pathname } = useLocation();
  const sidebarLinks = withActive(FREELANCER_SIDEBAR, pathname);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [invites, setInvites] = useState<InviteWithJobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [confirmAction, setConfirmAction] = useState<{ inviteId: string; action: 'accept' | 'decline'; title: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form-input state (live, not yet applied)
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [skills, setSkills] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  // Applied state — only updated when Search is clicked
  const [applied, setApplied] = useState<AppliedFilters>(EMPTY_FILTERS);
  const [statusTab, setStatusTab] = useState<'ALL' | 'INVITED' | 'ACCEPTED' | 'DECLINED'>('ALL');
  const [page, setPage] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    jobsApi.getInvites()
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

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { inviteId, action } = confirmAction;
    setConfirmAction(null);
    setProcessing(prev => new Set(prev).add(inviteId));
    try {
      if (action === 'accept') {
        await jobsApi.acceptInvite(inviteId);
        setInvites(prev => prev.map(inv =>
          inv.inviteId === inviteId ? { ...inv, inviteStatus: 'ACCEPTED' } : inv
        ));
        showToast('Invite accepted successfully!', 'success');
      } else {
        await jobsApi.declineInvite(inviteId);
        setInvites(prev => prev.map(inv =>
          inv.inviteId === inviteId ? { ...inv, inviteStatus: 'DECLINED' } : inv
        ));
        showToast('Invite declined.', 'success');
      }
      setCardErrors(prev => { const e = { ...prev }; delete e[inviteId]; return e; });
    } catch (err: any) {
      const msg = (err as any)?.response?.data?.message ?? 'Something went wrong';
      setCardErrors(prev => ({ ...prev, [inviteId]: msg }));
      showToast(msg, 'error');
    } finally {
      setProcessing(prev => { const s = new Set(prev); s.delete(inviteId); return s; });
    }
  };

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  function passesFilter(inv: InviteWithJobResponse): boolean {
    if (applied.keyword) {
      const kw = applied.keyword.toLowerCase();
      if (!inv.title.toLowerCase().includes(kw) && !inv.description?.toLowerCase().includes(kw)) return false;
    }
    if (applied.category && inv.category !== applied.category) return false;
    if (applied.skills && !inv.requiredSkills?.toLowerCase().includes(applied.skills.toLowerCase())) return false;
    if (applied.minBudget && inv.budgetMin < Number(applied.minBudget)) return false;
    if (applied.maxBudget && Number(applied.maxBudget) > 0 && inv.budgetMax > Number(applied.maxBudget)) return false;
    return true;
  }

  const counts = {
    ALL:      invites.filter(passesFilter).length,
    INVITED:  invites.filter(i => i.inviteStatus === 'INVITED'  && passesFilter(i)).length,
    ACCEPTED: invites.filter(i => i.inviteStatus === 'ACCEPTED' && passesFilter(i)).length,
    DECLINED: invites.filter(i => i.inviteStatus === 'DECLINED' && passesFilter(i)).length,
  };

  const filtered = invites.filter(i => {
    if (statusTab !== 'ALL' && i.inviteStatus !== statusTab) return false;
    return passesFilter(i);
  });

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
    <div className="min-h-screen flex flex-col">
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

        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col bg-surface">
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

            {loading ? (
              <PageLoader message="Loading invites…" />
            ) : invites.length === 0 ? (
              <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">mail_outline</span>
                <p className="text-on-surface font-semibold">No invites yet</p>
                <p className="text-sm text-on-surface-variant max-w-xs">When a client invites you to a private job, it will appear here.</p>
                <button onClick={() => navigate('/browse')}
                  className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                  Browse Public Jobs
                </button>
              </div>
            ) : (
              <div className="space-y-5">

                {/* Status filter tabs */}
                <div className="flex gap-1.5 flex-wrap">
                  {([
                    { key: 'ALL',      label: 'All',      count: counts.ALL      },
                    { key: 'INVITED',  label: 'Pending',  count: counts.INVITED  },
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

                {/* Results count */}
                <p className="text-sm text-on-surface-variant">
                  Showing <span className="font-semibold text-on-surface">{paginated.length}</span> of <span className="font-semibold text-on-surface">{filtered.length}</span> invites
                </p>

                {filtered.length === 0 ? (
                  <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
                    <p className="text-on-surface font-semibold">No invites match your filters</p>
                    <button onClick={handleClear}
                      className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginated.map(inv => (
                        <InviteCard key={inv.inviteId} inv={inv}
                          isProcessing={processing.has(inv.inviteId)}
                          error={cardErrors[inv.inviteId]}
                          dimmed={inv.inviteStatus === 'DECLINED'}
                          onAccept={inv.inviteStatus === 'INVITED' ? () => setConfirmAction({ inviteId: inv.inviteId, action: 'accept', title: inv.title }) : undefined}
                          onDecline={inv.inviteStatus === 'INVITED' ? () => setConfirmAction({ inviteId: inv.inviteId, action: 'decline', title: inv.title }) : undefined}
                          onViewBid={inv.inviteStatus === 'ACCEPTED' ? () => navigate(`/jobs/${inv.jobId}`, { state: { from: 'invites' } }) : undefined}
                        />
                      ))}
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

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 flex flex-col" style={{ backgroundColor: '#0A192F' }}>
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
      </nav>

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${confirmAction.action === 'accept' ? 'bg-green-100' : 'bg-red-50'}`}>
                <span className={`material-symbols-outlined text-2xl ${confirmAction.action === 'accept' ? 'text-green-600' : 'text-red-500'}`}>
                  {confirmAction.action === 'accept' ? 'check_circle' : 'cancel'}
                </span>
              </div>
              <h2 className="text-base font-bold text-on-surface">
                {confirmAction.action === 'accept' ? 'Accept Invite?' : 'Decline Invite?'}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {confirmAction.action === 'accept'
                  ? `You'll be able to view and place a bid on "${confirmAction.title}".`
                  : `Are you sure you want to decline the invite for "${confirmAction.title}"?`}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirm}
                className={`flex-1 py-2.5 text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all ${confirmAction.action === 'accept' ? 'bg-green-600' : 'bg-red-500'}`}>
                {confirmAction.action === 'accept' ? 'Accept' : 'Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function InviteCard({
  inv,
  isProcessing,
  error,
  dimmed,
  onAccept,
  onDecline,
  onViewBid,
}: {
  inv: InviteWithJobResponse;
  isProcessing: boolean;
  error?: string;
  dimmed?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onViewBid?: () => void;
}) {
  const skills = parseSkills(inv.requiredSkills);

  return (
    <article className={['tonal-card rounded-xl overflow-hidden transition-all', dimmed ? 'opacity-50' : 'hover:shadow-md group'].join(' ')}>
      <div className="p-6 flex flex-col md:flex-row md:items-start gap-6">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">lock</span>Invite Only
            </span>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">{inv.category}</span>
            <span className="px-2.5 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-semibold">
              {inv.budgetType === 'HOURLY' ? 'Hourly' : 'Fixed Price'}
            </span>
            {inv.inviteStatus === 'ACCEPTED' && (
              <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">check_circle</span>Accepted
              </span>
            )}
            {inv.inviteStatus === 'DECLINED' && (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">cancel</span>Declined
              </span>
            )}
          </div>
          <h3 className={['text-lg font-bold text-on-surface', !dimmed ? 'group-hover:text-secondary transition-colors' : ''].join(' ')}>{inv.title}</h3>
          <p className="text-sm text-on-surface-variant line-clamp-2">{inv.description}</p>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 5).map(s => (
                <span key={s} className="px-2.5 py-1 bg-slate-100 border border-outline-variant rounded-full text-xs text-on-surface-variant">{s}</span>
              ))}
              {skills.length > 5 && <span className="text-xs text-on-surface-variant px-2">+{skills.length - 5} more</span>}
            </div>
          )}
          {error && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>{error}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 md:items-end flex-shrink-0 w-full md:w-auto">
          <div className="md:text-right">
            <p className="text-xs text-on-surface-variant mb-0.5">Budget</p>
            <p className="text-lg font-bold text-secondary">{formatBudget(inv.budgetMin, inv.budgetMax, inv.budgetType)}</p>
          </div>
          {inv.deadline && (
            <div className="md:text-right">
              <p className="text-xs text-on-surface-variant mb-0.5">Deadline</p>
              <p className="text-sm font-semibold text-on-surface">
                {new Date(inv.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-2 md:items-end">
            {inv.inviteStatus === 'INVITED' && (
              <>
                <button
                  onClick={onAccept}
                  disabled={isProcessing}
                  className="w-full md:w-auto flex items-center justify-center gap-1.5 px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                  {isProcessing ? (
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  )}
                  Accept
                </button>
                <button
                  onClick={onDecline}
                  disabled={isProcessing}
                  className="w-full md:w-auto flex items-center justify-center gap-1.5 px-5 py-2 border border-outline-variant text-on-surface-variant text-sm font-semibold rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all">
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  Decline
                </button>
              </>
            )}
            {inv.inviteStatus === 'ACCEPTED' && (
              <button onClick={onViewBid}
                className="w-full md:w-auto flex items-center justify-center gap-1.5 px-5 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                View &amp; Bid
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
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
