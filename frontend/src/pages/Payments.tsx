import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, FREELANCER_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { milestonesApi } from '@/api/milestones';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import type { MilestoneResponse } from '@/types/milestone';

const SIDEBAR_BG = '#0A192F';
const PAGE_SIZE = 10;

type PaymentFilter = 'ALL' | 'PENDING' | 'ESCROWED' | 'RELEASED';

const STATUS_CFG: Record<string, { label: string; cls: string; icon: string; iconBg: string }> = {
  PENDING:  { label: 'Pending',    cls: 'bg-slate-100 text-slate-600',    icon: 'hourglass_empty', iconBg: 'bg-slate-100'   },
  ESCROWED: { label: 'In Escrow',  cls: 'bg-amber-50 text-amber-700',     icon: 'lock',            iconBg: 'bg-amber-100'   },
  RELEASED: { label: 'Released',   cls: 'bg-emerald-50 text-emerald-700', icon: 'task_alt',        iconBg: 'bg-emerald-100' },
};

function getPaymentState(m: MilestoneResponse): 'PENDING' | 'ESCROWED' | 'RELEASED' {
  if (m.status === 'APPROVED') return 'RELEASED';
  if (m.funded) return 'ESCROWED';
  return 'PENDING';
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Payments() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const sidebarLinks = withActive(
    user?.role === 'FREELANCER' ? FREELANCER_SIDEBAR : CLIENT_SIDEBAR,
    pathname
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [milestones, setMilestones] = useState<MilestoneResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PaymentFilter>('ALL');
  const [page, setPage] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = user?.role === 'CLIENT'
      ? milestonesApi.getClientMilestones()
      : milestonesApi.getFreelancerMilestones();

    fetch
      .then(data => setMilestones([...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.role]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const pending  = milestones.filter(m => getPaymentState(m) === 'PENDING');
  const escrowed = milestones.filter(m => getPaymentState(m) === 'ESCROWED');
  const released = milestones.filter(m => getPaymentState(m) === 'RELEASED');

  const totalEscrowed = escrowed.reduce((s, m) => s + m.amount, 0);
  const totalReleased = released.reduce((s, m) => s + m.amount, 0);
  const totalAll      = milestones.reduce((s, m) => s + m.amount, 0);

  const filtered =
    filter === 'PENDING'  ? pending  :
    filter === 'ESCROWED' ? escrowed :
    filter === 'RELEASED' ? released :
    milestones;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const isClient = user?.role === 'CLIENT';

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
        {/* Sidebar */}
        <aside
          className={['hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-white/10 transition-[width] duration-300 ease-in-out overflow-hidden flex-shrink-0', sidebarOpen ? 'w-64' : 'w-16'].join(' ')}
          style={{ backgroundColor: SIDEBAR_BG }}
        >
          <div className={`flex items-center h-14 border-b border-white/10 px-3 flex-shrink-0 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 select-none">Menu</span>}
            <button onClick={() => setSidebarOpen(o => !o)} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-xl">{sidebarOpen ? 'menu_open' : 'menu'}</span>
            </button>
          </div>
          <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map(({ icon, label, active, path }) => (
              <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
                className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150 font-medium', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-white/10 text-white font-bold border-l-4 border-secondary' : path ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-white/10 flex-shrink-0">
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

            <div>
              <h1 className="text-h1 font-bold text-on-surface">Payments</h1>
              <p className="text-body-md text-on-surface-variant mt-1">
                {isClient ? 'Track escrow payments across your milestone contracts.' : 'Track your earnings and pending milestone payments.'}
              </p>
            </div>

            {loading ? (
              <PageLoader message="Loading payments…" />
            ) : milestones.length === 0 ? (
              <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center border border-outline-variant">
                <span className="material-symbols-outlined text-5xl text-slate-300">payments</span>
                <p className="text-on-surface font-semibold">No payments yet</p>
                <p className="text-sm text-on-surface-variant max-w-xs">
                  {isClient
                    ? 'Payments appear here once you fund milestones on your contracts.'
                    : 'Payments appear here once a client funds milestones on your contracts.'}
                </p>
                <button onClick={() => navigate('/contracts')}
                  className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                  View Contracts
                </button>
              </div>
            ) : (
              <div className="space-y-5">

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-outline-variant p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-secondary text-[22px]">payments</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-on-surface">{formatCurrency(totalAll)}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Total Milestones Value</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-outline-variant p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-amber-600 text-[22px]">lock</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-on-surface">{formatCurrency(totalEscrowed)}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{isClient ? 'Held in Escrow' : 'Awaiting Release'}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-outline-variant p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-emerald-600 text-[22px]">task_alt</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-on-surface">{formatCurrency(totalReleased)}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{isClient ? 'Released to Freelancers' : 'Earned'}</p>
                    </div>
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1.5 flex-wrap">
                  {([
                    { key: 'ALL'      as PaymentFilter, label: 'All',         count: milestones.length },
                    { key: 'PENDING'  as PaymentFilter, label: 'Pending',     count: pending.length    },
                    { key: 'ESCROWED' as PaymentFilter, label: 'In Escrow',   count: escrowed.length   },
                    { key: 'RELEASED' as PaymentFilter, label: 'Released',    count: released.length   },
                  ]).map(({ key, label, count }) => (
                    <button key={key}
                      onClick={() => { setFilter(key); setPage(0); }}
                      className={['flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all', filter === key ? 'bg-secondary text-white shadow-sm' : 'bg-white border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
                      {label}
                      <span className={['text-xs px-1.5 py-0.5 rounded-full font-bold', filter === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-on-surface-variant'].join(' ')}>{count}</span>
                    </button>
                  ))}
                </div>

                <p className="text-sm text-on-surface-variant">
                  Showing <span className="font-semibold text-on-surface">{paginated.length}</span> of <span className="font-semibold text-on-surface">{filtered.length}</span> transactions
                </p>

                {filtered.length === 0 ? (
                  <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-16 text-center border border-outline-variant">
                    <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
                    <p className="text-on-surface font-semibold">No transactions in this category</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paginated.map(m => {
                        const state = getPaymentState(m);
                        const cfg = STATUS_CFG[state];
                        return (
                          <article key={m.id} className="bg-white rounded-xl border border-outline-variant hover:border-secondary/30 hover:shadow-sm transition-all p-5">
                            <div className="flex items-center gap-4">

                              {/* Icon */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                                <span className={`material-symbols-outlined text-[20px] ${state === 'RELEASED' ? 'text-emerald-600' : state === 'ESCROWED' ? 'text-amber-600' : 'text-slate-500'}`}>
                                  {cfg.icon}
                                </span>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                  <p className="text-sm font-bold text-on-surface truncate">{m.title}</p>
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-on-surface-variant">
                                  {m.jobTitle && (
                                    <span className="flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[12px]">work</span>
                                      {m.jobTitle}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                    {formatDate(m.createdAt)}
                                  </span>
                                  <button
                                    onClick={() => navigate(`/contracts/${m.contractId}`)}
                                    className="flex items-center gap-1 text-secondary font-semibold hover:underline"
                                  >
                                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                    View Contract
                                  </button>
                                </div>
                              </div>

                              {/* Amount */}
                              <div className="text-right flex-shrink-0">
                                <p className={`text-lg font-bold ${state === 'RELEASED' ? 'text-emerald-600' : state === 'ESCROWED' ? 'text-amber-600' : 'text-on-surface'}`}>
                                  {state === 'RELEASED' ? '+' : ''}{formatCurrency(m.amount)}
                                </p>
                                <p className="text-xs text-on-surface-variant mt-0.5">USD</p>
                              </div>
                            </div>
                          </article>
                        );
                      })}
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

function PaginationBar({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button disabled={page === 0} onClick={() => onPageChange(page - 1)}
        className="flex items-center gap-1 px-3 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <span className="material-symbols-outlined text-[18px]">chevron_left</span>Prev
      </button>
      <div className="flex gap-1">
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let p: number;
          if (totalPages <= 7) { p = i; }
          else if (page < 4) { p = i < 5 ? i : i === 5 ? -1 : totalPages - 1; }
          else if (page >= totalPages - 4) { p = i === 0 ? 0 : i === 1 ? -1 : totalPages - 7 + i; }
          else { p = i === 0 ? 0 : i === 1 ? -1 : i === 5 ? -1 : i === 6 ? totalPages - 1 : page - 2 + (i - 2); }
          if (p === -1) return <span key={`e-${i}`} className="px-2 py-2 text-on-surface-variant text-sm">…</span>;
          return (
            <button key={p} onClick={() => onPageChange(p)}
              className={['w-9 h-9 rounded-lg text-sm font-semibold transition-colors', p === page ? 'bg-secondary text-white' : 'border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
              {p + 1}
            </button>
          );
        })}
      </div>
      <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}
        className="flex items-center gap-1 px-3 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        Next<span className="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    </div>
  );
}
