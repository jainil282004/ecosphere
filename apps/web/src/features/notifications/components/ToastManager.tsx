import { useEffect, useState } from 'react';
import { useNotifications, Notification } from '../NotificationProvider';
import { Toast } from './Toast';

export function ToastManager() {
  const { socket } = useNotifications();
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      setActiveToasts((prev) => [...prev, notification]);
    };

    socket.on('notification.new', handleNewNotification);

    return () => {
      socket.off('notification.new', handleNewNotification);
    };
  }, [socket]);

  const removeToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((toast) => toast.id !== id));
    // Optional: Mark as read when closed via toast
    // markAsRead(id); 
  };

  if (activeToasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-50 flex items-end px-4 py-6 sm:items-start sm:p-6"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        {activeToasts.map((toast) => (
          <Toast
            key={toast.id}
            notification={toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </div>
  );
}
