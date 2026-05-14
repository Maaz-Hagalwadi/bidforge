import { useTheme } from '@/context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, FREELANCER_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { MobileNavDrawer } from '@/components/MobileNavDrawer';
import type { AppNotification, NotificationType } from '@/types/notification';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TYPE_CFG: Record<NotificationType, { icon: string; color: string; category: string }> = {
  JOB_CREATED:          { icon: 'work',          color: '#3b82f6', category: 'Jobs'       },
  JOB_INVITED:          { icon: 'mail',           color: '#8b5cf6', category: 'Jobs'       },
  BID_PLACED:           { icon: 'gavel',          color: '#f59e0b', category: 'Bids'       },
  BID_ACCEPTED:         { icon: 'handshake',      color: '#10b981', category: 'Bids'       },
  BID_REJECTED:         { icon: 'cancel',         color: '#ef4444', category: 'Bids'       },
  CONTRACT_CREATED:     { icon: 'receipt_long',   color: '#6366f1', category: 'Contracts'  },
  CONTRACT_SUBMITTED:   { icon: 'upload_file',    color: '#8b5cf6', category: 'Contracts'  },
  CONTRACT_COMPLETED:   { icon: 'verified',       color: '#10b981', category: 'Contracts'  },
  REVISION_REQUESTED:   { icon: 'refresh',        color: '#f59e0b', category: 'Contracts'  },
  MILESTONE_CREATED:    { icon: 'add_task',       color: '#6366f1', category: 'Milestones' },
  MILESTONE_FUNDED:     { icon: 'lock',           color: '#3b82f6', category: 'Milestones' },
  MILESTONE_SUBMITTED:  { icon: 'upload',         color: '#f59e0b', category: 'Milestones' },
  MILESTONE_APPROVED:   { icon: 'check_circle',   color: '#10b981', category: 'Milestones' },
  MILESTONE_REJECTED:   { icon: 'rule',           color: '#ef4444', category: 'Milestones' },
  MILESTONE_REFUNDED:   { icon: 'money_off',      color: '#6b7280', category: 'Milestones' },
  PAYMENT_RELEASED:     { icon: 'payments',       color: '#10b981', category: 'Payments'   },
};

function getNavPath(n: AppNotification): string {
  const id = n.referenceId;
  switch (n.type) {
    case 'JOB_CREATED':
    case 'JOB_INVITED':          return id ? `/jobs/${id}` : '/browse';
    case 'BID_PLACED':           return id ? `/client/jobs/${id}/bids` : '/client/bids';
    case 'BID_ACCEPTED':         return id ? `/contracts/${id}` : '/contracts';
    case 'BID_REJECTED':         return '/freelancer/bids';
    default:                     return id ? `/contracts/${id}` : '/contracts';
  }
}

const CATEGORIES = ['All', 'Unread', 'Jobs', 'Bids', 'Contracts', 'Milestones', 'Payments'] as const;
type Category = typeof CATEGORIES[number];

const PAGE_SIZE = 20;

export default function Notifications() {
  const { user, logout, refreshUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const sidebarLinks = withActive(
    user?.role === 'FREELANCER' ? FREELANCER_SIDEBAR : CLIENT_SIDEBAR,
    pathname
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [category, setCategory] = useState<Category>('All');
  const [page, setPage] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => { setPage(0); }, [category]);

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const filtered = notifications.filter(n => {
    if (category === 'Unread') return !n.read;
    if (category === 'All') return true;
    return (TYPE_CFG[n.type]?.category ?? '') === category;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClick = async (n: AppNotification) => {
    if (!n.read) await markAsRead(n.id);
    navigate(getNavPath(n));
  };

  const navRight = (
    <div className="flex items-center gap-1">
      <NotificationBell />
      <div className="relative" ref={profileRef}>
        <button onClick={() => setProfileOpen(o => !o)} aria-expanded={profileOpen} aria-label="Profile menu"
          className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} className="w-8 h-8 rounded-full object-cover border-2 border-slate-300 dark:border-white/20" alt={user?.name} />
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
          className={['hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-slate-200 dark:border-white/10 transition-[width] duration-300 ease-in-out overflow-hidden flex-shrink-0', sidebarOpen ? 'w-64' : 'w-16'].join(' ')}
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

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-h2 font-bold text-on-surface">Notifications</h1>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button onClick={() => markAllAsRead()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-secondary border border-secondary/30 rounded-xl hover:bg-secondary/5 transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px]">done_all</span>
                  Mark all as read
                </button>
              )}
            </div>

            {/* Category filter tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(cat => {
                const count = cat === 'All' ? notifications.length
                  : cat === 'Unread' ? unreadCount
                  : notifications.filter(n => TYPE_CFG[n.type]?.category === cat).length;
                if (count === 0 && cat !== 'All') return null;
                return (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className={['flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all', category === cat ? 'bg-secondary text-white shadow-sm' : 'bg-white border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
                    {cat}
                    <span className={['text-xs px-1.5 py-0.5 rounded-full font-bold', category === cat ? 'bg-white/20 text-slate-900 dark:text-white' : 'bg-slate-100 text-on-surface-variant'].join(' ')}>{count}</span>
                  </button>
                );
              })}
            </div>

            {notifications.length === 0 ? (
              <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center border border-outline-variant">
                <span className="material-symbols-outlined text-5xl text-slate-400">notifications_off</span>
                <p className="text-on-surface font-semibold">No notifications yet</p>
                <p className="text-sm text-on-surface-variant max-w-xs">Activity on your jobs, bids, and contracts will show up here.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="tonal-card rounded-xl flex flex-col items-center gap-3 py-14 text-center border border-outline-variant">
                <span className="material-symbols-outlined text-4xl text-slate-400">search_off</span>
                <p className="text-on-surface-variant font-semibold text-sm">No notifications in this category</p>
              </div>
            ) : (
              <>
                <div className="tonal-card rounded-xl border border-outline-variant overflow-hidden divide-y divide-outline-variant">
                  {paginated.map(n => {
                    const cfg = TYPE_CFG[n.type] ?? { icon: 'notifications', color: '#3b82f6', category: 'Other' };
                    return (
                      <button key={n.id} onClick={() => handleClick(n)}
                        className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-container ${!n.read ? 'bg-secondary/3' : ''}`}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: `${cfg.color}18` }}>
                          <span className="material-symbols-outlined text-[18px]" style={{ color: cfg.color }}>{cfg.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <p className={`text-sm leading-snug ${!n.read ? 'font-bold text-on-surface' : 'font-semibold text-on-surface'}`}>{n.title}</p>
                            <span className="text-[11px] text-on-surface-variant flex-shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">{cfg.category}</span>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0 mt-2" />}
                      </button>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                      className="flex items-center gap-1 px-3 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>Prev
                    </button>
                    <span className="text-sm text-on-surface-variant px-2">Page {page + 1} of {totalPages}</span>
                    <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                      className="flex items-center gap-1 px-3 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      Next<span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
