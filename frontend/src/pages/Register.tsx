import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';

import { registerSchema, type RegisterFormValues } from '@/lib/schemas';
import { useAuth } from '@/context/AuthContext';
import { FormField } from '@/components/ui/FormField';
import { RoleSelector } from '@/components/ui/RoleSelector';
import { BidForgeLoader } from '@/components/ui/BidForgeLoader';
import { Navbar } from '@/components/Navbar';
import type { ApiError } from '@/types/auth';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=85';

const GoogleIcon = () => (
  <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser, loginWithGoogle } = useAuth();
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CLIENT' },
  });

  const selectedRole = watch('role');

  const googleOAuth = useGoogleLogin({
    onSuccess: (tokenResponse) => handleGoogleSuccess(tokenResponse.access_token),
    onError: () => setGoogleError('Google sign-in was cancelled or failed.'),
  });

  const handleGoogleSuccess = async (accessToken: string) => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const u = await loginWithGoogle(accessToken, selectedRole as 'CLIENT' | 'FREELANCER');
      navigate(u.role === 'CLIENT' ? '/client/dashboard' : '/freelancer/dashboard', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiErr = err.response?.data as ApiError;
        if (apiErr?.error === 'INVALID_GOOGLE_TOKEN') {
          setGoogleError('Google sign-in failed. Please try again.');
        } else {
          setGoogleError(apiErr?.message ?? 'Google sign-in failed. Please try again.');
        }
      } else {
        setGoogleError('An unexpected error occurred.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        role: values.role,
      });
      setRegisteredEmail(values.email);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiErr = err.response?.data as ApiError;
        if (apiErr?.error === 'EMAIL_ALREADY_EXISTS') {
          setError('email', { message: 'This email is already registered.' });
        } else if (apiErr?.error === 'PHONE_ALREADY_EXISTS') {
          setError('phoneNumber', { message: 'This phone number is already registered.' });
        } else if (apiErr?.error === 'VALIDATION_ERROR' && apiErr.errors?.length) {
          setError('root', { message: apiErr.errors[0] });
        } else {
          setError('root', { message: apiErr?.message ?? 'Registration failed. Please try again.' });
        }
      } else {
        setError('root', { message: 'An unexpected error occurred. Please try again.' });
      }
    }
  };

  /* ── Email verification success screen ── */
  if (registeredEmail) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-navy flex flex-col">
        <Navbar variant="auth" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#0d1c32] border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-2xl max-w-md w-full p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-secondary text-4xl">mark_email_unread</span>
            </div>
            <h2 className="text-slate-900 dark:text-white text-2xl font-bold mb-2">Check your inbox</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">We sent a verification link to</p>
            <p className="text-secondary font-semibold text-sm mb-5">{registeredEmail}</p>
            <p className="text-slate-500 dark:text-slate-500 text-xs mb-7 leading-relaxed">
              Click the link in the email to activate your account.<br />
              Check your spam folder if you don't see it.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full h-11 bg-secondary text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-navy antialiased flex flex-col">
      {(isSubmitting || googleLoading) && (
        <BidForgeLoader message={googleLoading ? 'Signing in with Google…' : 'Creating your account…'} />
      )}
      <Navbar variant="auth" />

      <main className="flex-1 flex">

        {/* ── Left panel: brand + image (desktop only) ── */}
        <aside className="hidden md:flex md:w-1/2 relative overflow-hidden flex-shrink-0">
          <img
            src={HERO_IMAGE}
            alt="Developer at work"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F] via-[#0A192F]/65 to-[#0A192F]/15" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0A192F]/20" />

          <div className="relative z-10 flex flex-col justify-end p-10 xl:p-14 h-full">
            <div className="mb-8">
              <h1 className="text-white font-bold text-4xl xl:text-[2.6rem] leading-tight mb-4">
                Success starts here.<br />
                <span className="text-secondary">Build your career</span><br />
                on your terms.
              </h1>
              <p className="text-white/55 text-base leading-relaxed max-w-xs">
                The marketplace where elite freelancers meet sophisticated clients.
              </p>
            </div>

            <div className="space-y-4 pt-7 border-t border-white/10">
              {[
                { icon: 'verified', text: 'Verified clients with funded escrow' },
                { icon: 'payments', text: 'Secure milestone-based payments' },
                { icon: 'shield', text: 'Dispute protection on every project' },
              ].map(({ icon, text }) => (
                <div key={icon} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/15 border border-secondary/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-secondary text-base">{icon}</span>
                  </div>
                  <p className="text-white/60 text-sm">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Right panel: form ── */}
        <section className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-dark-navy">

<div className="flex-1 flex items-start justify-center px-6 py-6 md:py-8 md:px-10 lg:px-16">
          <div className="w-full max-w-[420px] py-2">

            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-slate-900 dark:text-white text-[1.75rem] font-bold tracking-tight">Create account</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">Start your professional journey on BidForge.</p>
            </div>

            {/* Role selector */}
            <div className="mb-5">
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-2 font-medium">I am joining as</p>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <RoleSelector value={field.value} onChange={field.onChange} />
                )}
              />
            </div>

            {/* Google — primary CTA */}
            {googleError && (
              <p className="field-error text-sm text-center mb-3">{googleError}</p>
            )}

            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/40 rounded-xl px-4 py-2.5 mb-3">
              <span className="material-symbols-outlined text-secondary text-sm">
                {selectedRole === 'CLIENT' ? 'person_search' : 'work'}
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-xs flex-1">
                Signing up as <span className="text-slate-900 dark:text-white font-semibold">{selectedRole === 'CLIENT' ? 'a Client' : 'a Freelancer'}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => googleOAuth()}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-slate-300 dark:border-slate-600/60 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:border-slate-400 dark:hover:border-slate-500/80 text-slate-800 dark:text-white text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mb-5"
            >
              <GoogleIcon />
              {googleLoading ? 'Connecting…' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700/60" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-50 dark:bg-dark-navy px-3 text-slate-500 text-xs uppercase tracking-widest">
                  or create account with email
                </span>
              </div>
            </div>

            {/* Registration form */}
            {errors.root && (
              <p className="field-error text-sm text-center mb-4">{errors.root.message}</p>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField label="Full Name" id="name" icon="person" error={errors.name?.message}>
                <input id="name" type="text" autoComplete="name" placeholder="John Doe" className="auth-input" {...register('name')} />
              </FormField>

              <FormField label="Email Address" id="email" icon="mail" error={errors.email?.message}>
                <input id="email" type="email" autoComplete="email" placeholder="you@example.com" className="auth-input" {...register('email')} />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Password" id="password" icon="lock" error={errors.password?.message}>
                  <input id="password" type="password" autoComplete="new-password" placeholder="••••••••" className="auth-input" {...register('password')} />
                </FormField>
                <FormField label="Phone" id="phoneNumber" icon="phone" error={errors.phoneNumber?.message}>
                  <input id="phoneNumber" type="tel" autoComplete="tel" placeholder="+1 555 000 0000" className="auth-input" {...register('phoneNumber')} />
                </FormField>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="terms"
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-secondary rounded focus:ring-secondary/20 flex-shrink-0 cursor-pointer"
                  {...register('terms')}
                />
                <label htmlFor="terms" className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <a href="#" className="text-secondary hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-secondary hover:underline">Privacy Policy</a>.
                </label>
              </div>
              {errors.terms && <p className="field-error text-sm">{errors.terms.message}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-secondary text-white text-sm font-semibold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-secondary/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-slate-500 dark:text-slate-500 text-sm mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-secondary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
          </div>
        </section>
      </main>
    </div>
  );
}
