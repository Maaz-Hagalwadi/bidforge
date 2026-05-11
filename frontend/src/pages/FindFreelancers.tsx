import { useTheme } from '@/context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/api/users';
import { userApi } from '@/api/user';
import { reviewsApi } from '@/api/reviews';
import { chatApi } from '@/api/chat';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import { MobileNavDrawer } from '@/components/MobileNavDrawer';
import type { UserProfile, PortfolioItem } from '@/types/user';
import type { ReviewResponse } from '@/types/review';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function parseSkills(str?: string): string[] {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

function formatMemberSince(dateStr?: string) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { label: 'Rating: High → Low', value: 'rating_desc' },
  { label: 'Rate: Low → High',   value: 'rate_asc'    },
  { label: 'Rate: High → Low',   value: 'rate_desc'   },
  { label: 'Name: A → Z',        value: 'name_asc'    },
];

const RATE_RANGES = [
  { label: 'Any Rate',      max: Infinity },
  { label: 'Under $25/hr',  max: 25       },
  { label: 'Under $50/hr',  max: 50       },
  { label: 'Under $100/hr', max: 100      },
  { label: '$100+/hr',      max: Infinity, min: 100 },
] as const;

const MIN_RATING_OPTIONS = [
  { label: 'Any Rating', value: 0   },
  { label: '4.0+',       value: 4   },
  { label: '4.5+',       value: 4.5 },
  { label: '4.8+',       value: 4.8 },
];

function applyFiltersAndSort(
  list: UserProfile[],
  rateRangeLabel: string,
  minRating: number,
  sortBy: string,
): UserProfile[] {
  const range = RATE_RANGES.find(r => r.label === rateRangeLabel) ?? RATE_RANGES[0];
  let out = list.filter(f => {
    if (minRating > 0 && (f.rating == null || f.rating < minRating)) return false;
    if (range.label !== 'Any Rate') {
      const rate = f.hourlyRate ?? 0;
      if ('min' in range && rate < (range.min ?? 0)) return false;
      if (rate > range.max) return false;
    }
    return true;
  });
  out = [...out].sort((a, b) => {
    switch (sortBy) {
      case 'rating_desc': return (b.rating ?? 0) - (a.rating ?? 0);
      case 'rate_asc':    return (a.hourlyRate ?? 0) - (b.hourlyRate ?? 0);
      case 'rate_desc':   return (b.hourlyRate ?? 0) - (a.hourlyRate ?? 0);
      case 'name_asc':    return a.name.localeCompare(b.name);
      default:            return 0;
    }
  });
  return out;
}

// ── Slide-over Profile Panel ──────────────────────────────────────────────────

