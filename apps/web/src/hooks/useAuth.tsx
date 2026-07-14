import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { AuthSession, OrganizationSummary, Permission, Role } from '@ecosphere/shared';

import { apiClient, unwrapJsonApiResource } from '@/lib/api-client';

import { queryKeys } from '@/lib/query-keys';



type MeUser = AuthSession['user'] & {

  roles: Array<{

    id: string;

    role: Role;

    organizationId: string | null;

    departmentId: string | null;

  }>;

  permissions: Permission[];

};



interface AuthContextValue {

  user: MeUser | null;

  permissions: Permission[];

  isAuthenticated: boolean;

  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;

  register: (data: { firstName: string; lastName: string; email: string; password: string; organizationSlug: string }) => Promise<void>;

  logout: () => Promise<void>;

}



const AuthContext = createContext<AuthContextValue | null>(null);



export function AuthProvider({ children }: { children: ReactNode }) {

  const queryClient = useQueryClient();

  const [tokenReady, setTokenReady] = useState(false);



  const meQuery = useQuery({

    queryKey: queryKeys.auth.me,

    queryFn: async () => {
      try {
        const response = await apiClient<{ data: { id: string; attributes: MeUser } }>('/auth/me');
        return unwrapJsonApiResource<MeUser>(response);
      } catch (error) {
        // Any auth error (401, network error, etc.) → not authenticated
        return null;
      }
    },

    retry: false,

    staleTime: 60_000,

  });



  useEffect(() => {

    if (!meQuery.isLoading) {

      setTokenReady(true);

    }

  }, [meQuery.isLoading]);



  const value = useMemo<AuthContextValue>(

    () => ({

      user: meQuery.data ?? null,

      permissions: meQuery.data?.permissions ?? [],

      isAuthenticated: Boolean(meQuery.data),

      isLoading: meQuery.isLoading || !tokenReady,

      login: async (email: string, password: string) => {
        const response = await apiClient<{ data: { id: string; attributes: MeUser } }>(
          '/auth/login',
          {
            method: 'POST',
            body: { email, password },
            skipAuthRefresh: true,
          },
        );

        queryClient.setQueryData(queryKeys.auth.me, unwrapJsonApiResource<MeUser>(response));
        await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      },

      register: async (data: { firstName: string; lastName: string; email: string; password: string; organizationSlug: string }) => {
        const response = await apiClient<{ data: { id: string; attributes: MeUser } }>(
          '/auth/register',
          {
            method: 'POST',
            body: data,
            skipAuthRefresh: true,
          },
        );

        queryClient.setQueryData(queryKeys.auth.me, unwrapJsonApiResource<MeUser>(response));
        await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      },

      logout: async () => {
        try {
          await apiClient('/auth/logout', { method: 'POST', skipAuthRefresh: true });
        } catch {
          // Clear local session even if the network call fails.
        } finally {
          localStorage.removeItem('ecosphere_org_id');
          queryClient.setQueryData(queryKeys.auth.me, null);
          queryClient.removeQueries({ queryKey: queryKeys.auth.me });
          queryClient.clear();
        }
      },

    }),

    [meQuery.data, meQuery.isLoading, queryClient, tokenReady],

  );



  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

}



export function useAuth() {

  const context = useContext(AuthContext);

  if (!context) {

    throw new Error('useAuth must be used within AuthProvider');

  }

  return context;

}



interface OrgContextValue {

  orgId: string | null;

  organization: OrganizationSummary | null;

  organizations: OrganizationSummary[];

  setOrgId: (orgId: string) => void;

  isLoading: boolean;

}



const OrgContext = createContext<OrgContextValue | null>(null);



export function OrgProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [orgId, setOrgIdState] = useState<string | null>(
    localStorage.getItem('ecosphere_org_id'),
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setOrgIdState(null);
      localStorage.removeItem('ecosphere_org_id');
    }
  }, [isAuthenticated]);



  const orgsQuery = useQuery({

    queryKey: queryKeys.organizations.all,

    queryFn: () => apiClient<OrganizationSummary[]>('/organizations'),

    enabled: isAuthenticated,

  });



  const orgDetailQuery = useQuery({

    queryKey: orgId ? queryKeys.organizations.detail(orgId) : ['organizations', 'none'],

    queryFn: () => apiClient<OrganizationSummary>(`/organizations/${orgId}`),

    enabled: Boolean(orgId && isAuthenticated),

  });



  const setOrgId = (nextOrgId: string) => {

    setOrgIdState(nextOrgId);

    localStorage.setItem('ecosphere_org_id', nextOrgId);

    queryClient.removeQueries({

      predicate: (query) => query.queryKey[0] === 'org',

    });

  };



  const value = useMemo<OrgContextValue>(

    () => ({

      orgId,

      organization: orgDetailQuery.data ?? null,

      organizations: orgsQuery.data ?? [],

      setOrgId,

      isLoading: orgsQuery.isLoading,

    }),

    [orgId, orgDetailQuery.data, orgsQuery.data, orgsQuery.isLoading],

  );



  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;

}



export function useOrgContext() {

  const context = useContext(OrgContext);

  if (!context) {

    throw new Error('useOrgContext must be used within OrgProvider');

  }

  return context;

}



export function usePermissions() {

  const { permissions } = useAuth();

  return {

    permissions,

    can: (permission: Permission) => permissions.includes(permission),

  };

}


