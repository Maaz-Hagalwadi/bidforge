import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/schemas';
import { authApi } from '@/api/auth';
import { FormField } from '@/components/ui/FormField';
import { Navbar } from '@/components/Navbar';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      setError('root', { message: 'Invalid or missing reset token.' });
      return;
    }
    try {
      await authApi.resetPassword(token, values.password);
      navigate('/login', { state: { passwordReset: true } });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError('root', { message: 'Cannot reach the server. Please try again.' });
        } else if (err.response.status === 400) {
          setError('root', { message: 'Reset link is invalid or has expired.' });
        } else {
          setError('root', { message: 'Something went wrong. Please try again.' });
        }
      } else {
        setError('root', { message: 'An unexpected error occurred.' });
      }
    }
  };

  return (
    <div className="bg-dark-navy antialiased flex flex-col min-h-screen">
      <Navbar variant="auth" />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-xl">
          <div>
            <h2 className="text-white text-h2 mb-sm">Reset Password</h2>
            <p className="text-on-primary-container text-body-md">
              Enter your new password below.
            </p>
          </div>

          {!token && (
            <div className="flex items-center gap-sm bg-red-500/10 border border-red-500/30 rounded-lg px-md py-sm text-red-400 text-body-sm">
              <span className="material-symbols-outlined text-base">error</span>
              Invalid or missing reset token.{' '}
              <Link to="/forgot-password" className="underline">Request a new link</Link>
            </div>
          )}

          {errors.root && (
            <p className="field-error text-center">{errors.root.message}</p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-lg" noValidate>
            <FormField label="New Password" id="password" icon="lock" error={errors.password?.message}>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="auth-input"
                {...register('password')}
              />
            </FormField>

            <FormField label="Confirm Password" id="confirmPassword" icon="lock" error={errors.confirmPassword?.message}>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="auth-input"
                {...register('confirmPassword')}
              />
            </FormField>

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full bg-secondary text-white text-label-md py-md rounded-lg hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-secondary/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
