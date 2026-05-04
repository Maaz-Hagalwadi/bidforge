import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import type { NotificationToast } from '@/types/notification';
import type { NotificationType } from '@/types/notification';

const TYPE_CFG: Record<NotificationType, { icon: string; color: string; bg: string }> = {
  JOB_CREATED:          { icon: 'work',         color: '#3b82f6', bg: '#eff6ff' },
  JOB_INVITED:          { icon: 'mail',          color: '#8b5cf6', bg: '#f5f3ff' },
  BID_PLACED:           { icon: 'gavel',         color: '#f59e0b', bg: '#fffbeb' },
  BID_ACCEPTED:         { icon: 'handshake',     color: '#10b981', bg: '#ecfdf5' },
  MILESTONE_CREATED:    { icon: 'add_task',       color: '#6366f1', bg: '#eef2ff' },
  MILESTONE_FUNDED:     { icon: 'lock',          color: '#3b82f6', bg: '#eff6ff' },
  MILESTONE_SUBMITTED:  { icon: 'upload',        color: '#f59e0b', bg: '#fffbeb' },
  MILESTONE_APPROVED:   { icon: 'check_circle',  color: '#10b981', bg: '#ecfdf5' },
  MILESTONE_REJECTED:   { icon: 'rule',          color: '#ef4444', bg: '#fef2f2' },
  MILESTONE_REFUNDED:   { icon: 'money_off',     color: '#6b7280', bg: '#f9fafb' },
  PAYMENT_RELEASED:     { icon: 'payments',      color: '#10b981', bg: '#ecfdf5' },
  CONTRACT_CREATED:     { icon: 'receipt_long',  color: '#6366f1', bg: '#eef2ff' },
  CONTRACT_SUBMITTED:   { icon: 'upload_file',   color: '#8b5cf6', bg: '#f5f3ff' },
  CONTRACT_COMPLETED:   { icon: 'verified',      color: '#10b981', bg: '#ecfdf5' },
  BID_REJECTED:         { icon: 'cancel',        color: '#ef4444', bg: '#fef2f2' },
  REVISION_REQUESTED:   { icon: 'refresh',       color: '#f59e0b', bg: '#fffbeb' },
};

const AUTO_DISMISS_MS = 5000;

function ToastItem({ toast, onDismiss }: { toast: NotificationToast; onDismiss: () => void }) {
  const cfg = TYPE_CFG[toast.notification.type] ?? { icon: 'notifications', color: '#3b82f6', bg: '#eff6ff' };
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const step = 100 / (AUTO_DISMISS_MS / 50);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p <= step) {
          clearInterval(intervalRef.current!);
          setExiting(true);
          setTimeout(onDismiss, 250);
          return 0;
        }
        return p - step;
      });
    }, 50);
    return () => clearInterval(intervalRef.current!);
  }, [onDismiss]);

  return (
    <div
      className="w-80 rounded-xl shadow-2xl overflow-hidden border border-slate-200 transition-all duration-300"
      style={{
        backgroundColor: '#fff',
        transform: exiting ? 'translateX(120%)' : 'translateX(0)',
        opacity: exiting ? 0 : 1,
        borderLeft: `4px solid ${cfg.color}`,
      }}
    >
      <div className="px-4 pt-3 pb-2 flex gap-3 items-start">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: cfg.bg }}
        >
          <span className="material-symbols-outlined text-[18px]" style={{ color: cfg.color }}>
            {cfg.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{toast.notification.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">{toast.notification.message}</p>
        </div>
        <button
          onClick={() => { setExiting(true); setTimeout(onDismiss, 250); }}
          className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-slate-100">
        <div
          className="h-full transition-none"
          style={{ width: `${progress}%`, backgroundColor: cfg.color, opacity: 0.5 }}
        />
      </div>
    </div>
  );
}

export function NotificationToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.toastId} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={() => dismissToast(toast.toastId)} />
        </div>
      ))}
    </div>
  );
}
