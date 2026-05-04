import { useState, useRef, useEffect, useCallback } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { CLIENT_SIDEBAR, FREELANCER_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { contractsApi } from '@/api/contracts';
import { milestonesApi } from '@/api/milestones';
import type { MilestoneResponse } from '@/types/milestone';
import { PaymentModal } from '@/components/PaymentModal';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import type { ContractResponse } from '@/types/contract';

const SIDEBAR_BG = '#0A192F';

type MilestoneState = 'completed' | 'active' | 'pending';

const MILESTONE_LABELS = ['Contract Started', 'Work in Progress', 'Work Submitted', 'Completed'];

function getMilestoneStates(status: ContractResponse['status']): MilestoneState[] {
  switch (status) {
    case 'ACTIVE':              return ['completed', 'active',     'pending',   'pending'  ];
    case 'SUBMITTED':           return ['completed', 'completed',  'active',    'pending'  ];
    case 'REVISION_REQUESTED':  return ['completed', 'active',     'pending',   'pending'  ];
    case 'COMPLETED':           return ['completed', 'completed',  'completed', 'completed'];
    case 'CANCELLED':           return ['completed', 'pending',    'pending',   'pending'  ];
  }
}

const STATUS_CFG: Record<ContractResponse['status'], { label: string; cls: string; icon: string }> = {
  ACTIVE:              { label: 'Active',             cls: 'bg-secondary/10 text-secondary',   icon: 'work'           },
  SUBMITTED:           { label: 'Submitted',          cls: 'bg-amber-50 text-amber-700',       icon: 'pending_actions'},
  REVISION_REQUESTED:  { label: 'Revision Requested', cls: 'bg-orange-50 text-orange-700',     icon: 'replay'         },
  COMPLETED:           { label: 'Completed',          cls: 'bg-emerald-50 text-emerald-700',   icon: 'task_alt'       },
  CANCELLED:           { label: 'Cancelled',          cls: 'bg-red-50 text-red-600',           icon: 'cancel'         },
};

const MILESTONE_STATUS_CFG: Record<MilestoneResponse['status'], { label: string; cls: string; icon: string }> = {
  PENDING:     { label: 'Pending',     cls: 'bg-slate-100 text-slate-600',     icon: 'schedule'        },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-secondary/10 text-secondary',  icon: 'autorenew'       },
  FUNDED:      { label: 'Funded',      cls: 'bg-blue-50 text-blue-600',        icon: 'lock'            },
  SUBMITTED:   { label: 'Submitted',   cls: 'bg-amber-50 text-amber-700',      icon: 'pending_actions' },
  APPROVED:    { label: 'Approved',    cls: 'bg-emerald-50 text-emerald-700',  icon: 'task_alt'        },
  REJECTED:    { label: 'Rejected',    cls: 'bg-red-50 text-red-600',          icon: 'cancel'          },
};

interface MilestoneFormItem { title: string; description: string; amount: string; dueDate: string; }
const emptyMilestoneItem = (): MilestoneFormItem => ({ title: '', description: '', amount: '', dueDate: '' });

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d?: string) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shortId(id: string) {
  return `#BF-${id.slice(-4).toUpperCase()}`;
}

