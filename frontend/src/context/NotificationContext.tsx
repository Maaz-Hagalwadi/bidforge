import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '@/context/AuthContext';
import { notificationsApi } from '@/api/notifications';
import type { AppNotification, NotificationToast } from '@/types/notification';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  toasts: NotificationToast[];
  dismissToast: (toastId: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function playChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // AudioContext blocked — no sound
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const stompRef = useRef<Client | null>(null);

  const addToast = useCallback((notification: AppNotification) => {
    const toastId = `${notification.id}-${Date.now()}`;
    setToasts(prev => [{ toastId, notification }, ...prev].slice(0, 3));
    playChime();
  }, []);

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  }, []);

  // Load initial notifications from REST
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    notificationsApi.getAll().then(data => {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }).catch(() => {});
  }, [isAuthenticated]);

  // STOMP connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = sessionStorage.getItem('accessToken');
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/notifications', (frame) => {
          const notification: AppNotification = JSON.parse(frame.body);
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          addToast(notification);
        });

        client.subscribe('/user/queue/notification-count', (frame) => {
          setUnreadCount(Number(frame.body));
        });
      },
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
      stompRef.current = null;
    };
  }, [isAuthenticated, user, addToast]);

  const markAsRead = useCallback(async (id: string) => {
    await notificationsApi.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationsApi.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, toasts, dismissToast, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within <NotificationProvider>');
  return ctx;
}
