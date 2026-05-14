import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BidForgeLogo } from '@/components/ui/BidForgeLogo';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const STATS = [
  { value: '50k+', label: 'Active Jobs' },
  { value: '120k+', label: 'Freelancers' },
  { value: '200k+', label: 'Projects Done' },
  { value: '4.9★', label: 'Avg. Rating' },
];

const FEATURES = [
  { icon: 'post_add',      title: 'Smart Job Posting',    desc: 'Describe your project with AI assistance, set budgets, and reach the right freelancers instantly.', color: '#0059bb' },
  { icon: 'gavel',         title: 'Competitive Bidding',  desc: 'Receive targeted proposals, compare freelancers side-by-side, and choose with confidence.', color: '#7c3aed' },
  { icon: 'lock',          title: 'Milestone Escrow',     desc: 'Funds are held securely and released only when you approve each deliverable.', color: '#059669' },
  { icon: 'forum',         title: 'Real-time Chat',       desc: 'Built-in messaging with file sharing, read receipts, and per-contract chat rooms.', color: '#d97706' },
  { icon: 'bolt',          title: 'AI-Powered Tools',     desc: 'Generate job descriptions, craft proposals, get price suggestions, and optimize your profile.', color: '#e11d48' },
  { icon: 'support_agent', title: 'Dispute Resolution',   desc: 'Dedicated support mediates any conflict — so every project ends fairly.', color: '#0891b2' },
];

const HOW_IT_WORKS = {
  CLIENT: [
    { icon: 'post_add', step: '01', title: 'Post a Job',     desc: 'Describe your project, set your budget, and choose public or invite-only visibility.' },
    { icon: 'gavel',    step: '02', title: 'Review Bids',    desc: 'Evaluate proposals, compare pricing, and message shortlisted freelancers in real time.' },
    { icon: 'verified', step: '03', title: 'Get Work Done',  desc: 'Fund milestones in escrow, approve deliverables, and release payments securely.' },
  ],
  FREELANCER: [
    { icon: 'person_edit', step: '01', title: 'Build Your Profile', desc: 'Showcase your skills, hourly rate, portfolio, and let your work speak for itself.' },
    { icon: 'search',      step: '02', title: 'Browse & Bid',       desc: 'Filter thousands of live jobs, craft a targeted proposal, and compete on merit.' },
    { icon: 'payments',    step: '03', title: 'Get Paid',           desc: 'Milestone-based escrow protects every dollar. Withdraw globally with zero surprises.' },
  ],
};

const TESTIMONIALS = [
  {
    quote: 'I found three long-term clients in my first month. The bidding system is transparent and milestone escrow means I always get paid on time.',
    name: 'Priya Kapoor', role: 'UI/UX Designer', rating: 5, initials: 'PK', color: '#6366f1',
  },
  {
    quote: "Posted a job and had 12 qualified bids within the hour. The quality of talent on BidForge is consistently higher than any platform I've used.",
    name: 'Rohan Verma', role: 'Digital Agency Owner', rating: 5, initials: 'RV', color: '#0059bb',
  },
  {
    quote: 'The real-time chat and dispute resolution gave our team confidence to work with freelancers internationally. Absolutely essential.',
    name: 'Nikhil Mehta', role: 'Product Manager', rating: 5, initials: 'NM', color: '#059669',
  },
];

const TRUST = [
  { icon: 'lock',          label: 'Escrow Protected',   desc: 'Funds held until you approve' },
  { icon: 'verified_user', label: 'Verified Profiles',  desc: 'Identity & skill verification' },
  { icon: 'support_agent', label: 'Dispute Resolution', desc: 'Dedicated mediation team' },
  { icon: 'bolt',          label: 'AI-Powered',         desc: 'Smart matching & proposal tools' },
];

