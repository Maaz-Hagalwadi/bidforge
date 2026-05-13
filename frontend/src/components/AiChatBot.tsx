import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiApi, type ChatMessage } from '@/api/ai';
import { jobsApi } from '@/api/jobs';

// ── Constants ─────────────────────────────────────────────────────

const CATEGORIES = [
  'Software Development', 'UI/UX Design', 'Digital Marketing', 'Data Science',
  'Writing & Content', 'Video & Animation', 'Finance & Accounting', 'Legal',
];

const BUDGET_PRESETS = [
  { label: 'Under $500',  min: 100,   max: 500   },
  { label: '$500 – $2k',  min: 500,   max: 2000  },
  { label: '$2k – $10k',  min: 2000,  max: 10000 },
  { label: '$10k+',       min: 10000, max: 50000 },
];

const SKILL_SUGGESTIONS: Record<string, string[]> = {
  'Software Development': ['React', 'Node.js', 'Python', 'TypeScript', 'Java', 'Vue.js', 'AWS', 'Docker'],
  'UI/UX Design':         ['Figma', 'Adobe XD', 'Prototyping', 'User Research', 'Wireframing', 'Sketch'],
  'Digital Marketing':    ['SEO', 'Google Ads', 'Facebook Ads', 'Content Strategy', 'Email Marketing'],
  'Data Science':         ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Data Analysis', 'R'],
  'Writing & Content':    ['Blog Writing', 'Copywriting', 'SEO Writing', 'Technical Writing', 'Proofreading'],
  'Video & Animation':    ['Adobe Premiere', 'After Effects', 'Motion Graphics', '3D Animation'],
  'Finance & Accounting': ['QuickBooks', 'Financial Modeling', 'Tax Planning', 'Bookkeeping'],
  'Legal':                ['Contract Drafting', 'IP Law', 'Corporate Law', 'Legal Research'],
};
const DEFAULT_SKILLS = ['JavaScript', 'Python', 'React', 'Design', 'Writing', 'Analytics'];

// ── Types ─────────────────────────────────────────────────────────

type WizStep = 'title' | 'category' | 'budget' | 'skills' | 'urgency' | 'visibility' | null;

interface Msg {
  role: 'user' | 'bot';
  text: string;
  success?: boolean;
}

const FAQ_ITEMS = [
  { q: 'How to accept a bid?',       a: 'Go to My Jobs → open a job → scroll to Bids → click Accept on the bid you want. A contract is created automatically and the freelancer is notified.' },
  { q: 'How do milestones work?',    a: 'Milestones split your project into paid phases. You create and fund each milestone (held in escrow), then release payment after approving the freelancer\'s submitted work.' },
  { q: 'How to invite freelancers?', a: 'When posting a job, choose "Invite Only" visibility. You can search freelancers by name or email and add them before publishing.' },
  { q: 'How to fund a milestone?',   a: 'Open your contract → find the milestone → click "Fund". Payment is securely held in escrow and only released when you approve the work.' },
  { q: 'How to open a dispute?',     a: 'Go to Contracts → open the contract → click "Open Dispute". Describe the issue and our team will review and help resolve it.' },
  { q: 'How to complete a contract?',a: 'Once the freelancer submits their work, review it and click "Complete Contract". This releases payment and closes the contract.' },
];

const GREETING: Msg = { role: 'bot', text: "Hi! I'm your BidForge AI. I can help you post a job or answer any questions you have." };

// ── Component ─────────────────────────────────────────────────────

