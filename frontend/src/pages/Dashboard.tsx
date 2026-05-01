import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/api/user';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import type { UserProfile } from '@/types/user';

// ── Static mock data ──────────────────────────────────────────

const STATS = [
  { icon: 'work_history',  label: 'Active Jobs',         value: '12',      trend: '+2 this week',    trendColor: 'text-secondary' },
  { icon: 'group',         label: 'Total Bids Received', value: '156',     trend: '+48%',            trendColor: 'text-secondary' },
  { icon: 'handshake',     label: 'Ongoing Contracts',   value: '8',       trend: 'No change',       trendColor: 'text-on-surface-variant' },
  { icon: 'payments',      label: 'Total Spent',         value: '$24,500', trend: '-12% vs last mo', trendColor: 'text-error' },
] as const;

const PROJECTS = [
  {
    title: 'Senior UX/UI Designer for Fintech App',
    status: 'Open',
    statusCls: 'bg-secondary/10 text-secondary',
    meta: 'Posted 2 hours ago • 24 Bids Received • Budget: $5k – $8k',
    extra: 'bids' as const,
  },
  {
    title: 'Full-stack React & Node.js Developer',
    status: 'Assigned',
    statusCls: 'bg-green-500/10 text-green-600',
    meta: 'Contracted to Alex M. • Milestones: 2/5 Completed • Due: Dec 15',
    extra: '$12,000' as const,
  },
  {
    title: 'Website Migration & SEO Audit',
    status: 'Completed',
    statusCls: 'bg-slate-500/10 text-slate-500',
    meta: 'Finished 3 days ago • Rated: 5.0 ⭐ • Total Payout: $2,400',
    extra: 'paid' as const,
  },
];

const TALENT = [
  { name: 'Julia Stevens', specialty: 'Python Specialist', rating: '4.9', reviews: 124 },
  { name: 'Marcus Chen',   specialty: 'Cloud Architect',   rating: '5.0', reviews: 88 },
];

const SIDEBAR_LINKS = [
  { icon: 'dashboard',  label: 'Dashboard',      short: 'Dashboard', active: true  },
  { icon: 'add_circle', label: 'Post a Job',      short: 'Post Job',  active: false },
  { icon: 'assignment', label: 'Active Projects', short: 'Projects',  active: false },
  { icon: 'payments',   label: 'Finances',        short: 'Finances',  active: false },
  { icon: 'person',     label: 'Profile',         short: 'Profile',   active: false },
];

// ── Helpers ───────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── ProfileDropdown ───────────────────────────────────────────