export default function Landing() {
  const { setTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'CLIENT' | 'FREELANCER'>('CLIENT');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setTheme('light'); }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const dashPath = user?.role === 'FREELANCER' ? '/freelancer/dashboard' : '/client/dashboard';

  return (
    <div className="bg-white text-slate-900">

      {/* ── Navbar ── */}
      <header
        className={[
          'sticky top-0 z-50 bg-white transition-all duration-200',
          scrolled ? 'shadow-[0_1px_12px_rgba(0,0,0,0.08)]' : 'border-b border-slate-100',
        ].join(' ')}
      >
        <div className="max-w-8xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <BidForgeLogo variant="dark" />
          </Link>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {[
              { label: 'Browse Jobs',   to: '/browse',       type: 'link' as const },
              { label: 'How It Works',  to: '#how-it-works', type: 'anchor' as const },
              { label: 'Features',      to: '#features',     type: 'anchor' as const },
            ].map(({ label, to, type }) =>
              type === 'link' ? (
                <Link
                  key={label}
                  to={to}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  {label}
                </Link>
              ) : (
                <a
                  key={label}
                  href={to}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  {label}
                </a>
              )
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAuthenticated ? (
              <Link
                to={dashPath}
                className="bg-[#0059bb] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#004fa3] transition-colors shadow-sm"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:block px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-[#0059bb] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#004fa3] transition-colors shadow-sm"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#f0f7ff] to-white pt-20 pb-24 px-6">
          {/* Background blobs */}
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[#0059bb]/5 pointer-events-none" />
          <div className="absolute bottom-0 -left-32 w-72 h-72 rounded-full bg-sky-50 pointer-events-none" />

          <div className="max-w-8xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">

            {/* Left copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0059bb] animate-pulse" />
                <span className="text-xs font-semibold text-[#0059bb] uppercase tracking-wider">The Professional Marketplace</span>
              </div>

              <h1 className="text-[48px] sm:text-[58px] leading-[1.08] font-extrabold text-slate-900 tracking-tight mb-6">
                Find top talent.<br />
                <span className="text-[#0059bb]">Build remarkable</span> things.
              </h1>

              <p className="text-[17px] text-slate-500 leading-relaxed mb-8 max-w-lg">
                The high-velocity freelance platform built for serious professionals — milestone escrow, real-time chat, and AI-powered matching.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-[#0059bb] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#004fa3] transition-all shadow-lg shadow-blue-100"
                >
                  Get Started Free
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl text-sm font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">search</span>
                  Browse Jobs
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {['Free to join', 'No subscription fees', 'Pay only for work'].map(label => (
                  <div key={label} className="flex items-center gap-1.5 text-sm text-slate-500">
                    <span className="material-symbols-outlined text-[15px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — platform preview */}
            <div className="relative hidden lg:block">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.10)] overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white rounded-md h-6 flex items-center px-3 text-[11px] text-slate-400 border border-slate-200 mx-3">
                    bidforge.io/browse
                  </div>
                </div>

                {/* Job listings mockup */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open Jobs</span>
                    <span className="text-[11px] text-slate-400">3,421 results</span>
                  </div>
                  {[
                    { title: 'React + TypeScript Developer', budget: '$2,000–$4,000', bids: 8,  tag: 'Frontend', tagColor: '#0059bb' },
                    { title: 'Brand Identity & Logo Design',  budget: '$800–$1,500',  bids: 14, tag: 'Design',   tagColor: '#7c3aed' },
                    { title: 'Mobile App (Flutter)',          budget: '$5,000+',      bids: 5,  tag: 'Mobile',   tagColor: '#059669' },
                  ].map(({ title, budget, bids, tag, tagColor }) => (
                    <div key={title} className="flex items-start justify-between p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors group cursor-pointer">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-[13px] font-semibold text-slate-800 group-hover:text-[#0059bb] transition-colors truncate">{title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-slate-500">{budget}</span>
                          <span className="text-[11px] text-slate-400">{bids} bids</span>
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: `${tagColor}12`, color: tagColor, border: `1px solid ${tagColor}25` }}
                      >
                        {tag}
                      </span>
                    </div>
                  ))}

                  {/* Bottom bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[12px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>circle</span>
                      </div>
                      <span className="text-[11px] text-slate-500">12 new jobs today</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#0059bb] cursor-pointer hover:underline">View all →</span>
                  </div>
                </div>
              </div>

              {/* Floating badge: milestone released */}
              <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl px-4 py-3 shadow-xl border border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-900">Milestone Released</p>
                  <p className="text-[11px] text-slate-500">$1,200 · just now</p>
                </div>
              </div>

              {/* Floating badge: bid accepted */}
              <div className="absolute -top-3 -right-4 bg-[#0059bb] text-white rounded-xl px-3 py-2 shadow-lg flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="text-[11px] font-bold">Bid Accepted</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <section className="border-y border-slate-100 py-10 bg-white">
          <div className="max-w-8xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-extrabold text-[#0059bb]">{value}</p>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-24 px-6 bg-slate-50">
          <div className="max-w-8xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-[36px] font-extrabold text-slate-900 tracking-tight mb-4">Everything you need to succeed</h2>
              <p className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
                Streamlined tools for high-performance project management and secure financial growth.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map(({ icon, title, desc, color }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${color}12` }}
                  >
                    <span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span>
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="py-24 px-6 bg-white">
          <div className="max-w-8xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-[36px] font-extrabold text-slate-900 tracking-tight mb-4">How BidForge works</h2>
              <p className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
                Whether you're hiring or looking for work, you're up and running in minutes.
              </p>
            </div>

            {/* Tab toggle */}
            <div className="flex justify-center mb-14">
              <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
                {(['CLIENT', 'FREELANCER'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={[
                      'px-7 py-2.5 rounded-lg text-sm font-semibold transition-all',
                      activeTab === tab
                        ? 'bg-white text-[#0059bb] shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700',
                    ].join(' ')}
                  >
                    {tab === 'CLIENT' ? 'For Clients' : 'For Freelancers'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
              {/* Connector */}
              <div className="hidden md:block absolute top-9 left-[22%] right-[22%] h-px bg-slate-200" />
              {HOW_IT_WORKS[activeTab].map(({ icon, step, title, desc }) => (
                <div key={step} className="flex flex-col items-center text-center">
                  <div className="relative z-10 w-[72px] h-[72px] rounded-2xl bg-[#0059bb] flex items-center justify-center shadow-lg shadow-blue-100 mb-6">
                    <span className="material-symbols-outlined text-white text-3xl">{icon}</span>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-[#0059bb] text-[10px] font-bold text-[#0059bb] flex items-center justify-center shadow">
                      {step}
                    </span>
                  </div>
                  <h3 className="text-[17px] font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[260px]">{desc}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-14">
              <Link
                to="/register"
                className="bg-[#0059bb] text-white px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-[#004fa3] transition-colors shadow-lg shadow-blue-100"
              >
                {activeTab === 'CLIENT' ? 'Post Your First Job →' : 'Create Free Profile →'}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-8xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-[36px] font-extrabold text-slate-900 tracking-tight mb-4">Trusted by professionals worldwide</h2>
              <p className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
                Real results from real people who rely on BidForge every day.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TESTIMONIALS.map(({ quote, name, role, rating, initials, color }) => (
                <div key={name} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-0.5">
                    {Array.from({ length: rating }).map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[17px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">"{quote}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{name}</p>
                      <p className="text-xs text-slate-400">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust strip ── */}
        <section className="py-14 px-6 bg-white border-y border-slate-100">
          <div className="max-w-8xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {TRUST.map(({ icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#0059bb] text-[22px]">{icon}</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{label}</p>
                <p className="text-xs text-slate-400 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA banner ── */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-8xl mx-auto">
            <div className="relative bg-[#0059bb] rounded-3xl px-8 py-20 text-center overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full pointer-events-none" />

              <div className="relative z-10">
                <h2 className="text-[38px] font-extrabold text-white tracking-tight mb-4 leading-tight">
                  Ready to start forging<br />your future?
                </h2>
                <p className="text-[17px] text-white/70 max-w-xl mx-auto mb-10 leading-relaxed">
                  Join 100,000+ professionals who use BidForge to hire, work, and grow their business.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    to="/register"
                    className="bg-white text-[#0059bb] px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-lg"
                  >
                    Hire Top Talent
                  </Link>
                  <Link
                    to="/register"
                    className="bg-white/10 border border-white/25 text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-white/[0.18] transition-colors"
                  >
                    Find Freelance Work
                  </Link>
                </div>
                <p className="text-white/40 text-xs mt-6">Free to join · No subscription fees · Pay only for work</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-100">
        <div className="max-w-8xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="md:col-span-2">
              <BidForgeLogo variant="dark" />
              <p className="text-sm text-slate-400 mt-3 leading-relaxed max-w-xs">
                The professional marketplace for serious freelancers and clients worldwide. Built for speed, trust, and results.
              </p>
            </div>

            {/* Platform links */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Platform</h4>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'Browse Jobs', to: '/browse', type: 'link' as const },
                  { label: 'Post a Job',  to: '/register', type: 'link' as const },
                  { label: 'How It Works', to: '#how-it-works', type: 'anchor' as const },
                ].map(({ label, to, type }) =>
                  type === 'link' ? (
                    <Link key={label} to={to} className="text-sm text-slate-500 hover:text-[#0059bb] transition-colors">{label}</Link>
                  ) : (
                    <a key={label} href={to} className="text-sm text-slate-500 hover:text-[#0059bb] transition-colors">{label}</a>
                  )
                )}
              </div>
            </div>

            {/* Company links */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Company</h4>
              <div className="flex flex-col gap-2.5">
                {['Privacy Policy', 'Terms of Service', 'Help Center'].map(l => (
                  <a key={l} href="#" className="text-sm text-slate-500 hover:text-[#0059bb] transition-colors">{l}</a>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} BidForge Inc. All rights reserved.</p>
            <p className="text-xs text-slate-400">Built for professionals, by professionals.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