export function AiChatBot() {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState<Msg[]>([GREETING]);
  const [input, setInput]     = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // wizard
  const [wizStep, setWizStep]           = useState<WizStep>(null);
  const [wizTitle, setWizTitle]         = useState('');
  const [wizTitleInput, setWizTitleInput] = useState('');
  const [wizCategory, setWizCategory]   = useState('');
  const [wizBudgetMin, setWizBudgetMin] = useState(0);
  const [wizBudgetMax, setWizBudgetMax] = useState(0);
  const [showCustom, setShowCustom]     = useState(false);
  const [customMin, setCustomMin]       = useState('');
  const [customMax, setCustomMax]       = useState('');
  const [wizSkills, setWizSkills]       = useState<string[]>([]);
  const [customSkill, setCustomSkill]   = useState('');
  const [wizUrgency, setWizUrgency]     = useState<'LOW' | 'NORMAL' | 'HIGH' | ''>('');
  const [posting, setPosting]           = useState(false);
  const [helpOpen, setHelpOpen]         = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate  = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open, wizStep]);

  const push = (...m: Msg[]) => setMsgs(prev => [...prev, ...m]);

  const reset = () => {
    setMsgs([GREETING]);
    setInput('');
    setAiLoading(false);
    setWizStep(null);
    setWizTitle('');
    setWizTitleInput('');
    setWizCategory('');
    setWizBudgetMin(0);
    setWizBudgetMax(0);
    setShowCustom(false);
    setCustomMin('');
    setCustomMax('');
    setWizSkills([]);
    setCustomSkill('');
    setWizUrgency('');
    setPosting(false);
    setHelpOpen(false);
  };

  // ── AI Q&A ────────────────────────────────────────────────────

  const sendToAi = async (userText: string) => {
    const history: ChatMessage[] = msgs.map(m => ({ role: m.role === 'user' ? 'user' : 'model', content: m.text }));
    setAiLoading(true);
    try {
      const res = await aiApi.chat(userText, history);
      push({ role: 'bot', text: res.reply });
    } catch {
      push({ role: 'bot', text: "Sorry, I couldn't get an answer right now. Please try again." });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || aiLoading) return;
    setInput('');
    push({ role: 'user', text });
    await sendToAi(text);
  };

  // ── Wizard helpers ────────────────────────────────────────────

  const startWizard = () => {
    push(
      { role: 'user', text: 'Post a Job' },
      { role: 'bot', text: "What's the job title?" },
    );
    setWizStep('title');
  };

  const submitTitle = () => {
    const t = wizTitleInput.trim();
    if (!t) return;
    setWizTitle(t);
    setWizTitleInput('');
    push({ role: 'user', text: t }, { role: 'bot', text: 'Which category fits best?' });
    setWizStep('category');
  };

  const pickCategory = (cat: string) => {
    setWizCategory(cat);
    push({ role: 'user', text: cat }, { role: 'bot', text: "What's your budget range?" });
    setWizStep('budget');
  };

  const applyBudget = (label: string, min: number, max: number) => {
    setWizBudgetMin(min);
    setWizBudgetMax(max);
    setShowCustom(false);
    setCustomMin('');
    setCustomMax('');
    push({ role: 'user', text: label }, { role: 'bot', text: 'Which skills are required?' });
    setWizStep('skills');
  };

  const applyCustomBudget = () => {
    const mn = Number(customMin), mx = Number(customMax);
    if (!mn || !mx || mn >= mx) return;
    applyBudget(`$${mn.toLocaleString()} – $${mx.toLocaleString()}`, mn, mx);
  };

  const toggleSkill = (s: string) =>
    setWizSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const addCustomSkill = () => {
    const s = customSkill.trim();
    if (s && !wizSkills.includes(s)) setWizSkills(prev => [...prev, s]);
    setCustomSkill('');
  };

  const pickUrgency = (level: 'LOW' | 'NORMAL' | 'HIGH', label: string) => {
    setWizUrgency(level);
    push({ role: 'user', text: label }, { role: 'bot', text: 'Who can see this job?' });
    setWizStep('visibility');
  };

  const postJob = async (visibility: 'PUBLIC' | 'INVITE_ONLY') => {
    setPosting(true);
    setWizStep(null);
    push(
      { role: 'user', text: visibility === 'PUBLIC' ? 'Public' : 'Invite Only' },
      { role: 'bot', text: 'Posting your job…' },
    );
    try {
      const desc = await aiApi.generateDescription({
        title: wizTitle,
        notes: wizSkills.length ? `Skills: ${wizSkills.join(', ')}` : '',
        category: wizCategory,
      });
      const job = await jobsApi.create({
        title: wizTitle,
        category: wizCategory,
        description: desc.description,
        requiredSkills: wizSkills.length ? wizSkills.join(', ') : undefined,
        budgetType: 'FIXED',
        budgetMin: wizBudgetMin,
        budgetMax: wizBudgetMax,
        visibility,
        experienceLevel: 'INTERMEDIATE',
        urgencyLevel: wizUrgency || 'NORMAL',
        draft: false,
      });
      push({ role: 'bot', text: `"${job.title}" is live! Redirecting to your jobs…`, success: true });
      setTimeout(() => { navigate('/client/jobs'); setOpen(false); }, 2000);
    } catch {
      push({ role: 'bot', text: 'Something went wrong. Please try again.' });
    } finally {
      setPosting(false);
    }
  };

  // ── Wizard panels (shown below the last bot message) ──────────

  const renderOptions = () => {
    if (wizStep === 'title') return (
      <div className="flex gap-2 mt-2 pl-9">
        <input value={wizTitleInput} onChange={e => setWizTitleInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submitTitle(); }}
          placeholder="e.g. React developer for fintech app" autoFocus
          className="flex-1 px-3 py-2 border border-secondary/30 rounded-xl text-sm focus:outline-none focus:border-secondary bg-white" />
        <button onClick={submitTitle} disabled={!wizTitleInput.trim()}
          className="px-3 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:brightness-110 disabled:opacity-40 transition-all">
          Next
        </button>
      </div>
    );

    if (wizStep === 'category') return (
      <div className="flex flex-wrap gap-1.5 mt-2 pl-9">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => pickCategory(c)}
            className="px-3 py-1.5 text-xs font-medium bg-white border border-secondary/30 text-slate-700 rounded-full hover:bg-secondary hover:text-white hover:border-secondary transition-all">
            {c}
          </button>
        ))}
      </div>
    );

    if (wizStep === 'budget') return (
      <div className="mt-2 pl-9 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {BUDGET_PRESETS.map(o => (
            <button key={o.label} onClick={() => applyBudget(o.label, o.min, o.max)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-secondary/30 text-slate-700 rounded-full hover:bg-secondary hover:text-white hover:border-secondary transition-all">
              {o.label}
            </button>
          ))}
          <button onClick={() => setShowCustom(v => !v)}
            className={`px-3 py-1.5 text-xs font-semibold border rounded-full transition-all ${showCustom ? 'bg-secondary text-white border-secondary' : 'bg-white border-secondary/30 text-slate-700 hover:border-secondary hover:text-secondary'}`}>
            Custom
          </button>
        </div>
        {showCustom && (
          <div className="flex items-center gap-2">
            <input type="number" min="1" placeholder="Min $" value={customMin}
              onChange={e => setCustomMin(e.target.value)}
              className="w-24 px-2.5 py-1.5 border border-secondary/30 rounded-lg text-xs focus:outline-none focus:border-secondary bg-white" />
            <span className="text-slate-400 text-xs">–</span>
            <input type="number" min="1" placeholder="Max $" value={customMax}
              onChange={e => setCustomMax(e.target.value)}
              className="w-24 px-2.5 py-1.5 border border-secondary/30 rounded-lg text-xs focus:outline-none focus:border-secondary bg-white" />
            <button onClick={applyCustomBudget}
              disabled={!customMin || !customMax || Number(customMin) >= Number(customMax)}
              className="px-3 py-1.5 bg-secondary text-white text-xs font-bold rounded-lg hover:brightness-110 disabled:opacity-40 transition-all">
              Set
            </button>
          </div>
        )}
      </div>
    );

    if (wizStep === 'skills') {
      const sug = SKILL_SUGGESTIONS[wizCategory] ?? DEFAULT_SKILLS;
      return (
        <div className="mt-2 pl-9 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {sug.map(s => (
              <button key={s} onClick={() => toggleSkill(s)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${wizSkills.includes(s) ? 'bg-secondary text-white border-secondary' : 'bg-white border-secondary/30 text-slate-600 hover:border-secondary hover:text-secondary'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={customSkill} onChange={e => setCustomSkill(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
              placeholder="Add custom skill…"
              className="flex-1 px-2.5 py-1.5 border border-secondary/30 rounded-lg text-xs focus:outline-none focus:border-secondary bg-white" />
            <button onClick={addCustomSkill} disabled={!customSkill.trim()}
              className="px-2.5 py-1.5 bg-secondary/10 text-secondary text-xs font-semibold rounded-lg hover:bg-secondary/20 disabled:opacity-40 transition-colors">
              Add
            </button>
          </div>
          <button
            onClick={() => { push({ role: 'bot', text: 'How urgent is this job?' }); setWizStep('urgency'); }}
            className="w-full py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all">
            Next →
          </button>
        </div>
      );
    }

    if (wizStep === 'urgency') return (
      <div className="mt-2 pl-9">
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'LOW'    as const, icon: 'schedule',      label: 'Low',    desc: 'No rush'   },
            { value: 'NORMAL' as const, icon: 'timer',         label: 'Normal', desc: 'Standard'  },
            { value: 'HIGH'   as const, icon: 'priority_high', label: 'Urgent', desc: 'Hire fast' },
          ]).map(o => (
            <button key={o.value} onClick={() => pickUrgency(o.value, o.label)}
              className="flex flex-col items-center gap-1 p-3 bg-white border border-secondary/30 rounded-xl hover:bg-secondary hover:text-white hover:border-secondary text-slate-700 transition-all">
              <span className="material-symbols-outlined text-[18px]">{o.icon}</span>
              <span className="text-xs font-bold">{o.label}</span>
              <span className="text-[10px] opacity-60">{o.desc}</span>
            </button>
          ))}
        </div>
      </div>
    );

    if (wizStep === 'visibility') return (
      <div className="mt-2 pl-9">
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'PUBLIC'      as const, icon: 'public', label: 'Public',      desc: 'All freelancers' },
            { value: 'INVITE_ONLY' as const, icon: 'lock',   label: 'Invite Only', desc: 'Selected only'   },
          ]).map(o => (
            <button key={o.value} onClick={() => postJob(o.value)} disabled={posting}
              className="flex flex-col items-center gap-1 p-3 bg-white border border-secondary/30 rounded-xl hover:bg-secondary hover:text-white hover:border-secondary text-slate-700 transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">{o.icon}</span>
              <span className="text-xs font-bold">{o.label}</span>
              <span className="text-[10px] opacity-60">{o.desc}</span>
            </button>
          ))}
        </div>
      </div>
    );

    if (posting) return (
      <div className="mt-2 pl-9 flex items-center gap-2 text-xs text-slate-500">
        <span className="material-symbols-outlined text-[15px] animate-spin text-secondary">progress_activity</span>
        Generating description and posting…
      </div>
    );

    return null;
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-secondary text-white rounded-full shadow-2xl flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
        aria-label="Open AI Assistant"
      >
        <span className="material-symbols-outlined text-[24px]">{open ? 'close' : 'auto_awesome'}</span>
        {!open && msgs.length > 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[370px] max-h-[580px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant"
          style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0A192F] text-white flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-none">BidForge AI</p>
              <p className="text-[11px] text-white/60 mt-0.5">Client Assistant</p>
            </div>
            <button onClick={reset} title="Start over" className="p-1 text-white/60 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            </button>
            <button onClick={() => setOpen(false)} className="p-1 text-white/60 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {msgs.map((m, i) => {
              const isLast = i === msgs.length - 1;
              return (
                <div key={i}>
                  <div className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'bot' && (
                      <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className={`material-symbols-outlined text-[15px] ${m.success ? 'text-green-500' : 'text-secondary'}`}
                          style={m.success ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                          {m.success ? 'check_circle' : 'auto_awesome'}
                        </span>
                      </div>
                    )}
                    <div className={`max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-secondary text-white rounded-tr-sm'
                        : m.success
                          ? 'bg-green-50 text-green-800 border border-green-200 rounded-tl-sm'
                          : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                  {/* Wizard options below the last bot message */}
                  {m.role === 'bot' && isLast && renderOptions()}
                </div>
              );
            })}

            {/* AI loading dots */}
            {aiLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary text-[15px]">auto_awesome</span>
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                  {[0.1, 0.2, 0.35].map(d => (
                    <span key={d} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick actions + help — only at start */}
          {wizStep === null && !posting && msgs.length <= 2 && (
            <div className="px-4 pb-2 flex-shrink-0 space-y-2">
              {/* Action chips */}
              <div className="flex gap-2">
                <button onClick={startWizard}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary text-white rounded-full text-xs font-semibold hover:brightness-110 transition-all">
                  <span className="material-symbols-outlined text-[14px]">work</span>
                  Post a Job
                </button>
                <button onClick={() => setHelpOpen(o => !o)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all ${helpOpen ? 'bg-secondary/10 text-secondary border-secondary/30' : 'bg-white border-slate-200 text-slate-600 hover:border-secondary hover:text-secondary'}`}>
                  <span className="material-symbols-outlined text-[14px]">help</span>
                  Get Help
                </button>
              </div>

              {/* FAQ chips */}
              {helpOpen && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Common questions</p>
                  {FAQ_ITEMS.map(f => (
                    <button key={f.q}
                      onClick={() => {
                        push({ role: 'user', text: f.q }, { role: 'bot', text: f.a });
                        setHelpOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-secondary hover:text-secondary hover:bg-secondary/5 transition-all font-medium">
                      {f.q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Text input — always visible */}
          <div className="p-3 border-t border-outline-variant flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                rows={1}
                placeholder={wizStep ? 'Ask me anything…' : 'Ask me anything or post a job above'}
                className="flex-1 resize-none px-3 py-2 border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-secondary transition-colors max-h-24 overflow-y-auto"
                style={{ minHeight: '40px' }}
              />
              <button onClick={handleSend} disabled={!input.trim() || aiLoading}
                className="w-9 h-9 bg-secondary text-white rounded-xl flex items-center justify-center hover:brightness-110 disabled:opacity-40 transition-all flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
