import { useTheme } from '@/context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate, useLocation } from 'react-router-dom';
import { FREELANCER_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { dashboardApi } from '@/api/dashboard';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import { MobileNavDrawer } from '@/components/MobileNavDrawer';
import type { FreelancerDashboardData, FreelancerActivity } from '@/types/dashboard';
import { aiApi, type JobRecommendation } from '@/api/ai';



const HERO_IMAGE =
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80';

const ACTIVITY_META: Record<FreelancerActivity['type'], { icon: string; iconBg: string }> = {
  BID:     { icon: 'gavel',    iconBg: 'bg-secondary/10 text-secondary' },
  PAYMENT: { icon: 'payments', iconBg: 'bg-green-500/10 text-green-600' },
  REVIEW:  { icon: 'star',     iconBg: 'bg-amber-500/10 text-amber-500' },
};

// ── Helpers ────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── StatCard ───────────────────────────────────────────────────

function StatCard({ icon, label, value, trend, trendColor, dark }: {
  icon: string; label: string; value: string; trend?: string; trendColor?: string; dark?: boolean;
}) {
  if (dark) {
    return (
      <div className="p-4 rounded-xl flex flex-col gap-2 border border-slate-200 dark:border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-[#0A192F]">
        <div className="flex items-center justify-between">
          <span className="material-symbols-outlined text-secondary text-[20px]">{icon}</span>
          {trend && <span className={`font-bold text-label-sm ${trendColor}`}>{trend}</span>}
        </div>
        <div>
          <p className="text-slate-600 dark:text-white/60 text-label-md">{label}</p>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{value}</h3>
        </div>
      </div>
    );
  }
  return (
    <div className="tonal-card p-4 rounded-xl flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined text-secondary text-[20px]">{icon}</span>
        {trend && <span className={`font-bold text-label-sm ${trendColor}`}>{trend}</span>}
      </div>
      <div>
        <p className="text-on-surface-variant text-label-md">{label}</p>
        <h3 className="text-base font-bold text-on-surface">{value}</h3>
      </div>
    </div>
  );
}

// ── ActivityRow ────────────────────────────────────────────────

function ActivityRow({ icon, iconBg, title, desc, time }: {
  icon: string; iconBg: string; title: string; desc: string; time: string;
}) {
  return (
    <div className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-on-surface">{title}</p>
        <p className="text-sm text-on-surface-variant truncate">{desc}</p>
      </div>
      <span className="text-xs text-on-surface-variant flex-shrink-0 bg-slate-100 px-2.5 py-1 rounded-full">{time}</span>
    </div>
  );
}

// ── FreelancerDashboard ────────────────────────────────────────

export default function FreelancerDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sidebarLinks = withActive(FREELANCER_SIDEBAR, pathname);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [data, setData] = useState<FreelancerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dashboardApi.getFreelancerDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
    aiApi.getJobRecommendations()
      .then(setRecommendations)
      .catch(() => setRecommendations([]))
      .finally(() => setRecsLoading(false));
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

  const stats = data ? [
    { icon: 'gavel',     label: 'Active Bids',       value: String(data.overview.activeBids),      trend: `${data.overview.bidsEndingSoon} ending soon`, trendColor: 'text-amber-500' },
    { icon: 'handshake', label: 'Ongoing Contracts',  value: String(data.overview.ongoingContracts).padStart(2, '0'), trend: undefined, trendColor: '' },
    { icon: 'task_alt',  label: 'Completed Jobs',     value: String(data.overview.completedJobs),  trend: `${data.overview.successRate}% Success Rate`, trendColor: 'text-secondary' },
    { icon: 'payments',  label: 'Total Earned',       value: `$${data.overview.totalEarned.toLocaleString()}`, dark: true },
  ] : [];

  const navLeft = (
    <button onClick={() => setDrawerOpen(true)} className="p-1.5 text-slate-600 dark:text-white/70 hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors" aria-label="Open menu">
      <span className="material-symbols-outlined text-[22px]">menu</span>
    </button>
  );

  const navRight = (
    <div className="flex items-center gap-1">
      <NotificationBell />
      <div className="relative" ref={profileRef}>
        <button onClick={() => setProfileOpen(o => !o)} aria-expanded={profileOpen} aria-label="Profile menu"
          className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} className="w-8 h-8 rounded-full object-cover border-2 border-slate-300 dark:border-white/20" alt={user.name} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold select-none">{initials}</div>
          )}
          <span className="material-symbols-outlined text-slate-500 dark:text-white/60 text-base leading-none">expand_more</span>
        </button>
        {profileOpen && user && <ProfileDropdown user={user} onUpdated={refreshUser} onLogout={handleLogout} />}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="app" authRight={navRight} navLeft={navLeft} />
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} links={sidebarLinks} onLogout={handleLogout} />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className={['hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-slate-200 dark:border-white/10 transition-[width] duration-300 ease-in-out overflow-hidden', sidebarOpen ? 'w-64' : 'w-16'].join(' ')}
          style={{ backgroundColor: theme === 'dark' ? '#0A192F' : '#ffffff' }}
        >
          <div className={`flex items-center h-14 border-b border-slate-200 dark:border-white/10 px-3 flex-shrink-0 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 select-none">Menu</span>}
            <button onClick={() => setSidebarOpen(o => !o)} title={sidebarOpen ? 'Collapse' : 'Expand'} className="p-1.5 text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-xl">{sidebarOpen ? 'menu_open' : 'menu'}</span>
            </button>
          </div>

          <nav className="flex-1 min-h-0 py-2 px-2 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map(({ icon, label, active, path }) => (
              <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
                className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-slate-100 dark:bg-white/20 text-slate-900 dark:text-white font-bold border-l-4 border-secondary' : 'text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white font-medium', !path ? 'opacity-50 cursor-default' : ''].join(' ')}>
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
              </button>
            ))}
          </nav>

          <div className="mt-auto p-3 space-y-2 border-t border-slate-200 dark:border-white/10 flex-shrink-0">
            {sidebarOpen && (
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-white/60 mb-1">PRO PLAN</p>
                <p className="text-xs font-semibold leading-relaxed mb-3 text-slate-900 dark:text-white/60">Unlimited active contracts and priority support.</p>
                <button className="w-full py-2 bg-secondary text-white rounded-lg text-xs font-bold hover:brightness-110 transition-all">Upgrade Now</button>
              </div>
            )}
            <button onClick={handleLogout} title={!sidebarOpen ? 'Sign Out' : undefined}
              className={['w-full flex items-center gap-3 rounded-lg py-2.5 text-slate-500 dark:text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors', sidebarOpen ? 'px-3' : 'justify-center px-2'].join(' ')}>
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
              {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col bg-surface">
          <div className="flex-1 p-4 pb-6 lg:p-8 space-y-6 lg:space-y-8 max-w-[1280px] w-full mx-auto">

            {/* Welcome */}
            <section className="flex flex-row items-start justify-between gap-4">
              <div>
                <h1 className="text-h2 font-bold text-on-surface">{data?.welcomeMessage ?? `Welcome back, ${user?.name.split(' ')[0] ?? 'there'} 👋`}</h1>
                <p className="text-sm text-on-surface-variant mt-0.5">Find jobs, place bids, and grow your freelance career.</p>
              </div>
              <button onClick={() => navigate('/browse')}
                className="flex items-center justify-center gap-1.5 px-3 h-8 text-xs md:px-6 md:h-12 md:text-sm md:gap-2 bg-secondary text-white font-semibold rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex-shrink-0">
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">search</span>Browse Jobs
              </button>
            </section>

            {/* Stats */}
            {loading ? (
              <PageLoader message="Loading dashboard…" />
            ) : (
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.map(s => <StatCard key={s.label} {...s} />)}
              </section>
            )}

            {/* Hero banner */}
            <section className="tonal-card rounded-xl overflow-hidden relative min-h-[220px] flex items-center">
              <img src={HERO_IMAGE} alt="Freelancers working" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A192F]/90 via-[#0A192F]/60 to-transparent" />
              <div className="relative z-10 p-8 md:p-12 max-w-lg">
                <h2 className="text-lg font-bold text-white mb-2 leading-tight">Find your next big project</h2>
                <p className="text-slate-600 dark:text-white/70 text-sm mb-6">Browse thousands of listings and place winning bids.</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => navigate('/browse')} className="px-5 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
                    Browse Jobs
                  </button>
                  <button onClick={() => navigate('/freelancer/bids')} className="px-5 py-2.5 border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 active:scale-[0.98] transition-all">
                    View My Bids
                  </button>
                </div>
              </div>
            </section>

            {/* AI Job Recommendations */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">auto_awesome</span>
                  Recommended for You
                </h3>
                {!recsLoading && recommendations.length > 0 && (
                  <button onClick={() => navigate('/browse')} className="text-secondary font-semibold text-xs hover:underline">
                    Browse All
                  </button>
                )}
              </div>
              {recsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="tonal-card rounded-xl p-4 space-y-3 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : recommendations.length === 0 ? (
                <div className="tonal-card rounded-xl p-6 text-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant">manage_search</span>
                  <p className="text-sm text-on-surface-variant mt-2">Complete your profile with skills and bio to get personalised job matches.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map(rec => (
                    <div key={rec.jobId} className="tonal-card rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-on-surface line-clamp-2 flex-1">{rec.title}</h4>
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold bg-secondary/10 text-secondary">
                          {rec.matchScore}%
                        </span>
                      </div>
                      {rec.category && <span className="text-xs text-on-surface-variant">{rec.category}</span>}
                      {(rec.budgetMin || rec.budgetMax) && (
                        <span className="text-xs font-semibold text-on-surface">
                          ${rec.budgetMin?.toLocaleString()} – ${rec.budgetMax?.toLocaleString()}
                        </span>
                      )}
                      <p className="text-xs text-on-surface-variant line-clamp-2">{rec.matchReason}</p>
                      <button onClick={() => navigate(`/jobs/${rec.jobId}`)}
                        className="mt-auto w-full py-2 bg-secondary/10 text-secondary text-xs font-bold rounded-lg hover:bg-secondary/20 transition-colors">
                        View Job
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Activity + Profile Completion */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2 tonal-card rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-on-surface">Recent Activity</h3>
                  <button onClick={() => navigate('/freelancer/bids')} className="text-secondary font-semibold text-sm hover:underline">View All</button>
                </div>
                <div className="divide-y divide-slate-100">
                  {data?.recentActivities.length ? (
                    data.recentActivities.map(a => (
                      <ActivityRow key={a.title} icon={ACTIVITY_META[a.type].icon} iconBg={ACTIVITY_META[a.type].iconBg} title={a.title} desc={a.description} time={a.time} />
                    ))
                  ) : (
                    <p className="px-6 py-8 text-center text-on-surface-variant text-sm">No recent activity yet.</p>
                  )}
                </div>
              </div>

              {/* Profile Completion */}
              <div className="tonal-card rounded-xl p-6 flex flex-col gap-5">
                <div>
                  <h3 className="text-sm font-semibold text-on-surface mb-1">Profile Completion</h3>
                  <p className="text-sm text-on-surface-variant">Complete your profile to attract more clients.</p>
                </div>

                {data ? (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-on-surface">{data.profileCompletion.percentage}% Complete</span>
                        <span className="text-xs font-bold text-secondary">{data.profileCompletion.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className="bg-secondary h-2.5 rounded-full transition-all duration-500" style={{ width: `${data.profileCompletion.percentage}%` }} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Portfolio Added', done: data.profileCompletion.portfolioAdded },
                        { label: 'Skills Set',      done: data.profileCompletion.skillsAdded    },
                        { label: 'Bio Added',       done: data.profileCompletion.bioAdded       },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-secondary' : 'bg-slate-200'}`}>
                            {item.done && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                          </div>
                          <span className={`text-sm ${item.done ? 'line-through text-on-surface-variant' : 'text-on-surface font-medium'}`}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}

                <button onClick={() => user && navigate(`/profile/${user.id}`)}
                  className="w-full py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all mt-auto">
                  Complete Profile
                </button>
              </div>
            </section>
          </div>

          <Footer />
        </main>
      </div>

    </div>
  );
}
