import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Settings } from 'lucide-react';
import { useNotifications, Notification } from '../NotificationProvider';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    // In a real app, this might navigate to a specific page based on entityType/entityId
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-6 w-6" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-slate-800 dark:ring-white/10 z-50 overflow-hidden flex flex-col max-h-[32rem]">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-400">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                <Bell className="mx-auto h-8 w-8 text-slate-400 mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`relative px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between space-x-3">
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${!notification.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {notification.title}
                        </p>
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                          {notification.body}
                        </p>
                      </div>
                      <time dateTime={notification.createdAt} className="flex-shrink-0 whitespace-nowrap text-xs text-slate-500">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-200 p-2 dark:border-slate-700 flex justify-between bg-slate-50 dark:bg-slate-800/50">
             <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="flex items-center px-2 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:text-indigo-400 transition-colors rounded hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Mark all read
              </button>
              <button
                className="flex items-center px-2 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <Settings className="mr-1.5 h-3.5 w-3.5" />
                Settings
              </button>
          </div>
        </div>
      )}
    </div>
  );
}
