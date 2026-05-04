interface BidForgeLoaderProps {
  message?: string;
}

export function BidForgeLoader({ message = 'Loading…' }: BidForgeLoaderProps) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-dark-navy">
      <div className="relative mb-6 flex items-center justify-center">
        <span className="absolute w-24 h-24 rounded-2xl border-[3px] border-secondary/20 border-t-secondary animate-spin" />
        <svg width="56" height="56" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bf-full-loader" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#0059bb" />
            </linearGradient>
          </defs>
          <rect width="36" height="36" rx="9" fill="url(#bf-full-loader)" />
          <polyline points="9,21 18,12 27,21" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polyline points="9,27 18,18 27,27" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      <p className="text-white/60 text-label-md tracking-widest uppercase animate-pulse">{message}</p>
    </div>
  );
}
