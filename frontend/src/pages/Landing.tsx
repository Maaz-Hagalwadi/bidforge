import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useTheme } from '@/context/ThemeContext';

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  dashboard: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
};

const STATS = [
  { value: '50k+', label: 'Active Jobs' },
  { value: '100k+', label: 'Freelancers' },
  { value: '200k+', label: 'Completed Projects' },
];

const HOW_IT_WORKS = {
  CLIENT: [
    { icon: 'post_add',     step: '01', title: 'Post a Job',      desc: 'Describe your project, set your budget, and choose public or invite-only visibility.' },
    { icon: 'gavel',        step: '02', title: 'Review Bids',     desc: 'Evaluate proposals, compare pricing, and message shortlisted freelancers in real time.' },
    { icon: 'verified',     step: '03', title: 'Get Work Done',   desc: 'Fund milestones in escrow, approve deliverables, and release payments securely.' },
  ],
  FREELANCER: [
    { icon: 'person_edit',  step: '01', title: 'Build Your Profile', desc: 'Showcase your skills, hourly rate, portfolio, and let your work speak for itself.' },
    { icon: 'search',       step: '02', title: 'Browse & Bid',       desc: 'Filter thousands of live jobs, craft a targeted proposal, and compete on merit.' },
    { icon: 'payments',     step: '03', title: 'Get Paid',           desc: 'Milestone-based escrow protects every dollar. Withdraw globally with zero surprises.' },
  ],
};

const TESTIMONIALS = [
  {
    quote: 'I found three long-term clients in my first month. The bidding system is transparent and the milestone escrow means I always get paid on time.',
    name: 'Priya K.',
    role: 'UI/UX Designer',
    rating: 5,
    initials: 'PK',
    color: '#6366f1',
  },
  {
    quote: 'Posted a job and had 12 qualified bids within the hour. The quality of talent on BidForge is consistently higher than any other platform I\'ve used.',
    name: 'Rohan V.',
    role: 'Digital Agency Owner',
    rating: 5,
    initials: 'JL',
    color: '#0059bb',
  },
  {
    quote: 'The real-time chat and dispute resolution gave our team confidence to work with freelancers internationally. Absolutely essential for remote projects.',
    name: 'Nikhil M.',
    role: 'Product Manager',
    rating: 5,
    initials: 'SM',
    color: '#10b981',
  },
];

