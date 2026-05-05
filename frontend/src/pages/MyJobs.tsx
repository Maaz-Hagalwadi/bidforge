import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { jobsApi } from '@/api/jobs';
import { usersApi, type FreelancerSearchResult } from '@/api/users';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import { BidForgeLogo } from '@/components/ui/BidForgeLogo';
import type { JobInviteStatus, JobResponse } from '@/types/job';

const SIDEBAR_BG = '#0A192F';

const CATEGORIES = [
  'Software Development', 'UI/UX Design', 'Digital Marketing', 'Data Science',
  'Writing & Content', 'Video & Animation', 'Finance & Accounting', 'Legal',
];

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'bg-slate-100 text-slate-600'    },
  OPEN:      { label: 'Open',      cls: 'bg-secondary/10 text-secondary' },
  ASSIGNED:  { label: 'Assigned',  cls: 'bg-amber-100 text-amber-700'    },
  COMPLETED: { label: 'Completed', cls: 'bg-green-100 text-green-700'    },
  CANCELLED: { label: 'Archived',  cls: 'bg-slate-100 text-slate-500'    },
};

const ST_TOP: Record<string, string> = {
  DRAFT:     'bg-slate-300',
  OPEN:      'bg-secondary',
  ASSIGNED:  'bg-amber-400',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-slate-300',
};

