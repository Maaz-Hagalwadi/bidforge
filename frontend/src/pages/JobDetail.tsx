import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { useParams, useNavigate, useLocation, type NavigateFunction } from 'react-router-dom';
import { CLIENT_SIDEBAR, FREELANCER_SIDEBAR } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { jobsApi } from '@/api/jobs';
import { BidForgeLogo } from '@/components/ui/BidForgeLogo';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import { Toast } from '@/components/Toast';
import type { BidResponse, JobResponse } from '@/types/job';

const SIDEBAR_BG = '#0A192F';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'bg-slate-100 text-slate-600'    },
  OPEN:      { label: 'Open',      cls: 'bg-secondary/10 text-secondary' },
  ASSIGNED:  { label: 'Assigned',  cls: 'bg-green-100 text-green-700'    },
  COMPLETED: { label: 'Completed', cls: 'bg-blue-50 text-blue-600'       },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-100 text-red-600'        },
};

const EXP_LABEL: Record<string, string> = {
  ENTRY: 'Entry Level',
  INTERMEDIATE: 'Intermediate',
  EXPERT: 'Expert Level',
};

const URGENCY_LABEL: Record<string, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High — Urgent',
};

const DELIVERY_OPTIONS = [
  { label: 'Less than 1 week',  days: 7   },
  { label: '1 – 2 weeks',       days: 14  },
  { label: '1 month',           days: 30  },
  { label: '2 – 3 months',      days: 75  },
  { label: '3 – 6 months',      days: 180 },
  { label: '6+ months',         days: 365 },
];

