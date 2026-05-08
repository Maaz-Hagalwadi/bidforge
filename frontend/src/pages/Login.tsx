import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { authApi } from '@/api/auth';

import {
  loginSchema, type LoginFormValues,
  otpEmailSchema, type OtpEmailFormValues,
  otpCodeSchema, type OtpCodeFormValues,
} from '@/lib/schemas';
import { useAuth } from '@/context/AuthContext';
import { FormField } from '@/components/ui/FormField';
import { BidForgeLoader } from '@/components/ui/BidForgeLoader';
import { Navbar } from '@/components/Navbar';
import type { ApiError } from '@/types/auth';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80';

type Mode = 'password' | 'otp';
type OtpStep = 'email' | 'code';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithOtp, loginWithGoogle } = useAuth();

  const justRegistered = (location.state as { registered?: boolean; passwordReset?: boolean } | null)?.registered === true;
  const passwordReset = (location.state as { registered?: boolean; passwordReset?: boolean } | null)?.passwordReset === true;

  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);

  const [googlePending, setGooglePending] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [showRolePicker, setShowRolePicker] = useState(false);

  const [mode, setMode] = useState<Mode>('password');
  const [otpStep, setOtpStep] = useState<OtpStep>('email');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpResent, setOtpResent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    await authApi.resendVerification(unverifiedEmail).catch(() => {});
    setResendSent(true);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setOtpStep('email');
    setOtpEmail('');
    setOtpResent(false);
    setResendCooldown(0);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    passwordForm.clearErrors();
    otpEmailForm.clearErrors();
    otpCodeForm.clearErrors();
  };

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  // --- Password form ---
  const passwordForm = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = passwordForm;

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const loggedInUser = await login(values);
      const dest = loggedInUser.role === 'CLIENT' ? '/client/dashboard' : '/freelancer/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiErr = err.response?.data as ApiError;
        if (!err.response) {
          setError('root', { message: 'Cannot reach the server. Please wait a moment and try again.' });
        } else if (apiErr?.error === 'EMAIL_NOT_VERIFIED') {
          setUnverifiedEmail(values.email);
          setResendSent(false);
          setError('root', { message: apiErr.message });
        } else if (err.response.status === 401) {
          setError('root', { message: 'Invalid email or password.' });
        } else {
          setError('root', { message: apiErr?.message ?? 'Login failed. Please try again.' });
        }
      } else {
        setError('root', { message: 'An unexpected error occurred. Please try again.' });
      }
    }
  };

  // --- OTP email form ---
  const otpEmailForm = useForm<OtpEmailFormValues>({ resolver: zodResolver(otpEmailSchema) });

  const onSendOtp = async (values: OtpEmailFormValues) => {
    try {
      await authApi.sendOtp(values.email);
      setOtpEmail(values.email);
      setOtpResent(false);
      setOtpStep('code');
      startCooldown();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiErr = err.response?.data as ApiError;
        if (!err.response) {
          otpEmailForm.setError('root', { message: 'Cannot reach the server. Please try again.' });
        } else if (err.response.status === 404) {
          otpEmailForm.setError('email', { message: 'No account found with this email.' });
        } else if (err.response.status === 429 || apiErr?.error === 'OTP_RATE_LIMIT') {
          otpEmailForm.setError('root', { message: 'Please wait 1 minute before requesting another code.' });
        } else {
          otpEmailForm.setError('root', { message: apiErr?.message ?? 'Failed to send OTP. Please try again.' });
        }
      } else {
        otpEmailForm.setError('root', { message: 'An unexpected error occurred.' });
      }
    }
  };

  // --- OTP code form ---
  const otpCodeForm = useForm<OtpCodeFormValues>({ resolver: zodResolver(otpCodeSchema) });

  const onVerifyOtp = async (values: OtpCodeFormValues) => {
    try {
      const { token } = await authApi.verifyOtp(otpEmail, values.otp);
      const loggedInUser = await loginWithOtp(token);
      const dest = loggedInUser.role === 'CLIENT' ? '/client/dashboard' : '/freelancer/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiErr = err.response?.data as ApiError;
        if (!err.response) {
          otpCodeForm.setError('root', { message: 'Cannot reach the server. Please try again.' });
        } else if (apiErr?.error === 'OTP_EXPIRED') {
          otpCodeForm.setError('otp', { message: 'Code expired. Please request a new one.' });
        } else if (apiErr?.error === 'OTP_ALREADY_USED') {
          otpCodeForm.setError('otp', { message: 'Code already used. Please request a new one.' });
        } else if (apiErr?.error === 'INVALID_OTP') {
          otpCodeForm.setError('otp', { message: 'Invalid code. Please check and try again.' });
        } else {
          otpCodeForm.setError('root', { message: apiErr?.message ?? 'Verification failed. Please try again.' });
        }
      } else {
        otpCodeForm.setError('root', { message: 'An unexpected error occurred.' });
      }
    }
  };

  const googleOAuth = useGoogleLogin({
    onSuccess: (tokenResponse) => handleGoogleSuccess(tokenResponse.access_token),
    onError: () => setGoogleError('Google sign-in was cancelled or failed.'),
  });

  const handleGoogleSuccess = async (accessToken: string) => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const loggedInUser = await loginWithGoogle(accessToken);
      const dest = loggedInUser.role === 'CLIENT' ? '/client/dashboard' : '/freelancer/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiErr = err.response?.data as ApiError;
        if (err.response?.status === 409 && apiErr?.error === 'ROLE_REQUIRED') {
          setGooglePending(accessToken);
          setShowRolePicker(true);
        } else if (apiErr?.error === 'INVALID_GOOGLE_TOKEN') {
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

  const handleRoleSelect = async (role: 'CLIENT' | 'FREELANCER') => {
    if (!googlePending) return;
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const loggedInUser = await loginWithGoogle(googlePending!, role);
      const dest = loggedInUser.role === 'CLIENT' ? '/client/dashboard' : '/freelancer/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiErr = err.response?.data as ApiError;
        setGoogleError(apiErr?.message ?? 'Could not complete sign-in. Please try again.');
      } else {
        setGoogleError('An unexpected error occurred.');
      }
      setShowRolePicker(false);
      setGooglePending(null);
    } finally {
      setGoogleLoading(false);
    }
  };

  const onResendOtp = async () => {
    try {
      await authApi.sendOtp(otpEmail);
      setOtpResent(true);
      otpCodeForm.clearErrors();
      otpCodeForm.reset();
      startCooldown();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiErr = err.response?.data as ApiError;
        otpCodeForm.setError('root', {
          message: apiErr?.message ?? 'Please wait before requesting another code.',
        });
      }
    }
  };

  const anyLoading = isSubmitting || otpEmailForm.formState.isSubmitting || otpCodeForm.formState.isSubmitting || googleLoading;

  return (
    <div className="bg-dark-navy antialiased flex flex-col h-screen overflow-hidden">
      {anyLoading && <BidForgeLoader message={googleLoading ? 'Signing in with Google…' : isSubmitting ? 'Signing in…' : otpCodeForm.formState.isSubmitting ? 'Verifying…' : 'Sending code…'} />}

      {/* Role picker modal — shown when a new Google user has no role yet */}
      {showRolePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-primary-container rounded-2xl border border-slate-700 p-8 max-w-sm w-full space-y-6 shadow-2xl">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-secondary text-3xl">manage_accounts</span>
              </div>
              <h3 className="text-white text-h3">One last step</h3>
              <p className="text-slate-400 text-body-sm mt-1">How will you use BidForge?</p>
            </div>
            <div className="grid grid-cols-2 gap-md">
              {(['CLIENT', 'FREELANCER'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={googleLoading}
                  onClick={() => handleRoleSelect(r)}
                  className="flex flex-col items-center gap-3 py-lg px-md rounded-xl border-2 border-slate-700 bg-slate-900/60 text-slate-300 hover:border-secondary hover:text-white hover:bg-secondary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-4xl">
                    {r === 'CLIENT' ? 'person_search' : 'work'}
                  </span>
                  <div>
                    <p className="text-label-md">{r === 'CLIENT' ? 'Client' : 'Freelancer'}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{r === 'CLIENT' ? 'Hire talent' : 'Find work'}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { setShowRolePicker(false); setGooglePending(null); setGoogleError(null); }}
              className="w-full text-slate-500 hover:text-slate-300 text-body-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Navbar variant="auth" />

      <main className="flex-1 w-full flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left: Branding */}
        <section className="relative w-full md:w-1/2 h-[45vh] md:h-full overflow-hidden flex-shrink-0 md:flex-shrink">
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
        <section className="w-full md:w-1/2 bg-dark-navy flex items-center justify-center p-8 md:p-16 overflow-y-auto flex-1 min-h-0">
          <div className="w-full max-w-md space-y-xl py-4 md:py-8">
            <div className="text-center md:text-left">
              <h2 className="text-white text-h2 mb-sm">Welcome Back</h2>
              <p className="text-on-primary-container text-body-md">
                Sign in to continue to BidForge.
              </p>
            </div>

            {/* Success banners */}
            {passwordReset && (
              <div className="flex items-center gap-sm bg-green-500/10 border border-green-500/30 rounded-lg px-md py-sm text-green-400 text-body-sm">
                <span className="material-symbols-outlined text-base">check_circle</span>
                Password reset! Please log in with your new password.
              </div>
            )}
            {justRegistered && (
              <div className="flex items-center gap-sm bg-green-500/10 border border-green-500/30 rounded-lg px-md py-sm text-green-400 text-body-sm">
                <span className="material-symbols-outlined text-base">check_circle</span>
                Account created! Please log in.
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex rounded-lg overflow-hidden border border-slate-700">
              <button
                type="button"
                onClick={() => switchMode('password')}
                className={`flex-1 py-sm text-label-sm transition-colors ${
                  mode === 'password'
                    ? 'bg-secondary text-white'
                    : 'bg-transparent text-slate-400 hover:text-white'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => switchMode('otp')}
                className={`flex-1 py-sm text-label-sm transition-colors ${
                  mode === 'otp'
                    ? 'bg-secondary text-white'
                    : 'bg-transparent text-slate-400 hover:text-white'
                }`}
              >
                Email OTP
              </button>
            </div>

            {/* ── Password mode ── */}
            {mode === 'password' && (
              <>
                {errors.root && !unverifiedEmail && (
                  <p className="field-error text-center">{errors.root.message}</p>
                )}
                {unverifiedEmail && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-amber-300 text-sm">
                    <p className="font-semibold mb-1">Email not verified</p>
                    <p className="text-amber-400/80 text-xs mb-2">Please verify your email address before logging in.</p>
                    {resendSent ? (
                      <p className="text-green-400 text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Verification email resent. Check your inbox.
                      </p>
                    ) : (
                      <button onClick={handleResend} className="text-xs underline text-amber-300 hover:text-white transition-colors">
                        Resend verification email
                      </button>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-lg" noValidate>
                  <FormField label="Email Address" id="email" icon="mail" error={errors.email?.message}>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="john@example.com"
                      className="auth-input"
                      {...register('email')}
                    />
                  </FormField>

                  <FormField label="Password" id="password" icon="lock" error={errors.password?.message}>
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
                    <Link to="/forgot-password" className="text-secondary text-body-sm hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-secondary text-white text-label-md py-md rounded-lg hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-secondary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Signing In…' : 'Sign In'}
                  </button>
                </form>
              </>
            )}

            {/* ── OTP mode ── */}
            {mode === 'otp' && (
              <>
                {/* Step 1: enter email */}
                {otpStep === 'email' && (
                  <>
                    {otpEmailForm.formState.errors.root && (
                      <p className="field-error text-center">{otpEmailForm.formState.errors.root.message}</p>
                    )}
                    <form onSubmit={otpEmailForm.handleSubmit(onSendOtp)} className="space-y-lg" noValidate>
                      <FormField
                        label="Email Address"
                        id="otp-email"
                        icon="mail"
                        error={otpEmailForm.formState.errors.email?.message}
                      >
                        <input
                          id="otp-email"
                          type="email"
                          autoComplete="email"
                          placeholder="john@example.com"
                          className="auth-input"
                          {...otpEmailForm.register('email')}
                        />
                      </FormField>

                      <button
                        type="submit"
                        disabled={otpEmailForm.formState.isSubmitting}
                        className="w-full bg-secondary text-white text-label-md py-md rounded-lg hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-secondary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {otpEmailForm.formState.isSubmitting ? 'Sending…' : 'Send One-Time Code'}
                      </button>
                    </form>
                  </>
                )}

                {/* Step 2: enter OTP code */}
                {otpStep === 'code' && (
                  <>
                    <div className="flex items-start gap-sm bg-secondary/10 border border-secondary/30 rounded-lg px-md py-sm">
                      <span className="material-symbols-outlined text-secondary text-base mt-0.5">mark_email_read</span>
                      <p className="text-slate-300 text-body-sm">
                        A 6-digit code was sent to <span className="text-white font-medium">{otpEmail}</span>. It expires in 5 minutes.
                      </p>
                    </div>

                    {otpResent && (
                      <div className="flex items-center gap-sm bg-green-500/10 border border-green-500/30 rounded-lg px-md py-sm text-green-400 text-body-sm">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        New code sent. Check your inbox.
                      </div>
                    )}

                    {otpCodeForm.formState.errors.root && (
                      <p className="field-error text-center">{otpCodeForm.formState.errors.root.message}</p>
                    )}

                    <form onSubmit={otpCodeForm.handleSubmit(onVerifyOtp)} className="space-y-lg" noValidate>
                      <FormField
                        label="One-Time Code"
                        id="otp-code"
                        icon="pin"
                        error={otpCodeForm.formState.errors.otp?.message}
                      >
                        <input
                          id="otp-code"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="123456"
                          maxLength={6}
                          className="auth-input tracking-widest text-center text-lg"
                          {...otpCodeForm.register('otp')}
                        />
                      </FormField>

                      <button
                        type="submit"
                        disabled={otpCodeForm.formState.isSubmitting}
                        className="w-full bg-secondary text-white text-label-md py-md rounded-lg hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-secondary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {otpCodeForm.formState.isSubmitting ? 'Verifying…' : 'Verify & Sign In'}
                      </button>
                    </form>

                    <div className="flex items-center justify-between text-body-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep('email');
                          otpCodeForm.reset();
                          setOtpResent(false);
                          setResendCooldown(0);
                          if (cooldownRef.current) clearInterval(cooldownRef.current);
                        }}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        Change email
                      </button>
                      <button
                        type="button"
                        onClick={onResendOtp}
                        disabled={resendCooldown > 0}
                        className="text-white hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                      >
                        {resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : 'Resend code'}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Google Sign-In */}
            <div className="relative my-md">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-label-sm uppercase tracking-widest">
                <span className="bg-dark-navy px-md text-slate-500">Or continue with</span>
              </div>
            </div>

            {googleError && (
              <p className="field-error text-center">{googleError}</p>
            )}

            <button
              type="button"
              onClick={() => googleOAuth()}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-[11px] px-lg rounded-lg border border-slate-600/70 bg-slate-800/40 hover:bg-slate-700/50 text-white text-label-md transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? 'Connecting…' : 'Continue with Google'}
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
    </div>
  );
}
