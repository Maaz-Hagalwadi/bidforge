import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { dashboardApi } from '@/api/dashboard';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import type { ClientDashboardData, RecentProject } from '@/types/dashboard';


const SIDEBAR_BG = '#0A192F';

// ── Helpers ───────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function mapProject(p: RecentProject): {
  title: string; status: string; statusCls: string; meta: string; extra: string;
} {
  const statusMap = {
    OPEN:      { label: 'Open',      cls: 'bg-secondary/10 text-secondary' },
    ASSIGNED:  { label: 'Assigned',  cls: 'bg-green-500/10 text-green-600' },
    COMPLETED: { label: 'Completed', cls: 'bg-slate-500/10 text-slate-500' },
  };
  const { label, cls } = statusMap[p.status] ?? { label: p.status, cls: 'bg-slate-500/10 text-slate-500' };

  let meta = '';
  let extra = '';

  if (p.status === 'OPEN') {
    const parts = [];
    if (p.postedTime) parts.push(`Posted ${p.postedTime}`);
    if (p.bidsReceived) parts.push(`${p.bidsReceived} Bids Received`);
    if (p.budget)      parts.push(`Budget: ${p.budget}`);
    meta = parts.join(' • ');
    extra = 'bids';
  } else if (p.status === 'ASSIGNED') {
    const parts = [];
    if (p.assignedTo) parts.push(`Contracted to ${p.assignedTo}`);
    if (p.milestonesCompleted != null && p.totalMilestones != null)
      parts.push(`Milestones: ${p.milestonesCompleted}/${p.totalMilestones} Completed`);
    if (p.dueDate) parts.push(`Due: ${p.dueDate}`);
    meta = parts.join(' • ');
    extra = p.totalValue ? `$${p.totalValue.toLocaleString()}` : '—';
  } else {
    meta = p.description ?? (p.paidOut ? 'Completed and paid out' : 'Completed');
    extra = p.paidOut ? 'paid' : '';
  }

  return { title: p.title, status: label, statusCls: cls, meta, extra };
}

// ── StatCard ──────────────────────────────────────────────────

function StatCard({ icon, label, value, trend, trendColor }: { icon: string; label: string; value: string; trend: string; trendColor: string }) {
  return (
    <div className="tonal-card p-4 rounded-xl flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined text-secondary text-[20px]">{icon}</span>
        {trend && <span className={`font-bold text-label-sm ${trendColor}`}>{trend}</span>}
      </div>
      <div>
        <p className="text-on-surface-variant text-label-md">{label}</p>
        <h3 className="text-h2 font-bold text-on-surface">{value}</h3>
      </div>
    </div>
  );
}

// ── ProjectRow ────────────────────────────────────────────────

function ProjectRow({ title, status, statusCls, meta, extra }: { title: string; status: string; statusCls: string; meta: string; extra: string }) {
  return (
    <div className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h4 className="font-semibold text-sm text-on-surface">{title}</h4>
          <span className={`px-2.5 py-0.5 text-label-sm rounded-full ${statusCls}`}>{status}</span>
        </div>
        <p className="text-sm text-on-surface-variant">{meta}</p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        {extra === 'bids' ? (
          <div className="flex -space-x-2">
            {['A','B','C'].map(l => (
              <div key={l} className="w-7 h-7 rounded-full border-2 border-white bg-secondary/10 flex items-center justify-center text-[10px] font-bold text-secondary">{l}</div>
            ))}
          </div>
        ) : extra === 'paid' ? (
          <span className="text-label-sm font-bold text-slate-400">Paid Out</span>
        ) : extra ? (
          <div className="text-right">
            <p className="font-bold text-sm text-on-surface">{extra}</p>
            <p className="text-[10px] text-on-surface-variant">Total Value</p>
          </div>
        ) : null}
        <button className="p-1.5 border border-outline-variant rounded-lg hover:border-secondary transition-colors">
          <span className="material-symbols-outlined text-[18px]">more_horiz</span>
        </button>
      </div>
    </div>
  );
}

// ── TalentCard ────────────────────────────────────────────────

function TalentCard({ name, specialty, rating, reviews }: { name: string; specialty: string; rating: string; reviews: number }) {
  return (
    <div className="tonal-card p-4 rounded-xl flex gap-4">
      <div className="w-14 h-14 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary font-bold text-lg flex-shrink-0 select-none">{getInitials(name)}</div>
      <div className="space-y-1 flex-1 min-w-0">
        <p className="font-semibold text-sm text-on-surface">{name}</p>
        <p className="text-sm text-on-surface-variant">{specialty}</p>
        <div className="flex items-center gap-1 text-secondary">
          <span className="material-symbols-outlined text-[14px]">star</span>
          <span className="text-label-sm">{rating} ({reviews} reviews)</span>
        </div>
      </div>
    </div>
  );
}

