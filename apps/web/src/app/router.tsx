import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthGuard, OrgScopeGuard, PublicOnlyGuard } from '@/app/guards';
import { OrgLayout } from '@/app/layouts/OrgLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ApprovalsPage } from '@/features/approvals/ApprovalsPage';
import { CsrPage } from '@/features/csr/CsrPage';
import { CarbonPage } from '@/features/carbon/CarbonPage';
import { DeiPage } from '@/features/social/DeiPage';
import { GovernancePage } from '@/features/governance/GovernancePage';
import { GamificationPage } from '@/features/gamification/GamificationPage';
import { EmployeeCornerPage } from '@/features/employee/EmployeeCornerPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { AdminPage } from '@/features/admin/AdminPage';
import { AccountSettingsPage } from '@/features/auth/AccountSettingsPage';
import { useAuth, useOrgContext, usePermissions } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/ui';

function HomeRedirect() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { organizations, orgId, isLoading: isOrgLoading } = useOrgContext();
  const { can } = usePermissions();

  if (isAuthLoading || (isAuthenticated && isOrgLoading)) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const targetOrgId = orgId ?? organizations[0]?.id;
  if (targetOrgId) {
    const defaultRoute =
      can('view_reports') ? 'dashboard' : 'employee-corner';
    return <Navigate to={`/orgs/${targetOrgId}/${defaultRoute}`} replace />;
  }

  // Only redirect to login if we truly have no org after everything is loaded
  return <Navigate to="/login" replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route element={<PublicOnlyGuard />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<AuthGuard />}>
          <Route element={<OrgScopeGuard />}>
            <Route path="/orgs/:orgId" element={<OrgLayout />}>
              <Route index element={<Navigate to="employee-corner" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="employee-corner" element={<EmployeeCornerPage />} />
              <Route path="approvals" element={<ApprovalsPage />} />
              <Route path="csr" element={<CsrPage />} />
              <Route path="carbon" element={<CarbonPage />} />
              <Route path="dei" element={<DeiPage />} />
              <Route path="governance" element={<GovernancePage />} />
              <Route path="gamification" element={<GamificationPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="settings" element={<AccountSettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
