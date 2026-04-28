import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { jobsApi } from '@/api/jobs';
import { Navbar } from '@/components/Navbar';
import { BidForgeLogo } from '@/components/ui/BidForgeLogo';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { postJobSchema, type PostJobFormValues } from '@/lib/schemas';

const SIDEBAR_LINKS = [
  { icon: 'dashboard',    label: 'Dashboard',    short: 'Dashboard', active: false, path: '/client/dashboard' },
  { icon: 'work',         label: 'My Jobs',      short: 'My Jobs',   active: false, path: '/client/jobs'      },
  { icon: 'receipt_long', label: 'My Contracts', short: 'Contracts', active: false, path: ''                  },
  { icon: 'chat',         label: 'Messages',     short: 'Messages',  active: false, path: ''                  },
  { icon: 'payments',     label: 'Payments',     short: 'Payments',  active: false, path: ''                  },
];

const SIDEBAR_BG = '#0A192F';

const CATEGORIES = [
  'Software Development',
  'UI/UX Design',
  'Digital Marketing',
  'Data Science',
  'Writing & Content',
  'Video & Animation',
  'Finance & Accounting',
  'Legal',
];

const STEPS = [
  { id: 'job-details',   icon: 'edit_note',   label: 'Job Details'    },
  { id: 'budget-terms',  icon: 'payments',    label: 'Budget & Terms' },
  { id: 'files-skills',  icon: 'attachment',  label: 'Files & Skills' },
];

// ── Helpers ────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── PostJob ────────────────────────────────────────────────────

