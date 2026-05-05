import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import axios from 'axios';

import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/schemas';
import { authApi } from '@/api/auth';
import { FormField } from '@/components/ui/FormField';
import { Navbar } from '@/components/Navbar';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await authApi.forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setError('root', { message: 'Cannot reach the server. Please try again.' });
      } else {
        setError('root', { message: 'Something went wrong. Please try again.' });
      }
    }
  };

  return (
    <div className="bg-dark-navy antialiased flex flex-col min-h-screen">
      <Navbar variant="auth" />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-xl">
          <div>
            <h2 className="text-white text-h2 mb-sm">Forgot Password</h2>
            <p className="text-on-primary-container text-body-md">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {sent ? (
            <div className="flex items-center gap-sm bg-green-500/10 border border-green-500/30 rounded-lg px-md py-sm text-green-400 text-body-sm">
              <span className="material-symbols-outlined text-base">check_circle</span>
              Check your email for a password reset link.
            </div>
          ) : (
            <>
              {errors.root && (
                <p className="field-error text-center">{errors.root.message}</p>
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-secondary text-white text-label-md py-md rounded-lg hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-secondary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-slate-500 text-body-sm">
            <Link to="/login" className="text-secondary text-label-md hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
