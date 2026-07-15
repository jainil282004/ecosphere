import { useEffect, useState } from 'react';
import { X, Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { Notification } from '../NotificationProvider';

interface ToastProps {
  notification: Notification;
  onClose: (id: string) => void;
  autoCloseDelay?: number;
}

export function Toast({ notification, onClose, autoCloseDelay = 5000 }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseDelay);

    return () => clearTimeout(timer);
  }, [autoCloseDelay]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(notification.id), 300); // Wait for animation
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'alert':
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-indigo-500" />;
    }
  };

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-300 ease-in-out dark:bg-slate-800 dark:ring-white/10 ${
        isClosing ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {notification.title}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {notification.body}
            </p>
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-slate-800 dark:hover:text-slate-300"
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
