import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '@/api/user';
import { useAuth } from '@/context/AuthContext';

type Step = 'welcome' | 'profile' | 'done';

interface Props {
  role: 'CLIENT' | 'FREELANCER';
  onComplete: () => void;
}

export function OnboardingWizard({ role, onComplete }: Props) {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const isFreelancer = role === 'FREELANCER';

  const [step, setStep] = useState<Step>('welcome');
  const [form, setForm] = useState({
    title: user?.title ?? '',
    bio: user?.bio ?? '',
    skills: user?.skills ?? '',
    hourlyRate: user?.hourlyRate != null ? String(user.hourlyRate) : '',
    location: user?.location ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSaveProfile = async () => {
    if (!form.title.trim()) { setErr('Please add a professional title.'); return; }
    setSaving(true); setErr('');
    try {
      await userApi.updateMe({
        title: form.title.trim(),
        bio: form.bio.trim() || undefined,
        skills: form.skills.trim() || undefined,
        location: form.location.trim() || undefined,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
      });
      await refreshUser();
      setStep('done');
    } catch {
      setErr('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = (action: 'primary' | 'skip') => {
    onComplete();
    if (action === 'primary') {
      navigate(isFreelancer ? '/browse' : '/client/post-job');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div className="h-1 bg-secondary transition-all duration-500"
            style={{ width: step === 'welcome' ? '33%' : step === 'profile' ? '66%' : '100%' }} />
        </div>

        {/* Welcome step */}
        {step === 'welcome' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-secondary text-[32px]">waving_hand</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to BidForge!</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              {isFreelancer
                ? "Let's get your profile ready so clients can find you and you can start winning projects."
                : "Let's get you set up so you can start posting jobs and finding great talent."}
            </p>

            <div className="flex flex-col gap-3 text-left mb-8">
              {[
                { icon: 'person', label: 'Complete your profile', done: false },
                { icon: isFreelancer ? 'search' : 'work', label: isFreelancer ? 'Browse open jobs' : 'Post your first job', done: false },
                { icon: 'handshake', label: 'Start collaborating', done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-secondary text-[18px]">{item.icon}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-slate-400">Step {i + 1}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('profile')}
                className="flex-1 bg-secondary text-white font-semibold py-3 rounded-xl hover:brightness-110 transition-all">
                Get Started
              </button>
              <button onClick={() => handleFinish('skip')}
                className="px-5 py-3 text-slate-500 text-sm font-semibold hover:text-slate-700 transition-colors">
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Profile step */}
        {step === 'profile' && (
          <div className="p-8">
            <div className="mb-6">
              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Step 1 of 2</p>
              <h2 className="text-xl font-bold text-slate-900">Complete your profile</h2>
              <p className="text-sm text-slate-500 mt-1">
                {isFreelancer ? 'A complete profile gets 3× more responses from clients.' : 'Help freelancers understand who you are.'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Professional Title <span className="text-red-400">*</span>
                </label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                  placeholder={isFreelancer ? 'e.g. Full Stack Developer' : 'e.g. Product Manager'} />
              </div>

              {isFreelancer && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Hourly Rate (USD)</label>
                      <input type="number" min={0} value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                        placeholder="e.g. 50" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Location</label>
                      <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                        placeholder="e.g. New York" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Skills (comma-separated)</label>
                    <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                      placeholder="React, TypeScript, Node.js" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Bio</label>
                <textarea rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
                  placeholder={isFreelancer ? 'Tell clients what you do and how you work…' : 'Tell freelancers about your company or projects…'} />
              </div>

              {err && <p className="text-xs text-red-500">{err}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveProfile} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-secondary text-white font-semibold py-3 rounded-xl hover:brightness-110 disabled:opacity-60 transition-all">
                {saving ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Saving…</> : 'Save & Continue'}
              </button>
              <button onClick={() => setStep('done')}
                className="px-5 py-3 text-slate-500 text-sm font-semibold hover:text-slate-700 transition-colors">
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Done step */}
        {step === 'done' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-emerald-600 text-[32px]">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">You're all set!</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              {isFreelancer
                ? 'Your profile is ready. Start browsing open jobs and place your first bid!'
                : 'Your profile is ready. Post your first job and start finding great talent!'}
            </p>

            <div className="flex flex-col gap-3">
              <button onClick={() => handleFinish('primary')}
                className="flex items-center justify-center gap-2 bg-secondary text-white font-semibold py-3 rounded-xl hover:brightness-110 transition-all">
                <span className="material-symbols-outlined text-[18px]">{isFreelancer ? 'search' : 'add_circle'}</span>
                {isFreelancer ? 'Browse Jobs' : 'Post a Job'}
              </button>
              <button onClick={() => handleFinish('skip')}
                className="text-slate-500 text-sm font-semibold hover:text-slate-700 transition-colors py-2">
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
