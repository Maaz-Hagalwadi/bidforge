import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { jobsApi } from '@/api/jobs';
import { Navbar } from '@/components/Navbar';
import { BidForgeLogo } from '@/components/ui/BidForgeLogo';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import type { JobResponse } from '@/types/job';

const SIDEBAR_BG = '#0A192F';

const SIDEBAR_LINKS = [
  { icon: 'dashboard',    label: 'Dashboard',    short: 'Dashboard', path: 'DASHBOARD'  },
  { icon: 'search',       label: 'Browse Jobs',  short: 'Browse',    path: '/browse'    },
  { icon: 'receipt_long', label: 'My Contracts', short: 'Contracts', path: ''           },
  { icon: 'chat',         label: 'Messages',     short: 'Messages',  path: ''           },
  { icon: 'payments',     label: 'Payments',     short: 'Payments',  path: ''           },
];

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'bg-slate-100 text-slate-600'    },
  OPEN:      { label: 'Open',      cls: 'bg-secondary/10 text-secondary' },
  ASSIGNED:  { label: 'Assigned',  cls: 'bg-green-100 text-green-700'    },
  COMPLETED: { label: 'Completed', cls: 'bg-blue-50 text-blue-600'       },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-100 text-red-600'        },
};

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

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);

  const dashboardPath = user?.role === 'CLIENT'
    ? '/client/dashboard'
    : user?.role === 'FREELANCER'
    ? '/freelancer/dashboard'
    : '';

  useEffect(() => {
    if (!id) return;
    jobsApi.getById(id)
      .then(setJob)
      .catch(() => setError('Job not found or you do not have permission to view it.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const navRight = user ? (
    <div className="flex items-center gap-1">
      <button className="relative p-2 text-white/70 hover:text-white transition-colors" aria-label="Notifications">
        <span className="material-symbols-outlined">notifications</span>
      </button>
      <div className="relative" ref={profileRef}>
        <button onClick={() => setProfileOpen(o => !o)} aria-expanded={profileOpen} aria-label="Profile menu"
          className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
          {user.profileImageUrl ? (
            <img src={user.profileImageUrl} className="w-8 h-8 rounded-full object-cover border-2 border-white/20" alt={user.name} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold select-none">{initials}</div>
          )}
          <span className="material-symbols-outlined text-white/60 text-base leading-none">expand_more</span>
        </button>
        {profileOpen && <ProfileDropdown user={user} onUpdated={refreshUser} onLogout={handleLogout} />}
      </div>
    </div>
  ) : (
    <button onClick={() => navigate('/login')}
      className="px-4 py-1.5 border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/10 transition-colors">
      Log In
    </button>
  );

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      <Navbar variant="app" authRight={navRight} />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — only shown when logged in */}
        <aside
          className={[user ? 'hidden lg:flex' : 'hidden', 'flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-white/10 transition-[width] duration-300 ease-in-out overflow-hidden', sidebarOpen ? 'w-64' : 'w-16'].join(' ')}
          style={{ backgroundColor: SIDEBAR_BG }}
        >
          <div className={`flex items-center h-14 border-b border-white/10 px-3 flex-shrink-0 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 select-none">Menu</span>}
            <button onClick={() => setSidebarOpen(o => !o)} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-xl">{sidebarOpen ? 'menu_open' : 'menu'}</span>
            </button>
          </div>
          <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
            {SIDEBAR_LINKS.map(({ icon, label, path }) => {
              const resolved = path === 'DASHBOARD' ? dashboardPath : path;
              return (
                <button key={label} onClick={() => resolved && navigate(resolved)} title={!sidebarOpen ? label : undefined}
                  className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150 font-medium', sidebarOpen ? 'px-3' : 'justify-center px-2', resolved ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
                  <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
                  {sidebarOpen && <span className="text-sm truncate">{label}</span>}
                </button>
              );
            })}
          </nav>
          <div className="p-3 space-y-2 border-t border-white/10 flex-shrink-0">
            {sidebarOpen && (
              <div className="bg-white/5 border border-white/10 text-white rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">PRO PLAN</p>
                <p className="text-xs font-semibold leading-relaxed mb-3 text-white/80">Unlimited active contracts and priority support.</p>
                <button className="w-full py-2 bg-secondary rounded-lg text-xs font-bold hover:brightness-110 transition-all">Upgrade Now</button>
              </div>
            )}
            {user && (
              <button onClick={handleLogout} title={!sidebarOpen ? 'Sign Out' : undefined}
                className={['w-full flex items-center gap-3 rounded-lg py-2.5 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors', sidebarOpen ? 'px-3' : 'justify-center px-2'].join(' ')}>
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
                {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
              </button>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          <div className="flex-1 p-6 pb-24 lg:pb-8 lg:p-8 max-w-[900px] w-full mx-auto space-y-6">

            {/* Back */}
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back
            </button>

            {loading ? (
              <PageLoader message="Loading job…" />
            ) : error ? (
              <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">error_outline</span>
                <p className="text-on-surface font-semibold">{error}</p>
                <button onClick={() => navigate('/browse')}
                  className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                  Browse Jobs
                </button>
              </div>
            ) : job ? (
              <JobDetailContent job={job} user={user} navigate={navigate} />
            ) : null}
          </div>

          <footer className="py-8 px-8 border-t border-white/10 mt-auto" style={{ backgroundColor: '#0A192F' }}>
            <div className="max-w-[900px] mx-auto flex flex-col items-center gap-4">
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

      {user && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 flex items-stretch" style={{ backgroundColor: '#0A192F' }}>
          {SIDEBAR_LINKS.map(({ icon, short, path }) => {
            const resolved = path === 'DASHBOARD' ? (user.role === 'CLIENT' ? '/client/dashboard' : '/freelancer/dashboard') : path;
            return (
              <button key={short} onClick={() => resolved && navigate(resolved)}
                className={['flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors', resolved ? 'text-white/50 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
                <span className="material-symbols-outlined text-[22px]">{icon}</span>
                <span className="text-[10px] font-semibold leading-none">{short}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

function JobDetailContent({
  job,
  user,
  navigate,
}: {
  job: JobResponse;
  user: { role: string } | null;
  navigate: (path: string) => void;
}) {
  const st = STATUS_CFG[job.status] ?? { label: job.status, cls: 'bg-slate-100 text-slate-600' };
  const skills = parseSkills(job.requiredSkills);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="tonal-card rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">{job.category}</span>
          <span className="px-2.5 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-semibold">
            {job.budgetType === 'HOURLY' ? 'Hourly' : 'Fixed Price'}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${job.visibility === 'PUBLIC' ? 'bg-secondary/10 text-secondary' : 'bg-slate-100 text-slate-600'}`}>
            <span className="material-symbols-outlined text-[13px] align-middle mr-0.5">{job.visibility === 'PUBLIC' ? 'public' : 'lock'}</span>
            {job.visibility === 'PUBLIC' ? 'Public' : 'Invite Only'}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-on-surface">{job.title}</h1>

        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-on-surface-variant mb-0.5">Budget</p>
            <p className="text-xl font-bold text-secondary">{formatBudget(job.budgetMin, job.budgetMax, job.budgetType)}</p>
          </div>
          {job.deadline && (
            <div>
              <p className="text-xs text-on-surface-variant mb-0.5">Deadline</p>
              <p className="text-sm font-semibold text-on-surface">
                {new Date(job.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-on-surface-variant mb-0.5">Posted</p>
            <p className="text-sm font-semibold text-on-surface">
              {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* CTA */}
        {user?.role === 'FREELANCER' && job.status === 'OPEN' && (
          <button className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            Place a Bid
          </button>
        )}
        {!user && job.status === 'OPEN' && (
          <button onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
            <span className="material-symbols-outlined text-[18px]">login</span>
            Log in to Bid
          </button>
        )}
      </div>

      {/* Description */}
      <div className="tonal-card rounded-xl p-6 space-y-3">
        <h2 className="text-base font-bold text-on-surface">Job Description</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{job.description}</p>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="tonal-card rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-on-surface">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map(s => (
              <span key={s} className="px-3 py-1.5 bg-slate-100 border border-outline-variant rounded-full text-sm text-on-surface-variant font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Attachment */}
      {job.attachmentUrl && (
        <div className="tonal-card rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-on-surface">Attachment</h2>
          <a href={job.attachmentUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-secondary text-sm font-semibold hover:underline">
            <span className="material-symbols-outlined text-[18px]">attach_file</span>
            View Attachment
          </a>
        </div>
      )}
    </div>
  );
}
