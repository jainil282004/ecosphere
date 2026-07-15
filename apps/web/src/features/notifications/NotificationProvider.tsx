import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth, useOrgContext } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  socket: Socket | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user || !organization) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to the WebSocket Gateway
    const newSocket = io(import.meta.env.VITE_API_URL + '/notifications', {
      auth: {
        userId: user.id,
        orgId: organization.id,
      },
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification gateway');
    });

    newSocket.on('notification.new', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    newSocket.on('notification.announcement', (announcement: any) => {
      // In a real app we might map this to a notification model
      console.log('Received announcement:', announcement);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, organization]);

  // Initial fetch for existing notifications
  useEffect(() => {
    if (user && organization) {
      fetch(`${import.meta.env.VITE_API_URL}/orgs/${organization.id}/notifications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setNotifications(data);
          }
        })
        .catch(console.error);
    }
  }, [user, organization]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    
    if (organization) {
      fetch(`${import.meta.env.VITE_API_URL}/orgs/${organization.id}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }).catch(console.error);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    // In a real implementation, we would call a bulk-read endpoint
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, socket }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
