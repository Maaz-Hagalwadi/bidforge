import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

import { registerSchema, type RegisterFormValues } from '@/lib/schemas';
import { useAuth } from '@/context/AuthContext';
import { FormField } from '@/components/ui/FormField';
import { RoleSelector } from '@/components/ui/RoleSelector';
import { Navbar } from '@/components/Navbar';
import type { ApiError } from '@/types/auth';

// Professional freelancer at modern workspace
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80';

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CLIENT' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        role: values.role,
      });
      navigate('/login', { state: { registered: true } });
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

  return (
    <div className="bg-dark-navy antialiased flex flex-col h-screen overflow-hidden">
      <Navbar variant="auth" />

      {/* Main two-panel layout — fills remaining viewport height */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

        {/* Left: Branding image */}
        <section className="relative hidden md:block md:w-1/2 h-full overflow-hidden">
          <img
            alt="Professional developer working on a modern laptop"
            className="absolute inset-0 w-full h-full object-cover"
            src={HERO_IMAGE}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-navy/95 via-dark-navy/40 to-dark-navy/10" />
          <div className="absolute bottom-12 left-10 right-10 max-w-lg z-10">
            <h1 className="text-white text-h1 mb-sm leading-tight">
             Success starts here
              <br />Build your career.
            </h1>
            <p className="text-white/70 text-body-lg">
              The marketplace where elite freelancers meet sophisticated clients.
            </p>
          </div>
        </section>

        {/* Right: Form — scrollable only if viewport is tiny */}
        <section className="w-full md:w-1/2 bg-dark-navy flex items-center justify-center px-8 md:px-14 overflow-y-auto">
          <div className="w-full max-w-md py-4">

            <div className="mb-md">
              <h2 className="text-white text-h2 mb-xs">Create Account</h2>
              <p className="text-on-primary-container text-body-sm">
                Start your professional journey with BidForge today.
              </p>
            </div>

            {/* Role selector */}
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <RoleSelector value={field.value} onChange={field.onChange} />
              )}
            />

            {errors.root && (
              <p className="field-error text-center mt-xs">{errors.root.message}</p>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-md mt-md" noValidate>
              {/* Full Name */}
              <FormField label="Full Name" id="name" icon="person" error={errors.name?.message}>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  className="auth-input"
                  {...register('name')}
                />
              </FormField>

              {/* Email */}
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

              {/* Password + Phone side by side */}
              <div className="grid grid-cols-2 gap-md">
                <FormField label="Password" id="password" icon="lock" error={errors.password?.message}>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="auth-input"
                    {...register('password')}
                  />
                </FormField>
                <FormField label="Phone" id="phoneNumber" icon="phone" error={errors.phoneNumber?.message}>
                  <input
                    id="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 555 000 0000"
                    className="auth-input"
                    {...register('phoneNumber')}
                  />
                </FormField>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-sm">
                <input
                  id="terms"
                  type="checkbox"
                  className="mt-1 bg-slate-900 border-slate-800 text-secondary rounded focus:ring-secondary/20 flex-shrink-0"
                  {...register('terms')}
                />
                <p className="text-slate-400 text-body-sm">
                  I agree to the{' '}
                  <a href="#" className="text-secondary hover:underline">Terms</a>{' '}
                  and{' '}
                  <a href="#" className="text-secondary hover:underline">Privacy Policy</a>.
                </p>
              </div>
              {errors.terms && <p className="field-error">{errors.terms.message}</p>}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-secondary text-white text-label-md py-md rounded-lg hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-secondary/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Account…' : 'Create Account'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-md">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-label-sm uppercase tracking-widest">
                <span className="bg-dark-navy px-md text-slate-500">Or continue with</span>
              </div>
            </div>

            {/* Google */}
            <button
              type="button"
              disabled
              title="Google sign-up coming soon"
              className="w-full bg-white text-slate-900 text-label-md py-sm rounded-lg flex items-center justify-center gap-md hover:bg-slate-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign up with Google
            </button>

            <p className="text-center text-slate-500 text-body-sm mt-md">
              Already have an account?{' '}
              <Link to="/login" className="text-secondary text-label-md hover:underline">
                Log In
              </Link>
            </p>

          </div>
        </section>
      </main>

    </div>
  );
}
