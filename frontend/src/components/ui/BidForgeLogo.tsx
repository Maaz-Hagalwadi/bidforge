interface BidForgeLogoProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function BidForgeLogo({ variant = 'light', className = '' }: BidForgeLogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Badge icon */}
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bfGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0059bb" />
          </linearGradient>
        </defs>
        {/* Rounded-square background */}
        <rect width="36" height="36" rx="9" fill="url(#bfGrad)" />

        {/* Upper chevron — white (active bid) */}
        <polyline
          points="9,21 18,12 27,21"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Lower chevron — sky blue (forge spark) */}
        <polyline
          points="9,27 18,18 27,27"
          stroke="#7dd3fc"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Wordmark */}
      <span className={`text-xl font-bold tracking-tight ${textColor}`}>
        Bid<span className="text-secondary">Forge</span>
      </span>
    </div>
  );
}
