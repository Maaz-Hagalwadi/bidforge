import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';
import type { AppNotification, NotificationType } from '@/types/notification';

const TYPE_CFG: Record<NotificationType, { icon: string; color: string }> = {
  JOB_CREATED:          { icon: 'work',          color: '#3b82f6' },
  JOB_INVITED:          { icon: 'mail',           color: '#8b5cf6' },
  BID_PLACED:           { icon: 'gavel',          color: '#f59e0b' },
  BID_ACCEPTED:         { icon: 'handshake',      color: '#10b981' },
  BID_REJECTED:         { icon: 'cancel',         color: '#ef4444' },
  CONTRACT_CREATED:     { icon: 'receipt_long',   color: '#6366f1' },
  CONTRACT_SUBMITTED:   { icon: 'upload_file',    color: '#8b5cf6' },
  CONTRACT_COMPLETED:   { icon: 'verified',       color: '#10b981' },
  REVISION_REQUESTED:   { icon: 'refresh',        color: '#f59e0b' },
  MILESTONE_CREATED:    { icon: 'add_task',       color: '#6366f1' },
  MILESTONE_FUNDED:     { icon: 'lock',           color: '#3b82f6' },
  MILESTONE_SUBMITTED:  { icon: 'upload',         color: '#f59e0b' },
  MILESTONE_APPROVED:   { icon: 'check_circle',   color: '#10b981' },
  MILESTONE_REJECTED:   { icon: 'rule',           color: '#ef4444' },
  MILESTONE_REFUNDED:   { icon: 'money_off',      color: '#6b7280' },
  PAYMENT_RELEASED:     { icon: 'payments',       color: '#10b981' },
};

function getNavPath(n: AppNotification): string {
  const id = n.referenceId;
  switch (n.type) {
    case 'JOB_CREATED':
    case 'JOB_INVITED':          return id ? `/jobs/${id}` : '/browse';
    case 'BID_PLACED':           return id ? `/client/jobs/${id}/bids` : '/client/bids';
    case 'BID_ACCEPTED':         return id ? `/contracts/${id}` : '/contracts';
    case 'BID_REJECTED':         return '/freelancer/bids';
    case 'CONTRACT_CREATED':
    case 'CONTRACT_SUBMITTED':
    case 'CONTRACT_COMPLETED':
    case 'REVISION_REQUESTED':
    case 'MILESTONE_CREATED':
    case 'MILESTONE_FUNDED':
    case 'MILESTONE_SUBMITTED':
    case 'MILESTONE_APPROVED':
    case 'MILESTONE_REJECTED':
    case 'MILESTONE_REFUNDED':
    case 'PAYMENT_RELEASED':     return id ? `/contracts/${id}` : '/contracts';
    default:                     return '/';
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationItem({
  n,
  onClickItem,
}: {
  n: AppNotification;
  onClickItem: (n: AppNotification) => void;
}) {
  const cfg = TYPE_CFG[n.type] ?? { icon: 'notifications', color: '#3b82f6' };

  return (
    <button
      onClick={() => onClickItem(n)}
      className="w-full flex gap-3 items-start px-4 py-3 hover:bg-white/5 transition-colors text-left"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: `${cfg.color}20` }}
      >
        <span className="material-symbols-outlined text-[16px]" style={{ color: cfg.color }}>
          {cfg.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm leading-tight text-white font-semibold">{n.title}</p>
          <span className="text-[10px] text-white/30 flex-shrink-0">{timeAgo(n.createdAt)}</span>
        </div>
        <p className="text-xs text-white/40 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
      </div>
      <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
    </button>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter(n => !n.read).slice(0, 20);

  async function handleClickItem(n: AppNotification) {
    setOpen(false);
    await markAsRead(n.id);
    navigate(getNavPath(n));
  }

  async function handleMarkAll() {
    await markAllAsRead();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-white/70 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[150]"
          style={{ backgroundColor: '#0d1c32' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold text-white">
              Notifications {unreadCount > 0 && <span className="text-white/40 font-normal">({unreadCount})</span>}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List — unread only */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
            {unread.length === 0 ? (
              <div className="py-10 text-center">
                <span className="material-symbols-outlined text-white/20 text-3xl block mb-2">notifications_off</span>
                <p className="text-white/30 text-sm">All caught up!</p>
              </div>
            ) : (
              unread.map(n => (
                <NotificationItem key={n.id} n={n} onClickItem={handleClickItem} />
              ))
            )}
          </div>

          {notifications.filter(n => !n.read).length > 20 && (
            <div className="px-4 py-2 border-t border-white/10 text-center text-[11px] text-white/30">
              Showing 20 of {notifications.filter(n => !n.read).length} unread
            </div>
          )}
        </div>
      )}
    </div>
  );
}
