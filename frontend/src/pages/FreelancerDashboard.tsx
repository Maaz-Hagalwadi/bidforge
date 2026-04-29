import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FREELANCER_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { dashboardApi } from '@/api/dashboard';
import { Navbar } from '@/components/Navbar';
import { BidForgeLogo } from '@/components/ui/BidForgeLogo';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import type { FreelancerDashboardData, FreelancerActivity } from '@/types/dashboard';


const SIDEBAR_BG = '#0A192F';

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
      <div className="p-6 rounded-xl flex flex-col gap-3 border border-white/10" style={{ backgroundColor: '#0A192F' }}>
        <div className="flex items-center justify-between">
          <span className="material-symbols-outlined text-secondary text-[32px]">{icon}</span>
          {trend && <span className={`font-bold text-label-sm ${trendColor}`}>{trend}</span>}
        </div>
        <div>
          <p className="text-white/60 text-label-md">{label}</p>
          <h3 className="text-h2 font-bold text-white">{value}</h3>
        </div>
      </div>
    );
  }
  return (
    <div className="tonal-card p-6 rounded-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined text-secondary text-[32px]">{icon}</span>
        {trend && <span className={`font-bold text-label-sm ${trendColor}`}>{trend}</span>}
      </div>
      <div>
        <p className="text-on-surface-variant text-label-md">{label}</p>
        <h3 className="text-h2 font-bold text-on-surface">{value}</h3>
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
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sidebarLinks = withActive(FREELANCER_SIDEBAR, pathname);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [data, setData] = useState<FreelancerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dashboardApi.getFreelancerDashboard()
      .then(setData)
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

  const stats = data ? [
    { icon: 'gavel',     label: 'Active Bids',       value: String(data.overview.activeBids),      trend: `${data.overview.bidsEndingSoon} ending soon`, trendColor: 'text-amber-500' },
    { icon: 'handshake', label: 'Ongoing Contracts',  value: String(data.overview.ongoingContracts).padStart(2, '0'), trend: undefined, trendColor: '' },
    { icon: 'task_alt',  label: 'Completed Jobs',     value: String(data.overview.completedJobs),  trend: `${data.overview.successRate}% Success Rate`, trendColor: 'text-secondary' },
    { icon: 'payments',  label: 'Total Earned',       value: `$${data.overview.totalEarned.toLocaleString()}`, dark: true },
  ] : [];

  const navRight = (
    <div className="flex items-center gap-1">
      <button className="relative p-2 text-white/70 hover:text-white transition-colors" aria-label="Notifications">
        <span className="material-symbols-outlined">notifications</span>
        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
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
            <button onClick={() => setSidebarOpen(o => !o)} title={sidebarOpen ? 'Collapse' : 'Expand'} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-xl">{sidebarOpen ? 'menu_open' : 'menu'}</span>
            </button>
          </div>

          <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map(({ icon, label, active, path }) => (
              <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
                className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-white/10 text-white font-bold border-l-4 border-secondary' : 'text-white/60 hover:bg-white/10 hover:text-white font-medium', !path ? 'opacity-50 cursor-default' : ''].join(' ')}>
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-3 space-y-2 border-t border-white/10 flex-shrink-0">
            {sidebarOpen && (
              <div className="bg-white/5 border border-white/10 text-white rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">PRO PLAN</p>
                <p className="text-xs font-semibold leading-relaxed mb-3 text-white/80">Unlimited active bids and priority placement in search results.</p>
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

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          <div className="flex-1 p-6 pb-24 lg:pb-8 lg:p-8 space-y-8 max-w-[1280px] w-full mx-auto">

            {/* Welcome */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-h1 font-bold text-on-surface">{data?.welcomeMessage ?? `Welcome back, ${user?.name.split(' ')[0] ?? 'there'} 👋`}</h1>
                <p className="text-body-lg text-on-surface-variant mt-1">Find jobs, place bids, and grow your freelance career.</p>
              </div>
              <button onClick={() => navigate('/browse')}
                className="flex items-center justify-center gap-2 px-6 h-12 bg-secondary text-white font-semibold rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex-shrink-0">
                <span className="material-symbols-outlined">search</span>Browse Jobs
              </button>
            </section>

            {/* Stats */}
            {loading ? (
              <PageLoader message="Loading dashboard…" />
            ) : (
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(s => <StatCard key={s.label} {...s} />)}
              </section>
            )}

            {/* Hero banner */}
            <section className="tonal-card rounded-xl overflow-hidden relative min-h-[220px] flex items-center">
              <img src={HERO_IMAGE} alt="Freelancers working" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A192F]/90 via-[#0A192F]/60 to-transparent" />
              <div className="relative z-10 p-8 md:p-12 max-w-lg">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">Find your next big project</h2>
                <p className="text-white/70 text-sm mb-6">Browse thousands of listings and place winning bids.</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => navigate('/browse')} className="px-5 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
                    Browse Jobs
                  </button>
                  <button className="px-5 py-2.5 border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/10 active:scale-[0.98] transition-all">
                    View My Bids
                  </button>
                </div>
              </div>
            </section>

            {/* Recent Activity + Profile Completion */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2 tonal-card rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-h3 font-semibold text-on-surface">Recent Activity</h3>
                  <button className="text-secondary font-semibold text-sm hover:underline">View All</button>
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
                  <h3 className="text-h3 font-semibold text-on-surface mb-1">Profile Completion</h3>
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

                <button className="w-full py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all mt-auto">
                  Complete Profile
                </button>
              </div>
            </section>
          </div>

          {/* Footer */}
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
    </div>
  );
}
