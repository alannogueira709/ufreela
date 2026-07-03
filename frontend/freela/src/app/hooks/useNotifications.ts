'use client';

import { useState, useEffect, useCallback } from 'react';
import { Notification, NotificationFilter } from '@/types/notification';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationApi,
} from '@/lib/notification-service';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchNotifications();
      setNotifications(data.results);
    } catch {
      setError('Não foi possível carregar as notificações.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Polling a cada 30s para notificações em tempo real
  // Substitua por WebSocket se preferir (Django Channels)
  useEffect(() => {
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await markNotificationRead(id);
    } catch {
      // Rollback em caso de erro
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const previous = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      setNotifications(previous);
    }
  }, [notifications]);

  const removeNotification = useCallback(async (id: string) => {
    const previous = [...notifications];
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotificationApi(id);
    } catch {
      setNotifications(previous);
    }
  }, [notifications]);

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'proposals') return ['proposal_accepted', 'proposal_rejected', 'job_invitation'].includes(n.type);
    if (filter === 'messages') return n.type === 'new_message';
    if (filter === 'payments') return n.type === 'payment_received';
    return true;
  });

  return {
    notifications: filtered,
    allNotifications: notifications,
    unreadCount,
    isLoading,
    error,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refresh: load,
  };
}
