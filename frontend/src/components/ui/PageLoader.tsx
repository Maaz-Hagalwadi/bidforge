export function PageLoader({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-5">
      <div className="relative">
        <svg width="52" height="52" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bf-loader" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#0059bb" />
            </linearGradient>
          </defs>
          <rect width="36" height="36" rx="9" fill="url(#bf-loader)" />
          <polyline points="9,21 18,12 27,21" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polyline points="9,27 18,18 27,27" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="absolute -inset-2.5 block rounded-[14px] border-[3px] border-secondary/20 border-t-secondary animate-spin" />
      </div>
      <p className="text-sm font-semibold text-on-surface-variant tracking-wide">{message}</p>
    </div>
  );
}