export default function PostJob() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [budgetType, setBudgetType] = useState<'FIXED' | 'HOURLY'>('FIXED');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [activeStep, setActiveStep] = useState('job-details');

  const profileRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostJobFormValues>({
    resolver: zodResolver(postJobSchema),
    defaultValues: { visibility: 'PUBLIC' },
  });

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Scroll-spy: track active step
  useEffect(() => {
    const sections = STEPS.map(s => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveStep(e.target.id); });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s]);
    setSkillInput('');
  };

  const onSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); }
  };

  const onSubmit = async (values: PostJobFormValues) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      await jobsApi.create({
        title: values.title,
        category: values.category,
        description: values.description,
        requiredSkills: skills.length ? skills.join(', ') : undefined,
        budgetType,
        budgetMin: Number(values.budgetMin),
        budgetMax: Number(values.budgetMax),
        deadline: values.deadline ? `${values.deadline}T00:00:00` : undefined,
        attachmentUrl: values.attachmentUrl || undefined,
        visibility: values.visibility,
        draft: draftRef.current,
      });
      navigate('/client/dashboard');
    } catch {
      setSubmitError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
        {/* ── Sidebar ── */}
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
            {SIDEBAR_LINKS.map(({ icon, label, path }) => (
              <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
                className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150 font-medium', sidebarOpen ? 'px-3' : 'justify-center px-2', path ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
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

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          <div className="flex-1 p-6 pb-24 lg:pb-8 lg:p-8 max-w-[1280px] w-full mx-auto">

            <div className="mb-8">
              <h1 className="text-h1 font-bold text-on-surface mb-1">Post a New Job</h1>
              <p className="text-body-md text-on-surface-variant">Provide the details of your project to start receiving bids from top freelancers.</p>
            </div>

            <div className="grid grid-cols-12 gap-8">

              {/* ── Step navigator ── */}
              <div className="hidden lg:block col-span-2">
                <div className="flex flex-col gap-1 sticky top-24">
                  {STEPS.map(step => {
                    const isActive = activeStep === step.id;
                    return (
                      <a key={step.id} href={`#${step.id}`}
                        className={['flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all', isActive ? 'bg-secondary/10 text-secondary border-l-4 border-secondary' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'].join(' ')}>
                        <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                        <span>{step.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* ── Form ── */}
              <div className="col-span-12 lg:col-span-7">
                {submitError && (
                  <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                    <span className="material-symbols-outlined text-[18px]">error</span>{submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">

                  {/* ─ Job Details ─ */}
                  <section id="job-details" className="tonal-card p-6 rounded-xl space-y-6 scroll-mt-24">
                    <h2 className="text-h3 font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">edit_note</span>Job Details
                    </h2>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Job Title <span className="text-red-500">*</span></label>
                      <input {...register('title')} type="text" placeholder="e.g. Senior React Developer for Fintech Dashboard"
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all" />
                      {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                      <p className="text-xs text-slate-400 mt-1">Keep it clear and descriptive to attract the right talent.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select {...register('category')}
                          className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm appearance-none bg-white focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all">
                          <option value="">Select a category</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none">expand_more</span>
                      </div>
                      {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description <span className="text-red-500">*</span></label>
                      <div className="border border-outline-variant rounded-lg overflow-hidden focus-within:border-secondary focus-within:ring-4 focus-within:ring-secondary/10 transition-all">
                        <div className="flex gap-1 p-2 bg-slate-50 border-b border-outline-variant">
                          {['format_bold','format_italic','format_list_bulleted','link'].map(ic => (
                            <button key={ic} type="button" className="p-1.5 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                              <span className="material-symbols-outlined text-[18px]">{ic}</span>
                            </button>
                          ))}
                        </div>
                        <textarea {...register('description')} rows={6}
                          placeholder="Describe the project scope, deliverables, and expectations..."
                          className="w-full px-4 py-3 text-sm border-none focus:outline-none focus:ring-0 resize-none" />
                      </div>
                      {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                    </div>
                  </section>

                  {/* ─ Budget & Terms ─ */}
                  <section id="budget-terms" className="tonal-card p-6 rounded-xl space-y-6 scroll-mt-24">
                    <h2 className="text-h3 font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">payments</span>Budget &amp; Terms
                    </h2>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Budget Type</label>
                        <div className="flex p-1 bg-slate-100 rounded-lg">
                          {(['FIXED', 'HOURLY'] as const).map(bt => (
                            <button key={bt} type="button" onClick={() => setBudgetType(bt)}
                              className={['flex-1 py-2 rounded-md text-sm font-semibold transition-all', budgetType === bt ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'].join(' ')}>
                              {bt === 'FIXED' ? 'Fixed Price' : 'Hourly Rate'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Budget Range (USD) <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-2">
                          <input {...register('budgetMin')} type="number" min="1" placeholder="Min"
                            className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all" />
                          <span className="text-slate-400 flex-shrink-0">–</span>
                          <input {...register('budgetMax')} type="number" min="1" placeholder="Max"
                            className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all" />
                        </div>
                        {(errors.budgetMin || errors.budgetMax) && (
                          <p className="text-xs text-red-500 mt-1">{errors.budgetMin?.message ?? errors.budgetMax?.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deadline</label>
                      <div className="relative">
                        <input {...register('deadline')} type="date"
                          className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all" />
                        <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none">calendar_today</span>
                      </div>
                    </div>
                  </section>

                  {/* ─ Files & Skills ─ */}
                  <section id="files-skills" className="tonal-card p-6 rounded-xl space-y-6 scroll-mt-24">
                    <h2 className="text-h3 font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">attachment</span>Files &amp; Skills
                    </h2>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Required Skills</label>
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {skills.map(s => (
                            <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary rounded-full text-sm font-medium">
                              {s}
                              <button type="button" onClick={() => setSkills(prev => prev.filter(x => x !== s))}
                                className="hover:text-secondary/60 transition-colors">
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={onSkillKeyDown}
                          type="text" placeholder="Type a skill and press Enter (e.g. React, TypeScript)"
                          className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all pr-20" />
                        <button type="button" onClick={addSkill} disabled={!skillInput.trim()}
                          className="absolute right-2 top-1.5 px-3 py-1 bg-secondary text-white text-xs font-semibold rounded-md hover:brightness-110 disabled:opacity-40 transition-all">
                          Add
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Press Enter or comma to add multiple skills.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Attachment URL</label>
                      <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
                        <span className="material-symbols-outlined text-[40px] text-slate-400 mb-2">cloud_upload</span>
                        <p className="text-sm text-slate-700 font-semibold mb-1">Paste a file URL below</p>
                        <p className="text-xs text-slate-400 mb-3">PDF, DOC, JPG, or ZIP (paste hosted URL)</p>
                        <input {...register('attachmentUrl')} type="url" placeholder="https://example.com/brief.pdf"
                          className="w-full max-w-sm px-4 py-2 border border-outline-variant rounded-lg text-sm bg-white focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all text-center" />
                      </div>
                    </div>
                  </section>

                  {/* ─ Actions ─ */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" disabled={submitting}
                      onClick={() => { draftRef.current = true; handleSubmit(onSubmit)(); }}
                      className="px-6 py-3 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60">
                      {submitting && draftRef.current ? 'Saving…' : 'Save Draft'}
                    </button>
                    <button type="submit" disabled={submitting}
                      onClick={() => { draftRef.current = false; }}
                      className="px-8 py-3 bg-secondary text-white font-bold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-secondary/20">
                      {submitting && !draftRef.current ? 'Posting…' : 'Post Job'}
                    </button>
                  </div>

                </form>
              </div>

              {/* ── Right sidebar: Tips + Visibility ── */}
              <div className="col-span-12 lg:col-span-3 space-y-6">

                {/* Tips card */}
                <div className="rounded-xl p-6 text-white space-y-4" style={{ backgroundColor: '#0A192F' }}>
                  <h3 className="text-lg font-bold">Tips for a Great Post</h3>
                  <ul className="space-y-3">
                    {[
                      { icon: 'verified',        text: 'Be specific about the required technical stack.' },
                      { icon: 'tips_and_updates', text: 'Mention if you need a specific time zone overlap.' },
                      { icon: 'history_edu',      text: 'List deliverables rather than abstract goals.' },
                    ].map(({ icon, text }) => (
                      <li key={icon} className="flex gap-3">
                        <span className="material-symbols-outlined text-secondary text-[20px] flex-shrink-0 mt-0.5">{icon}</span>
                        <p className="text-sm text-white/80 leading-relaxed">{text}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visibility */}
                <div className="tonal-card rounded-xl p-6">
                  <div className="flex items-center gap-2 font-bold text-on-surface mb-4">
                    <span className="material-symbols-outlined text-secondary">visibility</span>
                    <span>Visibility</span>
                  </div>
                  <div className="space-y-3">
                    {([
                      { value: 'PUBLIC',      label: 'Public — All Freelancers' },
                      { value: 'INVITE_ONLY', label: 'Invite Only'              },
                    ] as const).map(opt => (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                        <input {...register('visibility')} type="radio" value={opt.value}
                          className="accent-secondary w-4 h-4" />
                        <span className="text-sm text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.visibility && <p className="text-xs text-red-500 mt-2">{errors.visibility.message}</p>}
                </div>

              </div>
            </div>
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
        {SIDEBAR_LINKS.map(({ icon, short, path }) => (
          <button key={short} onClick={() => path && navigate(path)}
            className={['flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors', path ? 'text-white/50 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
            <span className="text-[10px] font-semibold leading-none">{short}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
