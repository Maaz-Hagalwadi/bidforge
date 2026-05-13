import { useTheme } from '@/context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, FREELANCER_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { notificationPreferencesApi } from '@/api/notificationPreferences';
import { aiApi, type ProfileSuggestions } from '@/api/ai';
import { userApi } from '@/api/user';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import { MobileNavDrawer } from '@/components/MobileNavDrawer';
import { DEFAULT_PREFERENCES, type NotificationPreferenceDto } from '@/types/notificationPreferences';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const PREF_GROUPS = [
  {
    label: 'Jobs',
    icon: 'work',
    items: [
      { key: 'jobCreated' as const,  label: 'Job posted',       desc: 'When you successfully post a new job' },
      { key: 'jobInvited' as const,  label: 'Job invitation',   desc: 'When a client invites you to a job' },
    ],
  },
  {
    label: 'Bids',
    icon: 'gavel',
    items: [
      { key: 'bidPlaced'    as const, label: 'Bid received',     desc: 'When a freelancer bids on your job' },
      { key: 'bidAccepted'  as const, label: 'Bid accepted',     desc: 'When your bid is accepted by a client' },
      { key: 'bidRejected'  as const, label: 'Bid declined',     desc: 'When your bid is declined' },
    ],
  },
  {
    label: 'Contracts',
    icon: 'receipt_long',
    items: [
      { key: 'contractCreated'   as const, label: 'Contract created',    desc: 'When a new contract is started' },
      { key: 'contractSubmitted' as const, label: 'Work submitted',      desc: 'When freelancer submits work' },
      { key: 'contractCompleted' as const, label: 'Contract completed',  desc: 'When a contract is marked complete' },
      { key: 'revisionRequested' as const, label: 'Revision requested',  desc: 'When client requests a revision' },
    ],
  },
  {
    label: 'Milestones',
    icon: 'flag',
    items: [
      { key: 'milestoneCreated'   as const, label: 'Milestone created',    desc: 'When a new milestone is added' },
      { key: 'milestoneFunded'    as const, label: 'Milestone funded',     desc: 'When escrow payment is locked in' },
      { key: 'milestoneSubmitted' as const, label: 'Milestone submitted',  desc: 'When work is submitted for a milestone' },
      { key: 'milestoneApproved'  as const, label: 'Milestone approved',   desc: 'When your milestone work is approved' },
      { key: 'milestoneRejected'  as const, label: 'Milestone rejected',   desc: 'When your milestone is rejected' },
      { key: 'milestoneRefunded'  as const, label: 'Milestone refunded',   desc: 'When a milestone payment is refunded' },
    ],
  },
  {
    label: 'Payments',
    icon: 'payments',
    items: [
      { key: 'paymentReleased' as const, label: 'Payment released', desc: 'When payment is released from escrow' },
    ],
  },
  {
    label: 'Reviews',
    icon: 'star',
    items: [
      { key: 'reviewReceived' as const, label: 'Review received', desc: 'When someone leaves you a review' },
    ],
  },
];

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const sidebarLinks = withActive(
    user?.role === 'FREELANCER' ? FREELANCER_SIDEBAR : CLIENT_SIDEBAR,
    pathname
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPreferenceDto>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ProfileSuggestions | null>(null);
  const [applyingField, setApplyingField] = useState<string | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationPreferencesApi.getPreferences()
      .then(setPrefs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await notificationPreferencesApi.updatePreferences(prefs);
      setPrefs(updated);
      setToast({ message: 'Notification preferences saved.' });
    } catch {
      setToast({ message: 'Failed to save preferences. Please try again.', error: true });
    } finally { setSaving(false); }
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
          className={['hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-slate-200 dark:border-white/10 transition-[width] duration-300 ease-in-out overflow-hidden', sidebarOpen ? 'w-64' : 'w-16'].join(' ')}
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
            <div>
              <h1 className="text-h2 font-bold text-on-surface">Settings</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">Manage your account and notification preferences.</p>
            </div>

            {/* Account Card */}
            <div className="tonal-card rounded-xl border border-outline-variant p-6">
              <h2 className="text-base font-bold text-on-surface mb-4">Account</h2>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-white text-xl font-bold select-none flex-shrink-0">
                  {initials}
                </div>
                <div>
                  <p className="font-semibold text-on-surface">{user?.name}</p>
                  <p className="text-sm text-on-surface-variant">{user?.email}</p>
                  <span className="mt-1 inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-secondary/10 text-secondary">
                    {user?.role === 'CLIENT' ? 'Client' : 'Freelancer'}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Profile Optimizer */}
            <div className="tonal-card rounded-xl border border-secondary/20 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">auto_awesome</span>
                    AI Profile Optimizer
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-0.5">Get AI-powered suggestions to improve your profile visibility.</p>
                </div>
                <button onClick={async () => {
                  setAiAnalyzing(true); setAiSuggestions(null);
                  try { setAiSuggestions(await aiApi.optimizeProfile()); }
                  catch { setToast({ message: 'AI analysis failed. Please try again.', error: true }); }
                  finally { setAiAnalyzing(false); }
                }} disabled={aiAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-white text-sm font-bold rounded-lg hover:brightness-110 disabled:opacity-60 transition-all flex-shrink-0">
                  {aiAnalyzing
                    ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Analyzing…</>
                    : <><span className="material-symbols-outlined text-[16px]">auto_awesome</span>Analyze Profile</>
                  }
                </button>
              </div>

              {aiSuggestions && (
                <div className="space-y-4 pt-2 border-t border-outline-variant">
                  {/* Score */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-on-surface">Profile Score</span>
                      <span className="text-sm font-bold text-secondary">{aiSuggestions.overallScore}/100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-secondary h-2 rounded-full transition-all duration-700" style={{ width: `${aiSuggestions.overallScore}%` }} />
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="flex items-start gap-2 bg-secondary/5 border border-secondary/20 rounded-lg px-4 py-3">
                    <span className="material-symbols-outlined text-secondary text-[18px] flex-shrink-0 mt-0.5">info</span>
                    <p className="text-sm text-on-surface">{aiSuggestions.feedback}</p>
                  </div>

                  {/* Title Suggestion */}
                  <div className="flex items-start justify-between gap-3 p-3 bg-white border border-outline-variant rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Suggested Title</p>
                      <p className="text-sm text-on-surface">{aiSuggestions.titleSuggestion}</p>
                    </div>
                    <button onClick={async () => {
                      setApplyingField('title');
                      try { await userApi.updateMe({ title: aiSuggestions.titleSuggestion }); await refreshUser(); setToast({ message: 'Title updated!' }); }
                      catch { setToast({ message: 'Failed to apply. Try again.', error: true }); }
                      finally { setApplyingField(null); }
                    }} disabled={applyingField === 'title'}
                      className="text-xs font-bold text-secondary hover:underline flex-shrink-0 disabled:opacity-60">
                      {applyingField === 'title' ? 'Applying…' : 'Apply'}
                    </button>
                  </div>

                  {/* Bio Suggestion */}
                  <div className="flex items-start justify-between gap-3 p-3 bg-white border border-outline-variant rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Improved Bio</p>
                      <p className="text-sm text-on-surface">{aiSuggestions.bioRewrite}</p>
                    </div>
                    <button onClick={async () => {
                      setApplyingField('bio');
                      try { await userApi.updateMe({ bio: aiSuggestions.bioRewrite }); await refreshUser(); setToast({ message: 'Bio updated!' }); }
                      catch { setToast({ message: 'Failed to apply. Try again.', error: true }); }
                      finally { setApplyingField(null); }
                    }} disabled={applyingField === 'bio'}
                      className="text-xs font-bold text-secondary hover:underline flex-shrink-0 disabled:opacity-60">
                      {applyingField === 'bio' ? 'Applying…' : 'Apply'}
                    </button>
                  </div>

                  {/* Skills to Add */}
                  {aiSuggestions.skillsToAdd.length > 0 && (
                    <div className="p-3 bg-white border border-outline-variant rounded-lg">
                      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Skills to Add</p>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.skillsToAdd.map(skill => (
                          <span key={skill} className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded-full">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notification Preferences Card */}
            <div className="tonal-card rounded-xl border border-outline-variant p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-base font-bold text-on-surface">Notification Preferences</h2>
                  <p className="text-sm text-on-surface-variant mt-0.5">Choose which notifications you want to receive.</p>
                </div>
                {!loading && (() => {
                  const allKeys = PREF_GROUPS.flatMap(g => g.items.map(i => i.key));
                  const allOff = allKeys.every(k => !prefs[k]);
                  return (
                    <button
                      onClick={() => {
                        const val = allOff;
                        setPrefs(p => ({ ...p, ...Object.fromEntries(allKeys.map(k => [k, val])) }) as typeof p);
                      }}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${allOff ? 'border-secondary text-secondary hover:bg-secondary/5' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{allOff ? 'notifications' : 'notifications_off'}</span>
                      {allOff ? 'Enable All' : 'Disable All'}
                    </button>
                  );
                })()}
              </div>

              {loading ? (
                <PageLoader message="Loading preferences…" />
              ) : (
                <div className="space-y-6">
                  {PREF_GROUPS.map(group => (
                    <div key={group.label}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-[18px] text-secondary">{group.icon}</span>
                        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">{group.label}</h3>
                      </div>
                      <div className="space-y-0 rounded-xl border border-outline-variant overflow-hidden">
                        {group.items.map((item, idx) => (
                          <div
                            key={item.key}
                            className={`flex items-center justify-between px-4 py-3 bg-surface-container ${idx < group.items.length - 1 ? 'border-b border-outline-variant' : ''}`}
                          >
                            <div className="min-w-0 pr-4">
                              <p className="text-sm font-medium text-on-surface">{item.label}</p>
                              <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                            </div>
                            <button
                              role="switch"
                              aria-checked={prefs[item.key]}
                              onClick={() => setPrefs(p => ({ ...p, [item.key]: !p[item.key] }))}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${prefs[item.key] ? 'bg-secondary' : 'bg-slate-200'}`}
                            >
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${prefs[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                    <p className="text-xs text-on-surface-variant">Changes take effect immediately after saving.</p>
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      {saving ? 'Saving…' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <Footer />
        </main>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.error ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          <span className="material-symbols-outlined text-[18px]">{toast.error ? 'error' : 'check_circle'}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
