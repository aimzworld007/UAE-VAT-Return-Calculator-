import React from 'react';
import {
  AppBar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Toolbar,
  Typography,
  Button,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  Link,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import LoginIcon from '@mui/icons-material/Login';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import DescriptionIcon from '@mui/icons-material/Description';
import PolicyIcon from '@mui/icons-material/Policy';
import GavelIcon from '@mui/icons-material/Gavel';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { VatWizard } from './VatWizard';
import { CorporateTaxWizard } from './CorporateTaxWizard';
import { draftStorage } from './lib/localDraftStorage';
import { buildMonthlyEntries, calculateVat } from './lib/vatCalculator';
import { calculateCorporateTax } from './lib/corporateTaxCalculator';
import { money, TaxSummaryCard, WorkspaceHeader } from './components/common.jsx';
import { TaxModuleCard } from './components/TaxModuleCard';
import { InstallAppPrompt } from '../../components/InstallAppPrompt';
import { formatVatPeriodLabel, inferSelectionFromDates, getPeriodFromSelection } from './lib/vatPeriod';
import { VAT_PRICING_MODES, normalizeVatPricingMode } from './lib/vatPricing';

const currentYear = new Date().getFullYear();
const workspaceSettingsDefault = { vatPricingMode: VAT_PRICING_MODES.INCLUSIVE };
const vatDefault = { businessName: '', trn: '', businessLocationEmirate: '', filingFrequency: 'Quarterly', filingYear: currentYear, filingMonth: 'January', filingQuarter: 'Q1', filingStartMonth: 'January', taxPeriodStart: '', taxPeriodEnd: '', standardRatedSales: 0, zeroRatedSales: 0, exemptSales: 0, standardRatedPurchases: 0, recoverableInputVat: 0, nonRecoverableVat: 0, previousAdjustment: 0, badDebtRelief: 0, adjustmentNotes: '', monthlyEntries: [], vatPricingMode: workspaceSettingsDefault.vatPricingMode };
const ctDefault = { companyName: '', taxRegistrationNumber: '', financialYearStart: '', financialYearEnd: '', businessActivity: '', businessLocationEmirate: '', revenue: 0, otherIncome: 0, exemptIncome: 0, directExpenses: 0, adminExpenses: 0, nonDeductibleExpenses: 0, accountingProfit: 0, addBackAdjustments: 0, deductibleAdjustments: 0 };

const navLinks = [
  { label: 'FTA Login', href: 'https://eservices.tax.gov.ae/#/Logon', icon: <LoginIcon fontSize='small' /> },
  { label: 'VAT Guide', href: 'https://tax.gov.ae/en/taxes/Vat/vat.topics.aspx', icon: <ReceiptLongIcon fontSize='small' /> },
  { label: 'Corporate Tax', href: 'https://tax.gov.ae/en/taxes/corporate.tax/corporate.tax.topics.aspx', icon: <AccountBalanceIcon fontSize='small' /> },
  { label: 'Help Center', href: 'https://www.youtube.com/@uaetax', icon: <PlayCircleIcon fontSize='small' /> },
];
const legalLinks = [
  { label: 'Documentation', href: '/documentation', icon: <DescriptionIcon fontSize='small' /> },
  { label: 'Privacy Policy', href: '/privacy-policy', icon: <PolicyIcon fontSize='small' /> },
  { label: 'Terms & Conditions', href: '/terms', icon: <GavelIcon fontSize='small' /> },
];
const drawerLinks = [...navLinks, ...legalLinks, { label: 'Support', href: 'https://ecashbiz.com/landing', icon: <SupportAgentIcon fontSize='small' /> }];
const featureChips = ['Guided workflow', 'Live summaries', 'Export options'];

// ...existing helper fns unchanged
const getVatStatus = (n) => {
  if (n > 0) return { label: 'VAT Payable', chipColor: 'error', amount: money(n), badge: 'PAYABLE', variant: 'danger' };
  if (n < 0) return { label: 'VAT Refundable', chipColor: 'success', amount: money(Math.abs(n)), badge: 'REFUNDABLE', variant: 'success' };
  return { label: 'VAT Result', chipColor: 'default', amount: money(0), badge: 'ZERO', variant: 'neutral' };
};
const normalizeVatDraft = (input, workspaceSettings) => { const merged = { ...vatDefault, ...input, vatPricingMode: normalizeVatPricingMode(input?.vatPricingMode || workspaceSettings.vatPricingMode) }; const selection = inferSelectionFromDates(merged); const period = getPeriodFromSelection(selection); const next = { ...merged, ...selection, ...period }; next.monthlyEntries = buildMonthlyEntries(next); return next; };

function Header({ onOpenDrawer, onGoHome }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  return <AppBar position='sticky' color='inherit' elevation={0} sx={{ borderBottom: '1px solid #E5EAF2', backgroundColor: 'rgba(255,255,255,0.98)', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}><Toolbar sx={{ justifyContent: 'space-between', py: 0.5, minHeight: 58, px: { xs: 1, sm: 2 } }}><IconButton onClick={onOpenDrawer}><MenuIcon /></IconButton><IconButton aria-label='Go to homepage' onClick={onGoHome} sx={{ p: 0.25 }}><Box component='img' src='/logo.png' alt='logo' sx={{ width: { xs: 146, sm: 190 }, maxWidth: '50vw', height: 34, objectFit: 'contain' }} /></IconButton><Box sx={{ width: 40, display: 'flex', justifyContent: 'flex-end' }}><IconButton size='small'><NotificationsNoneRoundedIcon fontSize='small' /></IconButton></Box>
    {isDesktop && <Stack direction='row' spacing={1} alignItems='center' sx={{ ml: 2 }}>{navLinks.map((l) => <Button key={l.label} href={l.href} target='_blank' variant='outlined' startIcon={l.icon} size='small' sx={{ borderRadius: 3, textTransform: 'none', minHeight: 36 }}>{l.label}</Button>)}<Button variant='outlined' startIcon={<FolderOpenIcon fontSize='small' />} size='small' sx={{ borderRadius: 3, textTransform: 'none' }}>Workspace</Button><IconButton size='small'><AccountCircleOutlinedIcon fontSize='small' /></IconButton></Stack>}
  </Toolbar></AppBar>;
}

const ResourceButton = ({ icon, label, href }) => <Card component='a' href={href} elevation={0} sx={{ textDecoration: 'none', p: 1.5, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', color: '#0f172a', minWidth: 0 }}><Box sx={{ color: '#2563eb', mr: 1 }}>{icon}</Box><Typography sx={{ fontWeight: 600, fontSize: '.9rem', flex: 1 }}>{label}</Typography><ChevronRightRoundedIcon sx={{ color: '#64748b' }} /></Card>;

function LiveSummary({ mode, vatData, vatCalc, ctCalc }) { if (mode === 'corporateTax') return <Card><CardContent><Typography variant='h6' sx={{ mb: 2 }}>Corporate Tax Live Summary</Typography><Grid container spacing={2}><Grid size={{ xs: 12, md: 3 }}><TaxSummaryCard label='Corporate Tax Estimate' value={money(ctCalc.taxPayable)} /></Grid><Grid size={{ xs: 12, md: 3 }}><TaxSummaryCard label='Taxable Income' value={money(ctCalc.taxableIncome)} /></Grid><Grid size={{ xs: 12, md: 3 }}><TaxSummaryCard label='Profit Before Tax' value={money(ctCalc.profitBeforeTax)} /></Grid><Grid size={{ xs: 12, md: 3 }}><TaxSummaryCard label='Selected Tax Period' value={formatVatPeriodLabel(vatData)} /></Grid></Grid></CardContent></Card>; const [label, color, amt] = getVatStatus(vatCalc.netVat); return <Card><CardContent><Typography variant='h6' sx={{ mb: 2 }}>VAT Live Summary</Typography><Grid container spacing={2}><Grid size={{ xs: 12, md: 4 }}><TaxSummaryCard label={label} value={amt} /><Chip label={label.includes('Refundable') ? 'REFUNDABLE' : label.includes('Payable') ? 'PAYABLE' : 'BALANCED'} color={color} sx={{ mt: 1 }} /></Grid><Grid size={{ xs: 12, md: 4 }}><TaxSummaryCard label='VAT Taxable Sales' value={money(vatCalc.salesBreakdown.net)} /></Grid><Grid size={{ xs: 12, md: 4 }}><TaxSummaryCard label='Selected VAT Period' value={formatVatPeriodLabel(vatData)} /></Grid></Grid></CardContent></Card>; }
// keep other components unchanged...
function CompactKpiCard({ icon, label, value, extra, variant = 'neutral' }) { const iconColor = variant === 'danger' ? '#dc2626' : variant === 'success' ? '#16a34a' : '#2563eb'; return <Card sx={{ borderRadius: 4, boxShadow: '0 4px 16px rgba(15,23,42,.06)', minWidth: { xs: '100%', sm: 180 }, border: '1px solid #dbe6f3', background: '#fff' }}><CardContent sx={{ py: 0.9, px: 1.1, '&:last-child': { pb: 0.9 } }}><Stack direction='row' spacing={1} alignItems='center'><Box sx={{ color: iconColor, display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 999, bgcolor: '#eaf1ff' }}>{icon}</Box><Box sx={{ minWidth: 0 }}><Typography variant='caption' sx={{ display: 'block', lineHeight: 1.15, color: '#64748b', fontSize: '0.72rem' }}>{label}</Typography><Typography variant='body2' sx={{ fontWeight: 800, lineHeight: 1.25, color: '#071832' }}>{value}</Typography></Box>{extra && <Box sx={{ ml: 'auto' }}>{extra}</Box>}</Stack></CardContent></Card>; }
function VatHeaderKpis({ vatData, vatCalc }) { const vatStatus = getVatStatus(vatCalc.netVat); return <Box sx={{ width: '100%' }}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(170px, 1fr))' }, gap: 1, width: '100%', maxWidth: { lg: 760 }, mx: { lg: 'auto' } }}><CompactKpiCard icon={<PaidOutlinedIcon fontSize='small' />} label={vatStatus.label} value={vatStatus.amount} variant={vatStatus.variant} extra={<Chip label={vatStatus.badge} color={vatStatus.chipColor} size='small' sx={{ height: 22, fontWeight: 700, fontSize: '0.65rem', ...(vatStatus.badge === 'PAYABLE' ? { backgroundColor: '#fee2e2', color: '#b91c1c' } : {}), ...(vatStatus.badge === 'REFUNDABLE' ? { backgroundColor: '#dcfce7', color: '#166534' } : {}), ...(vatStatus.badge === 'ZERO' ? { backgroundColor: '#ecfdf5', color: '#15803d' } : {}) }} />} /><CompactKpiCard icon={<TrendingUpOutlinedIcon fontSize='small' />} label='VAT Taxable Sales' value={money(vatCalc.salesBreakdown.net)} /><CompactKpiCard icon={<CalendarMonthOutlinedIcon fontSize='small' />} label='Selected VAT Period' value={formatVatPeriodLabel(vatData)} /></Box></Box>; }

export function TaxDashboard() {
  const [m, setM] = React.useState('home');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [ws] = React.useState(() => ({ ...workspaceSettingsDefault, ...draftStorage.load('workspaceSettings', workspaceSettingsDefault), vatPricingMode: normalizeVatPricingMode(draftStorage.load('workspaceSettings', workspaceSettingsDefault).vatPricingMode) }));
  const [vat, setVat] = React.useState(() => normalizeVatDraft(draftStorage.load('vatDraft', vatDefault), ws));
  const [ct, setCt] = React.useState(() => draftStorage.load('ctDraft', ctDefault));
  const [vp, setVp] = React.useState(20); const [cp, setCp] = React.useState(17);
  const v = calculateVat(vat), c = calculateCorporateTax(ct);
  return <Box sx={{ minHeight: { md: '100vh' }, pb: { xs: 10.5, md: 0 }, background: 'linear-gradient(180deg, #eef4ff 0%, #F6F8FB 180px, #F6F8FB 100%)' }}><Header onOpenDrawer={() => setDrawerOpen(true)} onGoHome={() => setM('home')} />
    <Drawer anchor='left' open={drawerOpen} onClose={() => setDrawerOpen(false)}><Box sx={{ width: 300, py: 1 }}><List>{drawerLinks.map((l) => <ListItemButton key={l.label} component='a' href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined}><ListItemIcon>{l.icon}</ListItemIcon><ListItemText primary={l.label} /></ListItemButton>)}</List></Box></Drawer>
    <Container maxWidth={false} sx={{ maxWidth: 900, pt: { xs: 2, md: 3 }, pb: { xs: 1.25, md: 2 }, px: { xs: 2, sm: 3 } }}>
      {m === 'home' && <Stack spacing={2}><InstallAppPrompt /><Box><Typography variant='body2' sx={{ color: '#475569', fontWeight: 600, mb: 0.5 }}>Welcome back!</Typography><Typography component='h1' sx={{ color: '#0f172a', fontWeight: 800, fontSize: { xs: '2rem', sm: '2.125rem' }, lineHeight: 1.1 }}>UAE VAT & Tax Assistant</Typography></Box><Card sx={{ borderRadius: '18px', border: '1px solid #E5EAF2', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)', backgroundColor: '#fff' }}><CardContent sx={{ p: 2.25 }}><Stack direction='row' spacing={1.5} alignItems='center' justifyContent='space-between' sx={{ overflow: 'hidden' }}><Box sx={{ minWidth: 0, flex: 1 }}><Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>Your all-in-one workspace for FTA compliance</Typography><Typography variant='body2' sx={{ color: '#64748b' }}>Create, manage, and file your returns and taxes with ease.</Typography></Box><img src='/dashboard-hero-illustration.svg?v=2' alt='FTA VAT and Tax Assistant' className='dashboardHeroImage' /></Stack></CardContent></Card>
<Card sx={{ borderRadius: '18px', border: '1px solid #E5EAF2', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)', backgroundColor: '#fff' }}><CardContent sx={{ p: 2.25 }}><Typography component='h2' sx={{ mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.65rem' }, fontWeight: 800, lineHeight: 1.2 }}>Choose a tax module</Typography><Typography sx={{ mb: 2, color: '#64748b', fontSize: '0.95rem' }}>Launch a guided workspace with saved drafts, live summaries, and export options.</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2, maxWidth: '100%' }}><TaxModuleCard title='FTA VAT Return' subtitle='Prepare VAT returns with guided period and transaction workflows.' image='/FTA_VAT_RETRUN.png' route='vat' onSelect={setM} chips={featureChips} /><TaxModuleCard title='FTA Corporate Tax' subtitle='Estimate corporate tax and organize annual filing data quickly.' image='/FTA_CORPORATE_TAX.png' route='corporateTax' onSelect={setM} chips={featureChips} /></Box></CardContent></Card>
<Card sx={{ borderRadius: '18px', border: '1px solid #E5EAF2', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)', backgroundColor: '#fff' }}><CardContent sx={{ p: 2.25 }}><Typography variant='h6' sx={{ mb: 1 }}>Support & Resources</Typography><Grid container spacing={1.2}>{legalLinks.map((link) => <Grid key={link.label} size={{ xs: 12, sm: 4 }}><ResourceButton href={link.href} label={link.label} icon={link.icon} /></Grid>)}</Grid></CardContent></Card></Stack>}
      {m === 'vat' && <Stack spacing={2.2}><WorkspaceHeader title='VAT Return Workspace' progress={vp} centerContent={<VatHeaderKpis vatData={vat} vatCalc={v} />} /><VatWizard data={vat} setData={setVat} onProgressChange={setVp} onSave={() => draftStorage.save('vatDraft', vat)} onReset={() => { const next = normalizeVatDraft(vatDefault, ws); setVat(next); draftStorage.clear('vatDraft'); }} /></Stack>}
      {m === 'corporateTax' && <Stack spacing={2.2}><WorkspaceHeader title='Corporate Tax Workspace' progress={cp} /><LiveSummary mode='corporateTax' vatData={vat} vatCalc={v} ctCalc={c} /><CorporateTaxWizard data={ct} setData={setCt} onProgressChange={setCp} onSave={() => draftStorage.save('ctDraft', ct)} onReset={() => { setCt(ctDefault); draftStorage.clear('ctDraft'); }} /></Stack>}
    </Container>
    <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', bottom: 10, left: 12, right: 12, zIndex: 1200 }}>
      <BottomNavigation showLabels value={m} sx={{ borderRadius: '20px', border: '1px solid #E5EAF2', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)', backgroundColor: '#fff', '& .MuiBottomNavigationAction-root': { color: '#64748b', minWidth: 0 }, '& .Mui-selected': { color: '#2563eb' } }} onChange={(_, value) => { if (value === 'menu') { setDrawerOpen(true); return; } if (value === 'help') { setM('home'); window.open('https://www.youtube.com/@uaetax', '_blank'); return; } setM(value); }}>
        <BottomNavigationAction label='Home' value='home' icon={<HomeRoundedIcon />} />
        <BottomNavigationAction label='VAT' value='vat' icon={<ReceiptLongIcon />} />
        <BottomNavigationAction label='Tax' value='corporateTax' icon={<AccountBalanceIcon />} />
        <BottomNavigationAction label='Help' value='help' icon={<HelpOutlineIcon />} />
        <BottomNavigationAction label='More' value='menu' icon={<MoreHorizIcon />} />
      </BottomNavigation>
    </Box>
  </Box>;
}
