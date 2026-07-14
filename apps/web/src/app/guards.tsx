import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, useOrgContext } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/ui';

export function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function PublicOnlyGuard() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function OrgScopeGuard() {
  const { orgId, organizations, setOrgId, isLoading } = useOrgContext();
  const paramOrgId = window.location.pathname.split('/orgs/')[1]?.split('/')[0];

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (organizations.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-lg text-center">
          <h1 className="text-2xl font-bold text-white">No organizations available</h1>
          <p className="mt-3 text-slate-400">
            Contact your platform administrator to be assigned to an organization.
          </p>
        </div>
      </div>
    );
  }

  const firstOrganization = organizations[0];
  const resolvedOrgId =
    paramOrgId && organizations.some((org) => org.id === paramOrgId)
      ? paramOrgId
      : orgId ?? firstOrganization?.id;

  if (resolvedOrgId && resolvedOrgId !== orgId) {
    setOrgId(resolvedOrgId);
  }

  return <Outlet />;
}
