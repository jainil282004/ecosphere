
import { useNotifications } from './NotificationProvider';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, Settings, Trash2, Filter } from 'lucide-react';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Notification Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage and view all your organization's alerts and updates.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </button>
          <button className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            <Settings className="mr-2 h-4 w-4" />
            Preferences
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div className="flex space-x-4">
            <button className="text-sm font-medium text-indigo-600 dark:text-brand-400">
              All ({notifications.length})
            </button>
            <button className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              Unread ({unreadCount})
            </button>
          </div>
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="text-sm font-medium text-slate-500 hover:text-indigo-600 disabled:opacity-50 dark:text-slate-400 dark:hover:text-brand-400"
          >
            Mark all as read
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">You're all caught up!</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No new notifications at this time.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`p-6 transition hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                  !notification.isRead ? 'bg-indigo-50/30 dark:bg-brand-900/10' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                      <Bell className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${!notification.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {notification.title}
                      </p>
                      <time className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </time>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {notification.body}
                    </p>
                    <div className="mt-3 flex space-x-3">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Mark as read
                        </button>
                      )}
                      <button className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400">
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
