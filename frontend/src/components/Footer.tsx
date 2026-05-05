import { BidForgeLogo } from '@/components/ui/BidForgeLogo';

export function Footer() {
  return (
    <footer className="hidden md:block border-t border-outline-variant mt-auto">
      <div className="w-full max-w-8xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BidForgeLogo variant="dark" />
            <span className="text-sm text-on-surface-variant">The Professional Marketplace</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Help Center'].map(l => (
              <a key={l} href="#" className="text-sm text-slate-400 hover:text-secondary transition-colors">{l}</a>
            ))}
            <span className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} BidForge Inc.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
