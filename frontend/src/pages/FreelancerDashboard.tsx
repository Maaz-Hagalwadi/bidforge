import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/api/user';
import { dashboardApi } from '@/api/dashboard';
import { Navbar } from '@/components/Navbar';
import { BidForgeLogo } from '@/components/ui/BidForgeLogo';
import type { UserProfile } from '@/types/user';
import type { FreelancerDashboardData, FreelancerActivity } from '@/types/dashboard';

const SIDEBAR_LINKS = [
  { icon: 'dashboard',    label: 'Dashboard',    short: 'Dashboard', active: true  },
  { icon: 'search',       label: 'Browse Jobs',  short: 'Browse',    active: false },
  { icon: 'receipt_long', label: 'My Contracts', short: 'Contracts', active: false },
  { icon: 'chat',         label: 'Messages',     short: 'Messages',  active: false },
  { icon: 'payments',     label: 'Payments',     short: 'Payments',  active: false },
];

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

// ── ProfileDropdown ────────────────────────────────────────────

function ProfileDropdown({ user, onUpdated, onLogout }: { user: UserProfile; onUpdated: () => Promise<void>; onLogout: () => void }) {
  const [mode, setMode] = useState<'view' | 'name' | 'photo'>('view');
  const [name, setName] = useState(user.name);
  const [photo, setPhoto] = useState(user.profileImageUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { setName(user.name); setPhoto(user.profileImageUrl ?? ''); }, [user.name, user.profileImageUrl]);

  const save = useCallback(async (payload: { name?: string; profileImageUrl?: string }) => {
    setSaving(true); setErr('');
    try { await userApi.updateMe(payload); await onUpdated(); setMode('view'); }
    catch { setErr('Update failed. Please try again.'); }
    finally { setSaving(false); }
  }, [onUpdated]);

  const initials = getInitials(user.name);

  return (
    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        {user.profileImageUrl ? (
          <img src={user.profileImageUrl} className="w-12 h-12 rounded-full object-cover border border-slate-200 flex-shrink-0" alt={user.name} />
        ) : (
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none">{initials}</div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{user.name}</p>
          <p className="text-sm text-slate-500 truncate">{user.email}</p>
          <span className="mt-1 inline-block px-2 py-0.5 bg-secondary/10 text-secondary text-xs font-semibold rounded-full">
            {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      {mode === 'view' && (
        <div className="p-2">
          <button onClick={() => setMode('name')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left">
            <span className="material-symbols-outlined text-[20px] text-slate-400">edit</span> Edit Name
          </button>
          <button onClick={() => setMode('photo')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left">
            <span className="material-symbols-outlined text-[20px] text-slate-400">add_a_photo</span> Change Profile Photo
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors text-left">
            <span className="material-symbols-outlined text-[20px]">logout</span> Sign Out
          </button>
        </div>
      )}

      {mode === 'name' && (
        <div className="p-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save({ name: name.trim() })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary transition-colors" placeholder="Your full name" />
          {err && <p className="text-xs text-red-500 mt-1.5">{err}</p>}
          <div className="flex gap-2 mt-3">
            <button disabled={saving || !name.trim()} onClick={() => save({ name: name.trim() })} className="flex-1 bg-secondary text-white text-sm font-semibold py-2 rounded-lg hover:brightness-110 disabled:opacity-60 transition-all">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => { setMode('view'); setName(user.name); setErr(''); }} className="flex-1 border border-slate-200 text-slate-700 text-sm font-semibold py-2 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {mode === 'photo' && (
        <div className="p-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Photo URL</label>
          {photo && <img src={photo} className="w-14 h-14 rounded-full object-cover border border-slate-200 mb-3" alt="Preview" onError={e => (e.currentTarget.style.display = 'none')} />}
          <input autoFocus value={photo} onChange={e => setPhoto(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary transition-colors" placeholder="https://example.com/photo.jpg" />
          {err && <p className="text-xs text-red-500 mt-1.5">{err}</p>}
          <div className="flex gap-2 mt-3">
            <button disabled={saving} onClick={() => save({ profileImageUrl: photo.trim() || undefined })} className="flex-1 bg-secondary text-white text-sm font-semibold py-2 rounded-lg hover:brightness-110 disabled:opacity-60 transition-all">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => { setMode('view'); setPhoto(user.profileImageUrl ?? ''); setErr(''); }} className="flex-1 border border-slate-200 text-slate-700 text-sm font-semibold py-2 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
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
            {SIDEBAR_LINKS.map(({ icon, label, active }) => (
              <a key={label} href="#" title={!sidebarOpen ? label : undefined}
                className={['flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-white/10 text-white font-bold border-l-4 border-secondary' : 'text-white/60 hover:bg-white/10 hover:text-white font-medium'].join(' ')}>
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
              </a>
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
              <button className="flex items-center justify-center gap-2 px-6 h-12 bg-secondary text-white font-semibold rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex-shrink-0">
                <span className="material-symbols-outlined">search</span>Browse Jobs
              </button>
            </section>

            {/* Stats */}
            {loading ? (
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="tonal-card p-6 rounded-xl animate-pulse h-32" />)}
              </section>
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
                  <button className="px-5 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
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
                  {loading ? (
                    <div className="p-6 animate-pulse space-y-3">
                      {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded" />)}
                    </div>
                  ) : data?.recentActivities.length ? (
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

                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-3 bg-slate-100 rounded-full" />
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                  </div>
                ) : data ? (
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
        {SIDEBAR_LINKS.map(({ icon, short, active }) => (
          <button key={short} className={['flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors', active ? 'text-secondary' : 'text-white/50 hover:text-white'].join(' ')}>
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
            <span className="text-[10px] font-semibold leading-none">{short}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
