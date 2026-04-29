import { useState } from 'react';
import { jobsApi } from '@/api/jobs';
import type { BidResponse } from '@/types/job';

interface Props {
  jobId: string;
  onSuccess: (bid: BidResponse) => void;
  onClose: () => void;
}

export function PlaceBidModal({ jobId, onSuccess, onClose }: Props) {
  const [amount, setAmount] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [proposal, setProposal] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    const amt = Number(amount);
    const days = Number(deliveryDays);
    if (!amount || isNaN(amt) || amt <= 0) e.amount = 'Enter a valid amount greater than 0.';
    if (!deliveryDays || isNaN(days) || days <= 0 || !Number.isInteger(days)) e.deliveryDays = 'Enter a valid number of days.';
    if (!proposal.trim()) e.proposal = 'Proposal is required.';
    else if (proposal.trim().length > 1000) e.proposal = 'Proposal cannot exceed 1000 characters.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setServerError('');
    setSubmitting(true);
    try {
      const bid = await jobsApi.createBid(jobId, {
        amount: Number(amount),
        deliveryDays: Number(deliveryDays),
        proposal: proposal.trim(),
      });
      onSuccess(bid);
    } catch (err: unknown) {
      const resp = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
      if (resp?.status === 403) {
        setServerError('You must accept the invite before placing a bid on this job.');
      } else if (resp?.data?.message?.toLowerCase().includes('already')) {
        setServerError('You have already placed a bid on this job.');
      } else if (resp?.status === 400) {
        setServerError('This job is no longer accepting bids.');
      } else {
        setServerError('Failed to place bid. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-outline-variant">
          <div>
            <h2 className="text-base font-bold text-on-surface">Place a Bid</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">Submit your proposal for this job.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Submitting overlay */}
        {submitting && (
          <div className="absolute inset-0 bg-white/70 rounded-2xl flex flex-col items-center justify-center gap-3 z-10">
            <span className="material-symbols-outlined text-secondary text-4xl animate-spin">progress_activity</span>
            <p className="text-sm font-semibold text-on-surface-variant">Submitting your bid…</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Bid Amount ($)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 500"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors ${errors.amount ? 'border-red-400' : 'border-outline-variant'}`}
              />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Delivery Days
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={deliveryDays}
                onChange={e => setDeliveryDays(e.target.value)}
                placeholder="e.g. 7"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors ${errors.deliveryDays ? 'border-red-400' : 'border-outline-variant'}`}
              />
              {errors.deliveryDays && <p className="text-xs text-red-500">{errors.deliveryDays}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Proposal
              </label>
              <span className="text-xs text-on-surface-variant">{proposal.length}/1000</span>
            </div>
            <textarea
              value={proposal}
              onChange={e => setProposal(e.target.value)}
              rows={5}
              maxLength={1000}
              placeholder="Describe your approach, relevant experience, and why you're the best fit…"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors resize-none ${errors.proposal ? 'border-red-400' : 'border-outline-variant'}`}
            />
            {errors.proposal && <p className="text-xs text-red-500">{errors.proposal}</p>}
          </div>

          {serverError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="material-symbols-outlined text-red-500 text-[18px] flex-shrink-0">error</span>
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
