import React from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Drawer, LinearProgress, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { RouteLink, usePathname } from '../components/Router';
import { TaxAssistantProvider, useTaxAssistant } from '../modules/taxAssistant/TaxAssistantContext';
import { TaxModuleLayout } from '../modules/taxAssistant/TaxModuleLayout';
import { VatWizard } from '../features/tax/VatWizard';
import { CorporateTaxWizard } from '../features/tax/CorporateTaxWizard';
import { DashboardLayout } from '../features/layouts/DashboardLayout';
import { AuthLayout } from '../features/layouts/AuthLayout';
import { PublicLandingPage } from '../features/home/PublicLandingPage';
import { AuthProvider, useAuth } from '../modules/auth/AuthContext';
import { createTaxRecord, listTaxRecords } from '../features/tax/services/taxRecordsApi';
import { calculateVat } from '../features/tax/lib/vatCalculator';
import { calculateCorporateTax } from '../features/tax/lib/corporateTaxCalculator';

const mapStep = { 'business-details': 1, input: 2, preview: 3, export: 4 } as const;
const mapTaxStep = { 'business-details': 1, input: 3, preview: 5, export: 6 } as const;

const fetchJson = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json());
const toIsoOrNull = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { navigate, pathname } = usePathname();
  React.useEffect(() => {
    if (!user) {
      const next = encodeURIComponent(pathname);
      navigate(`/login?next=${next}`);
    }
  }, [user, pathname]);
  return user ? <>{children}</> : null;
};
const GuestRoute = ({ children }: { children: React.ReactNode }) => { const { user } = useAuth(); const { navigate } = usePathname(); React.useEffect(() => { if (user) navigate('/dashboard'); }, [user]); return user ? null : <>{children}</>; };

function LoginPage() { const { navigate } = usePathname(); const { login, loading } = useAuth(); const [email, setEmail] = React.useState(''); const [password, setPassword] = React.useState(''); const [error, setError] = React.useState('');
  const redirectTo = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next && next.startsWith('/')) return next;
    return '/dashboard';
  }, []);
  const onSubmit = async (e: React.FormEvent) => { e.preventDefault(); const result = await login(email, password); if (result.ok) navigate(redirectTo); else setError(result.error || 'Login failed'); };
  return <AuthLayout><Card><CardContent><Stack component='form' spacing={2} onSubmit={onSubmit}><Typography variant='h5'>Login</Typography><TextField label='Email' value={email} onChange={(e) => setEmail(e.target.value)} required /><TextField label='Password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} required />{error && <Alert severity='error'>{error}</Alert>}<Button type='submit' variant='contained' disabled={loading}>Login</Button><Button onClick={() => navigate('/register')}>Create account</Button></Stack></CardContent></Card></AuthLayout>; }
function RegisterPage() { const { navigate } = usePathname(); const { register, loading } = useAuth(); const [form, setForm] = React.useState({ fullName: '', email: '', password: '', confirmPassword: '' }); const [msg, setMsg] = React.useState(''); const [error, setError] = React.useState('');
  const onSubmit = async (e: React.FormEvent) => { e.preventDefault(); const result = await register(form); if (result.ok) { setMsg('Registration successful'); navigate('/dashboard'); } else setError(result.error || 'Registration failed'); };
  return <AuthLayout><Card><CardContent><Stack component='form' spacing={2} onSubmit={onSubmit}><Typography variant='h5'>Register</Typography><TextField label='Full name' value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /><TextField label='Email' value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /><TextField label='Password' type='password' value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /><TextField label='Confirm Password' type='password' value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />{msg && <Alert severity='success'>{msg}</Alert>}{error && <Alert severity='error'>{error}</Alert>}<Button type='submit' variant='contained' disabled={loading}>Create account</Button></Stack></CardContent></Card></AuthLayout>; }