function ProfileDropdown({
  user,
  onUpdated,
}: {
  user: UserProfile;
  onUpdated: () => Promise<void>;
}) {
  const [mode, setMode] = useState<'view' | 'name' | 'photo'>('view');
  const [name, setName] = useState(user.name);
  const [photo, setPhoto] = useState(user.profileImageUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // Sync local state when user prop updates (e.g. after successful save)
  useEffect(() => {
    setName(user.name);
    setPhoto(user.profileImageUrl ?? '');
  }, [user.name, user.profileImageUrl]);

  const save = useCallback(
    async (payload: { name?: string; profileImageUrl?: string }) => {
      setSaving(true);
      setErr('');
      try {
        await userApi.updateMe(payload);
        await onUpdated();
        setMode('view');
      } catch {
        setErr('Update failed. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [onUpdated],
  );

  const initials = getInitials(user.name);

  return (
    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
      {/* User header */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            className="w-12 h-12 rounded-full object-cover border border-slate-200 flex-shrink-0"
            alt={user.name}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{user.name}</p>
          <p className="text-sm text-slate-500 truncate">{user.email}</p>
          <span className="mt-1 inline-block px-2 py-0.5 bg-secondary/10 text-secondary text-xs font-semibold rounded-full">
            {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      {/* View mode */}
      {mode === 'view' && (
        <div className="p-2">
          <button
            onClick={() => setMode('name')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left"
          >
            <span className="material-symbols-outlined text-[20px] text-slate-400">edit</span>
            Edit Name
          </button>
          <button
            onClick={() => setMode('photo')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left"
          >
            <span className="material-symbols-outlined text-[20px] text-slate-400">add_a_photo</span>
            Change Profile Photo
          </button>
        </div>
      )}

      {/* Edit name */}
      {mode === 'name' && (
        <div className="p-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save({ name: name.trim() })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary transition-colors"
            placeholder="Your full name"
          />
          {err && <p className="text-xs text-red-500 mt-1.5">{err}</p>}
          <div className="flex gap-2 mt-3">
            <button
              disabled={saving || !name.trim()}
              onClick={() => save({ name: name.trim() })}
              className="flex-1 bg-secondary text-white text-sm font-semibold py-2 rounded-lg hover:brightness-110 disabled:opacity-60 transition-all"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setMode('view'); setName(user.name); setErr(''); }}
              className="flex-1 border border-slate-200 text-slate-700 text-sm font-semibold py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit photo */}
      {mode === 'photo' && (
        <div className="p-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Photo URL
          </label>
          {photo && (
            <img
              src={photo}
              className="w-14 h-14 rounded-full object-cover border border-slate-200 mb-3"
              alt="Preview"
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          )}
          <input
            autoFocus
            value={photo}
            onChange={e => setPhoto(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary transition-colors"
            placeholder="https://example.com/photo.jpg"
          />
          {err && <p className="text-xs text-red-500 mt-1.5">{err}</p>}
          <div className="flex gap-2 mt-3">
            <button
              disabled={saving}
              onClick={() => save({ profileImageUrl: photo.trim() || undefined })}
              className="flex-1 bg-secondary text-white text-sm font-semibold py-2 rounded-lg hover:brightness-110 disabled:opacity-60 transition-all"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setMode('view'); setPhoto(user.profileImageUrl ?? ''); setErr(''); }}
              className="flex-1 border border-slate-200 text-slate-700 text-sm font-semibold py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────

function StatCard({
  icon, label, value, trend, trendColor,
}: {
  icon: string; label: string; value: string; trend: string; trendColor: string;
}) {
  return (
    <div className="tonal-card p-6 rounded-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={`material-symbols-outlined text-secondary text-[32px]`}>{icon}</span>
        <span className={`font-bold text-label-sm ${trendColor}`}>{trend}</span>
      </div>
      <div>
        <p className="text-on-surface-variant text-label-md">{label}</p>
        <h3 className="text-h2 font-bold text-on-surface">{value}</h3>
      </div>
    </div>
  );
}

// ── ProjectRow ────────────────────────────────────────────────

function ProjectRow({
  title, status, statusCls, meta, extra,
}: {
  title: string; status: string; statusCls: string; meta: string; extra: string;
}) {
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
            {['A', 'B', 'C'].map(l => (
              <div
                key={l}
                className="w-7 h-7 rounded-full border-2 border-white bg-secondary/10 flex items-center justify-center text-[10px] font-bold text-secondary"
              >
                {l}
              </div>
            ))}
            <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
              +21
            </div>
          </div>
        ) : extra === 'paid' ? (
          <span className="text-label-sm font-bold text-slate-400">Paid Out</span>
        ) : (
          <div className="text-right">
            <p className="font-bold text-sm text-on-surface">{extra}</p>
            <p className="text-[10px] text-on-surface-variant">Total Value</p>
          </div>
        )}
        <button className="p-1.5 border border-outline-variant rounded-lg hover:border-secondary transition-colors">
          <span className="material-symbols-outlined text-[18px]">more_horiz</span>
        </button>
      </div>
    </div>
  );
}

// ── TalentCard ────────────────────────────────────────────────

function TalentCard({ name, specialty, rating, reviews }: {
  name: string; specialty: string; rating: string; reviews: number;
}) {
  return (
    <div className="tonal-card p-4 rounded-xl flex gap-4">
      <div className="w-14 h-14 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary font-bold text-lg flex-shrink-0 select-none">
        {getInitials(name)}
      </div>
      <div className="space-y-1">
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

// ── Dashboard ─────────────────────────────────────────────────

const SIDEBAR_BG = '#0A192F';

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = user ? getInitials(user.name) : '?';

  // ── Right-side content injected into the Navbar ──
  const navRight = (
    <div className="flex items-center gap-1">
      {/* Notification bell */}
      <button
        className="relative p-2 text-white/70 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
      </button>

      {/* Profile avatar + dropdown */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen(o => !o)}
          aria-expanded={profileOpen}
          aria-label="Profile menu"
          className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
              alt={user.name}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold select-none">
              {initials}
            </div>
          )}
          <span className="material-symbols-outlined text-white/60 text-base leading-none">
            expand_more
          </span>
        </button>

        {profileOpen && user && (
          <ProfileDropdown
            user={user}
            onUpdated={refreshUser}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      {/* Top navbar — hidden on mobile, shown on md+ via Navbar component */}
      <Navbar variant="app" authRight={navRight} />

      <div className="flex flex-1 min-h-0">
        {/* ── Left sidebar — desktop only (lg+) ── */}
        <aside
          className={[
            'hidden lg:flex flex-col',
            'sticky top-16 h-[calc(100vh-4rem)]',
            'border-r border-white/10',
            'transition-[width] duration-300 ease-in-out overflow-hidden',
            sidebarOpen ? 'w-64' : 'w-16',
          ].join(' ')}
          style={{ backgroundColor: SIDEBAR_BG }}
        >
          {/* Sidebar toggle header */}
          <div
            className={`flex items-center h-14 border-b border-white/10 px-3 flex-shrink-0 ${
              sidebarOpen ? 'justify-between' : 'justify-center'
            }`}
          >
            {sidebarOpen && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 select-none">
                Menu
              </span>
            )}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-xl">
                {sidebarOpen ? 'menu_open' : 'menu'}
              </span>
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
            {SIDEBAR_LINKS.map(({ icon, label, active }) => (
              <a
                key={label}
                href="#"
                title={!sidebarOpen ? label : undefined}
                className={[
                  'flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150',
                  sidebarOpen ? 'px-3' : 'justify-center px-2',
                  active
                    ? 'bg-white/10 text-white font-bold border-l-4 border-secondary'
                    : 'text-white/60 hover:bg-white/10 hover:text-white font-medium',
                ].join(' ')}
              >
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
              </a>
            ))}
          </nav>

          {/* Bottom: PRO card + logout */}
          <div className="p-3 space-y-2 border-t border-white/10 flex-shrink-0">
            {sidebarOpen && (
              <div className="bg-white/5 border border-white/10 text-white rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                  PRO PLAN
                </p>
                <p className="text-xs font-semibold leading-relaxed mb-3 text-white/80">
                  Unlimited active contracts and priority support.
                </p>
                <button className="w-full py-2 bg-secondary rounded-lg text-xs font-bold hover:brightness-110 transition-all">
                  Upgrade Now
                </button>
              </div>
            )}
            <button
              onClick={handleLogout}
              title={!sidebarOpen ? 'Sign Out' : undefined}
              className={[
                'w-full flex items-center gap-3 rounded-lg py-2.5',
                'text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors',
                sidebarOpen ? 'px-3' : 'justify-center px-2',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
              {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          <div className="flex-1 p-6 pb-24 lg:pb-8 lg:p-8 space-y-8 max-w-[1280px] w-full mx-auto">

            {/* Welcome header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-h1 font-bold text-on-surface">
                  Welcome back, {user?.name.split(' ')[0] ?? 'there'} 👋
                </h1>
                <p className="text-body-lg text-on-surface-variant mt-1">
                  Manage your projects and discover top talent for your next big idea.
                </p>
              </div>
              <button className="flex items-center justify-center gap-2 px-6 h-12 bg-secondary text-white font-semibold rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex-shrink-0">
                <span className="material-symbols-outlined">add</span>
                Post a New Job
              </button>
            </section>

            {/* Stats grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map(s => <StatCard key={s.label} {...s} />)}
            </section>

            {/* Recent project activity */}
            <section className="tonal-card rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-h3 font-semibold text-on-surface">Recent Project Activity</h3>
                <button className="text-secondary font-semibold text-sm hover:underline">
                  View All Jobs
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {PROJECTS.map(p => <ProjectRow key={p.title} {...p} />)}
              </div>
            </section>

            {/* Talent + News */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-h3 font-semibold text-on-surface">Recommended for You</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TALENT.map(t => <TalentCard key={t.name} {...t} />)}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-h3 font-semibold text-on-surface">Network News</h3>
                <div className="tonal-card p-6 rounded-xl border-l-4 border-l-secondary bg-gradient-to-br from-white to-slate-50">
                  <p className="text-label-sm font-bold text-secondary mb-2 uppercase tracking-wide">
                    System Update
                  </p>
                  <p className="font-semibold text-on-surface mb-2">Escrow 2.0 is now live.</p>
                  <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
                    Secure your project funds with even more precision. Check out the new milestone
                    release schedule.
                  </p>
                  <a
                    href="#"
                    className="text-secondary font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Learn More
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </a>
                </div>
              </div>
            </section>
          </div>

          <Footer />
        </main>
      </div>

      {/* ── Mobile bottom nav (lg+: sidebar takes over) ── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 flex items-stretch"
        style={{ backgroundColor: '#0A192F' }}
      >
        {SIDEBAR_LINKS.map(({ icon, short, active }) => (
          <button
            key={short}
            className={[
              'flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors',
              active ? 'text-secondary' : 'text-white/50 hover:text-white',
            ].join(' ')}
          >
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
            <span className="text-[10px] font-semibold leading-none">{short}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