const STATUS_TABS = ['ALL', 'OPEN', 'DRAFT', 'ASSIGNED', 'COMPLETED'] as const;
type StatusFilter = (typeof STATUS_TABS)[number];
function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function formatBudget(min: number, max: number, type: string) {
  const s = type === 'HOURLY' ? '/hr' : '';
  return `$${min.toLocaleString()}${s} – $${max.toLocaleString()}${s}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function parseSkills(str?: string): string[] {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

// ── EditJobModal ───────────────────────────────────────────────

function EditJobModal({ job, onClose, onSaved }: {
  job: JobResponse;
  onClose: () => void;
  onSaved: (updated: JobResponse) => void;
}) {
  const [title, setTitle]           = useState(job.title);
  const [category, setCategory]     = useState(job.category);
  const [description, setDesc]      = useState(job.description);
  const [budgetType, setBudgetType] = useState<'FIXED' | 'HOURLY'>(job.budgetType);
  const [budgetMin, setBudgetMin]   = useState(String(job.budgetMin ?? ''));
  const [budgetMax, setBudgetMax]   = useState(String(job.budgetMax ?? ''));
  const [deadline, setDeadline]     = useState(job.deadline ? job.deadline.split('T')[0] : '');
  const [skills, setSkills]         = useState<string[]>(parseSkills(job.requiredSkills));
  const [skillInput, setSkillInput] = useState('');
  const [expLevel, setExpLevel]     = useState(job.experienceLevel ?? '');
  const [urgency, setUrgency]       = useState(job.urgencyLevel ?? '');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills(p => [...p, s]);
    setSkillInput('');
  };
  const onSkillKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); }
  };

  const handleSave = async () => {
    if (!title.trim() || !category || !description.trim()) {
      setError('Title, category and description are required.');
      return;
    }
    if (!expLevel) {
      setError('Please select an experience level.');
      return;
    }
    const min = Number(budgetMin), max = Number(budgetMax);
    if (!min || !max || min <= 0 || max <= 0 || max < min) {
      setError('Enter valid budget values (max ≥ min).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await jobsApi.updateJob(job.id, {
        title: title.trim(),
        category,
        description: description.trim(),
        requiredSkills: skills.length ? skills.join(', ') : undefined,
        budgetType,
        budgetMin: min,
        budgetMax: max,
        deadline: deadline ? `${deadline}T00:00:00` : undefined,
        visibility: job.visibility,
        experienceLevel: (expLevel as JobResponse['experienceLevel']) || undefined,
        urgencyLevel: (urgency as JobResponse['urgencyLevel']) || undefined,
      });
      onSaved(updated);
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <BidForgeLogo variant="dark" className="scale-75 origin-left" />
            <div>
              <h2 className="text-base font-bold text-on-surface">Edit Job</h2>
              <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{job.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">
              <span className="material-symbols-outlined text-[15px]">error</span>{error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input value={title} onChange={e => setTitle(e.target.value)} type="text"
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm appearance-none bg-white focus:outline-none focus:border-secondary transition-colors">
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={4}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors resize-none" />
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Budget Type</label>
              <div className="flex p-0.5 bg-slate-100 rounded-lg">
                {(['FIXED', 'HOURLY'] as const).map(bt => (
                  <button key={bt} type="button" onClick={() => setBudgetType(bt)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${budgetType === bt ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                    {bt === 'FIXED' ? 'Fixed' : 'Hourly'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Budget Range (USD) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input value={budgetMin} onChange={e => setBudgetMin(e.target.value)} type="number" min="1" placeholder="Min"
                  className="w-full px-2.5 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors" />
                <span className="text-slate-400 flex-shrink-0 text-xs">–</span>
                <input value={budgetMax} onChange={e => setBudgetMax(e.target.value)} type="number" min="1" placeholder="Max"
                  className="w-full px-2.5 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors" />
              </div>
            </div>
          </div>

          {/* Experience + Urgency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Experience Level <span className="text-red-500">*</span></label>
              <div className="relative">
                <select value={expLevel} onChange={e => setExpLevel(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm appearance-none bg-white focus:outline-none focus:border-secondary transition-colors ${!expLevel && error ? 'border-red-400' : 'border-outline-variant'}`}>
                  <option value="">Select experience level</option>
                  <option value="ENTRY">Entry Level</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="EXPERT">Expert</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Level</label>
              <div className="relative">
                <select value={urgency} onChange={e => setUrgency(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm appearance-none bg-white focus:outline-none focus:border-secondary transition-colors">
                  <option value="">Select urgency</option>
                  <option value="LOW">Low — No rush</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High — Urgent Hiring</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline</label>
            <input value={deadline} onChange={e => setDeadline(e.target.value)} type="date"
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors" />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Required Skills</label>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {skills.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-medium">
                    {s}
                    <button type="button" onClick={() => setSkills(p => p.filter(x => x !== s))}
                      className="hover:text-secondary/60 transition-colors">
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={onSkillKey}
                type="text" placeholder="Type a skill and press Enter"
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors pr-14" />
              <button type="button" onClick={addSkill} disabled={!skillInput.trim()}
                className="absolute right-1.5 top-1 px-2.5 py-1 bg-secondary text-white text-xs font-semibold rounded-md hover:brightness-110 disabled:opacity-40 transition-all">
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 bg-secondary text-white text-sm font-bold rounded-lg hover:brightness-110 disabled:opacity-60 transition-all">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invite Modal ───────────────────────────────────────────────

function getInitialsFrom(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function InviteModal({ job, onClose }: { job: JobResponse; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FreelancerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<FreelancerSearchResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [alreadyInvitedIds, setAlreadyInvitedIds] = useState<Set<number>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    jobsApi.getJobInvites(job.id)
      .then(invitees => setAlreadyInvitedIds(new Set(invitees.map(i => i.freelancerId))))
      .catch(() => {});
  }, [job.id]);

  const search = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    usersApi.searchFreelancers(q)
      .then(setResults).catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  const isAlreadyInvited = selected ? alreadyInvitedIds.has(selected.id) : false;

  const handleInvite = async () => {
    if (!selected || isAlreadyInvited) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      await jobsApi.inviteFreelancer(job.id, selected.id);
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg('Failed to send invite. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-on-surface">Invite Freelancer</h2>
            <p className="text-sm text-on-surface-variant mt-0.5 line-clamp-1">{job.title}</p>
          </div>
          <button onClick={onClose} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
            </div>
            <p className="font-semibold text-on-surface">Invite sent!</p>
            <p className="text-sm text-on-surface-variant">{selected?.name} has been invited to this job.</p>
            <button onClick={onClose} className="mt-2 px-6 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">Done</button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Search Freelancer</label>
              {selected ? (
                <div className="flex items-center gap-3 px-3 py-2.5 border border-secondary/40 bg-secondary/5 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {selected.profileImageUrl ? <img src={selected.profileImageUrl} className="w-8 h-8 rounded-full object-cover" alt={selected.name} /> : getInitialsFrom(selected.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{selected.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{selected.email}</p>
                  </div>
                  <button onClick={() => { setSelected(null); setQuery(''); setResults([]); }} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Search by name or email…" autoFocus
                    className="w-full pl-9 pr-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors" />
                  {(results.length > 0 || searching || query.trim()) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-10 overflow-hidden">
                      {searching ? (
                        <div className="px-4 py-3 text-sm text-on-surface-variant">Searching…</div>
                      ) : results.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-on-surface-variant">No freelancers found.</div>
                      ) : results.map(r => (
                        <button key={r.id} onClick={() => { setSelected(r); setResults([]); setQuery(''); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {r.profileImageUrl ? <img src={r.profileImageUrl} className="w-8 h-8 rounded-full object-cover" alt={r.name} /> : getInitialsFrom(r.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-on-surface truncate">{r.name}</p>
                            <p className="text-xs text-on-surface-variant truncate">{r.email}</p>
                          </div>
                          {r.rating && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-500 flex-shrink-0">
                              <span className="material-symbols-outlined text-[13px]">star</span>{r.rating.toFixed(1)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {isAlreadyInvited && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="material-symbols-outlined text-amber-600 text-[15px]">info</span>
                  <p className="text-xs text-amber-700 font-medium">This freelancer has already been invited.</p>
                </div>
              )}
              {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleInvite} disabled={!selected || status === 'loading' || isAlreadyInvited}
                className="flex-1 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60">
                {status === 'loading' ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── InviteesModal ──────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: string }> = {
  INVITED:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700',  icon: 'schedule'     },
  ACCEPTED: { label: 'Accepted', cls: 'bg-green-100 text-green-700', icon: 'check_circle' },
  DECLINED: { label: 'Declined', cls: 'bg-slate-100 text-slate-500', icon: 'cancel'       },
};

type InviteTab = 'ALL' | 'ACCEPTED' | 'INVITED' | 'DECLINED';
const INVITE_TABS: { key: InviteTab; label: string }[] = [
  { key: 'ALL', label: 'All' }, { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'INVITED', label: 'Pending' }, { key: 'DECLINED', label: 'Declined' },
];

function InviteesModal({ job, onClose }: { job: JobResponse; onClose: () => void }) {
  const [invitees, setInvitees] = useState<JobInviteStatus[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<InviteTab>('ALL');

  useEffect(() => {
    jobsApi.getJobInvites(job.id).then(setInvitees).catch(console.error).finally(() => setLoading(false));
  }, [job.id]);

  const counts: Record<InviteTab, number> = {
    ALL: invitees.length, ACCEPTED: invitees.filter(i => i.status === 'ACCEPTED').length,
    INVITED: invitees.filter(i => i.status === 'INVITED').length, DECLINED: invitees.filter(i => i.status === 'DECLINED').length,
  };
  const visible = tab === 'ALL' ? invitees : invitees.filter(i => i.status === tab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-outline-variant flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-on-surface">Invite Responses</h2>
            <p className="text-sm text-on-surface-variant mt-0.5 line-clamp-1">{job.title}</p>
          </div>
          <button onClick={onClose} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {!loading && invitees.length > 0 && (
          <div className="px-4 pt-4 flex gap-1.5 flex-wrap flex-shrink-0">
            {INVITE_TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={['flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', tab === key ? 'bg-secondary text-white' : 'bg-slate-100 text-on-surface-variant hover:bg-slate-200'].join(' ')}>
                {label}
                <span className={['text-[10px] px-1.5 py-0.5 rounded-full font-bold', tab === key ? 'bg-white/20 text-white' : 'bg-white text-on-surface-variant'].join(' ')}>{counts[key]}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Loading…
            </div>
          ) : invitees.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">group</span>
              <p className="text-sm text-on-surface-variant">No freelancers invited yet.</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="material-symbols-outlined text-3xl text-slate-300">person_search</span>
              <p className="text-sm text-on-surface-variant">No invitees with this status.</p>
            </div>
          ) : visible.map(inv => {
            const badge = STATUS_BADGE[inv.status] ?? STATUS_BADGE.INVITED;
            return (
              <div key={inv.inviteId} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-outline-variant bg-slate-50">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {inv.freelancerName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{inv.freelancerName}</p>
                  <p className="text-xs text-on-surface-variant truncate">{inv.freelancerEmail}</p>
                </div>
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${badge.cls}`}>
                  <span className="material-symbols-outlined text-[12px]">{badge.icon}</span>{badge.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-outline-variant flex-shrink-0">
          <button onClick={onClose} className="w-full py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-slate-50 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── MyJobs ─────────────────────────────────────────────────────

export default function MyJobs() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sidebarLinks = withActive(CLIENT_SIDEBAR, pathname);

  const [sidebarOpen, setSidebarOpen]           = useState(true);
  const [profileOpen, setProfileOpen]           = useState(false);
  const [jobs, setJobs]                         = useState<JobResponse[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [statusFilter, setStatusFilter]         = useState<StatusFilter>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'PUBLIC' | 'INVITE_ONLY'>('ALL');
  const [search, setSearch]                     = useState('');
  const [inviteJob, setInviteJob]               = useState<JobResponse | null>(null);
  const [inviteesJob, setInviteesJob]           = useState<JobResponse | null>(null);
  const [editJob, setEditJob]                   = useState<JobResponse | null>(null);
  const [archiveConfirmJob, setArchiveConfirmJob] = useState<JobResponse | null>(null);
  const [archiveLoading, setArchiveLoading]     = useState(false);
  const [page, setPage]                         = useState(0);
  const [viewMode, setViewMode]                 = useState<'list' | 'grid'>('list');
  const PAGE_SIZE = 10;

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    jobsApi.getMyJobs().then(setJobs).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const handleFilterChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (val: T) => { setter(val); setPage(0); };

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const handleJobUpdated = (updated: JobResponse) => {
    setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
  };

  const handleArchive = async (job: JobResponse) => {
    setArchiveLoading(true);
    try {
      await jobsApi.archiveJob(job.id);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'CANCELLED' } : j));
    } catch {
      /* silently fail — user sees no change */
    } finally {
      setArchiveLoading(false);
      setArchiveConfirmJob(null);
    }
  };

  const activeJobs = jobs.filter(j => j.status !== 'CANCELLED');
  const filtered = activeJobs
    .filter(j => statusFilter === 'ALL' || j.status === statusFilter)
    .filter(j => visibilityFilter === 'ALL' || j.visibility === visibilityFilter)
    .filter(j => !search || j.title.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── Action buttons builder ──────────────────────────────────
  const buildActions = (job: JobResponse, compact = false) => {
    const isInviteOnly = job.visibility === 'INVITE_ONLY';
    const canEdit    = job.status === 'OPEN' || job.status === 'DRAFT';
    const canArchive = job.status === 'OPEN' || job.status === 'DRAFT';
    const px = compact ? 'px-2.5' : 'px-3';

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {job.status === 'OPEN' && <>
          <button onClick={() => navigate(`/client/jobs/${job.id}/bids`)}
            className={`bg-secondary text-white ${px} py-1.5 rounded-lg text-xs font-semibold hover:brightness-110 transition-all whitespace-nowrap`}>
            View Bids
          </button>
          <button onClick={() => navigate(`/jobs/${job.id}`)}
            className={`border border-slate-200 text-slate-600 ${px} py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors`}>
            Details
          </button>
          {isInviteOnly && <>
            <button onClick={() => setInviteJob(job)}
              className={`border border-slate-200 text-slate-600 ${px} py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1`}>
              <span className="material-symbols-outlined text-[13px]">person_add</span>Invite
            </button>
            <button onClick={() => setInviteesJob(job)} title="Invitees"
              className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-on-surface hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-[16px]">group</span>
            </button>
          </>}
        </>}
        {job.status === 'ASSIGNED' && <>
          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200">Hired</span>
          <button onClick={() => navigate('/contracts')}
            className={`border border-slate-200 text-slate-600 ${px} py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors`}>
            Manage
          </button>
          {isInviteOnly && (
            <button onClick={() => setInviteesJob(job)} title="Invitees"
              className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-on-surface hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-[16px]">group</span>
            </button>
          )}
        </>}
        {job.status === 'COMPLETED' && (
          <button onClick={() => navigate(`/jobs/${job.id}`)}
            className={`border border-secondary text-secondary ${px} py-1.5 rounded-lg text-xs font-semibold hover:bg-secondary hover:text-white transition-all`}>
            Details
          </button>
        )}
        {job.status === 'DRAFT' && (
          <button onClick={() => navigate(`/jobs/${job.id}`)}
            className={`border border-slate-200 text-slate-600 ${px} py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors`}>
            Details
          </button>
        )}
        {canEdit && (
          <button onClick={() => setEditJob(job)} title="Edit job"
            className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-secondary hover:border-secondary/40 transition-colors">
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        )}
        {canArchive && (
          <button onClick={() => setArchiveConfirmJob(job)} title="Archive job"
            className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors">
            <span className="material-symbols-outlined text-[16px]">archive</span>
          </button>
        )}
      </div>
    );
  };

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
        {/* Sidebar */}
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
          <nav className="flex-1 min-h-0 py-2 px-2 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map(({ icon, label, active, path }) => (
              <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
                className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-white/10 text-white font-bold border-l-4 border-secondary' : path ? 'text-white/60 hover:bg-white/10 hover:text-white font-medium' : 'text-white/30 cursor-default font-medium'].join(' ')}>
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

        {/* Main */}
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col bg-surface">
          <div className="flex-1 p-6 pb-24 lg:pb-8 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-h2 font-bold text-on-surface">My Jobs</h1>
                <p className="text-sm text-on-surface-variant mt-0.5">Manage all jobs you've posted on BidForge.</p>
              </div>
              <button onClick={() => navigate('/client/post-job')}
                className="flex items-center gap-2 px-6 h-12 bg-secondary text-white font-semibold rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex-shrink-0">
                <span className="material-symbols-outlined">add</span>Post a New Job
              </button>
            </div>

            {/* Filters */}
            <div className="tonal-card rounded-xl p-4 space-y-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                  placeholder="Search by job title…"
                  className="w-full pl-9 pr-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors bg-white" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex gap-1 flex-wrap flex-1">
                  {STATUS_TABS.map(tab => (
                    <button key={tab} onClick={() => handleFilterChange(setStatusFilter)(tab)}
                      className={['px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', statusFilter === tab ? 'bg-secondary text-white shadow-sm' : 'bg-white border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
                      {tab === 'ALL' ? `All (${activeJobs.length})` : `${STATUS_CFG[tab]?.label ?? tab} (${activeJobs.filter(j => j.status === tab).length})`}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 flex-wrap flex-shrink-0">
                  {(['ALL', 'PUBLIC', 'INVITE_ONLY'] as const).map(v => (
                    <button key={v} onClick={() => handleFilterChange(setVisibilityFilter)(v)}
                      className={['px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1', visibilityFilter === v ? 'bg-secondary text-white shadow-sm' : 'bg-white border border-outline-variant text-on-surface-variant hover:border-secondary/40'].join(' ')}>
                      {v !== 'ALL' && <span className="material-symbols-outlined text-[13px]">{v === 'PUBLIC' ? 'public' : 'lock'}</span>}
                      {v === 'ALL' ? 'All Visibility' : v === 'PUBLIC' ? 'Public' : 'Invite Only'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toolbar: count + view toggle */}
            {!loading && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-on-surface-variant">
                  Showing <span className="font-semibold text-on-surface">{paginated.length}</span> of{' '}
                  <span className="font-semibold text-on-surface">{filtered.length}</span> active jobs
                </p>
                <div className="hidden lg:flex items-center gap-0.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
                  <button onClick={() => setViewMode('list')} title="List view"
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                    <span className="material-symbols-outlined text-[16px]">view_list</span>
                    <span className="text-xs font-semibold">List</span>
                  </button>
                  <button onClick={() => setViewMode('grid')} title="Grid view"
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                    <span className="material-symbols-outlined text-[16px]">grid_view</span>
                    <span className="text-xs font-semibold">Grid</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Content ── */}
            {loading ? (
              <PageLoader message="Loading your jobs…" />
            ) : filtered.length === 0 ? (
              <div className="tonal-card rounded-xl flex flex-col items-center gap-4 py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">work_off</span>
                <p className="text-on-surface font-semibold">No jobs found</p>
                <p className="text-sm text-on-surface-variant max-w-xs">
                  {activeJobs.length === 0
                    ? "You haven't posted any jobs yet. Post your first job to start receiving bids."
                    : 'No jobs match your current filters.'}
                </p>
                {activeJobs.length === 0 ? (
                  <button onClick={() => navigate('/client/post-job')}
                    className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">Post a Job</button>
                ) : (
                  <button onClick={() => { setStatusFilter('ALL'); setVisibilityFilter('ALL'); setSearch(''); setPage(0); }}
                    className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">Clear Filters</button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'list' ? (
                  /* ── LIST VIEW ── */
                  <div className="space-y-3">
                    {paginated.map(job => {
                      const st = STATUS_CFG[job.status] ?? { label: job.status, cls: 'bg-slate-100 text-slate-600' };
                      const isInviteOnly = job.visibility === 'INVITE_ONLY';
                      const skills = parseSkills(job.requiredSkills);
                      return (
                        <article key={job.id} className="group bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-secondary/30 transition-all relative overflow-hidden">
                          {/* Left accent bar */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${ST_TOP[job.status] ?? 'bg-slate-300'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                          <div className="flex flex-col md:flex-row justify-between gap-4 p-5">
                            {/* Left: info */}
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${st.cls}`}>{st.label}</span>
                                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold ${isInviteOnly ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                  <span className="material-symbols-outlined text-[10px]">{isInviteOnly ? 'lock' : 'public'}</span>
                                  {isInviteOnly ? 'Invite Only' : 'Public'}
                                </span>
                                <span className="text-xs text-on-surface-variant">{job.category}</span>
                              </div>
                              <h3 className="text-sm font-bold text-on-surface group-hover:text-secondary transition-colors leading-snug">{job.title}</h3>
                              <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                                {(job.status === 'OPEN' || job.status === 'ASSIGNED') && (
                                  <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                                    <span className="material-symbols-outlined text-[13px]">gavel</span>
                                    <strong className="text-on-surface">{job.bidsCount ?? 0}</strong> bids
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                                  <span className="material-symbols-outlined text-[13px]">payments</span>
                                  <strong className="text-on-surface">{formatBudget(job.budgetMin, job.budgetMax, job.budgetType)}</strong>
                                </span>
                                <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                                  <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                  {formatDate(job.createdAt)}
                                </span>
                                {job.status === 'ASSIGNED' && job.assignedFreelancerName && (
                                  <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                                    <span className="material-symbols-outlined text-[13px]">person</span>
                                    {job.assignedFreelancerName}
                                  </span>
                                )}
                              </div>
                              {skills.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {skills.slice(0, 4).map(s => (
                                    <span key={s} className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-500">{s}</span>
                                  ))}
                                  {skills.length > 4 && <span className="text-[11px] text-slate-400">+{skills.length - 4}</span>}
                                </div>
                              )}
                            </div>
                            {/* Right: actions */}
                            <div className="flex flex-col justify-center items-stretch gap-2 flex-shrink-0 md:min-w-[148px]">
                              {buildActions(job)}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  /* ── GRID VIEW ── */
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginated.map(job => {
                    const st = STATUS_CFG[job.status] ?? { label: job.status, cls: 'bg-slate-100 text-slate-600' };
                    const isInviteOnly = job.visibility === 'INVITE_ONLY';
                    const skills = parseSkills(job.requiredSkills);
                    return (
                      <article key={job.id} className="group tonal-card rounded-xl overflow-hidden transition-all hover:shadow-md flex flex-col">
                        <div className={`h-[3px] ${ST_TOP[job.status] ?? 'bg-slate-300'}`} />
                        <div className="px-4 pt-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${isInviteOnly ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                              <span className="material-symbols-outlined text-[11px]">{isInviteOnly ? 'lock' : 'public'}</span>
                              {isInviteOnly ? 'Invite Only' : 'Public'}
                            </span>
                          </div>
                          <h3 className="text-[14px] font-bold text-on-surface leading-snug line-clamp-2">{job.title}</h3>
                          <p className="text-[11px] text-on-surface-variant mt-0.5 font-medium">{job.category}</p>
                        </div>
                        <div className="px-4 py-3 flex-1 flex flex-col gap-3">
                          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">{job.description}</p>
                          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Budget</p>
                            <p className="text-sm font-bold text-secondary">{formatBudget(job.budgetMin, job.budgetMax, job.budgetType)}</p>
                          </div>
                          <div className="space-y-1.5 text-xs text-on-surface-variant">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                              {formatDate(job.createdAt)}
                            </div>
                            {(job.status === 'OPEN' || job.status === 'ASSIGNED') && (
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">gavel</span>
                                {job.bidsCount ?? 0} bids received
                              </div>
                            )}
                            {job.status === 'ASSIGNED' && job.assignedFreelancerName && (
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">person</span>
                                {job.assignedFreelancerName}
                              </div>
                            )}
                            {job.deadline && (
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">event</span>
                                Due {formatDate(job.deadline)}
                              </div>
                            )}
                          </div>
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {skills.slice(0, 3).map(s => (
                                <span key={s} className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500">{s}</span>
                              ))}
                              {skills.length > 3 && <span className="text-[11px] text-slate-400">+{skills.length - 3}</span>}
                            </div>
                          )}
                          <div className="flex-1" />
                          <div className="pt-3 border-t border-slate-100">
                            {buildActions(job, true)}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                    <p className="text-sm text-on-surface-variant">
                      Page <span className="font-semibold text-on-surface">{page + 1}</span> of{' '}
                      <span className="font-semibold text-on-surface">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-1">
                      <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                        className="w-9 h-9 flex items-center justify-center border border-outline-variant rounded-lg text-on-surface-variant hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                      </button>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let p: number;
                        if (totalPages <= 7) { p = i; }
                        else if (page < 4) { p = i < 5 ? i : i === 5 ? -1 : totalPages - 1; }
                        else if (page >= totalPages - 4) { p = i === 0 ? 0 : i === 1 ? -1 : totalPages - 7 + i; }
                        else { p = i === 0 ? 0 : i === 1 ? -1 : i === 5 ? -1 : i === 6 ? totalPages - 1 : page - 2 + (i - 2); }
                        if (p === -1) return <span key={`e-${i}`} className="w-9 text-center text-on-surface-variant text-sm">…</span>;
                        return (
                          <button key={p} onClick={() => setPage(p)}
                            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-secondary text-white' : 'border border-outline-variant text-on-surface-variant hover:border-secondary/40'}`}>
                            {p + 1}
                          </button>
                        );
                      })}
                      <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                        className="w-9 h-9 flex items-center justify-center border border-outline-variant rounded-lg text-on-surface-variant hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
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

      {/* Modals */}
      {inviteJob    && <InviteModal job={inviteJob} onClose={() => setInviteJob(null)} />}
      {inviteesJob  && <InviteesModal job={inviteesJob} onClose={() => setInviteesJob(null)} />}
      {editJob      && <EditJobModal job={editJob} onClose={() => setEditJob(null)} onSaved={handleJobUpdated} />}

      {/* Archive confirmation */}
      {archiveConfirmJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !archiveLoading && setArchiveConfirmJob(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-red-500 text-[20px]">archive</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Archive this job?</h3>
                <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                  <span className="font-medium text-on-surface">"{archiveConfirmJob.title}"</span> will be removed from active listings and moved to your archives.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setArchiveConfirmJob(null)} disabled={archiveLoading}
                className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-slate-50 transition-colors disabled:opacity-60">
                Cancel
              </button>
              <button onClick={() => handleArchive(archiveConfirmJob)} disabled={archiveLoading}
                className="flex-1 py-2.5 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60">
                {archiveLoading ? 'Archiving…' : 'Archive Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