const BID_STATUS_CFG = {
  PENDING:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700',  icon: 'schedule'     },
  ACCEPTED: { label: 'Accepted', cls: 'bg-green-100 text-green-700', icon: 'check_circle' },
  REJECTED: { label: 'Rejected', cls: 'bg-slate-100 text-slate-500', icon: 'cancel'       },
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

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPage = (location.state as { from?: string } | null)?.from ?? null;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const sidebarLinks = user?.role === 'FREELANCER' ? FREELANCER_SIDEBAR : CLIENT_SIDEBAR;

  const activeLabel = fromPage === 'invites' ? 'My Invites'
    : fromPage === 'browse'  ? 'Browse Jobs'
    : fromPage === 'myjobs'  ? 'My Projects'
    : null;

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
      <NotificationBell />
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
    <div className="min-h-screen flex flex-col">
      <Navbar variant="app" authRight={navRight} />

      <div className="flex flex-1 min-h-0">
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
          <nav className="flex-1 min-h-0 py-2 px-2 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map(({ icon, label, path }) => {
              const active = label === activeLabel;
              return (
                <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
                  className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150 font-medium', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-white/10 text-white font-bold border-l-4 border-secondary' : path ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
                  <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
                  {sidebarOpen && <span className="text-sm truncate">{label}</span>}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto p-3 space-y-2 border-t border-white/10 flex-shrink-0">
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

        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col bg-surface">
          <div className="flex-1 p-6 pb-24 lg:pb-8 lg:p-8 max-w-[1280px] w-full mx-auto">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors mb-6">
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

          <Footer />
        </main>
      </div>

      {user && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 flex flex-col" style={{ backgroundColor: '#0A192F' }}>
          {[sidebarLinks.slice(0, 4), sidebarLinks.slice(4)].map((row, ri) => (
            <div key={ri} className={`flex items-stretch ${ri === 0 ? 'border-b border-white/10' : ''}`}>
              {row.map(({ icon, short, label, path }) => {
                const active = label === activeLabel;
                return (
                  <button key={short} onClick={() => path && navigate(path)}
                    className={['flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors', active ? 'text-secondary' : path ? 'text-white/50 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    <span className="text-[9px] font-semibold leading-none">{short}</span>
                  </button>
                );
              })}
            </div>
          ))}
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
  user: { role: string; id: number; name: string; profileImageUrl?: string } | null;
  navigate: NavigateFunction;
}) {
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryOption, setDeliveryOption] = useState(DELIVERY_OPTIONS[2].label);
  const [proposal, setProposal] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [myBid, setMyBid] = useState<BidResponse | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [serverError, setServerError] = useState('');

  const st = STATUS_CFG[job.status] ?? { label: job.status, cls: 'bg-slate-100 text-slate-600' };
  const skills = parseSkills(job.requiredSkills);
  const amountNum = parseFloat(bidAmount) || 0;
  const fee = amountNum * 0.1;
  const youReceive = amountNum - fee;

  const validateBid = () => {
    const e: Record<string, string> = {};
    if (!bidAmount || amountNum <= 0) e.amount = 'Enter a valid amount greater than 0.';
    if (!proposal.trim()) e.proposal = 'Cover letter is required.';
    else if (proposal.trim().length > 1000) e.proposal = 'Cannot exceed 1000 characters.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateBid();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setServerError('');
    setSubmitting(true);
    const days = DELIVERY_OPTIONS.find(o => o.label === deliveryOption)?.days ?? 30;
    try {
      const bid = await jobsApi.createBid(job.id, {
        amount: amountNum,
        deliveryDays: days,
        proposal: proposal.trim(),
      });
      setMyBid(bid);
      setToast({ message: 'Bid placed successfully!', type: 'success' });
    } catch (err: unknown) {
      const resp = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
      if (resp?.status === 403) setServerError('You must accept the invite before placing a bid.');
      else if (resp?.data?.message?.toLowerCase().includes('already')) setServerError('You have already placed a bid on this job.');
      else if (resp?.status === 400) setServerError('This job is no longer accepting bids.');
      else setServerError('Failed to place bid. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFreelancer = user?.role === 'FREELANCER';
  const canBid = isFreelancer && job.status === 'OPEN';

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

      {/* ── Left column ── */}
      <div className="md:col-span-8 flex flex-col gap-6">

        {/* Job header card */}
        <div className="bg-white rounded-xl p-6 border border-outline-variant shadow-[0px_4px_12px_rgba(10,25,47,0.05)]">
          <div className="flex justify-between items-start mb-4 gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              <span className="text-secondary text-xs font-bold uppercase tracking-wider">{job.category}</span>
              <h1 className="text-2xl font-bold text-on-surface leading-tight">{job.title}</h1>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant text-sm flex-shrink-0">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>{timeAgo(job.createdAt)}</span>
            </div>
          </div>

          {/* Meta bar */}
          <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">payments</span>
              <span className="text-sm font-semibold text-on-surface">{formatBudget(job.budgetMin, job.budgetMax, job.budgetType)}</span>
            </div>
            {job.experienceLevel && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">bolt</span>
                <span className="text-sm font-semibold text-on-surface">{EXP_LABEL[job.experienceLevel]}</span>
              </div>
            )}
            {job.deadline && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">calendar_today</span>
                <span className="text-sm font-semibold text-on-surface">
                  Due {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">{job.visibility === 'PUBLIC' ? 'public' : 'lock'}</span>
              <span className="text-sm font-semibold text-on-surface">{job.visibility === 'PUBLIC' ? 'Public' : 'Invite Only'}</span>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-3 mb-8">
            <h2 className="text-xl font-bold text-on-surface">Job Description</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Skills and Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-secondary/10 text-secondary rounded-full text-xs font-semibold">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Attachment */}
          {job.attachmentUrl && (
            <div className="mt-6 pt-6 border-t border-surface-container">
              <a href={job.attachmentUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-secondary text-sm font-semibold hover:underline">
                <span className="material-symbols-outlined text-[18px]">attach_file</span>
                View Attachment
              </a>
            </div>
          )}
        </div>

        {/* My Bid status (if already bid) */}
        {canBid && myBid && (
          <div className={`bg-white rounded-xl p-6 border shadow-[0px_4px_12px_rgba(10,25,47,0.05)] flex items-start gap-4 ${myBid.status === 'ACCEPTED' ? 'border-green-200' : myBid.status === 'REJECTED' ? 'border-slate-200' : 'border-amber-200'}`}>
            <span className={`material-symbols-outlined text-[28px] flex-shrink-0 mt-0.5 ${myBid.status === 'ACCEPTED' ? 'text-green-600' : myBid.status === 'REJECTED' ? 'text-slate-400' : 'text-amber-600'}`}>
              {BID_STATUS_CFG[myBid.status]?.icon ?? 'gavel'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-base font-bold text-on-surface">Your Bid</p>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${BID_STATUS_CFG[myBid.status]?.cls}`}>
                  {BID_STATUS_CFG[myBid.status]?.label}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant">
                <span className="font-semibold text-secondary">${myBid.amount.toLocaleString()}</span>
                {' · '}
                {myBid.deliveryDays} day{myBid.deliveryDays !== 1 ? 's' : ''}
              </p>
              {myBid.proposal && <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{myBid.proposal}</p>}
            </div>
          </div>
        )}

        {/* Place Your Bid form */}
        {canBid && !myBid && (
          <div className="bg-white rounded-xl p-6 border border-outline-variant shadow-[0px_4px_12px_rgba(10,25,47,0.05)]">
            <h2 className="text-xl font-bold text-on-surface mb-6">Place Your Bid</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bid Amount */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-on-surface">Bid Amount ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">$</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      placeholder="0.00"
                      className={`w-full pl-8 pr-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-secondary/15 focus:border-secondary outline-none transition-all ${errors.amount ? 'border-red-400' : 'border-outline-variant'}`}
                    />
                  </div>
                  {amountNum > 0 && (
                    <span className="text-xs text-on-surface-variant">
                      BidForge service fee (10%): –${fee.toFixed(2)}
                    </span>
                  )}
                  {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
                </div>

                {/* Estimated Delivery */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-on-surface">Estimated Delivery</label>
                  <div className="relative">
                    <select
                      value={deliveryOption}
                      onChange={e => setDeliveryOption(e.target.value)}
                      className="w-full px-4 py-3 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-secondary/15 focus:border-secondary outline-none appearance-none transition-all bg-white"
                    >
                      {DELIVERY_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Cover Letter</label>
                <textarea
                  value={proposal}
                  onChange={e => setProposal(e.target.value)}
                  rows={6}
                  maxLength={1000}
                  placeholder="Describe your experience and why you are the best fit for this project…"
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-secondary/15 focus:border-secondary outline-none transition-all resize-none ${errors.proposal ? 'border-red-400' : 'border-outline-variant'}`}
                />
                <div className="flex items-center justify-between">
                  {errors.proposal ? <p className="text-xs text-red-500">{errors.proposal}</p> : <span />}
                  <span className="text-xs text-on-surface-variant">{proposal.length}/1000</span>
                </div>
              </div>

              {serverError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="material-symbols-outlined text-red-500 text-[18px] flex-shrink-0">error</span>
                  <p className="text-sm text-red-600">{serverError}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-surface-container">
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant">You'll receive</span>
                  <span className="text-2xl font-bold text-on-surface">
                    {amountNum > 0 ? `$${youReceive.toFixed(2)}` : '—'}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-secondary text-white px-8 py-3 rounded-lg text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  <span>Submit Bid</span>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Log in to bid (unauthenticated) */}
        {!user && job.status === 'OPEN' && (
          <div className="bg-white rounded-xl p-6 border border-outline-variant shadow-[0px_4px_12px_rgba(10,25,47,0.05)] flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-bold text-on-surface">Interested in this job?</p>
              <p className="text-sm text-on-surface-variant mt-0.5">Log in to submit your bid and proposal.</p>
            </div>
            <button onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">login</span>
              Log In to Bid
            </button>
          </div>
        )}
      </div>

      {/* ── Right sidebar ── */}
      <aside className="md:col-span-4 flex flex-col gap-6">

        {/* About the Client */}
        <div className="bg-white rounded-xl p-6 border border-outline-variant shadow-[0px_4px_12px_rgba(10,25,47,0.05)] flex flex-col gap-5">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">About the Client</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-secondary text-[28px]">person</span>
            </div>
            <div>
              <p className="text-base font-bold text-on-surface">{job.clientName ?? `Client #${job.clientId}`}</p>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${st.cls}`}>
                {st.label}
              </span>
            </div>
          </div>

          <div className="space-y-3 border-t border-surface-container pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant">Budget Type</span>
              <span className="text-sm font-semibold text-on-surface">{job.budgetType === 'FIXED' ? 'Fixed Price' : 'Hourly'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant">Visibility</span>
              <span className="text-sm font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">{job.visibility === 'PUBLIC' ? 'public' : 'lock'}</span>
                {job.visibility === 'PUBLIC' ? 'Public' : 'Invite Only'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant">Posted</span>
              <span className="text-sm font-semibold text-on-surface">
                {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            {job.deadline && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">Deadline</span>
                <span className="text-sm font-semibold text-on-surface">
                  {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Job Activity */}
        <div className="bg-white rounded-xl p-6 border border-outline-variant shadow-[0px_4px_12px_rgba(10,25,47,0.05)]">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">Job Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${job.status === 'OPEN' ? 'bg-green-500' : 'bg-slate-300'}`} />
              <span className="text-sm text-on-surface">
                {job.status === 'OPEN' ? 'Actively accepting bids' : 'Not accepting new bids'}
              </span>
            </div>
            {job.experienceLevel && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-on-surface-variant">Experience Level</span>
                <span className="text-sm font-semibold text-on-surface">{EXP_LABEL[job.experienceLevel]}</span>
              </div>
            )}
            {job.urgencyLevel && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-on-surface-variant">Urgency</span>
                <span className={`text-sm font-semibold ${job.urgencyLevel === 'HIGH' ? 'text-secondary' : 'text-on-surface'}`}>
                  {URGENCY_LABEL[job.urgencyLevel]}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-on-surface-variant">Last updated</span>
              <span className="text-sm font-semibold text-on-surface">{timeAgo(job.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Upgrade to Pro */}
        <div className="bg-primary-container text-white rounded-xl p-6 overflow-hidden relative group">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
            <p className="text-sm text-on-primary-container mb-4 leading-relaxed">
              Get exclusive access to high-budget jobs and early bid alerts.
            </p>
            <button className="bg-white text-primary-container px-4 py-2 rounded-lg text-sm font-semibold hover:bg-surface transition-colors">
              Learn More
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-[120px]">workspace_premium</span>
          </div>
        </div>
      </aside>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* BidForge submit overlay */}
      {submitting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl px-10 py-10 flex flex-col items-center gap-5 w-full max-w-[320px] mx-4 text-center">
            <BidForgeLogo variant="dark" />
            <div className="flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-secondary animate-spin text-[40px]">progress_activity</span>
              <p className="text-base font-bold text-on-surface">Placing your bid…</p>
              <p className="text-sm text-on-surface-variant">Please wait while we submit your proposal.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
