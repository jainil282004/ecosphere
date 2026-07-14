import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  Building2,
  CheckSquare,
  ChevronDown,
  Command,
  FileDown,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Scale,
  Search,
  Shield,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { NotificationDropdown } from '@/components/ui';
import { AIAssistant } from '@/components/ui';
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth, useOrgContext, usePermissions } from '@/hooks/useAuth';
import { EcoSphereLogo, EcoSphereWordmark } from '@/components/EcoSphereLogo';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission:
    | 'view_own_gamification'
    | 'view_reports'
    | 'approve_submissions'
    | 'submit_activities'
    | 'manage_compliance'
    | 'manage_org';
  section: 'overview' | 'modules' | 'admin';
};

const navItems: NavItem[] = [
  { to: 'employee-corner', label: 'My Impact', icon: User, permission: 'view_own_gamification', section: 'overview' },
  { to: 'dashboard', label: 'Command Center', icon: LayoutDashboard, permission: 'view_reports', section: 'overview' },
  { to: 'approvals', label: 'Approvals Queue', icon: CheckSquare, permission: 'approve_submissions', section: 'overview' },
  { to: 'carbon', label: 'Environmental', icon: Sparkles, permission: 'submit_activities', section: 'modules' },
  { to: 'csr', label: 'CSR & Volunteering', icon: HeartHandshake, permission: 'submit_activities', section: 'modules' },
  { to: 'dei', label: 'Diversity & Inclusion', icon: Scale, permission: 'view_reports', section: 'modules' },
  { to: 'governance', label: 'Governance', icon: Shield, permission: 'manage_compliance', section: 'modules' },
  { to: 'gamification', label: 'Gamification', icon: Award, permission: 'view_own_gamification', section: 'modules' },
  { to: 'reports', label: 'Reports & Compliance', icon: FileDown, permission: 'view_reports', section: 'admin' },
  { to: 'admin', label: 'Administration', icon: Building2, permission: 'manage_org', section: 'admin' },
];

const SECTION_LABELS: Record<NavItem['section'], string> = {
  overview: 'Overview',
  modules: 'ESG Modules',
  admin: 'Administration',
};

function initials(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'ES';
}

export function OrgLayout() {
  const { user, logout } = useAuth();
  const { orgId, organization, organizations, setOrgId } = useOrgContext();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setSigningOut(false);
      setUserMenuOpen(false);
    }
  };

  const visibleNav = useMemo(() => navItems.filter((item) => can(item.permission)), [can]);

  const currentPage = navItems.find((item) =>
    location.pathname.endsWith(`/${item.to}`),
  );

  const grouped = useMemo(() => {
    const map = new Map<NavItem['section'], NavItem[]>();
    for (const item of visibleNav) {
      if (!map.has(item.section)) map.set(item.section, []);
      map.get(item.section)!.push(item);
    }
    return Array.from(map.entries());
  }, [visibleNav]);

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/[0.06] bg-ink-925/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
          <EcoSphereWordmark size="md" tagline="ESG Platform" animated />
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pt-5">
          <label htmlFor="org-switcher" className="label">
            Organization
          </label>
          <div className="relative">
            <select
              id="org-switcher"
              className="input"
              value={orgId ?? ''}
              onChange={(event) => {
                setOrgId(event.target.value);
                navigate(`/orgs/${event.target.value}/dashboard`);
              }}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          {organization ? (
            <p className="mt-2 truncate text-xs text-slate-500">
              {organization.industry} · {organization.country}
            </p>
          ) : null}
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-4 pb-6">
          {grouped.map(([section, items]) => (
            <div key={section} className="space-y-1">
              <p className="nav-group-label">{SECTION_LABELS[section]}</p>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={`/orgs/${orgId}/${item.to}`}
                    className={({ isActive }) =>
                      clsx('nav-item', isActive && 'nav-item-active')
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 transition group-hover:text-brand-300" aria-hidden />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] px-4 py-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.02] p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-gradient font-display text-sm font-bold text-white">
              {initials(user?.firstName, user?.lastName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Main column */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-surface-950/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-10">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile mini-logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <EcoSphereLogo size="sm" />
            </div>

            <nav aria-label="breadcrumb" className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
              <span className="truncate text-slate-500">{organization?.name ?? 'EcoSphere'}</span>
              <span className="text-slate-700">/</span>
              <span className="truncate font-medium text-slate-100">
                {currentPage?.label ?? 'Overview'}
              </span>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              {/* Live ESG chip */}
              <div className="hidden items-center gap-2 rounded-xl border border-brand-400/25 bg-brand-500/[0.08] px-3 py-1.5 text-xs md:flex">
                <Sparkles className="h-3.5 w-3.5 text-brand-300" />
                <span className="font-semibold uppercase tracking-wider text-slate-400">ESG</span>
                <span className="num font-bold text-white">72.4</span>
                <span className="text-brand-300">▲ 1.2%</span>
              </div>

              {/* Command palette hint */}
              <button
                type="button"
                className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition hover:border-brand-400/40 hover:text-slate-200 md:flex"
                aria-label="Open command palette"
              >
                <Search className="h-3.5 w-3.5" />
                Search
                <span className="ml-2 flex items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                  <Command className="h-2.5 w-2.5" /> K
                </span>
              </button>
            </div>
            <div className="flex items-center gap-2 pr-4 lg:pr-8">
              {orgId && <NotificationDropdown orgId={orgId} />}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3 text-sm text-slate-200 hover:border-brand-400/40 hover:text-white"
                  onClick={() => setUserMenuOpen((open) => !open)}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-gradient text-xs font-bold text-white ring-2 ring-accent-400/30">
                    {initials(user?.firstName, user?.lastName)}
                  </span>
                  <span className="hidden font-medium sm:inline">{user?.firstName}</span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>
                {userMenuOpen ? (
                  <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/95 shadow-panel backdrop-blur-xl">
                    <div className="border-b border-white/[0.06] px-4 py-3">
                      <p className="text-sm font-semibold text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/[0.04] hover:text-white border-b border-white/[0.06]"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate(`/orgs/${orgId}/settings`);
                      }}
                    >
                      <User className="h-4 w-4" />
                      Account Settings
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
                      disabled={signingOut}
                      onClick={() => void handleSignOut()}
                    >
                      <LogOut className="h-4 w-4" />
                      {signingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
        {orgId && <AIAssistant />}
      </div>
    </div>
  );
}

export function AdminLayout() {
  return <OrgLayout />;
}

export function EmployeeLayout() {
  return <OrgLayout />;
}
