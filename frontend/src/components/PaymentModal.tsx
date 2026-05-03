import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { milestonesApi } from '@/api/milestones';
import type { MilestoneResponse } from '@/types/milestone';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      color: '#1b1b1d',
      '::placeholder': { color: '#75777e' },
    },
    invalid: { color: '#ba1a1a' },
  },
};

interface PaymentFormProps {
  milestone: MilestoneResponse;
  clientSecret: string;
  onSuccess: () => void;
  onClose: () => void;
}

function PaymentForm({ milestone, clientSecret, onSuccess, onClose }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const formatCurrency = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setCardError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      setCardError(error.message ?? 'Card payment failed.');
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status !== 'succeeded') {
      setCardError('Payment was not completed. Please try again.');
      setProcessing(false);
      return;
    }

    try {
      await milestonesApi.fundMilestone(milestone.id, paymentIntent.id);
      onSuccess();
    } catch {
      setCardError('Payment succeeded but server verification failed. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">

      <div className="flex items-center justify-between p-4 bg-secondary/5 border border-secondary/20 rounded-xl">
        <div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Milestone Amount</p>
          <p className="text-sm font-bold text-on-surface mt-0.5">{milestone.title}</p>
        </div>
        <p className="text-xl font-bold text-secondary">{formatCurrency(milestone.amount)}</p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          Card Details
        </label>
        <div className="px-3 py-3.5 border border-outline-variant rounded-lg bg-white focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="text-xs text-on-surface-variant">
          Test card: <span className="font-mono font-semibold">4242 4242 4242 4242</span> · any future date · any CVC
        </p>
      </div>

      {cardError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="material-symbols-outlined text-red-500 text-[18px] flex-shrink-0">error</span>
          <p className="text-sm text-red-600">{cardError}</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <span className="material-symbols-outlined text-[14px]">lock</span>
        Secured by Stripe. Your card details never touch our servers.
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={processing || !stripe}
          className="flex-1 py-2.5 bg-secondary text-white text-sm font-bold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              Processing…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">lock</span>
              Pay {formatCurrency(milestone.amount)}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

interface PaymentModalProps {
  milestone: MilestoneResponse;
  onSuccess: () => void;
  onClose: () => void;
}

export function PaymentModal({ milestone, onSuccess, onClose }: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(true);

  useEffect(() => {
    milestonesApi
      .createPaymentIntent(milestone.id)
      .then(data => setClientSecret(data.clientSecret))
      .catch(() => setLoadError('Unable to initialise payment. Please try again.'))
      .finally(() => setLoadingIntent(false));
  }, [milestone.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between px-6 py-4"
          style={{ backgroundColor: '#0A192F' }}
        >
          <div>
            <h2 className="text-base font-bold text-white">Fund Escrow</h2>
            <p className="text-xs text-white/60 mt-0.5">Payment secured until milestone is approved</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white transition-colors flex-shrink-0 mt-0.5"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loadingIntent ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <span className="material-symbols-outlined text-secondary text-[32px] animate-spin">progress_activity</span>
            <p className="text-sm text-on-surface-variant font-medium">Preparing secure payment…</p>
          </div>
        ) : loadError ? (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-red-400 text-[40px]">error</span>
            <p className="text-sm text-red-600 font-semibold">{loadError}</p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-secondary text-white text-sm font-bold rounded-lg hover:brightness-110 transition-all"
            >
              Close
            </button>
          </div>
        ) : clientSecret ? (
          <Elements stripe={stripePromise}>
            <PaymentForm
              milestone={milestone}
              clientSecret={clientSecret}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        ) : null}
      </div>
    </div>
  );
}
