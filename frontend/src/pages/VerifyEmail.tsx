import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Navbar } from '@/components/Navbar';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-navy flex flex-col">
      <Navbar variant="auth" />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-white rounded-2xl shadow-xl max-w-md w-full p-10 text-center">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-5" />
              <p className="text-slate-600 text-base">Verifying your email…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Email Verified!</h2>
              <p className="text-slate-500 text-sm mb-6">Your account is now active. You can log in and start using BidForge.</p>
              <Link to="/login"
                className="inline-block w-full py-3 bg-secondary text-white font-semibold rounded-xl hover:brightness-110 transition-all">
                Go to Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-red-400 text-4xl">error</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Verification Failed</h2>
              <p className="text-slate-500 text-sm mb-6">This link is invalid or has already been used. Request a new one from the login page.</p>
              <Link to="/login"
                className="inline-block w-full py-3 bg-secondary text-white font-semibold rounded-xl hover:brightness-110 transition-all">
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
