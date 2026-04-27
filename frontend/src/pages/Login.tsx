import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import { loginSchema, type LoginFormValues } from '@/lib/schemas';
import { useAuth } from '@/context/AuthContext';
import { FormField } from '@/components/ui/FormField';
import { Navbar } from '@/components/Navbar';
import type { ApiError } from '@/types/auth';

// Professionals collaborating — different from register panel
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const justRegistered = (location.state as { registered?: boolean } | null)?.registered === true;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const loggedInUser = await login(values);
      const dest = loggedInUser.role === 'CLIENT' ? '/client/dashboard' : '/freelancer/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiErr = err.response?.data as ApiError;
        if (err.response?.status === 401) {
          setError('root', { message: 'Invalid email or password.' });
        } else {
          setError('root', { message: apiErr?.message ?? 'Login failed. Please try again.' });
        }
      } else {
        setError('root', { message: 'An unexpected error occurred. Please try again.' });
      }
    }
  };

  return (
    <div className="bg-dark-navy antialiased flex flex-col min-h-screen">
      <Navbar variant="auth" />

      {/* Main two-panel layout */}
      <main className="flex-1 w-full flex flex-col md:flex-row overflow-hidden">
        {/* Left: Branding */}
        <section className="relative w-full md:w-1/2 h-[40vh] md:h-auto overflow-hidden">
          <img
            alt="Team of professionals collaborating in a modern office"
            className="absolute inset-0 w-full h-full object-cover"
            src={HERO_IMAGE}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-navy/95 via-dark-navy/40 to-dark-navy/10" />
          <div className="absolute bottom-10 left-8 right-8 md:bottom-16 md:left-12 max-w-lg z-10">
            <h1 className="text-white text-h1 mb-md leading-tight">
              Welcome back.<br />Your next project awaits.
            </h1>
            <p className="text-white/70 text-body-lg">
              Log in and get back to building something great.
            </p>
          </div>
        </section>

        {/* Right: Form */}
        <section className="w-full md:w-1/2 bg-dark-navy flex items-center justify-center p-8 md:p-16 overflow-y-auto">
          <div className="w-full max-w-md space-y-xl py-8 md:py-12">
            <div className="text-center md:text-left">
              <h2 className="text-white text-h2 mb-sm">Welcome Back</h2>
              <p className="text-on-primary-container text-body-md">
                Sign in to continue to BidForge.
              </p>
            </div>

            {/* Success banner after registration */}
            {justRegistered && (
              <div className="flex items-center gap-sm bg-green-500/10 border border-green-500/30 rounded-lg px-md py-sm text-green-400 text-body-sm">
                <span className="material-symbols-outlined text-base">check_circle</span>
                Account created! Please log in.
              </div>
            )}

            {/* Global error */}
            {errors.root && (
              <p className="field-error text-center">{errors.root.message}</p>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-lg" noValidate>
              <FormField
                label="Email Address"
                id="email"
                icon="mail"
                error={errors.email?.message}
              >
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="john@example.com"
                  className="auth-input"
                  {...register('email')}
                />
              </FormField>

              <FormField
                label="Password"
                id="password"
                icon="lock"
                error={errors.password?.message}
              >
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="auth-input"
                  {...register('password')}
                />
              </FormField>

              <div className="flex justify-end">
                <a href="#" className="text-secondary text-body-sm hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-secondary text-white text-label-md py-md rounded-lg hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-secondary/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing In…' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative py-md">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-label-sm uppercase tracking-widest">
                <span className="bg-dark-navy px-md text-slate-500">Or continue with</span>
              </div>
            </div>

            {/* Google (placeholder) */}
            <button
              type="button"
              disabled
              title="Google sign-in coming soon"
              className="w-full bg-white text-slate-900 text-label-md py-md rounded-lg flex items-center justify-center gap-md hover:bg-slate-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>

            <p className="text-center text-slate-500 text-body-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-secondary text-label-md hover:underline">
                Register
              </Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-dark-navy border-t border-white/10 flex justify-between items-center px-8 py-3 flex-shrink-0">
        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          © 2026 BidForge Inc.
        </span>
        <div className="flex gap-lg">
          {['Privacy', 'Terms', 'Help'].map((link) => (
            <a key={link} href="#" className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
              {link}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