export default function Landing() {
  const { setTheme } = useTheme();
  useEffect(() => { setTheme('dark'); }, []);

  const [activeTab, setActiveTab] = useState<'CLIENT' | 'FREELANCER'>('CLIENT');

  return (
    <div className="bg-surface text-on-surface">
      <Navbar variant="app" hideThemeToggle />

      <main className="pb-16 md:pb-0">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-xxl pb-xxl px-6 lg:px-xxl">
          <div className="max-w-8xl mx-auto grid lg:grid-cols-2 gap-xl items-center">
            <div className="z-10">
              <span className="inline-block py-1 px-3 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm mb-md uppercase tracking-wider">
                The Professional Marketplace
              </span>
              <h1 className="text-h1 text-on-surface mb-md">
                Find talent. Place bids. Get work done.
              </h1>
              <p className="text-body-lg text-on-surface-variant mb-xl max-w-xl">
                The high-velocity freelance platform built for serious professionals — milestone-based escrow, real-time chat, and AI-powered matching.
              </p>
              <div className="flex flex-wrap gap-md">
                <Link
                  to="/register"
                  className="bg-secondary text-white px-xl py-md rounded-lg text-label-md hover:brightness-110 transition-all shadow-lg shadow-secondary/30"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/browse"
                  className="bg-white border border-outline-variant text-on-surface px-xl py-md rounded-lg text-label-md hover:bg-surface-container-low transition-all"
                >
                  Browse Jobs
                </Link>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-md opacity-70">No credit card required · Free to join</p>
            </div>

            <div className="relative mt-xl lg:mt-0">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/10">
                <img
                  src={IMAGES.hero}
                  alt="Professionals collaborating in a modern workspace"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-md rounded-xl shadow-xl border border-outline-variant hidden md:flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white flex-shrink-0">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                </div>
                <div>
                  <p className="text-label-md text-on-surface font-semibold">Bid Secured</p>
                  <p className="text-body-sm text-on-surface-variant">2 minutes ago</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-xl shadow-lg hidden md:flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span className="text-xs font-bold">Milestone Paid</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        <section className="bg-white dark:bg-primary-container py-xl">
          <div className="max-w-8xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-xl text-center">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-xs">
                <span className="text-h2 text-secondary font-bold">{value}</span>
                <span className="text-label-md text-on-primary-container uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature Bento Grid ── */}
        <section className="py-xxl px-6 lg:px-xxl bg-surface">
          <div className="max-w-8xl mx-auto">
            <div className="text-center mb-xxl">
              <h2 className="text-h2 text-on-surface mb-sm">Everything you need to succeed</h2>
              <p className="text-body-md text-on-surface-variant max-w-2xl mx-auto">
                Streamlined tools designed for high-performance project management and secure financial growth.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto lg:h-[600px]">
              <div className="md:col-span-8 bg-white border border-outline-variant p-xl rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-white mb-lg">
                    <span className="material-symbols-outlined text-2xl">post_add</span>
                  </div>
                  <h3 className="text-h3 mb-md">Post Jobs</h3>
                  <p className="text-body-md text-on-surface-variant max-w-md">
                    Detailed project briefs, skill-matching algorithms, and instant distribution to top-tier talent worldwide.
                  </p>
                </div>
                <div className="mt-lg rounded-xl border border-outline-variant overflow-hidden">
                  <img src={IMAGES.dashboard} alt="Analytics dashboard preview" className="w-full h-48 object-cover" />
                </div>
              </div>

              <div className="md:col-span-4 bg-slate-50 dark:bg-dark-navy text-slate-900 dark:text-white p-xl rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform overflow-hidden">
                <div className="w-12 h-12 bg-slate-200 dark:bg-white/10 rounded-xl flex items-center justify-center mb-lg">
                  <span className="material-symbols-outlined text-2xl text-sky-400">payments</span>
                </div>
                {/* Decorative milestone payment flow */}
                <div className="flex flex-col gap-2 my-auto py-4">
                  {[
                    { label: 'Milestone 1', amount: '$500', status: 'Released', color: '#10b981' },
                    { label: 'Milestone 2', amount: '$750', status: 'Escrowed', color: '#3b82f6' },
                    { label: 'Milestone 3', amount: '$250', status: 'Pending',  color: '#94a3b8' },
                  ].map(({ label, amount, status, color }) => (
                    <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/40 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[15px]" style={{ color }}>
                          {status === 'Released' ? 'check_circle' : status === 'Escrowed' ? 'lock' : 'schedule'}
                        </span>
                        <span className="text-xs font-medium text-slate-700 dark:text-white/80">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{amount}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>{status}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-h3 text-slate-900 dark:text-white mb-md">Secure Payments</h3>
                  <p className="text-body-sm text-slate-500 dark:text-slate-400">
                    Enterprise-grade milestone escrow. Funds release only when you approve the work.
                  </p>
                </div>
              </div>

              <div className="md:col-span-4 bg-white border border-outline-variant p-xl rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-lg">
                  <span className="material-symbols-outlined text-2xl">assignment</span>
                </div>
                <div>
                  <h3 className="text-h3 mb-md">Bid on Work</h3>
                  <p className="text-body-sm text-on-surface-variant">
                    Competitive landscape with transparent bidding histories and AI-powered proposal drafting.
                  </p>
                </div>
              </div>

              <div className="md:col-span-8 bg-surface-container-low border border-outline-variant p-xl rounded-2xl flex items-center gap-xl relative overflow-hidden group">
                <div className="z-10 flex-1">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-secondary mb-lg shadow-sm">
                    <span className="material-symbols-outlined text-2xl">forum</span>
                  </div>
                  <h3 className="text-h3 mb-md">Real-time Chat</h3>
                  <p className="text-body-md text-on-surface-variant">
                    Integrated messaging with file sharing, read receipts, and per-contract chat rooms.
                  </p>
                </div>
                <div className="flex-1 hidden md:block">
                  <div className="bg-white rounded-xl p-md shadow-lg border border-outline-variant rotate-3 group-hover:rotate-0 transition-transform duration-300">
                    <div className="flex items-center gap-sm mb-sm border-b border-outline-variant pb-xs">
                      <div className="w-6 h-6 rounded-full bg-secondary flex-shrink-0" />
                      <span className="text-label-sm font-bold text-on-surface">Client Support</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant italic">"We've reviewed your bid and would like to proceed…"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-xxl px-6 lg:px-xxl bg-[#0d1c32]">
          <div className="max-w-8xl mx-auto">
            <div className="text-center mb-xl">
              <h2 className="text-h2 text-white mb-sm">How BidForge works</h2>
              <p className="text-body-md text-white/60 max-w-xl mx-auto">
                Whether you're hiring or looking for work, you're up and running in minutes.
              </p>
            </div>

            {/* Tab Toggle */}
            <div className="flex justify-center mb-xxl">
              <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 gap-1">
                {(['CLIENT', 'FREELANCER'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={[
                      'px-6 py-2 rounded-lg text-label-md font-semibold transition-all',
                      activeTab === tab
                        ? 'bg-secondary text-white shadow-sm'
                        : 'text-white/50 hover:text-white',
                    ].join(' ')}
                  >
                    {tab === 'CLIENT' ? 'For Clients' : 'For Freelancers'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-white/10" />

              {HOW_IT_WORKS[activeTab].map(({ icon, step, title, desc }) => (
                <div key={step} className="flex flex-col items-center text-center relative">
                  <div className="relative z-10 w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center shadow-lg shadow-secondary/20 mb-lg">
                    <span className="material-symbols-outlined text-white text-3xl">{icon}</span>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-white/20 text-[10px] font-bold text-secondary flex items-center justify-center">
                      {step}
                    </span>
                  </div>
                  <h3 className="text-h3 text-white mb-sm">{title}</h3>
                  <p className="text-body-md text-white/60 max-w-xs">{desc}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-xxl">
              <Link
                to="/register"
                className="bg-secondary text-white px-xl py-md rounded-xl text-label-md hover:brightness-110 transition-all shadow-lg shadow-secondary/30 font-semibold"
              >
                {activeTab === 'CLIENT' ? 'Post Your First Job →' : 'Create Free Profile →'}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-xxl px-6 lg:px-xxl bg-surface">
          <div className="max-w-8xl mx-auto">
            <div className="text-center mb-xxl">
              <h2 className="text-h2 text-on-surface mb-sm">Trusted by professionals worldwide</h2>
              <p className="text-body-md text-on-surface-variant max-w-xl mx-auto">
                Real results from real people who rely on BidForge every day.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ quote, name, role, rating, initials, color }) => (
                <div key={name} className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: rating }).map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[18px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-body-md text-on-surface-variant leading-relaxed flex-1">
                    "{quote}"
                  </p>

                  {/* Attribution */}
                  <div className="flex items-center gap-3 pt-2 border-t border-outline-variant">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="text-label-md font-semibold text-on-surface">{name}</p>
                      <p className="text-body-sm text-on-surface-variant">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust Indicators ── */}
        <section className="py-xl px-6 lg:px-xxl bg-[#0d1c32] border-y border-white/10">
          <div className="max-w-8xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: 'lock', label: 'Escrow Protected', desc: 'Funds held securely until you approve' },
              { icon: 'verified_user', label: 'Verified Profiles', desc: 'Identity and skill verification' },
              { icon: 'support_agent', label: 'Dispute Resolution', desc: 'Dedicated team to mediate issues' },
              { icon: 'bolt', label: 'AI-Powered', desc: 'Smart matching and proposal tools' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sky-400 text-2xl">{icon}</span>
                </div>
                <p className="text-label-md font-semibold text-white">{label}</p>
                <p className="text-body-sm text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-xxl px-6 lg:px-xxl">
          <div className="max-w-8xl mx-auto bg-secondary rounded-3xl p-xxl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-h2 text-white mb-md">Ready to start forging your future?</h2>
              <p className="text-body-lg text-white/80 max-w-2xl mx-auto mb-xl">
                Join 100,000+ professionals who use BidForge to hire, work, and grow their business.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-md">
                <Link
                  to="/register"
                  className="bg-white text-secondary px-xl py-md rounded-xl text-label-md hover:bg-slate-50 transition-all shadow-lg font-semibold"
                >
                  Hire Top Talent
                </Link>
                <Link
                  to="/register"
                  className="bg-white/10 border border-white/20 text-white px-xl py-md rounded-xl text-label-md hover:bg-white/20 transition-all font-semibold"
                >
                  Find Freelance Work
                </Link>
              </div>
              <p className="text-white/50 text-body-sm mt-lg">Free to join · No subscription fees · Pay only for work</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
