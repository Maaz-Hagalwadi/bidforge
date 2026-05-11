import { Link, useLocation } from 'react-router-dom';
import { BidForgeLogo } from '@/components/ui/BidForgeLogo';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface NavbarProps {
  variant?: 'app' | 'auth';
  authRight?: React.ReactNode;
  navLeft?: React.ReactNode;
  hideThemeToggle?: boolean;
}

export function Navbar({ variant = 'app', authRight, navLeft, hideThemeToggle = false }: NavbarProps) {
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const dashPath = user?.role === 'FREELANCER' ? '/freelancer/dashboard' : '/client/dashboard';

  return (
    <header
      className="sticky top-0 z-50 w-full shadow-sm dark:shadow-lg dark:shadow-black/20"
      style={{
        backgroundColor: theme === 'dark' ? '#0A192F' : '#ffffff',
        borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
      }}
    >
      <div className="relative w-full px-6 h-16 flex items-center justify-between">

        {/* Left — hamburger (mobile) + logo */}
        <div className="flex items-center gap-2 flex-shrink-0 z-10">
          {navLeft && <div className="lg:hidden">{navLeft}</div>}
          <Link to={isAuthenticated ? dashPath : "/"}>
            <BidForgeLogo variant={theme === 'dark' ? 'light' : 'dark'} />
          </Link>
        </div>

        {/* Center — tagline (auth only, desktop) */}
        {variant === 'auth' && (
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2">
            <span className="text-slate-400 dark:text-slate-400 text-label-sm uppercase tracking-widest">
              The Professional Marketplace
            </span>
          </nav>
        )}

        {/* Right — actions */}
        <div className="flex items-center gap-2 z-10">
          {/* Theme toggle — hidden on auth pages and where explicitly suppressed */}
          {variant !== 'auth' && !hideThemeToggle && (
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white transition-all"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="material-symbols-outlined text-xl">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          )}

          {authRight ?? (
            isAuthenticated ? (
              <Link
                to={dashPath}
                className="bg-secondary px-md py-xs rounded-lg text-slate-900 dark:text-white text-label-md hover:brightness-110 transition-all duration-200 shadow-md shadow-secondary/30"
              >
                Dashboard
              </Link>
            ) : (
              <>
                {pathname !== '/login' && (
                  <Link
                    to="/login"
                    className="text-label-md font-medium text-slate-600 hover:text-slate-900 dark:text-white/80 dark:hover:text-white transition-colors duration-200"
                  >
                    Log In
                  </Link>
                )}
                {pathname !== '/register' && (
                  <Link
                    to="/register"
                    className="bg-secondary px-md py-xs rounded-lg text-slate-900 dark:text-white text-label-md hover:brightness-110 transition-all duration-200 shadow-md shadow-secondary/30"
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
