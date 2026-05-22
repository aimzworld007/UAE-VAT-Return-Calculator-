import React from 'react';
import { Alert, Button, Card, CardContent, LinearProgress, Stack, TextField, Typography } from '@mui/material';
import { usePathname } from '../components/Router';
import { TaxAssistantProvider, useTaxAssistant } from '../modules/taxAssistant/TaxAssistantContext';
import { TaxModuleLayout } from '../modules/taxAssistant/TaxModuleLayout';
import { VatWizard } from '../features/tax/VatWizard';
import { CorporateTaxWizard } from '../features/tax/CorporateTaxWizard';
import { DashboardLayout } from '../features/layouts/DashboardLayout';
import { AuthLayout } from '../features/layouts/AuthLayout';
import { PublicLandingPage } from '../features/home/PublicLandingPage';
import { AuthProvider, useAuth } from '../modules/auth/AuthContext';
import { createTaxRecord } from '../features/tax/services/taxRecordsApi';
import { calculateVat } from '../features/tax/lib/vatCalculator';
import { calculateCorporateTax } from '../features/tax/lib/corporateTaxCalculator';

const DashboardPage = React.lazy(() => import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProfilePage = React.lazy(() => import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const BusinessProfilePage = React.lazy(() => import('../pages/BusinessProfilePage').then((m) => ({ default: m.BusinessProfilePage })));
const VatHistoryPage = React.lazy(() => import('../pages/VatHistoryPage').then((m) => ({ default: m.VatHistoryPage })));
const CorporateTaxHistoryPage = React.lazy(() => import('../pages/CorporateTaxHistoryPage').then((m) => ({ default: m.CorporateTaxHistoryPage })));
const VatHistoryDetailPage = React.lazy(() => import('../pages/VatHistoryDetailPage').then((m) => ({ default: m.VatHistoryDetailPage })));
const CorporateTaxHistoryDetailPage = React.lazy(() => import('../pages/CorporateTaxHistoryDetailPage').then((m) => ({ default: m.CorporateTaxHistoryDetailPage })));
const RemindersPage = React.lazy(() => import('../pages/RemindersPage').then((m) => ({ default: m.RemindersPage })));

const AdminDashboardPage = React.lazy(() => import('../pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = React.lazy(() => import('../pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminSmtpPage = React.lazy(() => import('../pages/admin/AdminSmtpPage').then((m) => ({ default: m.AdminSmtpPage })));
const AdminAuditPage = React.lazy(() => import('../pages/admin/AdminAuditPage').then((m) => ({ default: m.AdminAuditPage })));

const mapVatStep = {
  details: 1,
  'business-details': 1,
  input: 2,
  preview: 3,
  export: 4,
} as const;

const mapTaxStep = {
  details: 1,
  'business-details': 1,
  input: 2,
  preview: 3,
  export: 4,
} as const;

function toIsoOrNull(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function Guarded({ children, superadminOnly = false }: { children: React.ReactNode; superadminOnly?: boolean }) {
  const { user, loading } = useAuth();
  const { navigate, pathname } = usePathname();

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = encodeURIComponent(pathname);
      navigate(`/login?next=${next}`);
      return;
    }
    if (superadminOnly && String(user.role || '').toLowerCase() !== 'superadmin') {
      navigate('/dashboard');
    }
  }, [loading, user, superadminOnly, navigate, pathname]);

  if (loading) return <LinearProgress />;
  if (!user) return null;
  if (superadminOnly && String(user.role || '').toLowerCase() !== 'superadmin') return null;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { navigate } = usePathname();

  React.useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [loading, user, navigate]);

  if (loading) return <LinearProgress />;
  return user ? null : <>{children}</>;
}

function LoginPage() {
  const { navigate } = usePathname();
  const { login, loading } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const redirectTo = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next && next.startsWith('/')) return next;
    return '/dashboard';
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await login(email, password);
    if (result.ok) navigate(redirectTo);
    else setError(result.error || 'Login failed');
  };

  return (
    <AuthLayout>
      <Card>
        <CardContent>
          <Stack component='form' spacing={2} onSubmit={onSubmit}>
            <Typography variant='h5'>Login</Typography>
            <TextField label='Email' value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField label='Password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <Alert severity='error'>{error}</Alert>}
            <Button type='submit' variant='contained' disabled={loading}>Login</Button>
            <Button onClick={() => navigate('/register')}>Create account</Button>
          </Stack>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

function RegisterPage() {
  const { navigate } = usePathname();
  const { register, loading } = useAuth();
  const [form, setForm] = React.useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = React.useState('');

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await register(form);
    if (result.ok) navigate('/dashboard');
    else setError(result.error || 'Registration failed');
  };

  return (
    <AuthLayout>
      <Card>
        <CardContent>
          <Stack component='form' spacing={2} onSubmit={onSubmit}>
            <Typography variant='h5'>Register</Typography>
            <TextField label='Full name' value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} required />
            <TextField label='Email' value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
            <TextField label='Password' type='password' value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} required />
            <TextField label='Confirm Password' type='password' value={form.confirmPassword} onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} required />
            {error && <Alert severity='error'>{error}</Alert>}
            <Button type='submit' variant='contained' disabled={loading}>Create account</Button>
          </Stack>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <React.Suspense fallback={<Alert severity='info'>Loading…</Alert>}>{children}</React.Suspense>;
}

