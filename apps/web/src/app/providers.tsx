import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AuthProvider, OrgProvider } from '@/hooks/useAuth';
import { AICopilotProvider } from '@/features/ai/AICopilotContext';
import { NotificationProvider } from '@/features/notifications/NotificationProvider';
import { ToastManager } from '@/features/notifications/components/ToastManager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrgProvider>
          <AICopilotProvider>
            <NotificationProvider>
              <ToastManager />
              {children}
            </NotificationProvider>
          </AICopilotProvider>
        </OrgProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
