import { Link, useLocation } from 'react-router-dom';
import { BidForgeLogo } from '@/components/ui/BidForgeLogo';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  variant?: 'app' | 'auth';
  authRight?: React.ReactNode;
}

export function Navbar({ variant = 'app', authRight }: NavbarProps) {
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuth();
  const dashPath = user?.role === 'FREELANCER' ? '/freelancer/dashboard' : '/client/dashboard';

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/10 shadow-lg shadow-black/20"
      style={{ backgroundColor: '#0A192F' }}
    >
      <div className="relative w-full px-6 h-16 flex items-center justify-between">

        {/* Left — logo */}
        <Link to="/" className="flex-shrink-0 z-10">
          <BidForgeLogo variant="light" />
        </Link>

        {/* Center — tagline (auth only, desktop) */}
        {variant === 'auth' && (
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2">
            <span className="text-slate-400 text-label-sm uppercase tracking-widest">
              The Professional Marketplace
            </span>
          </nav>
        )}

        {/* Right — actions */}
        <div className="flex items-center gap-3 z-10">
          {authRight ?? (
            isAuthenticated ? (
              <Link
                to={dashPath}
                className="bg-secondary px-md py-xs rounded-lg text-white text-label-md hover:brightness-110 transition-all duration-200 shadow-md shadow-secondary/30"
              >
                Dashboard
              </Link>
            ) : (
              <>
                {pathname !== '/login' && (
                  <Link
                    to="/login"
                    className="text-label-md font-medium text-white/80 hover:text-white transition-colors duration-200"
                  >
                    Log In
                  </Link>
                )}
                {pathname !== '/register' && (
                  <Link
                    to="/register"
                    className="bg-secondary px-md py-xs rounded-lg text-white text-label-md hover:brightness-110 transition-all duration-200 shadow-md shadow-secondary/30"
                  >
                    Get Started
                  </Link>
                )}
              </>
            )
          )}
        </div>

      </div>
    </header>
  );
}
