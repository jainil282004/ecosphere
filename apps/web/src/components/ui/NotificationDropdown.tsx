import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { queryKeys } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';
import type { NotificationRecord } from '@ecosphere/shared';

export function NotificationDropdown({ orgId }: { orgId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: queryKeys.notifications(orgId),
    queryFn: () => apiClient<NotificationRecord[]>(`/orgs/${orgId}/notifications`),
    refetchInterval: 15000, // Poll every 15 seconds to feel "live"
    enabled: Boolean(orgId),
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiClient(`/orgs/${orgId}/notifications/${notificationId}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications(orgId) });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="relative rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-300 hover:border-brand-400/40 hover:text-white"
        aria-label="Notifications"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400 ring-2 ring-surface-950"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/95 shadow-panel backdrop-blur-xl z-50">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-brand-400/10 px-2 py-0.5 text-xs font-medium text-brand-400">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                You're all caught up! No notifications.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex gap-3 p-4 transition ${
                      !notification.isRead ? 'bg-white/[0.02]' : 'opacity-70'
                    }`}
                  >
                    <div className="mt-0.5 text-brand-400">
                      <Info className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-white">{notification.title}</p>
                      <p className="text-xs text-slate-400">{notification.body}</p>
                      <p className="text-[10px] text-slate-500">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        type="button"
                        className="text-slate-500 hover:text-white"
                        title="Mark as read"
                        onClick={() => markReadMutation.mutate(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