const DashboardPage = React.lazy(() => import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const HistoryHubPage = React.lazy(() => import('../features/history/HistoryHubPage').then((m) => ({ default: m.HistoryHubPage })));
const RemindersPage = React.lazy(() => import('../features/reminders/RemindersPage').then((m) => ({ default: m.RemindersPage })));
const ProfilePage = React.lazy(() => import('../features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const BusinessProfilePage = React.lazy(() => import('../features/business/BusinessProfilePage').then((m) => ({ default: m.BusinessProfilePage })));

function VatHistoryPage(){return <HistoryHubPage initialTab='vat' />}
function TaxHistoryPage(){return <HistoryHubPage initialTab='tax' />}

function RoutedModules() { const { pathname, navigate } = usePathname(); const { user } = useAuth(); const { vat, setVat, ct, setCt } = useTaxAssistant(); const parts = pathname.split('/').filter(Boolean); const module = parts[0]; const step = parts[1] || ''; const guardVat = !vat.businessName || !vat.trn; const guardTax = !ct.companyName || !ct.taxRegistrationNumber || !ct.businessActivity;
  const [saveMsg, setSaveMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const handleSaveVatRecord = React.useCallback(async () => {
    try {
      const result = calculateVat(vat);
      await createTaxRecord({
        taxType: 'VAT',
        periodStart: toIsoOrNull(vat.taxPeriodStart),
        periodEnd: toIsoOrNull(vat.taxPeriodEnd),
        inputPayload: vat,
        resultPayload: result,
      });
      setSaveMsg({ type: 'success', text: 'VAT record saved successfully.' });
    } catch (e: any) {
      setSaveMsg({ type: 'error', text: e.message || 'Failed to save VAT record.' });
    }
  }, [vat]);
  const handleSaveCorporateRecord = React.useCallback(async () => {
    try {
      const result = calculateCorporateTax(ct);
      await createTaxRecord({
        taxType: 'CORPORATE',
        periodStart: toIsoOrNull(ct.financialYearStart),
        periodEnd: toIsoOrNull(ct.financialYearEnd),
        inputPayload: ct,
        resultPayload: result,
      });
      setSaveMsg({ type: 'success', text: 'Corporate tax record saved successfully.' });
    } catch (e: any) {
      setSaveMsg({ type: 'error', text: e.message || 'Failed to save corporate tax record.' });
    }
  }, [ct]);
  React.useEffect(() => { if (module === 'vat' && !step) navigate('/vat/business-details'); if (module === 'tax' && !step) navigate('/tax/business-details'); if (module === 'vat' && ['preview', 'export'].includes(step) && guardVat) navigate('/vat/business-details'); if (module === 'tax' && ['preview', 'export'].includes(step) && guardTax) navigate('/tax/business-details'); }, [pathname]);
  if (pathname === '/') return user ? <ProtectedRoute><React.Suspense fallback={<Alert severity='info'>Loading…</Alert>}><DashboardPage /></React.Suspense></ProtectedRoute> : <PublicLandingPage />;
  if (pathname.startsWith('/login')) return <GuestRoute><LoginPage /></GuestRoute>;
  if (pathname === '/register') return <GuestRoute><RegisterPage /></GuestRoute>;
  if (pathname === '/dashboard') return <ProtectedRoute><React.Suspense fallback={<Alert severity='info'>Loading…</Alert>}><DashboardPage /></React.Suspense></ProtectedRoute>;
  if (pathname === '/dashboard/profile') return <ProtectedRoute><React.Suspense fallback={<Alert severity='info'>Loading…</Alert>}><ProfilePage /></React.Suspense></ProtectedRoute>;
  if (pathname === '/dashboard/business-profile') return <ProtectedRoute><React.Suspense fallback={<Alert severity='info'>Loading…</Alert>}><BusinessProfilePage /></React.Suspense></ProtectedRoute>;
  if (pathname === '/dashboard/vat-history') return <ProtectedRoute><React.Suspense fallback={<Alert severity='info'>Loading…</Alert>}><VatHistoryPage /></React.Suspense></ProtectedRoute>;
  if (pathname === '/dashboard/tax-history') return <ProtectedRoute><React.Suspense fallback={<Alert severity='info'>Loading…</Alert>}><TaxHistoryPage /></React.Suspense></ProtectedRoute>;
  if (pathname === '/dashboard/reminders') return <ProtectedRoute><React.Suspense fallback={<Alert severity='info'>Loading…</Alert>}><RemindersPage /></React.Suspense></ProtectedRoute>;
  if (module === 'vat') return <ProtectedRoute><DashboardLayout><Stack spacing={2}>{saveMsg && <Alert severity={saveMsg.type}>{saveMsg.text}</Alert>}<VatWizard data={vat} setData={setVat} onSave={handleSaveVatRecord} forcedStep={mapStep[step as keyof typeof mapStep] || 1} navigateToStep={navigate} /></Stack></DashboardLayout></ProtectedRoute>;
  if (module === 'tax') return <ProtectedRoute><DashboardLayout><Stack spacing={2}>{saveMsg && <Alert severity={saveMsg.type}>{saveMsg.text}</Alert>}<TaxModuleLayout moduleTitle='Corporate Tax Module' basePath='/tax' currentStep={step || 'business-details'} showModuleHeader={false}><CorporateTaxWizard data={ct} setData={setCt} onSave={handleSaveCorporateRecord} forcedStep={mapTaxStep[step as keyof typeof mapTaxStep] || 1} /></TaxModuleLayout></Stack></DashboardLayout></ProtectedRoute>;
  return <DashboardLayout><Alert severity='warning'>Page not found.</Alert></DashboardLayout>; }

export default function AppRoutes() { return <AuthProvider><TaxAssistantProvider><RoutedModules /></TaxAssistantProvider></AuthProvider>; }