export default function Contracts() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { contractId } = useParams<{ contractId: string }>();

  const sidebarLinks = withActive(
    user?.role === 'FREELANCER' ? FREELANCER_SIDEBAR : CLIENT_SIDEBAR,
    pathname
  );

  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [contracts,    setContracts]    = useState<ContractResponse[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [listPage,     setListPage]     = useState(1);
  const LIST_PAGE_SIZE = 6;
  const [toast,        setToast]        = useState<{ message: string; error?: boolean } | null>(null);
  const [submitNote,   setSubmitNote]   = useState('');
  const [submitUrl,    setSubmitUrl]    = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [completing,   setCompleting]   = useState(false);
  const [showForm,          setShowForm]          = useState(false);
  const [showRevisionForm,  setShowRevisionForm]  = useState(false);
  const [revisionNoteInput, setRevisionNoteInput] = useState('');
  const [requestingRevision, setRequestingRevision] = useState(false);

  const [milestones,           setMilestones]           = useState<MilestoneResponse[]>([]);
  const [loadingMilestones,    setLoadingMilestones]    = useState(false);
  const [showMilestoneForm,    setShowMilestoneForm]    = useState(false);
  const [milestoneFormItems,   setMilestoneFormItems]   = useState<MilestoneFormItem[]>([emptyMilestoneItem()]);
  const [creatingMilestones,   setCreatingMilestones]   = useState(false);
  const [approvingId,          setApprovingId]          = useState<string | null>(null);
  const [rejectingId,          setRejectingId]          = useState<string | null>(null);
  const [refundingId,          setRefundingId]          = useState<string | null>(null);
  const [submittingMilestoneId, setSubmittingMilestoneId] = useState<string | null>(null);
  const [paymentMilestone,     setPaymentMilestone]     = useState<MilestoneResponse | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  const fetchContracts = useCallback(async () => {
    try {
      const data = user?.role === 'CLIENT'
        ? await contractsApi.getClientContracts()
        : await contractsApi.getFreelancerContracts();
      setContracts(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user?.role]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const fetchMilestones = useCallback(async (cId: string) => {
    setLoadingMilestones(true);
    try {
      const data = await milestonesApi.getMilestonesByContract(cId);
      setMilestones(data);
    } catch { /* silent */ }
    finally { setLoadingMilestones(false); }
  }, []);

  useEffect(() => {
    if (contractId) { fetchMilestones(contractId); }
    else { setMilestones([]); setShowMilestoneForm(false); setMilestoneFormItems([emptyMilestoneItem()]); }
  }, [contractId, fetchMilestones]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const handleSubmitWork = async (contract: ContractResponse) => {
    if (!submitNote.trim() || !submitUrl.trim()) {
      setToast({ message: 'Please fill in both fields.', error: true });
      return;
    }
    setSubmitting(true);
    try {
      await contractsApi.submitWork(contract.id, { submissionNote: submitNote, submissionUrl: submitUrl });
      setToast({ message: 'Work submitted! Awaiting client review.' });
      setShowForm(false); setSubmitNote(''); setSubmitUrl('');
      await fetchContracts();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 409) {
        setToast({ message: 'Work has already been submitted for this contract.', error: true });
        setShowForm(false);
        await fetchContracts();
      } else {
        setToast({ message: msg ?? 'Failed to submit work. Please try again.', error: true });
      }
    } finally { setSubmitting(false); }
  };

  const handleComplete = async (contract: ContractResponse) => {
    setCompleting(true);
    try {
      await contractsApi.completeContract(contract.id);
      setToast({ message: 'Contract completed! Payment released.' });
      await fetchContracts();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setToast({ message: msg ?? 'Failed to complete contract. Please try again.', error: true });
    } finally { setCompleting(false); }
  };

  const handleFundMilestone = (milestoneId: string) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (milestone) setPaymentMilestone(milestone);
  };

  const handlePaymentSuccess = async () => {
    setPaymentMilestone(null);
    setToast({ message: 'Milestone funded — payment locked in escrow.' });
    if (contractId) await fetchMilestones(contractId);
  };

  const handleSubmitMilestone = async (milestoneId: string) => {
    setSubmittingMilestoneId(milestoneId);
    try {
      await milestonesApi.submitMilestone(milestoneId);
      setToast({ message: 'Milestone submitted! Awaiting client approval.' });
      if (contractId) await fetchMilestones(contractId);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setToast({ message: msg ?? 'Failed to submit milestone.', error: true });
    } finally { setSubmittingMilestoneId(null); }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    setApprovingId(milestoneId);
    try {
      await milestonesApi.approveMilestone(milestoneId);
      setToast({ message: 'Milestone approved — payment released!' });
      if (contractId) await fetchMilestones(contractId);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setToast({ message: msg ?? 'Failed to approve milestone.', error: true });
    } finally { setApprovingId(null); }
  };

  const handleRejectMilestone = async (milestoneId: string) => {
    setRejectingId(milestoneId);
    try {
      await milestonesApi.rejectMilestone(milestoneId);
      setToast({ message: 'Milestone rejected — freelancer will need to resubmit.' });
      if (contractId) await fetchMilestones(contractId);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setToast({ message: msg ?? 'Failed to reject milestone.', error: true });
    } finally { setRejectingId(null); }
  };

  const handleRefundMilestone = async (milestoneId: string) => {
    setRefundingId(milestoneId);
    try {
      await milestonesApi.refundMilestone(milestoneId);
      setToast({ message: 'Payment refunded — escrow released back to you.' });
      if (contractId) await fetchMilestones(contractId);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setToast({ message: msg ?? 'Failed to refund milestone.', error: true });
    } finally { setRefundingId(null); }
  };

  const handleCreateMilestones = async (cId: string) => {
    const invalid = milestoneFormItems.some(i => !i.title.trim() || !i.amount || !i.dueDate);
    if (invalid) { setToast({ message: 'Please fill in all milestone fields.', error: true }); return; }
    setCreatingMilestones(true);
    try {
      const requests = milestoneFormItems.map(i => ({
        title: i.title.trim(),
        description: i.description.trim(),
        amount: parseFloat(i.amount),
        dueDate: `${i.dueDate}T23:59:00`,
      }));
      await milestonesApi.createMilestones(cId, requests);
      setToast({ message: `${requests.length} milestone${requests.length > 1 ? 's' : ''} created.` });
      setShowMilestoneForm(false);
      setMilestoneFormItems([emptyMilestoneItem()]);
      await fetchMilestones(cId);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setToast({ message: msg ?? 'Failed to create milestones.', error: true });
    } finally { setCreatingMilestones(false); }
  };

  const handleRequestRevision = async (contract: ContractResponse) => {
    if (!revisionNoteInput.trim()) {
      setToast({ message: 'Please enter a revision note.', error: true });
      return;
    }
    setRequestingRevision(true);
    try {
      await contractsApi.requestRevision(contract.id, revisionNoteInput);
      setToast({ message: 'Revision requested. The freelancer has been notified.' });
      setShowRevisionForm(false);
      setRevisionNoteInput('');
      await fetchContracts();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setToast({ message: msg ?? 'Failed to request revision. Please try again.', error: true });
    } finally {
      setRequestingRevision(false);
    }
  };

  const selected = contractId ? contracts.find(c => c.id === contractId) : null;

  // ── Navbar right ────────────────────────────────────────────────────────────

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

  // ── Sidebar ──────────────────────────────────────────────────────────────────

  const sidebar = (
    <aside
      className={[user ? 'hidden lg:flex' : 'hidden', 'flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-white/10 transition-[width] duration-300 ease-in-out overflow-hidden flex-shrink-0', sidebarOpen ? 'w-64' : 'w-16'].join(' ')}
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
      <div className="p-3 space-y-2 border-t border-white/10 flex-shrink-0">
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
  );

  // ── List view ────────────────────────────────────────────────────────────────

  const sortedContracts = [...contracts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const totalPages = Math.max(1, Math.ceil(sortedContracts.length / LIST_PAGE_SIZE));
  const pagedContracts = sortedContracts.slice((listPage - 1) * LIST_PAGE_SIZE, listPage * LIST_PAGE_SIZE);

  const listView = (
    <div className="flex-1 p-6 pb-24 lg:pb-8 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6">
      <div>
        <h1 className="text-h1 font-bold text-on-surface">My Contracts</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          {contracts.length} contract{contracts.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {contracts.length === 0 ? (
        <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center border border-outline-variant">
          <span className="material-symbols-outlined text-5xl text-slate-300">receipt_long</span>
          <p className="text-on-surface font-semibold">No contracts yet</p>
          <p className="text-sm text-on-surface-variant max-w-xs">
            {user?.role === 'FREELANCER'
              ? 'When a client accepts your bid, a contract will appear here.'
              : 'When you accept a freelancer\'s bid, a contract will appear here.'}
          </p>
          <button
            onClick={() => navigate(user?.role === 'FREELANCER' ? '/browse' : '/client/jobs')}
            className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
            {user?.role === 'FREELANCER' ? 'Browse Jobs' : 'My Projects'}
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {pagedContracts.map(c => {
              const cfg = STATUS_CFG[c.status];
              const party = user?.role === 'CLIENT' ? c.freelancerName : c.clientName;
              const partyLabel = user?.role === 'CLIENT' ? 'Freelancer' : 'Client';
              return (
                <article key={c.id}
                  className="bg-white rounded-xl border border-outline-variant hover:border-secondary/30 hover:shadow-md transition-all group cursor-pointer"
                  onClick={() => navigate(`/contracts/${c.id}`)}>
                  <div className="flex flex-col md:flex-row md:items-center p-5 gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${cfg.cls}`}>
                          <span className="material-symbols-outlined text-[13px]">{cfg.icon}</span>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium">{shortId(c.id)}</span>
                        <span className="text-xs text-on-surface-variant">· {formatDate(c.createdAt)}</span>
                      </div>
                      <h3 className="text-base font-bold text-on-surface group-hover:text-secondary transition-colors leading-snug">{c.jobTitle}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-secondary text-[16px]">payments</span>
                          <strong className="text-on-surface">{formatCurrency(c.amount)}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">person</span>
                          {partyLabel}: <strong className="text-on-surface ml-0.5">{party}</strong>
                        </span>
                        {c.deadline && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            Due: <strong className="text-on-surface ml-0.5">{formatDate(c.deadline)}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/contracts/${c.id}`); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
                        View Details
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-on-surface-variant">
                Showing {(listPage - 1) * LIST_PAGE_SIZE + 1}–{Math.min(listPage * LIST_PAGE_SIZE, contracts.length)} of {contracts.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setListPage(p => Math.max(1, p - 1))}
                  disabled={listPage === 1}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setListPage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === listPage ? 'bg-secondary text-white' : 'text-on-surface-variant hover:bg-slate-100'}`}>
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setListPage(p => Math.min(totalPages, p + 1))}
                  disabled={listPage === totalPages}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ── Detail view ──────────────────────────────────────────────────────────────

  function detailView(contract: ContractResponse) {
    const isFreelancer = user?.role === 'FREELANCER';
    const isClient = user?.role === 'CLIENT';
    const milestoneStates = getMilestoneStates(contract.status);
    const completedCount = milestoneStates.filter(s => s === 'completed').length;
    const progressPct = Math.min(completedCount / (MILESTONE_LABELS.length - 1), 1) * 100;
    const party = isClient ? contract.freelancerName : contract.clientName;
    const partyLabel = isClient ? 'Freelancer' : 'Client';
    const partyInitials = getInitials(party);

    const escrowBanner = (() => {
      if (contract.status === 'COMPLETED') return {
        bg: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-500', icon: 'task_alt',
        title: 'Contract Completed', titleCls: 'text-emerald-900',
        desc: 'This contract has been completed and payment has been released.', descCls: 'text-emerald-700',
        badge: 'bg-white text-emerald-600 border-emerald-100', badgeText: 'Completed',
      };
      if (contract.status === 'SUBMITTED') return {
        bg: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-500', icon: 'pending_actions',
        title: 'Work Submitted – Awaiting Review', titleCls: 'text-amber-900',
        desc: isClient ? 'The freelancer has submitted their work. Review and release payment.' : 'Your work has been submitted. The client will review it shortly.',
        descCls: 'text-amber-700',
        badge: 'bg-white text-amber-600 border-amber-100', badgeText: 'Under Review',
      };
      if (contract.status === 'REVISION_REQUESTED') return {
        bg: 'bg-orange-50 border-orange-100', iconBg: 'bg-orange-500', icon: 'replay',
        title: 'Revision Requested', titleCls: 'text-orange-900',
        desc: isClient ? 'You\'ve requested changes. Waiting for the freelancer to resubmit.' : 'The client has requested revisions. Review their feedback and resubmit.',
        descCls: 'text-orange-700',
        badge: 'bg-white text-orange-600 border-orange-100', badgeText: 'Revision Pending',
      };
      if (contract.status === 'CANCELLED') return {
        bg: 'bg-red-50 border-red-100', iconBg: 'bg-red-500', icon: 'cancel',
        title: 'Contract Cancelled', titleCls: 'text-red-900',
        desc: 'This contract has been cancelled.', descCls: 'text-red-700',
        badge: 'bg-white text-red-600 border-red-100', badgeText: 'Cancelled',
      };
      return {
        bg: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-500', icon: 'verified_user',
        title: 'Funds Held in Escrow', titleCls: 'text-emerald-900',
        desc: `Project payment of ${formatCurrency(contract.amount)} is secured and will be released upon completion.`,
        descCls: 'text-emerald-700',
        badge: 'bg-white text-emerald-600 border-emerald-100', badgeText: 'Status: Secured',
      };
    })();

    return (
      <div className="flex-1 p-6 pb-24 lg:pb-8 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6">

        {/* Back */}
        <button onClick={() => navigate('/contracts')}
          className="flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-secondary transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          All Contracts
        </button>

        {/* Escrow banner */}
        <div className={`rounded-xl p-4 flex items-center justify-between shadow-sm border ${escrowBanner.bg}`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${escrowBanner.iconBg}`}>
              <span className="material-symbols-outlined text-[22px]">{escrowBanner.icon}</span>
            </div>
            <div>
              <h4 className={`text-base font-bold ${escrowBanner.titleCls}`}>{escrowBanner.title}</h4>
              <p className={`text-sm ${escrowBanner.descCls}`}>{escrowBanner.desc}</p>
            </div>
          </div>
          <span className={`hidden sm:inline-flex px-4 py-1.5 text-sm font-semibold rounded-lg border ${escrowBanner.badge}`}>
            {escrowBanner.badgeText}
          </span>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Left 8 cols ── */}
          <section className="lg:col-span-8 space-y-6">

            {/* Contract header card */}
            <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-[0px_4px_12px_rgba(10,25,47,0.05)]">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-bold rounded-full mb-3">
                    Active Contract {shortId(contract.id)}
                  </span>
                  <h1 className="text-2xl font-bold text-on-surface leading-tight">{contract.jobTitle}</h1>
                  <div className="flex flex-wrap gap-5 mt-4">
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined text-secondary text-[18px]">payments</span>
                      Agreed Amount: <strong className="text-on-surface ml-0.5">{formatCurrency(contract.amount)}</strong>
                    </div>
                    {contract.deadline && (
                      <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                        <span className="material-symbols-outlined text-secondary text-[18px]">calendar_today</span>
                        Deadline: <strong className="text-on-surface ml-0.5">{formatDate(contract.deadline)}</strong>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined text-secondary text-[18px]">person</span>
                      {partyLabel}: <strong className="text-on-surface ml-0.5">{party}</strong>
                    </div>
                  </div>
                </div>
                <button onClick={() => navigate('/messages')}
                  className="flex items-center gap-2 text-secondary text-sm font-semibold hover:bg-secondary/5 px-4 py-2 rounded-lg transition-colors flex-shrink-0 border border-secondary/20">
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  Open Chat
                </button>
              </div>

              {/* Milestone timeline */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-lg font-bold text-on-surface mb-6">Contract Progress</h3>
                <div className="relative">
                  <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 rounded-full" />
                  <div className="absolute top-5 left-0 h-[2px] bg-secondary rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
                  <div className="relative flex justify-between">
                    {MILESTONE_LABELS.map((label, i) => {
                      const st = milestoneStates[i];
                      return (
                        <div key={label} className="flex flex-col items-center">
                          {st === 'completed' ? (
                            <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center z-10 shadow-md shadow-secondary/30">
                              <span className="material-symbols-outlined text-[20px]">check</span>
                            </div>
                          ) : st === 'active' ? (
                            <div className="w-10 h-10 rounded-full bg-white border-2 border-secondary text-secondary flex items-center justify-center z-10 ring-4 ring-secondary/10">
                              <span className="text-sm font-bold">{i + 1}</span>
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center z-10">
                              <span className="text-sm font-bold">{i + 1}</span>
                            </div>
                          )}
                          <p className={`mt-3 text-xs font-bold text-center leading-tight ${st === 'pending' ? 'text-on-surface-variant' : st === 'active' ? 'text-secondary' : 'text-on-surface'}`}>
                            {label}
                          </p>
                          <p className={`text-[11px] mt-0.5 font-medium ${st === 'completed' ? 'text-emerald-600' : st === 'active' ? 'text-secondary' : 'text-slate-400'}`}>
                            {st === 'completed' ? 'Done' : st === 'active' ? 'In Progress' : 'Pending'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Milestones card */}
            <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-[0px_4px_12px_rgba(10,25,47,0.05)]">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Milestones</h3>
                  {milestones.length > 0 && (
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {milestones.filter(m => m.status === 'APPROVED').length}/{milestones.length} completed
                      · {formatCurrency(milestones.filter(m => m.status === 'APPROVED').reduce((s, m) => s + m.amount, 0))} released
                    </p>
                  )}
                </div>
                {isClient && contract.status !== 'COMPLETED' && contract.status !== 'CANCELLED' && !showMilestoneForm && (
                  <button onClick={() => setShowMilestoneForm(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-secondary hover:bg-secondary/5 px-3 py-1.5 rounded-lg transition-colors border border-secondary/20">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Milestones
                  </button>
                )}
              </div>

              {loadingMilestones ? (
                <div className="flex items-center justify-center py-10">
                  <span className="material-symbols-outlined animate-spin text-secondary text-[28px]">progress_activity</span>
                </div>
              ) : milestones.length === 0 && !showMilestoneForm ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="w-14 h-14 bg-surface-container rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant">checklist</span>
                  </div>
                  <p className="text-sm font-semibold text-on-surface">No milestones yet</p>
                  <p className="text-xs text-on-surface-variant max-w-xs">
                    {isClient ? 'Break this project into trackable deliverables with individual payments.' : 'The client hasn\'t added any milestones yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestones.map((m, idx) => {
                    const mCfg = MILESTONE_STATUS_CFG[m.status];
                    const isApproving = approvingId === m.id;
                    const isSubmittingM = submittingMilestoneId === m.id;
                    return (
                      <div key={m.id} className="border border-outline-variant rounded-xl p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className="text-xs font-bold text-on-surface-variant">#{idx + 1}</span>
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${mCfg.cls}`}>
                                <span className="material-symbols-outlined text-[12px]">{mCfg.icon}</span>
                                {mCfg.label}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${m.funded ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                                {m.funded ? 'Escrowed' : 'Not Funded'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-on-surface">{m.title}</p>
                            {m.description && <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{m.description}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-base font-bold text-secondary">{formatCurrency(m.amount)}</p>
                            {m.dueDate && <p className="text-xs text-on-surface-variant mt-0.5">Due: {formatDate(m.dueDate)}</p>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                          {isClient && !m.funded && m.status === 'PENDING' && (
                            <button onClick={() => handleFundMilestone(m.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all">
                              <span className="material-symbols-outlined text-[14px]">lock</span>
                              Fund Escrow
                            </button>
                          )}
                          {isClient && m.status === 'SUBMITTED' && (
                            <>
                              <button onClick={() => handleApproveMilestone(m.id)} disabled={isApproving}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:brightness-110 disabled:opacity-60 transition-all">
                                {isApproving ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-[14px]">verified</span>}
                                {isApproving ? 'Approving…' : 'Approve & Release'}
                              </button>
                              <button onClick={() => handleRejectMilestone(m.id)} disabled={rejectingId === m.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-100 disabled:opacity-60 transition-all">
                                {rejectingId === m.id ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-[14px]">cancel</span>}
                                {rejectingId === m.id ? 'Rejecting…' : 'Reject'}
                              </button>
                            </>
                          )}
                          {isClient && m.funded && m.status !== 'APPROVED' && m.status !== 'SUBMITTED' && (
                            <button onClick={() => handleRefundMilestone(m.id)} disabled={refundingId === m.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-200 disabled:opacity-60 transition-all">
                              {refundingId === m.id ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-[14px]">undo</span>}
                              {refundingId === m.id ? 'Refunding…' : 'Refund Escrow'}
                            </button>
                          )}
                          {isFreelancer && m.funded && (m.status === 'PENDING' || m.status === 'REJECTED') && (
                            <button onClick={() => handleSubmitMilestone(m.id)} disabled={isSubmittingM}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-white text-xs font-bold rounded-lg hover:brightness-110 disabled:opacity-60 transition-all">
                              {isSubmittingM ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-[14px]">send</span>}
                              {isSubmittingM ? 'Submitting…' : m.status === 'REJECTED' ? 'Resubmit Work' : 'Submit Work'}
                            </button>
                          )}
                          {m.status === 'APPROVED' && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                              <span className="material-symbols-outlined text-[14px]">task_alt</span>Payment Released
                            </span>
                          )}
                          {isFreelancer && !m.funded && m.status === 'PENDING' && (
                            <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                              <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                              Awaiting funding from client
                            </span>
                          )}
                          {isFreelancer && m.status === 'REJECTED' && !m.funded && (
                            <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                              <span className="material-symbols-outlined text-[14px]">cancel</span>
                              Rejected — client refunded the escrow
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Create milestone form */}
              {showMilestoneForm && (
                <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-on-surface">New Milestones</h4>
                    <button onClick={() => { setShowMilestoneForm(false); setMilestoneFormItems([emptyMilestoneItem()]); }}
                      className="text-on-surface-variant hover:text-on-surface transition-colors">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                  {milestoneFormItems.map((item, idx) => (
                    <div key={idx} className="p-4 border border-outline-variant rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Milestone {idx + 1}</p>
                        {milestoneFormItems.length > 1 && (
                          <button onClick={() => setMilestoneFormItems(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-600 transition-colors">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={e => setMilestoneFormItems(prev => prev.map((it, i) => i === idx ? { ...it, title: e.target.value } : it))}
                        placeholder="Milestone title"
                        className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-white"
                      />
                      <textarea
                        value={item.description}
                        onChange={e => setMilestoneFormItems(prev => prev.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))}
                        rows={2}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-white resize-none"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-on-surface-variant mb-1 px-0.5">Amount ($)</label>
                          <input
                            type="number"
                            min="1"
                            value={item.amount}
                            onChange={e => setMilestoneFormItems(prev => prev.map((it, i) => i === idx ? { ...it, amount: e.target.value } : it))}
                            placeholder="500"
                            className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-on-surface-variant mb-1 px-0.5">Due Date</label>
                          <input
                            type="date"
                            value={item.dueDate}
                            onChange={e => setMilestoneFormItems(prev => prev.map((it, i) => i === idx ? { ...it, dueDate: e.target.value } : it))}
                            className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setMilestoneFormItems(prev => [...prev, emptyMilestoneItem()])}
                    className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-on-surface-variant hover:border-secondary hover:text-secondary transition-all flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Another Milestone
                  </button>
                  <div className="flex gap-3">
                    <button onClick={() => handleCreateMilestones(contract.id)} disabled={creatingMilestones}
                      className="flex-1 py-3 bg-secondary text-white rounded-lg text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                      {creatingMilestones ? (
                        <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Creating…</>
                      ) : (
                        <><span className="material-symbols-outlined text-[16px]">save</span>Create Milestones</>
                      )}
                    </button>
                    <button onClick={() => { setShowMilestoneForm(false); setMilestoneFormItems([emptyMilestoneItem()]); }}
                      className="px-4 py-3 border border-outline-variant text-on-surface-variant rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submission section */}
            <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-[0px_4px_12px_rgba(10,25,47,0.05)]">

              {/* FREELANCER + ACTIVE or REVISION_REQUESTED: submit work form */}
              {isFreelancer && (contract.status === 'ACTIVE' || contract.status === 'REVISION_REQUESTED') && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-on-surface">
                      {contract.status === 'REVISION_REQUESTED' ? 'Resubmit Your Work' : 'Submit Your Work'}
                    </h3>
                    <span className="text-xs text-on-surface-variant">Provide a note and a link to your deliverables</span>
                  </div>
                  {contract.status === 'REVISION_REQUESTED' && contract.revisionNote && (
                    <div className="mb-5 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-orange-500 text-[20px] flex-shrink-0 mt-0.5">replay</span>
                      <div>
                        <p className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-1">Client's Revision Note</p>
                        <p className="text-sm text-orange-900 leading-relaxed">{contract.revisionNote}</p>
                      </div>
                    </div>
                  )}
                  {!showForm ? (
                    <button onClick={() => setShowForm(true)}
                      className="w-full border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-all group">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-secondary text-4xl">upload_file</span>
                      </div>
                      <p className="text-lg font-bold text-on-surface">Ready to submit?</p>
                      <p className="text-sm text-on-surface-variant">Click here to add your submission details</p>
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-on-surface-variant px-1">Submission Note</label>
                        <textarea
                          value={submitNote}
                          onChange={e => setSubmitNote(e.target.value)}
                          rows={4}
                          placeholder="Describe what you've completed, any important notes for the client…"
                          className="w-full px-4 py-3 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all resize-none bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-on-surface-variant px-1">Deliverable Link</label>
                        <input
                          type="url"
                          value={submitUrl}
                          onChange={e => setSubmitUrl(e.target.value)}
                          placeholder="https://github.com/… or drive.google.com/… or figma.com/…"
                          className="w-full px-4 py-3 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all bg-white"
                        />
                      </div>
                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={() => handleSubmitWork(contract)}
                          disabled={submitting}
                          className="flex-1 py-3 bg-secondary text-white rounded-lg text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                          {submitting ? (
                            <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Submitting…</>
                          ) : (
                            <><span className="material-symbols-outlined text-[18px]">send</span>Submit Work</>
                          )}
                        </button>
                        <button onClick={() => { setShowForm(false); setSubmitNote(''); setSubmitUrl(''); }}
                          className="px-4 py-3 border border-outline-variant text-on-surface-variant rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* FREELANCER + SUBMITTED or COMPLETED: show what was submitted */}
              {isFreelancer && (contract.status === 'SUBMITTED' || contract.status === 'COMPLETED') && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-on-surface">Submitted Work</h3>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${contract.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      <span className="material-symbols-outlined text-[14px]">{contract.status === 'COMPLETED' ? 'task_alt' : 'pending_actions'}</span>
                      {contract.status === 'COMPLETED' ? 'Approved' : 'Under Review'}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-surface-container rounded-xl border border-outline-variant">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Submission Note</p>
                      <p className="text-sm text-on-surface leading-relaxed">{contract.submissionNote || '—'}</p>
                    </div>
                    {contract.submissionUrl && (
                      <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-secondary/10 text-secondary rounded-lg flex-shrink-0">
                            <span className="material-symbols-outlined text-[22px]">link</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-on-surface truncate">Deliverable Link</p>
                            <p className="text-xs text-on-surface-variant truncate">{contract.submissionUrl}</p>
                          </div>
                        </div>
                        <a href={contract.submissionUrl} target="_blank" rel="noopener noreferrer"
                          className="ml-3 flex-shrink-0 p-2 text-secondary hover:bg-secondary/5 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                        </a>
                      </div>
                    )}
                    {contract.submittedAt && (
                      <p className="text-xs text-on-surface-variant">Submitted on {formatDate(contract.submittedAt)}</p>
                    )}
                  </div>
                </>
              )}

              {/* CLIENT + REVISION_REQUESTED: revision pending */}
              {isClient && contract.status === 'REVISION_REQUESTED' && (
                <>
                  <h3 className="text-lg font-bold text-on-surface mb-4">Revision Requested</h3>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3 mb-4">
                    <span className="material-symbols-outlined text-orange-500 text-[20px] flex-shrink-0 mt-0.5">replay</span>
                    <div>
                      <p className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-1">Your Revision Note</p>
                      <p className="text-sm text-orange-900 leading-relaxed">{contract.revisionNote || '—'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant">Waiting for the freelancer to address your feedback and resubmit.</p>
                </>
              )}

              {/* CLIENT + ACTIVE: waiting */}
              {isClient && contract.status === 'ACTIVE' && (
                <>
                  <h3 className="text-lg font-bold text-on-surface mb-4">Deliverable</h3>
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant">hourglass_empty</span>
                    </div>
                    <p className="text-base font-semibold text-on-surface">Awaiting Submission</p>
                    <p className="text-sm text-on-surface-variant max-w-xs">The freelancer is working on the project. Their submission will appear here when ready.</p>
                  </div>
                </>
              )}

              {/* CLIENT + SUBMITTED: review submission */}
              {isClient && (contract.status === 'SUBMITTED' || contract.status === 'COMPLETED') && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-on-surface">Review Submission</h3>
                    {contract.status === 'COMPLETED' && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
                        <span className="material-symbols-outlined text-[14px]">task_alt</span>Approved
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-surface-container rounded-xl border border-outline-variant">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Freelancer's Note</p>
                      <p className="text-sm text-on-surface leading-relaxed">{contract.submissionNote || '—'}</p>
                    </div>
                    {contract.submissionUrl && (
                      <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-secondary/10 text-secondary rounded-lg flex-shrink-0">
                            <span className="material-symbols-outlined text-[22px]">link</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-on-surface truncate">Deliverable Link</p>
                            <p className="text-xs text-on-surface-variant truncate">{contract.submissionUrl}</p>
                          </div>
                        </div>
                        <a href={contract.submissionUrl} target="_blank" rel="noopener noreferrer"
                          className="ml-3 flex-shrink-0 p-2 text-secondary hover:bg-secondary/5 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                        </a>
                      </div>
                    )}
                    {contract.submittedAt && (
                      <p className="text-xs text-on-surface-variant">Submitted on {formatDate(contract.submittedAt)}</p>
                    )}
                  </div>
                </>
              )}

              {/* CANCELLED */}
              {contract.status === 'CANCELLED' && (
                <>
                  <h3 className="text-lg font-bold text-on-surface mb-4">Contract Cancelled</h3>
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-red-400">cancel</span>
                    </div>
                    <p className="text-base font-semibold text-on-surface">This contract was cancelled</p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ── Right 4 cols ── */}
          <section className="lg:col-span-4 space-y-6">

            {/* Actions card */}
            <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-[0px_4px_12px_rgba(10,25,47,0.05)]">
              <h3 className="text-lg font-bold text-on-surface mb-5">Actions</h3>
              <div className="space-y-3">

                {/* Freelancer actions */}
                {isFreelancer && (contract.status === 'ACTIVE' || contract.status === 'REVISION_REQUESTED') && !showForm && (
                  <button type="button" onClick={() => setShowForm(true)}
                    className="w-full bg-secondary text-white py-3.5 rounded-xl text-sm font-bold hover:brightness-110 shadow-lg shadow-secondary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    {contract.status === 'REVISION_REQUESTED' ? 'Resubmit Work' : 'Submit Work'}
                  </button>
                )}
                {isFreelancer && (contract.status === 'ACTIVE' || contract.status === 'REVISION_REQUESTED') && showForm && (
                  <button type="button" onClick={() => { setShowForm(false); setSubmitNote(''); setSubmitUrl(''); }}
                    className="w-full bg-slate-100 text-slate-600 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    Cancel
                  </button>
                )}
                {isFreelancer && contract.status === 'SUBMITTED' && (
                  <button disabled className="w-full bg-amber-100 text-amber-700 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                    Awaiting Client Review
                  </button>
                )}
                {isFreelancer && contract.status === 'COMPLETED' && (
                  <button disabled className="w-full bg-emerald-100 text-emerald-700 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">task_alt</span>
                    Contract Completed
                  </button>
                )}

                {/* Client actions */}
                {isClient && contract.status === 'SUBMITTED' && (
                  <>
                    <button onClick={() => handleComplete(contract)} disabled={completing}
                      className="w-full bg-secondary text-white py-3.5 rounded-xl text-sm font-bold hover:brightness-110 shadow-lg shadow-secondary/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {completing ? (
                        <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Processing…</>
                      ) : (
                        <><span className="material-symbols-outlined text-[18px]">verified</span>Approve &amp; Release Payment</>
                      )}
                    </button>
                    {!showRevisionForm ? (
                      <button type="button" onClick={() => setShowRevisionForm(true)}
                        className="w-full bg-orange-50 border border-orange-200 text-orange-700 py-3.5 rounded-xl text-sm font-bold hover:bg-orange-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">replay</span>
                        Request Revision
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={revisionNoteInput}
                          onChange={e => setRevisionNoteInput(e.target.value)}
                          rows={3}
                          placeholder="Describe what needs to be changed…"
                          className="w-full px-3 py-2.5 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 resize-none bg-orange-50"
                        />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleRequestRevision(contract)} disabled={requestingRevision}
                            className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-1.5">
                            {requestingRevision ? (
                              <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Sending…</>
                            ) : (
                              <><span className="material-symbols-outlined text-[16px]">send</span>Send</>
                            )}
                          </button>
                          <button type="button" onClick={() => { setShowRevisionForm(false); setRevisionNoteInput(''); }}
                            className="px-3 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg text-sm font-semibold hover:bg-slate-50">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {isClient && contract.status === 'REVISION_REQUESTED' && (
                  <button disabled className="w-full bg-orange-100 text-orange-700 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">replay</span>
                    Awaiting Resubmission
                  </button>
                )}
                {isClient && contract.status === 'ACTIVE' && (
                  <button disabled className="w-full bg-slate-100 text-slate-400 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
                    Awaiting Submission
                  </button>
                )}
                {isClient && contract.status === 'COMPLETED' && (
                  <button disabled className="w-full bg-emerald-100 text-emerald-700 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">task_alt</span>
                    Payment Released
                  </button>
                )}

              </div>
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary text-[20px] flex-shrink-0 mt-0.5">info</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {isFreelancer
                    ? 'Submitting your work notifies the client to review and release the escrowed payment.'
                    : 'Approving the submission releases the escrowed funds to the freelancer.'}
                </p>
              </div>
            </div>

            {/* Contract party card */}
            <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-[0px_4px_12px_rgba(10,25,47,0.05)]">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-5">Contract Party</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white text-base font-bold flex-shrink-0">
                  {partyInitials}
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{party}</p>
                  <p className="text-xs text-on-surface-variant capitalize">{partyLabel}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="bg-surface-container rounded-lg p-3">
                  <p className="text-xs text-on-surface-variant mb-1">Contract ID</p>
                  <p className="text-sm font-bold text-on-surface font-mono">{shortId(contract.id)}</p>
                </div>
                <div className="bg-surface-container rounded-lg p-3">
                  <p className="text-xs text-on-surface-variant mb-1">Amount</p>
                  <p className="text-sm font-bold text-secondary">{formatCurrency(contract.amount)}</p>
                </div>
                <div className="bg-surface-container rounded-lg p-3">
                  <p className="text-xs text-on-surface-variant mb-1">Status</p>
                  <p className={`text-sm font-bold ${STATUS_CFG[contract.status].cls.split(' ')[1]}`}>{STATUS_CFG[contract.status].label}</p>
                </div>
                <div className="bg-surface-container rounded-lg p-3">
                  <p className="text-xs text-on-surface-variant mb-1">Started</p>
                  <p className="text-sm font-bold text-on-surface">{formatDate(contract.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Security badge */}
            <div className="bg-primary-container rounded-xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
                  <h4 className="text-base font-bold">BidForge Protection</h4>
                </div>
                <p className="text-sm text-on-primary-container leading-relaxed mb-4">
                  Your work is protected. We ensure payment security for every milestone through our verified escrow system.
                </p>
                <button className="px-4 py-2 bg-white text-primary-container text-xs font-bold rounded-lg hover:bg-surface-container-low transition-colors">
                  Learn More
                </button>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-[120px]">lock</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      <Navbar variant="app" authRight={navRight} />

      <div className="flex flex-1 min-h-0">
        {sidebar}

        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <PageLoader message="Loading contracts…" />
            </div>
          ) : contractId && !selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
              <p className="text-on-surface font-semibold">Contract not found</p>
              <button onClick={() => navigate('/contracts')} className="px-5 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                Back to Contracts
              </button>
            </div>
          ) : contractId && selected ? (
            detailView(selected)
          ) : (
            listView
          )}

          <Footer />
        </main>
      </div>

      {/* Mobile bottom nav */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 flex items-stretch" style={{ backgroundColor: '#0A192F' }}>
          {sidebarLinks.map(({ icon, short, active, path }) => (
            <button key={short} onClick={() => path && navigate(path)}
              className={['flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors', active ? 'text-secondary' : path ? 'text-white/50 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
              <span className="text-[10px] font-semibold leading-none">{short}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Payment modal */}
      {paymentMilestone && (
        <PaymentModal
          milestone={paymentMilestone}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaymentMilestone(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 text-sm font-semibold rounded-xl shadow-xl flex items-center gap-2 max-w-sm text-center ${toast.error ? 'bg-red-600 text-white' : 'bg-on-surface text-inverse-on-surface'}`}>
          <span className="material-symbols-outlined text-[18px] flex-shrink-0">{toast.error ? 'error' : 'check_circle'}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
