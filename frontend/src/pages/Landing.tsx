import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';

// Professional Unsplash images
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  dashboard:
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
};

const STATS = [
  { value: '50k+', label: 'Active Jobs' },
  { value: '100k+', label: 'Freelancers' },
  { value: '200k+', label: 'Completed Projects' },
];

export default function Landing() {
  return (
    <div className="bg-surface text-on-surface">
      {/* ── Nav (navy, centered links) ── */}
      <Navbar variant="app" />

      <main className="pb-16 md:pb-0">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-xxl pb-xxl px-6 lg:px-xxl">
          <div className="max-w-8xl mx-auto grid lg:grid-cols-2 gap-xl items-center">
            {/* Left copy */}
            <div className="z-10">
              <span className="inline-block py-1 px-3 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm mb-md uppercase tracking-wider">
                The Professional Marketplace
              </span>
              <h1 className="text-h1 text-on-surface mb-md">
                Find talent. Place bids. Get work done.
              </h1>
              <p className="text-body-lg text-on-surface-variant mb-xl max-w-xl">
                Experience the high-velocity freelance management platform designed for serious
                professionals and enterprise clients.
              </p>
              <div className="flex flex-wrap gap-md">
                <Link
                  to="/register"
                  className="bg-secondary text-white px-xl py-md rounded-lg text-label-md hover:brightness-110 transition-all shadow-lg shadow-secondary/30"
                >
                  Sign Up Now
                </Link>
                <Link
                  to="/login"
                  className="bg-white border border-outline-variant text-on-surface px-xl py-md rounded-lg text-label-md hover:bg-surface-container-low transition-all"
                >
                  Log In
                </Link>
              </div>
            </div>

            {/* Right image + floating card */}
            <div className="relative mt-xl lg:mt-0">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/10">
                <img
                  src={IMAGES.hero}
                  alt="Professionals collaborating in a modern workspace"
                  className="object-cover w-full h-full"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-md rounded-xl shadow-xl border border-outline-variant hidden md:flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white flex-shrink-0">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                </div>
                <div>
                  <p className="text-label-md text-on-surface font-semibold">Bid Secured</p>
                  <p className="text-body-sm text-on-surface-variant">2 minutes ago</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        <section className="bg-primary-container py-xl">
          <div className="max-w-8xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-xl text-center">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-xs">
                <span className="text-h2 text-secondary-fixed font-bold">{value}</span>
                <span className="text-label-md text-on-primary-container uppercase tracking-widest">
                  {label}
                </span>
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
                Streamlined tools designed for high-performance project management and secure
                financial growth.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto lg:h-[600px]">
              {/* Post Jobs — large */}
              <div className="md:col-span-8 bg-white border border-outline-variant p-xl rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-white mb-lg">
                    <span className="material-symbols-outlined text-2xl">post_add</span>
                  </div>
                  <h3 className="text-h3 mb-md">Post Jobs</h3>
                  <p className="text-body-md text-on-surface-variant max-w-md">
                    Detailed project briefs, skill-matching algorithms, and instant distribution to
                    top-tier talent worldwide.
                  </p>
                </div>
                <div className="mt-lg rounded-xl border border-outline-variant overflow-hidden">
                  <img
                    src={IMAGES.dashboard}
                    alt="Analytics dashboard preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              </div>

              {/* Secure Payments */}
              <div className="md:col-span-4 bg-dark-navy text-white p-xl rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-lg">
                  <span className="material-symbols-outlined text-2xl text-sky-300">payments</span>
                </div>
                <div>
                  <h3 className="text-h3 text-white mb-md">Secure Payments</h3>
                  <p className="text-body-sm text-slate-400">
                    Enterprise-grade escrow services and global payout options in multiple
                    currencies.
                  </p>
                </div>
              </div>

              {/* Bid on Work */}
              <div className="md:col-span-4 bg-white border border-outline-variant p-xl rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-lg">
                  <span className="material-symbols-outlined text-2xl">assignment</span>
                </div>
                <div>
                  <h3 className="text-h3 mb-md">Bid on Work</h3>
                  <p className="text-body-sm text-on-surface-variant">
                    Competitive landscape with transparent bidding histories and project requirement
                    validation.
                  </p>
                </div>
              </div>

              {/* Real-time Chat */}
              <div className="md:col-span-8 bg-surface-container-low border border-outline-variant p-xl rounded-2xl flex items-center gap-xl relative overflow-hidden group">
                <div className="z-10 flex-1">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-secondary mb-lg shadow-sm">
                    <span className="material-symbols-outlined text-2xl">forum</span>
                  </div>
                  <h3 className="text-h3 mb-md">Real-time Chat</h3>
                  <p className="text-body-md text-on-surface-variant">
                    Integrated communication with file sharing, video calls, and project timeline
                    tracking.
                  </p>
                </div>
                <div className="flex-1 hidden md:block">
                  <div className="bg-white rounded-xl p-md shadow-lg border border-outline-variant rotate-3 group-hover:rotate-0 transition-transform duration-300">
                    <div className="flex items-center gap-sm mb-sm border-b border-outline-variant pb-xs">
                      <div className="w-6 h-6 rounded-full bg-secondary flex-shrink-0" />
                      <span className="text-label-sm font-bold text-on-surface">Client Support</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant italic">
                      "We've reviewed your bid and would like to proceed…"
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
                Join the world's most disciplined and professional freelance ecosystem today.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-md">
                <Link
                  to="/register"
                  className="bg-white text-secondary px-xl py-md rounded-xl text-label-md hover:bg-slate-50 transition-all shadow-lg font-semibold"
                >
                  Register as Talent
                </Link>
                <Link
                  to="/register"
                  className="bg-dark-navy text-white px-xl py-md rounded-xl text-label-md hover:bg-black/80 transition-all font-semibold"
                >
                  Post a Job Proposal
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="flex flex-col items-center gap-4 bg-dark-navy py-12 px-8 text-xs border-t border-white/10">
        <div className="w-full max-w-8xl flex flex-col md:flex-row justify-between items-center gap-8 border-b border-white/10 pb-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-white font-bold text-lg">BidForge</span>
            <p className="text-slate-400 text-center md:text-left">
              High-velocity freelance marketplace for professionals.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Help Center', 'API Reference'].map((link) => (
              <a key={link} href="#" className="text-slate-400 hover:text-white transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
        <div className="w-full max-w-8xl flex flex-col md:flex-row justify-between items-center gap-4 pt-4">
          <span className="text-slate-500">© 2026 BidForge Inc. All rights reserved.</span>
          <div className="flex gap-4">
            {['language', 'shield', 'contact_support'].map((icon) => (
              <span
                key={icon}
                className="material-symbols-outlined text-slate-500 cursor-pointer hover:text-white transition-colors"
              >
                {icon}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