function FreelancerProfilePanel({ freelancerId, onClose }: { freelancerId: number; onClose: () => void }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      userApi.getUserById(freelancerId),
      userApi.getPortfolio(freelancerId),
      reviewsApi.getUserReviews(freelancerId),
    ]).then(([p, port, rev]) => {
      setProfile(p);
      setPortfolio(port);
      setReviews(rev);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [freelancerId]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const handleMessage = async () => {
    setMessaging(true);
    try {
      const rooms = await chatApi.getMyRooms();
      const room = rooms.find(r => r.freelancerId === freelancerId);
      if (room) {
        navigate('/messages', { state: { contractId: room.contractId } });
      } else {
        navigate('/messages');
      }
    } catch {
      navigate('/messages');
    } finally {
      setMessaging(false);
    }
  };

  const skills = parseSkills(profile?.skills);
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  return createPortal(
    <div onMouseDown={e => e.nativeEvent.stopImmediatePropagation()}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.28s ease' }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-[480px] bg-surface flex flex-col shadow-2xl"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant flex-shrink-0">
          <p className="text-sm font-bold text-on-surface uppercase tracking-widest">Freelancer Profile</p>
          <button onClick={handleClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !profile ? (
          <div className="flex-1 flex items-center justify-center text-on-surface-variant">
            <p>Profile not found.</p>
          </div>
        ) : (
          <>
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

              {/* Identity hero */}
              <div className="px-5 pt-6 pb-5 border-b border-outline-variant"
                style={{ background: 'linear-gradient(135deg, #0A192F 0%, #0d2444 50%, #0059bb 100%)' }}>
                <div className="flex items-start gap-4">
                  {profile.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt={profile.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-lg flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-secondary/80 border-4 border-white/20 shadow-lg flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 select-none">
                      {getInitials(profile.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h2 className="text-xl font-bold text-white leading-tight">{profile.name}</h2>
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-white/15 text-white/90">
                        {profile.role.charAt(0) + profile.role.slice(1).toLowerCase()}
                      </span>
                    </div>
                    {profile.title && (
                      <p className="text-sm text-white/70 mb-2 font-medium">{profile.title}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
                      {avgRating !== null && (
                        <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {avgRating.toFixed(1)}
                          <span className="text-white/50 font-normal ml-0.5">({reviews.length})</span>
                        </span>
                      )}
                      {profile.hourlyRate != null && (
                        <span className="font-semibold text-emerald-400">${profile.hourlyRate}/hr</span>
                      )}
                      {profile.location && (
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[13px]">location_on</span>
                          {profile.location}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">calendar_month</span>
                        Since {formatMemberSince(profile.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">

                {/* Bio */}
                {profile.bio && (
                  <div>
                    <p className="text-xs font-bold text-on-surface uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-secondary">person</span>
                      About
                    </p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-on-surface uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-secondary">psychology</span>
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map(s => (
                        <span key={s} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-secondary/10 text-secondary">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Portfolio */}
                {portfolio.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-on-surface uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-secondary">grid_view</span>
                      Portfolio ({portfolio.length})
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {portfolio.slice(0, 4).map(item => (
                        <div key={item.id} className="tonal-card border border-outline-variant rounded-xl overflow-hidden">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.title}
                              className="w-full h-24 object-cover"
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                          )}
                          <div className="p-2.5">
                            <p className="text-xs font-semibold text-on-surface truncate">{item.title}</p>
                            {item.technologies && (
                              <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">{item.technologies}</p>
                            )}
                            {item.projectUrl && (
                              <a href={item.projectUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-secondary mt-1 hover:underline">
                                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                View
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {portfolio.length > 4 && (
                      <p className="text-xs text-on-surface-variant mt-2">+{portfolio.length - 4} more items on full profile</p>
                    )}
                  </div>
                )}

                {/* Reviews */}
                {reviews.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-on-surface uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-secondary">reviews</span>
                      Reviews
                    </p>
                    <div className="space-y-3">
                      {reviews.slice(0, 3).map(r => (
                        <div key={r.id} className="tonal-card border border-outline-variant rounded-xl p-3.5">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-on-surface truncate">{r.reviewerName}</p>
                              <p className="text-[11px] text-on-surface-variant truncate">{r.jobTitle}</p>
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {[1,2,3,4,5].map(s => (
                                <span key={s} className="material-symbols-outlined text-[13px] leading-none"
                                  style={{ fontVariationSettings: "'FILL' 1", color: s <= r.rating ? '#f59e0b' : '#e2e8f0' }}>
                                  star
                                </span>
                              ))}
                            </div>
                          </div>
                          {r.comment && <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{r.comment}</p>}
                        </div>
                      ))}
                      {reviews.length > 3 && (
                        <p className="text-xs text-on-surface-variant">+{reviews.length - 3} more reviews on full profile</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="flex-shrink-0 border-t border-outline-variant p-4 flex gap-3">
              <button
                onClick={handleMessage}
                disabled={messaging}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary text-white text-sm font-semibold rounded-xl hover:brightness-110 disabled:opacity-60 transition-all"
              >
                <span className="material-symbols-outlined text-[17px]">chat_bubble</span>
                {messaging ? 'Opening…' : 'Message'}
              </button>
              <button
                onClick={() => navigate(`/profile/${freelancerId}`)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-outline-variant text-on-surface text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">open_in_new</span>
                Full Profile
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Freelancer card ────────────────────────────────────────────────────────────

function FreelancerCard({ freelancer: f, onView }: { freelancer: UserProfile; onView: () => void }) {
  const skills = parseSkills(f.skills);
  const visibleSkills = skills.slice(0, 3);
  const extraSkills = skills.length - visibleSkills.length;

  return (
    <div className="tonal-card rounded-xl border border-outline-variant p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {f.profileImageUrl ? (
          <img src={f.profileImageUrl} className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-600 flex-shrink-0" alt={f.name} />
        ) : (
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-base flex-shrink-0 select-none">
            {getInitials(f.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-on-surface truncate">{f.name}</p>
          {f.title && <p className="text-sm text-on-surface-variant truncate">{f.title}</p>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            {f.rating != null && (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                <span className="material-symbols-outlined text-[13px]">star</span>
                {f.rating.toFixed(1)}
              </span>
            )}
            {f.hourlyRate != null && (
              <span className="text-xs font-semibold text-secondary">${f.hourlyRate}/hr</span>
            )}
            {f.location && (
              <span className="inline-flex items-center gap-0.5 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[13px]">location_on</span>
                {f.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {f.bio && <p className="text-sm text-on-surface-variant line-clamp-2">{f.bio}</p>}

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleSkills.map(s => (
            <span key={s} className="px-2 py-0.5 text-xs font-medium bg-secondary/10 text-secondary rounded-full">{s}</span>
          ))}
          {extraSkills > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full">+{extraSkills} more</span>
          )}
        </div>
      )}

      <button
        onClick={onView}
        className="mt-auto flex items-center justify-center gap-2 w-full py-2 border border-secondary/30 text-secondary text-sm font-semibold rounded-xl hover:bg-secondary/5 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">person</span>
        View Profile
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function FindFreelancers() {
  const { user, logout, refreshUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sidebarLinks = withActive(CLIENT_SIDEBAR, pathname);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [rateRange, setRateRange] = useState('Any Rate');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('rating_desc');
  const [page, setPage] = useState(0);
  const [all, setAll] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    usersApi.searchFreelancers(appliedQuery)
      .then(setAll)
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, [appliedQuery]);

  useEffect(() => { setPage(0); }, [rateRange, minRating, sortBy, appliedQuery]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setAppliedQuery(query); };

  const handleClear = () => {
    setQuery(''); setAppliedQuery('');
    setRateRange('Any Rate'); setMinRating(0); setSortBy('rating_desc');
  };

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const filtered = applyFiltersAndSort(all, rateRange, minRating, sortBy);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const activeFilterCount = [rateRange !== 'Any Rate', minRating > 0, sortBy !== 'rating_desc'].filter(Boolean).length;

  const navRight = (
    <div className="flex items-center gap-1">
      <NotificationBell />
      <div className="relative" ref={profileRef}>
        <button onClick={() => setProfileOpen(o => !o)} aria-expanded={profileOpen} aria-label="Profile menu"
          className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} className="w-8 h-8 rounded-full object-cover border-2 border-slate-300 dark:border-white/20" alt={user.name} />
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
              <h1 className="text-h2 font-bold text-on-surface">Find Freelancers</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">Browse talented professionals and invite them to your projects.</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-slate-400">search</span>
                <input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search by name, title, or skill…"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-secondary transition-colors" />
              </div>
              <button type="submit" className="px-5 py-2.5 bg-secondary text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all flex-shrink-0">Search</button>
              {(appliedQuery || activeFilterCount > 0) && (
                <button type="button" onClick={handleClear}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
                  Clear
                </button>
              )}
            </form>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-slate-400">sort</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-secondary transition-colors">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-slate-400">payments</span>
                <select value={rateRange} onChange={e => setRateRange(e.target.value)}
                  className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-secondary transition-colors">
                  {RATE_RANGES.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-slate-400">star</span>
                <select value={minRating} onChange={e => setMinRating(Number(e.target.value))}
                  className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-secondary transition-colors">
                  {MIN_RATING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {!loading && (
                <span className="ml-auto text-sm text-on-surface-variant">
                  {filtered.length} freelancer{filtered.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>

            {/* Results */}
            {loading ? (
              <PageLoader message="Searching freelancers…" />
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-600 mb-3">person_search</span>
                <p className="text-base font-semibold text-on-surface">No freelancers found</p>
                <p className="text-sm text-on-surface-variant mt-1">Try a different search or adjust your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {visible.map(f => (
                    <FreelancerCard key={f.id} freelancer={f} onView={() => setSelectedId(f.id)} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 pt-2">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button key={i} onClick={() => setPage(i)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${i === page ? 'bg-secondary text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        {i + 1}
                      </button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <Footer />
        </main>
      </div>

      {selectedId !== null && (
        <FreelancerProfilePanel freelancerId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