function RoutedModules() {
  const { pathname, navigate } = usePathname();
  const { user } = useAuth();
  const { vat, setVat, ct, setCt } = useTaxAssistant();

  const normalizedAliases: Record<string, string> = {
    '/vat': '/vat/details',
    '/tax': '/tax/details',
    '/dashboard/profile': '/profile',
    '/dashboard/business-profile': '/business-profile',
    '/dashboard/vat-history': '/vat/history',
    '/dashboard/tax-history': '/tax/history',
    '/dashboard/reminders': '/reminders',
    '/vat/business-details': '/vat/details',
    '/tax/business-details': '/tax/details',
  };

  React.useEffect(() => {
    const next = normalizedAliases[pathname];
    if (next) navigate(next);
  }, [pathname, navigate]);

  const vatParts = pathname.startsWith('/vat/') ? pathname.split('/').filter(Boolean) : [];
  const taxParts = pathname.startsWith('/tax/') ? pathname.split('/').filter(Boolean) : [];

  const vatStep = vatParts[1] as keyof typeof mapVatStep;
  const taxStep = taxParts[1] as keyof typeof mapTaxStep;

  const vatHistoryMatch = pathname.match(/^\/vat\/history\/([^/]+)$/);
  const taxHistoryMatch = pathname.match(/^\/tax\/history\/([^/]+)$/);

  const handleSaveVatRecord = React.useCallback(async () => {
    await createTaxRecord({
      taxType: 'VAT',
      periodStart: toIsoOrNull(vat.taxPeriodStart),
      periodEnd: toIsoOrNull(vat.taxPeriodEnd),
      inputPayload: vat,
      resultPayload: calculateVat(vat),
    });
  }, [vat]);

  const handleSaveTaxRecord = React.useCallback(async () => {
    await createTaxRecord({
      taxType: 'CORPORATE',
      periodStart: toIsoOrNull(ct.financialYearStart),
      periodEnd: toIsoOrNull(ct.financialYearEnd),
      inputPayload: ct,
      resultPayload: calculateCorporateTax(ct),
    });
  }, [ct]);

  if (pathname === '/') {
    return user ? (
      <Guarded>
        <LazyPage><DashboardPage /></LazyPage>
      </Guarded>
    ) : (
      <PublicLandingPage />
    );
  }

  if (pathname.startsWith('/login')) return <GuestOnly><LoginPage /></GuestOnly>;
  if (pathname === '/register') return <GuestOnly><RegisterPage /></GuestOnly>;

  if (pathname === '/dashboard') return <Guarded><LazyPage><DashboardPage /></LazyPage></Guarded>;
  if (pathname === '/profile') return <Guarded><LazyPage><ProfilePage /></LazyPage></Guarded>;
  if (pathname === '/business-profile') return <Guarded><LazyPage><BusinessProfilePage /></LazyPage></Guarded>;

  if (pathname === '/vat/history') return <Guarded><LazyPage><VatHistoryPage /></LazyPage></Guarded>;
  if (pathname === '/tax/history') return <Guarded><LazyPage><CorporateTaxHistoryPage /></LazyPage></Guarded>;
  if (vatHistoryMatch) return <Guarded><LazyPage><VatHistoryDetailPage id={vatHistoryMatch[1]} /></LazyPage></Guarded>;
  if (taxHistoryMatch) return <Guarded><LazyPage><CorporateTaxHistoryDetailPage id={taxHistoryMatch[1]} /></LazyPage></Guarded>;

  if (pathname === '/reminders') return <Guarded><LazyPage><RemindersPage /></LazyPage></Guarded>;

  if (pathname === '/admin') return <Guarded superadminOnly><LazyPage><AdminDashboardPage /></LazyPage></Guarded>;
  if (pathname === '/admin/users') return <Guarded superadminOnly><LazyPage><AdminUsersPage /></LazyPage></Guarded>;
  if (pathname === '/admin/smtp') return <Guarded superadminOnly><LazyPage><AdminSmtpPage /></LazyPage></Guarded>;
  if (pathname === '/admin/audit') return <Guarded superadminOnly><LazyPage><AdminAuditPage /></LazyPage></Guarded>;

  if (pathname.startsWith('/vat/')) {
    const forcedStep = mapVatStep[vatStep] || 1;
    return (
      <Guarded>
        <DashboardLayout>
          <VatWizard
            data={vat}
            setData={setVat}
            onSave={handleSaveVatRecord}
            forcedStep={forcedStep}
            navigateToStep={(next) => navigate(next)}
          />
        </DashboardLayout>
      </Guarded>
    );
  }

  if (pathname.startsWith('/tax/')) {
    const forcedStep = mapTaxStep[taxStep] || 1;

    return (
      <Guarded>
        <DashboardLayout>
          <TaxModuleLayout moduleTitle='Corporate Tax Module' basePath='/tax' currentStep={taxParts[1] || 'details'} showModuleHeader={false}>
            <CorporateTaxWizard data={ct} setData={setCt} onSave={handleSaveTaxRecord} forcedStep={forcedStep} navigateToStep={(next) => navigate(next)} />
          </TaxModuleLayout>
        </DashboardLayout>
      </Guarded>
    );
  }

  return (
    <DashboardLayout>
      <Alert severity='warning'>Page not found.</Alert>
    </DashboardLayout>
  );
}

export default function AppRoutes() {
  return (
    <AuthProvider>
      <TaxAssistantProvider>
        <RoutedModules />
      </TaxAssistantProvider>
    </AuthProvider>
  );
}