// ── ClientDashboard ───────────────────────────────────────────

export default function ClientDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sidebarLinks = withActive(CLIENT_SIDEBAR, pathname);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch dashboard data from API
  useEffect(() => {
    dashboardApi.getClientDashboard()
      .then(setDashboardData)
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  // Build stats from API data
  const stats = dashboardData ? [
    {
      icon: 'work_history', label: 'Active Jobs',
      value: String(dashboardData.overview.activeJobs),
      trend: `+${dashboardData.overview.activeJobsChangePercent}%`,
      trendColor: 'text-secondary',
    },
    {
      icon: 'group', label: 'Total Bids Received',
      value: String(dashboardData.overview.totalBids),
      trend: dashboardData.overview.bidsChange,
      trendColor: 'text-on-surface-variant',
    },
    {
      icon: 'handshake', label: 'Ongoing Contracts',
      value: String(dashboardData.overview.ongoingContracts),
      trend: `${dashboardData.overview.contractsChangePercent > 0 ? '+' : ''}${dashboardData.overview.contractsChangePercent}% vs last mo`,
      trendColor: dashboardData.overview.contractsChangePercent < 0 ? 'text-error' : 'text-secondary',
    },
    {
      icon: 'payments', label: 'Total Spent',
      value: `$${dashboardData.overview.totalSpent.toLocaleString()}`,
      trend: '', trendColor: '',
    },
  ] : [];

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
        {/* ── Left sidebar (desktop only) ── */}
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

          <nav className="flex-1 min-h-0 py-2 px-2 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map(({ icon, label, active, path }) => (
              <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
                className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-white/10 text-white font-bold border-l-4 border-secondary' : 'text-white/60 hover:bg-white/10 hover:text-white font-medium', !path ? 'opacity-50 cursor-default' : ''].join(' ')}>
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

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col bg-surface">
          <div className="flex-1 p-6 pb-24 lg:pb-8 lg:p-8 space-y-8 max-w-[1280px] w-full mx-auto">

            {/* Welcome */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-h2 font-bold text-on-surface">Welcome back, {user?.name.split(' ')[0] ?? 'there'} 👋</h1>
                <p className="text-sm text-on-surface-variant mt-0.5">Manage your projects and discover top talent for your next big idea.</p>
              </div>
              <button onClick={() => navigate('/client/post-job')}
                className="flex items-center justify-center gap-2 px-6 h-12 bg-secondary text-white font-semibold rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex-shrink-0">
                <span className="material-symbols-outlined">add</span>Post a New Job
              </button>
            </section>

            {/* Stats */}
            {dataLoading ? (
              <PageLoader message="Loading dashboard…" />
            ) : (
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(s => <StatCard key={s.label} {...s} />)}
              </section>
            )}

            {/* Recent projects */}
            <section className="tonal-card rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-on-surface">Recent Project Activity</h3>
                <button onClick={() => navigate('/client/jobs')} className="text-secondary font-semibold text-sm hover:underline">View All →</button>
              </div>
              <div className="divide-y divide-slate-100">
                {dashboardData?.recentProjects.length ? (
                  dashboardData.recentProjects.map(p => <ProjectRow key={p.title} {...mapProject(p)} />)
                ) : (
                  <p className="px-6 py-8 text-center text-on-surface-variant text-sm">No projects yet. Post your first job to get started.</p>
                )}
              </div>
            </section>

            {/* Talent + News */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-semibold text-on-surface">Recommended for You</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dashboardData?.recommendedFreelancers.map(f => (
                      <TalentCard key={f.name} name={f.name} specialty={f.title} rating={String(f.rating)} reviews={f.reviewsCount} />
                    ))}
                  </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-on-surface">Network News</h3>
                {dashboardData?.news.map(n => (
                  <div key={n.title} className="tonal-card p-6 rounded-xl border-l-4 border-l-secondary bg-gradient-to-br from-white to-slate-50">
                    <p className="text-label-sm font-bold text-secondary mb-2 uppercase tracking-wide">System Update</p>
                    <p className="font-semibold text-on-surface mb-2">{n.title}</p>
                    <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">{n.description}</p>
                    <a href="#" className="text-secondary font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                      Learn More <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </a>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <Footer />
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
