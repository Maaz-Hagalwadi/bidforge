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

export default function FreelancerInvites() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

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

            <div>
              <h1 className="text-h1 font-bold text-on-surface">My Invites</h1>
              <p className="text-body-md text-on-surface-variant mt-1">Jobs you've been personally invited to by clients.</p>
            </div>

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
            ) : (
              <div className="space-y-4">
                {jobs.map(job => {
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
                        <div className="flex md:flex-col items-start gap-4 md:items-end flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-on-surface-variant mb-0.5">Budget</p>
                            <p className="text-lg font-bold text-secondary">{formatBudget(job.budgetMin, job.budgetMax, job.budgetType)}</p>
                          </div>
                          {job.deadline && (
                            <div className="text-right">
                              <p className="text-xs text-on-surface-variant mb-0.5">Deadline</p>
                              <p className="text-sm font-semibold text-on-surface">
                                {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          )}
                          <button onClick={() => navigate(`/jobs/${job.id}`)}
                            className="flex items-center gap-1.5 px-5 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
                            <span className="material-symbols-outlined text-[16px]">gavel</span>
                            View &amp; Bid
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
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
